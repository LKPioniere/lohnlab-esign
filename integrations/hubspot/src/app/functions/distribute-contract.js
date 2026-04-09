exports.main = async (context = {}) => {
  try {
    const { envelopeId } = context.parameters || {};

    if (!envelopeId) {
      return { error: 'Keine Dokument-ID angegeben.' };
    }

    const apiKey = process.env['ESIGN_API_KEY'];
    const baseUrl = (process.env['ESIGN_BASE_URL'] || '').replace(/\/+$/, '');

    if (!apiKey || !baseUrl) {
      return { error: 'eSign ist nicht konfiguriert.' };
    }

    const response = await fetch(`${baseUrl}/api/v2/envelope/distribute`, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ envelopeId }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Versand fehlgeschlagen (${response.status}): ${text || response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      envelopeId,
      recipients: result.recipients || [],
    };
  } catch (error) {
    console.error('distribute-contract Fehler:', error.message);
    return { error: error.message || 'Dokument konnte nicht versendet werden.' };
  }
};
