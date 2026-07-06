declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Von Vite via `define` injizierte GUI-Version (aus package.json).
	const __APP_VERSION__: string;
}

export {};
