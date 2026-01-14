import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Box, Fan, DoorOpen, SlidersHorizontal, AlertCircle, FileText } from "lucide-react";
import { ITEM_TEMPLATES, ItemTemplate } from "@/lib/mock-data";
import { getItemTemplates, deleteItemTemplate } from "@/lib/local-storage";
import { useToast } from "@/hooks/use-toast";

// Helper to map string icon names to components
const IconMap: Record<string, any> = {
    Fan,
    Box,
    DoorOpen,
    SlidersHorizontal,
    FileText,
    default: Box
};

export default function TemplatesList() {
    const [customTemplates, setCustomTemplates] = useState<ItemTemplate[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        setCustomTemplates(getItemTemplates());
    }, []);

    const handleDelete = (type: string) => {
        if (confirm("Are you sure you want to delete this template?")) {
            deleteItemTemplate(type);
            setCustomTemplates(getItemTemplates());
            toast({ title: "Template deleted" });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-safe">
            {/* Header */}
            <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10 transition-all duration-200 shadow-sm">
                <Link href="/settings">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-900">Manage Item Templates</h1>
                    <p className="text-xs text-gray-500">Customize what you inspect</p>
                </div>
                <Link href="/settings/templates/new">
                    <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" /> New
                    </Button>
                </Link>
            </header>

            <main className="p-4 space-y-6">

                {/* Custom Templates Section */}
                {customTemplates.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-1">Your Custom Items</h2>
                        <div className="grid gap-3">
                            {customTemplates.map((template) => {
                                const Icon = IconMap[template.icon] || IconMap.default;
                                return (
                                    <Card key={template.type} className="overflow-hidden">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{template.label}</h3>
                                                    <p className="text-xs text-gray-500">{template.fields.length} fields defined</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(template.type)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Built-in Templates Section */}
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-1">Built-in Items</h2>
                    <div className="grid gap-3 opacity-75">
                        {Object.values(ITEM_TEMPLATES).filter(t => t.type !== 'custom').map((template) => {
                            const Icon = IconMap[template.icon] || IconMap.default;
                            return (
                                <Card key={template.type} className="bg-gray-50 border-gray-200">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-gray-200 rounded-lg text-gray-500">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-700">{template.label}</h3>
                                            <p className="text-xs text-gray-400">Default System Template</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

            </main>
        </div>
    );
}
