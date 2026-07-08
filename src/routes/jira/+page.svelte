<script>
	import {
		fetchConnection,
		fetchOpenIssues,
		fetchIssue,
		fetchTransitions,
		createIssue,
		addComment,
		runTransition,
		attachToIssue
	} from '$lib/jira/client.js';
	import { connectionStatus, groupByIssueType, formatJiraDate } from '$lib/jira/jira.js';

	let { data } = $props();

	/** @param {unknown} e */
	const errMsg = (e) => (e instanceof Error ? e.message : String(e));

	// ── Verbindung ──────────────────────────────────────────────────────────────
	let connection = $state(data.connection);
	let connError = $state(data.connectionError);
	let checking = $state(false);
	let status = $derived(connectionStatus(connection, connError));

	async function recheck() {
		checking = true;
		connError = '';
		try {
			connection = await fetchConnection();
		} catch (e) {
			connection = null;
			connError = errMsg(e);
		} finally {
			checking = false;
		}
	}

	// ── Offene Issues + Sichten ───────────────────────────────────────────────────
	/** @type {import('$lib/jira/jira.js').JiraIssue[]} */
	let flat = $state(data.openIssues);
	/** @type {import('$lib/jira/jira.js').JiraRequestTypeGroup[]} */
	let byRequestType = $state(data.byRequestType);
	let listLoading = $state(false);
	let listError = $state('');

	// für FK07PP ist „nach Anfragetyp" die relevante Gruppierung
	let view = $state(/** @type {'flat' | 'type' | 'requestType'} */ ('requestType'));
	/** @type {['flat' | 'type' | 'requestType', string][]} */
	const viewTabs = [
		['flat', 'flach'],
		['type', 'nach Typ'],
		['requestType', 'nach Anfragetyp']
	];
	let byType = $derived(groupByIssueType(flat));
	let anyCreated = $derived(flat.some((i) => i.created));
	let total = $derived(flat.length);

	// Alle Sichten auf ein gemeinsames { label, issues }[] normalisieren.
	let groups = $derived(
		view === 'flat'
			? [{ label: '', issues: flat }]
			: view === 'type'
				? byType.map((g) => ({ label: g.issueType, issues: g.issues }))
				: byRequestType.map((g) => ({ label: g.requestType || '—', issues: g.issues }))
	);

	async function refreshLists() {
		listLoading = true;
		listError = '';
		try {
			const r = await fetchOpenIssues();
			flat = r.openIssues;
			byRequestType = r.byRequestType;
		} catch (e) {
			listError = errMsg(e);
		} finally {
			listLoading = false;
		}
	}

	// ── Detailpanel ───────────────────────────────────────────────────────────────
	let selectedKey = $state('');
	/** @type {import('$lib/jira/jira.js').JiraIssue | null} */
	let detail = $state(null);
	let detailLoading = $state(false);
	let detailError = $state('');

	/** @type {{ id: string, name: string }[]} */
	let transitions = $state([]);
	let selectedTransition = $state('');

	let commentBody = $state('');
	let commenting = $state(false);
	let commentMsg = $state('');

	let transitioning = $state(false);
	let transitionMsg = $state('');

	/** @type {File | null} */
	let attachFile = $state(null);
	let attaching = $state(false);
	let attachMsg = $state('');

	let showCreate = $state(false);

	function resetActionMessages() {
		commentMsg = '';
		transitionMsg = '';
		attachMsg = '';
		commentBody = '';
		selectedTransition = '';
		attachFile = null;
	}

	/** @param {string} key */
	async function selectIssue(key) {
		showCreate = false;
		selectedKey = key;
		detailLoading = true;
		detailError = '';
		resetActionMessages();
		try {
			detail = await fetchIssue(key);
			if (!detail) {
				detailError = `Kein Issue „${key}“ gefunden.`;
				transitions = [];
				return;
			}
			transitions = await fetchTransitions(key).catch(() => []);
		} catch (e) {
			detail = null;
			transitions = [];
			detailError = errMsg(e);
		} finally {
			detailLoading = false;
		}
	}

	async function submitComment() {
		if (!detail || !commentBody.trim() || commenting) return;
		commenting = true;
		commentMsg = '';
		try {
			const ok = await addComment(detail.key, commentBody.trim());
			if (ok) {
				commentBody = '';
				await selectIssue(detail.key); // Thread neu laden
			} else {
				commentMsg = 'Konnte Kommentar nicht speichern.';
			}
		} catch (e) {
			commentMsg = errMsg(e);
		} finally {
			commenting = false;
		}
	}

	async function submitTransition() {
		if (!detail || !selectedTransition || transitioning) return;
		transitioning = true;
		transitionMsg = '';
		const key = detail.key;
		try {
			const ok = await runTransition(key, selectedTransition);
			if (ok) {
				transitionMsg = '✓ Status geändert.';
				await Promise.all([selectIssue(key), refreshLists()]);
			} else {
				transitionMsg = 'Übergang fehlgeschlagen.';
			}
		} catch (e) {
			transitionMsg = errMsg(e);
		} finally {
			transitioning = false;
		}
	}

	/** @param {Event} e */
	function pickFile(e) {
		const input = /** @type {HTMLInputElement} */ (e.currentTarget);
		attachFile = input.files?.[0] ?? null;
		attachMsg = '';
	}

	async function submitAttachment() {
		if (!detail || !attachFile || attaching) return;
		attaching = true;
		attachMsg = '';
		try {
			const r = await attachToIssue({ key: detail.key, file: attachFile });
			if (r.ok) attachMsg = `✓ „${attachFile.name}“ angehängt.`;
			else if (r.blocked)
				attachMsg = 'Gerade gesperrt (Validierung/Transfer läuft) — später erneut.';
			else attachMsg = r.error || 'Upload fehlgeschlagen.';
		} catch (e) {
			attachMsg = errMsg(e);
		} finally {
			attaching = false;
		}
	}

	// ── Neues Issue ───────────────────────────────────────────────────────────────
	let cSummary = $state('');
	let cDescription = $state('');
	let creating = $state(false);
	let createError = $state('');

	function openCreate() {
		showCreate = true;
		selectedKey = '';
		detail = null;
		createError = '';
	}

	async function submitCreate() {
		if (!cSummary.trim() || creating) return;
		creating = true;
		createError = '';
		try {
			const issue = await createIssue({
				summary: cSummary.trim(),
				description: cDescription.trim()
			});
			cSummary = '';
			cDescription = '';
			await refreshLists();
			if (issue?.key) await selectIssue(issue.key);
			else showCreate = false;
		} catch (e) {
			createError = errMsg(e);
		} finally {
			creating = false;
		}
	}
