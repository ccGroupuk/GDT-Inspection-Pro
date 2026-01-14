import { Button } from "@/components/ui/button";
import { Camera as CameraIcon, X } from "lucide-react";
import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { PhotoItem } from "@/lib/mock-data";

interface PhotoStepProps {
    files: (string | PhotoItem)[];
    onChange: (files: (string | PhotoItem)[]) => void;
}

// Utility to compress image to max 800x800 and 0.7 quality
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.7));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

export function PhotoStep({ files = [], onChange }: PhotoStepProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCompressing, setIsCompressing] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsCompressing(true);
            try {
                const file = e.target.files[0];
                const compressed = await compressImage(file);
                // Add as object to support caption immediately
                onChange([...files, { url: compressed, caption: "" }]);
            } catch (error) {
                console.error("Error compressing image:", error);
            } finally {
                setIsCompressing(false);
                // Reset input so same file can be selected again if needed
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        }
    };

    const handleRemovePhoto = (indexToRemove: number) => {
        onChange(files.filter((_, idx) => idx !== indexToRemove));
    };

    const handleCaptionChange = (index: number, caption: string) => {
        const newFiles = [...files];
        const current = newFiles[index];

        if (typeof current === 'string') {
            newFiles[index] = { url: current, caption };
        } else {
            newFiles[index] = { ...current, caption };
        }
        onChange(newFiles);
    };

    const triggerCamera = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                const image = await Camera.getPhoto({
                    quality: 70,
                    allowEditing: false,
                    resultType: CameraResultType.DataUrl,
                    source: CameraSource.Camera,
                    width: 800,
                    height: 800
                });

                if (image.dataUrl) {
                    onChange([...files, { url: image.dataUrl, caption: "" }]);
                }
            } catch (error) {
                console.error("Camera error:", error);
                // Fallback to file input if user cancels or error
            }
        } else {
            // Web fallback
            fileInputRef.current?.click();
        }
    };

    return (
        <div className="space-y-4">
            {/* Hidden File Input */}
            <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="grid grid-cols-2 gap-4">
                {files.map((file, idx) => {
                    const url = typeof file === 'string' ? file : file.url;
                    const caption = typeof file === 'string' ? "" : file.caption;

                    return (
                        <div key={idx} className="space-y-2">
                            <Card className="aspect-square flex items-center justify-center bg-secondary overflow-hidden relative group">
                                <img
                                    src={url}
                                    alt={`Evidence ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => handleRemovePhoto(idx)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </Card>
                            <Input
                                placeholder="Add caption (e.g. Before/After)..."
                                className="h-8 text-xs bg-background"
                                value={caption}
                                onChange={(e) => handleCaptionChange(idx, e.target.value)}
                            />
                        </div>
                    );
                })}

                <Button
                    variant="outline"
                    className="aspect-square flex flex-col items-center justify-center h-auto border-dashed border-2 border-muted hover:border-primary hover:bg-accent transition-colors"
                    onClick={triggerCamera}
                    disabled={isCompressing}
                >
                    {isCompressing ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    ) : (
                        <>
                            <CameraIcon className="h-8 w-8 mb-2 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Take Photo</span>
                        </>
                    )}
                </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
                Photos are compressed automatically to save space.
            </p>
        </div>
    );
}
