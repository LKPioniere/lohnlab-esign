const hubspotApi = require('@hubspot/api-client');

exports.main = async (context = {}) => {
  try {
    const hubspotClient = new hubspotApi.Client({
      accessToken: process.env['PRIVATE_APP_ACCESS_TOKEN'],
    });

    const response = await hubspotClient.crm.properties.coreApi.getAll('deals');
    const allProperties = response.results || response || [];

    const fileProperties = allProperties
      .filter((p) => p.fieldType === 'file')
      .map((p) => ({
        name: p.name,
        label: p.label,
      }))
      .sort((a, b) => (a.label || '').localeCompare(b.label || '', 'de'));

    return { properties: fileProperties };
  } catch (error) {
    console.error('get-file-properties Fehler:', error.message);
    return { error: error.message, properties: [] };
  }
};
