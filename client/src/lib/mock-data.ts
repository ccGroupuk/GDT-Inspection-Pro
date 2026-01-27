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
        drawing_ref: "FD-2026-Rev1",
    },
    items: [
        {
            id: "demo-fd-1",
            type: "fire_door",
            label: "FD-G01 (Main Stairwell)",
            status: "pass",
            data: {
                location_ids: "Ground Floor - Main Stairwell",
                door_type: "Single Leaf",
                door_leaf_certification: "Yes",
                fire_resistance_rating: "FD30s",
                signage: "FDKS (Keep Shut)",
                door_width: 926,
                door_height: 2040,
                door_thickness: 44,
                gap_hinge_top: 3,
                gap_hinge_mid: 3,
                gap_hinge_bot: 3,
                gap_leading_top: 3,
                gap_leading_mid: 3,
                gap_leading_bot: 3,
                flooring_level: "Yes",
                door_leaf_condition: "Yes",
                frame_type: "Timber",
                frame_fixed: "Yes",
                frame_condition: "Yes",
                smoke_seal_details: "15mm x 4mm Brush, White",
                smoke_seal_condition: "Yes",
                hinge_rating: "FD30",
                hinge_condition: "Yes",
                handle_functioning: "Yes",
                lock_operational: "Yes",
                closer_operational: "Yes",
                latch_25_seconds: "Yes",
                latch_70mm: "Yes",
                glazing_type: "N/A - Solid Door",
                compliant: "Yes",
            },
            photos: [],
            timestamp: Date.now()
        },
        {
            id: "demo-fd-2",
            type: "fire_door",
            label: "FD-G02 (Corridor Access)",
            status: "fail",
            data: {
                location_ids: "Ground Floor - Corridor B",
                door_type: "Single Leaf",
                door_leaf_certification: "No",
                fire_resistance_rating: "FD30",
                signage: "None",
                door_width: 838,
                door_height: 2040,
                door_thickness: 44,
                gap_hinge_top: 5,
                gap_hinge_mid: 6,
                gap_hinge_bot: 4,
                gap_leading_top: 5,
                gap_leading_mid: 5,
                gap_leading_bot: 5,
                flooring_level: "Yes",
                door_leaf_condition: "No",
                door_leaf_defects: "Damage to bottom edge, paint peeling",
                frame_type: "Timber",
                frame_fixed: "Yes",
                frame_condition: "Yes",
                smoke_seal_details: "Missing",
                smoke_seal_condition: "No",
                smoke_seal_defects: "Smoke seals completely missing",
                hinge_rating: "FD30",
                hinge_condition: "No",
                handle_functioning: "Yes",
                lock_operational: "Yes",
                closer_operational: "No",
                latch_25_seconds: "No",
                latch_70mm: "No",
                hardware_defects: "Door closer not functioning, fails to latch",
                glazing_type: "N/A - Solid Door",
                compliant: "No",
                remedials: "Replace door closer, install smoke seals, repair door leaf damage, add FDKS signage",
            },
            photos: [],
            timestamp: Date.now()
        },
        {
            id: "demo-fd-3",
            type: "fire_door",
            label: "FD-01-01 (First Floor Office)",
            status: "needs-attention",
            data: {
                location_ids: "First Floor - Office 101",
                door_type: "Double Leaf (Master/Slave)",
                door_leaf_certification: "Yes",
                fire_resistance_rating: "FD60",
                signage: "FDKS (Keep Shut)",
                door_width: 1524,
                door_height: 2040,
                door_thickness: 54,
                gap_hinge_top: 3,
                gap_hinge_mid: 4,
                gap_hinge_bot: 3,
                gap_leading_top: 4,
                gap_leading_mid: 4,
                gap_leading_bot: 4,
                flooring_level: "Yes",
                door_leaf_condition: "Yes",
                frame_type: "Metal",
                frame_fixed: "Yes",
                frame_condition: "Yes",
                smoke_seal_details: "20mm x 4mm Brush, Black",
                smoke_seal_condition: "Yes",
                hinge_rating: "FD60",
                hinge_condition: "Yes",
                handle_functioning: "Yes",
                lock_operational: "Yes",
                closer_operational: "Yes",
                latch_25_seconds: "Yes",
                latch_70mm: "Yes",
                glazing_type: "Georgian Wired",
                glazing_condition: "No",
                glazing_defects: "Minor crack in glazing bead",
                compliant: "No",
                remedials: "Replace glazing bead",
            },
            photos: [],
            timestamp: Date.now()
        }
    ] as InspectionItem[]
};
