import { useMemo, useState } from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LinkIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';

import type { THubspotMapping } from '@documenso/lib/types/field-meta';
import { trpc } from '@documenso/trpc/react';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { Input } from '@documenso/ui/primitives/input';
import { Label } from '@documenso/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { Separator } from '@documenso/ui/primitives/separator';

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

  const [isExpanded, setIsExpanded] = useState(!!value);
  const [objectType, setObjectType] = useState<string>(
    value?.objectType || 'deals',
  );

  const {
    data: enabledCheck,
    isLoading: isCheckLoading,
    error: checkError,
  } = trpc.hubspot.getProperties.useQuery(
    { objectType: 'deals' },
    { retry: false, refetchOnWindowFocus: false },
  );

  const isTokenMissing = !isCheckLoading && enabledCheck && !enabledCheck.enabled;
  const isApiError = !isCheckLoading && !!checkError;
  const hasConfigError = isTokenMissing || isApiError;

  const { data: propertiesData, isLoading: isLoadingProperties } =
    trpc.hubspot.getProperties.useQuery(
      { objectType: objectType as 'deals' | 'contacts' | 'companies' },
      {
        enabled: !!enabledCheck?.enabled && isExpanded && !hasConfigError,
        retry: false,
        refetchOnWindowFocus: false,
      },
    );

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
    <section>
      <div className="-mx-4 mt-1">
        <Separator />
      </div>

      <button
        type="button"
        className="flex w-full items-center gap-2 py-2.5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDownIcon className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronRightIcon className="text-muted-foreground h-4 w-4" />
        )}
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
        <span className="text-sm font-medium">
          <Trans>Mapping</Trans>
        </span>
        {value && !isExpanded && (
          <Badge variant="secondary" className="ml-auto text-[10px]">
            <LinkIcon className="mr-1 h-2.5 w-2.5" />
            {OBJECT_TYPE_LABELS[value.objectType] || value.objectType} → {value.propertyLabel}
          </Badge>
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2 pb-1">
          {hasConfigError ? (
            <div className="bg-destructive/10 border-destructive/30 rounded-md border p-3">
              <div className="flex items-start gap-2">
                <AlertTriangleIcon className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p className="text-destructive text-xs font-medium">
                    {isTokenMissing ? (
                      <Trans>HubSpot Access Token fehlt</Trans>
                    ) : (
                      <Trans>HubSpot-Verbindung fehlgeschlagen</Trans>
                    )}
                  </p>
                  <p className="text-muted-foreground text-[10px] leading-tight">
                    {isTokenMissing ? (
                      <Trans>
                        Setze NEXT_PRIVATE_HUBSPOT_ACCESS_TOKEN in der .env-Datei, um HubSpot-Properties zu laden.
                      </Trans>
                    ) : (
                      <Trans>
                        Der HubSpot Access Token ist ungültig oder abgelaufen. Prüfe NEXT_PRIVATE_HUBSPOT_ACCESS_TOKEN in der .env-Datei.
                      </Trans>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : value ? (
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

              <PropertySearchSelect
                properties={properties}
                isLoading={isLoadingProperties}
                onSelect={handlePropertyChange}
              />
            </>
          )}
        </div>
      )}
    </section>
  );
};

const PropertySearchSelect = ({
  properties,
  isLoading,
  onSelect,
}: {
  properties: { name: string; label: string }[];
  isLoading: boolean;
  onSelect: (propertyName: string) => void;
}) => {
  const { t } = useLingui();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return properties;
    }

    const lower = search.toLowerCase();

    return properties.filter(
      (p) =>
        p.label.toLowerCase().includes(lower) ||
        p.name.toLowerCase().includes(lower),
    );
  }, [properties, search]);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        <Trans>Property</Trans>
      </Label>
      <div className="relative">
        <SearchIcon className="text-muted-foreground absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
        <Input
          className="h-8 pl-7 text-xs"
          placeholder={isLoading ? t`Wird geladen...` : t`Property suchen...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="border rounded-md max-h-40 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground p-2 text-center text-xs">
            <Trans>Keine Property gefunden.</Trans>
          </p>
        ) : (
          filtered.map((prop) => (
            <button
              key={prop.name}
              type="button"
              className="hover:bg-accent w-full px-2 py-1.5 text-left text-xs transition-colors"
              onClick={() => {
                onSelect(prop.name);
                setSearch('');
              }}
            >
              {prop.label}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
