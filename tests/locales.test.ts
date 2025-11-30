import fs from 'fs';
import path from 'path';

describe('Locale Files', () => {
    const localesDir = path.join(__dirname, '../locales');
    const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

    test('all locale files should be valid JSON', () => {
        files.forEach(file => {
            const content = fs.readFileSync(path.join(localesDir, file), 'utf-8');
            try {
                JSON.parse(content);
            } catch (e: any) {
                throw new Error(`File ${file} is not valid JSON: ${e.message}`);
            }
        });
    });

    test('all locale files should have required top-level keys', () => {
        const requiredKeys = ['common', 'formatter', 'commands'];
        files.forEach(file => {
            const content = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf-8'));
            requiredKeys.forEach(key => {
                expect(content).toHaveProperty(key);
            });
        });
    });
});
