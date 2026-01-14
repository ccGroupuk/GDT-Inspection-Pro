import { ItemTemplate, StepField } from "./mock-data";

const YES_NO_NA = ["Yes", "No", "N/A"];
const CONDITION = ["Good", "Minor Defect", "Major Defect", "Missing"];
const PASS_FAIL = ["Pass", "Fail"];

// Group fields into sections for the UI to render nicely
export const FIRE_DOOR_FIELDS: StepField[] = [
    // A. Location & ID
    { name: "location_ref", label: "Location Reference / No.", type: "text", required: true, placeholder: "e.g., 105 or Ground Floor Hall" },
    { name: "door_id", label: "Door ID(s)", type: "text", required: true, placeholder: "e.g., Fd1-007, Fd1-008" },
    { name: "drawing_ref", label: "Drawing Reference", type: "text", placeholder: "e.g., Fire Doors 2024" },

    // B. Door Leaf (General)
    { name: "door_type", label: "Door Set Type", type: "select", options: ["Single Leaf", "Double Leaf (Master/Slave)", "Leaf & a half"], required: true },
    { name: "certification_visible", label: "Certification Label Visible?", type: "select", options: ["Yes", "No", "Paint over", "Non readable"] },
    { name: "resistance_rating", label: "Fire Resistance Rating", type: "select", options: ["FD30", "FD30s", "FD60", "FD60s", "Nominal 30", "Nominal 60", "N/A"] },

    // Dimensions
    { name: "door_width", label: "Leaf Width (mm)", type: "number" },
    { name: "door_height", label: "Leaf Height (mm)", type: "number" },
    { name: "door_thickness", label: "Thickness (mm)", type: "number", placeholder: "e.g. 44 or 54" },

    // Gaps - Hinge Side
    { name: "gap_hinge_top", label: "Hinge Gap Top (mm)", type: "number" },
    { name: "gap_hinge_mid", label: "Hinge Gap Middle (mm)", type: "number" },
    { name: "gap_hinge_bot", label: "Hinge Gap Bottom (mm)", type: "number" },

    // Gaps - Leading Edge & Top
    { name: "gap_leading", label: "Leading Edge Gap (mm)", type: "number" },
    { name: "gap_top", label: "Top Gap (mm)", type: "number" },
    { name: "gap_bottom", label: "Bottom Gap / Threshold (mm)", type: "number" },

    // C. Frame
    { name: "frame_material", label: "Frame Material", type: "select", options: ["Timber", "Metal", "Composite", "Other"] },
    { name: "frame_condition", label: "Frame Condition", type: "select", options: CONDITION },
    { name: "frame_fixed", label: "Frame Securely Fixed?", type: "select", options: YES_NO_NA },

    // D. Seals & Signage
    { name: "signage", label: "Signage Installed", type: "select", options: ["None", "FDKS (Keep Shut)", "FDKL (Keep Locked)", "Automatic FDKC", "Incorrect Signage"] },
    { name: "intumescent_seals", label: "Intumescent Seals", type: "select", options: ["Intact", "Paint Bound", "Missing/Damaged", "Wrong Size", "N/A"] },
    { name: "smoke_seals", label: "Cold Smoke Seals", type: "select", options: ["Intact", "Damaged", "Missing", "N/A"] },

    // E. Hardware
    { name: "hinges_grade", label: "Hinge Grade/Condition", type: "select", options: ["Grade 13 (Good)", "Grade 11 (Good)", "Worn/Leaking", "Missing Screws", "Non-compliant"] },
    { name: "closer_op", label: "Door Closer Operational?", type: "select", options: ["Yes - Closes fully", "No - Fails to close", "No - slams", "N/A"] },
    { name: "latch_op", label: "Latch/Lock Operational?", type: "select", options: ["Yes", "No", "N/A"] },

    // F. Glazing
    { name: "glazing_type", label: "Glazing Type", type: "select", options: ["N/A - Solid Door", "Georgian Wired", "Clear Fire Glass", "Obscure"] },
    { name: "glazing_beads", label: "Glazing Beads/System", type: "select", options: ["Good / Intact", "Loose / Damaged", "Non-compliant"] },

    // G. Outcome
    { name: "compliant", label: "Is Door Compliant?", type: "select", options: ["Yes (Pass)", "No (Fail)"], required: true },
    { name: "remedials", label: "Recommended Remedials", type: "text", placeholder: "Describe required fixes..." },
];

export const FIRE_DOOR_TEMPLATE: ItemTemplate = {
    type: 'other', // Will be overridden or used as custom
    label: 'Fire Door',
    icon: 'DoorClosed',
    fields: FIRE_DOOR_FIELDS
};
