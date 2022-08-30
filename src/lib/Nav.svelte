<script>
	import { request, gql } from 'graphql-request';
	import { semester, allSemesterNames } from '../stores/semester.js';

	function setSemester(sem) {
		const mutation = gql`
            mutation {
                setSemester(input: "${sem}") {
                    id
                }
            }
        `;

		request('http://localhost:8080/query', mutation)
			.then((data) => semester.set(data.setSemester.id))
			.then((_) => location.reload());
	}
</script>

<div class="navbar bg-base-100">
	<div class="flex-1">
		<a class="btn btn-ghost normal-case text-xl" href="/">Plexams</a>
	</div>

	<div class="flex-none">
		<div class="dropdown dropdown-end">
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label tabindex="0" class="btn btn-ghost"> Infos </label>
			<ul
				tabindex="0"
				class="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-max"
			>
				<li><a href="/zpa/teacher">Dozierende</a></li>
				<li><a href="/zpa/invigilators">Aufsichten</a></li>
				<li><a href="/nta/all"> Bekannte NTAs </a></li>
			</ul>
		</div>
		<div class="dropdown dropdown-end">
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label tabindex="0" class="btn btn-ghost"> Vorbereitung </label>
			<ul
				tabindex="0"
				class="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-max"
			>
				<li><a href="/zpa/exams">Prüfungsliste (ZPA)</a></li>
				<li><a href="/exam/examsToPlan">Zu planende ZPA-Prüfungen</a></li>
				<li><a href="/exam/examsNotToPlan">Nicht zu planende ZPA-Prüfungen</a></li>
				<li><a href="/exam/connected">Anmeldungszuordnung (ZPA/Primuss)</a></li>
				<li><a href="/nta/add"> NTA hinzufügen </a></li>
			</ul>
		</div>
		<div class="dropdown dropdown-end">
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label tabindex="0" class="badge mx-4"> {$semester} </label>
			<ul
				tabindex="0"
				class="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-max"
			>
				{#each $allSemesterNames as semesterName}
					<li on:click={setSemester(semesterName)}>
						<!-- svelte-ignore a11y-missing-attribute -->
						<a>{semesterName}</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
