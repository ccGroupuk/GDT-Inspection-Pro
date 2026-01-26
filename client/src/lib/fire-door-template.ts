import { ItemTemplate, StepField } from "./mock-data";

const YES_NO = ["Yes", "No"];
const YES_NO_OBSTRUCTED = ["Yes", "No", "Obstructed"];

// Fire Door Survey Fields - Exact order per user specification
export const FIRE_DOOR_FIELDS: StepField[] = [
    // 1. Location ID's
    { name: "location_ids", label: "Location ID's", type: "text", required: true, placeholder: "e.g., Ground Floor Corridor" },

    // 2. Door set type
    { name: "door_type", label: "Door Set Type", type: "select", options: ["Single Leaf", "Double Leaf (Master/Slave)", "Leaf & a Half"], required: true },

    // 3. Door leaf certification
    { name: "door_leaf_certification", label: "Door Leaf Certification", type: "select", options: YES_NO_OBSTRUCTED },

    // 4. Fire resistance rating (restricted options)
    { name: "fire_resistance_rating", label: "Fire Resistance Rating", type: "select", options: ["FD30", "FD30s", "FD60", "FD60s"], required: true },

    // 5. Fire door signage
    { name: "signage", label: "Fire Door Signage", type: "select", options: ["None", "FDKS (Keep Shut)", "FDKL (Keep Locked)", "Automatic FDKC", "Incorrect Signage"] },

    // 6. Actual door size (W x H)
    { name: "door_width", label: "Actual Door Width (mm)", type: "number", placeholder: "e.g., 926" },
    { name: "door_height", label: "Actual Door Height (mm)", type: "number", placeholder: "e.g., 2040" },

    // 7. Door leaf thickness
    { name: "door_thickness", label: "Door Leaf Thickness (mm)", type: "number", placeholder: "e.g., 44" },

    // 8. Door leaf gaps - Hinge stile (3 measurements)
    { name: "gap_hinge_top", label: "Hinge Stile Gap - Top (mm)", type: "number" },
    { name: "gap_hinge_mid", label: "Hinge Stile Gap - Middle (mm)", type: "number" },
    { name: "gap_hinge_bot", label: "Hinge Stile Gap - Bottom (mm)", type: "number" },

    // 9. Door leaf gaps - Leading stile (3 measurements)
    { name: "gap_leading_top", label: "Leading Stile Gap - Top (mm)", type: "number" },
    { name: "gap_leading_mid", label: "Leading Stile Gap - Middle (mm)", type: "number" },
    { name: "gap_leading_bot", label: "Leading Stile Gap - Bottom (mm)", type: "number" },

    // 10. Door leaf gaps - Top rail (3 measurements)
    { name: "gap_top_left", label: "Top Rail Gap - Left (mm)", type: "number" },
    { name: "gap_top_mid", label: "Top Rail Gap - Middle (mm)", type: "number" },
    { name: "gap_top_right", label: "Top Rail Gap - Right (mm)", type: "number" },

    // 11. Door leaf gaps - Bottom rail closed position (3 measurements)
    { name: "gap_bottom_left", label: "Bottom Rail Gap (Closed) - Left (mm)", type: "number" },
    { name: "gap_bottom_mid", label: "Bottom Rail Gap (Closed) - Middle (mm)", type: "number" },
    { name: "gap_bottom_right", label: "Bottom Rail Gap (Closed) - Right (mm)", type: "number" },

    // 12. Threshold gap on open position (3 measurements)
    { name: "threshold_gap_left", label: "Threshold Gap (Open) - Left (mm)", type: "number" },
    { name: "threshold_gap_mid", label: "Threshold Gap (Open) - Middle (mm)", type: "number" },
    { name: "threshold_gap_right", label: "Threshold Gap (Open) - Right (mm)", type: "number" },

    // 13. Is the flooring level on door swing
    { name: "flooring_level", label: "Is Flooring Level on Door Swing?", type: "select", options: YES_NO },

    // 14. Door leaf condition acceptable
    { name: "door_leaf_condition", label: "Door Leaf Condition Acceptable?", type: "select", options: YES_NO },

    // 15. Door leaf details of defects (conditional - show if above = No)
    { name: "door_leaf_defects", label: "Door Leaf Details of Defects", type: "text", placeholder: "Describe defects...", showWhen: { field: "door_leaf_condition", value: "No" } },

    // 16. Door frame type
    { name: "frame_type", label: "Door Frame Type", type: "select", options: ["Timber", "Metal", "Composite", "Other"] },

    // 17. Door frame jamb width
    { name: "frame_jamb_width", label: "Door Frame Jamb Width (mm)", type: "number" },

    // 18. Door frame securely fixed
    { name: "frame_fixed", label: "Door Frame Securely Fixed?", type: "select", options: YES_NO },

    // 19. Door frame condition acceptable
    { name: "frame_condition", label: "Door Frame Condition Acceptable?", type: "select", options: YES_NO },

    // 20. Door frame details of defects (conditional)
    { name: "frame_defects", label: "Door Frame Details of Defects", type: "text", placeholder: "Describe defects...", showWhen: { field: "frame_condition", value: "No" } },

    // 21. Cold smoke seal size, type & colour
    { name: "smoke_seal_details", label: "Cold Smoke Seal Size, Type & Colour", type: "text", placeholder: "e.g., 15mm x 4mm, Brush, White" },

    // 22. Cold smoke seal condition acceptable
    { name: "smoke_seal_condition", label: "Cold Smoke Seal Condition Acceptable?", type: "select", options: YES_NO },

    // 23. Cold smoke seal details of defects (conditional)
    { name: "smoke_seal_defects", label: "Cold Smoke Seal Details of Defects", type: "text", placeholder: "Describe defects...", showWhen: { field: "smoke_seal_condition", value: "No" } },

    // 24. Hardware - hinge rating
    { name: "hinge_rating", label: "Hardware - Hinge Rating", type: "select", options: ["FD30", "FD60"] },

    // 25. Hardware - hinge condition acceptable
    { name: "hinge_condition", label: "Hardware - Hinge Condition Acceptable?", type: "select", options: YES_NO },

    // 26. Hardware - handle functioning correctly
    { name: "handle_functioning", label: "Hardware - Handle Functioning Correctly?", type: "select", options: YES_NO },

    // 27. Hardware - lock/latch operational
    { name: "lock_operational", label: "Hardware - Lock/Latch Operational?", type: "select", options: YES_NO },

    // 28. Hardware - door closer operational
    { name: "closer_operational", label: "Hardware - Door Closer Operational?", type: "select", options: YES_NO },

    // 29. Does door latch from fully open in less than 25 seconds
    { name: "latch_25_seconds", label: "Door Latches from Fully Open < 25 Seconds?", type: "select", options: YES_NO },

    // 30. Does door latch from 70mm open position
    { name: "latch_70mm", label: "Door Latches from 70mm Open Position?", type: "select", options: YES_NO },

    // 31. Hardware details of defects
    { name: "hardware_defects", label: "Hardware Details of Defects", type: "text", placeholder: "Describe any hardware defects..." },

    // 32. Glazing type
    { name: "glazing_type", label: "Glazing Type", type: "select", options: ["N/A - Solid Door", "Georgian Wired", "Clear Fire Glass", "Obscure"] },

    // 33. Glazing condition acceptable
    { name: "glazing_condition", label: "Glazing Condition Acceptable?", type: "select", options: YES_NO },

    // 34. Glazing details of defects (conditional)
    { name: "glazing_defects", label: "Glazing Details of Defects", type: "text", placeholder: "Describe defects...", showWhen: { field: "glazing_condition", value: "No" } },

    // 35. Any other defects
    { name: "other_defects", label: "Any Other Defects", type: "text", placeholder: "List any additional defects..." },

    // 36. Is the door compliant
    { name: "compliant", label: "Is the Door Compliant?", type: "select", options: YES_NO, required: true },

    // 37. Recommended remedials
    { name: "remedials", label: "Recommended Remedials", type: "text", placeholder: "Describe required fixes..." },

    // 38. Photos - Handled by PhotoStep component separately
];

export const FIRE_DOOR_TEMPLATE: ItemTemplate = {
    type: 'other',
    label: 'Fire Door',
    icon: 'DoorClosed',
    fields: FIRE_DOOR_FIELDS
};
