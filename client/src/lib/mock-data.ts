import { FIRE_DOOR_TEMPLATE } from "./fire-door-template";

export type InspectionItemType = 'fan' | 'duct' | 'hatch' | 'unit' | 'damper' | 'fire_door' | 'custom' | 'other' | 'consumer_unit' | 'circuit_test' | 'rcd_test';

export interface PhotoItem {
    url: string;
    caption?: string;
    timestamp?: number;
}

export interface InspectionItem {
    id: string;
    type: InspectionItemType;
    label: string; // e.g., "AHU-1" or "Duct Run A"
    status: 'pass' | 'fail' | 'needs-attention';
    data: Record<string, any>; // Specific measurements/checks
    photos: (string | PhotoItem)[];
    timestamp: number;
}

export interface ItemTemplate {
    type: InspectionItemType;
    label: string;
    icon: string; // Lucide icon name
    fields: StepField[];
}

export interface StepField {
    name: string;
    label?: string; // For checkboxes/inputs
    type: "text" | "number" | "checkbox" | "photo" | "date" | "select";
    placeholder?: string;
    required?: boolean;
    options?: string[]; // For select inputs
    condition?: { field: string; equals?: string; notEquals?: string };
}

export interface InspectionStep {
    id: string;
    title: string;
    description?: string;
    fields?: StepField[]; // For form-style steps
    component?: "photo-upload" | "review" | "route"; // Added "route"
    defaultItems?: InspectionItem[]; // Pre-populated items for templates
}

export interface InspectionTemplate {
    id: string;
    title: string;
    description: string;
    category?: "hvac" | "electrician";
    steps: InspectionStep[];
}

export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
    fan: {
        type: 'fan',
        label: 'Fan Unit',
        icon: 'Fan',
        fields: [
            { name: "location", label: "Location/ID", type: "text", required: true },
            { name: "belt_condition", label: "Belt Condition", type: "select", options: ["Good", "Worn", "Cracked", "Loose"], required: true },
            { name: "motor_amps", label: "Motor Amps", type: "number", required: true },
            { name: "bearings", label: "Bearings/Noise", type: "checkbox" }, // Checkbox always has value
            { name: "cleanliness", label: "Impeller Cleanliness", type: "select", options: ["Clean", "Dusty", "Dirty", "Clogged"], required: true },
        ]
    },
    hatch: {
        type: 'hatch',
        label: 'Access Hatch',
        icon: 'DoorOpen',
        fields: [
            { name: "location", label: "Location", type: "text", required: true },
            { name: "seal_integrity", label: "Seal Integrity", type: "checkbox" },
            { name: "hardware", label: "Hardware/Latches", type: "checkbox" },
            { name: "access_clear", label: "Access Clearance", type: "checkbox" },
        ]
    },
    duct: {
        type: 'duct',
        label: 'Duct Run',
        icon: 'Box',
        fields: [
            { name: "location", label: "Area/Zone", type: "text", required: true },
            { name: "cleanliness", label: "Internal Cleanliness", type: "select", options: ["Clean", "Light Dust", "Heavy Dust", "Debris"], required: true },
            { name: "damage", label: "Physical Damage", type: "checkbox" },
            { name: "leaks", label: "Air Leaks Detected", type: "checkbox" },
        ]
    },
    damper: {
        type: 'damper',
        label: 'Fire/Volume Damper',
        icon: 'SlidersHorizontal',
        fields: [
            { name: "location", label: "Location/ID", type: "text", required: true },
            { name: "operation", label: "Mechanical Operation", type: "checkbox" },
            { name: "fusible_link", label: "Fusible Link Intact", type: "checkbox" },
            { name: "drop_test", label: "Drop Test Performed", type: "checkbox" }
        ]
    },
    fire_door: {
        ...FIRE_DOOR_TEMPLATE,
        type: 'fire_door'
    },
    custom: {
        type: 'custom',
        label: 'Custom Item',
        icon: 'PlusSquare',
        fields: [
            { name: "item_name", label: "Item Name / Type", type: "text", placeholder: "e.g. EC Unit, Pump, Etc.", required: true },
            { name: "location", label: "Location", type: "text", required: true },
            { name: "condition", label: "Condition", type: "select", options: ["Good", "Average", "Poor", "Damaged"], required: true },
            { name: "notes", label: "Inspection Notes", type: "text" }, // Notes can be optional
            { name: "action_required", label: "Action Required?", type: "checkbox" },
            { name: "requires_quote", label: "Requires Remedial Quote?", type: "checkbox" }
        ]
    },
    consumer_unit: {
        type: 'consumer_unit',
        label: 'Consumer Unit',
        icon: 'Zap',
        fields: [
            { name: "location", label: "Location", type: "text", required: true },
            { name: "make", label: "Make / Manufacturer", type: "text", required: true },
            { name: "main_switch_size", label: "Main Switch Rating (A)", type: "number", required: true },
            { name: "ip_rating_intact", label: "IP Rating Intact?", type: "checkbox" },
            { name: "blanks_fitted", label: "Blanking Plates Fitted?", type: "checkbox" },
            { name: "rcd_protection", label: "Overall RCD Protection?", type: "checkbox" },
            { name: "requires_quote", label: "Requires Remedial Quote?", type: "checkbox" }
        ]
    },
    circuit_test: {
        type: 'circuit_test',
        label: 'Circuit Test',
        icon: 'Activity',
        fields: [
            { name: "circuit_ref", label: "Circuit Reference", type: "text", required: true },
            { name: "circuit_type", label: "Circuit Type", type: "select", options: ["Lighting", "Ring Final", "Radial", "Cooker", "Shower"], required: true },
            { name: "zs_reading", label: "Zs Reading (Ohms)", type: "text", required: true },
            { name: "ir_reading", label: "Insulation Resistance (M Ohms)", type: "text", required: true },
            { name: "continuity_ok", label: "Continuity Verified?", type: "checkbox" },
            { name: "requires_quote", label: "Requires Remedial Quote?", type: "checkbox" }
        ]
    },
    rcd_test: {
        type: 'rcd_test',
        label: 'RCD / RCBO Test',
        icon: 'ShieldAlert',
        fields: [
            { name: "device_ref", label: "Device Reference", type: "text", required: true },
            { name: "rating_ma", label: "Trip Rating (mA)", type: "select", options: ["30mA", "100mA", "300mA"], required: true },
            { name: "trip_1x", label: "Trip Time @ 1x (ms)", type: "number", required: true },
            { name: "trip_5x", label: "Trip Time @ 5x (ms)", type: "number" },
            { name: "test_button_ok", label: "Test Button Operational?", type: "checkbox" },
            { name: "requires_quote", label: "Requires Remedial Quote?", type: "checkbox" }
        ]
    }
};

