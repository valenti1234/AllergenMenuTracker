import { AdminLayout } from "@/components/admin/AdminLayout";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Code } from "lucide-react";

export default function ApiDocs() {
  const { t } = useTranslation();

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-8">{t("admin.apiDocs.title", "API Documentation")}</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("admin.apiDocs.swagger", "Swagger API Documentation")}</CardTitle>
            <CardDescription>
              {t("admin.apiDocs.swaggerDescription", "Interactive documentation for the AllergenMenuTracker API")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {t("admin.apiDocs.swaggerInfo", "The Swagger UI provides a comprehensive interface to explore and test the API endpoints. You can view request parameters, response schemas, and even try out API calls directly from the browser.")}
            </p>
            <Button asChild className="mt-4">
              <a href="/api-docs" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("admin.apiDocs.openSwagger", "Open Swagger UI")}
              </a>
            </Button>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.apiDocs.endpoints", "API Endpoints")}</CardTitle>
              <CardDescription>
                {t("admin.apiDocs.endpointsDescription", "Overview of available API endpoints")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <strong>/api/menu</strong> - {t("admin.apiDocs.menuEndpoint", "Menu item operations")}
                </li>
                <li>
                  <strong>/api/orders</strong> - {t("admin.apiDocs.ordersEndpoint", "Order management")}
                </li>
                <li>
                  <strong>/api/admin/metrics</strong> - {t("admin.apiDocs.metricsEndpoint", "Dashboard metrics")}
                </li>
                <li>
                  <strong>/api/users</strong> - {t("admin.apiDocs.usersEndpoint", "User management")}
                </li>
              </ul>
              <Button variant="outline" asChild className="mt-4">
                <a href="/api-docs" target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  {t("admin.apiDocs.viewDetails", "View Detailed Documentation")}
                </a>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.apiDocs.authentication", "Authentication")}</CardTitle>
              <CardDescription>
                {t("admin.apiDocs.authDescription", "How to authenticate with the API")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                {t("admin.apiDocs.authInfo", "The API uses cookie-based authentication. Most endpoints require authentication with appropriate user roles.")}
              </p>
              <div className="bg-muted p-4 rounded-md">
                <Code className="mb-2 h-4 w-4" />
                <pre className="text-sm overflow-x-auto">
                  <code>
                    POST /api/auth/login{"\n"}
                    {"{"}
                    {"\n"}  "username": "admin",{"\n"}  "password": "password"{"\n"}
                    {"}"}
                  </code>
                </pre>
              </div>
              <Button variant="outline" asChild className="mt-4">
                <a href="/api-docs#/Authentication" target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  {t("admin.apiDocs.authDocs", "Authentication Documentation")}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
} 