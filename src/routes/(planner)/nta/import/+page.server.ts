import { gql } from 'graphql-request';
import { backendRequest } from '#lib/server/backend.js';
import type { PageServerLoad } from './$types';

const proposalFields = `
	name
	email
	mtknr
	compensation
	deltaDurationPercent
	needsRoomAlone
	needsHardware
	program
	from
	until
`;

export const load: PageServerLoad = async () => {
	const data = await backendRequest<{ ntaListPreview: any; semester: { id: string } }>(gql`
		query {
			semester {
				id
			}
			ntaListPreview {
				primussRegsAvailable
				lists {
					fk
					faculty
					filename
					semester
					semesterMatches
					stand
					importedAt
					importedBy
					warnings
					rows {
						line
						status
						mtknr
						name
						stg
						beginnStudium
						compensation
						validity
						firstSeen
						proposal { ${proposalFields} }
						existing { ${proposalFields} }
						existingDeactivated
						changes {
							field
							label
							old
							new
							significant
						}
						problems
						infos
						regs {
							stg
							program
							primussAncode
						}
						regsOnlyInList {
							stg
							program
							primussAncode
						}
						regsOnlyInPrimuss {
							stg
							program
							primussAncode
						}
					}
				}
			}
		}
	`);
	return { semester: data.semester.id, preview: data.ntaListPreview };
};
