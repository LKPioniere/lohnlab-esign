import { useEffect, useRef } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';

import {
  DEFAULT_DOCUMENT_DATE_FORMAT,
  DATE_FORMATS,
} from '@documenso/lib/constants/date-formats';
import {
  type TDateFieldMeta as DateFieldMeta,
  FIELD_DEFAULT_GENERIC_ALIGN,
  type THubspotMapping,
  ZDateFieldMeta,
} from '@documenso/lib/types/field-meta';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from '@documenso/ui/primitives/form/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';

import {
  EditorGenericFontSizeField,
  EditorGenericTextAlignField,
} from './editor-field-generic-field-forms';
import { EditorFieldHubspotMapping } from './editor-field-hubspot-mapping';

const ZDateFieldFormSchema = ZDateFieldMeta.pick({
  fontSize: true,
  textAlign: true,
  dateMode: true,
  dateFormat: true,
});

type TDateFieldFormSchema = z.infer<typeof ZDateFieldFormSchema>;

type EditorFieldDateFormProps = {
  value: DateFieldMeta | undefined;
  onValueChange: (value: DateFieldMeta) => void;
};

export const EditorFieldDateForm = ({
  value = {
    type: 'date',
  },
  onValueChange,
}: EditorFieldDateFormProps) => {
  const { t } = useLingui();

  const hubspotMappingRef = useRef<THubspotMapping | undefined>(
    value.hubspotMapping ?? undefined,
  );

  const form = useForm<TDateFieldFormSchema>({
    resolver: zodResolver(ZDateFieldFormSchema),
    mode: 'onChange',
    defaultValues: {
      fontSize: value.fontSize,
      textAlign: value.textAlign ?? FIELD_DEFAULT_GENERIC_ALIGN,
      dateMode: value.dateMode ?? 'auto',
      dateFormat: value.dateFormat,
    },
  });

  const { control } = form;

  const formValues = useWatch({
    control,
  });

  useEffect(() => {
    const validatedFormValues = ZDateFieldFormSchema.safeParse(formValues);

    if (validatedFormValues.success) {
      onValueChange({
        type: 'date',
        ...validatedFormValues.data,
        hubspotMapping: hubspotMappingRef.current,
      });
    }
  }, [formValues]);

  const handleHubspotMappingChange = (mapping: THubspotMapping | undefined) => {
    hubspotMappingRef.current = mapping;

    const currentValues = form.getValues();
    const validatedFormValues = ZDateFieldFormSchema.safeParse(currentValues);

    if (validatedFormValues.success) {
      onValueChange({
        type: 'date',
        ...validatedFormValues.data,
        hubspotMapping: mapping,
      });
    }
  };

  return (
    <Form {...form}>
      <form>
        <fieldset className="flex flex-col gap-2">
          <FormField
            control={control}
            name="dateMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans>Date Mode</Trans>
                </FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="field-form-dateMode">
                      <SelectValue placeholder={t`Select date mode`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        <Trans>Automatic (current date)</Trans>
                      </SelectItem>
                      <SelectItem value="custom">
                        <Trans>Fillable by signer</Trans>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="dateFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans>Date Format</Trans>
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value ?? '__default__'}
                    onValueChange={(val) =>
                      field.onChange(val === '__default__' ? undefined : val)
                    }
                  >
                    <SelectTrigger data-testid="field-form-dateFormat">
                      <SelectValue placeholder={t`Document default`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__default__">
                        <Trans>Document default</Trans>
                      </SelectItem>
                      {DATE_FORMATS.map((format) => (
                        <SelectItem key={format.key} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <EditorGenericFontSizeField formControl={form.control} />

          <EditorGenericTextAlignField formControl={form.control} />

          <EditorFieldHubspotMapping
            value={hubspotMappingRef.current}
            onValueChange={handleHubspotMappingChange}
          />
        </fieldset>
      </form>
    </Form>
  );
};
