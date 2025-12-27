import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalLayout } from "@/components/portal-layout";
import { usePortalAuth, portalApiRequest } from "@/hooks/use-portal-auth";
import { ExternalLink, Star } from "lucide-react";
import { SiFacebook, SiGoogle, SiTrustpilot } from "react-icons/si";

interface ReviewLinks {
  facebook: string | null;
  google: string | null;
  trustpilot: string | null;
}

export default function PortalReviews() {
  const { token, isAuthenticated } = usePortalAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/portal/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: reviewLinks, isLoading } = useQuery<ReviewLinks>({
    queryKey: ["/api/portal/review-links"],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const response = await portalApiRequest("GET", "/api/portal/review-links", token);
      if (!response.ok) {
        if (response.status === 401) {
          setLocation("/portal/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch review links");
      }
      return response.json();
    },
    enabled: !!token,
  });

  if (!isAuthenticated) {
    return null;
  }

  const reviewPlatforms = [
    {
      name: "Facebook",
      icon: SiFacebook,
      url: reviewLinks?.facebook,
      color: "bg-[#1877F2]/10 text-[#1877F2]",
      description: "Share your experience with our community",
    },
    {
      name: "Google",
      icon: SiGoogle,
      url: reviewLinks?.google,
      color: "bg-[#4285F4]/10 text-[#4285F4]",
      description: "Help others find us on Google",
    },
    {
      name: "Trustpilot",
      icon: SiTrustpilot,
      url: reviewLinks?.trustpilot,
      color: "bg-[#00B67A]/10 text-[#00B67A]",
      description: "Rate us on Trustpilot",
    },
  ];

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-reviews-title">Leave a Review</h1>
          <p className="text-sm text-muted-foreground mt-1">
            We'd love to hear about your experience working with us
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/10">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <CardTitle className="text-base">Your Feedback Matters</CardTitle>
                <CardDescription>
                  Your reviews help us improve and help others find quality services
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviewPlatforms.map((platform) => (
              <Card key={platform.name} data-testid={`review-card-${platform.name.toLowerCase()}`}>
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${platform.color}`}>
                    <platform.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{platform.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {platform.description}
                    </p>
                  </div>
                  {platform.url ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                      data-testid={`button-review-${platform.name.toLowerCase()}`}
                    >
                      <a href={platform.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Leave Review
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Not Available
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
