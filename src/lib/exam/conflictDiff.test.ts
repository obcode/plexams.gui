import { describe, it, expect } from 'vitest';
import { diffMeta } from './conflictDiff';

describe('diffMeta', () => {
	it('erkennt „neu" (deutsch + englisch, case-insensitiv)', () => {
		for (const s of ['new', 'NEW', 'neu', 'Neu', ' new ']) {
			expect(diffMeta(s)?.label).toBe('neu');
			expect(diffMeta(s)?.badge).toBe('badge-error');
		}
	});

	it('erkennt „schlimmer" inkl. Synonyme', () => {
		for (const s of ['worse', 'schlimmer', 'increased']) {
			expect(diffMeta(s)?.label).toBe('↑ schlimmer');
			expect(diffMeta(s)?.badge).toBe('badge-warning');
		}
	});

	it('erkennt „besser" inkl. Synonyme', () => {
		for (const s of ['better', 'besser', 'decreased']) {
			expect(diffMeta(s)?.label).toBe('↓ besser');
			expect(diffMeta(s)?.badge).toBe('badge-success');
		}
	});

	it('liefert null für unverändert / leer / unbekannt / null / undefined', () => {
		for (const s of ['', '   ', 'unchanged', 'unverändert', 'same', 'foo', null, undefined]) {
			expect(diffMeta(s)).toBeNull();
		}
	});
});
