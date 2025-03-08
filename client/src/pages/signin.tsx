import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePhone } from "@/contexts/PhoneContext";
import { useLocation } from "wouter";

export default function SignIn() {
  const { phoneNumber, setPhoneNumber, isAuthenticated } = usePhone();
  const [, setLocation] = useLocation();

  // Redirect to menu if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/menu');
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length === 10) {
      // Check if there's a stored redirect path, otherwise go to menu
      const redirectPath = localStorage.getItem('redirectAfterPhone') || '/menu';
      localStorage.removeItem('redirectAfterPhone');
      setLocation(redirectPath);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to Allergen Menu Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(XXX) XXX-XXXX"
                value={phoneNumber}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  if (cleaned.length <= 10) {
                    setPhoneNumber(cleaned);
                  }
                }}
                required
                pattern="[0-9]{10}"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={phoneNumber.length !== 10}
            >
              Continue to Menu
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 