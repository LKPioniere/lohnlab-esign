import { Trans } from '@lingui/react/macro';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CircleDotIcon,
  FileUpIcon,
  HashIcon,
  LinkIcon,
  MousePointerClickIcon,
  TypeIcon,
} from 'lucide-react';

import { Badge } from '@documenso/ui/primitives/badge';
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

export const HubspotGuidanceDialog = ({
  open,
  onOpenChange,
}: HubspotGuidanceDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Hero Header */}
        <div className="bg-muted/30 border-b px-6 pt-8 pb-6">
          <div className="flex items-center justify-center gap-5">
            <img
              src={hubspotLogoDark}
              alt="HubSpot"
              className="h-16 dark:hidden"
            />
            <img
              src={hubspotLogoLight}
              alt="HubSpot"
              className="hidden h-16 dark:block"
            />
            <span className="text-muted-foreground text-3xl font-light">+</span>
            <div className="flex items-end gap-2">
              <img
                src="/static/logo-dark.png"
                alt="LohnLab"
                className="h-5 dark:hidden"
              />
              <img
                src="/static/logo.png"
                alt="LohnLab"
                className="hidden h-5 dark:block"
              />
              <span className="-mb-[1px] text-base font-light leading-none text-muted-foreground dark:text-documenso">
                eSign
              </span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <DialogHeader className="items-center">
              <DialogTitle className="text-xl">
                <Trans>HubSpot-Vorlage erstellen</Trans>
              </DialogTitle>
              <DialogDescription className="max-w-md">
                <Trans>
                  So erstellst du eine Vorlage, die automatisch mit Daten aus
                  deinen HubSpot-Deals befüllt wird.
                </Trans>
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Step 1 */}
          <StepSection number={1} icon={FileUpIcon} title="Dokument hochladen">
            <p className="text-muted-foreground text-sm">
              Lade deinen Vertrag oder dein Bestellformular als PDF-Vorlage
              hoch.
            </p>
          </StepSection>

          {/* Step 2 */}
          <StepSection
            number={2}
            icon={MousePointerClickIcon}
            title="Felder platzieren"
          >
            <p className="text-muted-foreground text-sm">
              Ziehe Felder auf die Stellen im Dokument, die mit HubSpot-Daten
              befüllt werden sollen.
            </p>
            {/* Visual mockup: document with fields */}
            <div className="bg-muted/40 mt-3 rounded-lg border p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-background h-3 w-32 rounded" />
                  <div className="bg-background h-3 w-20 rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    Firma:
                  </span>
                  <div className="border-primary/60 bg-primary/5 flex items-center gap-1 rounded border border-dashed px-2 py-1">
                    <TypeIcon className="text-primary h-3 w-3" />
                    <span className="text-primary text-xs font-medium">
                      Firmenname
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    Betrag:
                  </span>
                  <div className="border-primary/60 bg-primary/5 flex items-center gap-1 rounded border border-dashed px-2 py-1">
                    <HashIcon className="text-primary h-3 w-3" />
                    <span className="text-primary text-xs font-medium">
                      1.250,00 €
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    Paket:
                  </span>
                  <div className="border-primary/60 bg-primary/5 flex items-center gap-1 rounded border border-dashed px-2 py-1">
                    <CircleDotIcon className="text-primary h-3 w-3" />
                    <span className="text-primary text-xs font-medium">
                      ○ A &nbsp; ● B &nbsp; ○ C
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </StepSection>

          {/* Step 3 */}
          <StepSection
            number={3}
            icon={LinkIcon}
            title="HubSpot-Properties zuordnen"
          >
            <p className="text-muted-foreground text-sm">
              Klicke auf ein Feld – in der Seitenleiste erscheint der Bereich
              „HubSpot Mapping". Wähle dort den Objekttyp und die Property aus.
            </p>
            {/* Visual mockup: editor sidebar mapping */}
            <div className="bg-muted/40 mt-3 rounded-lg border p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <img
                    src={hubspotLogoDark}
                    alt="HubSpot"
                    className="h-7 dark:hidden"
                  />
                  <img
                    src={hubspotLogoLight}
                    alt="HubSpot"
                    className="hidden h-7 dark:block"
                  />
                  <span className="text-xs font-medium">Mapping</span>
                </div>

                {/* Mockup dropdown: Objekttyp */}
                <div>
                  <span className="text-muted-foreground text-[10px]">
                    Objekttyp
                  </span>
                  <div className="bg-background mt-0.5 flex items-center justify-between rounded border px-2 py-1.5">
                    <span className="text-xs">Deal</span>
                    <ChevronDownIcon className="text-muted-foreground h-3 w-3" />
                  </div>
                </div>

                {/* Mockup dropdown: Property */}
                <div>
                  <span className="text-muted-foreground text-[10px]">
                    Property
                  </span>
                  <div className="bg-background mt-0.5 flex items-center justify-between rounded border px-2 py-1.5">
                    <span className="text-xs">Bestellbetrag</span>
                    <ChevronDownIcon className="text-muted-foreground h-3 w-3" />
                  </div>
                </div>

                {/* Result badge */}
                <div className="flex items-center gap-1.5">
                  <ArrowRightIcon className="text-muted-foreground h-3 w-3" />
                  <Badge variant="secondary" className="text-[10px]">
                    <LinkIcon className="mr-1 h-2.5 w-2.5" />
                    Deal → Bestellbetrag
                  </Badge>
                </div>
              </div>
            </div>
          </StepSection>

          {/* Step 4 */}
          <StepSection
            number={4}
            icon={CheckCircleIcon}
            title="Speichern und nutzen"
          >
            <p className="text-muted-foreground text-sm">
              Speichere die Vorlage. Sie erscheint dann in der
              HubSpot-Deal-Seitenleiste und kann mit einem Klick versendet
              werden – alle Felder werden automatisch befüllt.
            </p>
            {/* Visual mockup: HubSpot CRM card */}
            <div className="bg-muted/40 mt-3 rounded-lg border p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-semibold">LohnLab eSign</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Wähle eine Vertragsvorlage aus und versende sie mit den
                  Deal-Daten zur Unterschrift.
                </p>
                <div>
                  <span className="text-muted-foreground text-[10px]">
                    Vorlage auswählen
                  </span>
                  <div className="bg-background mt-0.5 flex items-center justify-between rounded border px-2 py-1.5">
                    <span className="text-xs">111_Bestellformular_LL</span>
                    <ChevronDownIcon className="text-muted-foreground h-3 w-3" />
                  </div>
                </div>
                <div className="bg-primary text-primary-foreground flex items-center justify-center rounded px-3 py-1.5 text-xs font-medium">
                  Vertrag senden
                </div>
              </div>
            </div>
          </StepSection>

        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            <Trans>Verstanden</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StepSection = ({
  number,
  icon: Icon,
  title,
  children,
}: {
  number: number;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
          {number}
        </div>
        <div className="bg-border mt-1 w-px flex-1" />
      </div>
      <div className="pb-2 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="text-primary h-4 w-4" />
          <p className="text-sm font-semibold">{title}</p>
        </div>
        {children}
      </div>
    </div>
  );
};

