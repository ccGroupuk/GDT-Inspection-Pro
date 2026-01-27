import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle2, Handshake, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const partnerSignupSchema = z.object({
    businessName: z.string().min(2, "Business name is required"),
    contactName: z.string().min(2, "Contact name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number is required"),
    tradeCategory: z.string().min(1, "Please select your primary trade"),
    coverageAreas: z.string().min(2, "Please specify your coverage areas (e.g. Postcodes or Towns)"),
    notes: z.string().optional(),
});

type PartnerSignupForm = z.infer<typeof partnerSignupSchema>;

export default function PartnerOnboardingPage() {
    const { toast } = useToast();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<PartnerSignupForm>({
        resolver: zodResolver(partnerSignupSchema),
        defaultValues: {
            businessName: "",
            contactName: "",
            email: "",
            phone: "",
            tradeCategory: "",
            coverageAreas: "",
            notes: "",
        },
    });

    const onSubmit = async (data: PartnerSignupForm) => {
        setIsSubmitting(true);
        try {
            await apiRequest("POST", "/api/public/partner-signup", data);
            setIsSubmitted(true);
            toast({
                title: "Application Submitted",
                description: "Thank you for your interest. We'll review your application and be in touch soon.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong. Please try again or contact us directly.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center py-8">
                    <CardContent className="space-y-4">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Application Received!</CardTitle>
                        <CardDescription className="text-base text-balance">
                            Your application to join the CCC Group trade network has been submitted. A member of our team will review your details and contact you shortly.
                        </CardDescription>
                        <Link href="/landing">
                            <Button variant="outline" className="mt-4">
                                Return to Landing Page
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-12 px-4 shadow-[inset_0_0_100px_rgba(0,0,0,0.05)]">
            <div className="w-full max-w-2xl">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg">
                        <Handshake className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">CCC Group Partner Network</h1>
                </div>

                <Card className="border-none shadow-2xl overflow-hidden glassmorphism">
                    <div className="h-2 bg-primary w-full" />
                    <CardHeader className="space-y-1 pb-8">
                        <CardTitle className="text-2xl">Join Our Trade Network</CardTitle>
                        <CardDescription className="text-base">
                            Apply to become a verified trade partner. We're always looking for high-quality tradespeople to work with.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="businessName">Business Name</Label>
                                    <Input
                                        id="businessName"
                                        placeholder="e.g. Smith Carpentry Ltd"
                                        {...form.register("businessName")}
                                        className={form.formState.errors.businessName ? "border-destructive" : ""}
                                    />
                                    {form.formState.errors.businessName && (
                                        <p className="text-xs text-destructive">{form.formState.errors.businessName.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactName">Main Contact Name</Label>
                                    <Input
                                        id="contactName"
                                        placeholder="John Smith"
                                        {...form.register("contactName")}
                                        className={form.formState.errors.contactName ? "border-destructive" : ""}
                                    />
                                    {form.formState.errors.contactName && (
                                        <p className="text-xs text-destructive">{form.formState.errors.contactName.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@smithcarpentry.com"
                                        {...form.register("email")}
                                        className={form.formState.errors.email ? "border-destructive" : ""}
                                    />
                                    {form.formState.errors.email && (
                                        <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        placeholder="07123 456 789"
                                        {...form.register("phone")}
                                        className={form.formState.errors.phone ? "border-destructive" : ""}
                                    />
                                    {form.formState.errors.phone && (
                                        <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Primary Trade</Label>
                                    <Select onValueChange={(v) => form.setValue("tradeCategory", v)}>
                                        <SelectTrigger className={form.formState.errors.tradeCategory ? "border-destructive" : ""}>
                                            <SelectValue placeholder="Select trade..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Carpenter">Carpenter</SelectItem>
                                            <SelectItem value="Plumbing">Plumbing</SelectItem>
                                            <SelectItem value="Electrical">Electrical</SelectItem>
                                            <SelectItem value="Heating">Heating</SelectItem>
                                            <SelectItem value="Plastering">Plastering</SelectItem>
                                            <SelectItem value="Tiling">Tiling</SelectItem>
                                            <SelectItem value="Fire Installs">Fire Installs</SelectItem>
                                            <SelectItem value="Decorating">Decorating</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.tradeCategory && (
                                        <p className="text-xs text-destructive">{form.formState.errors.tradeCategory.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="coverageAreas">Coverage Areas</Label>
                                    <Input
                                        id="coverageAreas"
                                        placeholder="e.g. CF10, CF11, Cardiff, Newport"
                                        {...form.register("coverageAreas")}
                                        className={form.formState.errors.coverageAreas ? "border-destructive" : ""}
                                    />
                                    {form.formState.errors.coverageAreas && (
                                        <p className="text-xs text-destructive">{form.formState.errors.coverageAreas.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Additional Information</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Tell us about your experience, certifications, or team size..."
                                    {...form.register("notes")}
                                    className="min-h-[100px]"
                                />
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg font-semibold group" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Submitting Application...
                                    </>
                                ) : (
                                    <>
                                        Submit Application
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center mt-8 text-slate-500 text-sm">
                    Already a partner? <Link href="/partner-portal" className="text-primary font-medium hover:underline">Login to Partner Portal</Link>
                </p>
            </div>
        </div>
    );
}
