import fs from 'fs';
import path from 'path';

const dataPath = path.join(__dirname, '../data.json');

export interface Data {
    products: Record<string, any>;
    orders: Record<string, any>;
}

// Global storage (not per-guild)
export function loadData(): Data {
    if (!fs.existsSync(dataPath)) {
        return { products: {}, orders: {} };
    }
    try {
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading data file:", error);
        return { products: {}, orders: {} };
    }
}

export function saveData(data: Data): void {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing data file:", error);
    }
}

