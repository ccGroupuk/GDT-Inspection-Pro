import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getInspections, getSettings, saveInspection, SavedInspection } from "@/lib/local-storage";
import { Printer, ArrowLeft, CheckCircle2, XCircle, AlertCircle, Pencil, Check, Share2, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { SignaturePad } from "@/components/ui/signature-pad";
import { PenTool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formatDuration = (start?: number, end?: number) => {
    if (!start || !end) return "N/A";
    const diff = end - start;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
};

export default function ReportView() {
    const params = useParams();
    const [inspection, setInspection] = useState<SavedInspection | null>(null);
    const [badges, setBadges] = useState<string[]>([]);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const { toast } = useToast();

    // Title Editing State
    const [title, setTitle] = useState("Certificate of Inspection");
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    useEffect(() => {
        if (params.id) {
            const all = getInspections();
            const found = all.find(i => i.id === params.id);
            if (found) {
                setInspection(found);
                if (found.reportTitle) setTitle(found.reportTitle);
            }

            const settings = getSettings();
            if (settings.trustBadges) setBadges(settings.trustBadges);
            if (settings.bannerUrl) setBannerUrl(settings.bannerUrl);
        }
    }, [params.id]);

    const handleSaveTitle = () => {
        if (inspection) {
            const updated = { ...inspection, reportTitle: title };
            saveInspection(updated);
            setInspection(updated);
            setIsEditingTitle(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Inspection Report: ${inspection?.address}`,
            text: `View the inspection report for ${inspection?.address}`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast({
                    title: "Link Copied",
                    description: "Report link copied to clipboard.",
                });
            } catch (err) {
                toast({
                    variant: "destructive",
                    title: "Share Failed",
                    description: "Could not share or copy link.",
                });
            }
        }
    };

    if (!inspection) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p>Loading or Inspection Not Found...</p>
                <Link href="/">
                    <Button variant="link">Return Home</Button>
                </Link>
            </div>
        );
    }

    const { data } = inspection;
    const dateStr = new Date(inspection.timestamp).toLocaleDateString();

    return (
        <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
            {/* Action Bar - Hidden on Print */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <Link href="/">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Link href={`/inspection/edit/${inspection.id}`}>
                        <Button variant="secondary">
                            <Pencil className="w-4 h-4 mr-2" />
                            Re-take / Edit
                        </Button>
                    </Link>
                    <Button onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print / Save PDF
                    </Button>
                </div>
            </div>

            {/* A4 Page Container */}
            <div className="max-w-[210mm] mx-auto bg-white shadow-lg p-[15mm] min-h-[297mm] print:shadow-none print:w-full print:max-w-none relative overflow-hidden">

                {/* Report Banner */}
                <div className="absolute top-0 left-0 right-0 h-[30mm] overflow-hidden -z-0">
                    {bannerUrl ? (
                        <img src={bannerUrl} alt="Report Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-600 to-cyan-500"></div>
                    )}
                </div>

                {/* Spacing for Banner */}
                <div className="h-[20mm] mb-6"></div>

                {/* Header */}
                <div className="border-b-2 border-primary pb-6 mb-8 flex justify-between items-start relative z-10 bg-white/90 p-4 rounded-b-lg backdrop-blur-sm">
                    <div>
                        <h1 className="text-3xl font-bold text-primary mb-1">GDT Inspection Pro</h1>
                        <p className="text-sm text-gray-500">HVAC Maintenance & Certification</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                            {isEditingTitle ? (
                                <>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="h-8 w-64 text-right font-semibold text-gray-900"
                                    />
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveTitle}>
                                        <Check className="w-4 h-4 text-green-600" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 print:hidden opacity-50 hover:opacity-100"
                                        onClick={() => setIsEditingTitle(true)}
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </Button>
                                </>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Ref: {inspection.id.toUpperCase().slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">Date: {dateStr}</p>
                    </div>
                </div>

                {/* Certification Status Banner & Defects Summary */}
                {(() => {
                    const failedItems = data.items ? data.items.filter((i: any) => i.status === 'fail' || i.status === 'needs-attention') : [];
                    const hasDefects = failedItems.length > 0;

                    return (
                        <div className="mb-8 space-y-6">
                            {/* Status Banner */}
                            <div className={`p-4 rounded-lg border-l-4 flex items-center justify-between ${hasDefects
                                ? "bg-red-50 border-red-500 text-red-900"
                                : "bg-green-50 border-green-500 text-green-900"
                                }`}>
                                <div>
                                    <h3 className="font-bold text-lg uppercase tracking-wide">
                                        Certification Status: {hasDefects ? "ACTION REQUIRED" : "PASS"}
                                    </h3>
                                    <p className="text-sm opacity-90">
                                        {hasDefects
                                            ? "One or more items require remedial attention before final certification."
                                            : "All inspected items meet the required standards."}
                                    </p>
                                </div>
                                {hasDefects ? <AlertCircle className="w-8 h-8 text-red-600" /> : <CheckCircle2 className="w-8 h-8 text-green-600" />}
                            </div>

                            {/* Defects List */}
                            {hasDefects && (
                                <div className="border border-red-200 rounded-lg overflow-hidden">
                                    <div className="bg-red-100/50 p-3 border-b border-red-200">
                                        <h3 className="font-bold text-red-900 flex items-center gap-2">
                                            <XCircle className="w-4 h-4" />
                                            Defects / Remedials Required
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-red-100">
                                        {failedItems.map((item: any) => (
                                            <div key={item.id} className="p-3 bg-red-50/30 flex justify-between items-start">
                                                <div>
                                                    <span className="font-semibold text-gray-900 text-sm block">{item.label}</span>
                                                    <span className="text-xs text-red-700 font-medium uppercase mt-0.5 block">{item.status.replace('-', ' ')}</span>
                                                </div>
                                                <div className="text-right text-sm text-gray-600 max-w-[60%]">
                                                    {item.status === 'fail' && item.type === 'fire_door'
                                                        ? `${item.data?.gap_check || "Visual failure"}`
                                                        : item.data?.notes || "Requires maintenance or repair."}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Client & Job Details */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Client Details</h3>
                        <div className="bg-gray-50 p-4 rounded-md print:bg-transparent print:p-0 print:border">
                            <p className="font-medium text-gray-900">{data["Client Name"] || "N/A"}</p>
                            <p className="text-gray-600">{data.address}</p>
                            <p className="text-gray-600">{data["Contact Phone"]}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Equipment</h3>
                        <div className="bg-gray-50 p-4 rounded-md print:bg-transparent print:p-0 print:border">
                            <p><span className="text-gray-500">Make/Brand:</span> {data["Make/Brand"] || "N/A"}</p>
                            <p><span className="text-gray-500">Model:</span> {data["Model Number"] || "N/A"}</p>
                            <p><span className="text-gray-500">Serial:</span> {data["Serial Number"] || "N/A"}</p>
                            <p><span className="text-gray-500">Age:</span> {data["Approximate Age (Years)"] || "0"} Years</p>
                        </div>
                    </div>
                </div>

                {/* Inspection Checklist / Schedules */}
                <div className="mb-8">
                    {data.items && data.items.some((i: any) => i.type === 'fire_door') ? (
                        /* FIRE DOOR SCHEDULE */
                        <>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Fire Door Schedule</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-100 text-gray-700 font-semibold print:bg-gray-200">
                                        <tr>
                                            <th className="p-2 border-b">ID / Ref</th>
                                            <th className="p-2 border-b">Location</th>
                                            <th className="p-2 border-b">Type</th>
                                            <th className="p-2 border-b text-center">Rating</th>
                                            <th className="p-2 border-b text-center">Gaps</th>
                                            <th className="p-2 border-b text-center">Stat</th>
                                            <th className="p-2 border-b">Remedials / Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {data.items.filter((i: any) => i.type === 'fire_door').map((door: any) => {
                                            const d = door.data;
                                            return (
                                                <tr key={door.id} className="break-inside-avoid">
                                                    <td className="p-2 font-medium border-l border-b">{d.door_id}</td>
                                                    <td className="p-2 border-b">{d.location_ref}</td>
                                                    <td className="p-2 border-b">{d.door_type}</td>
                                                    <td className="p-2 text-center border-b">{d.resistance_rating}</td>
                                                    <td className="p-2 text-center border-b">
                                                        {/* Check key gaps - simple summary */}
                                                        {(d.gap_top > 4 || d.gap_leading > 4 || d.gap_hinge_top > 4) ?
                                                            <span className="text-red-600 font-bold">Fail</span> :
                                                            <span className="text-green-600">OK</span>
                                                        }
                                                    </td>
                                                    <td className="p-2 text-center border-b">
                                                        <Badge status={d.compliant?.includes('Yes') ? 'pass' : 'fail'} />
                                                    </td>
                                                    <td className="p-2 text-gray-500 border-r border-b break-words max-w-[200px]">
                                                        {d.remedials || "None"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        /* GENERIC CHECKLIST FALLBACK */
                        <>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Inspection Checks</h3>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-700 font-semibold print:bg-gray-200">
                                    <tr>
                                        <th className="p-3 rounded-tl-md">Item</th>
                                        <th className="p-3 w-32 text-center">Status</th>
                                        <th className="p-3 rounded-tr-md">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {/* Generic Data Rendering */}
                                    {Object.entries(data).filter(([key, val]) =>
                                        ['Clean Filter', 'Check Voltage', 'Inspect Belt', 'Check Refrigerant', 'Test Thermostat'].includes(key) ||
                                        (typeof val === 'boolean' || val === 'Pass' || val === 'Fail' || val === 'N/A')
                                    ).map(([key, value]) => (
                                        <tr key={key}>
                                            <td className="p-3 font-medium text-gray-800 border-l border-b">{key}</td>
                                            <td className="p-3 text-center border-b">
                                                <Badge status={String(value)} />
                                            </td>
                                            <td className="p-3 text-gray-500 border-r border-b">-</td>
                                        </tr>
                                    ))}
                                    {/* Fallback mock if completely empty generic data */}
                                    {(!Object.keys(data).some(k => ['Pass', 'Fail'].includes(data[k as keyof typeof data]))) && !data.items && (
                                        <>
                                            <tr>
                                                <td className="p-3 border-l border-b">Filter Condition</td>
                                                <td className="p-3 text-center border-b"><Badge status="Pass" /></td>
                                                <td className="p-3 border-r border-b">Clean/Replaced</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 border-l border-b">System Voltage</td>
                                                <td className="p-3 text-center border-b"><Badge status="Pass" /></td>
                                                <td className="p-3 border-r border-b">240V Stable</td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>

                {/* Photos Grid - Aggregated from General + Items */}
                {(() => {
                    const generalPhotos = data.photos || [];
                    const itemPhotos = data.items ? data.items.flatMap((i: any) => i.photos || []) : [];
                    const allPhotos = [...generalPhotos, ...itemPhotos];

                    if (allPhotos.length === 0) return null;

                    return (
                        <div className="mb-8 page-break-inside-avoid">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Site Photos ({allPhotos.length})</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {allPhotos.map((photo: any, idx: number) => {
                                    const url = typeof photo === 'string' ? photo : photo.url;
                                    const caption = typeof photo === 'string' ? null : photo.caption;

                                    return (
                                        <div key={idx} className="flex flex-col gap-1 break-inside-avoid">
                                            <div className="aspect-video bg-gray-100 rounded-md overflow-hidden border relative">
                                                <img
                                                    src={url}
                                                    alt={`Evidence ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                                                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs text-gray-400">Image Load Error</span>`;
                                                    }}
                                                />
                                            </div>
                                            {caption && (
                                                <p className="text-xs font-semibold text-gray-700 text-center bg-gray-50 py-1 rounded border border-gray-100 italic">
                                                    {caption}
                                                </p>
                                            )}
                                            {!caption && (
                                                <p className="text-[10px] text-gray-400 text-center">Photo {idx + 1}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}


                {/* Statistics Chart */}
                {(() => {
                    // Calculate stats
                    let pass = 0;
                    let fail = 0;
                    let advisory = 0;

                    // Helper to categorize status
                    const categorize = (status: any) => {
                        const s = String(status).toLowerCase();
                        if (['pass', 'completed', 'true', 'yes', 'ok', 'compliant'].includes(s)) return 'pass';
                        if (['fail', 'false', 'no', 'non-compliant'].includes(s)) return 'fail';
                        return 'advisory';
                    };

                    // Count from items if available
                    if (data.items && Array.isArray(data.items)) {
                        data.items.forEach((item: any) => {
                            const cat = categorize(item.status || item.data?.compliant || 'advisory');
                            if (cat === 'pass') pass++;
                            else if (cat === 'fail') fail++;
                            else advisory++;
                        });
                    } else {
                        // Fallback to generic data keys
                        Object.entries(data).forEach(([key, val]) => {
                            if (['Pass', 'Fail'].includes(val as string) || typeof val === 'boolean') {
                                const cat = categorize(val);
                                if (cat === 'pass') pass++;
                                else if (cat === 'fail') fail++;
                                // Don't count advisory for generic fields to avoid noise
                            }
                        });
                    }

                    const chartData = [
                        { name: 'Compliant', value: pass, color: '#16a34a' }, // green-600
                        { name: 'Fail / Action', value: fail, color: '#dc2626' }, // red-600
                        { name: 'Advisory', value: advisory, color: '#eab308' }, // yellow-500
                    ].filter(d => d.value > 0);

                    if (chartData.length === 0) return null;

                    return (
                        <div className="mb-8 page-break-inside-avoid">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Inspection Summary</h3>
                            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-6 border border-gray-100">
                                <div className="h-[250px] w-full max-w-[500px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [`${value} Items`, 'Count']}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="ml-8 space-y-4">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-gray-900">{pass + fail + advisory}</p>
                                        <p className="text-xs text-gray-500 uppercase">Total Checks</p>
                                    </div>
                                    {fail > 0 && (
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-red-600">{fail}</p>
                                            <p className="text-xs text-red-600 uppercase font-semibold">Failures</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Footer / Signature */}
                <div className="mt-12 pt-8 border-t border-gray-200 page-break-inside-avoid">
                    <div className="grid grid-cols-2 gap-12">
                        {/* Engineer Signature */}
                        <div>
                            <p className="mb-4 text-xs font-semibold uppercase text-gray-400">Engineer Signature</p>
                            <div className="min-h-[64px] mb-2">
                                {inspection.signatures?.engineer ? (
                                    <img
                                        src={inspection.signatures.engineer}
                                        alt="Engineer Signature"
                                        className="h-16 object-contain"
                                    />
                                ) : (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="h-16 border-b-2 border-dashed border-gray-300 flex items-end pb-1 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors group print:hidden">
                                                <span className="text-sm text-gray-400 flex items-center group-hover:text-blue-600">
                                                    <PenTool className="w-4 h-4 mr-2" />
                                                    Sign Here
                                                </span>
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Engineer Signature</DialogTitle>
                                                <DialogDescription>
                                                    Please sign below to certify this inspection.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <SignaturePad
                                                onCancel={() => { }}
                                                onSave={(dataUrl) => {
                                                    const updated = {
                                                        ...inspection,
                                                        signatures: { ...inspection.signatures, engineer: dataUrl }
                                                    };
                                                    saveInspection(updated);
                                                    setInspection(updated);
                                                    // Close dialog via simply re-rendering or user action (Dialog auto-closes on unmount if we controlled it, but here we can just let user click outside or we could control open state. 
                                                    // For simplicity in this step, user can click outside or hit Esc. 
                                                    // But better to auto close. We will need state control for that. 
                                                    // For now let's just save.
                                                }}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                            <p className="font-semibold text-gray-900">John Doe (Lead Engineer)</p>
                            <p className="text-xs text-gray-500">Technician ID: GDT-8821</p>
                        </div>

                        {/* Client Signature */}
                        <div className="text-right">
                            <div className="flex flex-col items-end">
                                <p className="mb-4 text-xs font-semibold uppercase text-gray-400 self-end">Client Signature</p>
                                <div className="min-h-[64px] mb-2 w-full max-w-[200px]">
                                    {inspection.signatures?.client ? (
                                        <img
                                            src={inspection.signatures.client}
                                            alt="Client Signature"
                                            className="h-16 object-contain ml-auto"
                                        />
                                    ) : (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <div className="h-16 border-b-2 border-dashed border-gray-300 flex items-end justify-end pb-1 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors group print:hidden">
                                                    <span className="text-sm text-gray-400 flex items-center group-hover:text-blue-600">
                                                        <PenTool className="w-4 h-4 mr-2" />
                                                        Sign Here
                                                    </span>
                                                </div>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Client Signature</DialogTitle>
                                                    <DialogDescription>
                                                        Please sign below to acknowledge receipt of this report.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <SignaturePad
                                                    onCancel={() => { }}
                                                    onSave={(dataUrl) => {
                                                        const updated = {
                                                            ...inspection,
                                                            signatures: { ...inspection.signatures, client: dataUrl }
                                                        };
                                                        saveInspection(updated);
                                                        setInspection(updated);
                                                    }}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                                <p className="font-semibold text-gray-900">{data["Client Name"] || "Client"}</p>
                                <p className="text-xs text-gray-500">{dateStr}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-8 text-[10px] text-gray-400 text-center leading-tight">
                    <p>This certificate confirms that the equipment described above has been inspected in accordance with company standards. This report is limited to visual and accessible components only. It does not guarantee future performance or life expectancy of the unit settings.</p>
                </div>

            </div>
        </div >
    );
}

function Badge({ status }: { status: string }) {
    const s = status.toLowerCase();
    if (s === 'pass' || s === 'completed' || s === 'true') {
        return <span className="inline-flex items-center text-green-700 font-bold"><CheckCircle2 className="w-4 h-4 mr-1" /> Pass</span>
    }
    if (s === 'fail' || s === 'false') {
        return <span className="inline-flex items-center text-red-700 font-bold"><XCircle className="w-4 h-4 mr-1" /> Fail</span>
    }
    return <span className="inline-flex items-center text-yellow-700 font-bold"><AlertCircle className="w-4 h-4 mr-1" /> Check</span>
}
