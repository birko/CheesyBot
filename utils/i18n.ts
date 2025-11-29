import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
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

export default i18next;
export const t = i18next.t.bind(i18next);
