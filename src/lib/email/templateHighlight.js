// Leichtgewichtiges „Syntax-Highlighting" für den Vorlagen-Editor: hebt die
// Go-Template-Aktionen ({{ … }}) hervor. Läuft als Overlay-Schicht (farbiges
// <pre> deckungsgleich hinter der Textarea), daher darf NUR &<> escaped werden —
// alle übrigen Zeichen (Zeilenumbrüche, Leerzeichen) bleiben 1:1 erhalten, damit
// Overlay und Textarea Zeichen für Zeichen übereinanderliegen.

/** @type {Record<string, string>} */
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

/** @param {string} s */
function escapeHtml(s) {
	return s.replace(/[&<>]/g, (c) => ESC[c]);
}

/**
 * Wandelt Quelltext in Highlight-HTML: {{ … }}-Aktionen werden in
 * `<span class="hl-action">` gewickelt, der Rest bleibt Klartext (escaped).
 * Eine nicht geschlossene `{{` bleibt unmarkiert — die Live-Vorschau zeigt den
 * Fehler ohnehin an.
 *
 * @param {string} src
 * @returns {string} HTML für {@html …} im Overlay
 */
export function highlightGoTemplate(src) {
	// {{ … }} inkl. optionaler Whitespace-Trim-Marker ({{- … -}}); [\s\S] deckt
	// auch mehrzeilige Aktionen ab.
	const re = /\{\{-?[\s\S]*?-?\}\}/g;
	let out = '';
	let last = 0;
	let m;
	while ((m = re.exec(src)) !== null) {
		out += escapeHtml(src.slice(last, m.index));
		out += '<span class="hl-action">' + escapeHtml(m[0]) + '</span>';
		last = m.index + m[0].length;
	}
	out += escapeHtml(src.slice(last));
	return out;
}
