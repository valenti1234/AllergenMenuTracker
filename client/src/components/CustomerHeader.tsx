import { Phone, LogOut, ShoppingCart, Menu as MenuIcon, X } from "lucide-react";
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
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";

export function CustomerHeader() {
  const { phoneNumber, signOut } = usePhone();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { getLocalizedName } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cartItemCount = useCart();

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
      <div className="container flex h-14 items-center justify-between">
        {/* Logo - visible on all screens */}
        <div className="flex items-center">
          <Link href="/menu" className="flex items-center space-x-2">
            <span className="font-bold text-lg">
              {getLocalizedName()}
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <nav className="flex items-center">
            <Link href="/track">
              <Button variant="outline" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t('nav.trackOrder')}
              </Button>
            </Link>
          </nav>
          <LanguageSwitcher
            currentLanguage={language}
            onLanguageChange={setLanguage}
          />
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="w-9 px-0 relative" aria-label={t('nav.cart')}>
              <ShoppingCart className="h-4 w-4" />
              {cartItemCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center space-x-2">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="w-9 px-0 relative" aria-label={t('nav.cart')}>
              <ShoppingCart className="h-4 w-4" />
              {cartItemCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 px-0">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col h-full py-6">
                <div className="flex-1 space-y-4">
                  <div className="px-2">
                    <h2 className="text-lg font-semibold mb-2">{t('common.menu')}</h2>
                    <nav className="flex flex-col space-y-3">
                      <Link href="/menu">
                        <Button variant="ghost" className="w-full justify-start">
                          {t('nav.menu')}
                        </Button>
                      </Link>
                      <Link href="/track">
                        <Button variant="ghost" className="w-full justify-start">
                          {t('nav.trackOrder')}
                        </Button>
                      </Link>
                      <Link href="/cart">
                        <Button variant="ghost" className="w-full justify-start flex items-center">
                          {t('nav.cart')}
                          {cartItemCount > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                              {cartItemCount}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                    </nav>
                  </div>
                  
                  <div className="px-2 pt-4 border-t">
                    <h2 className="text-lg font-semibold mb-2">{t('admin.language.select')}</h2>
                    <div className="grid gap-2">
                      <LanguageSwitcher
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                        vertical={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
} 