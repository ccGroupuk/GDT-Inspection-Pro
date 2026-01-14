import { useState, useEffect } from "react";
import { Wizard } from "@/components/inspection/Wizard";
import { MOCK_TEMPLATES, InspectionTemplate } from "@/lib/mock-data";
import { getCustomTemplates, getInspections } from "@/lib/local-storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, FileText, ArrowLeft, Bookmark } from "lucide-react";
import { Link } from "wouter";

export default function NewInspection({ params }: { params?: { id?: string } }) {
    const [selectedTemplate, setSelectedTemplate] = useState<InspectionTemplate | null>(null);
    const [customTemplates, setCustomTemplates] = useState<InspectionTemplate[]>([]);
    const [initialData, setInitialData] = useState<any>(null);

    useEffect(() => {
        setCustomTemplates(getCustomTemplates());

        // If we have an ID, we are editing/retaking
        if (params?.id) {
            const allInspections = getInspections();
            const found = allInspections.find(i => i.id === params.id);
            if (found) {
                // Determine template
                const allT = [...MOCK_TEMPLATES, ...getCustomTemplates()];
                const t = allT.find(temp => temp.id === found.templateId);
                if (t) {
                    setSelectedTemplate(t);
                    setInitialData(found);
                }
            }
        }
    }, [params?.id]);

    const allTemplates = [...MOCK_TEMPLATES, ...customTemplates];

    // If a template is selected (either by user or by edit mode), launch the Wizard
    if (selectedTemplate) {
        return (
            <div className="min-h-screen bg-background pb-safe">
                <Wizard
                    template={selectedTemplate}
                    initialData={initialData}
                    onCancel={() => setSelectedTemplate(null)}
                />
            </div>
        );
    }

    // Otherwise, show the selection screen
    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-md mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4 py-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New Inspection</h1>
                        <p className="text-sm text-gray-500">Select an inspection type to begin</p>
                    </div>
                </div>

                {/* Templates List */}
                <div className="grid gap-4">
                    {allTemplates.map((template) => (
                        <Card
                            key={template.id}
                            className="cursor-pointer hover:border-blue-500 transition-all duration-300 active:scale-[0.98] dark:hover:shadow-[0_0_20px_rgba(14,165,233,0.2)] dark:border-slate-800"
                            onClick={() => setSelectedTemplate(template)}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-semibold text-blue-900">
                                    {template.title}
                                </CardTitle>
                                {customTemplates.some(t => t.id === template.id) ? (
                                    <Bookmark className="w-5 h-5 text-yellow-500" />
                                ) : (
                                    <FileText className="w-5 h-5 text-blue-500" />
                                )}
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="line-clamp-2 mb-4">
                                    {template.description}
                                </CardDescription>
                                <Button className="w-full" variant="secondary">
                                    Start Inspection <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

            </div>
        </div>
    );
}
