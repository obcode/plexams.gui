import { CodegenConfig } from '@graphql-codegen/cli';

// Prefer environment variable, fall back to SvelteKit env if available, finally fallback to local schema file
let schema: string | undefined = process.env.PLEXAMS_SERVER;
try {
	// Try to load SvelteKit env when running inside svelte environment
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const svelteEnv = require('$env/dynamic/private');
	if (!schema && svelteEnv?.env?.PLEXAMS_SERVER) schema = svelteEnv.env.PLEXAMS_SERVER;
} catch (e) {
	// ignore - require will fail outside sveltekit
}

if (!schema) schema = './schema.graphql';

const config: CodegenConfig = {
	schema,
	// documents: ['src/**/*.graphql'],
	generates: {
		'./src/lib/__generated__/graphql.ts': {
			plugins: ['typescript', 'typescript-operations']
		}
	}
};

export default config;
