import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  MessageSquare, 
  Target, 
  Image as ImageIcon, 
  FileText, 
  Sparkles,
  Save,
  Plus,
  Loader2,
  Calendar,
  Facebook,
  MapPin,
  RefreshCw,
  Eye,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  X,
} from "lucide-react";
import { SiGoogle, SiInstagram, SiFacebook } from "react-icons/si";
import type { SeoBusinessProfile, SeoContentPost, SeoWeeklyFocus } from "@shared/schema";

export default function SEOPowerHouse() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SEO Power House</h1>
          <p className="text-muted-foreground">AI-powered content creation and social media management</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="profile" className="gap-2" data-testid="tab-profile">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-2" data-testid="tab-voice">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Brand Voice</span>
          </TabsTrigger>
          <TabsTrigger value="focus" className="gap-2" data-testid="tab-focus">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Weekly Focus</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-2" data-testid="tab-create">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </TabsTrigger>
          <TabsTrigger value="posts" className="gap-2" data-testid="tab-posts">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Posts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <BusinessProfileSection />
        </TabsContent>
        
        <TabsContent value="voice">
          <BrandVoiceSection />
        </TabsContent>
        
        <TabsContent value="focus">
          <WeeklyFocusSection />
        </TabsContent>
        
        <TabsContent value="create">
          <ContentCreatorSection />
        </TabsContent>
        
        <TabsContent value="posts">
          <PostsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BusinessProfileSection() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    businessName: "CCC Group",
    tradeType: "Carpentry & Home Improvements",
    servicesOffered: ["Bespoke Carpentry", "Under-Stairs Storage", "Media Walls", "Fitted Wardrobes", "Kitchens", "Bathrooms"],
    serviceLocations: ["Cardiff", "Caerphilly", "Newport", "Vale of Glamorgan"],
    brandTone: "professional",
    primaryGoals: ["Generate leads", "Showcase work", "Build local trust"],
    contactPhone: "",
    contactEmail: "",
    websiteUrl: "",
  });

  const { data: profile, isLoading } = useQuery<SeoBusinessProfile | null>({
    queryKey: ["/api/seo/business-profile"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/seo/business-profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo/business-profile"] });
      toast({ title: "Profile saved", description: "Your business profile has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        businessName: profile.businessName || "CCC Group",
        tradeType: profile.tradeType || "Carpentry & Home Improvements",
        servicesOffered: profile.servicesOffered || [],
        serviceLocations: profile.serviceLocations || [],
        brandTone: profile.brandTone || "professional",
        primaryGoals: profile.primaryGoals || [],
        contactPhone: profile.contactPhone || "",
        contactEmail: profile.contactEmail || "",
        websiteUrl: profile.websiteUrl || "",
      });
    }
  }, [profile]);

  const handleArrayChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(",").map(s => s.trim()).filter(Boolean),
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Business Profile
        </CardTitle>
        <CardDescription>
          Configure your business details for AI-generated content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              data-testid="input-business-name"
              value={formData.businessName}
              onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
              placeholder="CCC Group"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tradeType">Trade Type</Label>
            <Input
              id="tradeType"
              data-testid="input-trade-type"
              value={formData.tradeType}
              onChange={(e) => setFormData(prev => ({ ...prev, tradeType: e.target.value }))}
              placeholder="Carpentry & Home Improvements"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="servicesOffered">Services Offered (comma-separated)</Label>
          <Textarea
            id="servicesOffered"
            data-testid="input-services"
            value={formData.servicesOffered.join(", ")}
            onChange={(e) => handleArrayChange("servicesOffered", e.target.value)}
            placeholder="Bespoke Carpentry, Media Walls, Fitted Wardrobes..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceLocations">Service Locations (comma-separated)</Label>
          <Textarea
            id="serviceLocations"
            data-testid="input-locations"
            value={formData.serviceLocations.join(", ")}
            onChange={(e) => handleArrayChange("serviceLocations", e.target.value)}
            placeholder="Cardiff, Caerphilly, Newport..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brandTone">Brand Tone</Label>
          <Select
            value={formData.brandTone}
            onValueChange={(value) => setFormData(prev => ({ ...prev, brandTone: value }))}
          >
            <SelectTrigger data-testid="select-brand-tone">
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="authoritative">Authoritative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryGoals">Primary Goals (comma-separated)</Label>
          <Textarea
            id="primaryGoals"
            data-testid="input-goals"
            value={formData.primaryGoals.join(", ")}
            onChange={(e) => handleArrayChange("primaryGoals", e.target.value)}
            placeholder="Generate leads, Showcase work, Build local trust..."
          />
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              data-testid="input-phone"
              value={formData.contactPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              placeholder="07xxx xxxxxx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              data-testid="input-email"
              value={formData.contactEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="info@cccgroup.co.uk"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              data-testid="input-website"
              value={formData.websiteUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
              placeholder="https://cccgroup.co.uk"
            />
          </div>
        </div>

        <Button
          onClick={() => saveMutation.mutate(formData)}
          disabled={saveMutation.isPending}
          data-testid="button-save-profile"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Profile
        </Button>
      </CardContent>
    </Card>
  );
}

function BrandVoiceSection() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customPhrases: ["Quality craftsmanship", "Local experts", "Trusted since"],
    blacklistedPhrases: ["Cheap", "Budget", "Discount"],
    preferredCtas: ["Get in touch today", "Call for a free quote", "Transform your space"],
    emojiStyle: "moderate",
    hashtagPreferences: ["#CardiffCarpentry", "#CCCGroup", "#BespokeStorage"],
    locationKeywords: ["Cardiff", "Caerphilly", "South Wales", "local"],
  });

  const { data: voice, isLoading } = useQuery({
    queryKey: ["/api/seo/brand-voice"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/seo/brand-voice", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo/brand-voice"] });
      toast({ title: "Brand voice saved", description: "Your brand voice settings have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save brand voice.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (voice) {
      const v = voice as { customPhrases?: string[]; blacklistedPhrases?: string[]; preferredCtas?: string[]; emojiStyle?: string; hashtagPreferences?: string[]; locationKeywords?: string[] };
      setFormData({
        customPhrases: v.customPhrases || ["Quality craftsmanship", "Local experts", "Trusted since"],
        blacklistedPhrases: v.blacklistedPhrases || ["Cheap", "Budget", "Discount"],
        preferredCtas: v.preferredCtas || ["Get in touch today", "Call for a free quote", "Transform your space"],
        emojiStyle: v.emojiStyle || "moderate",
        hashtagPreferences: v.hashtagPreferences || ["#CardiffCarpentry", "#CCCGroup", "#BespokeStorage"],
        locationKeywords: v.locationKeywords || ["Cardiff", "Caerphilly", "South Wales", "local"],
      });
    }
  }, [voice]);

  const handleArrayChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(",").map(s => s.trim()).filter(Boolean),
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Brand Voice
        </CardTitle>
        <CardDescription>
          Define your brand&apos;s language preferences and style
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Custom Phrases to Use (comma-separated)</Label>
          <Textarea
            data-testid="input-custom-phrases"
            value={formData.customPhrases.join(", ")}
            onChange={(e) => handleArrayChange("customPhrases", e.target.value)}
            placeholder="Quality craftsmanship, Local experts..."
          />
          <p className="text-xs text-muted-foreground">Phrases the AI will try to incorporate</p>
        </div>

        <div className="space-y-2">
          <Label>Blacklisted Phrases (comma-separated)</Label>
          <Textarea
            data-testid="input-blacklisted-phrases"
            value={formData.blacklistedPhrases.join(", ")}
            onChange={(e) => handleArrayChange("blacklistedPhrases", e.target.value)}
            placeholder="Cheap, Budget, Discount..."
          />
          <p className="text-xs text-muted-foreground">Words the AI should never use</p>
        </div>

        <div className="space-y-2">
          <Label>Preferred Calls-to-Action (comma-separated)</Label>
          <Textarea
            data-testid="input-ctas"
            value={formData.preferredCtas.join(", ")}
            onChange={(e) => handleArrayChange("preferredCtas", e.target.value)}
            placeholder="Get in touch today, Call for a free quote..."
          />
        </div>

        <div className="space-y-2">
          <Label>Emoji Style</Label>
          <Select
            value={formData.emojiStyle}
            onValueChange={(value) => setFormData(prev => ({ ...prev, emojiStyle: value }))}
          >
            <SelectTrigger data-testid="select-emoji-style">
              <SelectValue placeholder="Select emoji style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Emojis</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="heavy">Heavy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Hashtag Preferences (comma-separated)</Label>
          <Textarea
            data-testid="input-hashtags"
            value={formData.hashtagPreferences.join(", ")}
            onChange={(e) => handleArrayChange("hashtagPreferences", e.target.value)}
            placeholder="#CardiffCarpentry, #CCCGroup..."
          />
        </div>

        <div className="space-y-2">
          <Label>Location Keywords (comma-separated)</Label>
          <Textarea
            data-testid="input-location-keywords"
            value={formData.locationKeywords.join(", ")}
            onChange={(e) => handleArrayChange("locationKeywords", e.target.value)}
            placeholder="Cardiff, Caerphilly, South Wales..."
          />
        </div>

        <Button
          onClick={() => saveMutation.mutate(formData)}
          disabled={saveMutation.isPending}
          data-testid="button-save-voice"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Brand Voice
        </Button>
      </CardContent>
    </Card>
  );
}

