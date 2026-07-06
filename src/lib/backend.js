import { env } from '$env/dynamic/public';

// Basis-URL von plexams.go (derselbe Host wie /query, aber ohne den /query-Pfad).
// plexams.go bietet neben GraphQL auch REST-Routen (/upload/*, /download/*) an,
// die direkt (nicht über den /api-Proxy) angesprochen werden.
//
// @returns {string} z. B. "http://localhost:8080"
export function backendBase() {
	const url = env.PUBLIC_PLEXAMS_SERVER || 'http://localhost:8080/query';
	return url.replace(/\/query\/?$/, '');
}
