const hubspotApi = require('@hubspot/api-client');

const ERROR_MESSAGES = {
  SEND_CONTRACT: 'Vertrag konnte nicht versendet werden.',
  NO_API_KEY: 'eSign API-Schluessel ist nicht konfiguriert.',
  NO_BASE_URL: 'eSign-Server-URL ist nicht konfiguriert.',
  NO_TEMPLATE: 'Keine Vorlage ausgewaehlt.',
  NO_RECIPIENT:
    'Kein Empfaenger gefunden. Bitte einen Kontakt mit dem Deal verknuepfen.',
  TEMPLATE_FETCH: 'Vorlage konnte nicht geladen werden.',
};

exports.main = async (context = {}) => {
  try {
    const { templateId } = context.parameters || {};
    const dealProperties = context.propertiesToSend || {};
    const dealId = dealProperties.hs_object_id;

    if (!templateId) {
      return { statusCode: 400, body: { error: ERROR_MESSAGES.NO_TEMPLATE } };
    }

    const apiKey = process.env['ESIGN_API_KEY'];
    const baseUrl = (process.env['ESIGN_BASE_URL'] || '').replace(/\/+$/, '');

    if (!apiKey) {
      throw new Error(ERROR_MESSAGES.NO_API_KEY);
    }
    if (!baseUrl) {
      throw new Error(ERROR_MESSAGES.NO_BASE_URL);
    }

    const hubspotClient = new hubspotApi.Client({
      accessToken: process.env['PRIVATE_APP_ACCESS_TOKEN'],
    });

    const templateResponse = await fetch(
      `${baseUrl}/api/v2/template/${templateId}`,
      {
        method: 'GET',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!templateResponse.ok) {
      const text = await templateResponse.text().catch(() => '');
      throw new Error(
        `${ERROR_MESSAGES.TEMPLATE_FETCH} (${templateResponse.status}): ${text || templateResponse.statusText}`,
      );
    }

    const templateData = await templateResponse.json();
    const templateFields = templateData.fields || [];

    const mappedFields = templateFields.filter(
      (f) => f.fieldMeta && f.fieldMeta.hubspotMapping,
    );

    const requiredObjectTypes = new Set(
      mappedFields.map((f) => f.fieldMeta.hubspotMapping.objectType),
    );

    const requiredDealProps = mappedFields
      .filter((f) => f.fieldMeta.hubspotMapping.objectType === 'deals')
      .map((f) => f.fieldMeta.hubspotMapping.propertyName);

    const requiredContactProps = mappedFields
      .filter((f) => f.fieldMeta.hubspotMapping.objectType === 'contacts')
      .map((f) => f.fieldMeta.hubspotMapping.propertyName);

    const requiredCompanyProps = mappedFields
      .filter((f) => f.fieldMeta.hubspotMapping.objectType === 'companies')
      .map((f) => f.fieldMeta.hubspotMapping.propertyName);

    let fullDealProperties = dealProperties;
    let contact = null;
    let company = null;

    if (
      requiredObjectTypes.has('deals') &&
      requiredDealProps.some((p) => !(p in dealProperties))
    ) {
      try {
        const dealResponse =
          await hubspotClient.crm.deals.basicApi.getById(
            dealId,
            requiredDealProps,
          );
        fullDealProperties = {
          ...dealProperties,
          ...(dealResponse.properties || {}),
        };
      } catch (err) {
        console.error('Deal-Properties Fehler:', err.message);
      }
    }

    const contactProps = [
      'firstname',
      'lastname',
      'email',
      'company',
      ...requiredContactProps,
    ];
    contact = await getAssociatedContact(
      hubspotClient,
      dealId,
      [...new Set(contactProps)],
    );

    if (!contact || !contact.email) {
      return {
        statusCode: 400,
        body: { error: ERROR_MESSAGES.NO_RECIPIENT },
      };
    }

    if (requiredObjectTypes.has('companies')) {
      company = await getAssociatedCompany(
        hubspotClient,
        dealId,
        [...new Set(requiredCompanyProps)],
      );
    }

    const dataLookup = {
      deals: fullDealProperties,
      contacts: contact,
      companies: company || {},
    };

    const prefillFields = mappedFields
      .map((field) => {
        const mapping = field.fieldMeta.hubspotMapping;
        const sourceData = dataLookup[mapping.objectType] || {};
        const rawValue = sourceData[mapping.propertyName];

        if (rawValue === undefined || rawValue === null || rawValue === '') {
          return null;
        }

        const fieldType = field.type.toLowerCase();

        return {
          id: field.id,
          type: fieldType,
          value: String(rawValue),
        };
      })
      .filter(Boolean);

    const recipientName = [contact.firstname, contact.lastname]
      .filter(Boolean)
      .join(' ');

    const response = await fetch(`${baseUrl}/api/v2/template/use`, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId: Number(templateId),
        recipients: [
          {
            email: contact.email,
            name: recipientName || contact.email,
            role: 'SIGNER',
          },
        ],
        prefillFields,
        distributeDocument: true,
        externalId: `hubspot-deal-${dealId}`,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `eSign API Fehler (${response.status}): ${text || response.statusText}`,
      );
    }

    const result = await response.json();

    const fieldSummary = mappedFields.map((f) => ({
      fieldLabel: f.fieldMeta.label || f.fieldMeta.hubspotMapping.propertyLabel,
      hubspotProperty: f.fieldMeta.hubspotMapping.propertyLabel,
      objectType: f.fieldMeta.hubspotMapping.objectType,
    }));

    console.log(
      `Vertrag versendet: Deal ${dealId} -> Template ${templateId} -> Empfaenger ${contact.email} (${prefillFields.length} Felder befuellt)`,
    );

    return {
      statusCode: 200,
      body: {
        documentId: result.documentId || result.id,
        recipient: {
          name: recipientName,
          email: contact.email,
        },
        prefillFields,
        fieldSummary,
      },
    };
  } catch (error) {
    console.error('send-contract Fehler:', error.message);
    return {
      statusCode: 500,
      body: { error: error.message || ERROR_MESSAGES.SEND_CONTRACT },
    };
  }
};

async function getAssociatedContact(hubspotClient, dealId, properties) {
  try {
    const associations =
      await hubspotClient.crm.associations.v4.basicApi.getPage(
        'deals',
        dealId,
        'contacts',
        undefined,
        500,
      );

    const contactIds = (associations.results || []).map((a) =>
      String(a.toObjectId),
    );

    if (contactIds.length === 0) {
      return null;
    }

    const contactResponse =
      await hubspotClient.crm.contacts.basicApi.getById(
        contactIds[0],
        properties,
      );

    return contactResponse.properties || null;
  } catch (error) {
    console.error('Kontakt-Zuordnung Fehler:', error.message);
    return null;
  }
}

async function getAssociatedCompany(hubspotClient, dealId, properties) {
  try {
    const associations =
      await hubspotClient.crm.associations.v4.basicApi.getPage(
        'deals',
        dealId,
        'companies',
        undefined,
        500,
      );

    const companyIds = (associations.results || []).map((a) =>
      String(a.toObjectId),
    );

    if (companyIds.length === 0) {
      return null;
    }

    const defaultProps = ['name', 'domain', 'industry'];
    const allProps = [...new Set([...defaultProps, ...properties])];

    const companyResponse =
      await hubspotClient.crm.companies.basicApi.getById(
        companyIds[0],
        allProps,
      );

    return companyResponse.properties || null;
  } catch (error) {
    console.error('Unternehmen-Zuordnung Fehler:', error.message);
    return null;
  }
}
