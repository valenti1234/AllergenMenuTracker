import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useSettings } from "@/contexts/SettingsContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState({
    name: {
      en: "",
      it: "",
      es: ""
    },
    address: {
      en: "",
      it: "",
      es: ""
    },
    phone: "",
    email: "",
    website: "",
    logo: "",
    currency: "USD",
    taxRate: 0,
    serviceCharge: 0,
    openingHours: "",
    defaultLanguage: "en",
    theme: "system",
    enableOnlineOrdering: true,
    enableReservations: false,
    enableDelivery: false,
    deliveryRadius: 0,
    deliveryFee: 0,
    minimumOrderAmount: 0,
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
      yelp: ""
    },
    paymentOptions: {
      autoRedirectToPayment: true,
      payAtOrder: false
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const fetchSettings = async () => {
    try {
      // Use the public endpoint for fetching settings
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        const processedData = {
          ...data,
          name: data.name || { en: "", it: "", es: "" },
          address: data.address || { en: "", it: "", es: "" },
          socialMedia: data.socialMedia || { facebook: "", instagram: "", twitter: "", yelp: "" },
          paymentOptions: data.paymentOptions || { autoRedirectToPayment: true, payAtOrder: false },
          // Ensure numeric fields have default values
          taxRate: data.taxRate || 0,
          serviceCharge: data.serviceCharge || 0,
          deliveryRadius: data.deliveryRadius || 0,
          deliveryFee: data.deliveryFee || 0,
          minimumOrderAmount: data.minimumOrderAmount || 0
        };
        setSettings(processedData);
      } else {
        console.error("Failed to fetch settings:", response.status, response.statusText);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Ensure all required fields are present according to the schema
      const dataToSend = {
        ...settings,
        // Ensure name has all required language fields
        name: {
          en: settings.name?.en || "",
          it: settings.name?.it || "",
          es: settings.name?.es || ""
        },
        // Ensure paymentOptions is included
        paymentOptions: settings.paymentOptions || {
          autoRedirectToPayment: true,
          payAtOrder: false
        }
      };

      console.log("Sending settings data:", JSON.stringify(dataToSend, null, 2));

      // Use the admin endpoint for saving settings with PATCH method
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        credentials: "include", // Include cookies for authentication
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setSuccess(t("settings.saveSuccess"));
        setTimeout(() => setSuccess(null), 3000);
        
        // Refresh settings in the context to update the UI across the app
        await refreshSettings();
      } else {
        const errorData = await response.json();
        console.error("Settings save error:", errorData);
        setError(errorData.message || t("settings.saveError"));
      }
    } catch (err) {
      setError(t("settings.saveError"));
      console.error("Error saving settings:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (section: string, field: string, value: any) => {
    if (section === "name") {
      // Handle name field (multilingual) - update all languages to the same value
      setSettings({
        ...settings,
        name: {
          ...(settings.name || { en: "", it: "", es: "" }),
          en: value,
          it: value,
          es: value
        }
      });
    } else if (section === "address") {
      // Handle address field (multilingual)
      setSettings({
        ...settings,
        address: {
          ...(settings.address || { en: "", it: "", es: "" }),
          en: value // Update only English for simplicity
        }
      });
    } else if (section === "socialMedia") {
      // Handle nested socialMedia object
      setSettings({
        ...settings,
        socialMedia: {
          ...(settings.socialMedia || { facebook: "", instagram: "", twitter: "", yelp: "" }),
          [field]: value
        }
      });
    } else if (section === "paymentOptions") {
      // Handle paymentOptions object - assicuriamo che almeno una opzione sia sempre attiva
      const currentPaymentOptions = settings.paymentOptions || { autoRedirectToPayment: true, payAtOrder: false };
      
      // Se stiamo disattivando un'opzione e l'altra è già disattivata, non permettiamo l'aggiornamento
      if (field === "autoRedirectToPayment" && value === false && !currentPaymentOptions.payAtOrder) {
        console.log("Prevented both options from being false - keeping autoRedirect true");
        return; // Non aggiorniamo lo stato
      }
      
      if (field === "payAtOrder" && value === false && !currentPaymentOptions.autoRedirectToPayment) {
        console.log("Prevented both options from being false - keeping payAtOrder true");
        return; // Non aggiorniamo lo stato
      }
      
      // Se stiamo attivando un'opzione, disattiviamo l'altra
      const updatedPaymentOptions = {
        ...currentPaymentOptions,
        [field]: value
      };
      
      // Se stiamo attivando un'opzione, disattiviamo l'altra per mantenere l'esclusività
      if (value === true) {
        if (field === "autoRedirectToPayment") {
          updatedPaymentOptions.payAtOrder = false;
        } else if (field === "payAtOrder") {
          updatedPaymentOptions.autoRedirectToPayment = false;
        }
      }
      
      setSettings({
        ...settings,
        paymentOptions: updatedPaymentOptions
      });
    } else {
      // Handle regular fields
      setSettings({
        ...settings,
        [field]: value
      });
    }
  };

  const handleNestedUpdate = (path: string, value: any) => {
    const [section, field] = path.split('.');
    if (section && field) {
      handleChange(section, field, value);
    }
  };

  const PaymentOptionsSection = ({ 
    settings, 
    onUpdate 
  }: { 
    settings: any; 
    onUpdate: (field: string, value: any) => void;
  }) => {
    const { t } = useTranslation();
    
    // Assicuriamoci che paymentOptions esista e che almeno una opzione sia sempre attiva
    const paymentOptions = settings?.paymentOptions || { autoRedirectToPayment: true, payAtOrder: false };
    
    // Se entrambe sono false, impostiamo autoRedirectToPayment a true
    useEffect(() => {
      if (!paymentOptions.autoRedirectToPayment && !paymentOptions.payAtOrder) {
        console.log("Fixing payment options: both were false");
        onUpdate('paymentOptions.autoRedirectToPayment', true);
      }
    }, [paymentOptions.autoRedirectToPayment, paymentOptions.payAtOrder, onUpdate]);
    
    // Debug per verificare lo stato attuale
    console.log("=> Current payment options:", paymentOptions);
    
    // Funzione semplificata per gestire il cambio di stato di un'opzione
    const handleOptionChange = (option: string, checked: boolean) => {
      console.log(`Changing ${option} to ${checked}`);
      
      // Se stiamo attivando un'opzione
      if (checked) {
        // Attiviamo questa opzione e disattiviamo l'altra
        if (option === 'autoRedirectToPayment') {
          onUpdate('paymentOptions.autoRedirectToPayment', true);
          onUpdate('paymentOptions.payAtOrder', false);
        } else {
          onUpdate('paymentOptions.payAtOrder', true);
          onUpdate('paymentOptions.autoRedirectToPayment', false);
        }
      } else {
        // Se stiamo disattivando un'opzione, attiviamo l'altra
        // per garantire che almeno una sia sempre attiva
        if (option === 'autoRedirectToPayment') {
          onUpdate('paymentOptions.autoRedirectToPayment', false);
          onUpdate('paymentOptions.payAtOrder', true);
        } else {
          onUpdate('paymentOptions.payAtOrder', false);
          onUpdate('paymentOptions.autoRedirectToPayment', true);
        }
      }
    };
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('settings.paymentOptions')}</CardTitle>
          <CardDescription>{t('settings.paymentOptionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="autoRedirectToPayment">
              {t('settings.autoRedirectToPayment')}
            </Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="autoRedirectToPayment"
                checked={paymentOptions.autoRedirectToPayment}
                onCheckedChange={(checked) => handleOptionChange('autoRedirectToPayment', checked)}
              />
              <span className="text-sm text-muted-foreground">
                {t('settings.autoRedirectToPaymentDescription')}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="payAtOrder">
              {t('settings.payAtOrder')}
            </Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="payAtOrder"
                checked={paymentOptions.payAtOrder}
                onCheckedChange={(checked) => handleOptionChange('payAtOrder', checked)}
              />
              <span className="text-sm text-muted-foreground">
                {t('settings.payAtOrderDescription')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("admin.notAuthenticated")}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{t("settings.title")}</CardTitle>
          <CardDescription>{t("settings.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="restaurant" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="restaurant">{t("settings.restaurant")}</TabsTrigger>
                <TabsTrigger value="financial">{t("settings.financialSettings")}</TabsTrigger>
                <TabsTrigger value="localization">{t("settings.localization")}</TabsTrigger>
                <TabsTrigger value="ordering">{t("settings.ordering")}</TabsTrigger>
                <TabsTrigger value="social">{t("settings.social")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="restaurant">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-name">{t("settings.restaurantName")}</Label>
                      <Input
                        id="restaurant-name"
                        value={settings.name?.en || ""}
                        onChange={(e) => handleChange("name", "en", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-phone">{t("settings.phone")}</Label>
                      <Input
                        id="restaurant-phone"
                        value={settings.phone}
                        onChange={(e) => handleChange("", "phone", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-address">{t("settings.address")}</Label>
                    <Textarea
                      id="restaurant-address"
                      value={settings.address?.en || ""}
                      onChange={(e) => handleChange("address", "en", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-email">{t("settings.email")}</Label>
                    <Input
                      id="restaurant-email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => handleChange("", "email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-website">{t("settings.website") || "Website"}</Label>
                    <Input
                      id="restaurant-website"
                      value={settings.website}
                      onChange={(e) => handleChange("", "website", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-logo">{t("settings.logoUrl")}</Label>
                    <Input
                      id="restaurant-logo"
                      value={settings.logo}
                      onChange={(e) => handleChange("", "logo", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-hours">{t("settings.openingHours")}</Label>
                    <Textarea
                      id="restaurant-hours"
                      value={settings.openingHours}
                      onChange={(e) => handleChange("", "openingHours", e.target.value)}
                      placeholder={t("settings.openingHoursPlaceholder")}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="financial">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">{t("settings.currency")}</Label>
                      <Select
                        value={settings.currency}
                        onValueChange={(value) => handleChange("", "currency", value)}
                      >
                        <SelectTrigger id="currency">
                          <SelectValue placeholder={t("settings.selectCurrency")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                          <SelectItem value="CAD">CAD ($)</SelectItem>
                          <SelectItem value="AUD">AUD ($)</SelectItem>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax-rate">{t("settings.taxRate")}</Label>
                      <Input
                        id="tax-rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={settings.taxRate || 0}
                        onChange={(e) => handleChange("", "taxRate", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service-charge">{t("settings.serviceCharge")}</Label>
                      <Input
                        id="service-charge"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={settings.serviceCharge || 0}
                        onChange={(e) => handleChange("", "serviceCharge", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="localization">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="default-language">{t("settings.defaultLanguage")}</Label>
                      <Select
                        value={settings.defaultLanguage}
                        onValueChange={(value) => handleChange("", "defaultLanguage", value)}
                      >
                        <SelectTrigger id="default-language">
                          <SelectValue placeholder={t("settings.selectLanguage")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="it">Italiano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="theme">{t("settings.theme")}</Label>
                      <Select
                        value={settings.theme}
                        onValueChange={(value) => handleChange("", "theme", value)}
                      >
                        <SelectTrigger id="theme">
                          <SelectValue placeholder={t("settings.selectTheme")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">{t("settings.lightTheme")}</SelectItem>
                          <SelectItem value="dark">{t("settings.darkTheme")}</SelectItem>
                          <SelectItem value="system">{t("settings.systemTheme")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ordering">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="online-ordering"
                        checked={settings.enableOnlineOrdering}
                        onCheckedChange={(checked) => handleChange("", "enableOnlineOrdering", checked)}
                      />
                      <Label htmlFor="online-ordering">{t("settings.onlineOrdering")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="reservations"
                        checked={settings.enableReservations}
                        onCheckedChange={(checked) => handleChange("", "enableReservations", checked)}
                      />
                      <Label htmlFor="reservations">{t("settings.reservations")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="delivery"
                        checked={settings.enableDelivery}
                        onCheckedChange={(checked) => handleChange("", "enableDelivery", checked)}
                      />
                      <Label htmlFor="delivery">{t("settings.delivery")}</Label>
                    </div>
                  </div>
                  
                  {settings.enableDelivery && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="delivery-radius">Delivery Radius (km)</Label>
                        <Input
                          id="delivery-radius"
                          type="number"
                          min="0"
                          step="0.1"
                          value={settings.deliveryRadius || 0}
                          onChange={(e) => handleChange("", "deliveryRadius", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery-fee">Delivery Fee</Label>
                        <Input
                          id="delivery-fee"
                          type="number"
                          min="0"
                          step="0.01"
                          value={settings.deliveryFee || 0}
                          onChange={(e) => handleChange("", "deliveryFee", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="min-order">Minimum Order Amount</Label>
                        <Input
                          id="min-order"
                          type="number"
                          min="0"
                          step="0.01"
                          value={settings.minimumOrderAmount || 0}
                          onChange={(e) => handleChange("", "minimumOrderAmount", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="social">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">{t("settings.facebook")}</Label>
                    <Input
                      id="facebook"
                      value={settings.socialMedia?.facebook || ""}
                      onChange={(e) => handleChange("socialMedia", "facebook", e.target.value)}
                      placeholder="https://facebook.com/yourrestaurant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">{t("settings.instagram")}</Label>
                    <Input
                      id="instagram"
                      value={settings.socialMedia?.instagram || ""}
                      onChange={(e) => handleChange("socialMedia", "instagram", e.target.value)}
                      placeholder="https://instagram.com/yourrestaurant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">{t("settings.twitter")}</Label>
                    <Input
                      id="twitter"
                      value={settings.socialMedia?.twitter || ""}
                      onChange={(e) => handleChange("socialMedia", "twitter", e.target.value)}
                      placeholder="https://twitter.com/yourrestaurant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yelp">Yelp</Label>
                    <Input
                      id="yelp"
                      value={settings.socialMedia?.yelp || ""}
                      onChange={(e) => handleChange("socialMedia", "yelp", e.target.value)}
                      placeholder="https://yelp.com/biz/yourrestaurant"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <Separator className="my-6" />
            
            <PaymentOptionsSection settings={settings} onUpdate={handleNestedUpdate} />
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 border-green-500 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  {t("settings.saving")}
                </>
              ) : (
                t("settings.saveSettings")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default SettingsPage; 