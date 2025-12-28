import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { usePartnerPortalAuth } from "@/hooks/use-partner-portal-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User, Loader2, Save, Lock, ShieldCheck, ArrowLeft, LogOut, Briefcase } from "lucide-react";

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface PartnerProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  specialty: string | null;
}

export default function PartnerPortalProfile() {
  const { token, isAuthenticated, logout } = usePartnerPortalAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/partner-portal/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: profile, isLoading } = useQuery<PartnerProfile>({
    queryKey: ["/api/partner-portal/profile"],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const response = await fetch("/api/partner-portal/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          setLocation("/partner-portal/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
    enabled: !!token,
  });

  const { data: hasPasswordData } = useQuery<{ hasPassword: boolean }>({
    queryKey: ["/api/partner-portal/has-password"],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const response = await fetch("/api/partner-portal/has-password", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to check password status");
      }
      return response.json();
    },
    enabled: !!token,
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      if (!token) throw new Error("No token");
      const response = await fetch("/api/partner-portal/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: data.password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to set password");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-portal/has-password"] });
      passwordForm.reset();
      setShowPasswordForm(false);
      toast({
        title: "Password Set",
        description: "Your password has been saved. You can now log in with your email and password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onPasswordSubmit = (data: PasswordFormValues) => {
    setPasswordMutation.mutate(data);
  };

  const handleLogout = () => {
    logout();
    setLocation("/partner-portal/login");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/partner-portal/jobs">
              <Button variant="ghost" size="sm" data-testid="button-back-to-jobs">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/partner-portal/jobs">
              <Button variant="ghost" size="sm">
                <Briefcase className="w-4 h-4 mr-2" />
                Jobs
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-profile-title">My Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View your profile and manage security settings
            </p>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Partner Details</CardTitle>
                    <CardDescription>Your registered information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Name</label>
                    <p className="font-medium">{profile?.name || "-"}</p>
                  </div>
                  {profile?.company && (
                    <div>
                      <label className="text-sm text-muted-foreground">Company</label>
                      <p className="font-medium">{profile.company}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Email</label>
                      <p className="font-medium">{profile?.email || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Phone</label>
                      <p className="font-medium">{profile?.phone || "-"}</p>
                    </div>
                  </div>
                  {profile?.specialty && (
                    <div>
                      <label className="text-sm text-muted-foreground">Specialty</label>
                      <p className="font-medium">{profile.specialty}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-2">
                    To update your details, please contact the CCC Group team.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Security Settings</CardTitle>
                  <CardDescription>Set a password for easier login</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Password Status:</span>
                    {hasPasswordData?.hasPassword ? (
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Password Set
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Set</Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    data-testid="button-toggle-password-form"
                  >
                    {hasPasswordData?.hasPassword ? "Change Password" : "Set Password"}
                  </Button>
                </div>

                {showPasswordForm && (
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 pt-4 border-t">
                      <FormField
                        control={passwordForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="Enter a new password"
                                data-testid="input-new-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="Confirm your password"
                                data-testid="input-confirm-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="submit"
                          disabled={setPasswordMutation.isPending}
                          data-testid="button-save-password"
                        >
                          {setPasswordMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Password
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setShowPasswordForm(false);
                            passwordForm.reset();
                          }}
                          data-testid="button-cancel-password"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}

                <p className="text-xs text-muted-foreground">
                  Setting a password allows you to log in using your email address instead of needing the access link each time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
