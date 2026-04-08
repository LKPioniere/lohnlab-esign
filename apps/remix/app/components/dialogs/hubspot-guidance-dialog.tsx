import { Trans } from '@lingui/react/macro';
import {
  BuildingIcon,
  CheckCircleIcon,
  FileUpIcon,
  InfoIcon,
  LinkIcon,
  MousePointerClickIcon,
  UserIcon,
} from 'lucide-react';

import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@documenso/ui/primitives/dialog';

import hubspotLogoDark from '../../../../../packages/assets/hubspot-logo-dark.png';
import hubspotLogoLight from '../../../../../packages/assets/hubspot-logo-light.png';

type HubspotGuidanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const STEPS = [
  {
    icon: FileUpIcon,
    title: 'Dokument hochladen',
    description: 'Lade deinen Vertrag oder dein Bestellformular als PDF-Vorlage hoch.',
  },
  {
    icon: MousePointerClickIcon,
    title: 'Felder platzieren',
    description:
      'Setze Text-, Zahl- oder Datumsfelder an die Stellen im Dokument, die mit HubSpot-Daten befüllt werden sollen.',
  },
  {
    icon: LinkIcon,
    title: 'HubSpot-Properties zuordnen',
    description:
      'Klicke auf ein Feld und wähle unter „HubSpot Mapping" den passenden Objekttyp und die Property aus.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Speichern und nutzen',
    description:
      'Speichere die Vorlage. Sie erscheint dann in der HubSpot-Deal-Seitenleiste und kann mit einem Klick versendet werden.',
  },
] as const;

const OBJECT_TYPE_HINTS = [
  {
    icon: LinkIcon,
    label: 'Deal',
    examples: 'Betrag, Dealname, Paketauswahl, individuelle Konditionen',
  },
  {
    icon: UserIcon,
    label: 'Kontakt',
    examples: 'Vorname, Nachname, E-Mail, Telefonnummer',
  },
  {
    icon: BuildingIcon,
    label: 'Unternehmen',
    examples: 'Firmenname, Branche, Adresse, USt-ID',
  },
] as const;

export const HubspotGuidanceDialog = ({
  open,
  onOpenChange,
}: HubspotGuidanceDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <img
              src={hubspotLogoDark}
              alt="HubSpot"
              className="h-6 dark:hidden"
            />
            <img
              src={hubspotLogoLight}
              alt="HubSpot"
              className="hidden h-6 dark:block"
            />
            <span className="text-muted-foreground text-lg">+</span>
            <span className="text-lg font-semibold">LohnLab eSign</span>
          </div>
          <DialogTitle>
            <Trans>HubSpot-Vorlage erstellen</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>
              So erstellst du eine Vorlage, die automatisch mit Daten aus
              HubSpot befüllt wird.
            </Trans>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {STEPS.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <step.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {index + 1}. {step.title}
                </p>
                <p className="text-muted-foreground text-xs">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <InfoIcon className="h-4 w-4" />
            <Trans>Welchen Objekttyp wähle ich?</Trans>
          </p>
          {OBJECT_TYPE_HINTS.map((hint) => (
            <div key={hint.label} className="flex items-start gap-2 text-xs">
              <hint.icon className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                <span className="font-medium">{hint.label}:</span>{' '}
                <span className="text-muted-foreground">{hint.examples}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <InfoIcon className="h-4 w-4" />
            <Trans>Beispiel: Bestellformular</Trans>
          </p>
          <p className="text-muted-foreground text-xs">
            <Trans>
              Du hast ein Bestellformular mit variablen Beträgen und
              verschiedenen Paketen (z.B. Option A, B oder C)? Lege in HubSpot
              ein Custom-Deal-Property an (z.B. &quot;Bestellbetrag&quot; oder
              &quot;Paketauswahl&quot;) und trage den Wert pro Deal ein. Setze
              dann im Editor ein Feld auf das Dokument und verknüpfe es mit
              diesem Deal-Property – der Wert wird beim Versenden automatisch
              eingesetzt.
            </Trans>
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            <Trans>Verstanden</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
