import fs from 'fs';
import path from 'path';

const dataPath = path.join(__dirname, '../data.json');

export interface Data {
    products: Record<string, any>;
    orders: Record<string, any>;
    users?: Record<string, { language: string }>;
}

// Global storage (not per-guild)
export function loadData(): Data {
    if (!fs.existsSync(dataPath)) {
        return { products: {}, orders: {}, users: {} };
    }
    try {
        const data = fs.readFileSync(dataPath, 'utf8');
        const parsed = JSON.parse(data);
        if (!parsed.users) parsed.users = {};
        return parsed;
    } catch (error) {
        console.error("Error reading data file:", error);
        return { products: {}, orders: {}, users: {} };
    }
}

export function getUserLanguage(userId: string): string | undefined {
    const data = loadData();
    return data.users?.[userId]?.language;
}

export function setUserLanguage(userId: string, language: string): void {
    const data = loadData();
    if (!data.users) data.users = {};
    if (!data.users[userId]) data.users[userId] = { language: 'en' }; // Default structure
    data.users[userId].language = language;
    saveData(data);
}

export function saveData(data: Data): void {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing data file:", error);
    }
}

