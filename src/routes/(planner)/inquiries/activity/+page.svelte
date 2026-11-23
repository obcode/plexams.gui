<script>
	import { invalidateAll } from '$app/navigation';
	import { formatBerlin } from '#lib/portal/time.js';
	import { ACTION_LABEL, FIELD_LABEL, KIND_LABEL } from '#lib/inquiry/diff.js';

	/** @type {{ data: any }} */
	let { data } = $props();

	const activity = $derived(/** @type {any[]} */ (data.activity));
	const seenUpTo = $derived(data.setting?.seenUpTo ?? 0);
	const newest = $derived(activity.length > 0 ? activity[0].id : 0);
	const unseen = $derived(activity.filter((a) => a.id > seenUpTo).length);
	const older = $derived(activity.length === 100 ? activity[activity.length - 1].id : null);

	/** @type {Record<string, string>} */
	const EXTRA_FIELDS = { preplan: 'Vorplanung', nothingToReport: 'nichts zu melden' };

	let error = $state('');
	async function markSeen() {
		error = '';
		const res = await fetch('/api/inquiry/markActivitySeen', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ upTo: newest })
		});
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) error = d?.error || `Fehler (HTTP ${res.status})`;
		else await invalidateAll();
	}

	/** @param {Record<string, string | null>} change */
	function link(change) {
		const params = new URLSearchParams();
		const next = { semester: data.filter.semester, kind: data.filter.kind, ...change };
		for (const [k, v] of Object.entries(next)) if (v) params.set(k, String(v));
		const q = params.toString();
		return q ? `?${q}` : '?';
	}
</script>

<svelte:head><title>Änderungen im Portal</title></svelte:head>

<h1 class="text-2xl font-semibold">Änderungen im Portal</h1>
<p class="mt-1 text-sm text-base-content/70">
	Jede Eingabe der Prüfenden, über alle Semester. Benachrichtigung per Mail einstellen unter
	<a class="link" href="/account">Mein Account</a>. Zurück zu den
	<a class="link" href="/inquiries">Abfragen</a>.
</p>

{#if data.loadError}
	<div class="alert alert-warning mt-4"><span>{data.loadError}</span></div>
{/if}
{#if error}
	<div class="alert alert-error mt-4" role="alert"><span>{error}</span></div>
{/if}

<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
	<span>Art:</span>
	<a
		class="btn btn-xs {data.filter.kind ? 'btn-ghost' : 'btn-active'}"
		href={link({ kind: null, before: null })}
	>
		alle
	</a>
	{#each Object.entries(KIND_LABEL) as [kind, label] (kind)}
		<a
			class="btn btn-xs {data.filter.kind === kind ? 'btn-active' : 'btn-ghost'}"
			href={link({ kind, before: null })}
		>
			{label}
		</a>
	{/each}
	{#if data.filter.semester}
		<a class="btn btn-xs btn-outline" href={link({ semester: null, before: null })}>
			Semester {data.filter.semester} ✕
		</a>
	{/if}
	<span class="grow"></span>
	{#if unseen > 0}
		<button class="btn btn-primary btn-xs" onclick={markSeen}>
			{unseen} neue als gelesen markieren
		</button>
	{/if}
</div>

{#if activity.length === 0}
	<p class="mt-6 text-sm text-base-content/70">Keine Eingaben.</p>
{:else}
	<div class="mt-4 overflow-x-auto">
		<table class="table table-sm">
			<thead>
				<tr>
					<th>Wann</th>
					<th>Semester</th>
					<th>Art</th>
					<th>Prüfende:r</th>
					<th>Was</th>
					<th>Von</th>
				</tr>
			</thead>
			<tbody>
				{#each activity as a (a.id)}
					<tr class={a.id > seenUpTo ? 'bg-info/10 font-medium' : ''}>
						<td class="whitespace-nowrap">{formatBerlin(a.at)}</td>
						<td>
							<a class="link" href={link({ semester: a.semester, before: null })}>{a.semester}</a>
						</td>
						<td>{KIND_LABEL[a.kind] ?? a.kind}</td>
						<td>{a.teacherName || a.teacherID}</td>
						<td>
							{ACTION_LABEL[a.action] ?? a.action}{#if a.label}: {a.label}{/if}
							{#if a.changes.length > 0}
								<ul class="text-xs font-normal">
									{#each a.changes as c (c.field)}
										<li>
											{FIELD_LABEL[c.field] ?? EXTRA_FIELDS[c.field] ?? c.field}:
											{#if c.old}<span class="line-through opacity-60">{c.old}</span> →{/if}
											{c.new}
										</li>
									{/each}
								</ul>
							{/if}
						</td>
						<td class="text-xs">{a.actor}{a.channel === 'TOKEN' ? ' (Token)' : ''}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if older}
		<a class="btn btn-sm mt-3" href={link({ before: String(older) })}>Ältere</a>
	{/if}
{/if}
