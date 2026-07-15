declare global {
	namespace App {
		// interface Error {}
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
