import { describe, it, expect } from 'vitest';
import { highlightGoTemplate } from './templateHighlight';

describe('highlightGoTemplate', () => {
	it('umschließt {{ … }}-Aktionen mit hl-action', () => {
		expect(highlightGoTemplate('Hallo {{ .Name }}!')).toBe(
			'Hallo <span class="hl-action">{{ .Name }}</span>!'
		);
	});

	it('markiert mehrere Aktionen inkl. Trim-Marker', () => {
		const out = highlightGoTemplate('{{- if .X }}a{{ end -}}');
		expect(out).toBe(
			'<span class="hl-action">{{- if .X }}</span>a<span class="hl-action">{{ end -}}</span>'
		);
	});

	it('escaped &<> im Klartext und in Aktionen', () => {
		expect(highlightGoTemplate('a < b & {{ gt .A 1 }}')).toBe(
			'a &lt; b &amp; <span class="hl-action">{{ gt .A 1 }}</span>'
		);
	});

	it('lässt eine nicht geschlossene {{ unmarkiert', () => {
		expect(highlightGoTemplate('Hallo {{ .Name')).toBe('Hallo {{ .Name');
	});

	it('erhält Zeilenumbrüche und Leerzeichen unverändert', () => {
		expect(highlightGoTemplate('a\n  b')).toBe('a\n  b');
	});

	it('leerer Text → leer', () => {
		expect(highlightGoTemplate('')).toBe('');
	});
});
