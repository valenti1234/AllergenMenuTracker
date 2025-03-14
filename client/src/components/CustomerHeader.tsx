import { Phone, LogOut, ShoppingCart } from "lucide-react";
import { usePhone } from "@/contexts/PhoneContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useSettings } from "@/contexts/SettingsContext";

export function CustomerHeader() {
  const { phoneNumber, signOut } = usePhone();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { getLocalizedName } = useSettings();

  const formatPhoneNumber = (phone: string) => {
    // Format phone number as (XXX) XXX-XXXX
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              {getLocalizedName()}
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <nav className="flex items-center">
              <Link href="/track">
                <Button variant="ghost">{t('nav.trackOrder')}</Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher
              currentLanguage={language}
              onLanguageChange={setLanguage}
            />
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="w-9 px-0" aria-label={t('nav.cart')}>
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
} 