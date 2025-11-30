import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import fs from 'fs';
import config from '../config.json';

// Define a type for the config to avoid TS errors if 'language' is missing in the type definition yet
interface Config {
    language?: string;
    [key: string]: any;
}

const typedConfig = config as Config;

i18next
    .use(Backend)
    .init({
        lng: typedConfig.language || 'en',
        fallbackLng: 'en',
        backend: {
            loadPath: path.join(__dirname, '../locales/{{lng}}.json'),
        },
        interpolation: {
            escapeValue: false, // Discord handles escaping
        },
    });

const localesPath = path.join(__dirname, '../locales');

try {
    fs.watch(localesPath, (eventType: string, filename: string | null) => {
        if (filename && filename.endsWith('.json')) {
            console.log(`Locale file changed: ${filename}. Reloading translations...`);
            i18next.reloadResources(filename.replace('.json', ''), undefined, () => {
                console.log(`Reloaded translations for ${filename}`);
            });
        }
    });
} catch (error) {
    console.error('Failed to set up locale hot reloading:', error);
}

export default i18next;
export const t = i18next.t.bind(i18next);

import { getUserLanguage } from './storage';

export function getTranslation(userId: string) {
    const lang = getUserLanguage(userId);
    if (lang) {
        return i18next.getFixedT(lang);
    }
    return t;
}
