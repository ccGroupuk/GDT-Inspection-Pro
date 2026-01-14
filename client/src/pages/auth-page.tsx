import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertEngineerSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
    const { user, loginMutation, registerMutation, loginAsGuestMutation } = useAuth();
    const [, setLocation] = useLocation();
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setLocation("/");
        }
    }, [user, setLocation]);

    const loginForm = useForm<z.infer<typeof insertEngineerSchema>>({
        resolver: zodResolver(insertEngineerSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    const registerForm = useForm<z.infer<typeof insertEngineerSchema>>({
        resolver: zodResolver(insertEngineerSchema),
        defaultValues: {
            username: "",
            password: "",
            name: "",
        },
    });

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Form */}
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
                            GDT Inspection Pro
                        </h1>
                        <p className="text-muted-foreground">
                            Sign in to manage your inspections
                        </p>
                    </div>

                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="register">Register</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <Card className="dark:border-primary/20 dark:shadow-[0_0_40px_rgba(14,165,233,0.1)]">
                                <CardHeader>
                                    <CardTitle>Welcome back</CardTitle>
                                    <CardDescription>
                                        Enter your credentials to access your account
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...loginForm}>
                                        <form
                                            onSubmit={loginForm.handleSubmit((data) =>
                                                loginMutation.mutate(data)
                                            )}
                                            className="space-y-4"
                                        >
                                            <FormField
                                                control={loginForm.control}
                                                name="username"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Username</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Enter username" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={loginForm.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Password</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showLoginPassword ? "text" : "password"}
                                                                    placeholder="Enter password"
                                                                    {...field}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                                >
                                                                    {showLoginPassword ? (
                                                                        <EyeOff className="h-4 w-4" />
                                                                    ) : (
                                                                        <Eye className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="submit"
                                                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                                                disabled={loginMutation.isPending}
                                            >
                                                {loginMutation.isPending && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                Sign In
                                            </Button>
                                        </form>
                                    </Form>

                                    <div className="mt-6 text-center">
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-muted" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-background px-2 text-muted-foreground">
                                                    Or continue offline
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full mt-4"
                                            onClick={() => loginAsGuestMutation.mutate()}
                                            disabled={loginAsGuestMutation.isPending}
                                        >
                                            Continue as Guest
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="register">
                            <Card className="dark:border-primary/20 dark:shadow-[0_0_40px_rgba(14,165,233,0.1)]">
                                <CardHeader>
                                    <CardTitle>Create an account</CardTitle>
                                    <CardDescription>
                                        Get started with GDT Inspection Pro
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...registerForm}>
                                        <form
                                            onSubmit={registerForm.handleSubmit((data) =>
                                                registerMutation.mutate(data)
                                            )}
                                            className="space-y-4"
                                        >
                                            <FormField
                                                control={registerForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="John Doe" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={registerForm.control}
                                                name="username"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Username</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="johndoe" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={registerForm.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Password</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showRegisterPassword ? "text" : "password"}
                                                                    placeholder="Create a password"
                                                                    {...field}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                                                >
                                                                    {showRegisterPassword ? (
                                                                        <EyeOff className="h-4 w-4" />
                                                                    ) : (
                                                                        <Eye className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="submit"
                                                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                                                disabled={registerMutation.isPending}
                                            >
                                                {registerMutation.isPending && (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                Create Account
                                            </Button>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Right: Hero Image */}
            <div className="hidden lg:flex flex-col justify-center p-12 bg-slate-900 border-l border-slate-800">
                <div className="text-white space-y-6 max-w-lg mx-auto">
                    <h2 className="text-4xl font-bold leading-tight">
                        Streamline your inspections with professional reporting.
                    </h2>
                    <p className="text-lg text-slate-400">
                        Generate PDF reports, track inspection times, and manage templates all
                        in one place.
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-8">
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                            <h3 className="font-semibold text-cyan-400 mb-1">Fast & Native</h3>
                            <p className="text-sm text-slate-400">
                                Built for mobile devices with native camera integration.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                            <h3 className="font-semibold text-cyan-400 mb-1">
                                Professional Reports
                            </h3>
                            <p className="text-sm text-slate-400">
                                Generate branded PDFs with photos and notes instantly.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
