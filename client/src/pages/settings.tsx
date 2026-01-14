import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Upload, Trash2, Image as ImageIcon, Sun, Moon, Monitor, BookOpen, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings } from "@/lib/local-storage";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";

export default function Settings() {
    const { theme, setTheme } = useTheme();
    const { logoutMutation } = useAuth();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [trustBadges, setTrustBadges] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    useEffect(() => {
        const settings = getSettings();
        if (settings.logoUrl) {
            setLogoUrl(settings.logoUrl);
        }
        if (settings.bannerUrl) {
            setBannerUrl(settings.bannerUrl);
        }
        if (settings.trustBadges) {
            setTrustBadges(settings.trustBadges);
        }
    }, []);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        validateAndRead(file, (result) => setLogoUrl(result));
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        validateAndRead(file, (result) => setBannerUrl(result));
    };

    const handleBadgeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        validateAndRead(file, (result) => {
            setTrustBadges(prev => [...prev, result]);
            // Reset input
            e.target.value = '';
        });
    }

    const validateAndRead = (file: File, callback: (result: string) => void) => {
        // Basic validation
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast({
                variant: "destructive",
                title: "File too large",
                description: "Please upload an image smaller than 2MB",
            });
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast({
                variant: "destructive",
                title: "Invalid file type",
                description: "Please upload an image file (PNG, JPG, etc.)",
            });
            return;
        }

        setIsLoading(true);

        const reader = new FileReader();
        reader.onloadend = () => {
            callback(reader.result as string);
            setIsLoading(false);
        };
        reader.readAsDataURL(file);
    }

    const handleRemoveLogo = () => {
        setLogoUrl(null);
    };

    const handleRemoveBanner = () => {
        setBannerUrl(null);
    };

    const handleRemoveBadge = (index: number) => {
        setTrustBadges(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        saveSettings({
            logoUrl: logoUrl || undefined,
            bannerUrl: bannerUrl || undefined,
            trustBadges: trustBadges.length > 0 ? trustBadges : undefined
        });
        toast({
            title: "Settings Saved",
            description: "Your preferences have been updated.",
        });
        setLocation("/");
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header */}
            <div className="px-4 py-3 flex items-center border-b sticky top-0 bg-background/95 backdrop-blur z-10 shadow-sm border-border">
                <div className="max-w-6xl mx-auto w-full flex items-center">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="mr-2 hover:bg-muted">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="font-semibold text-lg text-foreground">Settings Dashboard</h1>
                </div>
            </div>

            <main className="flex-1 p-6 w-full max-w-6xl mx-auto">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Column 1: General Preferences */}
                    <div className="space-y-6">
                        {/* Theme Settings */}
                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Appearance</h2>
                            <Card>
                                <CardContent className="p-4 pt-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button
                                            variant={theme === 'light' ? 'default' : 'outline'}
                                            className="flex flex-col h-20 gap-2 border-2"
                                            onClick={() => setTheme('light')}
                                        >
                                            <Sun className="h-6 w-6" />
                                            <span className="text-xs">Light</span>
                                        </Button>
                                        <Button
                                            variant={theme === 'dark' ? 'default' : 'outline'}
                                            className="flex flex-col h-20 gap-2 border-2"
                                            onClick={() => setTheme('dark')}
                                        >
                                            <Moon className="h-6 w-6" />
                                            <span className="text-xs">Dark</span>
                                        </Button>
                                        <Button
                                            variant={theme === 'system' ? 'default' : 'outline'}
                                            className="flex flex-col h-20 gap-2 border-2"
                                            onClick={() => setTheme('system')}
                                        >
                                            <Monitor className="h-6 w-6" />
                                            <span className="text-xs">System</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Resources */}
                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Resources</h2>
                            <Card onClick={() => setLocation('/settings/help')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-full text-cyan-700 dark:text-cyan-400">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm">Help & SOPs</h3>
                                            <p className="text-xs text-muted-foreground">Standard Operating Procedures</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Inspection Items */}
                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Configuration</h2>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Templates</CardTitle>
                                    <CardDescription>
                                        Manage reusable inspection templates.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/settings/templates">
                                        <Button className="w-full" variant="outline">
                                            Manage Item Templates
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Column 2: Branding Images */}
                    <div className="space-y-6">
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Report Branding</h2>

                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle>Company Logo</CardTitle>
                                <CardDescription>
                                    Displayed in report header.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30 min-h-[160px] relative">
                                    {logoUrl ? (
                                        <div className="relative group w-full h-full flex items-center justify-center">
                                            <img
                                                src={logoUrl}
                                                alt="Company Logo"
                                                className="max-h-[120px] max-w-full object-contain"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={handleRemoveLogo}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground">
                                            <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-xs">No logo uploaded</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button className="w-full" variant="outline" size="sm" onClick={() => document.getElementById('logo-upload')?.click()}>
                                        <Upload className="mr-2 h-3 w-3" /> {logoUrl ? 'Change' : 'Upload'}
                                    </Button>
                                    <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isLoading} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle>Report Banner</CardTitle>
                                <CardDescription>
                                    Header background image.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-muted/30 h-[100px] relative overflow-hidden">
                                    {bannerUrl ? (
                                        <div className="relative group w-full h-full">
                                            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={handleRemoveBanner}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Default gradient used</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button className="w-full" variant="outline" size="sm" onClick={() => document.getElementById('banner-upload')?.click()}>
                                        <Upload className="mr-2 h-3 w-3" /> {bannerUrl ? 'Change' : 'Upload'}
                                    </Button>
                                    <Input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={isLoading} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Column 3: Badges + Actions */}
                    <div className="space-y-6">
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider md:hidden lg:block">&nbsp;</h2>

                        <Card className="flex flex-col h-fit">
                            <CardHeader>
                                <CardTitle>Trust Badges</CardTitle>
                                <CardDescription>
                                    Accreditations & Certificates.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-1">
                                <div className="grid grid-cols-2 gap-3">
                                    {trustBadges.map((badge, index) => (
                                        <div key={index} className="relative group border border-border rounded-lg p-2 bg-card flex items-center justify-center h-24">
                                            <img src={badge} alt="Badge" className="max-h-full max-w-full object-contain" />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-sm"
                                                onClick={() => handleRemoveBadge(index)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <div
                                        className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-muted/30 h-24 cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => document.getElementById('badge-upload')?.click()}
                                    >
                                        <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Add New</span>
                                    </div>
                                </div>
                                <Input id="badge-upload" type="file" accept="image/*" className="hidden" onChange={handleBadgeUpload} disabled={isLoading} />
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardContent className="p-4 space-y-3">
                                <Button size="lg" className="w-full font-bold shadow-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-0" onClick={handleSave}>
                                    <Save className="mr-2 h-4 w-4" /> Save Changes
                                </Button>
                                <Button variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => logoutMutation.mutate()}>
                                    Sign Out
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    );
}
