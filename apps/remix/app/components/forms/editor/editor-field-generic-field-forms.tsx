import { useEffect } from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from 'lucide-react';
import { type Control, useFormContext } from 'react-hook-form';

import { FIELD_MIN_LINE_HEIGHT } from '@documenso/lib/types/field-meta';
import { FIELD_MAX_LINE_HEIGHT } from '@documenso/lib/types/field-meta';
import { FIELD_MIN_LETTER_SPACING } from '@documenso/lib/types/field-meta';
import { FIELD_MAX_LETTER_SPACING } from '@documenso/lib/types/field-meta';
import { cn } from '@documenso/ui/lib/utils';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form/form';
import { Input } from '@documenso/ui/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';

// Can't seem to get the non-any type to work with correct types.
// Eg Control<{ fontSize?: number } doesn't seem to work when there are required items.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormControlType = Control<any>;

const FONT_SIZE_OPTIONS = [
  { value: 'auto', label: 'Automatisch' },
  { value: '8', label: '8' },
  { value: '10', label: '10' },
  { value: '12', label: '12' },
  { value: '14', label: '14' },
  { value: '16', label: '16' },
  { value: '18', label: '18' },
  { value: '20', label: '20' },
  { value: '24', label: '24' },
  { value: '28', label: '28' },
  { value: '32', label: '32' },
  { value: '36', label: '36' },
  { value: '48', label: '48' },
  { value: '64', label: '64' },
  { value: '72', label: '72' },
  { value: '96', label: '96' },
] as const;

export const EditorGenericFontSizeField = ({
  formControl,
  className,
}: {
  formControl: FormControlType;
  className?: string;
}) => {
  const { t } = useLingui();

  return (
    <FormField
      control={formControl}
      name="fontSize"
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            <Trans>Font Size</Trans>
          </FormLabel>
          <FormControl>
            <Select
              value={field.value === undefined || field.value === null ? 'auto' : String(field.value)}
              onValueChange={(value) => {
                field.onChange(value === 'auto' ? undefined : Number(value));
              }}
            >
              <SelectTrigger data-testid="field-form-fontSize">
                <SelectValue placeholder={t`Automatic`} />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.value === 'auto' ? t`Automatic` : option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const EditorGenericTextAlignField = ({
  formControl,
  className,
}: {
  formControl: FormControlType;
  className?: string;
}) => {
  const { t } = useLingui();

  return (
    <FormField
      control={formControl}
      name="textAlign"
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            <Trans>Text Align</Trans>
          </FormLabel>
          <FormControl>
            <Select {...field} onValueChange={field.onChange}>
              <SelectTrigger data-testid="field-form-textAlign">
                <SelectValue placeholder={t`Select text align`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">
                  <span className="flex items-center gap-2">
                    <AlignLeftIcon className="h-4 w-4" />
                    <Trans>Left</Trans>
                  </span>
                </SelectItem>
                <SelectItem value="center">
                  <span className="flex items-center gap-2">
                    <AlignCenterIcon className="h-4 w-4" />
                    <Trans>Center</Trans>
                  </span>
                </SelectItem>
                <SelectItem value="right">
                  <span className="flex items-center gap-2">
                    <AlignRightIcon className="h-4 w-4" />
                    <Trans>Right</Trans>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const EditorGenericVerticalAlignField = ({
  formControl,
  className,
}: {
  formControl: FormControlType;
  className?: string;
}) => {
  const { t } = useLingui();

  return (
    <FormField
      control={formControl}
      name="verticalAlign"
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            <Trans>Vertical Align</Trans>
          </FormLabel>
          <FormControl>
            <Select {...field} onValueChange={field.onChange}>
              <SelectTrigger data-testid="field-form-verticalAlign">
                <SelectValue placeholder={t`Select vertical align`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">
                  <Trans>Top</Trans>
                </SelectItem>
                <SelectItem value="middle">
                  <Trans>Middle</Trans>
                </SelectItem>
                <SelectItem value="bottom">
                  <Trans>Bottom</Trans>
                </SelectItem>
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const EditorGenericLineHeightField = ({
  formControl,
  className,
}: {
  formControl: FormControlType;
  className?: string;
}) => {
  const { t } = useLingui();

  return (
    <FormField
      control={formControl}
      name="lineHeight"
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            <Trans>Line Height</Trans>
          </FormLabel>
          <FormControl>
            <Input
              data-testid="field-form-lineHeight"
              type="number"
              min={FIELD_MIN_LINE_HEIGHT}
              max={FIELD_MAX_LINE_HEIGHT}
              className="bg-background"
              placeholder={t`Line height`}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const EditorGenericLetterSpacingField = ({
  formControl,
  className,
}: {
  formControl: FormControlType;
  className?: string;
}) => {
  const { t } = useLingui();

  return (
    <FormField
      control={formControl}
      name="letterSpacing"
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            <Trans>Letter Spacing</Trans>
          </FormLabel>
          <FormControl>
            <Input
              data-testid="field-form-letterSpacing"
              type="number"
              min={FIELD_MIN_LETTER_SPACING}
              max={FIELD_MAX_LETTER_SPACING}
              className="bg-background"
              placeholder={t`Letter spacing`}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const EditorGenericRequiredField = ({
  formControl,
  className,
}: {
  formControl: FormControlType;
  className?: string;
}) => {
  const { watch, setValue } = useFormContext();

  const readOnly = watch('readOnly');

  useEffect(() => {
    if (readOnly) {
      setValue('required', false);
    }
  }, [readOnly]);

  return (
    <FormField
      control={formControl}
      name="required"
      render={({ field }) => (
        <FormItem className={cn('flex items-center space-x-2', className)}>
          <FormControl>
            <div className="flex items-center">
              <Checkbox
                data-testid="field-form-required"
                id="field-required"
                checked={field.value}
                onCheckedChange={field.onChange}
              />

              <label className="ml-2 text-sm text-muted-foreground" htmlFor="field-required">
                <Trans>Required Field</Trans>
              </label>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const EditorGenericReadOnlyField = ({
  formControl,
  className,
}: {
  formControl: FormControlType;
  className?: string;
}) => {
  const { watch, setValue } = useFormContext();

  const required = watch('required');

  useEffect(() => {
    if (required) {
      setValue('readOnly', false);
    }
  }, [required]);

  return (
    <FormField
      control={formControl}
      name="readOnly"
      render={({ field }) => (
        <FormItem className={cn('flex items-center space-x-2', className)}>
          <FormControl>
            <div className="flex items-center">
              <Checkbox
                data-testid="field-form-readOnly"
                id="field-read-only"
                checked={field.value}
                onCheckedChange={field.onChange}
              />

              <label className="ml-2 text-sm text-muted-foreground" htmlFor="field-read-only">
                <Trans>Read Only</Trans>
              </label>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const EditorGenericLabelField = ({
  formControl,
  className,
}: {
  formControl: FormControlType;
  className?: string;
}) => {
  const { t } = useLingui();

  return (
    <FormField
      control={formControl}
      name="label"
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            <Trans>Label</Trans>
          </FormLabel>
          <FormControl>
            <Input data-testid="field-form-label" placeholder={t`Field label`} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