</script>

{#snippet issueRow(/** @type {import('$lib/jira/jira.js').JiraIssue} */ issue)}
	<tr
		class="hover cursor-pointer {selectedKey === issue.key ? 'bg-primary/10' : ''}"
		onclick={() => selectIssue(issue.key)}
	>
		<td class="whitespace-nowrap font-medium">
			<span class="link link-primary">{issue.key}</span>
			{#if issue.url}
				<a
					href={issue.url}
					target="_blank"
					rel="noreferrer"
					class="ml-1 text-base-content/40 hover:text-primary"
					title="in Jira öffnen"
					onclick={(e) => e.stopPropagation()}>↗</a
				>
			{/if}
		</td>
		<td class="max-w-[24rem] truncate" title={issue.summary ?? ''}>{issue.summary}</td>
		<td class="whitespace-nowrap">
			{#if issue.status}<span class="badge badge-info badge-sm">{issue.status}</span>{/if}
		</td>
		<td class="whitespace-nowrap text-sm text-base-content/70"
			>{issue.reporter?.displayName ?? '—'}</td
		>
		{#if anyCreated}
			<td class="tabular-nums whitespace-nowrap text-sm text-base-content/60">
				{formatJiraDate(issue.created)}
			</td>
		{/if}
	</tr>
{/snippet}

<div class="mx-2 mt-4 flex flex-col gap-4">
	<!-- Kopf mit Verbindungs-Badge -->
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Jira</h1>
		{#if status.ok}
			<span class="badge badge-success gap-1">● {status.text}</span>
		{:else}
			<span class="badge badge-error gap-1">○ {status.text}</span>
		{/if}
		{#if connection?.emailAddress}
			<span class="text-sm text-base-content/50">{connection.emailAddress}</span>
		{/if}
		<div class="flex-1"></div>
		<button class="btn btn-ghost btn-sm" disabled={checking} onclick={recheck}>
			{checking ? 'prüfe …' : 'Verbindung prüfen'}
		</button>
	</div>
	{#if connError}
		<div class="alert alert-warning py-2 text-sm"><span>{connError}</span></div>
	{/if}

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
		<!-- ── Liste ──────────────────────────────────────────────────────────── -->
		<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
			<div class="flex flex-wrap items-center gap-2">
				<h2 class="text-lg font-semibold">Offene Issues</h2>
				<span class="badge badge-neutral badge-sm tabular-nums">{total}</span>
				<div class="flex-1"></div>
				<div class="tabs tabs-boxed tabs-sm">
					{#each viewTabs as [val, label]}
						<button class="tab {view === val ? 'tab-active' : ''}" onclick={() => (view = val)}>
							{label}
						</button>
					{/each}
				</div>
				<button class="btn btn-ghost btn-sm" disabled={listLoading} onclick={refreshLists}>
					{listLoading ? '↻ …' : '↻'}
				</button>
				<button class="btn btn-primary btn-sm" onclick={openCreate}>+ Neues Issue</button>
			</div>

			{#if listError}
				<div class="alert alert-error py-2 text-sm"><span>{listError}</span></div>
			{/if}

			<div class="overflow-x-auto">
				{#each groups as g}
					{#if g.label}
						<div class="mt-3 mb-1 flex items-center gap-2 px-1 first:mt-0">
							<span class="text-sm font-semibold text-base-content/80">{g.label}</span>
							<span class="badge badge-ghost badge-xs tabular-nums">{g.issues.length}</span>
						</div>
					{/if}
					<table class="table table-sm">
						<thead>
							<tr>
								<th>Key</th>
								<th>Zusammenfassung</th>
								<th>Status</th>
								<th>Autor</th>
								{#if anyCreated}<th>Erstellt</th>{/if}
							</tr>
						</thead>
						<tbody>
							{#each g.issues as issue (issue.key)}
								{@render issueRow(issue)}
							{:else}
								<tr>
									<td
										colspan={anyCreated ? 5 : 4}
										class="py-4 text-center text-sm text-base-content/50"
									>
										Keine offenen Issues.
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/each}
			</div>
		</section>

		<!-- ── Detail / Neues Issue ───────────────────────────────────────────── -->
		<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
			{#if showCreate}
				<div class="flex items-center gap-2">
					<h2 class="text-lg font-semibold">Neues Issue</h2>
					<div class="flex-1"></div>
					<button class="btn btn-ghost btn-xs" onclick={() => (showCreate = false)}>✕</button>
				</div>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Zusammenfassung *</span>
					<input
						type="text"
						class="input input-bordered input-sm w-full"
						bind:value={cSummary}
						placeholder="Titel des Issues"
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Beschreibung</span>
					<textarea
						class="textarea textarea-bordered textarea-sm w-full"
						rows="5"
						bind:value={cDescription}
						placeholder="optional"
					></textarea>
				</label>
				<div class="text-xs text-base-content/50">
					Projekt FK07PP, Typ „Task" (Backend-Default).
				</div>
				<div>
					<button
						class="btn btn-primary btn-sm"
						disabled={creating || !cSummary.trim()}
						onclick={submitCreate}
					>
						{creating ? 'erstelle …' : 'Issue erstellen'}
					</button>
				</div>
				{#if createError}
					<div class="alert alert-error py-2 text-sm"><span>{createError}</span></div>
				{/if}
			{:else if detailLoading}
				<div class="flex items-center gap-2 text-sm text-base-content/60">
					<span class="loading loading-spinner loading-sm"></span> lädt …
				</div>
			{:else if detailError}
				<div class="alert alert-error py-2 text-sm"><span>{detailError}</span></div>
			{:else if detail}
				<div class="flex flex-wrap items-center gap-2">
					<a
						class="link link-primary text-lg font-semibold"
						href={detail.url}
						target="_blank"
						rel="noreferrer"
					>
						{detail.key}
					</a>
					{#if detail.issueType}<span class="badge badge-neutral badge-sm">{detail.issueType}</span
						>{/if}
					{#if detail.status}<span class="badge badge-info badge-sm">{detail.status}</span>{/if}
				</div>
				<div class="text-sm text-base-content/60">
					{detail.reporter?.displayName ?? '—'}{#if detail.reporter?.emailAddress}<span
							class="text-base-content/40"
						>
							· {detail.reporter.emailAddress}</span
						>{/if}
					{#if formatJiraDate(detail.created)}<span class="text-base-content/40">
							· {formatJiraDate(detail.created)}</span
						>{/if}
				</div>
				<div class="font-medium">{detail.summary}</div>
				{#if detail.description}
					<div
						class="max-h-48 overflow-y-auto rounded-md bg-base-200 p-3 text-sm whitespace-pre-wrap"
					>
						{detail.description}
					</div>
				{/if}

				<!-- Kommentar-Thread (oldest-first) -->
				<div class="flex flex-col gap-2">
					<span class="text-xs font-medium text-base-content/60">
						Kommentare ({detail.comments?.length ?? 0})
					</span>
					{#each detail.comments ?? [] as c}
						<div class="rounded-md border border-base-300 p-2 text-sm">
							<div class="mb-1 flex flex-wrap gap-2 text-xs text-base-content/50">
								<span class="font-medium text-base-content/70">{c.author?.displayName ?? '—'}</span>
								<span>{formatJiraDate(c.created)}</span>
							</div>
							<div class="whitespace-pre-wrap">{c.body}</div>
						</div>
					{:else}
						<span class="text-sm text-base-content/40">Noch keine Kommentare.</span>
					{/each}
				</div>

				<!-- Kommentar hinzufügen -->
				<div class="flex flex-col gap-1">
					<textarea
						class="textarea textarea-bordered textarea-sm w-full"
						rows="2"
						bind:value={commentBody}
						placeholder="Kommentar hinzufügen"
					></textarea>
					<div class="flex items-center gap-2">
						<button
							class="btn btn-sm"
							disabled={commenting || !commentBody.trim()}
							onclick={submitComment}
						>
							{commenting ? 'sende …' : 'Kommentar'}
						</button>
						{#if commentMsg}<span class="text-sm text-error">{commentMsg}</span>{/if}
					</div>
				</div>

				<!-- Status ändern -->
				<div class="flex flex-wrap items-center gap-2">
					<select
						class="select select-bordered select-sm w-full sm:w-52"
						bind:value={selectedTransition}
						disabled={!transitions.length}
					>
						<option value="">{transitions.length ? 'Status ändern …' : 'keine Übergänge'}</option>
						{#each transitions as t}
							<option value={t.id}>{t.name}</option>
						{/each}
					</select>
					<button
						class="btn btn-sm"
						disabled={transitioning || !selectedTransition}
						onclick={submitTransition}
					>
						{transitioning ? 'ändere …' : 'ausführen'}
					</button>
					{#if transitionMsg}<span class="text-sm text-base-content/70">{transitionMsg}</span>{/if}
				</div>

				<!-- Datei anhängen -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Datei anhängen (PDF/CSV …)</span>
					<div class="flex flex-wrap items-center gap-2">
						<input
							type="file"
							class="file-input file-input-bordered file-input-sm w-full sm:w-auto"
							accept=".pdf,.csv,application/pdf,text/csv"
							onchange={pickFile}
						/>
						<button
							class="btn btn-sm"
							disabled={attaching || !attachFile}
							onclick={submitAttachment}
						>
							{attaching ? 'lädt …' : 'anhängen'}
						</button>
					</div>
					{#if attachMsg}<span class="text-sm text-base-content/70">{attachMsg}</span>{/if}
				</div>
			{:else}
				<div
					class="flex h-full items-center justify-center py-12 text-center text-sm text-base-content/50"
				>
					Wähle links ein Issue — oder lege ein neues an.
				</div>
			{/if}
		</section>
	</div>
</div>
