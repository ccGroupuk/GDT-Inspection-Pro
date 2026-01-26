import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import { InspectionTemplate, InspectionItem, InspectionItemType, DEMO_DATA } from "@/lib/mock-data";
import { FormStep } from "./FormStep";
import { PhotoStep } from "./PhotoStep";
import { ReviewStep } from "./ReviewStep";
import { RouteStep } from "./RouteStep";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { saveInspection } from "@/lib/local-storage";
import { AnimatePresence, motion } from "framer-motion";

import { SavedInspection, updateInspection } from "@/lib/local-storage";

interface WizardProps {
    template: InspectionTemplate;
    initialData?: SavedInspection;
    onCancel?: () => void;
}

export function Wizard({ template, initialData, onCancel }: WizardProps) {
    // Track direction for slide animation
    const [direction, setDirection] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [startTime] = useState<number>(initialData?.startTime || Date.now());

    // Core Data State
    const [formData, setFormData] = useState<Record<string, any>>(initialData?.data || {});

    // Initialize items from template defaults if available, OR from initialData
    const routeStep = template.steps.find(s => s.component === 'route');
    const [items, setItems] = useState<InspectionItem[]>(
        (initialData?.data?.items as InspectionItem[]) || routeStep?.defaultItems || []
    );

    const [errors, setErrors] = useState<Record<string, string>>({});
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    const currentStep = template.steps[currentStepIndex];
    const totalSteps = template.steps.length;
    const progress = ((currentStepIndex + 1) / totalSteps) * 100;

    const handleFieldChange = (name: string, value: any) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handlePhotoChange = (files: (string | any)[]) => {
        setFormData((prev) => ({ ...prev, photos: files }));
    };

    const handleDemoFill = () => {
        // Pre-fill form data
        setFormData((prev) => ({
            ...prev,
            ...DEMO_DATA.formData
        }));

        // If current step is route, pre-fill items too
        if (template.steps.some(s => s.component === 'route')) {
            setItems(DEMO_DATA.items);
        }

        toast({
            title: "Demo Mode Activated",
            description: "Form populated with dummy data.",
        });
    };

    const validateStep = () => {
        // Validation for "Route" step: Require at least one item?
        if (currentStep.component === 'route') {
            if (items.length === 0) {
                toast({
                    variant: "destructive",
                    title: "No Items Added",
                    description: "Please inspect at least one item before proceeding.",
                });
                return false;
            }
            return true;
        }

        if (!currentStep.fields) return true;

        const newErrors: Record<string, string> = {};
        let isValid = true;

        currentStep.fields.forEach(field => {
            if (field.required) {
                const value = formData[field.name];
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                    newErrors[field.name] = "This field is required";
                    isValid = false;
                }
            }
        });

        setErrors(newErrors);

        if (!isValid) {
            toast({
                variant: "destructive",
                title: "Required Fields Missing",
                description: "Please fill in all required fields highlighted in red.",
            });
        }

        return isValid;
    };

    const handleNext = () => {
        if (validateStep()) {
            if (currentStepIndex < totalSteps - 1) {
                setDirection(1);
                window.scrollTo(0, 0);
                setCurrentStepIndex((prev) => prev + 1);
            } else {
                handleSubmit();
            }
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setDirection(-1);
            window.scrollTo(0, 0);
            setCurrentStepIndex((prev) => prev - 1);
        } else if (currentStepIndex === 0 && onCancel) {
            onCancel();
        }
    };

    const handleSubmit = async () => {
        const finalData = {
            templateId: template.id,
            title: template.title,
            address: formData.address || "Unknown Address",
            data: { ...formData, items }, // Include the items
            status: "completed" as const,
            startTime: startTime,
            endTime: Date.now()
        };

        let savedId = initialData?.id;

        if (initialData && initialData.id) {
            // Update existing
            updateInspection({
                ...initialData,
                ...finalData,
                id: initialData.id
            });
        } else {
            // Create new
            const saved = saveInspection(finalData);
            savedId = saved.id;
        }

        toast({
            title: "Inspection Completed",
            description: "Report has been saved locally.",
        });

        // Simulate delay then redirect
        setTimeout(() => {
            setLocation(`/report/${savedId}`);
        }, 1500);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    return (
        <div className="flex flex-col min-h-dvh p-4 max-w-md mx-auto w-full bg-background text-foreground">
            {/* Header / Progress */}
            <div className="mb-6 space-y-2 z-10 bg-background/95 backdrop-blur pt-4 pb-4 sticky top-0 shadow-sm border-b border-border -mx-4 px-4">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-xl font-bold truncate pr-4 flex items-center gap-2">
                        {template.title}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-muted"
                            onClick={handleDemoFill}
                            title="Run Demo Fill"
                        >
                            <PlayCircle className="h-4 w-4" />
                        </Button>
                    </h1>
                    <span className="text-xs text-primary whitespace-nowrap font-medium">Step {currentStepIndex + 1} of {totalSteps}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <motion.div
                    key={`header-${currentStep.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <h2 className="text-lg font-semibold mt-2">{currentStep.title}</h2>
                    <p className="text-sm text-muted-foreground">{currentStep.description}</p>
                </motion.div>
            </div>

            {/* Step Content */}
            <div className="flex-1 relative overflow-x-hidden pb-24">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStepIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="w-full"
                    >
                        {currentStep.component === "route" ? (
                            <RouteStep
                                items={items}
                                onItemsChange={setItems}
                                allowedItemTypes={template.id === "fire-door-survey" ? ["fire_door"] : undefined}
                            />
                        ) : currentStep.component === "photo-upload" ? (
                            <PhotoStep
                                files={formData.photos || []}
                                onChange={handlePhotoChange}
                            />
                        ) : currentStep.component === "review" ? (
                            <ReviewStep
                                steps={template.steps}
                                data={formData}
                                items={items}
                                onChange={handleFieldChange}
                            />
                        ) : (
                            <FormStep
                                fields={currentStep.fields || []}
                                values={formData}
                                errors={errors}
                                onChange={handleFieldChange}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border bg-background z-20 pb-8 sticky bottom-0 -mx-4 px-4">
                <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStepIndex === 0 && !onCancel}
                    className="flex-1"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Button
                    onClick={handleNext}
                    className="flex-1"
                    variant={currentStepIndex === totalSteps - 1 ? "default" : "default"}
                >
                    {currentStepIndex === totalSteps - 1 ? (
                        <>Submit <CheckCircle2 className="w-4 h-4 ml-2" /></>
                    ) : (
                        <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                </Button>
            </div>
        </div>
    );
}
