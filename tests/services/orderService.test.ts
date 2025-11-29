import orderService from '../../services/orderService';
import * as storage from '../../utils/storage';

jest.mock('../../utils/storage');

describe('OrderService', () => {
    let mockData: any;

    beforeEach(() => {
        mockData = {
            products: {
                'Apple': 1.5,
                'Banana': 0.8
            },
            orders: {
                'user1': {
                    items: {
                        'Apple': [{ price: 1.5, quantity: 2 }]
                    },
                    status: 'New',
                    lastChange: '2023-01-01T00:00:00.000Z'
                }
            }
        };
        (storage.loadData as jest.Mock).mockReturnValue(mockData);
        (storage.saveData as jest.Mock).mockImplementation(() => { });
    });

    test('addOrder adds items to order', () => {
        const result = orderService.addOrder('user1', 'Banana', 5);
        expect(result.success).toBe(true);
        expect(mockData.orders['user1'].items['Banana']).toHaveLength(1);
        expect(mockData.orders['user1'].items['Banana'][0].quantity).toBe(5);
    });

    test('addOrder creates new order for new user', () => {
        const result = orderService.addOrder('user2', 'Apple', 1);
        expect(result.success).toBe(true);
        expect(mockData.orders['user2']).toBeDefined();
        expect(mockData.orders['user2'].items['Apple']).toBeDefined();
    });

    test('editOrder updates quantity', () => {
        const result = orderService.editOrder('user1', 'Apple', 5);
        expect(result.success).toBe(true);
        expect(result.action).toBe('increased');
        expect(mockData.orders['user1'].items['Apple'][0].quantity).toBe(5); // 2 + 3 = 5? No, edit sets total.
        // Wait, logic check: editOrder sets TOTAL.
        // If current is 2, and we set to 5, diff is +3.
        // Existing batch is updated.
    });

    test('editOrder removes item if quantity set to 0', () => {
        const result = orderService.editOrder('user1', 'Apple', 0);
        expect(result.success).toBe(true);
        expect(mockData.orders['user1'].items['Apple']).toBeUndefined();
    });

    test('completeOrder completes specific amount', () => {
        // User1 has 2 Apples. Complete 1.
        const result = orderService.completeOrder('user1', 'Apple', 1);
        expect(result.success).toBe(true);
        expect(mockData.orders['user1'].items['Apple'][0].quantity).toBe(1);
    });

    test('completeAllOrders clears all orders', () => {
        const result = orderService.completeAllOrders();
        expect(result.success).toBe(true);
        expect(Object.keys(mockData.orders)).toHaveLength(0);
    });

    test('updateStatus updates status', () => {
        const result = orderService.updateStatus('user1', 'Processing');
        expect(result.success).toBe(true);
        expect(mockData.orders['user1'].status).toBe('Processing');
    });
});
