<script>
	import { invalidateAll } from '$app/navigation';
	import { formatBerlin } from '$lib/portal/time';
	import { KIND_LABEL, STATE_LABEL, preplanDiff } from '$lib/inquiry/diff';
	import { REVIEW_LABEL } from '$lib/portal/inquiry';

	/** @type {{ data: any }} */
	let { data } = $props();

	const inquiries = $derived(/** @type {any[]} */ (data.inquiries));
	const preplan = $derived(inquiries.find((i) => i.kind === 'PREPLAN'));
	const others = $derived(inquiries.filter((i) => i.kind !== 'PREPLAN'));
	const semester = $derived(preplan?.semester ?? '');
	const elsewhere = $derived(
		/** @type {any[]} */ (data.inbox).filter((e) => e.semester !== semester && e.open > 0)
	);

	let onlyOpen = $state(true);
	const submissions = $derived(
		/** @type {any[]} */ (data.submissions).filter((s) => !onlyOpen || s.review === 'OPEN')
	);

	let error = $state('');
	let busy = $state(false);

	/** @param {string} url @param {any} body */
	async function post(url, body) {
		if (busy) return false;
		busy = true;
		error = '';
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) throw new Error(d?.error || `Fehler (HTTP ${res.status})`);
			await invalidateAll();
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			return false;
		} finally {
			busy = false;
		}
	}

	/** @param {string | null | undefined} iso */
	function toLocalInput(iso) {
		if (!iso) return '';
		const d = new Date(iso);
		const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	let deadline = $state('');
	let intro = $state('');
	let dirty = $state(false);
	$effect(() => {
		if (!dirty) {
			deadline = toLocalInput(preplan?.deadline);
			intro = preplan?.intro ?? '';
		}
	});

	async function save() {
		const ok = await post('/api/inquiry/setInquiry', {
			kind: 'PREPLAN',
			deadline: deadline ? new Date(deadline).toISOString() : null,
			intro
		});
		if (ok) dirty = false;
	}

	/** @type {Record<number, string>} */
	let rejectNote = $state({});
</script>

<svelte:head><title>Abfragen an Prüfende</title></svelte:head>

<h1 class="text-2xl font-semibold">Abfragen an Prüfende</h1>
<p class="mt-1 text-sm text-base-content/70">
	Was die Prüfenden im Portal eintragen. Semester: <span class="font-mono">{semester}</span>. Alle
	Eingaben stehen auch in der <a class="link" href="/inquiries/activity">Änderungsübersicht</a>.
</p>

{#if data.loadError}
	<div class="alert alert-warning mt-4"><span>{data.loadError}</span></div>
{/if}
{#if error}
	<div class="alert alert-error mt-4" role="alert">
		<span>{error}</span>
		<button class="btn btn-ghost btn-xs" onclick={() => (error = '')}>schließen</button>
	</div>
{/if}
{#if elsewhere.length > 0}
	<div class="alert alert-info mt-4">
		<span>
			Ungesichtete Meldungen in anderen Semestern:
			{elsewhere
				.map((e) => `${e.semester} (${KIND_LABEL[e.kind] ?? e.kind}: ${e.open})`)
				.join(', ')}
			– dazu ins Semester wechseln.
		</span>
	</div>
{/if}

{#if preplan}
	<section class="card mt-6 border border-base-300 bg-base-100 shadow-sm">
		<div class="card-body gap-4 p-4">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 class="card-title text-base">{KIND_LABEL.PREPLAN}</h2>
				<span
					class="badge {preplan.state === 'OPEN'
						? 'badge-success'
						: preplan.state === 'CLOSED'
							? 'badge-neutral'
							: 'badge-ghost'}">{STATE_LABEL[preplan.state] ?? preplan.state}</span
				>
			</div>
			<p class="text-sm">
				{preplan.submissions} Meldungen, davon {preplan.openSubmissions} ungesichtet ·
				{preplan.nothingToReport}× „nichts zu melden"
				{#if preplan.openedAt}· geöffnet {formatBerlin(preplan.openedAt)} ({preplan.openedBy}){/if}
				{#if preplan.closedAt}· geschlossen {formatBerlin(preplan.closedAt)} ({preplan.closedBy}){/if}
			</p>

			<div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Frist</span>
					<input
						type="datetime-local"
						class="input input-bordered input-sm w-full sm:w-64"
						bind:value={deadline}
						oninput={() => (dirty = true)}
					/>
				</label>
				<label class="flex flex-col gap-1 lg:col-span-2">
					<span class="text-xs font-medium text-base-content/60">
						Einleitung (erscheint über dem Formular im Portal)
					</span>
					<textarea
						class="textarea textarea-bordered w-full"
						rows="3"
						bind:value={intro}
						oninput={() => (dirty = true)}></textarea>
				</label>
			</div>
			<div class="flex flex-wrap gap-2">
				<button class="btn btn-sm" disabled={busy} onclick={save}>
					{preplan.state === 'DRAFT' && !preplan.openedAt ? 'Einrichten' : 'Speichern'}
				</button>
				{#if preplan.state !== 'OPEN'}
					<button
						class="btn btn-primary btn-sm"
						disabled={busy || dirty}
						title={dirty ? 'Erst speichern' : ''}
						onclick={() => post('/api/inquiry/openInquiry', { kind: 'PREPLAN' })}
					>
						{preplan.state === 'CLOSED' ? 'Wieder öffnen' : 'Öffnen'}
					</button>
				{:else}
					<button
						class="btn btn-warning btn-sm"
						disabled={busy}
						onclick={() => post('/api/inquiry/closeInquiry', { kind: 'PREPLAN' })}
					>
						Schließen
					</button>
				{/if}
			</div>
			<p class="text-xs text-base-content/60">
				Öffnen macht die Abfrage im Portal sichtbar. Die Einladung verschickt die Seite
				<a class="link" href="/email">E-Mails</a> („EXaHM / SEB“) – solange eine EXaHM/SEB-Abfrage dieses
				oder eines späteren Semesters offen ist, mit Link aufs Portal, auch aus dem vorherigen Semester
				heraus. Schließen setzt „SEB/EXaHM-Bedarf erfasst“.
			</p>
		</div>
	</section>

	<section class="mt-6">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-lg font-medium">Posteingang</h2>
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" class="toggle toggle-sm" bind:checked={onlyOpen} />
				nur ungesichtete
			</label>
		</div>
		{#if submissions.length === 0}
			<p class="mt-2 text-sm text-base-content/70">
				{onlyOpen ? 'Nichts Ungesichtetes.' : 'Noch keine Meldungen.'}
			</p>
		{/if}
		<ul class="mt-3 grid grid-cols-1 gap-3">
			{#each submissions as s (s.id)}
				{@const changes = preplanDiff(s.reviewedPreplan, s.preplan)}
				<li class="card border border-base-300 bg-base-100 {s.withdrawn ? 'opacity-70' : ''}">
					<div class="card-body gap-2 p-4">
						<div class="flex flex-wrap items-baseline justify-between gap-2">
							<h3 class="font-medium">
								<span class="badge badge-outline">{s.preplan?.examKind}</span>
								{s.preplan?.module}
								<span class="text-sm font-normal text-base-content/70">· {s.teacherName}</span>
							</h3>
							<span class="flex flex-wrap gap-1">
								{#if s.withdrawn}<span class="badge badge-warning">zurückgezogen</span>{/if}
								{#if s.review === 'OPEN'}
									<span class="badge badge-info">
										{s.reviewedRevision ? 'geändert' : 'neu'}
									</span>
								{:else}
									<span class="badge badge-ghost">{REVIEW_LABEL[s.review] ?? s.review}</span>
								{/if}
							</span>
						</div>
						<p class="text-sm">
							{s.preplan?.programs?.join(', ')} · {s.preplan?.expectedStudents} Teilnehmende
							{#if s.preplan?.durationMin}· {s.preplan.durationMin} min{/if}
						</p>
						{#if s.preplan?.remark}
							<p class="text-sm whitespace-pre-line text-base-content/70">„{s.preplan.remark}"</p>
						{/if}
						{#if s.review === 'OPEN' && changes.length > 0}
							<ul class="text-sm">
								{#each changes as c (c.field)}
									<li>
										<span class="font-medium">{c.label}:</span>
										<span class="line-through opacity-60">{c.old}</span> → {c.new}
									</li>
								{/each}
							</ul>
						{/if}
						<p class="text-xs text-base-content/60">
							Rev. {s.revision} · {formatBerlin(s.submittedAt)} von {s.submittedBy}{s.channel ===
							'TOKEN'
								? ' (Token)'
								: ''}
							{#if s.createdBy !== s.submittedBy}· angelegt von {s.createdBy}{/if}
							· Vorplanung:
							{#if s.preplanExamID}<a class="link" href="/preplan#preplan-{s.preplanExamID}"
									>#{s.preplanExamID}</a
								>{:else}nicht (mehr) vorhanden{/if}
						</p>
						{#if s.reviewNote}
							<p class="text-sm"><span class="font-medium">Notiz:</span> {s.reviewNote}</p>
						{/if}
						{#if s.review === 'OPEN'}
							<div class="flex flex-wrap items-end gap-2">
								<button
									class="btn btn-primary btn-sm"
									disabled={busy}
									onclick={() =>
										post('/api/inquiry/reviewSubmission', {
											id: s.id,
											revision: s.revision,
											state: 'APPLIED'
										})}
								>
									Gesichtet
								</button>
								<input
									class="input input-bordered input-sm w-full sm:w-72"
									placeholder="Begründung für die Ablehnung"
									bind:value={rejectNote[s.id]}
								/>
								<button
									class="btn btn-ghost btn-sm"
									disabled={busy || !rejectNote[s.id]?.trim()}
									onclick={() =>
										post('/api/inquiry/reviewSubmission', {
											id: s.id,
											revision: s.revision,
											state: 'REJECTED',
											note: rejectNote[s.id]
										})}
								>
									Ablehnen
								</button>
							</div>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section class="mt-8">
	<h2 class="text-lg font-medium">Weitere Abfragen</h2>
	<p class="mt-1 text-sm text-base-content/70">Kommen mit den nächsten Ausbaustufen des Portals.</p>
	<ul class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
		{#each others as i (i.kind)}
			<li class="rounded border border-base-300 p-3 text-sm text-base-content/60">
				{KIND_LABEL[i.kind] ?? i.kind}
			</li>
		{/each}
	</ul>
</section>
