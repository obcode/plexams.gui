// Rollen-Helfer für die OIDC-Auth (Backend `feat/oidc-auth`).
//
// Wichtig: Die GUI erzwingt hier NICHTS. Das Backend ist der Riegel — es lehnt
// Schreibvorgänge einer VIEWER-Rolle mit „forbidden: your role is read-only" ab.
// Diese Helfer dienen nur der kosmetischen Ausblendung von Schreib-Bedienelementen
// (siehe `WriteButton.svelte`) und dem Anzeigen der Identität im Header.
//
// Lokal / Dev bringt das Backend keine `me`-Query mit; der Layout-Load liefert
// dann `me = null` → wie voller Zugriff behandelt (kein Ausblenden).

export const ROLE_ADMIN = 'ADMIN';
export const ROLE_VIEWER = 'VIEWER';

// Auswahl für die Benutzerverwaltung. Muss zum Role-Enum des Backends passen
// (feat/oidc-auth); bei Abweichung hier anpassen.
export const ROLES = ['ADMIN', 'PLANER', 'VIEWER'];

/**
 * @typedef {Object} Me
 * @property {string} [email]
 * @property {string} [name]
 * @property {string} [role]
 */

/**
 * Rolle normalisiert (Großschreibung, leer wenn unbekannt).
 * @param {Me|null|undefined} me
 * @returns {string}
 */
export function roleOf(me) {
	return (me?.role ?? '').toUpperCase();
}

/**
 * VIEWER = nur lesen. Für diese Rolle werden Schreib-Bedienelemente ausgeblendet.
 * @param {Me|null|undefined} me
 */
export function isViewer(me) {
	return roleOf(me) === ROLE_VIEWER;
}

/**
 * ADMIN = darf Benutzer verwalten (Benutzerverwaltung sichtbar).
 * @param {Me|null|undefined} me
 */
export function isAdmin(me) {
	return roleOf(me) === ROLE_ADMIN;
}

/**
 * Anzeigename fürs Header-Chip: Name, sonst E-Mail.
 * @param {Me|null|undefined} me
 */
export function displayName(me) {
	if (!me) return '';
	return me.name || me.email || '';
}
