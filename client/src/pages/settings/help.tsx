import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, ArrowLeft, BookOpen, FileText } from "lucide-react";
import { Link } from "wouter";
import { SOP_DATA } from "@/lib/sop-data";

export default function HelpPage() {
    const [search, setSearch] = useState("");

    const filteredSOPs = useMemo(() => {
        if (!search.trim()) return SOP_DATA;
        const lower = search.toLowerCase();
        return SOP_DATA.filter(sop =>
            sop.title.toLowerCase().includes(lower) ||
            sop.content.toLowerCase().includes(lower) ||
            sop.category.toLowerCase().includes(lower)
        );
    }, [search]);

    // Group by category
    const grouped = filteredSOPs.reduce((acc, sop) => {
        if (!acc[sop.category]) acc[sop.category] = [];
        acc[sop.category].push(sop);
        return acc;
    }, {} as Record<string, typeof SOP_DATA>);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 flex items-center border-b sticky top-0 bg-background/95 backdrop-blur z-10 shadow-sm border-border">
                <Link href="/settings">
                    <Button variant="ghost" size="icon" className="mr-2 hover:bg-muted">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="font-semibold text-lg text-foreground flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Help & SOPs
                </h1>
            </div>

            <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-6">

                {/* Search Header */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search SOPs (e.g., 'Fire Door', 'Sync')..."
                        className="pl-9 h-10 w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {Object.keys(grouped).length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No results found for "{search}"</p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([category, sops]) => (
                            <div key={category} className="space-y-3">
                                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">{category}</h2>
                                <Card>
                                    <Accordion type="single" collapsible className="w-full">
                                        {sops.map((sop, idx) => (
                                            <AccordionItem value={sop.id} key={sop.id} className={`${idx === sops.length - 1 ? 'border-b-0' : ''}`}>
                                                <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center text-left">
                                                        <FileText className="w-4 h-4 mr-3 text-cyan-600" />
                                                        <span className="font-semibold text-sm text-foreground">{sop.title}</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="px-4 pb-4 pt-1 bg-muted/20">
                                                    <p className="text-sm text-muted-foreground mb-4">{sop.content}</p>
                                                    {sop.steps && (
                                                        <div className="bg-background rounded-md border border-border p-3">
                                                            <h4 className="text-xs font-bold text-foreground mb-2 uppercase">Procedure Steps:</h4>
                                                            <ul className="space-y-2">
                                                                {sop.steps.map((step, i) => (
                                                                    <li key={i} className="text-sm flex gap-2 items-start">
                                                                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center mt-0.5">{i + 1}</span>
                                                                        <span className="text-foreground/90">{step}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </Card>
                            </div>
                        ))
                    )}
                </div>

            </main>
        </div>
    );
}
