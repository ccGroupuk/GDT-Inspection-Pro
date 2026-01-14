export interface SavedInspection {
    id: string;
    templateId: string;
    title: string;
    address: string;
    data: Record<string, any>;
    status: 'draft' | 'completed' | 'synced';
    isSynced?: boolean; // New flag for explicit sync status
    timestamp: number;
    startTime?: number;
    endTime?: number;
    reportTitle?: string;
    signatures?: {
        engineer?: string; // base64 data url
        client?: string;   // base64 data url
    };
}

const STORAGE_KEY = 'gdt_inspections';

function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper to sync to server backup
const syncToBackup = async (data: SavedInspection) => {
    try {
        const response = await fetch('/api/backup-inspection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log(`[Sync] Backed up ${data.id} to server`);
            // Mark as synced locally
            markAsSynced(data.id);
            return true;
        }
        return false;
    } catch (e) {
        console.error("[Sync] Backup failed", e);
        return false;
    }
};

const markAsSynced = (id: string) => {
    const all = getInspections();
    const updated = all.map(i => i.id === id ? { ...i, isSynced: true } : i);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch event to update UI
    window.dispatchEvent(new Event('inspections-updated'));
};

export const saveInspection = (inspection: Omit<SavedInspection, "id" | "timestamp"> & { id?: string }) => {
    const existing = getInspections();

    const newRecord: SavedInspection = {
        ...inspection,
        id: inspection.id || generateId(),
        timestamp: Date.now(),
        isSynced: false,
    };

    // Update if exists, or add new to top
    const updated = [newRecord, ...existing.filter(i => i.id !== newRecord.id)];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('inspections-updated'));

    // Trigger backup (non-blocking)
    syncToBackup(newRecord);

    return newRecord;
}

export const updateInspection = (inspection: SavedInspection) => {
    const existing = getInspections();
    // Replace the existing record with the updated one
    // Reset sync status on update because it needs re-uploading
    const toSave = { ...inspection, isSynced: false };

    const updated = existing.map(i => i.id === inspection.id ? toSave : i);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('inspections-updated'));

    // Trigger backup (non-blocking)
    syncToBackup(toSave);

    return toSave;
}

export const syncAllInspections = async (): Promise<number> => {
    const all = getInspections();
    const unsynced = all.filter(i => !i.isSynced);
    let count = 0;

    for (const inspection of unsynced) {
        const success = await syncToBackup(inspection);
        if (success) count++;
    }
    return count;
};

export const getInspections = (): SavedInspection[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to parse inspections", e);
        return [];
    }
}

export interface AppSettings {
    logoUrl?: string;
    trustBadges?: string[];
    bannerUrl?: string;
}

const SETTINGS_KEY = 'gdt_settings';

export const saveSettings = (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // Dispatch a custom event so components can react immediately
    window.dispatchEvent(new Event('settings-updated'));
    return settings;
}

export const getSettings = (): AppSettings => {
    try {
        const data = localStorage.getItem(SETTINGS_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error("Failed to parse settings", e);
        return {};
    }
}

import { InspectionTemplate, ItemTemplate } from "./mock-data";

const TEMPLATE_KEY = 'gdt_custom_templates';
const ITEM_TEMPLATE_KEY = 'gdt_custom_item_templates';

export const saveCustomTemplate = (template: InspectionTemplate) => {
    const existing = getCustomTemplates();
    const updated = [template, ...existing.filter(t => t.id !== template.id)];
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(updated));
    return template;
}

export const getCustomTemplates = (): InspectionTemplate[] => {
    try {
        const data = localStorage.getItem(TEMPLATE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to parse custom templates", e);
        return [];
    }
}

// --- Item Templates (Component Types) ---

export const saveItemTemplate = (template: ItemTemplate) => {
    const existing = getItemTemplates();
    // Use type as ID for uniqueness
    const updated = [template, ...existing.filter(t => t.type !== template.type)];
    localStorage.setItem(ITEM_TEMPLATE_KEY, JSON.stringify(updated));
    return template;
}

export const getItemTemplates = (): ItemTemplate[] => {
    try {
        const data = localStorage.getItem(ITEM_TEMPLATE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to parse custom item templates", e);
        return [];
    }
}

export const deleteItemTemplate = (type: string) => {
    const existing = getItemTemplates();
    const updated = existing.filter(t => t.type !== type);
    localStorage.setItem(ITEM_TEMPLATE_KEY, JSON.stringify(updated));
}
