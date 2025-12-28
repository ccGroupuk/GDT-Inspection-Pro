import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, ArrowLeft, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Link, useLocation } from "wouter";

function generateMathChallenge() {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  return { num1, num2, answer: num1 + num2 };
}

export default function EmployeePortalLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mathChallenge, setMathChallenge] = useState(generateMathChallenge);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const refreshCaptcha = () => {
    setMathChallenge(generateMathChallenge());
    setCaptchaAnswer("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify CAPTCHA first - with better validation
    const userAnswer = parseInt(captchaAnswer, 10);
    if (isNaN(userAnswer) || userAnswer !== mathChallenge.answer) {
      toast({
        title: "Verification Failed",
        description: `Please solve the math problem: ${mathChallenge.num1} + ${mathChallenge.num2} = ?`,
        variant: "destructive"
      });
      refreshCaptcha();
      return;
    }
    
    console.log("Login attempt for:", email);
    setIsLoading(true);

    try {
      const response = await fetch("/api/employee/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.mustChangePassword) {
        toast({
          title: "Password Change Required",
          description: "Please change your password before continuing."
        });
        setLocation("/employee-portal/change-password");
      } else if (data.employee.accessLevel === "owner" || data.employee.accessLevel === "full_access") {
        toast({
          title: "Welcome back!",
          description: `Logged in as ${data.employee.firstName} ${data.employee.lastName} with admin access`
        });
        setLocation("/");
      } else {
        toast({
          title: "Welcome back!",
          description: `Logged in as ${data.employee.firstName} ${data.employee.lastName}`
        });
        setLocation("/employee-portal/home");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
      // Refresh CAPTCHA after failed login
      refreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-landing">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Employee Portal</CardTitle>
            <CardDescription>Sign in to access your timecard and payslips</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@cccgroup.co.uk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-employee-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                    data-testid="input-employee-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="captcha">Human Verification</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-md p-2 text-center font-mono text-lg">
                    {mathChallenge.num1} + {mathChallenge.num2} = ?
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={refreshCaptcha}
                    tabIndex={-1}
                    data-testid="button-refresh-captcha"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  id="captcha"
                  type="number"
                  placeholder="Enter the answer"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  required
                  data-testid="input-captcha-answer"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-employee-submit"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
