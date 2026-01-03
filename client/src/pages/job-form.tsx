// client/src/pages/job-form.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Hammer,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  SquareDashedBottomCode,
  Tag,
  Tags,
  Truck,
  User,
  X,
} from 'lucide-react';

// Shadcn UI components
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Switch } from '../components/ui/switch';

// Local components and utils
import { JobDetailData, JobStatus, JobType, PortalAccessWithToken, QuoteItem, QuoteItemType, ScheduleProposal, insertJobSchema } from '../../../shared/schema';
import { cn, formatCurrency, getDaysBetweenDates } from '../lib/utils';
import { Contact } from '../../../shared/schema';
import { CatalogItem, ProductCategory, QuoteTemplate, TradePartner } from '../../../shared/schema';
import { EmptyState } from '../components/empty-state';
import { PortalLayout } from '../components/portal-layout'; // Assuming this is needed, as it's present in similar pages

// Extend the base job schema for form-specific validations
const JobFormSchema = insertJobSchema.extend({
  // Define custom fields for the form that might not be directly in the DB schema
  // E.g., if you have transient fields for UI logic.
  // For now, we'll just refine existing fields.
})
.superRefine((data, ctx) => {
  // Conditional validation for partnerId
  if (data.jobType === JobType.CccPlusPartner && !data.partnerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Partner is required for 'CCC + Partner' jobs.",
      path: ["partnerId"],
    });
  }
  // Other existing validations could go here
});

type JobFormData = z.infer<typeof JobFormSchema>;

