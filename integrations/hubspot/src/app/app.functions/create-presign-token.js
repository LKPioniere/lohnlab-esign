const ERROR_MESSAGES = {
  NO_API_KEY: 'eSign API-Schlüssel ist nicht konfiguriert.',
  NO_BASE_URL: 'eSign-Server-URL ist nicht konfiguriert.',
  CREATE_TOKEN: 'Presign-Token konnte nicht erstellt werden.',
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

    const response = await fetch(`${baseUrl}/api/v2/embedding/create-presign-token`, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expiresIn: 120,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`eSign API Fehler (${response.status}): ${text || response.statusText}`);
    }

    const data = await response.json();

    const embedUrl = `${baseUrl}/embed/v1/authoring/template/create?token=${encodeURIComponent(data.token)}&from=hubspot`;

    return {
      statusCode: 200,
      body: {
        embedUrl,
        token: data.token,
        expiresIn: data.expiresIn,
      },
    };
  } catch (error) {
    console.error('create-presign-token Fehler:', error.message);
    return {
      statusCode: 500,
      body: { error: error.message || ERROR_MESSAGES.CREATE_TOKEN },
    };
  }
};
