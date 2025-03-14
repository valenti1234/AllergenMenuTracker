import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface NewsletterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: () => void;
  onSkip: () => void;
}

export function NewsletterDialog({
  open,
  onOpenChange,
  onSubscribe,
  onSkip,
}: NewsletterDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('newsletter.title')}</DialogTitle>
          <DialogDescription>
            {t('newsletter.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-4">
          <Button onClick={onSubscribe} className="w-full">
            {t('newsletter.subscribe')}
          </Button>
          <Button variant="outline" onClick={onSkip} className="w-full">
            {t('newsletter.skip')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 