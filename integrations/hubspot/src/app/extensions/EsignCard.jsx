import React, { useState, useEffect, useCallback } from 'react';
import {
  hubspot,
  Alert,
  Button,
  Divider,
  Flex,
  Link,
  Select,
  LoadingSpinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@hubspot/ui-extensions';

const STATES = {
  LOADING: 'LOADING',
  SELECT_TEMPLATE: 'SELECT_TEMPLATE',
  CONFIRM: 'CONFIRM',
  SENDING: 'SENDING',
  SENT: 'SENT',
  ERROR: 'ERROR',
};

const UI_TEXT = {
  CARD_DESCRIPTION: 'Wähle eine Vertragsvorlage aus und versende sie mit den Deal-Daten zur Unterschrift.',
  SELECT_LABEL: 'Vorlage auswählen',
  SELECT_PLACEHOLDER: 'Bitte Vorlage wählen...',
  SEND_BUTTON: 'Vertrag senden',
  CONFIRM_BUTTON: 'Jetzt senden',
  CANCEL_BUTTON: 'Abbrechen',
  SENDING_TEXT: 'Wird gesendet...',
  SENT_TITLE: 'Vertrag versendet',
  SENT_DESCRIPTION: 'Der Vertrag wurde erfolgreich zur Unterschrift versendet.',
  ERROR_TITLE: 'Fehler',
  RETRY_BUTTON: 'Nochmal versuchen',
  BACK_BUTTON: 'Zurück',
  NEW_CONTRACT: 'Neuen Vertrag senden',
  LOADING_TEXT: 'Wird geladen...',
  EMPTY_TITLE: 'Noch keine Vorlagen',
  EMPTY_DESCRIPTION: 'Erstelle deine erste Vorlage in LohnLab eSign, um Verträge direkt aus HubSpot zu versenden.',
  CREATE_TEMPLATE: 'Neue Vorlage',
  REFRESH_TEMPLATES: 'Aktualisieren',
  RECIPIENT_INFO: 'Der Empfänger wird automatisch aus dem verknüpften Kontakt des Deals ermittelt.',
  CONFIRM_TITLE: 'Vertrag senden?',
  CONFIRM_DESCRIPTION: 'Die folgenden HubSpot-Felder werden automatisch in den Vertrag übernommen:',
  NO_MAPPINGS_INFO: 'Diese Vorlage hat keine HubSpot-Feldzuordnungen. Der Vertrag wird ohne vorausgefüllte Felder gesendet.',
};

const OBJECT_TYPE_LABELS = {
  deals: 'Deal',
  contacts: 'Kontakt',
  companies: 'Unternehmen',
};

hubspot.extend(({ context, actions }) => (
  <EsignCard context={context} fetchCrmObjectProperties={actions.fetchCrmObjectProperties} />
));

const EsignCard = ({ context, fetchCrmObjectProperties }) => {
  const [state, setState] = useState(STATES.LOADING);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [createUrl, setCreateUrl] = useState(null);

  const loadData = useCallback(() => {
    setState(STATES.LOADING);
    setError(null);

    const templatesPromise = hubspot
      .serverless('get-templates', {
        propertiesToSend: ['hs_object_id'],
        parameters: {},
      })
      .then((response) => response.templates || [])
      .catch(() => []);

    const presignPromise = hubspot
      .serverless('create-presign-token', {
        propertiesToSend: ['hs_object_id'],
        parameters: {},
      })
      .then((response) => {
        if (response && response.embedUrl) {
          return response.embedUrl;
        }
        return null;
      })
      .catch(() => null);

    Promise.all([templatesPromise, presignPromise])
      .then(([templateList, embedUrl]) => {
        setTemplates(templateList);
        setCreateUrl(embedUrl);
        setState(STATES.SELECT_TEMPLATE);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrepareConfirm = useCallback(() => {
    if (!selectedTemplateId) {
      return;
    }
    setState(STATES.CONFIRM);
  }, [selectedTemplateId]);

  const handleSend = useCallback(() => {
    setState(STATES.SENDING);
    setError(null);

    hubspot
      .serverless('send-contract', {
        propertiesToSend: ['hs_object_id'],
        parameters: {
          templateId: selectedTemplateId,
        },
      })
      .then((response) => {
        if (response.error) {
          throw new Error(response.error);
        }
        setResult(response);
        setState(STATES.SENT);
      })
      .catch((err) => {
        setError(err.message || 'Vertrag konnte nicht versendet werden.');
        setState(STATES.ERROR);
      });
  }, [selectedTemplateId]);

  const handleReset = useCallback(() => {
    setSelectedTemplateId(null);
    setResult(null);
    setError(null);
    loadData();
  }, [loadData]);

  if (state === STATES.LOADING) {
    return (
      <LoadingSpinner label={UI_TEXT.LOADING_TEXT} />
    );
  }

  if (state === STATES.SELECT_TEMPLATE) {
    if (templates.length === 0) {
      const templateUrl = createUrl || 'https://esign.lohnlab.de/t/lohnlab/templates?from=hubspot';

      return (
        <Flex direction="column" gap="md">
          <Text format={{ fontWeight: 'bold' }}>{UI_TEXT.EMPTY_TITLE}</Text>
          <Text>{UI_TEXT.EMPTY_DESCRIPTION}</Text>
          <Button
            variant="primary"
            href={{ url: templateUrl, external: true }}
          >
            {UI_TEXT.CREATE_TEMPLATE}
          </Button>
          <Button variant="secondary" onClick={loadData}>
            {UI_TEXT.REFRESH_TEMPLATES}
          </Button>
        </Flex>
      );
    }

    const options = templates.map((t) => ({
      label: t.title,
      value: String(t.id),
    }));

    return (
      <Flex direction="column" gap="md">
        <Text>{UI_TEXT.CARD_DESCRIPTION}</Text>
        <Divider />
        <Select
          label={UI_TEXT.SELECT_LABEL}
          placeholder={UI_TEXT.SELECT_PLACEHOLDER}
          options={options}
          value={selectedTemplateId}
          onChange={(value) => setSelectedTemplateId(value)}
        />
        <Button
          variant="primary"
          disabled={!selectedTemplateId}
          onClick={handlePrepareConfirm}
        >
          {UI_TEXT.SEND_BUTTON}
        </Button>
        <Divider />
        <Flex direction="row" gap="sm">
          <Button
            variant="secondary"
            href={{ url: createUrl || 'https://esign.lohnlab.de/t/lohnlab/templates?from=hubspot', external: true }}
          >
            {UI_TEXT.CREATE_TEMPLATE}
          </Button>
          <Button variant="secondary" onClick={loadData}>
            {UI_TEXT.REFRESH_TEMPLATES}
          </Button>
        </Flex>
      </Flex>
    );
  }

  if (state === STATES.CONFIRM) {
    const selectedTemplate = templates.find(
      (t) => String(t.id) === String(selectedTemplateId)
    );

    return (
      <Flex direction="column" gap="md">
        <Text format={{ fontWeight: 'bold' }}>
          {UI_TEXT.CONFIRM_TITLE}
        </Text>
        <Text>
          Vorlage: {selectedTemplate ? selectedTemplate.title : selectedTemplateId}
        </Text>
        <Divider />
        <Alert title="Empfänger" variant="info">
          {UI_TEXT.RECIPIENT_INFO}
        </Alert>
        <Flex direction="row" gap="sm" justify="end">
          <Button variant="secondary" onClick={() => setState(STATES.SELECT_TEMPLATE)}>
            {UI_TEXT.CANCEL_BUTTON}
          </Button>
          <Button variant="primary" onClick={handleSend}>
            {UI_TEXT.CONFIRM_BUTTON}
          </Button>
        </Flex>
      </Flex>
    );
  }

  if (state === STATES.SENDING) {
    return (
      <LoadingSpinner label={UI_TEXT.SENDING_TEXT} />
    );
  }

  if (state === STATES.SENT) {
    const fieldSummary = result && result.fieldSummary ? result.fieldSummary : [];

    return (
      <Flex direction="column" gap="md">
        <Alert title={UI_TEXT.SENT_TITLE} variant="success">
          {UI_TEXT.SENT_DESCRIPTION}
        </Alert>
        {result && result.recipient && (
          <Text>
            {result.recipient.name} ({result.recipient.email})
          </Text>
        )}
        {fieldSummary.length > 0 && (
          <>
            <Divider />
            <Text format={{ fontWeight: 'bold' }}>Befüllte Felder:</Text>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Feld</TableHeader>
                  <TableHeader>HubSpot</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {fieldSummary.map((field, index) => (
                  <TableRow key={index}>
                    <TableCell>{field.fieldLabel}</TableCell>
                    <TableCell>
                      {OBJECT_TYPE_LABELS[field.objectType] || field.objectType} → {field.hubspotProperty}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        <Button variant="primary" onClick={handleReset}>
          {UI_TEXT.NEW_CONTRACT}
        </Button>
      </Flex>
    );
  }

  if (state === STATES.ERROR) {
    return (
      <Flex direction="column" gap="md">
        <Alert title={UI_TEXT.ERROR_TITLE} variant="error">
          {error || 'Ein unerwarteter Fehler ist aufgetreten.'}
        </Alert>
        <Flex direction="row" gap="sm" justify="end">
          <Button variant="secondary" onClick={handleReset}>
            {UI_TEXT.BACK_BUTTON}
          </Button>
          <Button variant="primary" onClick={loadData}>
            {UI_TEXT.RETRY_BUTTON}
          </Button>
        </Flex>
      </Flex>
    );
  }

  return null;
};
