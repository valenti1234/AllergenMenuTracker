import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { languages } from "@shared/schema";

export function LanguageSelector() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    // Optionally save the language preference
    localStorage.setItem("preferredLanguage", language);
  };

  return (
    <Select
      value={i18n.language}
      onValueChange={handleLanguageChange}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder={t(`admin.language.${i18n.language}`)} />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang} value={lang}>
            {t(`admin.language.${lang}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 