import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Briefcase, Clock, Sparkles, Handshake } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-landing-title">CCC Group</h1>
          <p className="text-muted-foreground">Cardiff & Caerphilly Carpentry Portal</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover-elevate">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                <CardTitle>Admin Portal</CardTitle>
              </div>
              <CardDescription>
                Full CRM access for managing jobs, clients, partners, and finances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button className="w-full" data-testid="button-admin-login">
                  Admin Login
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                <CardTitle>Staff Login</CardTitle>
              </div>
              <CardDescription>
                Owner, managers, and employees. Access admin panel or timecard based on your access level.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/employee-portal">
                <Button className="w-full" data-testid="button-employee-login">
                  Staff Login
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <CardTitle>Client Portal</CardTitle>
              </div>
              <CardDescription>
                View your projects, accept quotes, and track progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/client-portal-login">
                <Button className="w-full" variant="outline" data-testid="button-client-login">
                  Client Login
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground text-center">
                Login with email and password
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" />
                <CardTitle>Partner Portal</CardTitle>
              </div>
              <CardDescription>
                Access assigned jobs, view schedules, and submit proposals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/partner-portal/login">
                <Button className="w-full" variant="outline" data-testid="button-partner-login">
                  Partner Login
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-elevate bg-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <CardTitle>New Client Inquiry</CardTitle>
              </div>
              <CardDescription>
                Interested in working with us? Request a custom quote for your project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/enquiry">
                <Button className="w-full shadow-lg" data-testid="button-request-quote">
                  Get a Quote
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-elevate bg-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Handshake className="h-6 w-6 text-primary" />
                <CardTitle>Join our Trade Network</CardTitle>
              </div>
              <CardDescription>
                Are you a skilled tradesperson? Apply to join our network of trusted partners.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/partner-onboarding">
                <Button className="w-full shadow-lg" variant="outline" data-testid="button-partner-onboarding">
                  Apply Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Need help? Contact us at info@cccgroup.co.uk
        </p>
      </div>
    </div>
  );
}
