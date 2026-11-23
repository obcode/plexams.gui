<script>
	import { enhance } from '$app/forms';
	import PreplanForm from '#lib/portal/PreplanForm.svelte';
	import { REVIEW_LABEL } from '#lib/portal/inquiry.js';
	import { formatBerlin } from '#lib/portal/time.js';

	/** @type {{ data: any, form: any }} */
	let { data, form } = $props();

	const inquiry = $derived(data.inquiry);
	const entries = $derived(/** @type {any[]} */ (data.entries));
	const active = $derived(entries.filter((e) => !e.withdrawn));
	const withdrawn = $derived(entries.filter((e) => e.withdrawn));
	const ownId = $derived(data.session?.teachers?.[0]?.id);
	const programName = $derived(
		Object.fromEntries(/** @type {any[]} */ (data.programs).map((p) => [p.shortname, p.name]))
	);

	/** @type {number | null} id des Eintrags in Bearbeitung, 0 = neuer */
	let editing = $state(/** @type {number | null} */ (null));
	// Nach einem erfolgreichen Speichern ist das Formular zu; nach einem abgelehnten
	// bleibt es offen, mit den Eingaben.
	$effect(() => {
		if (form?.saved || form?.withdrawn) editing = null;
		else if (form?.error && form?.input) editing = form.id ?? 0;
	});
</script>

<svelte:head><title>EXaHM/SEB {data.semester} · Portal</title></svelte:head>

<nav class="text-sm"><a class="link" href="/portal">Portal</a> › EXaHM/SEB {data.semester}</nav>
<h1 class="mt-2 text-2xl font-semibold">Prüfungen mit EXaHM oder SEB · {data.semester}</h1>

{#if inquiry.deadline}
	<p class="mt-1 text-base-content/70">Bitte bis {formatBerlin(inquiry.deadline)} Uhr melden.</p>
{/if}
{#if inquiry.intro}
	<p class="mt-4 whitespace-pre-line">{inquiry.intro}</p>
{/if}

{#if !inquiry.affected}
	<div class="alert mt-6">
		<span>Sie haben keine Prüfung im zu planenden Semester. Für Sie ist nichts zu tun.</span>
	</div>
{:else}
	{#if !inquiry.open}
		<div class="alert alert-info mt-6">
			<span>
				Die Abfrage ist geschlossen. Ihre Meldungen sind unten zu sehen; Änderungen bitte direkt an
				die Prüfungsplanung.
			</span>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert alert-error mt-6" role="alert">{form.error}</div>
	{:else if form?.saved}
		<div class="alert alert-success mt-6" role="status">
			Gespeichert. Die Prüfungsplanung sieht Ihre Meldung sofort.
		</div>
	{:else if form?.withdrawn}
		<div class="alert alert-success mt-6" role="status">Zurückgezogen.</div>
	{/if}

	<section class="mt-6">
		<h2 class="text-lg font-medium">Ihre Meldungen</h2>
		{#if active.length === 0}
			<p class="mt-2 text-base-content/70">
				{#if inquiry.nothingToReport}
					Sie haben angegeben, dass Sie keine Prüfung mit EXaHM oder SEB haben.
				{:else}
					Noch keine Meldung.
				{/if}
			</p>
		{/if}
		<ul class="mt-3 grid grid-cols-1 gap-3">
			{#each active as entry (entry.id)}
				<li class="card border border-base-300 bg-base-100">
					<div class="card-body gap-2">
						{#if editing === entry.id}
							<PreplanForm
								programs={data.programs}
								{entry}
								values={form?.id === entry.id ? form?.input : undefined}
								onCancel={() => (editing = null)}
							/>
						{:else}
							<div class="flex flex-wrap items-baseline justify-between gap-2">
								<h3 class="card-title text-base">
									<span class="badge badge-outline">{entry.examKind}</span>
									{entry.module}
								</h3>
								<span class="badge {entry.review === 'REJECTED' ? 'badge-error' : 'badge-ghost'}">
									{REVIEW_LABEL[entry.review] ?? entry.review}
								</span>
							</div>
							<p class="text-sm">
								{entry.programs
									.map((/** @type {string} */ p) =>
										programName[p] ? `${p} (${programName[p]})` : p
									)
									.join(', ')}
								· etwa {entry.expectedStudents} Teilnehmende{#if entry.durationMin}
									· {entry.durationMin} Minuten{/if}
							</p>
							{#if entry.teacher.id !== ownId}
								<p class="text-sm text-base-content/70">Für {entry.teacher.fullname}</p>
							{/if}
							{#if entry.remark}
								<p class="text-sm whitespace-pre-line text-base-content/70">„{entry.remark}"</p>
							{/if}
							{#if entry.reviewNote}
								<p class="text-sm">
									<span class="font-medium">Prüfungsplanung:</span>
									{entry.reviewNote}
								</p>
							{/if}
							<p class="text-xs text-base-content/60">
								Zuletzt {formatBerlin(entry.submittedAt)} Uhr von {entry.submittedBy}
							</p>
							{#if inquiry.open}
								<div class="card-actions">
									<button class="btn btn-sm" type="button" onclick={() => (editing = entry.id)}>
										Bearbeiten
									</button>
									<form method="POST" action="?/withdraw" use:enhance>
										<input type="hidden" name="id" value={entry.id} />
										<input type="hidden" name="expectedRevision" value={entry.revision} />
										<button class="btn btn-ghost btn-sm">Zurückziehen</button>
									</form>
								</div>
							{/if}
						{/if}
					</div>
				</li>
			{/each}
		</ul>

		{#if inquiry.open}
			{#if editing === 0}
				<div class="card mt-3 border border-primary/40 bg-base-100">
					<div class="card-body">
						<h3 class="card-title text-base">Neue Meldung</h3>
						<PreplanForm
							programs={data.programs}
							teachers={data.teachers}
							{ownId}
							values={form?.id == null ? form?.input : undefined}
							onCancel={() => (editing = null)}
						/>
					</div>
				</div>
			{:else}
				<div class="mt-4 flex flex-wrap gap-2">
					<button class="btn btn-primary" type="button" onclick={() => (editing = 0)}>
						Rechnerprüfung melden
					</button>
					{#if active.length === 0}
						<form method="POST" action="?/nothing" use:enhance>
							<input
								type="hidden"
								name="value"
								value={inquiry.nothingToReport ? 'false' : 'true'}
							/>
							<button class="btn btn-ghost">
								{inquiry.nothingToReport
									? '„Nichts zu melden" zurücknehmen'
									: 'Ich habe nichts zu melden'}
							</button>
						</form>
					{/if}
				</div>
			{/if}
		{/if}
	</section>

	{#if withdrawn.length > 0}
		<section class="mt-8">
			<h2 class="text-lg font-medium">Zurückgezogen</h2>
			<ul class="mt-3 grid grid-cols-1 gap-3">
				{#each withdrawn as entry (entry.id)}
					<li class="card border border-base-300 bg-base-200/50">
						<div class="card-body gap-2">
							{#if editing === entry.id}
								<PreplanForm
									programs={data.programs}
									{entry}
									values={form?.id === entry.id ? form?.input : undefined}
									onCancel={() => (editing = null)}
								/>
							{:else}
								<p class="text-sm">
									<span class="badge badge-outline">{entry.examKind}</span>
									{entry.module} · etwa {entry.expectedStudents} Teilnehmende
								</p>
								{#if inquiry.open}
									<div class="card-actions">
										<button class="btn btn-sm" type="button" onclick={() => (editing = entry.id)}>
											Erneut melden
										</button>
									</div>
								{/if}
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/if}
