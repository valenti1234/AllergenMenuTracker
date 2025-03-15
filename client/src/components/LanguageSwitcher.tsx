import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';
import { Language, languages, getLanguageName } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  vertical?: boolean;
}

export function LanguageSwitcher({ 
  currentLanguage, 
  onLanguageChange, 
  vertical = false 
}: LanguageSwitcherProps) {
  if (vertical) {
    return (
      <div className="flex flex-col space-y-2">
        {languages.map((lang) => (
          <Button
            key={lang}
            variant={currentLanguage === lang ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => onLanguageChange(lang)}
          >
            {getLanguageName(lang)}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 px-0">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => onLanguageChange(lang)}
            className={currentLanguage === lang ? 'bg-accent' : ''}
          >
            {getLanguageName(lang)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 