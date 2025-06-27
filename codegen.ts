import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: env.PLEXAMS_SERVER,
	// documents: ['src/**/*.graphql'],
	generates: {
		'./src/lib/__generated__/graphql.ts': {
			plugins: ['typescript', 'typescript-operations']
		}
	}
};

export default config;
