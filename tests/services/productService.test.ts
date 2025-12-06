import productService from '../../services/productService';
import * as storage from '../../utils/storage';

jest.mock('../../utils/storage');

describe('ProductService', () => {
    let mockData: any;

    beforeEach(() => {
        mockData = {
            products: {
                'Apple': 1.5,
                'Banana': 0.8
            },
            orders: {}
        };
        (storage.loadData as jest.Mock).mockReturnValue(mockData);
        (storage.saveData as jest.Mock).mockImplementation(() => { });
    });

    test('getAllProducts returns all products', () => {
        const products = productService.getAllProducts();
        expect(products).toEqual(mockData.products);
    });

    test('addProduct adds a new product', () => {
        const result = productService.addProduct('Orange', 1.2);
        expect(result.success).toBe(true);
        expect(mockData.products['Orange']).toBe(1.2);
        expect(storage.saveData).toHaveBeenCalled();
    });

    test('addProduct fails if product exists', () => {
        const result = productService.addProduct('Apple', 2.0);
        expect(result.success).toBe(false);
        expect(mockData.products['Apple']).toBe(1.5); // Should not change
    });

    test('removeProduct removes a product', () => {
        const result = productService.removeProduct('Apple');
        expect(result.success).toBe(true);
        expect(mockData.products['Apple']).toBeUndefined();
    });

    test('removeProduct fails if product does not exist', () => {
        const result = productService.removeProduct('Grape');
        expect(result.success).toBe(false);
    });

    test('updateProduct updates price', () => {
        const result = productService.updateProduct('Apple', { newPrice: 2.0 });
        expect(result.success).toBe(true);
        expect(mockData.products['Apple']).toBe(2.0);
    });

    test('updateProduct updates name and syncs orders', () => {
        // Setup existing order
        mockData.orders = {
            'user1': {
                items: {
                    'Apple': [{ price: 1.5, quantity: 5 }]
                }
            }
        };

        const result = productService.updateProduct('Apple', { newName: 'Granny Smith' });
        expect(result.success).toBe(true);
        expect(mockData.products['Apple']).toBeUndefined();
        expect(mockData.products['Granny Smith']).toBe(1.5);

        // Verify order update
        expect(mockData.orders['user1'].items['Apple']).toBeUndefined();
        expect(mockData.orders['user1'].items['Granny Smith']).toBeDefined();
        expect(mockData.orders['user1'].items['Granny Smith'][0].quantity).toBe(5);
    });

    test('updateProduct fails if product does not exist', () => {
        const result = productService.updateProduct('Grape', { newPrice: 2.0 });
        expect(result.success).toBe(false);
    });
});
