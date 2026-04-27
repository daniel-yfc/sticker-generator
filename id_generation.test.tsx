import { describe, it, expect, vi } from 'vitest';

describe('ID Generation Logic', () => {
    it('generates a UUID using crypto.randomUUID()', () => {
        const id = crypto.randomUUID();
        // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(id).toMatch(uuidRegex);
    });

    it('generates unique IDs', () => {
        const ids = new Set();
        for (let i = 0; i < 100; i++) {
            ids.add(crypto.randomUUID());
        }
        expect(ids.size).toBe(100);
    });
});
