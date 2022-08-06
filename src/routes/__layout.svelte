<script>
	import Nav from '$lib/Nav.svelte';
	import { request, gql } from 'graphql-request';
	import { semester } from '$lib/stores.js';

	const query = gql`
		query {
			semester {
				id
			}
		}
	`;

	request('http://localhost:8080/query', query).then((data) => {
		semester.set(data.semester.id);
	});
</script>

<Nav {semester} />
<slot />
