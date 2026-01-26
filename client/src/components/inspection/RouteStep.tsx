import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Fan, Box, DoorOpen, SlidersHorizontal, AlertCircle, CheckCircle2 } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { ITEM_TEMPLATES, InspectionItem, InspectionItemType, ItemTemplate } from "@/lib/mock-data";
import { getItemTemplates } from "@/lib/local-storage";
import { FormStep } from "./FormStep"; // Reusing the form logic
import { PhotoStep } from "./PhotoStep"; // Reusing photo logic

// Helper to map string icon names to components
const IconMap: Record<string, any> = {
    Fan,
    Box,
    DoorOpen,
    SlidersHorizontal,
    default: Box
};

interface RouteStepProps {
    items: InspectionItem[];
    onItemsChange: (items: InspectionItem[]) => void;
    allowedItemTypes?: InspectionItemType[]; // Optional filter for allowed item types
}

export function RouteStep({ items, onItemsChange, allowedItemTypes }: RouteStepProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<InspectionItemType | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    // Temporary state for the new item being created
    const [newItemData, setNewItemData] = useState<Record<string, any>>({});
    const [newItemPhotos, setNewItemPhotos] = useState<(string | any)[]>([]); // simplified type for now or import PhotoItem

    // Load custom templates and merge with defaults
    // Note: In a real app we might use React Query or Context, but direct read is fine for now
    const customTemplates = getItemTemplates();
    let allTemplates: Record<string, ItemTemplate> = { ...ITEM_TEMPLATES };
    customTemplates.forEach(t => {
        allTemplates[t.type] = t;
    });

    // Filter templates if allowedItemTypes is specified
    if (allowedItemTypes && allowedItemTypes.length > 0) {
        const filtered: Record<string, ItemTemplate> = {};
        allowedItemTypes.forEach(type => {
            if (allTemplates[type]) {
                filtered[type] = allTemplates[type];
            }
        });
        allTemplates = filtered;
    }

    const handleAddItemStart = (type: InspectionItemType) => {
        setSelectedType(type);
        setEditingItemId(null);
        setNewItemData({});
        setNewItemPhotos([]);
    };

    const handleEditItem = (item: InspectionItem) => {
        setSelectedType(item.type);
        setEditingItemId(item.id);
        setNewItemData({ ...item.data });
        setNewItemPhotos([...item.photos]);
        setIsSheetOpen(true);
    };

    const handleSaveItem = () => {
        if (!selectedType) return;

        const template = allTemplates[selectedType];

        if (editingItemId) {
            // Update existing item
            const updatedItems = items.map(item => {
                if (item.id === editingItemId) {
                    const labelField = template.fields.find(f => f.name === 'location')?.name || 'id';
                    const label = newItemData[labelField] || item.label; // Keep old label if not found, or update

                    return {
                        ...item,
                        label: label,
                        data: newItemData,
                        photos: newItemPhotos,
                        timestamp: Date.now()
                    };
                }
                return item;
            });
            onItemsChange(updatedItems);
        } else {
            // Create New Item
            const labelField = template.fields.find(f => f.name === 'location')?.name || 'id';
            const label = newItemData[labelField] || `${template.label} #${items.length + 1}`;

            const newItem: InspectionItem = {
                id: crypto.randomUUID(),
                type: selectedType,
                label: label,
                status: 'pass', // Default, logic could calculate this
                data: newItemData,
                photos: newItemPhotos,
                timestamp: Date.now()
            };
            onItemsChange([...items, newItem]);
        }

        setIsSheetOpen(false);
        setSelectedType(null); // Reset selection
        setEditingItemId(null);
    };

    return (
        <div className="space-y-6">
            {/* The List of Items Added So Far */}
            <div className="space-y-3">
                {items.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg bg-muted/10">
                        <p className="text-muted-foreground mb-2">No items added yet.</p>
                        <p className="text-xs text-muted-foreground">Tap below to start adding fans, ducts, etc.</p>
                    </div>
                ) : (
                    items.map((item) => {
                        const template = allTemplates[item.type] || ITEM_TEMPLATES['custom']; // Fallback
                        const Icon = IconMap[template.icon] || IconMap.default;

                        return (
                            <Card
                                key={item.id}
                                className="overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
                                onClick={() => handleEditItem(item)}
                            >
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-full text-primary">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm">{item.label}</h4>
                                            <p className="text-xs text-muted-foreground">{template.label}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.photos.length > 0 && (
                                            <span className="text-xs bg-secondary px-2 py-1 rounded-full text-secondary-foreground">
                                                {item.photos.length} 📷
                                            </span>
                                        )}
                                        {item.status === 'fail' ? (
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                        ) : item.status === 'needs-attention' ? (
                                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                                        ) : (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* The "Add Item" Sheet/Modal */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button size="lg" className="w-full h-12 text-lg shadow-lg" onClick={() => handleAddItemStart(null as any)}>
                        <Plus className="w-5 h-5 mr-2" /> Add Item
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[90vh] sm:h-[800px] flex flex-col p-0 rounded-t-xl">

                    {!selectedType ? (
                        // 1. Selector View
                        <div className="p-6">
                            <SheetHeader className="mb-6 text-left">
                                <SheetTitle>Select Item Type</SheetTitle>
                            </SheetHeader>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.values(allTemplates).map((tmpl) => {
                                    const Icon = IconMap[tmpl.icon] || IconMap.default;
                                    return (
                                        <Button
                                            key={tmpl.type}
                                            variant="outline"
                                            className="h-24 flex flex-col gap-2 hover:bg-accent hover:border-primary"
                                            onClick={() => handleAddItemStart(tmpl.type)}
                                        >
                                            <Icon className="w-8 h-8 text-primary" />
                                            <span>{tmpl.label}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        // 2. Form/Detail View
                        <div className="flex flex-col h-full relative">
                            {/* Header */}
                            <div className="p-4 border-b flex items-center justify-between bg-secondary/50 flex-shrink-0">
                                <Button variant="ghost" size="sm" onClick={() => setSelectedType(null)}>
                                    Cancel
                                </Button>
                                <span className="font-semibold absolute left-1/2 -translate-x-1/2">
                                    {editingItemId ? 'Edit Item' : allTemplates[selectedType].label}
                                </span>
                                <div className="w-10"></div> {/* Spacer for alignment */}
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 pb-24">
                                {/* Details Form */}
                                <section>
                                    <h4 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wider">Details</h4>
                                    <FormStep
                                        fields={allTemplates[selectedType].fields}
                                        values={newItemData}
                                        onChange={(name, val) => setNewItemData(prev => ({ ...prev, [name]: val }))}
                                        errors={{}}
                                    />
                                </section>

                                {/* Photos */}
                                <section>
                                    <h4 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wider">Photos</h4>
                                    <PhotoStep
                                        files={newItemPhotos}
                                        onChange={setNewItemPhotos}
                                    />
                                </section>
                            </div>

                            {/* Sticky Footer */}
                            <div className="p-4 border-t bg-background absolute bottom-0 left-0 right-0 z-10 safe-area-bottom">
                                <Button size="lg" className="w-full" onClick={handleSaveItem}>
                                    {editingItemId ? 'Update Item' : 'Save Item'} <CheckCircle2 className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}

// Temporary polyfill if crypto.randomUUID isn't available in older browsers/environments (standard in modern ones)
if (!crypto.randomUUID) {
    (crypto as any).randomUUID = () => {
        return (String(1e7) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    };
}
