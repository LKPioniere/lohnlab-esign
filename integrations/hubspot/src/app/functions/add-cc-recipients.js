exports.main = async (context = {}) => {
  try {
    const { envelopeId, ccEmailsJson } = context.parameters || {};

    if (!envelopeId) {
      return { error: 'Keine Envelope-ID angegeben.' };
    }

    const apiKey = process.env['ESIGN_API_KEY'];
    const baseUrl = (process.env['ESIGN_BASE_URL'] || '').replace(/\/+$/, '');

    if (!apiKey || !baseUrl) {
      return { error: 'eSign ist nicht konfiguriert.' };
    }

    const ccEntries = ccEmailsJson ? JSON.parse(ccEmailsJson) : [];
    const ccRecipients = [];
    const addedEmails = new Set();

    for (const entry of ccEntries) {
      const email = (entry.email || '').trim().toLowerCase();
      const name = entry.name || email;
      if (email && email.includes('@') && !addedEmails.has(email)) {
        ccRecipients.push({ email, name, role: 'CC' });
        addedEmails.add(email);
      }
    }

    if (ccRecipients.length === 0) {
      return { success: true, added: 0 };
    }

    const response = await fetch(`${baseUrl}/api/v2/envelope/recipient/create-many`, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        envelopeId,
        data: ccRecipients,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`CC-Empfaenger konnten nicht hinzugefuegt werden (${response.status}): ${text}`);
    }

    console.log(`${ccRecipients.length} CC-Empfaenger hinzugefuegt: ${ccRecipients.map((r) => r.email).join(', ')}`);

    return {
      success: true,
      added: ccRecipients.length,
      recipients: ccRecipients.map((r) => ({ email: r.email, name: r.name })),
    };
  } catch (error) {
    console.error('add-cc-recipients Fehler:', error.message);
    return { error: error.message };
  }
};
