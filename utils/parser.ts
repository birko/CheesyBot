import { resolveProduct } from './product';

interface ParsedItem {
    name: string;
    value: number | null;
    original: string;
}

/**
 * Parses a bulk input string into a list of items.
 * Supported formats:
 * - "Item1:Value1, Item2:Value2" (for Key-Value pairs)
 * - "Item1, Item2" (for simple lists)
 */
export function parseBulkInput(inputString: string, products: Record<string, any>, valueType: 'number' | 'integer' | 'none' = 'none', strict: boolean = false): { success: ParsedItem[], failed: string[] } {
    const items = inputString.split(',').map(item => item.trim());
    const success: ParsedItem[] = [];
    const failed: string[] = [];

    for (const item of items) {
        let nameRaw = item;
        let value: number | null = null;

        if (valueType !== 'none') {
            const parts = item.split(':');
            if (parts.length !== 2) {
                failed.push(`${item} (Invalid format)`);
                continue;
            }
            nameRaw = parts[0].trim();
            const valueRaw = parts[1].trim();

            if (valueType === 'integer') {
                value = parseInt(valueRaw);
            } else {
                value = parseFloat(valueRaw);
            }

            if (isNaN(value)) {
                failed.push(`${item} (Invalid value)`);
                continue;
            }
        }

        const resolvedName = resolveProduct(products, nameRaw);

        if (strict && !resolvedName) {
            failed.push(`${item} (Product not found)`);
            continue;
        }

        const finalName = resolvedName || nameRaw;

        if (!finalName) {
            failed.push(`${item} (Invalid name)`);
            continue;
        }

        success.push({ name: finalName, value: value, original: item });
    }

    return { success, failed };
}

export interface ParsedUpdate {
    name: string;
    newName?: string;
    newPrice?: number;
    original: string;
}

/**
 * Parses complex bulk input for updates.
 * Supports:
 * - "Name:Price"
 * - "Name:NewName"
 * - "Name:NewName:Price"
 */
export function parseComplexBulkInput(inputString: string, products: Record<string, any>): { success: ParsedUpdate[], failed: string[] } {
    const items = inputString.split(',').map(item => item.trim());
    const success: ParsedUpdate[] = [];
    const failed: string[] = [];

    for (const item of items) {
        const parts = item.split(':').map(p => p.trim());
        if (parts.length < 1 || parts.length > 3) {
            failed.push(`${item} (Invalid format)`);
            continue;
        }

        const currentNameRaw = parts[0];
        const resolvedCurrentName = resolveProduct(products, currentNameRaw);

        if (!resolvedCurrentName) {
            failed.push(`${item} (Product not found)`);
            continue;
        }

        let newName: string | undefined;
        let newPrice: number | undefined;

        if (parts.length === 2) {
            // Check if second part is number (Price) or string (Name)
            const part2 = parts[1];
            const asNumber = parseFloat(part2);

            if (!isNaN(asNumber)) {
                newPrice = asNumber;
            } else {
                newName = part2;
            }
        } else if (parts.length === 3) {
            // Name:NewName:Price
            newName = parts[1];
            const priceRaw = parts[2];
            const asNumber = parseFloat(priceRaw);

            if (isNaN(asNumber)) {
                failed.push(`${item} (Invalid price)`);
                continue;
            }
            newPrice = asNumber;
        }

        // Length 1: newName/Price undefined (valid for arg mixing)

        success.push({
            name: resolvedCurrentName,
            newName,
            newPrice,
            original: item
        });
    }

    return { success, failed };
}

