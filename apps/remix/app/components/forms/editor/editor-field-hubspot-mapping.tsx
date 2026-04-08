import { useState } from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { InfoIcon, LinkIcon, XIcon } from 'lucide-react';

import type { THubspotMapping } from '@documenso/lib/types/field-meta';
import { trpc } from '@documenso/trpc/react';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { Label } from '@documenso/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { Separator } from '@documenso/ui/primitives/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@documenso/ui/primitives/tooltip';

import hubspotLogoDark from '../../../../../../packages/assets/hubspot-logo-dark.png';
import hubspotLogoLight from '../../../../../../packages/assets/hubspot-logo-light.png';

const OBJECT_TYPE_LABELS: Record<string, string> = {
  deals: 'Deal',
  contacts: 'Kontakt',
  companies: 'Unternehmen',
};

type EditorFieldHubspotMappingProps = {
  value: THubspotMapping | undefined;
  onValueChange: (value: THubspotMapping | undefined) => void;
};

export const EditorFieldHubspotMapping = ({
  value,
  onValueChange,
}: EditorFieldHubspotMappingProps) => {
  const { t } = useLingui();

  const [objectType, setObjectType] = useState<string>(
    value?.objectType || 'deals',
  );

  const { data: enabledCheck } = trpc.hubspot.getProperties.useQuery(
    { objectType: 'deals' },
    { retry: false, refetchOnWindowFocus: false },
  );

  const { data: propertiesData, isLoading: isLoadingProperties } =
    trpc.hubspot.getProperties.useQuery(
      { objectType: objectType as 'deals' | 'contacts' | 'companies' },
      {
        enabled: !!enabledCheck?.enabled,
        retry: false,
        refetchOnWindowFocus: false,
      },
    );

  if (!enabledCheck?.enabled) {
    return null;
  }

  const properties = propertiesData?.properties || [];

  const handleObjectTypeChange = (newObjectType: string) => {
    setObjectType(newObjectType);
    onValueChange(undefined);
  };

  const handlePropertyChange = (propertyName: string) => {
    if (propertyName === '__none__') {
      onValueChange(undefined);
      return;
    }

    const property = properties.find((p) => p.name === propertyName);

    if (property) {
      onValueChange({
        objectType: objectType as 'deals' | 'contacts' | 'companies',
        propertyName: property.name,
        propertyLabel: property.label,
      });
    }
  };

  const handleRemoveMapping = () => {
    onValueChange(undefined);
  };

  return (
    <section className="space-y-2">
      <div className="-mx-4 mb-4 mt-2">
        <Separator />
      </div>

      <div className="flex items-center gap-2">
        <img
          src={hubspotLogoDark}
          alt="HubSpot"
          className="h-4 dark:hidden"
        />
        <img
          src={hubspotLogoLight}
          alt="HubSpot"
          className="hidden h-4 dark:block"
        />
        <span className="text-sm font-medium">
          <Trans>HubSpot Mapping</Trans>
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              <Trans>
                Verknüpfe dieses Feld mit einer HubSpot-Property. Beim
                Versenden aus HubSpot wird der Wert automatisch eingesetzt.
              </Trans>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {value ? (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1.5">
            <LinkIcon className="h-3 w-3" />
            <span>
              {OBJECT_TYPE_LABELS[value.objectType] || value.objectType} &rarr;{' '}
              {value.propertyLabel}
            </span>
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleRemoveMapping}
          >
            <XIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <>
          <div>
            <Label className="text-xs">
              <Trans>Objekttyp</Trans>
            </Label>
            <Select value={objectType} onValueChange={handleObjectTypeChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deals">Deal</SelectItem>
                <SelectItem value="contacts">
                  <Trans>Kontakt</Trans>
                </SelectItem>
                <SelectItem value="companies">
                  <Trans>Unternehmen</Trans>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground mt-1 text-[10px] leading-tight">
              {objectType === 'deals' && t`Betrag, Dealname, Konditionen, Custom-Properties`}
              {objectType === 'contacts' && t`Vorname, Nachname, E-Mail, Telefon`}
              {objectType === 'companies' && t`Firmenname, Branche, Adresse, USt-ID`}
            </p>
          </div>

          <div>
            <Label className="text-xs">
              <Trans>Property</Trans>
            </Label>
            <Select
              value="__none__"
              onValueChange={handlePropertyChange}
              disabled={isLoadingProperties}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={
                    isLoadingProperties
                      ? t`Wird geladen...`
                      : t`Property wählen`
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  <Trans>Keine Zuordnung</Trans>
                </SelectItem>
                {properties.map((prop) => (
                  <SelectItem key={prop.name} value={prop.name}>
                    {prop.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </section>
  );
};
