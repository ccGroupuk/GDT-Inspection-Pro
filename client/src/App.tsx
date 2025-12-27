import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/dashboard";
import Jobs from "@/pages/jobs";
import JobForm from "@/pages/job-form";
import JobDetail from "@/pages/job-detail";
import Contacts from "@/pages/contacts";
import Partners from "@/pages/partners";
import Tasks from "@/pages/tasks";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import PortalLogin from "@/pages/portal/login";
import PortalInvite from "@/pages/portal/invite";
import PortalJobs from "@/pages/portal/jobs";
import PortalJobDetail from "@/pages/portal/job-detail";
import PortalProfile from "@/pages/portal/profile";
import PortalReviews from "@/pages/portal/reviews";
import PartnerPortalLogin from "@/pages/partner-portal/login";
import PartnerPortalJobs from "@/pages/partner-portal/jobs";
import PartnerPortalJobDetail from "@/pages/partner-portal/job-detail";

function AdminRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/jobs/new" component={JobForm} />
      <Route path="/jobs/:id" component={JobDetail} />
      <Route path="/jobs/:id/edit" component={JobForm} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/partners" component={Partners} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/settings" component={Settings} />
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
      <Route path="/portal/profile" component={PortalProfile} />
      <Route path="/portal/reviews" component={PortalReviews} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PartnerPortalRouter() {
  return (
    <Switch>
      <Route path="/partner-portal/login" component={PartnerPortalLogin} />
      <Route path="/partner-portal/jobs/:jobId" component={PartnerPortalJobDetail} />
      <Route path="/partner-portal/jobs" component={PartnerPortalJobs} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminLayout() {
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
  const isPortalRoute = location.startsWith("/portal");
  const isPartnerPortalRoute = location.startsWith("/partner-portal");

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          {isPartnerPortalRoute ? <PartnerPortalRouter /> : 
           isPortalRoute ? <PortalRouter /> : <AdminLayout />}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
