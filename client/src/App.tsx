import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import NewInspection from "@/pages/inspection/new";
import ReportView from "@/components/inspection/ReportView";
import Settings from "@/pages/settings";
import HelpPage from "@/pages/settings/help";
import TemplatesList from "@/pages/settings/templates";
import TemplateEditor from "@/pages/settings/template-editor";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PlusCircle, ClipboardList, User, Settings as SettingsIcon } from "lucide-react";
import { getInspections, getSettings, type SavedInspection } from "@/lib/local-storage";
import { useEffect, useState } from "react";

import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";

function Router() {
    return (
        <Switch>
            <ProtectedRoute path="/" component={Home} />
            <ProtectedRoute path="/inspection/new" component={NewInspection} />
            <ProtectedRoute path="/inspection/edit/:id" component={NewInspection} />
            <ProtectedRoute path="/report/:id" component={ReportView} />
            <ProtectedRoute path="/settings" component={Settings} />
            <ProtectedRoute path="/settings/help" component={HelpPage} />
            <ProtectedRoute path="/settings/templates" component={TemplatesList} />
            <ProtectedRoute path="/settings/templates/new" component={TemplateEditor} />
            <Route path="/auth" component={AuthPage} />
            <Route component={NotFound} />
        </Switch>
    );
}

import { useInspections } from "@/hooks/use-inspections";
import { syncAllInspections } from "@/lib/local-storage";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function Home() {
    const { inspections, isLoading } = useInspections();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const { toast } = useToast();

    // Initial load for settings
    useEffect(() => {
        const settings = getSettings();
        if (settings.logoUrl) setLogoUrl(settings.logoUrl);
    }, []);

    // Listen for setting changes
    useEffect(() => {
        const handleSettingsUpdate = () => {
            const settings = getSettings();
            setLogoUrl(settings.logoUrl || null);
        };

        window.addEventListener('settings-updated', handleSettingsUpdate);
        return () => window.removeEventListener('settings-updated', handleSettingsUpdate);
    }, []);

    const unsyncedCount = inspections.filter(i => !i.isSynced).length;

    const handleSync = async () => {
        setIsSyncing(true);
        const count = await syncAllInspections();
        setIsSyncing(false);

        if (count > 0) {
            toast({
                title: "Sync Complete",
                description: `Successfully uploaded ${count} inspection(s) to the server.`,
            });
        } else {
            // Either all failed or none needed syncing (but button wouldn't show if 0)
            // Or maybe network error
            toast({
                title: "Sync Finished",
                description: "Process completed. Check for any remaining unsynced items.",
            });
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Mobile Header */}
            <header className="px-4 py-3 flex items-center justify-between sticky top-0 z-10 h-16 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border-b border-blue-800 shadow-lg">
                <div className="flex items-center">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Company Logo" className="h-10 object-contain" />
                    ) : (
                        <h1 className="font-extrabold text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-200">GDT Inspection Pro</h1>
                    )}
                </div>
                <Link href="/settings">
                    <Button variant="ghost" size="icon" className="hover:bg-white/10 text-blue-100">
                        <SettingsIcon className="h-5 w-5" />
                    </Button>
                </Link>
            </header>

            <main className="flex-1 p-4 space-y-6">
                {/* Welcome Section */}
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-foreground">Hello, Engineer</h2>
                    <p className="text-muted-foreground">Ready for your first inspection today?</p>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <Link href="/inspection/new">
                        <Button className="w-full h-20 text-lg font-bold shadow-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-0 transition-all active:scale-[0.98]" size="lg">
                            <PlusCircle className="mr-2 h-7 w-7 text-white" />
                            <span className="text-white">Start New Inspection</span>
                        </Button>
                    </Link>

                    {/* Sync Button - Conditional */}
                    {unsyncedCount > 0 && (
                        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-lg p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full">
                                    <CloudOff className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-orange-800 dark:text-orange-300 text-sm">{unsyncedCount} Unsynced Reports</p>
                                    <p className="text-xs text-orange-600 dark:text-orange-400/80">Upload pending inspections.</p>
                                </div>
                            </div>
                            <Button size="sm" onClick={handleSync} disabled={isSyncing} className="bg-orange-600 hover:bg-orange-700 text-white border-none shadow-md">
                                {isSyncing ? (
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Cloud className="h-4 w-4 mr-2" />
                                )}
                                {isSyncing ? 'Syncing...' : 'Sync All'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center">
                        <ClipboardList className="mr-2 h-5 w-5 text-muted-foreground" />
                        Recent Inspections
                    </h3>
                    <div className="space-y-3">
                        {inspections.length === 0 ? (
                            <div className="text-center p-8 bg-muted/50 rounded-xl border border-dashed border-border text-muted-foreground">
                                No inspections yet. Start one above!
                            </div>
                        ) : (
                            inspections.map((inspection) => (
                                <Link key={inspection.id} href={`/report/${inspection.id}`}>
                                    <div className="bg-card hover:bg-accent/50 p-4 rounded-xl border border-border shadow-sm cursor-pointer transition-all group relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-foreground group-hover:text-primary transition-colors">{inspection.address}</span>

                                            <div className="flex items-center gap-2">
                                                {/* Sync Status Icon */}
                                                {inspection.isSynced ? (
                                                    <div title="Synced to Server">
                                                        <Cloud className="h-4 w-4 text-green-500" />
                                                    </div>
                                                ) : (
                                                    <div title="Not Synced (Local Only)">
                                                        <CloudOff className="h-4 w-4 text-orange-500" />
                                                    </div>
                                                )}

                                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold tracking-wide uppercase ${inspection.status === 'completed'
                                                        ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                                        : 'bg-muted text-muted-foreground border border-border'
                                                    }`}>
                                                    {inspection.status || "draft"}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${inspection.status === 'completed' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                            {inspection.clientName || "Unknown Client"}
                                            <span className="text-border">•</span>
                                            {new Date(inspection.date || inspection.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

import { ThemeProvider } from "@/components/theme-provider";
import { App as CapacitorApp } from '@capacitor/app';

function App() {
    // Handle Android Hardware Back Button
    useEffect(() => {
        const handleBackButton = async () => {
            CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                if (window.location.pathname === '/') {
                    CapacitorApp.exitApp();
                } else {
                    window.history.back();
                }
            });
        };
        handleBackButton();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <Router />
                <Toaster />
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