export function JobForm() {
  const { jobId } = useParams<{ jobId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditing = !!jobId;

  // --- API Calls ---

  // Fetch job details for editing
  const { data: jobData, isLoading: isLoadingJob } = useQuery<JobDetailData>({
    queryKey: ['job', jobId],
    queryFn: () => fetch(`/api/jobs/${jobId}`).then(res => res.json()),
    enabled: isEditing,
  });

  // Fetch all contacts
  const { data: contacts, isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: () => fetch('/api/contacts').then(res => res.json()),
  });

  // Fetch all product categories
  const { data: productCategories, isLoading: isLoadingProductCategories } = useQuery<ProductCategory[]>({
    queryKey: ['productCategories'],
    queryFn: () => fetch('/api/product-categories').then(res => res.json()),
  });

  // Fetch all catalog items
  const { data: catalogItems, isLoading: isLoadingCatalogItems } = useQuery<CatalogItem[]>({
    queryKey: ['catalogItems'],
    queryFn: () => fetch('/api/catalog-items').then(res => res.json()),
  });

  // Fetch all quote templates
  const { data: quoteTemplates, isLoading: isLoadingQuoteTemplates } = useQuery<QuoteTemplate[]>({
    queryKey: ['quoteTemplates'],
    queryFn: () => fetch('/api/quote-templates').then(res => res.json()),
  });

  // Fetch default material markup
  const { data: defaultMaterialMarkup, isLoading: isLoadingDefaultMaterialMarkup } = useQuery<number>({
    queryKey: ['companySettings', 'defaultMaterialMarkup'],
    queryFn: () => fetch('/api/company-settings/default_material_markup_percent').then(res => res.json()),
  });

  // NEW: Fetch all trade partners
  const { data: partners, isLoading: isLoadingPartners } = useQuery<TradePartner[]>({
    queryKey: ['partners'],
    queryFn: () => fetch('/api/partners').then(res => res.json()),
  });


  const form = useForm<JobFormData>({
    resolver: zodResolver(JobFormSchema),
    defaultValues: {
      jobType: JobType.CccOnly, // Default to CCC Only
      status: JobStatus.Lead,
      startDate: new Date(),
      endDate: new Date(),
      quoteItems: [],
      notes: '',
      contactId: undefined,
      partnerId: undefined, // Initialize partnerId as undefined
      isEmergency: false,
      priority: 'medium',
      expectedRevenue: 0,
      jobName: '',
      address: '',
      city: '',
      postcode: '',
      description: '',
    },
  });

  const { reset, handleSubmit, watch, control, formState: { isSubmitting, errors }, setValue } = form;

  const currentJobType = watch('jobType'); // Watch jobType for conditional rendering

  // Effect to reset form with job data for editing
  useEffect(() => {
    if (isEditing && jobData) {
      reset({
        ...jobData,
        startDate: jobData.startDate ? new Date(jobData.startDate) : new Date(),
        endDate: jobData.endDate ? new Date(jobData.endDate) : new Date(),
        expectedRevenue: jobData.expectedRevenue ? parseFloat(jobData.expectedRevenue.toString()) : 0,
        // Ensure partnerId is correctly set for editing
        partnerId: jobData.partnerId || undefined,
      });
    }
  }, [isEditing, jobData, reset]);

  // --- Quote Item Logic ---
  const quoteItems = watch('quoteItems');

  const addQuoteItem = (type: QuoteItemType, item?: CatalogItem) => {
    const newItem: QuoteItem = {
      id: crypto.randomUUID(), // Client-side generated ID for new items
      type: type,
      description: item?.name || '',
      quantity: 1,
      unitPrice: item?.price || 0,
      markup: defaultMaterialMarkup || 0,
      catalogItemId: item?.id || null,
    };
    setValue('quoteItems', [...quoteItems, newItem]);
  };

  const removeQuoteItem = (id: string) => {
    setValue('quoteItems', quoteItems.filter(item => item.id !== id));
  };

  const updateQuoteItem = (id: string, field: keyof QuoteItem, value: any) => {
    setValue('quoteItems', quoteItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateItemTotal = (item: QuoteItem) => {
    if (item.type === QuoteItemType.Material) {
      const priceWithMarkup = item.unitPrice * (1 + item.markup / 100);
      return priceWithMarkup * item.quantity;
    }
    return item.unitPrice * item.quantity;
  };

  const totalQuoteValue = quoteItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  useEffect(() => {
    setValue('expectedRevenue', totalQuoteValue);
  }, [totalQuoteValue, setValue]);

  // Apply quote template
  const applyQuoteTemplate = (templateId: string) => {
    const template = quoteTemplates?.find(t => t.id === templateId);
    if (template) {
      const templateQuoteItems: QuoteItem[] = template.items.map(item => ({
        id: crypto.randomUUID(),
        description: item.description,
        type: item.type,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        markup: item.markup,
        catalogItemId: item.catalogItemId,
      }));
      setValue('quoteItems', [...quoteItems, ...templateQuoteItems]);
      toast.success(`Template "${template.name}" applied!`);
    }
  };

  // --- Mutations ---
  const createJobMutation = useMutation({
    mutationFn: (newJob: JobFormData) =>
      fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to create job');
        return res.json();
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Job created successfully!');
      navigate(`/jobs/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Error creating job: ${error.message}`);
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: (updatedJob: JobFormData) =>
      fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedJob),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update job');
        return res.json();
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Job updated successfully!');
      navigate(`/jobs/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Error updating job: ${error.message}`);
    },
  });

  const onSubmit = (data: JobFormData) => {
    const jobPayload = {
      ...data,
      // Format dates to ISO strings for the backend
      startDate: data.startDate?.toISOString(),
      endDate: data.endDate?.toISOString(),
      expectedRevenue: parseFloat(data.expectedRevenue.toFixed(2)), // Ensure currency format
      // Ensure partnerId is included if it exists, otherwise it will be undefined
      partnerId: data.partnerId || null,
    };
    console.log("Submitting job payload:", jobPayload);
    if (isEditing) {
      updateJobMutation.mutate(jobPayload);
    } else {
      createJobMutation.mutate(jobPayload);
    }
  };

  if (isLoadingJob || isLoadingContacts || isLoadingProductCategories || isLoadingCatalogItems || isLoadingQuoteTemplates || isLoadingDefaultMaterialMarkup || isLoadingPartners) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PortalLayout>
    );
  }

  // Filter catalog items by selected product category for easier selection
  const [selectedProductCategory, setSelectedProductCategory] = useState<string | null>(null);
  const filteredCatalogItems = selectedProductCategory
    ? catalogItems?.filter(item => item.productCategoryId === selectedProductCategory)
    : catalogItems;

  return (
    <PortalLayout>
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? `Edit Job: ${jobData?.jobName}` : 'Create New Job'}
        </h1>
        <div></div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="jobName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kitchen Renovation - John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Contact</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contacts?.map(contact => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName} ({contact.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The primary client associated with this job.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="jobType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(JobType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Specify if this is a CCC-only, Partner-only, or a hybrid job.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* NEW: Partner selection field, conditionally rendered */}
              {currentJobType === JobType.CccPlusPartner && (
                <FormField
                  control={control}
                  name="partnerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Partner</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a trade partner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {partners?.map(partner => (
                            <SelectItem key={partner.id} value={partner.id}>
                              {partner.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the primary trade partner for this hybrid job.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {/* END NEW */}

              <FormField
                control={control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(JobStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="isEmergency"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm col-span-1 md:col-span-2">
                    <div className="space-y-0.5">
                      <FormLabel>Emergency Job</FormLabel>
                      <FormDescription>
                        Mark this job as an emergency call-out.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" /> Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              field.value.toLocaleDateString()
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              field.value.toLocaleDateString()
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Location
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cardiff" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="postcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CF10 1AB" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Description & Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of the job requirements..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any internal notes for the team..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These notes are visible only to internal staff.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" /> Quote & Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Quote Items</h3>
                <div className="flex space-x-2">
                  <Select onValueChange={applyQuoteTemplate}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Apply Template" />
                    </SelectTrigger>
                    <SelectContent>
                      {quoteTemplates?.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" /> Add Item
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Add Quote Item</AlertDialogTitle>
                        <AlertDialogDescription>
                          Choose to add a custom item or select from your catalog.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="grid gap-4">
                        <Button onClick={() => { addQuoteItem(QuoteItemType.Labor); form.trigger('quoteItems'); }} className="justify-start">
                          <Hammer className="mr-2 h-4 w-4" /> Add Custom Labor
                        </Button>
                        <Button onClick={() => { addQuoteItem(QuoteItemType.Material); form.trigger('quoteItems'); }} className="justify-start">
                          <Truck className="mr-2 h-4 w-4" /> Add Custom Material
                        </Button>
                        <Separator />
                        <h4 className="font-medium">From Catalog</h4>
                        <div className="flex space-x-2">
                          <Select
                            onValueChange={(value) => setSelectedProductCategory(value === 'all' ? null : value)}
                            value={selectedProductCategory || 'all'}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {productCategories?.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                          {filteredCatalogItems && filteredCatalogItems.length > 0 ? (
                            filteredCatalogItems.map(item => (
                              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                <span>{item.name} ({item.sku})</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { addQuoteItem(QuoteItemType.Material, item); form.trigger('quoteItems'); }}
                                >
                                  Add
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No catalog items found.</p>
                          )}
                        </ScrollArea>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {quoteItems.length === 0 ? (
                <EmptyState
                  icon={SquareDashedBottomCode}
                  title="No Quote Items"
                  description="Add items to build your quote."
                />
              ) : (
                <div className="space-y-4">
                  {quoteItems.map((item, index) => (
                    <Card key={item.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        <div className="col-span-1 md:col-span-2">
                          <Label htmlFor={`description-${item.id}`}>Description</Label>
                          <Input
                            id={`description-${item.id}`}
                            value={item.description}
                            onChange={(e) => updateQuoteItem(item.id, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`quantity-${item.id}`}>Qty</Label>
                          <Input
                            id={`quantity-${item.id}`}
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuoteItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`unitPrice-${item.id}`}>Unit Price</Label>
                          <Input
                            id={`unitPrice-${item.id}`}
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateQuoteItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        {item.type === QuoteItemType.Material && (
                          <div>
                            <Label htmlFor={`markup-${item.id}`}>Markup (%)</Label>
                            <Input
                              id={`markup-${item.id}`}
                              type="number"
                              value={item.markup}
                              onChange={(e) => updateQuoteItem(item.id, 'markup', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="1000"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2 md:justify-end col-span-1 md:col-span-1">
                          <Badge variant="secondary" className="mr-2">
                            {formatCurrency(calculateItemTotal(item))}
                          </Badge>
                          <Button variant="destructive" size="icon" onClick={() => removeQuoteItem(item.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  <div className="flex justify-end items-center gap-4 pt-4 border-t">
                    <span className="text-xl font-bold">Total Quote:</span>
                    <Badge className="text-xl px-4 py-2 bg-primary text-primary-foreground">
                      {formatCurrency(totalQuoteValue)}
                    </Badge>
                  </div>
                </div>
              )}

              <FormField
                control={control}
                name="expectedRevenue"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel>Expected Revenue</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        value={field.value !== undefined ? field.value : ''} // Handle undefined
                      />
                    </FormControl>
                    <FormDescription>
                      The total estimated revenue for this job. This is automatically calculated from quote items but can be manually adjusted.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || createJobMutation.isPending || updateJobMutation.isPending}
            data-testid="submit-job-button"
          >
            {(createJobMutation.isPending || updateJobMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? 'Update Job' : 'Create Job'}
          </Button>
          {Object.keys(errors).length > 0 && (
            <div className="text-destructive text-sm mt-2">
              Please correct the errors above.
              {Object.entries(errors).map(([key, error]) => (
                <p key={key}>- {key}: {error?.message}</p>
              ))}
            </div>
          )}
        </form>
      </Form>
    </PortalLayout>
  );
}
