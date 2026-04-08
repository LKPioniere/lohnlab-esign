const STATUS_LABELS = {
  DRAFT: 'Entwurf',
  PENDING: 'Ausstehend',
  COMPLETED: 'Abgeschlossen',
  REJECTED: 'Abgelehnt',
};

const STATUS_VARIANTS = {
  DRAFT: 'warning',
  PENDING: 'info',
  COMPLETED: 'success',
  REJECTED: 'error',
};

const ERROR_MESSAGES = {
  FETCH_STATUS: 'Status konnte nicht abgefragt werden.',
  NO_API_KEY: 'eSign API-Schlüssel ist nicht konfiguriert.',
  NO_BASE_URL: 'eSign-Server-URL ist nicht konfiguriert.',
  NO_DOCUMENT_ID: 'Keine Dokument-ID angegeben.',
};

exports.main = async (context = {}) => {
  try {
    const { documentId } = context.parameters || {};

    if (!documentId) {
      return { error: ERROR_MESSAGES.NO_DOCUMENT_ID };
    }

    const apiKey = process.env['ESIGN_API_KEY'];
    const baseUrl = (process.env['ESIGN_BASE_URL'] || '').replace(/\/+$/, '');

    if (!apiKey) {
      throw new Error(ERROR_MESSAGES.NO_API_KEY);
    }
    if (!baseUrl) {
      throw new Error(ERROR_MESSAGES.NO_BASE_URL);
    }

    const response = await fetch(`${baseUrl}/api/v2/document/${documentId}`, {
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

    const rawStatus = (data.status || 'DRAFT').toUpperCase();
    const label = STATUS_LABELS[rawStatus] || rawStatus;
    const variant = STATUS_VARIANTS[rawStatus] || 'default';

    const recipients = (data.recipients || []).map((r) => ({
      name: r.name || r.email,
      email: r.email,
      status: r.signingStatus || r.readStatus || 'PENDING',
      statusLabel:
        STATUS_LABELS[(r.signingStatus || '').toUpperCase()] || 'Ausstehend',
    }));

    return {
      documentId,
      status: rawStatus,
      statusLabel: label,
      statusVariant: variant,
      recipients,
      completedAt: data.completedAt || null,
    };
  } catch (error) {
    console.error('get-status Fehler:', error.message);
    return { error: error.message || ERROR_MESSAGES.FETCH_STATUS };
  }
};
