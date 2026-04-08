import { useEffect, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileTextIcon } from 'lucide-react';

import { Progress } from '@documenso/ui/primitives/progress';

export interface DocumentConversionProgressCardProps {
  isConverting: boolean;
}

export const DocumentConversionProgressCard = ({
  isConverting,
}: DocumentConversionProgressCardProps) => {
  const { _ } = useLingui();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isConverting) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const increment = prev < 50 ? 5 : prev < 80 ? 2 : 1;
        return prev + increment;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isConverting]);

  return (
    <AnimatePresence>
      {isConverting && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-[9999] w-80 shadow-xl"
        >
          <div className="overflow-hidden rounded-xl border border-border bg-background p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileTextIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="text-sm font-semibold text-foreground">
                  {_(msg`Converting document...`)}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {_(msg`Please wait while your document is being converted to PDF.`)}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Progress value={progress} className="h-2 flex-1" />
                  <span className="w-8 text-right text-xs font-medium text-muted-foreground">
                    {progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
