import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { StepField } from "@/lib/mock-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface FormStepProps {
    fields: StepField[];
    values: Record<string, any>;
    errors?: Record<string, string>;
    onChange: (name: string, value: any) => void;
}

export function FormStep({ fields, values, errors = {}, onChange }: FormStepProps) {
    // Filter fields based on showWhen conditions
    const visibleFields = fields.filter((field) => {
        if (!field.showWhen) return true;
        const { field: dependsOn, value: requiredValue } = field.showWhen;
        const currentValue = values[dependsOn];
        if (Array.isArray(requiredValue)) {
            return requiredValue.includes(currentValue);
        }
        return currentValue === requiredValue;
    });

    return (
        <div className="space-y-6">
            {visibleFields.map((field) => (
                <div key={field.name} className="flex flex-col space-y-2">
                    {field.type === "checkbox" ? (
                        <div className={`flex items-center space-x-2 border rounded-lg p-3 bg-background ${errors[field.name] ? "border-red-500 bg-red-900/20" : ""}`}>
                            <Checkbox
                                id={field.name}
                                checked={values[field.name]}
                                onCheckedChange={(checked) => onChange(field.name, checked)}
                            />
                            <Label
                                htmlFor={field.name}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full"
                            >
                                {field.label}
                            </Label>
                        </div>
                    ) : field.type === "select" ? (
                        <div className="space-y-1">
                            <Label htmlFor={field.name} className={errors[field.name] ? "text-red-500" : ""}>{field.label}</Label>
                            <Select
                                value={values[field.name]}
                                onValueChange={(val) => onChange(field.name, val)}
                            >
                                <SelectTrigger className={`bg-background ${errors[field.name] ? "border-red-500" : ""}`}>
                                    <SelectValue placeholder={field.placeholder || "Select option..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {field.options?.map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors[field.name] && (
                                <p className="text-xs text-red-500">{errors[field.name]}</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <Label htmlFor={field.name} className={errors[field.name] ? "text-red-500" : ""}>{field.label}</Label>
                            {field.name === 'remedials' ? (
                                <Textarea
                                    id={field.name}
                                    value={values[field.name] || ""}
                                    onChange={(e) => onChange(field.name, e.target.value)}
                                    placeholder={field.placeholder}
                                    className={`bg-background min-h-[100px] ${errors[field.name] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                />
                            ) : (
                                <Input
                                    id={field.name}
                                    type={field.type}
                                    value={values[field.name] || ""}
                                    onChange={(e) => onChange(field.name, e.target.value)}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    className={`bg-background ${errors[field.name] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                />
                            )}
                            {errors[field.name] && (
                                <p className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1">{errors[field.name]}</p>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
