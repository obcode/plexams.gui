<script>
	import { onMount } from 'svelte';
	import { mkDate } from '$lib/jshelper/misc';

	let nextDeadline = 'unknown';
	async function getNextDeadline() {
		const response = await fetch('/api/nextDeadline', {
			method: 'GET'
		});

		nextDeadline = await response.json();
	}

	let semester = 'unknown';
	async function getSemester() {
		const response = await fetch('/api/semester', {
			method: 'GET'
		});

		semester = await response.json();
	}

	onMount(() => {
		getNextDeadline();
		getSemester();
	});
</script>

<div class="navbar bg-base-100">
	<div class="flex-1">
		<a class="btn btn-ghost normal-case text-xl" href="/"
			>Plexams
			{#if nextDeadline}
				(nächste Deadline: {mkDate(nextDeadline.deadline)})
			{/if}
		</a>
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
				<li><a href="/zpa/studentregs">Importfehler Anmeldungen</a></li>
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
			<label tabindex="0" class="badge mx-4"> {semester} </label>
		</div>
	</div>
</div>
