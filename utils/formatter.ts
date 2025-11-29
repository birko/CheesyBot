import config from '../config.json';
import { t } from './i18n';

interface Batch {
    price: number;
    quantity: number;
}

interface OrderItems {
    [productName: string]: Batch[];
}

export interface UserOrder {
    items: OrderItems;
    status: string;
    lastChange: string | number | Date;
}

/**
 * Formats the items of an order into a list string and calculates the total.
 */
export function formatOrderItems(items: OrderItems): { text: string, total: number } {
    let text = '';
    let total = 0;

    if (!items || Object.keys(items).length === 0) {
        return { text: t('formatter.no_items') + '\n', total: 0 };
    }

    for (const [product, batches] of Object.entries(items)) {
        let productTotal = 0;
        let productQuantity = 0;

        for (const batch of batches) {
            productTotal += batch.price * batch.quantity;
            productQuantity += batch.quantity;
        }

        total += productTotal;
        text += t('formatter.item_line', { product, quantity: productQuantity, currency: config.currency, total: productTotal.toFixed(2) }) + '\n';
    }

    return { text, total };
}

/**
 * Formats a full order display with header, status, items, and total.
 */
export function formatOrder(userOrder: UserOrder, title: string): string {
    if (!userOrder || !userOrder.items || Object.keys(userOrder.items).length === 0) {
        return t('formatter.no_active_orders', { title });
    }

    const lastChangeDate = new Date(userOrder.lastChange).toLocaleString();
    const { text, total } = formatOrderItems(userOrder.items);

    let reply = t('formatter.header', { title, status: userOrder.status, date: lastChangeDate }) + '\n';
    reply += text;
    reply += '\n' + t('formatter.total', { currency: config.currency, total: total.toFixed(2) });

    return reply;
}

