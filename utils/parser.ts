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

