const hubspotApi = require('@hubspot/api-client');
const FormData = require('form-data');

exports.main = async (context = {}) => {
  try {
    const { documentId, dealPropertyName } = context.parameters || {};
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

    const hubspotClient = new hubspotApi.Client({
      accessToken: process.env['PRIVATE_APP_ACCESS_TOKEN'],
    });

    const pdfResponse = await fetch(
      `${baseUrl}/api/v2/document/${documentId}/download`,
      {
        method: 'GET',
        headers: {
          Authorization: apiKey,
        },
      },
    );

    if (!pdfResponse.ok) {
      const text = await pdfResponse.text().catch(() => '');
      throw new Error(`PDF konnte nicht heruntergeladen werden (${pdfResponse.status}): ${text}`);
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    const fileName = `vertrag-deal-${dealId}-${documentId}.pdf`;

    const form = new FormData();
    form.append('file', pdfBuffer, { filename: fileName, contentType: 'application/pdf' });
    form.append('options', JSON.stringify({ access: 'PRIVATE' }));
    form.append('folderPath', '/lohnlab-esign');

    const uploadResponse = await fetch('https://api.hubapi.com/files/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env['PRIVATE_APP_ACCESS_TOKEN']}`,
        ...form.getHeaders(),
      },
      body: form,
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
      await hubspotClient.crm.deals.basicApi.update(dealId, {
        properties: { [dealPropertyName]: String(fileId) },
      });
      console.log(`Deal-Property '${dealPropertyName}' mit Datei ${fileId} aktualisiert.`);
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
