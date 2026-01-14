import { InspectionStep, InspectionItem, ITEM_TEMPLATES, InspectionTemplate } from "@/lib/mock-data";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Bookmark, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { saveCustomTemplate } from "@/lib/local-storage";

import { Textarea } from "@/components/ui/textarea";

interface ReviewStepProps {
    steps: InspectionStep[];
    data: Record<string, any>;
    items?: InspectionItem[];
    onChange: (name: string, value: any) => void;
}

export function ReviewStep({ steps, data, items = [], onChange }: ReviewStepProps) {
    const { toast } = useToast();

    const handleSaveTemplate = () => {
        const name = prompt("Enter a name for this Job Template (e.g. 'Site A - Monthly'):");
        if (!name) return;

        // Clone steps and attach items to the route step
        const newSteps = steps.map(s => {
            if (s.component === 'route') {
                return { ...s, defaultItems: items };
            }
            return s;
        });

        const newTemplate: InspectionTemplate = {
            id: 'custom-' + Math.random().toString(36).substring(7),
            title: name,
            description: `Custom template with ${items.length} pre-defined items.`,
            steps: newSteps
        };

        saveCustomTemplate(newTemplate);

        toast({
            title: "Template Saved",
            description: `"${name}" has been saved to your 'New Inspection' list.`,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleSaveTemplate} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save as Template
                </Button>
            </div>
            {steps.map((step) => {
                if (step.id === "review") return null;

                // Handle the "Route" step specially (Show the list of items)
                if (step.component === 'route') {
                    return (
                        <div key={step.id} className="bg-card rounded-lg border p-4 shadow-sm">
                            <h3 className="font-semibold text-sm text-card-foreground mb-2">{step.title}</h3>
                            <Separator className="mb-3" />
                            <div className="space-y-3">
                                {items.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No items inspected.</p>
                                ) : (
                                    items.map((item, idx) => {
                                        const template = ITEM_TEMPLATES[item.type];
                                        return (
                                            <div key={item.id} className="flex justify-between items-start text-sm border-b pb-2 last:border-0 last:pb-0">
                                                <div>
                                                    <span className="font-medium block text-foreground">{item.label}</span>
                                                    <span className="text-muted-foreground text-xs">{template?.label}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {item.status === 'fail' ? (
                                                        <>
                                                            <span className="text-xs text-red-500 font-bold">Fail</span>
                                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                                        </>
                                                    ) : item.status === 'needs-attention' ? (
                                                        <>
                                                            <span className="text-xs text-yellow-500 font-bold">Check</span>
                                                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-xs text-green-500 font-bold">Pass</span>
                                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    );
                }

                // Standard Form Steps
                return (
                    <div key={step.id} className="bg-card rounded-lg border p-4 shadow-sm">
                        <h3 className="font-semibold text-sm text-card-foreground mb-2">{step.title}</h3>
                        <Separator className="mb-3" />

                        <div className="space-y-2">
                            {step.fields ? (
                                // Display Standard Fields
                                step.fields.map((field) => (
                                    <div key={field.name} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{field.label}</span>
                                        <span className="font-medium text-foreground">
                                            {field.type === "checkbox"
                                                ? data[field.name]
                                                    ? "Pass"
                                                    : "Not Checked"
                                                : data[field.name] || "-"}
                                        </span>
                                    </div>
                                ))
                            ) : step.component === "photo-upload" ? (
                                // Display Photos Section
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Photos Attached:</span>
                                    <span className="font-medium ml-2 text-foreground">{data.photos?.length || 0}</span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                );
            })}

            <div className="bg-card rounded-lg border p-4 shadow-sm">
                <h3 className="font-semibold text-sm text-card-foreground mb-2">Additional Information</h3>
                <Separator className="mb-3" />
                <Textarea
                    placeholder="Add any final notes, recommendations, or summary for the client..."
                    value={data.clientNotes || ''}
                    onChange={(e) => onChange('clientNotes', e.target.value)}
                    className="min-h-[100px] bg-background"
                />
            </div>
        </div>
    );
}
