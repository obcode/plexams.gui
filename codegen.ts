import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: 'http://localhost:8080/query',
	// documents: ['src/**/*.graphql'],
	generates: {
		'./src/lib/__generated__/graphql.ts': {
			plugins: ['typescript', 'typescript-operations']
		}
	}
};

export default config;
