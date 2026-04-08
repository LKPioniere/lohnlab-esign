const ERROR_MESSAGES = {
  FETCH_TEMPLATES: 'Vorlagen konnten nicht geladen werden.',
  NO_API_KEY: 'eSign API-Schlüssel ist nicht konfiguriert.',
  NO_BASE_URL: 'eSign-Server-URL ist nicht konfiguriert.',
};

exports.main = async (context = {}) => {
  try {
    const apiKey = process.env['ESIGN_API_KEY'];
    const baseUrl = (process.env['ESIGN_BASE_URL'] || '').replace(/\/+$/, '');

    if (!apiKey) {
      throw new Error(ERROR_MESSAGES.NO_API_KEY);
    }
    if (!baseUrl) {
      throw new Error(ERROR_MESSAGES.NO_BASE_URL);
    }

    const response = await fetch(`${baseUrl}/api/v2/template`, {
      method: 'GET',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`eSign API Fehler (${response.status}): ${text || response.statusText}`);
    }

    const data = await response.json();

    const templates = (data.data || data.templates || []).map((t) => ({
      id: t.id,
      title: t.title || t.name || 'Unbenannt',
    }));

    return {
      statusCode: 200,
      body: { templates },
    };
  } catch (error) {
    console.error('get-templates Fehler:', error.message);
    return {
      statusCode: 500,
      body: { error: error.message || ERROR_MESSAGES.FETCH_TEMPLATES },
    };
  }
};
