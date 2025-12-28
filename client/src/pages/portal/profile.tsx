import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PortalLayout } from "@/components/portal-layout";
import { usePortalAuth, portalApiRequest } from "@/hooks/use-portal-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User, Loader2, Save, Lock, ShieldCheck } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().optional().or(z.literal("")),
  postcode: z.string().optional().or(z.literal("")),
});

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface PortalProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  postcode: string | null;
}

export default function PortalProfile() {
  const { token, isAuthenticated } = usePortalAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/portal/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: profile, isLoading } = useQuery<PortalProfile>({
    queryKey: ["/api/portal/profile"],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const response = await portalApiRequest("GET", "/api/portal/profile", token);
      if (!response.ok) {
        if (response.status === 401) {
          setLocation("/portal/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
    enabled: !!token,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      postcode: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        postcode: profile.postcode || "",
      });
    }
  }, [profile, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!token) throw new Error("No token");
      const response = await portalApiRequest("PATCH", "/api/portal/profile", token, data);
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/profile"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateMutation.mutate(data);
  };

  const { data: hasPasswordData } = useQuery<{ hasPassword: boolean }>({
    queryKey: ["/api/portal/has-password"],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const response = await portalApiRequest("GET", "/api/portal/has-password", token);
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
      const response = await portalApiRequest("POST", "/api/portal/set-password", token, { password: data.password });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to set password");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/has-password"] });
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-profile-title">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your contact information
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
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
                  <CardTitle className="text-base">Contact Details</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Your full name"
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="your@email.com"
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Your phone number"
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Your address"
                            data-testid="input-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Your postcode"
                            data-testid="input-postcode"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
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
    </PortalLayout>
  );
}
