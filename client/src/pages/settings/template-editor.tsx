import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Settings2, Box, Fan, DoorOpen, SlidersHorizontal, FileText, Zap, Droplet } from "lucide-react";
import { ItemTemplate, StepField } from "@/lib/mock-data";
import { saveItemTemplate } from "@/lib/local-storage";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Icons available for selection
const AVAILABLE_ICONS = [
    { name: "Box", icon: Box },
    { name: "Fan", icon: Fan },
    { name: "DoorOpen", icon: DoorOpen },
    { name: "SlidersHorizontal", icon: SlidersHorizontal },
    { name: "FileText", icon: FileText },
    { name: "Zap", icon: Zap },
    { name: "Droplet", icon: Droplet },
];

export default function TemplateEditor() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Editor State
    const [label, setLabel] = useState("");
    const [icon, setIcon] = useState("Box");
    const [fields, setFields] = useState<StepField[]>([
        { name: "location", label: "Location/ID", type: "text", required: true }, // Default field
    ]);

    const handleAddField = () => {
        setFields([
            ...fields,
            {
                name: `field_${Date.now()}`,
                label: "New Field",
                type: "text",
                required: false
            }
        ]);
    };

    const updateField = (index: number, key: keyof StepField, value: any) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], [key]: value };

        // Auto-generate name slug from label if it's the default generated one
        if (key === 'label' && newFields[index].name.startsWith('field_')) {
            // simplified slugify
            const slug = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
            // Only update name if we have a valid slug, otherwise keep ID
            if (slug.length > 0) newFields[index].name = slug;
        }

        setFields(newFields);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!label.trim()) {
            toast({ variant: "destructive", title: "Missing Name", description: "Please name your template." });
            return;
        }

        if (fields.length === 0) {
            toast({ variant: "destructive", title: "No Fields", description: "Please add at least one field." });
            return;
        }

        const typeId = `custom_${Date.now()}`;

        const newTemplate: ItemTemplate = {
            type: typeId as any,
            label: label,
            icon: icon,
            fields: fields
        };

        saveItemTemplate(newTemplate);

        toast({ title: "Template Created", description: `"${label}" is now available.` });
        setLocation("/settings/templates");
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-safe">
            {/* Header */}
            <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/settings/templates">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">New Item Template</h1>
                </div>
                <Button onClick={handleSave} size="sm" className="gap-2">
                    <Save className="w-4 h-4" /> Save
                </Button>
            </header>

            <main className="p-4 max-w-2xl mx-auto space-y-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Item Name</Label>
                            <Input
                                placeholder="e.g. Water Pump, Generator, Forklift..."
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Icon</Label>
                            <div className="flex gap-2 flex-wrap">
                                {AVAILABLE_ICONS.map((item) => (
                                    <div
                                        key={item.name}
                                        onClick={() => setIcon(item.name)}
                                        className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${icon === item.name
                                                ? "border-blue-500 bg-blue-50 text-blue-600"
                                                : "border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200"
                                            }`}
                                    >
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Fields Editor */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="font-semibold text-gray-900">Checklist Fields</h2>
                        <Button variant="outline" size="sm" onClick={handleAddField}>
                            <Plus className="w-4 h-4 mr-2" /> Add Field
                        </Button>
                    </div>

                    <div className="grid gap-3">
                        {fields.map((field, index) => (
                            <Card key={index} className="relative group">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-3 text-gray-400 cursor-move">
                                            <GripVertical className="w-5 h-5" />
                                        </div>

                                        <div className="flex-1 grid gap-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-gray-500">Label</Label>
                                                    <Input
                                                        value={field.label}
                                                        onChange={(e) => updateField(index, 'label', e.target.value)}
                                                        placeholder="Field Label"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-gray-500">Type</Label>
                                                    <Select
                                                        value={field.type}
                                                        onValueChange={(val) => updateField(index, 'type', val)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="text">Text Input</SelectItem>
                                                            <SelectItem value="number">Number</SelectItem>
                                                            <SelectItem value="checkbox">Checkbox (Pass/Fail)</SelectItem>
                                                            <SelectItem value="select">Dropdown (Good/Bad)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Extra options for specific types */}
                                            {field.type === 'select' && (
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-gray-500">Options (Comma separated)</Label>
                                                    <Input
                                                        placeholder="Good, Bad, Ugly"
                                                        defaultValue={field.options?.join(', ')}
                                                        onChange={(e) => updateField(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                    />
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-2 pt-1">
                                                <Switch
                                                    id={`req-${index}`}
                                                    checked={field.required}
                                                    onCheckedChange={(checked) => updateField(index, 'required', checked)}
                                                />
                                                <Label htmlFor={`req-${index}`} className="text-sm text-gray-600">Required Field</Label>
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-400 hover:text-red-500"
                                            onClick={() => removeField(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {fields.length === 0 && (
                        <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-400">
                            No fields defined. Click "Add Field" to start.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
