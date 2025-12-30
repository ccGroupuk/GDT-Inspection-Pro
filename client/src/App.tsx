import { useState, useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { GlobalSearch } from "@/components/global-search";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import Jobs from "@/pages/jobs";
import JobForm from "@/pages/job-form";
import JobDetail from "@/pages/job-detail";
import Contacts from "@/pages/contacts";
import Partners from "@/pages/partners";
import Tasks from "@/pages/tasks";
import Finance from "@/pages/finance";
import CalendarPage from "@/pages/calendar";
import Settings from "@/pages/settings";
import SEOPowerHouse from "@/pages/seo";
import HelpCenterAdmin from "@/pages/help-center-admin";
import NotFound from "@/pages/not-found";
import PortalLogin from "@/pages/portal/login";
import PortalInvite from "@/pages/portal/invite";
import PortalJobs from "@/pages/portal/jobs";
import PortalJobDetail from "@/pages/portal/job-detail";
import PortalProfile from "@/pages/portal/profile";
import PortalReviews from "@/pages/portal/reviews";
import PortalSurveys from "@/pages/portal/surveys";
import PortalHelp from "@/pages/portal/help";
import PartnerPortalLogin from "@/pages/partner-portal/login";
import PartnerPortalInvite from "@/pages/partner-portal/invite";
import PartnerPortalJobs from "@/pages/partner-portal/jobs";
import PartnerPortalJobDetail from "@/pages/partner-portal/job-detail";
import PartnerPortalCalendar from "@/pages/partner-portal/calendar";
import PartnerPortalHelp from "@/pages/partner-portal/help";
import PartnerPortalProfile from "@/pages/partner-portal/profile";
import PartnerPortalSurveys from "@/pages/partner-portal/surveys";
import PartnerPortalQuotes from "@/pages/partner-portal/quotes";
import PartnerPortalEmergencyCallouts from "@/pages/partner-portal/emergency-callouts";
import Landing from "@/pages/landing";
import EmployeePortalLogin from "@/pages/employee-portal-login";
import EmployeePortalHome from "@/pages/employee-portal-home";
import EmployeePortalChangePassword from "@/pages/employee-portal-change-password";
import EmployeePortalAdminView from "@/pages/employee-portal-admin-view";
import EmployeesAdmin from "@/pages/employees-admin";
import EmergencyCallouts from "@/pages/emergency-callouts";
import Catalog from "@/pages/catalog";
import Suppliers from "@/pages/suppliers";
import QuoteTemplates from "@/pages/quote-templates";
import Assets from "@/pages/assets";
import JobHub from "@/pages/job-hub";
import Checklists from "@/pages/checklists";
import Wellbeing from "@/pages/wellbeing";
import Communications from "@/pages/communications";
import ProductFinder from "@/pages/product-finder";
import SupplierLookup from "@/pages/supplier-lookup";
import DailyActivities from "@/pages/daily-activities";

function AdminRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/jobs/new" component={JobForm} />
      <Route path="/jobs/:id" component={JobDetail} />
      <Route path="/jobs/:id/edit" component={JobForm} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/partners" component={Partners} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/finance" component={Finance} />
      <Route path="/employees" component={EmployeesAdmin} />
      <Route path="/employees/:employeeId/portal" component={EmployeePortalAdminView} />
      <Route path="/emergency-callouts" component={EmergencyCallouts} />
      <Route path="/catalog" component={Catalog} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/product-finder" component={ProductFinder} />
      <Route path="/supplier-lookup" component={SupplierLookup} />
      <Route path="/templates" component={QuoteTemplates} />
      <Route path="/assets" component={Assets} />
      <Route path="/checklists" component={Checklists} />
      <Route path="/communications" component={Communications} />
      <Route path="/daily-activities" component={DailyActivities} />
      <Route path="/seo" component={SEOPowerHouse} />
      <Route path="/wellbeing" component={Wellbeing} />
      <Route path="/help-center" component={HelpCenterAdmin} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function EmployeePortalRouter() {
  return (
    <Switch>
      <Route path="/employee-portal" component={EmployeePortalLogin} />
      <Route path="/employee-portal/login" component={EmployeePortalLogin} />
      <Route path="/employee-portal/home" component={EmployeePortalHome} />
      <Route path="/employee-portal/change-password" component={EmployeePortalChangePassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PortalRouter() {
  return (
    <Switch>
      <Route path="/portal/login" component={PortalLogin} />
      <Route path="/portal/invite/:token" component={PortalInvite} />
      <Route path="/portal/jobs/:jobId" component={PortalJobDetail} />
      <Route path="/portal/jobs" component={PortalJobs} />
      <Route path="/portal/surveys" component={PortalSurveys} />
      <Route path="/portal/profile" component={PortalProfile} />
      <Route path="/portal/reviews" component={PortalReviews} />
      <Route path="/portal/help" component={PortalHelp} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PartnerPortalRouter() {
  return (
    <Switch>
      <Route path="/partner-portal/login" component={PartnerPortalLogin} />
      <Route path="/partner-portal/invite/:token" component={PartnerPortalInvite} />
      <Route path="/partner-portal/jobs/:jobId" component={PartnerPortalJobDetail} />
      <Route path="/partner-portal/jobs" component={PartnerPortalJobs} />
      <Route path="/partner-portal/surveys" component={PartnerPortalSurveys} />
      <Route path="/partner-portal/quotes/new" component={PartnerPortalQuotes} />
      <Route path="/partner-portal/quotes" component={PartnerPortalQuotes} />
      <Route path="/partner-portal/emergency-callouts" component={PartnerPortalEmergencyCallouts} />
      <Route path="/partner-portal/calendar" component={PartnerPortalCalendar} />
      <Route path="/partner-portal/help" component={PartnerPortalHelp} />
      <Route path="/partner-portal/profile" component={PartnerPortalProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedAdminLayout() {
  const { isLoading, isAuthenticated, hasAdminAccess } = useAuth();
  const [location, setLocation] = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setShouldRedirect("/landing");
      } else if (!hasAdminAccess) {
        setShouldRedirect("/employee-portal/home");
      } else {
        setShouldRedirect(null);
      }
    }
  }, [isLoading, isAuthenticated, hasAdminAccess]);

  useEffect(() => {
    if (shouldRedirect) {
      setLocation(shouldRedirect);
    }
  }, [shouldRedirect, setLocation]);

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (shouldRedirect) {
    return <AuthLoadingScreen />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 px-4 h-14 border-b border-border shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <GlobalSearch />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <AdminRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  const [location] = useLocation();
  const isLandingPage = location === "/landing";
  const isPortalRoute = location.startsWith("/portal");
  const isPartnerPortalRoute = location.startsWith("/partner-portal");
  const isEmployeePortalRoute = location.startsWith("/employee-portal");
  const isJobHubRoute = location.startsWith("/job-hub");

  const getContent = () => {
    if (isLandingPage) return <Landing />;
    if (isJobHubRoute) return <Route path="/job-hub/:token" component={JobHub} />;
    if (isPartnerPortalRoute) return <PartnerPortalRouter />;
    if (isPortalRoute) return <PortalRouter />;
    if (isEmployeePortalRoute) return <EmployeePortalRouter />;
    return <ProtectedAdminLayout />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          {getContent()}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
