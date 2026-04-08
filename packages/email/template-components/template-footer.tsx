import { Trans } from '@lingui/react/macro';

import { Link, Section, Text } from '../components';
import { useBranding } from '../providers/branding';

export type TemplateFooterProps = {
  isDocument?: boolean;
};

export const TemplateFooter = ({ isDocument = true }: TemplateFooterProps) => {
  const branding = useBranding();

  return (
    <Section>
      {isDocument && !branding.brandingHidePoweredBy && (
        <Text className="my-4 text-base text-slate-400">
          <Trans>
            This document was sent using{' '}
            <Link className="text-[#2037B9]" href="https://documen.so/mail-footer">
              LohnLab eSign
            </Link>
            .
          </Trans>
        </Text>
      )}

      {branding.brandingEnabled && branding.brandingCompanyDetails && (
        <Text className="my-8 text-sm text-slate-400">
          {branding.brandingCompanyDetails.split('\n').map((line, idx) => {
            return (
              <>
                {idx > 0 && <br />}
                {line}
              </>
            );
          })}
        </Text>
      )}

      {!branding.brandingEnabled && (
        <Section
          style={{
            backgroundColor: '#f0f4f8',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            marginTop: '24px',
          }}
        >
          <Text
            style={{
              fontSize: '13px',
              lineHeight: '22px',
              color: '#666666',
              margin: '0',
            }}
          >
            <strong>LohnLab Software GmbH</strong>
            <br />
            Hauptstraße 20, 63755 Alzenau
            <br />
            Telefon: 06023 91 801 0
            <br />
            <Link href="https://www.lohnlab.de" style={{ color: '#2037B9' }}>
              www.lohnlab.de
            </Link>
          </Text>
          <Text
            style={{
              fontSize: '11px',
              lineHeight: '18px',
              color: '#999999',
              margin: '12px 0 0 0',
            }}
          >
            Amtsgericht Aschaffenburg, HRB XXXXX
            <br />
            Geschäftsführung: Michael Schmitt, Lennart Reichert
          </Text>
          <Text
            style={{
              fontSize: '11px',
              lineHeight: '18px',
              color: '#999999',
              margin: '12px 0 0 0',
            }}
          >
            © {new Date().getFullYear()} LohnLab GmbH –{' '}
            <Link href="https://lohnlab.de/datenschutz" style={{ color: '#2037B9' }}>
              Datenschutz
            </Link>{' '}
            ·{' '}
            <Link href="https://lohnlab.de/impressum" style={{ color: '#2037B9' }}>
              Impressum
            </Link>
          </Text>
        </Section>
      )}
    </Section>
  );
};

export default TemplateFooter;
