import { describe, it, expect, vi } from 'vitest';
import {
	datasetCsvDownloadUrl,
	myInputsCsvDownloadUrl,
	interpretTransferResponse
} from './transfer.js';

// backendBase liest PUBLIC_PLEXAMS_SERVER und schneidet /query ab.
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_PLEXAMS_SERVER: 'http://backend:8080/query' }
}));

/**
 * Minimaler Response-Stub für interpretTransferResponse.
 * @param {{ ok: boolean, status: number, json?: any, text?: string }} p
 */
function fakeResponse({ ok, status, json = {}, text = '' }) {
	return {
		ok,
		status,
		json: async () => json,
		text: async () => text
	};
}

describe('download URLs', () => {
	it('baut die CSV-Dataset-URL mit encodetem name auf /download/dataset-csv', () => {
		expect(datasetCsvDownloadUrl('exam-times')).toBe(
			'http://backend:8080/download/dataset-csv?name=exam-times'
		);
	});

	it('encodet Sonderzeichen im name', () => {
		expect(datasetCsvDownloadUrl('a b&c')).toBe(
			'http://backend:8080/download/dataset-csv?name=a%20b%26c'
		);
	});

	it('baut die My-Inputs-CSV-URL', () => {
		expect(myInputsCsvDownloadUrl()).toBe('http://backend:8080/download/my-inputs-csv.zip');
	});
});

describe('interpretTransferResponse (CSV-Erfolg)', () => {
	it('reicht das CSV-Ergebnis (dataset/applied/skipped) durch', async () => {
		const body = {
			dataset: 'constraints',
			applied: 5,
			skipped: ['Zeile 3: unbekannte ancode 999']
		};
		const r = await interpretTransferResponse({
			ok: true,
			status: 200,
			json: async () => body,
			text: async () => ''
		});
		expect(r).toEqual({ ok: true, result: body });
	});
});

describe('interpretTransferResponse', () => {
	it('gibt bei Erfolg das JSON zurück', async () => {
		const r = await interpretTransferResponse(
			fakeResponse({ ok: true, status: 200, json: { dataset: 'preplan', applied: 3 } })
		);
		expect(r).toEqual({ ok: true, result: { dataset: 'preplan', applied: 3 } });
	});

	it('reicht den Fehlertext bei 409 (laufende Operation / read-only) durch', async () => {
		const r = await interpretTransferResponse(
			fakeResponse({ ok: false, status: 409, text: 'semester is read-only\n' })
		);
		expect(r).toEqual({ ok: false, status: 409, error: 'semester is read-only' });
	});

	it('reicht den Fehlertext bei 400 (kaputte CSV) durch', async () => {
		const r = await interpretTransferResponse(
			fakeResponse({ ok: false, status: 400, text: 'header mismatch' })
		);
		expect(r).toEqual({ ok: false, status: 400, error: 'header mismatch' });
	});

	it('fällt ohne Fehlertext auf HTTP <status> zurück', async () => {
		const r = await interpretTransferResponse(fakeResponse({ ok: false, status: 500, text: '' }));
		expect(r).toEqual({ ok: false, status: 500, error: 'HTTP 500' });
	});
});
