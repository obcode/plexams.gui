import type { CodegenConfig } from '@graphql-codegen/cli';

// Generiert TypeScript-Typen aus dem committeten Schema (schema.graphql), damit
// codegen offline und in CI ohne laufendes Backend funktioniert. Das Schema
// aktualisiert man bei Backend-Änderungen via `npm run update-schema.graphql`
// (holt es vom $PLEXAMS_SERVER und ruft danach codegen auf).
//
// Aktuell nur Schema-Typen (typescript). Sobald die Datenschicht auf typisierte
// Dokumente umgestellt wird, kommt hier client-preset + documents-Glob dazu.
const config: CodegenConfig = {
	schema: './schema.graphql',
	generates: {
		'./src/lib/__generated__/graphql.ts': {
			plugins: ['typescript']
		}
	}
};

export default config;
