import { formatOrderItems, formatOrder, UserOrder } from '../../utils/formatter';
import config from '../../config.json';

// Mock translator function
const mockT = (key: string, options?: any) => {
    if (key === 'formatter.no_items') return 'No items.';
    if (key === 'formatter.item_line') return `- **${options.product}**: ${options.quantity} (${options.currency}${options.total})`;
    if (key === 'formatter.header') return `**${options.title}** (Status: **${options.status}**, Last Updated: ${options.date}):`;
    if (key === 'formatter.total') return `**Total:** ${options.currency}${options.total}`;
    if (key === 'formatter.no_active_orders') return `${options.title}\nNo active orders.`;
    return key;
};

describe('formatter', () => {
    const mockOrderItems = {
        'Apple': [{ price: 1.5, quantity: 2 }, { price: 1.5, quantity: 1 }], // Total 3 Apples = 4.5
        'Banana': [{ price: 0.8, quantity: 5 }] // Total 5 Bananas = 4.0
    };

    test('formatOrderItems calculates total and formats text correctly', () => {
        const { text, total } = formatOrderItems(mockOrderItems, mockT);
        expect(total).toBe(8.5);
        expect(text).toContain(`- **Apple**: 3 (${config.currency}4.50)`);
        expect(text).toContain(`- **Banana**: 5 (${config.currency}4.00)`);
    });

    test('formatOrderItems handles empty items', () => {
        const { text, total } = formatOrderItems({}, mockT);
        expect(total).toBe(0);
        expect(text).toBe('No items.\n');
    });

    test('formatOrder formats full order correctly', () => {
        const mockUserOrder: UserOrder = {
            items: mockOrderItems,
            status: 'New',
            lastChange: new Date('2023-01-01T12:00:00Z').toISOString()
        };

        const result = formatOrder(mockUserOrder, 'Test Order', mockT);
        expect(result).toContain('**Test Order** (Status: **New**');
        expect(result).toContain(`**Total:** ${config.currency}8.50`);
    });

    test('formatOrder handles empty order', () => {
        const mockUserOrder: UserOrder = {
            items: {},
            status: 'New',
            lastChange: new Date().toISOString()
        };
        const result = formatOrder(mockUserOrder, 'Test Order', mockT);
        expect(result).toContain('Test Order\nNo active orders.');
    });
});
