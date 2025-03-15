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

  const handleSubscribe = () => {
    // Aggiorna il localStorage con la scelta dell'utente
    updateLocalStorageWithSubscription(true);
    onSubscribe();
  };

  const handleSkip = () => {
    // Aggiorna il localStorage con la scelta dell'utente
    updateLocalStorageWithSubscription(false);
    onSkip();
  };

  // Funzione per aggiornare il localStorage
  const updateLocalStorageWithSubscription = (subscribe: boolean) => {
    try {
      const customerInfoStr = localStorage.getItem('customerInfo');
      if (customerInfoStr) {
        const customerInfo = JSON.parse(customerInfoStr);
        
        // Aggiorna il campo subscribeToNewsletter
        const updatedInfo = {
          ...customerInfo,
          subscribeToNewsletter: subscribe
        };
        
        console.log('Updating customer info with newsletter choice:', updatedInfo);
        localStorage.setItem('customerInfo', JSON.stringify(updatedInfo));
      }
    } catch (error) {
      console.error('Error updating customer info:', error);
    }
  };

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
          <Button onClick={handleSubscribe} className="w-full">
            {t('newsletter.subscribe')}
          </Button>
          <Button variant="outline" onClick={handleSkip} className="w-full">
            {t('newsletter.skip')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 