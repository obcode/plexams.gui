// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown.js';

describe('renderMarkdown', () => {
	it('rendert Markdown', () => {
		const html = renderMarkdown('**fett** und\n- eins\n- zwei') ?? '';
		expect(html).toContain('<strong>fett</strong>');
		expect(html).toContain('<li>eins</li>');
	});

	it('entfernt Skripte und Event-Handler', () => {
		const html = renderMarkdown('<script>alert(1)</script><img src="x" onerror="alert(2)">') ?? '';
		expect(html).not.toContain('<script');
		expect(html).not.toContain('onerror');
		const link = renderMarkdown('[a](javascript:alert(3))') ?? '';
		expect(link).not.toMatch(/href="javascript:/);
	});

	it('öffnet Links in einem neuen Tab ohne Opener', () => {
		const html = renderMarkdown('[HM](https://hm.edu)') ?? '';
		expect(html).toContain('target="_blank"');
		expect(html).toContain('rel="noopener noreferrer"');
	});

	it('kommt mit leerem Text zurecht', () => {
		expect(renderMarkdown('')).toBe('');
		expect(renderMarkdown(null)).toBe('');
	});
});
