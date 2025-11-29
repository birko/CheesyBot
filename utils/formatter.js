const config = require('../config.json');

/**
 * Formats the items of an order into a list string and calculates the total.
 * @param {Object} items - The items object from the user order.
 * @returns {Object} { text: string, total: number }
 */
function formatOrderItems(items) {
    let text = '';
    let total = 0;

    if (!items || Object.keys(items).length === 0) {
        return { text: 'No items.\n', total: 0 };
    }

    for (const [product, batches] of Object.entries(items)) {
        let productTotal = 0;
        let productQuantity = 0;

        for (const batch of batches) {
            productTotal += batch.price * batch.quantity;
            productQuantity += batch.quantity;
        }

        total += productTotal;
        text += `- **${product}**: ${productQuantity} (${config.currency}${productTotal.toFixed(2)})\n`;
    }

    return { text, total };
}

/**
 * Formats a full order display with header, status, items, and total.
 * @param {Object} userOrder - The full user order object.
 * @param {string} title - The title for the order display (e.g., "Your Orders").
 * @returns {string} The formatted message string.
 */
function formatOrder(userOrder, title) {
    if (!userOrder || !userOrder.items || Object.keys(userOrder.items).length === 0) {
        return `${title}\nNo active orders.`;
    }

    const lastChangeDate = new Date(userOrder.lastChange).toLocaleString();
    const { text, total } = formatOrderItems(userOrder.items);

    let reply = `**${title}** (Status: **${userOrder.status}**, Last Updated: ${lastChangeDate}):\n`;
    reply += text;
    reply += `\n**Total:** ${config.currency}${total.toFixed(2)}`;

    return reply;
}

module.exports = {
    formatOrderItems,
    formatOrder
};
