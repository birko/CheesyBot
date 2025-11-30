import { parseBulkInput } from '../../utils/parser';

describe('parseBulkInput', () => {
    const mockProducts = {
        'Apple': 1.5,
        'Banana': 0.8,
        'Orange': 1.2
    };

    test('parses single item correctly', () => {
        const result = parseBulkInput('Apple:5', mockProducts, 'integer');
        expect(result.success).toHaveLength(1);
        expect(result.success[0]).toMatchObject({ name: 'Apple', value: 5 });
        expect(result.failed).toHaveLength(0);
    });

    test('parses multiple items correctly', () => {
        const result = parseBulkInput('Apple:5, Banana:10', mockProducts, 'integer');
        expect(result.success).toHaveLength(2);
        expect(result.success).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: 'Apple', value: 5 }),
            expect.objectContaining({ name: 'Banana', value: 10 })
        ]));
        expect(result.failed).toHaveLength(0);
    });

    test('handles whitespace correctly', () => {
        const result = parseBulkInput('  Apple  :  5  ,   Banana  :  10  ', mockProducts, 'integer');
        expect(result.success).toHaveLength(2);
        expect(result.success).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: 'Apple', value: 5 }),
            expect.objectContaining({ name: 'Banana', value: 10 })
        ]));
    });

    test('handles invalid product names', () => {
        const result = parseBulkInput('Grape:5', mockProducts, 'integer', true);
        expect(result.success).toHaveLength(0);
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0]).toContain('Grape');
    });

    test('handles invalid values (non-numeric)', () => {
        const result = parseBulkInput('Apple:abc', mockProducts, 'integer');
        expect(result.success).toHaveLength(0);
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0]).toContain('Invalid value');
    });

    test('handles float values when integer expected', () => {
        const result = parseBulkInput('Apple:5.5', mockProducts, 'integer');
        expect(result.success).toHaveLength(1);
        expect(result.success[0]).toMatchObject({ name: 'Apple', value: 5 });
    });

    test('handles float values when number expected', () => {
        const result = parseBulkInput('Apple:5.5', mockProducts, 'number');
        expect(result.success).toHaveLength(1);
        expect(result.success[0]).toMatchObject({ name: 'Apple', value: 5.5 });
    });

    test('handles "none" value type (removal)', () => {
        const result = parseBulkInput('Apple, Banana', mockProducts, 'none');
        expect(result.success).toHaveLength(2);
        expect(result.success).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: 'Apple', value: null }),
            expect.objectContaining({ name: 'Banana', value: null })
        ]));
    });
});