function WeeklyFocusSection() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    weekStartDate: new Date().toISOString().split("T")[0],
    weekEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    primaryService: "Bespoke Carpentry",
    primaryLocation: "Cardiff",
    supportingKeywords: ["quality", "bespoke", "handcrafted"],
    seasonalTheme: "",
    recommendedPostCount: 6,
    notes: "",
    focusImageUrl: "",
    focusImageCaption: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const res = await apiRequest("POST", "/api/uploads/request-url", {
        name: file.name,
        size: file.size,
        contentType: file.type,
      });
      const { uploadURL, objectPath } = await res.json();
      
      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      
      setFormData(prev => ({ ...prev, focusImageUrl: objectPath }));
      setImagePreview(URL.createObjectURL(file));
      toast({ title: "Image uploaded", description: "Your focus image is ready for AI content generation." });
    } catch (error) {
      toast({ title: "Upload failed", description: "Could not upload the image.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, focusImageUrl: "", focusImageCaption: "" }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const { data: focusList = [], isLoading } = useQuery<SeoWeeklyFocus[]>({
    queryKey: ["/api/seo/weekly-focus"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/seo/weekly-focus", {
        ...data,
        weekStartDate: new Date(data.weekStartDate),
        weekEndDate: new Date(data.weekEndDate),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo/weekly-focus"] });
      toast({ title: "Weekly focus created", description: "Your content focus for this week has been set." });
      setShowForm(false);
      setImagePreview(null);
      setFormData(prev => ({ ...prev, focusImageUrl: "", focusImageCaption: "" }));
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create weekly focus.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Weekly Focus
              </CardTitle>
              <CardDescription>
                Set your content focus for each week
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)} data-testid="button-new-focus">
              <Plus className="w-4 h-4 mr-2" />
              New Week
            </Button>
          </div>
        </CardHeader>
        {showForm && (
          <CardContent className="border-t">
            <div className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Week Start</Label>
                  <Input
                    type="date"
                    data-testid="input-week-start"
                    value={formData.weekStartDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, weekStartDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Week End</Label>
                  <Input
                    type="date"
                    data-testid="input-week-end"
                    value={formData.weekEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, weekEndDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primary Service</Label>
                  <Select
                    value={formData.primaryService}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, primaryService: value }))}
                  >
                    <SelectTrigger data-testid="select-primary-service">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bespoke Carpentry">Bespoke Carpentry</SelectItem>
                      <SelectItem value="Under-Stairs Storage">Under-Stairs Storage</SelectItem>
                      <SelectItem value="Media Walls">Media Walls</SelectItem>
                      <SelectItem value="Fitted Wardrobes">Fitted Wardrobes</SelectItem>
                      <SelectItem value="Kitchens / Joinery">Kitchens / Joinery</SelectItem>
                      <SelectItem value="Bathrooms">Bathrooms</SelectItem>
                      <SelectItem value="Full Home Project">Full Home Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primary Location</Label>
                  <Input
                    data-testid="input-primary-location"
                    value={formData.primaryLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryLocation: e.target.value }))}
                    placeholder="Cardiff"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Seasonal Theme (optional)</Label>
                <Input
                  data-testid="input-seasonal-theme"
                  value={formData.seasonalTheme}
                  onChange={(e) => setFormData(prev => ({ ...prev, seasonalTheme: e.target.value }))}
                  placeholder="e.g., Spring refresh, Christmas prep..."
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  data-testid="input-focus-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any specific themes or projects to highlight..."
                />
              </div>

              <div className="space-y-2">
                <Label>Focus Image (for AI-powered posts)</Label>
                <div className="border-2 border-dashed rounded-md p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    data-testid="input-focus-image"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Focus image preview"
                          className="max-h-48 rounded-md object-contain"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2"
                          onClick={removeImage}
                          data-testid="button-remove-image"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Image Description (helps AI understand the image)</Label>
                        <Input
                          data-testid="input-image-caption"
                          value={formData.focusImageCaption}
                          onChange={(e) => setFormData(prev => ({ ...prev, focusImageCaption: e.target.value }))}
                          placeholder="e.g., Completed under-stairs storage unit with oak finish"
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center py-6 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground text-center">
                            Click to upload an image for this week's content focus
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            AI will use this image to generate relevant social posts
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => createMutation.mutate(formData)}
                  disabled={createMutation.isPending}
                  data-testid="button-create-focus"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Focus
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {focusList.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {focusList.map((focus) => (
            <Card key={focus.id} className={focus.status === "active" ? "border-primary" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{focus.primaryService}</h3>
                      <Badge variant={focus.status === "active" ? "default" : "secondary"}>
                        {focus.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {focus.primaryLocation}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(focus.weekStartDate).toLocaleDateString()} - {new Date(focus.weekEndDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">{focus.recommendedPostCount} posts</Badge>
                </div>
                {focus.seasonalTheme && (
                  <p className="text-sm mt-2 text-muted-foreground">{focus.seasonalTheme}</p>
                )}
                {focus.focusImageUrl && (
                  <div className="mt-3 space-y-2">
                    <img
                      src={focus.focusImageUrl}
                      alt={focus.focusImageCaption || "Focus image"}
                      className="w-full max-h-32 object-cover rounded-md"
                    />
                    {focus.focusImageCaption && (
                      <p className="text-xs text-muted-foreground">{focus.focusImageCaption}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ContentCreatorSection() {
  const { toast } = useToast();
  const [platform, setPlatform] = useState("facebook");
  const [postType, setPostType] = useState("project_showcase");
  const [service, setService] = useState("Bespoke Carpentry");
  const [location, setLocation] = useState("Cardiff");
  const [mediaContext, setMediaContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/seo/generate-content", {
        platform,
        postType,
        service,
        location,
        mediaContext,
      });
      return res.json() as Promise<{ content: string }>;
    },
    onSuccess: (data: { content: string }) => {
      setGeneratedContent(data.content);
      toast({ title: "Content generated", description: "AI has created your post content." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate content.", variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/seo/content-posts", {
        platform,
        postType,
        content: generatedContent,
        status: "draft",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo/content-posts"] });
      toast({ title: "Post saved", description: "Your draft has been saved." });
      setGeneratedContent("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save post.", variant: "destructive" });
    },
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Content Generator
          </CardTitle>
          <CardDescription>
            Generate platform-specific content for your posts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger data-testid="select-platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google_business">
                  <div className="flex items-center gap-2">
                    <SiGoogle className="w-4 h-4" />
                    Google Business Profile
                  </div>
                </SelectItem>
                <SelectItem value="facebook">
                  <div className="flex items-center gap-2">
                    <SiFacebook className="w-4 h-4" />
                    Facebook
                  </div>
                </SelectItem>
                <SelectItem value="instagram">
                  <div className="flex items-center gap-2">
                    <SiInstagram className="w-4 h-4" />
                    Instagram
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Post Type</Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger data-testid="select-post-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project_showcase">Project Showcase</SelectItem>
                <SelectItem value="before_after">Before & After</SelectItem>
                <SelectItem value="tip">Tips & Advice</SelectItem>
                <SelectItem value="testimonial">Customer Testimonial</SelectItem>
                <SelectItem value="update">Business Update</SelectItem>
                <SelectItem value="seasonal">Seasonal Promotion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Service to Highlight</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger data-testid="select-service">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bespoke Carpentry">Bespoke Carpentry</SelectItem>
                <SelectItem value="Under-Stairs Storage">Under-Stairs Storage</SelectItem>
                <SelectItem value="Media Walls">Media Walls</SelectItem>
                <SelectItem value="Fitted Wardrobes">Fitted Wardrobes</SelectItem>
                <SelectItem value="Kitchens / Joinery">Kitchens / Joinery</SelectItem>
                <SelectItem value="Bathrooms">Bathrooms</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              data-testid="input-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Cardiff"
            />
          </div>

          <div className="space-y-2">
            <Label>Image Context (optional)</Label>
            <Textarea
              data-testid="input-media-context"
              value={mediaContext}
              onChange={(e) => setMediaContext(e.target.value)}
              placeholder="Describe the image you'll use, e.g., 'White oak fitted wardrobe with mirrored doors'"
            />
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full"
            data-testid="button-generate"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Content
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generated Content
          </CardTitle>
          <CardDescription>
            Review and edit your AI-generated post
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {generatedContent ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                {platform === "google_business" && <SiGoogle className="w-4 h-4" />}
                {platform === "facebook" && <SiFacebook className="w-4 h-4" />}
                {platform === "instagram" && <SiInstagram className="w-4 h-4" />}
                <span className="text-sm font-medium capitalize">{platform.replace("_", " ")}</span>
                <Badge variant="outline">{postType.replace("_", " ")}</Badge>
              </div>
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                data-testid="textarea-generated-content"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-draft"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save as Draft
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  data-testid="button-regenerate"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Sparkles className="w-10 h-10 mb-4" />
              <p>Generated content will appear here</p>
              <p className="text-sm">Configure your post and click Generate</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PostsSection() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: posts = [], isLoading } = useQuery<SeoContentPost[]>({
    queryKey: ["/api/seo/content-posts"],
  });

  const filteredPosts = statusFilter === "all" 
    ? posts 
    : posts.filter(p => p.status === statusFilter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft": return <Clock className="w-4 h-4" />;
      case "pending_review": return <Eye className="w-4 h-4" />;
      case "approved": return <CheckCircle2 className="w-4 h-4" />;
      case "scheduled": return <Calendar className="w-4 h-4" />;
      case "published": return <Send className="w-4 h-4" />;
      case "rejected": return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "secondary";
      case "pending_review": return "outline";
      case "approved": return "default";
      case "scheduled": return "default";
      case "published": return "default";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "google_business": return <SiGoogle className="w-4 h-4" />;
      case "facebook": return <SiFacebook className="w-4 h-4" />;
      case "instagram": return <SiInstagram className="w-4 h-4" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Content Posts
            </CardTitle>
            <CardDescription>
              Manage your content queue
            </CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <FileText className="w-10 h-10 mb-4" />
            <p>No posts yet</p>
            <p className="text-sm">Generate content to start building your queue</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getPlatformIcon(post.platform)}
                        <span className="text-sm font-medium capitalize">
                          {post.platform.replace("_", " ")}
                        </span>
                        <Badge variant="outline">{post.postType.replace("_", " ")}</Badge>
                        <Badge variant={getStatusColor(post.status) as "default" | "secondary" | "destructive" | "outline"} className="flex items-center gap-1">
                          {getStatusIcon(post.status)}
                          {post.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm line-clamp-3">{post.content}</p>
                      {post.scheduledFor && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Scheduled: {new Date(post.scheduledFor).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
