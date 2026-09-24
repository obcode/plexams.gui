// Markdown → sicheres HTML für Todo-Beschreibungen und -Kommentare.
//
// Der Text kommt von Nutzern, deshalb läuft das Ergebnis von `marked` immer durch
// DOMPurify. DOMPurify braucht ein DOM: im Browser ist das `window`, im SSR gibt
// es keins — dort liefert renderMarkdown null, und die Komponente zeigt den
// Rohtext (siehe Markdown.svelte). Ein ungefiltertes {@html} gibt es nie.

import { marked } from 'marked';
import createDOMPurify from 'dompurify';

/** @type {ReturnType<typeof createDOMPurify> | null} */
let purifier = null;

function getPurifier() {
	if (purifier) return purifier;
	if (typeof window === 'undefined') return null;
	purifier = createDOMPurify(window);
	// Links öffnen in einem neuen Tab und geben keinen Opener/Referrer weiter.
	purifier.addHook('afterSanitizeAttributes', (node) => {
		if (node.tagName === 'A' && node.getAttribute('href')) {
			node.setAttribute('target', '_blank');
			node.setAttribute('rel', 'noopener noreferrer');
		}
	});
	return purifier;
}

/**
 * @param {string | null | undefined} src Markdown
 * @returns {string | null} bereinigtes HTML, oder null ohne DOM (SSR)
 */
export function renderMarkdown(src) {
	const dp = getPurifier();
	if (!dp) return null;
	const html = /** @type {string} */ (
		marked.parse(src ?? '', { async: false, gfm: true, breaks: true })
	);
	return dp.sanitize(html);
}
