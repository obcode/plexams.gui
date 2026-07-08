import { describe, it, expect, vi } from 'vitest';
import {
	pdfDownloadUrl,
	csvDownloadUrl,
	icsDownloadUrl,
	PDF_DOWNLOADS,
	CSV_DOWNLOADS
} from './downloads.js';

// backendBase liest PUBLIC_PLEXAMS_SERVER und schneidet /query ab.
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_PLEXAMS_SERVER: 'http://backend:8080/query' }
}));

describe('download URLs', () => {
	it('baut die PDF-URL mit encodetem kind', () => {
		expect(pdfDownloadUrl('draft-muc.dai')).toBe('http://backend:8080/download/pdf/draft-muc.dai');
	});

	it('baut die CSV-URL ohne program', () => {
		expect(csvDownloadUrl('exahm')).toBe('http://backend:8080/download/csv/exahm');
	});

	it('hängt program als Query-Parameter an und encodet es', () => {
		expect(csvDownloadUrl('draft', 'IF B')).toBe(
			'http://backend:8080/download/csv/draft?program=IF%20B'
		);
	});

	it('ignoriert leeres program (kein ?program=)', () => {
		expect(csvDownloadUrl('draft', '')).toBe('http://backend:8080/download/csv/draft');
	});

	it('baut die ICS-URL mit encodetem program', () => {
		expect(icsDownloadUrl('IF')).toBe('http://backend:8080/download/ics/IF');
	});
});

describe('download-Metadaten', () => {
	it('deckt genau die vom Backend bekannten PDF-kinds ab', () => {
		expect(PDF_DOWNLOADS.map((d) => d.kind).sort()).toEqual(
			[
				'constraints',
				'draft-exahm',
				'draft-fk08',
				'draft-fk10',
				'draft-fs',
				'draft-lba-rep',
				'draft-muc.dai',
				'draft-si',
				'exams-to-plan',
				'same-module-name'
			].sort()
		);
	});

	it('markiert draft-si als ZIP, den Rest als PDF', () => {
		const zip = PDF_DOWNLOADS.filter((d) => d.format === 'zip').map((d) => d.kind);
		expect(zip).toEqual(['draft-si']);
	});

	it('markiert nur den CSV-Entwurf als program-pflichtig', () => {
		const needsProgram = CSV_DOWNLOADS.filter((d) => d.needsProgram).map((d) => d.kind);
		expect(needsProgram).toEqual(['draft']);
	});
});
