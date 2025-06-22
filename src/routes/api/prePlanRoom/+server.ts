import { env } from '$env/dynamic/private';
import RoomNamesInSlot from '$lib/slot/RoomNamesInSlot.svelte';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const mutation = gql`
		mutation ($ancode: Int!, $roomName: String!, $reserve: Boolean!, $mtknr: String) {
			prePlanRoom(ancode: $ancode, roomName: $roomName, reserve: $reserve, mtknr: $mtknr)
		}
	`;

	const { ancode, roomName, reserve, mtknr } = await request.json();

	const variables = {
		ancode,
		roomName,
		reserve,
		mtknr
	};

	const data = await gqlrequest(env.PLEXAMS_SERVER, mutation, variables);

	return json(data);
}
