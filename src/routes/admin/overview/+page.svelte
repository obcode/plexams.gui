<script>
	import StreamAction from '$lib/zpa/StreamAction.svelte';

	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();

	let overview = $derived(data.overview);

	/** Zeitstempel (ISO) lokal (Europe/Berlin) formatieren; null → „—". */
	/** @param {string|null|undefined} iso */
	function fmt(iso) {
		if (!iso) return '—';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleString('de-DE', {
			timeZone: 'Europe/Berlin',
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/** Nur Uhrzeit (für kompakte Log-Tabellen). @param {string|null|undefined} iso */
	function fmtTime(iso) {
		if (!iso) return '—';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleString('de-DE', {
			timeZone: 'Europe/Berlin',
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	/** Badge-Klasse je Rolle. @param {string} role */
	function roleBadge(role) {
		const r = (role || '').toUpperCase();
		if (r === 'ADMIN') return 'badge-primary';
		if (r === 'VIEWER') return 'badge-warning';
		return 'badge-ghost';
	}

	// Auto-Sync-Ampel: lastStatus ∈ ok | errors | skipped | panic (leer wenn neverRan)
	let sched = $derived(overview?.scheduler ?? null);
	let syncAmpel = $derived.by(() => {
		if (!sched || sched.neverRan) {
			return { badge: 'badge-ghost', dot: 'bg-base-content/30', label: 'noch nie gelaufen' };
		}
		switch (sched.lastStatus) {
			case 'ok':
				return { badge: 'badge-success', dot: 'bg-success', label: 'ok' };
			case 'skipped':
				return { badge: 'badge-ghost', dot: 'bg-base-content/40', label: 'übersprungen' };
			case 'errors':
				return { badge: 'badge-error', dot: 'bg-error', label: 'mit Fehlern' };
			case 'panic':
				return { badge: 'badge-error', dot: 'bg-error', label: 'Panik' };
			default:
				return { badge: 'badge-ghost', dot: 'bg-base-content/30', label: sched.lastStatus || '—' };
		}
	});

	/** Auslöser lesbar. @param {string} t */
	function triggerLabel(t) {
		if (t === 'nightly') return 'nächtlich';
		if (t === 'catchup') return 'Nachhol-Lauf';
		if (t === 'manual') return 'manuell';
		return t || '—';
	}

	let server = $derived(overview?.server ?? null);
	let roleCounts = $derived(overview?.roleCounts ?? null);
	let activity = $derived(overview?.activity ?? null);
	let backup = $derived(overview?.backup ?? null);
	let live = $derived(overview?.live ?? null);
	let users = $derived(overview?.users ?? []);
	let workspaces = $derived(overview?.workspaces ?? []);
	let recentActivity = $derived(overview?.recentActivity ?? []);
	let recentErrors = $derived(overview?.recentErrors ?? []);
	let recentSyncs = $derived(overview?.recentSyncs ?? []);
</script>

<svelte:head><title>Administration · Überblick · Plexams</title></svelte:head>

<div class="mx-auto max-w-6xl py-6">
	<header class="mb-6 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold">🛠️ Administration · Überblick</h1>
			<p class="mt-1 text-sm text-base-content/60">
				Betriebszustand des Servers, Zugriff, Auto-Sync und Audit-Aktivität.
			</p>
		</div>
		{#if overview}
			<span class="text-xs text-base-content/50">Stand: {fmt(overview.generatedAt)}</span>
		{/if}
	</header>

	{#if !data.available || !overview}
		<div class="alert alert-warning">
			<span>
				Übersicht nicht verfügbar — dies erfordert eine ADMIN-Rolle und ein Backend mit der
				<code>adminOverview</code>-Query.
				{#if data.loadError}<span class="mt-1 block font-mono text-xs opacity-70"
						>{data.loadError}</span
					>{/if}
			</span>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<!-- Server & Workspace -->
			<section class="card border border-base-300 bg-base-100 shadow-sm">
				<div class="card-body gap-3 p-4">
					<h2 class="text-sm font-semibold text-base-content/70">🖥️ Server &amp; Workspace</h2>
					<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
						<dt class="text-base-content/60">Version</dt>
						<dd class="font-medium">
							{server?.version || '—'}
							{#if server?.releaseURL}
								<a
									class="link link-primary ml-1 text-xs"
									href={server.releaseURL}
									target="_blank"
									rel="noopener noreferrer">Release ↗</a
								>
							{/if}
						</dd>
						<dt class="text-base-content/60">Commit</dt>
						<dd class="font-mono text-xs break-all">{server?.commit || '—'}</dd>
						<dt class="text-base-content/60">Aktives Semester</dt>
						<dd class="font-medium">{overview.activeSemester || '—'}</dd>
						<dt class="text-base-content/60">MongoDB-Host</dt>
						<dd class="font-mono text-xs break-all">{server?.mongoHost || '—'}</dd>
						<dt class="text-base-content/60">Datenbank</dt>
						<dd class="font-mono text-xs break-all">{server?.mongoDatabase || '—'}</dd>
					</dl>
				</div>
			</section>

			<!-- Laufzeit -->
			<section class="card border border-base-300 bg-base-100 shadow-sm">
				<div class="card-body gap-3 p-4">
					<h2 class="text-sm font-semibold text-base-content/70">⚙️ Laufzeit</h2>
					<div class="flex flex-wrap items-center gap-2">
						{#if live?.writesAllowed}
							<span class="badge badge-success gap-1">Schreiben möglich</span>
						{:else}
							<span class="badge badge-warning gap-1">
								<span class="loading loading-spinner loading-xs"></span> Operation läuft
							</span>
						{/if}
						{#if live?.readOnly}
							<span class="badge badge-warning">Workspace schreibgeschützt</span>
						{:else}
							<span class="badge badge-ghost">nicht schreibgeschützt</span>
						{/if}
					</div>
					<p class="text-xs text-base-content/50">
						Während einer Validierung oder eines exklusiven Transfers sind Schreibvorgänge
						serverseitig gesperrt.
					</p>
				</div>
			</section>

			<!-- Auto-Sync -->
			<section class="card border border-base-300 bg-base-100 shadow-sm">
				<div class="card-body gap-3 p-4">
					<h2 class="flex items-center gap-2 text-sm font-semibold text-base-content/70">
						🔄 Auto-Sync
						<span class="badge badge-sm {syncAmpel.badge} gap-1.5">
							<span class="inline-block h-2 w-2 rounded-full {syncAmpel.dot}"></span>
							{syncAmpel.label}
						</span>
					</h2>
					{#if sched?.autoSyncEnabled}
						<p class="text-sm text-base-content/70">
							Aktiviert — täglich um <span class="font-medium">{sched.autoSyncTime || '—'}</span>.
						</p>
					{:else}
						<p class="text-sm text-warning">Deaktiviert.</p>
					{/if}

					{#if sched?.neverRan}
						<p class="text-sm text-base-content/50">Der Auto-Sync ist noch nie gelaufen.</p>
					{:else if sched}
						<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
							<dt class="text-base-content/60">Letzter Lauf</dt>
							<dd>
								{fmt(sched.lastFireAt)}{sched.lastFinished ? ` – ${fmt(sched.lastFinished)}` : ''}
							</dd>
							<dt class="text-base-content/60">Auslöser</dt>
							<dd>{triggerLabel(sched.lastTrigger)}</dd>
							<dt class="text-base-content/60">Semester</dt>
							<dd>{sched.lastSemester || '—'}</dd>
							<dt class="text-base-content/60">Änderungen</dt>
							<dd class="font-medium tabular-nums">{sched.lastTotalChanges}</dd>
						</dl>
					{/if}

					<div class="mt-1 border-t border-base-200 pt-2 text-xs text-base-content/60">
						Admin-Digest:
						{#if sched?.adminMailEnabled}
							<span class="text-success">aktiviert</span>, täglich {sched.adminMailTime || '—'}
						{:else}
							<span class="text-base-content/50">deaktiviert</span>
						{/if}
						<span class="opacity-70"> · Empfänger: alle ADMIN-Nutzer (Server-Config)</span>
					</div>
				</div>
			</section>

			<!-- Backup -->
			<section class="card border border-base-300 bg-base-100 shadow-sm">
				<div class="card-body gap-3 p-4">
					<h2 class="text-sm font-semibold text-base-content/70">💾 Backup</h2>
					{#if backup?.hasUnsavedChanges}
						<div class="alert alert-warning py-2 text-sm">
							<span>
								Backup fällig — Änderungen seit dem letzten Dump
								{#if backup.lastChangeAt}(zuletzt {fmt(backup.lastChangeAt)}){/if}.
							</span>
						</div>
						<a class="btn btn-warning btn-sm w-fit" href="/download"
							>⬇️ Semester-Dump herunterladen</a
						>
					{:else}
						<p class="text-sm text-success">Aktuell — keine ungesicherten Änderungen.</p>
					{/if}
					<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
						<dt class="text-base-content/60">Letzter Dump</dt>
						<dd>{fmt(backup?.lastDumpAt)}</dd>
						<dt class="text-base-content/60">Letzte Änderung</dt>
						<dd>{fmt(backup?.lastChangeAt)}</dd>
					</dl>
				</div>
			</section>

			<!-- Zugriff & Rollen -->
			<section class="card border border-base-300 bg-base-100 shadow-sm lg:col-span-2">
				<div class="card-body gap-3 p-4">
					<h2 class="flex flex-wrap items-center gap-2 text-sm font-semibold text-base-content/70">
						🔐 Zugriff &amp; Rollen
						{#if roleCounts}
							<span class="badge badge-primary badge-sm">ADMIN {roleCounts.admin}</span>
							<span class="badge badge-ghost badge-sm">PLANER {roleCounts.planer}</span>
							<span class="badge badge-warning badge-sm">VIEWER {roleCounts.viewer}</span>
							<span class="badge badge-neutral badge-sm">Σ {roleCounts.total}</span>
						{/if}
						<a class="link link-primary ml-auto text-xs" href="/admin/users">Benutzerverwaltung →</a
						>
					</h2>
					<div class="overflow-x-auto rounded-lg border border-base-300">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Name</th>
									<th>E-Mail</th>
									<th>Kürzel</th>
									<th>Rolle</th>
								</tr>
							</thead>
							<tbody>
								{#each users as u (u.email)}
									<tr>
										<td class="font-medium">{u.name || '—'}</td>
										<td class="break-all text-base-content/70">{u.email}</td>
										<td class="text-base-content/70">{u.shortname || '—'}</td>
										<td><span class="badge badge-sm {roleBadge(u.role)}">{u.role}</span></td>
									</tr>
								{:else}
									<tr
										><td colspan="4" class="text-center text-base-content/50">Keine Benutzer.</td
										></tr
									>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<!-- Aktivität (Audit) -->
			<section class="card border border-base-300 bg-base-100 shadow-sm lg:col-span-2">
				<div class="card-body gap-3 p-4">
					<h2 class="flex flex-wrap items-center gap-2 text-sm font-semibold text-base-content/70">
						📊 Aktivität (Audit)
						<a class="link link-primary ml-auto text-xs" href="/log">Mutations-Log →</a>
					</h2>

					{#if activity}
						<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
							<div class="rounded-lg border border-base-200 bg-base-200/40 p-3">
								<div class="text-2xl font-bold tabular-nums">{activity.last24h}</div>
								<div class="text-xs text-base-content/60">Operationen (24 h)</div>
							</div>
							<div class="rounded-lg border border-base-200 bg-base-200/40 p-3">
								<div class="text-2xl font-bold tabular-nums">{activity.last7d}</div>
								<div class="text-xs text-base-content/60">Operationen (7 T)</div>
							</div>
							<div
								class="rounded-lg border p-3 {activity.errors7d > 0
									? 'border-error/40 bg-error/10'
									: 'border-base-200 bg-base-200/40'}"
							>
								<div
									class="text-2xl font-bold tabular-nums {activity.errors7d > 0
										? 'text-error'
										: ''}"
								>
									{activity.errors7d}
								</div>
								<div class="text-xs text-base-content/60">Fehler (7 T)</div>
							</div>
							<div class="rounded-lg border border-base-200 bg-base-200/40 p-3">
								<div class="text-2xl font-bold tabular-nums">{activity.distinctUsers7d}</div>
								<div class="text-xs text-base-content/60">aktive Nutzer (7 T)</div>
							</div>
						</div>
					{/if}

					<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<!-- Top-Operationen -->
						<div>
							<h3 class="mb-1.5 text-xs font-semibold text-base-content/60">
								Häufigste Operationen (7 T)
							</h3>
							<ul class="flex flex-col gap-1">
								{#each activity?.topOperations ?? [] as op}
									<li class="flex items-center justify-between gap-2 text-sm">
										<span class="truncate font-mono text-xs">{op.name}</span>
										<span class="badge badge-ghost badge-sm tabular-nums">{op.count}</span>
									</li>
								{:else}
									<li class="text-sm text-base-content/50">Keine Daten.</li>
								{/each}
							</ul>
						</div>

						<!-- Jüngste Fehler -->
						<div>
							<h3 class="mb-1.5 text-xs font-semibold text-base-content/60">Jüngste Fehler</h3>
							{#if recentErrors.length}
								<ul class="flex flex-col gap-1">
									{#each recentErrors as e}
										<li class="rounded border border-error/30 bg-error/10 p-1.5 text-xs">
											<div class="flex items-center justify-between gap-2">
												<span class="font-medium">{e.name}</span>
												<span class="text-base-content/50">{fmtTime(e.time)}</span>
											</div>
											{#if e.user}<div class="text-base-content/60">{e.user}</div>{/if}
											<div class="text-error break-words">{e.error}</div>
										</li>
									{/each}
								</ul>
							{:else}
								<p class="text-sm text-success">Keine Fehler.</p>
							{/if}
						</div>
					</div>

					<!-- Jüngste Aktivität -->
					<div>
						<h3 class="mb-1.5 text-xs font-semibold text-base-content/60">Jüngste Aktivität</h3>
						<div class="overflow-x-auto rounded-lg border border-base-300">
							<table class="table table-xs">
								<thead>
									<tr>
										<th>Zeit</th>
										<th>Operation</th>
										<th>Typ</th>
										<th>Nutzer</th>
										<th class="text-right">Dauer</th>
									</tr>
								</thead>
								<tbody>
									{#each recentActivity as a}
										<tr class={a.error ? 'bg-error/10' : ''}>
											<td class="tabular-nums whitespace-nowrap">{fmtTime(a.time)}</td>
											<td class="font-medium">{a.name}</td>
											<td class="text-base-content/60">{a.type}</td>
											<td class="break-all text-base-content/70">{a.user || '—'}</td>
											<td class="text-right tabular-nums text-base-content/60">
												{a.type === 'subscription' && !a.durationMs ? '—' : `${a.durationMs} ms`}
											</td>
										</tr>
									{:else}
										<tr
											><td colspan="5" class="text-center text-base-content/50">Keine Einträge.</td
											></tr
										>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</section>

			<!-- Workspaces -->
			<section class="card border border-base-300 bg-base-100 shadow-sm">
				<div class="card-body gap-3 p-4">
					<h2 class="text-sm font-semibold text-base-content/70">🗂️ Workspaces</h2>
					<div class="overflow-x-auto rounded-lg border border-base-300">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Datenbank</th>
									<th>Semester</th>
									<th class="text-right">Schema</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{#each workspaces as w (w.id)}
									<tr class={w.id === overview.activeSemester ? 'bg-primary/10' : ''}>
										<td class="font-medium">
											{w.id}
											{#if w.id === overview.activeSemester}
												<span class="badge badge-primary badge-xs ml-1">aktiv</span>
											{/if}
										</td>
										<td class="text-base-content/70">{w.semester || '—'}</td>
										<td class="text-right tabular-nums text-base-content/60"
											>{w.schemaVersion ?? '—'}</td
										>
										<td class="text-right">
											{#if w.readOnly}
												<span class="badge badge-warning badge-xs">read-only</span>
											{/if}
										</td>
									</tr>
								{:else}
									<tr><td colspan="4" class="text-center text-base-content/50">Keine.</td></tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<!-- Letzte Transfers -->
			<section class="card border border-base-300 bg-base-100 shadow-sm">
				<div class="card-body gap-3 p-4">
					<h2 class="text-sm font-semibold text-base-content/70">🔁 Letzte Transfers</h2>
					<div class="overflow-x-auto rounded-lg border border-base-300">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Zeit</th>
									<th>System</th>
									<th>Vorgang</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{#each recentSyncs as s}
									<tr>
										<td class="tabular-nums whitespace-nowrap text-xs">{fmtTime(s.time)}</td>
										<td><span class="badge badge-ghost badge-sm">{s.system}</span></td>
										<td>
											<div class="font-medium">{s.label}</div>
											<div class="text-xs text-base-content/60">{s.summary}</div>
										</td>
										<td class="text-right">
											{#if s.ok}
												<span class="badge badge-success badge-xs">ok</span>
											{:else}
												<span class="badge badge-error badge-xs">Fehler</span>
											{/if}
										</td>
									</tr>
								{:else}
									<tr><td colspan="4" class="text-center text-base-content/50">Keine.</td></tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<!-- Admin-Digest jetzt senden -->
			<section class="card border border-base-300 bg-base-100 shadow-sm lg:col-span-2">
				<div class="card-body gap-3 p-4">
					<h2 class="text-sm font-semibold text-base-content/70">✉️ Admin-Digest jetzt senden</h2>
					<p class="text-sm text-base-content/60">
						Sendet den Tages-Digest sofort. <span class="font-medium">Probelauf</span> schickt die
						Vorschau nur an die Testadresse (<code>smtp.testmail</code>) — ohne Probelauf geht der
						Digest an alle ADMIN-Nutzer.
					</p>
					<StreamAction
						field="sendAdminDigestNow"
						title="Digest senden"
						hasDryRun={true}
						dryRunHint="Probelauf aktiv — die Vorschau geht nur an die Testadresse, nicht an die Admins."
						accent="warning"
						actionLabel="Senden"
					/>
				</div>
			</section>
		</div>
	{/if}
</div>
