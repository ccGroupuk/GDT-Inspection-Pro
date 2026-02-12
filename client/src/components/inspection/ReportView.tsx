import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getInspections, getSettings, saveInspection, SavedInspection } from "@/lib/local-storage";
import { Printer, ArrowLeft, CheckCircle2, XCircle, AlertCircle, Pencil, Check, Share2, Copy, Upload } from "lucide-react";
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
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const { toast } = useToast();

    // Title Editing State
    const [title, setTitle] = useState("Certificate of Inspection");
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    // Custom Assets State
    const [customBanner, setCustomBanner] = useState<string | null>(null);
    const [customCover, setCustomCover] = useState<string | null>(null);

    useEffect(() => {
        if (params.id) {
            const all = getInspections();
            const found = all.find(i => i.id === params.id);
            if (found) {
                setInspection(found);
                if (found.reportTitle) setTitle(found.reportTitle);
                // Load custom assets if they exist
                if (found.data?.reportBannerUrl) setCustomBanner(found.data.reportBannerUrl);
                if (found.data?.reportCoverPhotoUrl) setCustomCover(found.data.reportCoverPhotoUrl);
            }

            const settings = getSettings();
            if (settings.trustBadges && settings.trustBadges.length > 0) setBadges(settings.trustBadges);
            if (settings.logoUrl) setLogoUrl(settings.logoUrl);
            if (settings.bannerUrl) setBannerUrl(settings.bannerUrl);
        }
    }, [params.id]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, target: 'banner' | 'cover') => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                if (target === 'banner') {
                    setCustomBanner(base64);
                    if (inspection) {
                        const updated = { ...inspection, data: { ...inspection.data, reportBannerUrl: base64 } };
                        saveInspection(updated);
                        setInspection(updated);
                    }
                } else {
                    setCustomCover(base64);
                    if (inspection) {
                        const updated = { ...inspection, data: { ...inspection.data, reportCoverPhotoUrl: base64 } };
                        saveInspection(updated);
                        setInspection(updated);
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };

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

            {/* A4 Page Container - Page 1 (Cover) */}
            <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none print:w-full print:max-w-none min-h-[297mm] flex flex-col relative print:break-after-always p-0 overflow-hidden mb-8 print:mb-0">

                {/* Top Banner with Logo Overlay */}
                <div className="h-[35%] w-full bg-slate-800 relative group">
                    {/* Hidden Input for Banner */}
                    <input
                        type="file"
                        id="banner-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'banner')}
                    />

                    {/* Banner Image Placeholder */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-700 opacity-90">
                        <img
                            src={customBanner || bannerUrl || "/assets/banner.jpg"}
                            alt="Banner"
                            className="w-full h-full object-cover opacity-60"
                        />
                    </div>

                    {/* Edit Overlay Button */}
                    <label
                        htmlFor="banner-upload"
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-2 rounded-lg cursor-pointer transition-all opacity-0 group-hover:opacity-100 print:hidden z-20 border border-white/20 shadow-lg"
                        title="Change Banner Image"
                    >
                        <Upload className="w-5 h-5" />
                    </label>

                    {/* Large GDT Logo Overlay (Global Setting or Default) */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center w-full max-w-2xl px-4">
                        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-gradient-to-b from-white/10 to-transparent">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Company Logo" className="max-h-40 mx-auto object-contain drop-shadow-2xl filter brightness-110" />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <h1 className="text-8xl font-black tracking-tighter mb-4 text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">GDT</h1>
                                    <div className="h-1 w-32 bg-gradient-to-r from-transparent via-white/50 to-transparent mb-4"></div>
                                    <p className="text-3xl font-light tracking-[0.6em] uppercase text-white drop-shadow-md">Envirocare</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Report Title */}
                <div className="text-center py-10 px-8">
                    {isEditingTitle ? (
                        <div className="flex justify-center items-center gap-2">
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-center text-2xl font-serif text-slate-800 tracking-widest uppercase w-full max-w-lg"
                            />
                            <Button size="icon" variant="ghost" onClick={handleSaveTitle}>
                                <Check className="w-5 h-5 text-green-600" />
                            </Button>
                        </div>
                    ) : (
                        <div className="group relative inline-block">
                            <h2 className="text-3xl font-serif text-slate-800 tracking-widest uppercase border-b-2 border-slate-300 pb-4 mb-2">
                                {title}
                            </h2>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                                onClick={() => setIsEditingTitle(true)}
                            >
                                <Pencil className="w-4 h-4 text-gray-400" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Main Site Photo */}
                <div className="flex-grow px-12 pb-8 flex items-center justify-center group relative">
                    <input
                        type="file"
                        id="cover-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'cover')}
                    />

                    <div className="w-full h-64 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden shadow-inner relative">
                        {(customCover || data.items?.[0]?.photos?.[0]) ? (
                            <img
                                src={customCover || (typeof data.items?.[0]?.photos?.[0] === 'string' ? data.items[0].photos[0] : data.items[0].photos[0]?.url)}
                                alt="Site"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center p-8">
                                <p className="text-gray-400 text-sm mb-2">No Site Photo Available</p>
                                <p className="text-xs text-gray-300">Take a photo for the first item to appear here</p>
                            </div>
                        )}

                        {/* Edit Overlay */}
                        <label
                            htmlFor="cover-upload"
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer print:hidden"
                        >
                            <div className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                <Upload className="w-4 h-4" />
                                <span>Change Cover Photo</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Footer / Client Details */}
                <div className="mt-auto px-12 pb-12">
                    <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm text-slate-700 mb-12 border-l-4 border-slate-300 pl-6">
                        <span className="font-bold text-slate-900 uppercase tracking-wide">Site Name:</span>
                        <span className="font-medium text-lg">{data.clientName || "Unknown Site"}</span>

                        <span className="font-bold text-slate-900 uppercase tracking-wide">Site Address:</span>
                        <span>{data.siteAddress || "Unknown Address"}</span>

                        <span className="font-bold text-slate-900 uppercase tracking-wide">Date of clean:</span>
                        <span>{data.inspectionDate ? new Date(data.inspectionDate).toLocaleDateString() : dateStr}</span>
                    </div>

                    {/* Corporate Footer with Logos */}
                    <div className="border-t-2 border-slate-300 pt-6 text-center">
                        <div className="text-slate-600 font-serif mb-6">
                            <p className="text-lg font-bold text-slate-800">GDT Envirocare, 44 Clos Mancheldowne, Barry, CF62 5AB</p>
                            <p className="text-sm tracking-wider">VAT No: 433714507 &nbsp;<span className="text-slate-300">|</span>&nbsp; COMPANY No: 11048398</p>
                        </div>

                        {/* Accreditation Logos Row */}
                        {/* Accreditation Logos Row */}
                        <div className="flex justify-center items-center gap-6 opacity-80 hover:opacity-100 transition-opacity flex-wrap px-4">
                            {badges && badges.length > 0 ? (
                                badges.map((badge, idx) => (
                                    <img key={idx} src={badge} alt="Accreditation" className="h-10 object-contain grayscale hover:grayscale-0 transition-all" />
                                ))
                            ) : (
                                <>
                                    <img src="/assets/chas.png" alt="CHAS" className="h-10 object-contain grayscale hover:grayscale-0 transition-all" />
                                    <img src="/assets/naaduk.jpg" alt="NAADUK" className="h-10 object-contain mix-blend-multiply grayscale hover:grayscale-0 transition-all" />
                                    <img src="/assets/constructionline.png" alt="Constructionline" className="h-10 object-contain grayscale hover:grayscale-0 transition-all" />
                                    <img src="/assets/cscs.png" alt="CSCS" className="h-10 object-contain grayscale hover:grayscale-0 transition-all" />
                                    <img src="/assets/ipaf.png" alt="IPAF" className="h-10 object-contain grayscale hover:grayscale-0 transition-all" />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- REST OF REPORT (Page 2+) --- */}
            <div className="max-w-[210mm] mx-auto bg-white shadow-lg p-[15mm] min-h-[297mm] print:shadow-none print:w-full print:max-w-none relative overflow-hidden print:break-before-always">

                {/* Header for Page 2 */}
                <div className="flex justify-between items-end border-b-2 border-slate-200 pb-4 mb-8">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800">Introduction</h3>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                        Page 2
                    </div>
                </div>

                {/* Standard Text Block */}
                <div className="prose max-w-none text-justify text-sm text-slate-700 mb-12 leading-relaxed">
                    <p className="mb-4">
                        Over time, cooking in a commercial kitchen causes deposits of airborne grease, dust, grime and steam to gather on the inner walls of kitchen extraction ducting. When regular professional cleaning of these ventilation systems is not carried out, this build-up can cause health and safety risks such as reduced airflow, fire hazards and unwanted odours.
                    </p>
                    <p className="mb-4">
                        Kitchen extraction cleaning removes the build-up of grease and grime from the inner walls of ducts, fans, vents and hoods in commercial kitchens. The process typically consists of removing the contaminants through a combination of scraping, brushing, vacuuming, caustic chemicals and hot water pressure washing.
                    </p>
                    <p>
                        In addition, water damaged, or bio-contaminated materials can be treated or removed during the cleaning process and broken parts replaced. There is also the opportunity to upgrade the system’s grease filters during cleaning. Higher quality filters trap grease particles more efficiently than lower grades, meaning it takes longer for the grease build-up to negatively affect the rest of the extraction system.
                    </p>
                </div>

                {/* Summary Section */}
                <div className="mb-12">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4 border-b pb-2">Summary</h3>
                    <p className="text-sm text-slate-700">
                        Internally, all accessible ducting has now been cleaned to BESA TR19 standards.
                    </p>
                </div>

                {/* Advisories Section */}
                <div className="mb-12">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4 border-b pb-2">Advisories</h3>
                    <p className="text-sm text-slate-700 italic">
                        Nothing to note.
                    </p>
                </div>

                {/* Job / Staff Details */}
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-xs text-slate-700 grid grid-cols-2 gap-4 mb-12">
                    <div><span className="font-bold">SITE NAME:</span> {data.clientName}</div>
                    <div><span className="font-bold">DATE:</span> {data.inspectionDate ? new Date(data.inspectionDate).toLocaleDateString() : dateStr}</div>
                    <div><span className="font-bold">START TIME:</span> 09:00</div>
                    <div><span className="font-bold">END TIME:</span> 17:00</div>
                    <div className="col-span-2"><span className="font-bold">STAFF ON SITE:</span> GARETH, BILLY, RAMZI & KEVIN</div>
                </div>

                {/* Inspection Checklist / Schedules */}
                <div className="mb-8">
                    {data.items && data.items.some((i: any) => i.type === 'fire_door') ? (
                        /* FIRE DOOR SCHEDULE */
                        /* DETAILED FIRE DOOR REPORT */
                        <>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Fire Door Inspection Detail</h3>
                            <div className="space-y-6">
                                {data.items.filter((i: any) => i.type === 'fire_door').map((door: any, idx: number) => {
                                    const d = door.data;
                                    const isFail = d.compliant?.includes('No') || door.status === 'fail';

                                    return (
                                        <div key={door.id} className="break-inside-avoid border rounded-lg p-4 bg-gray-50/50">
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-4 border-b pb-2">
                                                <div>
                                                    <h4 className="font-bold text-lg text-gray-900">Door #{d.door_id}</h4>
                                                    <p className="text-sm text-gray-600">{d.location_ref} ({d.door_type})</p>
                                                </div>
                                                <Badge status={isFail ? 'Fail' : 'Pass'} />
                                            </div>

                                            {/* Specifications Grid */}
                                            <div className="grid grid-cols-3 gap-y-2 gap-x-4 text-sm mb-4">
                                                <div><span className="text-gray-500 block text-xs">Rating</span> {d.resistance_rating}</div>
                                                <div><span className="text-gray-500 block text-xs">Dimensions</span> {d.door_height}x{d.door_width} mm</div>
                                                <div><span className="text-gray-500 block text-xs">Thickness</span> {d.door_thickness} mm</div>

                                                <div><span className="text-gray-500 block text-xs">Frame</span> {d.frame_material}</div>
                                                <div><span className="text-gray-500 block text-xs">Glazing</span> {d.glazing_type}</div>
                                                <div><span className="text-gray-500 block text-xs">Seals</span> {d.intumescent_seals}</div>
                                            </div>

                                            {/* Critical Checks (Gaps & Hardware) */}
                                            <div className="bg-white p-3 rounded border mb-4">
                                                <h5 className="font-semibold text-xs uppercase text-gray-500 mb-2">Critical Checks</h5>
                                                <div className="grid grid-cols-4 gap-2 text-sm">
                                                    <div className={Number(d.gap_top) > 4 ? "text-red-600 font-bold" : ""}>Top Gap: {d.gap_top}mm</div>
                                                    <div className={Number(d.gap_leading) > 4 ? "text-red-600 font-bold" : ""}>Leading Gap: {d.gap_leading}mm</div>
                                                    <div className={Number(d.gap_hinge_top) > 4 ? "text-red-600 font-bold" : ""}>Hinge Gap: {d.gap_hinge_top}mm</div>
                                                    <div className={Number(d.gap_bottom) > 10 ? "text-amber-600" : ""}>Bottom Gap: {d.gap_bottom}mm</div> {/* 10mm advisory for bottom usually? */}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm mt-2 border-t pt-2">
                                                    <div>Closer: <span className={d.closer_op?.includes('No') ? "text-red-600 font-bold" : "text-green-600"}>{d.closer_op}</span></div>
                                                    <div>Latch: <span className={d.latch_op?.includes('No') ? "text-red-600 font-bold" : "text-green-600"}>{d.latch_op}</span></div>
                                                </div>
                                            </div>

                                            {/* Remedials */}
                                            {d.remedials && (
                                                <div className="mb-4 text-sm bg-red-50 text-red-900 p-2 rounded border border-red-100">
                                                    <span className="font-bold">Remedial Action:</span> {d.remedials}
                                                </div>
                                            )}

                                            {/* Inline Photos */}
                                            {door.photos && door.photos.length > 0 && (
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {door.photos.map((p: any, pIdx: number) => (
                                                        <div key={pIdx} className="aspect-video bg-gray-200 rounded overflow-hidden border">
                                                            <img src={p.url} alt="Evidence" className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
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
                <div className="mt-12 pt-8 border-t-2 border-slate-200 page-break-inside-avoid">
                    <div className="grid grid-cols-2 gap-12">
                        {/* Engineer Signature */}
                        <div>
                            <p className="mb-4 text-xs font-bold uppercase text-slate-400 tracking-wider">Lead Engineer</p>
                            <div className="min-h-[80px] mb-2">
                                {inspection.signatures?.engineer ? (
                                    <div className="border rounded-lg bg-white p-4 inline-block shadow-sm">
                                        <img
                                            src={inspection.signatures.engineer}
                                            alt="Engineer Signature"
                                            className="h-16 object-contain"
                                        />
                                    </div>
                                ) : (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="h-20 w-48 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition-colors group print:hidden">
                                                <span className="text-sm text-slate-400 flex items-center font-medium group-hover:text-slate-600">
                                                    <PenTool className="w-4 h-4 mr-2" />
                                                    Sign Here
                                                </span>
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Lead Engineer Signature</DialogTitle>
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
                                                }}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                            <p className="font-bold text-slate-900 border-t border-slate-200 pt-2 inline-block min-w-[200px]">Gareth Jones</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Lead Technician | GDT Envirocare</p>
                        </div>

                        {/* Client Signature */}
                        <div className="text-right">
                            <div className="flex flex-col items-end">
                                <p className="mb-4 text-xs font-bold uppercase text-slate-400 tracking-wider">Client Representative</p>
                                <div className="min-h-[80px] mb-2">
                                    {inspection.signatures?.client ? (
                                        <div className="border rounded-lg bg-white p-4 inline-block shadow-sm">
                                            <img
                                                src={inspection.signatures.client}
                                                alt="Client Signature"
                                                className="h-16 object-contain ml-auto"
                                            />
                                        </div>
                                    ) : (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <div className="h-20 w-48 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition-colors group print:hidden">
                                                    <span className="text-sm text-slate-400 flex items-center font-medium group-hover:text-slate-600">
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
                                <p className="font-bold text-slate-900 border-t border-slate-200 pt-2 inline-block min-w-[200px]">{data["Client Name"] || "Client Representative"}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Site Manager / Owner</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- END CONTENT CONTAINER --- */}
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
