const { resolveProduct } = require('./product');

/**
 * Parses a bulk input string into a list of items.
 * Supported formats:
 * - "Item1:Value1, Item2:Value2" (for Key-Value pairs)
 * - "Item1, Item2" (for simple lists)
 * 
 * @param {string} inputString The raw input string from the user.
 * @param {object} products The products object for resolution.
 * @param {string} valueType 'number' (float), 'integer', or 'none' (for simple lists).
 * @returns {object} { success: [], failed: [] }
 */
function parseBulkInput(inputString, products, valueType = 'none') {
    const items = inputString.split(',').map(item => item.trim());
    const success = [];
    const failed = [];

    for (const item of items) {
        let nameRaw = item;
        let value = null;

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

        // For 'add' command, we might be adding a NEW product, so resolution might fail if it doesn't exist yet.
        // But for 'order', 'edit', 'remove', 'update', it must exist.
        // We'll handle the "must exist" check in the Service layer or via a flag if needed.
        // For now, we return the resolved name if found, otherwise the raw name (for creation).

        const finalName = resolvedName || nameRaw;

        if (!finalName) {
            failed.push(`${item} (Invalid name)`);
            continue;
        }

        success.push({ name: finalName, value: value, original: item });
    }

    return { success, failed };
}

module.exports = { parseBulkInput };
