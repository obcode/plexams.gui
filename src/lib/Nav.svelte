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
			<label tabindex="-1" class="btn btn-ghost"> Plan </label>
			<ul
				tabindex="-1"
				class="mt-3 p-2 z-30 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-max"
			>
				<li><a href="/exam/generatedExams">generierte Prüfungen mit Anmeldungen, etc.</a></li>
				<li><a href="/plan/exams">Prüfungen planen</a></li>
				<!-- <li><a href="/plan/ntas">geplante Prüfungen mit NTAs</a></li> -->
				<li><a href="/plan/rooms">Raumplanung</a></li>
				<li><a href="/plan/roomsTable">Raumplanung (Tabelle)</a></li>
				<li><a href="/plan/invigilation/1">Aufsichtenplanung</a></li>
				<li><a href="/plan/examsInPlanZPA">Prüfungsliste für ZPA</a></li>
			</ul>
		</div>
		<div class="dropdown dropdown-end">
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label tabindex="-1" class="btn btn-ghost"> Vorbereitung </label>
			<ul
				tabindex="-1"
				class="mt-3 p-2 z-30 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-max"
			>
				<li><a href="/exam/examsToPlan">Zu planende ZPA-Prüfungen</a></li>
				<li><a href="/exam/examsNotToPlan">Nicht zu planende ZPA-Prüfungen</a></li>
				<li><a href="/exam/examsPlaningStatusUnknown">Nicht zugeordnete ZPA-Prüfungen</a></li>
				<li><a href="/exam/constraints">Constraints</a></li>
				<li><a href="/exam/externalExams">Zusätzliche Prüfungen</a></li>
				<li><a href="/exam/connected">Anmeldungszuordnung (ZPA/Primuss)</a></li>
			</ul>
		</div>
		<div class="dropdown dropdown-end">
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label tabindex="-1" class="btn btn-ghost"> NTA </label>
			<ul
				tabindex="-1"
				class="mt-3 p-2 z-30 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-max"
			>
				<li><a href="/nta/add"> NTA hinzufügen </a></li>
				<li><a href="/nta/ntaWithRegs"> NTAs mit Anmeldungen </a></li>
				<!-- <li><a href="/nta/ntaWithRegsByTeacher"> NTAs mit Anmeldungen nach Prüfer:in</a></li> -->
				<li><a href="/nta/all"> Bekannte NTAs </a></li>
			</ul>
		</div>
		<div class="dropdown dropdown-end">
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label tabindex="-1" class="btn btn-ghost"> ZPA </label>
			<ul
				tabindex="-1"
				class="mt-3 p-2 z-30 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-max"
			>
				<li><a href="/zpa/exams">Prüfungsliste (ZPA)</a></li>
				<li><a href="/zpa/teacher">Dozierende</a></li>
				<li><a href="/zpa/invigilators">Aufsichten</a></li>
				<li><a href="/zpa/invigilator_requirements">Aufsichten mit Anforderungen</a></li>
				<li><a href="/zpa/studentregs">Importfehler Anmeldungen</a></li>
			</ul>
		</div>
		<div class="dropdown dropdown-end">
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label tabindex="-1" class="btn btn-ghost"> Primuss </label>
			<ul
				tabindex="-1"
				class="mt-3 p-2 z-30 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-max"
			>
				<li><a href="/primuss/mucdai">MUC.DAI-Prüfungen</a></li>
				<li><a href="/primuss/exams">Prüfungslisten</a></li>
			</ul>
		</div>
		<div class="dropdown dropdown-end">
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label tabindex="-1" class="badge mx-4"> {semester} </label>
		</div>
	</div>
</div>
