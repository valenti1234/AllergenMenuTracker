import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { posTypes } from "@shared/schema";

const posSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  type: z.enum(["none", "stripe", "square", "clover"]).default("none"),
  apiKey: z.string().optional(),
  publishableKey: z.string().optional(),
});

type POSSettingsFormValues = z.infer<typeof posSettingsSchema>;

interface POSIntegrationConfig {
  apiKey?: string;
  publishableKey?: string;
}

interface POSIntegration {
  enabled: boolean;
  type: string;
  config?: POSIntegrationConfig;
}

interface AppSettings {
  posIntegration?: POSIntegration;
  [key: string]: any;
}

export default function POSSettings() {
  const { toast } = useToast();
  const [posType, setPosType] = useState<string>("none");
  
  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });
  
  const form = useForm<POSSettingsFormValues>({
    resolver: zodResolver(posSettingsSchema),
    defaultValues: {
      enabled: settings?.posIntegration?.enabled || false,
      type: settings?.posIntegration?.type || "none",
      apiKey: settings?.posIntegration?.config?.apiKey || "",
      publishableKey: settings?.posIntegration?.config?.publishableKey || "",
    },
  });
  
  useEffect(() => {
    if (settings && settings.posIntegration) {
      form.reset({
        enabled: settings.posIntegration.enabled || false,
        type: settings.posIntegration.type || "none",
        apiKey: settings.posIntegration.config?.apiKey || "",
        publishableKey: settings.posIntegration.config?.publishableKey || "",
      });
      setPosType(settings.posIntegration.type || "none");
    }
  }, [settings, form]);
  
  const updateMutation = useMutation({
    mutationFn: (data: POSSettingsFormValues) => apiRequest("PATCH", "/api/settings", {
      posIntegration: {
        enabled: data.enabled,
        type: data.type,
        config: {
          apiKey: data.apiKey,
          publishableKey: data.publishableKey,
        }
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "POS settings updated successfully",
      });
    },
  });
  
  const testConnectionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/pos/test-connection"),
    onSuccess: () => {
      toast({
        title: "Connection Successful",
        description: "Successfully connected to Stripe",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Stripe",
      });
    },
  });
  
  const onSubmit = (data: POSSettingsFormValues) => {
    updateMutation.mutate(data);
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">POS Integration Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Point of Sale Integration</CardTitle>
            <CardDescription>
              Connect your restaurant to a POS system to synchronize orders and process payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Enable POS Integration</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>POS System</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setPosType(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select POS system" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="stripe">Stripe Terminal</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="clover">Clover</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {posType === "stripe" && (
                  <div className="space-y-4 mt-4 p-4 border rounded-md">
                    <h3 className="text-lg font-medium">Stripe Terminal Configuration</h3>
                    
                    <FormField
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stripe Secret Key</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="sk_test_..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="publishableKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stripe Publishable Key</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="pk_test_..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => testConnectionMutation.mutate()}
                        disabled={testConnectionMutation.isPending}
                      >
                        {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
                      </Button>
                    </div>
                  </div>
                )}
                
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
} 