import { parseComplexBulkInput } from '../../../utils/parser';

describe('Parser Utilities - Complex Bulk Enhanced', () => {
    const mockProducts = {
        'Apple': 1.5,
        'Banana': 0.8,
        'Orange': 1.2
    };

    test('parses single item (Name only)', () => {
        const input = "Apple";
        const result = parseComplexBulkInput(input, mockProducts);
        expect(result.success).toHaveLength(1);
        expect(result.success[0]).toEqual({
            name: 'Apple',
            newName: undefined,
            newPrice: undefined,
            original: "Apple"
        });
    });

    test('parses list of names', () => {
        const input = "Apple, Banana";
        const result = parseComplexBulkInput(input, mockProducts);
        expect(result.success).toHaveLength(2);
        expect(result.success[0].name).toBe('Apple');
        expect(result.success[1].name).toBe('Banana');
    });

    test('parses mixed input (Name and Name:Price)', () => {
        const input = "Apple, Banana:2.0";
        const result = parseComplexBulkInput(input, mockProducts);
        expect(result.success).toHaveLength(2);
        expect(result.success[0]).toMatchObject({ name: 'Apple', newPrice: undefined });
        expect(result.success[1]).toMatchObject({ name: 'Banana', newPrice: 2.0 });
    });
});
