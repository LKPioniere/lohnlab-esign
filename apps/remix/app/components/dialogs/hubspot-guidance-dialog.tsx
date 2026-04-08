import { useState } from 'react';

import { Trans } from '@lingui/react/macro';
import { CheckCircleIcon, FileUpIcon, LinkIcon, MousePointerClickIcon } from 'lucide-react';

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
    titleKey: 'Upload document',
    descriptionKey: 'Upload your contract or document as a PDF template.',
  },
  {
    icon: MousePointerClickIcon,
    titleKey: 'Place fields',
    descriptionKey:
      'Place text, number, or date fields on the document where HubSpot data should be filled in.',
  },
  {
    icon: LinkIcon,
    titleKey: 'Map HubSpot properties',
    descriptionKey:
      'For each field, select the corresponding HubSpot property (Deal, Contact, or Company) in the "HubSpot Mapping" section.',
  },
  {
    icon: CheckCircleIcon,
    titleKey: 'Save and use',
    descriptionKey:
      'Save the template. It will then be available in the HubSpot Deal sidebar for sending contracts pre-filled with deal data.',
  },
] as const;

export const HubspotGuidanceDialog = ({
  open,
  onOpenChange,
}: HubspotGuidanceDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
            <Trans>Create HubSpot template</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>
              Follow these steps to create a template that automatically fills
              in data from HubSpot.
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
                  {index + 1}. <Trans id={step.titleKey}>{step.titleKey}</Trans>
                </p>
                <p className="text-muted-foreground text-xs">
                  <Trans id={step.descriptionKey}>
                    {step.descriptionKey}
                  </Trans>
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            <Trans>Got it</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
