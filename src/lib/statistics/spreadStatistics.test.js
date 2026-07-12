import { describe, it, expect } from 'vitest';
import {
	BUCKET_ORDER,
	orderBuckets,
	bucketTone,
	toneFromMinFreeDays,
	barPercent,
	totalCount,
	formatShare,
	formatDecimal
} from './spreadStatistics.js';

describe('orderBuckets', () => {
	it('bringt Buckets in die feste Reihenfolge OVERLAP→THREE_PLUS_FREE', () => {
		const shuffled = [
			{ key: 'THREE_PLUS_FREE' },
			{ key: 'OVERLAP' },
			{ key: 'ONE_FREE' },
			{ key: 'SAME_DAY' }
		];
		expect(orderBuckets(shuffled).map((b) => b.key)).toEqual([
			'OVERLAP',
			'SAME_DAY',
			'ONE_FREE',
			'THREE_PLUS_FREE'
		]);
	});

	it('hängt unbekannte Keys stabil ans Ende', () => {
		const list = [{ key: 'MYSTERY' }, { key: 'OVERLAP' }, { key: 'OTHER' }];
		expect(orderBuckets(list).map((b) => b.key)).toEqual(['OVERLAP', 'MYSTERY', 'OTHER']);
	});

	it('verträgt null/undefined', () => {
		expect(orderBuckets(null)).toEqual([]);
		expect(orderBuckets(undefined)).toEqual([]);
	});

	it('deckt alle Reihenfolge-Keys ab', () => {
		expect(BUCKET_ORDER).toHaveLength(6);
	});
});

describe('bucketTone', () => {
	it('OVERLAP ist error (rot)', () => {
		expect(bucketTone('OVERLAP')).toBe('error');
	});
	it('FREE-Kategorien sind success (grün)', () => {
		expect(bucketTone('ONE_FREE')).toBe('success');
		expect(bucketTone('TWO_FREE')).toBe('success');
		expect(bucketTone('THREE_PLUS_FREE')).toBe('success');
	});
	it('SAME_DAY/ADJACENT sind warning', () => {
		expect(bucketTone('SAME_DAY')).toBe('warning');
		expect(bucketTone('ADJACENT')).toBe('warning');
	});
	it('unbekannt → neutral', () => {
		expect(bucketTone('WAT')).toBe('neutral');
	});
});

describe('toneFromMinFreeDays', () => {
	it('Überschneidung (<= -2) → error', () => {
		expect(toneFromMinFreeDays(-2)).toBe('error');
		expect(toneFromMinFreeDays(-3)).toBe('error');
	});
	it('selber Tag / aufeinanderfolgend (-1..0) → warning', () => {
		expect(toneFromMinFreeDays(-1)).toBe('warning');
		expect(toneFromMinFreeDays(0)).toBe('warning');
	});
	it('mindestens ein freier Tag → success', () => {
		expect(toneFromMinFreeDays(1)).toBe('success');
	});
	it('null → neutral', () => {
		expect(toneFromMinFreeDays(null)).toBe('neutral');
		expect(toneFromMinFreeDays(undefined)).toBe('neutral');
	});
});

describe('barPercent / totalCount', () => {
	it('rechnet count-Anteil in Prozent', () => {
		expect(barPercent(1, 4)).toBe(25);
		expect(barPercent(3, 4)).toBe(75);
	});
	it('Division durch 0 → 0', () => {
		expect(barPercent(0, 0)).toBe(0);
		expect(barPercent(5, 0)).toBe(0);
	});
	it('totalCount summiert counts (auch mit fehlenden)', () => {
		expect(totalCount([{ count: 2 }, { count: 3 }, {}])).toBe(5);
		expect(totalCount(null)).toBe(0);
	});
});

describe('formatShare / formatDecimal', () => {
	it('formatShare hängt Prozent an, eine Nachkommastelle (geschütztes Leerzeichen)', () => {
		expect(formatShare(42)).toBe('42.0\u00a0%');
		expect(formatShare(3.14159)).toBe('3.1\u00a0%');
	});
	it('formatDecimal mit einer Nachkommastelle, auch negativ', () => {
		expect(formatDecimal(2)).toBe('2.0');
		expect(formatDecimal(-1.5)).toBe('-1.5');
	});
	it('null/NaN → Gedankenstrich', () => {
		expect(formatShare(null)).toBe('–');
		expect(formatShare(NaN)).toBe('–');
		expect(formatDecimal(undefined)).toBe('–');
	});
});
