import { CodegenConfig } from '@graphql-codegen/cli';
import { env } from '$env/dynamic/private';

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
