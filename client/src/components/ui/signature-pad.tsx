import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Check } from "lucide-react";

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set dimensions securely
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Handle resize
        const handleResize = () => {
            if (canvas.parentElement) {
                const r = canvas.parentElement.getBoundingClientRect();
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                canvas.width = r.width;
                canvas.height = r.height;
                ctx.putImageData(imageData, 0, 0);

                // Re-apply style after resize reset
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 2;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();

        let clientX = 0;
        let clientY = 0;

        if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ('clientX' in e) {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault(); // Prevent scrolling on touch
        setIsDrawing(true);
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing) return;

        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const ctx = canvasRef.current?.getContext("2d");
        ctx?.closePath();
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasSignature(false);
        }
    };

    const handleSave = () => {
        if (canvasRef.current) {
            onSave(canvasRef.current.toDataURL("image/png"));
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full h-full p-2">
            <div className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-lg touch-none relative min-h-[300px]">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full cursor-crosshair rounded-lg"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 opacity-50">
                        Sign Here
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClear} type="button">
                    <Eraser className="w-4 h-4 mr-2" />
                    Clear
                </Button>
                <Button variant="default" onClick={handleSave} disabled={!hasSignature} type="button">
                    <Check className="w-4 h-4 mr-2" />
                    Accept Signature
                </Button>
            </div>
        </div>
    );
}