export const MOCK_TEMPLATES: InspectionTemplate[] = [
    {
        id: "hvac-maintenance-general",
        title: "HVAC Maintenance Checklist",
        description: "Standard comprehensive maintenance for HVAC units.",
        category: "hvac",
        steps: [
            {
                id: "job-setup",
                title: "Job Setup",
                description: "Client and Site Details",
                fields: [
                    { name: "clientName", label: "Client Name", type: "text", required: true },
                    { name: "address", label: "Service Address", type: "text", required: true },
                    { name: "job_number", label: "Job Number", type: "text" },
                ],
            },
            {
                id: "route-inspection",
                title: "Inspection Route",
                description: "Walk the site and add items as you inspect them.",
                component: "route",
            },
            {
                id: "review",
                title: "Review & Submit",
                component: "review",
            },
        ],
    },
    {
        id: "fire-door-survey",
        title: "Fire Door Survey",
        description: "Comprehensive inspection of fire door sets (FD30/60).",
        category: "hvac",
        steps: [
            {
                id: "survey-setup",
                title: "Survey Setup",
                description: "Building & Client Details",
                fields: [
                    { name: "clientName", label: "Client Name", type: "text", required: true },
                    { name: "address", label: "Site Address", type: "text", required: true },
                    { name: "job_number", label: "Job Number", type: "text" },
                    { name: "operative", label: "Operative Name", type: "text" },
                ],
            },
            {
                id: "door-route",
                title: "Door Schedule",
                description: "Add each door set found on the route.",
                component: "route",
            },
            {
                id: "review",
                title: "Review & Submit",
                component: "review",
            },
        ],
    },
    {
        id: "eicr-report",
        title: "Electrical Installation Condition Report (EICR)",
        description: "Standard EICR form for domestic and commercial properties.",
        category: "electrician",
        steps: [
            {
                id: "job-setup",
                title: "Job Setup",
                description: "Client and Site Details",
                fields: [
                    { name: "clientName", label: "Client Name", type: "text", required: true },
                    { name: "address", label: "Service Address", type: "text", required: true },
                    { name: "job_number", label: "Job Number", type: "text" },
                    { name: "installation_type", label: "Installation Type", type: "select", options: ["Domestic", "Commercial", "Industrial"], required: true }
                ],
            },
            {
                id: "electrical-inspection",
                title: "Board & Circuit Tests",
                description: "Add consumer units, RCD tests, and individual circuit tests.",
                component: "route",
                defaultItems: []
            },
            {
                id: "review",
                title: "Review & Submit",
                component: "review",
            },
        ],
    },
];

export const DEMO_DATA = {
    formData: {
        clientName: "Smith & Sons Manufacturing",
        address: "Unit 4, Industrial Estate, Cardiff, CF10 1EP",
        job_number: "EICR-2026-089",
        operative: "Gareth Jones",
        installation_type: "Commercial"
    },
    items: [
        {
            id: "demo-elec-1",
            type: "consumer_unit",
            label: "Main Distribution Board",
            status: "pass",
            data: {
                location: "Ground Floor Plant Room",
                make: "Schneider",
                main_switch_size: 100,
                ip_rating_intact: true,
                blanks_fitted: true,
                rcd_protection: true,
                requires_quote: false,
                notes: "Board in good condition."
            },
            photos: [],
            timestamp: Date.now()
        },
        {
            id: "demo-elec-2",
            type: "circuit_test",
            label: "Ring Final - Ground Floor",
            status: "pass",
            data: {
                circuit_ref: "L1",
                circuit_type: "Ring Final",
                zs_reading: "0.45",
                ir_reading: ">299",
                continuity_ok: true,
                requires_quote: false
            },
            photos: [],
            timestamp: Date.now()
        },
        {
            id: "demo-elec-3",
            type: "custom",
            label: "Damaged Socket Outlet",
            status: "fail",
            data: {
                item_name: "Double Socket",
                location: "Staff Kitchen",
                condition: "Damaged",
                notes: "Faceplate cracked, exposing live terminals. Isolated immediately.",
                action_required: true,
                requires_quote: true
            },
            photos: ["https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&auto=format&fit=crop&q=60"], // Example photo
            timestamp: Date.now()
        }
    ] as InspectionItem[]
};
