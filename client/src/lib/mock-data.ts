import { FIRE_DOOR_TEMPLATE } from "./fire-door-template";

export type InspectionItemType = 'fan' | 'duct' | 'hatch' | 'unit' | 'damper' | 'fire_door' | 'custom' | 'other';

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
    showWhen?: { field: string; value: string | string[] }; // Conditional visibility
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
    steps: InspectionStep[];
}

export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
    fan: {
        type: 'fan',
        label: 'Fan Unit',
        icon: 'Fan',
        fields: [
            { name: "location", label: "Location/ID", type: "text", required: true },
            { name: "belt_condition", label: "Belt Condition", type: "select", options: ["Good", "Worn", "Cracked", "Loose"] },
            { name: "motor_amps", label: "Motor Amps", type: "number" },
            { name: "bearings", label: "Bearings/Noise", type: "checkbox" },
            { name: "cleanliness", label: "Impeller Cleanliness", type: "select", options: ["Clean", "Dusty", "Dirty", "Clogged"] },
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
            { name: "cleanliness", label: "Internal Cleanliness", type: "select", options: ["Clean", "Light Dust", "Heavy Dust", "Debris"] },
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
            { name: "condition", label: "Condition", type: "select", options: ["Good", "Average", "Poor", "Damaged"] },
            { name: "notes", label: "Inspection Notes", type: "text" }, // FormStep handles text as Input, maybe need Textarea if long? we added Textarea support
            { name: "action_required", label: "Action Required?", type: "checkbox" }
        ]
    }
};

export const MOCK_TEMPLATES: InspectionTemplate[] = [
    {
        id: "hvac-maintenance-general",
        title: "HVAC Maintenance Checklist",
        description: "Standard comprehensive maintenance for HVAC units.",
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
                    { name: "drawing_ref", label: "Drawing Reference", type: "text", placeholder: "e.g., Fire Doors 2024" },
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
];

export const DEMO_DATA = {
    formData: {
        clientName: "Acme Corp Ltd",
        address: "123 Industrial Way, Tech Park, London, E1 6AN",
        job_number: "JOB-2026-001",
        operative: "John Smith",
    },
    items: [
        {
            id: "demo-1",
            type: "fan",
            label: "AHU-1 Supply Fan",
            status: "fail",
            data: {
                location: "Roof Plant Room",
                belt_condition: "Snapped",
                motor_amps: 0,
                bearings: false,
                cleanliness: "Dusty",
                notes: "Belt snapped, checks failed."
            },
            photos: ["https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&auto=format&fit=crop&q=60"],
            timestamp: Date.now()
        },
        {
            id: "demo-2",
            type: "duct",
            label: "Main Supply Duct",
            status: "needs-attention",
            data: {
                location: "Corridor G.01",
                cleanliness: "Light Dust",
                damage: false,
                leaks: true
            },
            photos: ["https://images.unsplash.com/photo-1581094794329-cd13693dd618?w=800&auto=format&fit=crop&q=60"], // Duct photo
            timestamp: Date.now()
        },
        {
            id: "demo-3",
            type: "fire_door",
            label: "FD-G01 (Stair Core)",
            status: "fail",
            data: {
                door_ref: "FD-G01",
                location: "Ground Floor Stair Lobby",
                rating: "FD30S",
                gap_check: "Fail (>4mm)",
                seals_intact: false,
                closer_check: true,
                hinges_grade: true,
                signage: true,
                glass_Check: true
            },
            photos: [],
            timestamp: Date.now()
        }
    ] as InspectionItem[]
};
