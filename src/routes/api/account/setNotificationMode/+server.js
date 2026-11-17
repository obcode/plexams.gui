import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';

// Wie ich von Eingaben im Portal erfahre: OFF, IMMEDIATE oder DAILY. Persönlich und
// global, nicht semesterbezogen (READ_POST_PATHS).
export const POST = async ({ request }) => {
	const { mode } = await request.json();
	return gqlProxy(
		gql`
			mutation ($mode: NotificationMode!) {
				setMyNotificationMode(mode: $mode) {
					mode
				}
			}
		`,
		{ mode: String(mode) }
	);
};
