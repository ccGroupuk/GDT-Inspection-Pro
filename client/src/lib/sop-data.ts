export interface SOP {
    id: string;
    title: string;
    category: 'General' | 'Inspection' | 'Safety' | 'Troubleshooting';
    content: string;
    steps?: string[];
}

export const SOP_DATA: SOP[] = [
    {
        id: 'sop-001',
        title: 'Starting a New Inspection',
        category: 'General',
        content: 'Standard procedure for initiating a client job.',
        steps: [
            'Ensure device battery is above 20%.',
            'Navigate to the Home Dashboard.',
            'Tap the large "Start New Inspection" button.',
            'Select the appropriate template (e.g., HVAC Standard).',
            'Fill in client details accurately.'
        ]
    },
    {
        id: 'sop-002',
        title: 'Fire Door Inspection Criteria',
        category: 'Inspection',
        content: 'Checklist for validating fire door compliance (FD30/FD60).',
        steps: [
            'Check gap compliance: Top/Sides < 4mm, Bottom < 10mm.',
            'Verify intumescent strips are present and undamaged.',
            'Test self-closing device: Door must close from 75 degrees.',
            'Check glasing integrity and markings.',
            'Photograph any defects clearly.'
        ]
    },
    {
        id: 'sop-003',
        title: 'Photo Evidence Standards',
        category: 'Inspection',
        content: 'Requirements for taking valid evidence photos.',
        steps: [
            'Ensure good lighting.',
            'Take a "Wide" shot of the asset first.',
            'Take a "Close-up" of the defect or rating plate.',
            'Avoid blurry images; retake if necessary.',
            'Use the annotation tool to circle specific issues if available.'
        ]
    },
    {
        id: 'sop-004',
        title: 'Syncing Offline Data',
        category: 'Troubleshooting',
        content: 'How to ensure offline work is saved to the server.',
        steps: [
            'Connect to a stable Wi-Fi network.',
            'Open the report view for the offline inspection.',
            'Wait for the "Synced" indicator (if applicable) or manually click Save.',
            'Check the Dashboard to see if the status is updated.'
        ]
    },
    {
        id: 'sop-005',
        title: 'PPE Requirements',
        category: 'Safety',
        content: 'Mandatory Personal Protective Equipment.',
        steps: [
            'Safety Boots (Steel toe).',
            'High-visibility vest or jacket.',
            'Safety goggles when inspecting pressurized systems.',
            'Gloves for manual handling.'
        ]
    },
    {
        id: 'sop-006',
        title: 'Sharing Inspection Reports',
        category: 'General',
        content: 'How to distribute the final report to clients or the office.',
        steps: [
            'Complete and sign the inspection to generate the report.',
            'Tap the "Share" button in the top action bar.',
            'On Mobile: Select your preferred app (Email, WhatsApp, SMS).',
            'On Desktop: The link is copied to your clipboard; paste it into an email.',
            'Alternatively, use "Print / Save PDF" to download a hard copy.'
        ]
    }
];
