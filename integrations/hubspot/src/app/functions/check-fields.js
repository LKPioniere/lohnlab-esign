const hubspotApi = require('@hubspot/api-client');

const OBJECT_TYPE_LABELS = {
  deals: 'Deal',
  contacts: 'Kontakt',
  companies: 'Unternehmen',
};

exports.main = async (context = {}) => {
  try {
    const { templateId, contactId } = context.parameters || {};
    const dealProperties = context.propertiesToSend || {};
    const dealId = dealProperties.hs_object_id;

    if (!templateId) {
      return { error: 'Keine Vorlage ausgewaehlt.' };
    }

    const apiKey = process.env['ESIGN_API_KEY'];
    const baseUrl = (process.env['ESIGN_BASE_URL'] || '').replace(/\/+$/, '');

    if (!apiKey || !baseUrl) {
      return { error: 'eSign ist nicht konfiguriert.' };
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
      throw new Error(`Vorlage konnte nicht geladen werden (${templateResponse.status}): ${text}`);
    }

    const templateData = await templateResponse.json();
    const templateFields = templateData.fields || [];

    const mappedFields = templateFields.filter(
      (f) => f.fieldMeta && f.fieldMeta.hubspotMapping,
    );

    if (mappedFields.length === 0) {
      return { fields: [], missingFields: [] };
    }

    const requiredDealProps = mappedFields
      .filter((f) => f.fieldMeta.hubspotMapping.objectType === 'deals')
      .map((f) => f.fieldMeta.hubspotMapping.propertyName);

    const requiredContactProps = mappedFields
      .filter((f) => f.fieldMeta.hubspotMapping.objectType === 'contacts')
      .map((f) => f.fieldMeta.hubspotMapping.propertyName);

    const requiredCompanyProps = mappedFields
      .filter((f) => f.fieldMeta.hubspotMapping.objectType === 'companies')
      .map((f) => f.fieldMeta.hubspotMapping.propertyName);

    let dealData = dealProperties;
    let contactData = {};
    let companyData = {};

    if (requiredDealProps.length > 0) {
      try {
        const resp = await hubspotClient.crm.deals.basicApi.getById(
          dealId,
          [...new Set(requiredDealProps)],
        );
        dealData = { ...dealProperties, ...(resp.properties || {}) };
      } catch (err) {
        console.error('Deal-Properties Fehler:', err.message);
      }
    }

    if (requiredContactProps.length > 0 && contactId) {
      try {
        const resp = await hubspotClient.crm.contacts.basicApi.getById(
          contactId,
          [...new Set(requiredContactProps)],
        );
        contactData = resp.properties || {};
      } catch (err) {
        console.error('Kontakt-Properties Fehler:', err.message);
      }
    }

    if (requiredCompanyProps.length > 0) {
      try {
        const assoc = await hubspotClient.crm.associations.v4.basicApi.getPage(
          'deals', dealId, 'companies', undefined, 500,
        );
        const companyIds = (assoc.results || []).map((a) => String(a.toObjectId));

        if (companyIds.length > 0) {
          const resp = await hubspotClient.crm.companies.basicApi.getById(
            companyIds[0],
            [...new Set(['name', ...requiredCompanyProps])],
          );
          companyData = resp.properties || {};
        }
      } catch (err) {
        console.error('Unternehmens-Properties Fehler:', err.message);
      }
    }

    const dataLookup = {
      deals: dealData,
      contacts: contactData,
      companies: companyData,
    };

    const rawFields = mappedFields.map((field) => {
      const mapping = field.fieldMeta.hubspotMapping;
      const sourceData = dataLookup[mapping.objectType] || {};
      const rawValue = sourceData[mapping.propertyName];
      const hasValue = rawValue !== undefined && rawValue !== null && rawValue !== '';

      const isRequired = field.fieldMeta.required !== false;

      return {
        fieldId: field.id,
        fieldLabel: field.fieldMeta.label || mapping.propertyLabel,
        objectType: mapping.objectType,
        objectTypeLabel: OBJECT_TYPE_LABELS[mapping.objectType] || mapping.objectType,
        propertyName: mapping.propertyName,
        propertyLabel: mapping.propertyLabel,
        currentValue: hasValue ? String(rawValue) : '',
        hasValue,
        required: isRequired,
      };
    });

    const deduped = new Map();
    for (const f of rawFields) {
      const key = `${f.objectType}:${f.propertyName}`;
      if (deduped.has(key)) {
        const existing = deduped.get(key);
        existing.fieldIds.push(f.fieldId);
        if (f.required) {
          existing.required = true;
        }
      } else {
        deduped.set(key, { ...f, fieldIds: [f.fieldId] });
      }
    }

    const fields = Array.from(deduped.values()).sort((a, b) =>
      (a.propertyLabel || '').localeCompare(b.propertyLabel || '', 'de', { numeric: true }),
    );
    const missingFields = fields.filter((f) => !f.hasValue);

    return { fields, missingFields };
  } catch (error) {
    console.error('check-fields Fehler:', error.message);
    return { error: error.message, fields: [], missingFields: [] };
  }
};
