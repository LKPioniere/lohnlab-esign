const hubspotApi = require('@hubspot/api-client');

async function getCompanyNameForDeal(hubspotClient, dealId) {
  try {
    const assoc = await hubspotClient.crm.associations.v4.basicApi.getPage(
      'deals', dealId, 'companies', undefined, 1,
    );
    const companyId = (assoc.results || [])[0]?.toObjectId;
    if (!companyId) {
      return '';
    }
    const resp = await hubspotClient.crm.companies.basicApi.getById(
      String(companyId), ['name'],
    );
    return (resp.properties && resp.properties.name) || '';
  } catch (err) {
    console.error('Company-Name laden Fehler:', err.message);
    return '';
  }
}

function buildFileName(companyName, documentTitle, dealId, documentId) {
  const sanitize = (s) => s.replace(/[^a-zA-Z0-9äöüÄÖÜß _-]/g, '').trim();
  const parts = [];
  if (companyName) {
    parts.push(sanitize(companyName));
  }
  if (documentTitle) {
    parts.push(sanitize(documentTitle));
  }
  if (parts.length === 0) {
    return `dokument-deal-${dealId}-${documentId}_unterzeichnet.pdf`;
  }
  return `${parts.join(' - ')}_unterzeichnet.pdf`;
}

function buildMultipartBody(boundary, fileName, pdfBuffer) {
  const optionsJson = JSON.stringify({ access: 'PRIVATE' });

  const headerParts = [];
  headerParts.push(`--${boundary}\r\n`);
  headerParts.push(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`);
  headerParts.push('Content-Type: application/pdf\r\n\r\n');
  const headerBuf = Buffer.from(headerParts.join(''));

  const footerParts = [];
  footerParts.push(`\r\n--${boundary}\r\n`);
  footerParts.push('Content-Disposition: form-data; name="options"\r\n\r\n');
  footerParts.push(optionsJson);
  footerParts.push(`\r\n--${boundary}\r\n`);
  footerParts.push('Content-Disposition: form-data; name="folderPath"\r\n\r\n');
  footerParts.push('/lohnlab-esign');
  footerParts.push(`\r\n--${boundary}--\r\n`);
  const footerBuf = Buffer.from(footerParts.join(''));

  return Buffer.concat([headerBuf, pdfBuffer, footerBuf]);
}

exports.main = async (context = {}) => {
  try {
    const { documentId, dealPropertyName, documentTitle } = context.parameters || {};
    const dealProperties = context.propertiesToSend || {};
    const dealId = dealProperties.hs_object_id;

    if (!documentId || !dealId) {
      return { error: 'Dokument-ID oder Deal-ID fehlt.' };
    }

    const apiKey = process.env['ESIGN_API_KEY'];
    const baseUrl = (process.env['ESIGN_BASE_URL'] || '').replace(/\/+$/, '');

    if (!apiKey || !baseUrl) {
      return { error: 'eSign ist nicht konfiguriert.' };
    }

    const accessToken = process.env['PRIVATE_APP_ACCESS_TOKEN'];
    const hubspotClient = new hubspotApi.Client({ accessToken });

    const companyName = await getCompanyNameForDeal(hubspotClient, dealId);

    const pdfResponse = await fetch(
      `${baseUrl}/api/v2/document/${documentId}/download?version=signed`,
      {
        method: 'GET',
        headers: { Authorization: apiKey },
      },
    );

    if (!pdfResponse.ok) {
      const text = await pdfResponse.text().catch(() => '');
      throw new Error(`PDF konnte nicht heruntergeladen werden (${pdfResponse.status}): ${text}`);
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    const fileName = buildFileName(companyName, documentTitle, dealId, documentId);

    const boundary = '----FormBoundary' + Date.now().toString(16);
    const body = buildMultipartBody(boundary, fileName, pdfBuffer);

    const uploadResponse = await fetch('https://api.hubapi.com/files/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    if (!uploadResponse.ok) {
      const text = await uploadResponse.text().catch(() => '');
      throw new Error(`Datei konnte nicht hochgeladen werden (${uploadResponse.status}): ${text}`);
    }

    const uploadResult = await uploadResponse.json();
    const fileId = uploadResult.id;

    if (!fileId) {
      throw new Error('Keine Datei-ID von HubSpot erhalten.');
    }

    if (dealPropertyName) {
      let newValue = String(fileId);
      try {
        const dealResp = await hubspotClient.crm.deals.basicApi.getById(
          dealId, [dealPropertyName],
        );
        const existing = (dealResp.properties && dealResp.properties[dealPropertyName]) || '';
        if (existing && existing.trim()) {
          newValue = `${existing};${fileId}`;
        }
      } catch (err) {
        console.error('Bestehende File-IDs lesen Fehler:', err.message);
      }

      await hubspotClient.crm.deals.basicApi.update(dealId, {
        properties: { [dealPropertyName]: newValue },
      });
      console.log(`Deal-Property '${dealPropertyName}' aktualisiert: ${newValue}`);
    } else {
      try {
        const noteResponse = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              hs_note_body: `Signiertes Dokument abgelegt: ${fileName}`,
              hs_attachment_ids: String(fileId),
            },
            associations: [
              {
                to: { id: dealId },
                types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 214 }],
              },
            ],
          }),
        });

        if (!noteResponse.ok) {
          const text = await noteResponse.text().catch(() => '');
          console.error(`Notiz erstellen Fehler (${noteResponse.status}): ${text}`);
        } else {
          console.log(`Notiz mit PDF-Anhang am Deal ${dealId} erstellt.`);
        }
      } catch (err) {
        console.error('Notiz erstellen Fehler:', err.message);
      }
    }

    return {
      success: true,
      fileId,
      fileName,
      dealPropertyName: dealPropertyName || null,
    };
  } catch (error) {
    console.error('attach-document Fehler:', error.message);
    return { error: error.message };
  }
};
