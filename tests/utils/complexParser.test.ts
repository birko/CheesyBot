import { parseComplexBulkInput } from '../../utils/parser';

describe('Parser Utilities - Complex Bulk', () => {
    const mockProducts = {
        'Apple': 1.5,
        'Banana': 0.8,
        'Orange': 1.2
    };

    test('parses simple reprice (Name:Price)', () => {
        const input = "Apple:2.0";
        const result = parseComplexBulkInput(input, mockProducts);
        expect(result.success).toHaveLength(1);
        expect(result.success[0]).toEqual({
            name: 'Apple',
            newPrice: 2.0,
            original: "Apple:2.0"
        });
        expect(result.failed).toHaveLength(0);
    });

    test('parses simple rename (Name:NewName)', () => {
        const input = "Apple:Green Apple";
        const result = parseComplexBulkInput(input, mockProducts);
        expect(result.success).toHaveLength(1);
        expect(result.success[0]).toEqual({
            name: 'Apple',
            newName: 'Green Apple',
            original: "Apple:Green Apple"
        });
        expect(result.failed).toHaveLength(0);
    });

    test('parses rename and reprice (Name:NewName:Price)', () => {
        const input = "Apple:Green Apple:2.5";
        const result = parseComplexBulkInput(input, mockProducts);
        expect(result.success).toHaveLength(1);
        expect(result.success[0]).toEqual({
            name: 'Apple',
            newName: 'Green Apple',
            newPrice: 2.5,
            original: "Apple:Green Apple:2.5"
        });
        expect(result.failed).toHaveLength(0);
    });

    test('parses multiple mixed items', () => {
        const input = "Apple:2.0, Banana:Yellow Banana, Orange:Clementine:1.5";
        const result = parseComplexBulkInput(input, mockProducts);
        expect(result.success).toHaveLength(3);

        // Order matters
        expect(result.success[0]).toMatchObject({ name: 'Apple', newPrice: 2.0 });
        expect(result.success[1]).toMatchObject({ name: 'Banana', newName: 'Yellow Banana' });
        expect(result.success[2]).toMatchObject({ name: 'Orange', newName: 'Clementine', newPrice: 1.5 });
    });

    test('fails on invalid product', () => {
        const input = "Grape:2.0";
        const result = parseComplexBulkInput(input, mockProducts);
        expect(result.success).toHaveLength(0);
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0]).toContain("Product not found");
    });

    test('fails on invalid format', () => {
        const result = parseComplexBulkInput("Apple", mockProducts); // Missing colon
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0]).toContain("Invalid format");
    });
});
