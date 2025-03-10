import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { useTranslation } from "react-i18next";

export default function Cart() {
  const { t } = useTranslation();

  return (
    <CustomerLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-8">{t('nav.cart')}</h1>
        {/* Cart content will be implemented later */}
        <div className="text-muted-foreground">
          Cart functionality coming soon...
        </div>
      </div>
    </CustomerLayout>
  );
} 