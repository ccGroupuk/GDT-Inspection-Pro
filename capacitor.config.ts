import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.gdt.inspectionpro',
    appName: 'GDT Inspection Pro',
    webDir: 'dist/public',
    server: {
        androidScheme: 'https'
    }
};

export default config;
