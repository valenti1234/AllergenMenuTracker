import { Route, Switch } from "wouter";
import { PhoneGuard } from "@/components/PhoneGuard";
import Menu from "@/pages/menu";
import TrackOrder from "@/pages/track";
import SignIn from "@/pages/signin";
import NotFound from "@/pages/not-found";
// ... other imports

export function Router() {
  return (
    <PhoneGuard>
      <Switch>
        <Route path="/signin" component={SignIn} />
        <Route path="/menu" component={Menu} />
        <Route path="/track" component={TrackOrder} />
        <Route path="/" component={SignIn} />
        <Route component={NotFound} />
      </Switch>
    </PhoneGuard>
  );
} 