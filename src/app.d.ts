declare global {
	namespace App {
		// Was `handleError` (hooks.server.js/hooks.client.js) an +error.svelte
		// weitergibt. eventId ist die Referenz auf den Fehlerbericht — damit
		// wird aus „bei mir ging was kaputt" eine auffindbare Meldung.
		interface Error {
			message: string;
			eventId?: string;
		}
		interface Locals {
			// Vom Auth-Proxy (nginx/Shibboleth) injizierte Identität; in
			// hooks.server.js aus X-Remote-User/-Displayname gesetzt.
			remoteUser?: string;
			remoteDisplayname?: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Von Vite via `define` injizierte GUI-Version (aus package.json).
	const __APP_VERSION__: string;

	// Von Vite via `define` injizierter Build-Zeitpunkt (ISO-8601).
	const __BUILD_TIME__: string;
}

export {};
