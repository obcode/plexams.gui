import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

type Variable = { name: string; description: string; example: string };
type EmailTemplate = {
	name: string;
	description: string;
	markdown: string;
	isDefault: boolean;
	defaultMarkdown: string;
	variables: Variable[];
};
type TemplateFunction = { name: string; usage: string; description: string };

export const load: PageServerLoad = async () => {
	const data = await request<{
		emailTemplates: EmailTemplate[];
		emailTemplateFunctions: TemplateFunction[];
	}>(
		env.PLEXAMS_SERVER,
		gql`
			query {
				emailTemplates {
					name
					description
					markdown
					isDefault
					defaultMarkdown
					variables {
						name
						description
						example
					}
				}
				emailTemplateFunctions {
					name
					usage
					description
				}
			}
		`
	);
	return {
		templates: data.emailTemplates ?? [],
		functions: data.emailTemplateFunctions ?? []
	};
};
