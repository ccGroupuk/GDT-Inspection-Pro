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
import { Loader2, CheckCircle2, Building2, ArrowRight, Upload, X } from "lucide-react";
import { Link } from "wouter";

const enquirySchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number is required"),
    address: z.string().min(5, "Address is required"),
    postcode: z.string().min(5, "Postcode is required"),
    serviceType: z.string().min(1, "Please select a service type"),
    description: z.string().min(10, "Please provide some detail about the project"),
    timeframe: z.string().optional(),
});

type EnquiryForm = z.infer<typeof enquirySchema>;

export default function EnquiryPage() {
    const { toast } = useToast();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const form = useForm<EnquiryForm>({
        resolver: zodResolver(enquirySchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            address: "",
            postcode: "",
            serviceType: "",
            description: "",
            timeframe: "flexible",
        },
    });

    const onSubmit = async (data: EnquiryForm) => {
        setIsSubmitting(true);
        try {
            // Create FormData for multipart upload
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('email', data.email);
            formData.append('phone', data.phone);
            formData.append('address', data.address);
            formData.append('postcode', data.postcode);
            formData.append('serviceType', data.serviceType);
            formData.append('description', data.description);
            if (data.timeframe) {
                formData.append('timeframe', data.timeframe);
            }

            // Append images
            selectedImages.forEach((image) => {
                formData.append('images', image);
            });

            // Send as multipart/form-data
            const response = await fetch("/api/public/enquiry", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to submit enquiry");
            }

            setIsSubmitted(true);
            toast({
                title: "Enquiry Sent",
                description: "We've received your enquiry and will be in touch soon.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong. Please try again or call us.",
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
                        <CardTitle className="text-2xl">Thank You!</CardTitle>
                        <CardDescription className="text-base text-balance">
                            Your inquiry has been submitted successfully. A member of our team will contact you shortly to discuss your project.
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
                        <Building2 className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">CCC Group</h1>
                </div>

                <Card className="border-none shadow-2xl overflow-hidden glassmorphism">
                    <div className="h-2 bg-primary w-full" />
                    <CardHeader className="space-y-1 pb-8">
                        <CardTitle className="text-2xl">Request a Quote</CardTitle>
                        <CardDescription className="text-base">
                            Fill in your details below and we'll provide a custom estimate for your carpentry needs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Smith"
                                        {...form.register("name")}
                                        className={form.formState.errors.name ? "border-destructive" : ""}
                                    />
                                    {form.formState.errors.name && (
                                        <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
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

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    {...form.register("email")}
                                    className={form.formState.errors.email ? "border-destructive" : ""}
                                />
                                {form.formState.errors.email && (
                                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="address">Site Address</Label>
                                    <Input
                                        id="address"
                                        placeholder="Street name and town"
                                        {...form.register("address")}
                                        className={form.formState.errors.address ? "border-destructive" : ""}
                                    />
                                    {form.formState.errors.address && (
                                        <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="postcode">Postcode</Label>
                                    <Input
                                        id="postcode"
                                        placeholder="CF10 1BH"
                                        {...form.register("postcode")}
                                        className={form.formState.errors.postcode ? "border-destructive" : ""}
                                    />
                                    {form.formState.errors.postcode && (
                                        <p className="text-xs text-destructive">{form.formState.errors.postcode.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Service Type</Label>
                                    <Select onValueChange={(v) => form.setValue("serviceType", v)}>
                                        <SelectTrigger className={form.formState.errors.serviceType ? "border-destructive" : ""}>
                                            <SelectValue placeholder="Select service..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="doors">Doors & Skirting</SelectItem>
                                            <SelectItem value="flooring">Flooring</SelectItem>
                                            <SelectItem value="kitchen">Kitchen Fitting</SelectItem>
                                            <SelectItem value="loft">Loft Conversions</SelectItem>
                                            <SelectItem value="other">Other Carpentry</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.serviceType && (
                                        <p className="text-xs text-destructive">{form.formState.errors.serviceType.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Timeframe</Label>
                                    <Select onValueChange={(v) => form.setValue("timeframe", v)} defaultValue="flexible">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select timeframe..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="asap">ASAP</SelectItem>
                                            <SelectItem value="getting_quotes">Getting Quotes Only</SelectItem>
                                            <SelectItem value="flexible">Flexible</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Project Details</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Tell us about what you need done..."
                                    {...form.register("description")}
                                    className={`min-h-[120px] ${form.formState.errors.description ? "border-destructive" : ""}`}
                                />
                                {form.formState.errors.description && (
                                    <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
                                )}
                            </div>

                            {/* Image Upload Section */}
                            <div className="space-y-2">
                                <Label>Project Images (Optional)</Label>
                                <p className="text-xs text-muted-foreground">Upload up to 5 images (max 10MB each)</p>

                                {/* Drag and Drop Zone */}
                                <div
                                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-300 hover:border-primary/50'
                                        }`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                                        if (selectedImages.length + files.length > 5) {
                                            toast({
                                                title: "Too many images",
                                                description: "You can upload a maximum of 5 images",
                                                variant: "destructive",
                                            });
                                            return;
                                        }
                                        setSelectedImages(prev => [...prev, ...files].slice(0, 5));
                                    }}
                                >
                                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                                    <p className="text-sm font-medium mb-1">Drag and drop images here</p>
                                    <p className="text-xs text-muted-foreground mb-3">or</p>
                                    <label htmlFor="image-upload" className="cursor-pointer">
                                        <Button type="button" variant="outline" size="sm" asChild>
                                            <span>Browse Files</span>
                                        </Button>
                                    </label>
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            if (selectedImages.length + files.length > 5) {
                                                toast({
                                                    title: "Too many images",
                                                    description: "You can upload a maximum of 5 images",
                                                    variant: "destructive",
                                                });
                                                return;
                                            }
                                            setSelectedImages(prev => [...prev, ...files].slice(0, 5));
                                        }}
                                    />
                                </div>

                                {/* Image Previews */}
                                {selectedImages.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                                        {selectedImages.map((file, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedImages(prev => prev.filter((_, i) => i !== index));
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <p className="text-xs text-center mt-1 truncate">{file.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg font-semibold group" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Request
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
