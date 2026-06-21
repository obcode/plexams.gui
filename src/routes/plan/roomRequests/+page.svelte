<script>
	import { invalidateAll } from '$app/navigation';
	import RoomRequestToggles from '$lib/room/RoomRequestToggles.svelte';

	export let data;

	/** @type {'time' | 'room' | 'slot'} */
	let view = 'room';
	let pendingOnly = false;

	/** @param {any} r */
	const key = (r) => `${r.room}-${r.day}-${r.slot}`;

	// from/until sind ISO-Zeitstempel mit Offset (z. B. ...T10:15:00+02:00).
	// Direkt aus dem String formatieren (kein new Date) → keine Zeitzonen-/
	// Hydration-Probleme zwischen Server und Client.
	/** @param {string} iso */
	function parts(iso) {
		const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso ?? '');
		return m ? { y: m[1], mo: m[2], d: m[3], h: m[4], mi: m[5] } : null;
	}
	/** @param {string} iso */
	const fmtDate = (iso) => {
		const p = parts(iso);
		return p ? `${p.d}.${p.mo}.${p.y}` : (iso ?? '');
	};
	/** @param {string} iso */
	const fmtTime = (iso) => {
		const p = parts(iso);
		return p ? `${p.h}:${p.mi}` : '';
	};

	$: filtered = data.roomRequests.filter((/** @type {any} */ r) => !pendingOnly || !r.approved);

	$: approvedCount = data.roomRequests.filter((/** @type {any} */ r) => r.approved).length;
	$: pendingCount = data.roomRequests.length - approvedCount;

	$: byRoom = [...new Set(filtered.map((/** @type {any} */ r) => r.room))]
		.sort()
		.map((room) => ({
			room,
			reqs: filtered
				.filter((/** @type {any} */ r) => r.room === room)
				.sort((/** @type {any} */ a, /** @type {any} */ b) => a.from.localeCompare(b.from))
		}));

	$: bySlot = (() => {
		/** @type {Map<string, any>} */
		const m = new Map();
		for (const r of filtered) {
			const k = `${r.day}-${r.slot}`;
			if (!m.has(k)) m.set(k, { day: r.day, slot: r.slot, reqs: [] });
			m.get(k).reqs.push(r);
		}
		return [...m.values()].sort((a, b) => a.day - b.day || a.slot - b.slot);
	})();

	$: timeline = [...filtered].sort((/** @type {any} */ a, /** @type {any} */ b) =>
		a.from.localeCompare(b.from)
	);

	/** @type {Set<string>} */
	let busyKeys = new Set();
	/** @type {string | null} */
	let errorMsg = null;

	/**
	 * @param {'approve' | 'active'} kind
	 * @param {any} req
	 */
	async function toggle(kind, req) {
		const k = key(req);
		busyKeys = new Set(busyKeys).add(k);
		errorMsg = null;
		try {
			const url = kind === 'approve' ? '/api/setRoomRequestApproved' : '/api/setRoomRequestActive';
			const body =
				kind === 'approve'
					? { room: req.room, day: req.day, slot: req.slot, approved: !req.approved }
					: { room: req.room, day: req.day, slot: req.slot, active: !req.active };
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				errorMsg = result?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
			await invalidateAll();
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
		} finally {
			const s = new Set(busyKeys);
			s.delete(k);
			busyKeys = s;
		}
	}

	const VIEWS = [
		{ key: 'room', label: 'nach Raum' },
		{ key: 'slot', label: 'nach Slot' },
		{ key: 'time', label: 'zeitlich' }
	];
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Gebäudemanagement-Anforderungen</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.roomRequests.length}</span>
		<span class="text-sm text-base-content/60">
			{approvedCount} genehmigt · {pendingCount} offen
		</span>
		<div class="flex-1"></div>
		<div role="tablist" class="tabs tabs-boxed">
			{#each VIEWS as v}
				<button
					role="tab"
					class="tab {view === v.key ? 'tab-active' : ''}"
					on:click={() => (view = /** @type {any} */ (v.key))}
				>
					{v.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
		<label class="label cursor-pointer gap-2">
			<input type="checkbox" class="checkbox checkbox-sm" bind:checked={pendingOnly} />
			<span class="label-text">nur offene (nicht genehmigt)</span>
		</label>
		<span class="text-xs text-base-content/50">
			Nur Gebäudemanagement-Räume. „inaktiv" wird beim nächsten Vorbereiten der Räume-für-Slots
			ignoriert.
		</span>
	</div>

	{#if errorMsg}
		<div class="alert alert-error py-2 text-sm"><span>{errorMsg}</span></div>
	{/if}

	{#if !filtered.length}
		<div class="text-base-content/50">Keine Anforderungen.</div>
	{:else if view === 'time'}
		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-zebra table-sm">
				<thead>
					<tr>
						<th>Datum</th>
						<th>Zeit</th>
						<th>Raum</th>
						<th>Tag/Slot</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{#each timeline as r (key(r))}
						<tr class={r.active ? '' : 'opacity-50'}>
							<td>{fmtDate(r.from)}</td>
							<td class="tabular-nums">{fmtTime(r.from)}–{fmtTime(r.until)}</td>
							<td class="font-medium">{r.room}</td>
							<td class="text-base-content/60">Tag {r.day} · Slot {r.slot}</td>
							<td>
								<RoomRequestToggles
									req={r}
									busy={busyKeys.has(key(r))}
									on:approve={() => toggle('approve', r)}
									on:active={() => toggle('active', r)}
								/>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else if view === 'room'}
		<div class="flex flex-col gap-3">
			{#each byRoom as group (group.room)}
				<div class="rounded-lg border border-base-300 bg-base-100 p-3">
					<div class="mb-2 flex items-center gap-2">
						<span class="font-semibold">{group.room}</span>
						<span class="badge badge-ghost badge-sm tabular-nums">{group.reqs.length}</span>
					</div>
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<tbody>
								{#each group.reqs as r (key(r))}
									<tr class={r.active ? '' : 'opacity-50'}>
										<td class="whitespace-nowrap">{fmtDate(r.from)}</td>
										<td class="whitespace-nowrap tabular-nums">{fmtTime(r.from)}–{fmtTime(r.until)}</td
										>
										<td class="whitespace-nowrap text-base-content/60">Tag {r.day} · Slot {r.slot}</td>
										<td>
											<RoomRequestToggles
												req={r}
												busy={busyKeys.has(key(r))}
												on:approve={() => toggle('approve', r)}
												on:active={() => toggle('active', r)}
											/>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each bySlot as group (group.day + '-' + group.slot)}
				<div class="rounded-lg border border-base-300 bg-base-100 p-3">
					<div class="mb-2 flex items-center gap-2">
						<span class="font-semibold">Tag {group.day} · Slot {group.slot}</span>
						<span class="badge badge-ghost badge-sm tabular-nums">{group.reqs.length}</span>
						<span class="text-xs text-base-content/50">{fmtDate(group.reqs[0].from)}</span>
					</div>
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<tbody>
								{#each group.reqs as r (key(r))}
									<tr class={r.active ? '' : 'opacity-50'}>
										<td class="whitespace-nowrap font-medium">{r.room}</td>
										<td class="whitespace-nowrap tabular-nums">{fmtTime(r.from)}–{fmtTime(r.until)}</td
										>
										<td>
											<RoomRequestToggles
												req={r}
												busy={busyKeys.has(key(r))}
												on:approve={() => toggle('approve', r)}
												on:active={() => toggle('active', r)}
											/>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
