import { useState } from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { createCallable } from 'react-call';

import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@documenso/ui/primitives/dialog';
import { Input } from '@documenso/ui/primitives/input';

export type SignFieldDateDialogProps = {
  dateFormat?: string;
};

export const SignFieldDateDialog = createCallable<SignFieldDateDialogProps, string | null>(
  ({ call, dateFormat }) => {
    const { t } = useLingui();

    const [dateValue, setDateValue] = useState('');

    const handleSubmit = () => {
      if (!dateValue) {
        return;
      }

      call.end(dateValue);
    };

    return (
      <Dialog open={true} onOpenChange={(value) => (!value ? call.end(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans>Enter Date</Trans>
            </DialogTitle>

            <DialogDescription className="mt-4">
              <Trans>Please select a date.</Trans>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              placeholder={t`Select a date`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => call.end(null)}>
              <Trans>Cancel</Trans>
            </Button>

            <Button type="button" onClick={handleSubmit} disabled={!dateValue}>
              <Trans>Confirm</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
