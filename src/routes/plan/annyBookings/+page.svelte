<script>
	import { invalidateAll } from '$app/navigation';
	import StreamAction from '$lib/zpa/StreamAction.svelte';
	import WriteButton from '$lib/WriteButton.svelte';

	export let data;
	$: bookings = data.bookings || [];
	$: slots = data.slots || [];
	$: roomOrder = data.roomOrder || [];
	$: annyRooms = data.annyRooms || [];

	/** @type {'list' | 'matrix'} */
	let view = 'list';

	// --- Liste: Filter ---
	let onlyMine = false;
	let roomFilter = 'all';
	let q = '';
	$: mineCount = bookings.filter((/** @type {any} */ b) => b.mine).length;
	$: roomsInBookings = [
		...new Set(bookings.map((/** @type {any} */ b) => b.room).filter(Boolean))
	].sort((/** @type {string} */ a, /** @type {string} */ b) => a.localeCompare(b));
	$: filtered = bookings.filter((/** @type {any} */ b) => {
		if (onlyMine && !b.mine) return false;
		if (roomFilter !== 'all' && b.room !== roomFilter) return false;
		if (q.trim()) {
			const t = q.trim().toLowerCase();
			const hay =
				`${b.personalizationName ?? ''} ${b.description ?? ''} ${b.room ?? ''} ${b.number ?? ''}`.toLowerCase();
			if (!hay.includes(t)) return false;
		}
		return true;
	});

	// --- Slot-Matrix: Filter ---
	let hideEmpty = true;
	/** @type {number[]} */
	let selectedDays = [];
	$: availableDays = [...new Set(slots.map((/** @type {any} */ s) => Number(s.day)))].sort(
		(/** @type {number} */ a, /** @type {number} */ b) => a - b
	);
	/** @param {number} d */
	const toggleDay = (d) =>
		(selectedDays = selectedDays.includes(d)
			? selectedDays.filter((x) => x !== d)
			: [...selectedDays, d]);
	$: filteredSlots = slots.filter((/** @type {any} */ s) => {
		if (selectedDays.length && !selectedDays.includes(Number(s.day))) return false;
		if (hideEmpty) return Number(s.coveredRooms || 0) > 0;
		return true;
	});

	// --- Namen pflegen (personalizationNames → wirkt auf mine) ---
	/** @type {string[]} */
	let names = [...(data.personalizationNames || [])];
	let newName = '';
	let savingNames = false;
	let namesError = '';
	$: namesDirty = JSON.stringify(names) !== JSON.stringify(data.personalizationNames || []);

	function addName() {
		const n = newName.trim();
		if (n && !names.includes(n)) names = [...names, n];
		newName = '';
	}
	/** @param {string} n */
	const rmName = (n) => (names = names.filter((x) => x !== n));

	async function saveNames() {
		if (savingNames) return;
		savingNames = true;
		namesError = '';
		try {
			const res = await fetch('/api/setAnnyPersonalizationNames', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ names })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				namesError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			await invalidateAll(); // mine wird beim Query neu berechnet
			names = [...(data.personalizationNames || [])];
		} catch (e) {
			namesError = e instanceof Error ? e.message : String(e);
		} finally {
			savingNames = false;
		}
	}

	/** @param {string | Date | null | undefined} date */
	function fmtDate(date) {
		if (!date) return '--';
		const raw = String(date);
		const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
		if (m) return `${m[3]}.${m[2]}.${m[1]}`;
		const d = new Date(raw);
		return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString('de-DE');
	}
	/** @param {string | Date | null | undefined} value */
	function fmtTime(value) {
		if (!value) return '--:--';
		const raw = String(value);
		const localIsoMatch = raw.match(/^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/);
		if (localIsoMatch) return localIsoMatch[1];
		const parsed = new Date(raw);
		if (Number.isNaN(parsed.getTime())) return '--:--';
		return parsed.toLocaleTimeString('de-DE', {
			timeZone: 'Europe/Berlin',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Anny-Buchungen</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{bookings.length}</span>
		{#if mineCount}
			<span class="badge badge-secondary badge-lg tabular-nums">{mineCount} meine</span>
		{/if}
	</div>

	<!-- Abrufen + Namen pflegen -->
	<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
		<StreamAction
			field="importAnnyBookings"
			title="Anny-Buchungen abrufen"
			description="Holt die aktuellen Buchungen aus Anny (Log-Stream) und lädt die Ansicht neu."
			accent="info"
			actionLabel="Abrufen"
			on:done={() => invalidateAll()}
		/>

		<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-3">
			<div class="flex items-center gap-2">
				<span class="font-medium">Eigene Namen</span>
				<span class="text-xs text-base-content/50">
					bestimmen, welche Buchungen als „meine" gelten
				</span>
			</div>
			<div class="flex flex-wrap items-center gap-1.5">
				{#each names as n}
					<span class="badge badge-neutral gap-1">
						{n}
						<button class="text-error" title="entfernen" on:click={() => rmName(n)}>✕</button>
					</span>
				{:else}
					<span class="text-sm text-base-content/40">— noch keine Namen</span>
				{/each}
			</div>
			<div class="flex items-center gap-2">
				<input
					class="input input-bordered input-sm flex-1"
					type="text"
					bind:value={newName}
					on:keydown={(e) => e.key === 'Enter' && addName()}
					placeholder="Name hinzufügen (z. B. Vorname Nachname)"
				/>
				<button class="btn btn-ghost btn-sm" disabled={!newName.trim()} on:click={addName}>
					＋
				</button>
				<WriteButton
					class="btn btn-primary btn-sm"
					disabled={savingNames || !namesDirty}
					on:click={saveNames}
				>
					{savingNames ? 'speichert …' : 'Speichern'}
				</WriteButton>
			</div>
			{#if namesError}
				<div class="alert alert-error py-1.5 text-xs"><span>{namesError}</span></div>
			{/if}
		</div>
	</div>

	<!-- Anny-Räume (requestWith: ANNY, auf der Räume-Seite gepflegt) -->
	<div class="flex flex-wrap items-center gap-2 text-sm">
		<span class="text-base-content/60">Anny-Räume:</span>
		{#each annyRooms as r}
			<span class="badge badge-outline badge-sm font-mono">{r}</span>
		{:else}
			<span class="text-base-content/40">— keine (auf der Räume-Seite via „Anforderung: Anny")</span>
		{/each}
		<a href="/rooms" class="link link-hover text-xs text-base-content/50">pflegen →</a>
	</div>

	<!-- Ansicht umschalten -->
	<div class="tabs tabs-boxed w-fit">
		<button class="tab {view === 'list' ? 'tab-active' : ''}" on:click={() => (view = 'list')}>
			Liste (wer wann was)
		</button>
		<button class="tab {view === 'matrix' ? 'tab-active' : ''}" on:click={() => (view = 'matrix')}>
			Slot-Matrix
		</button>
	</div>

	{#if view === 'list'}
		<!-- Filter -->
		<div
			class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3"
		>
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<input type="checkbox" class="toggle toggle-secondary toggle-sm" bind:checked={onlyMine} />
				<span>nur meine</span>
			</label>
			<select class="select select-bordered select-sm" bind:value={roomFilter}>
				<option value="all">alle Räume</option>
				{#each roomsInBookings as r}
					<option value={r}>{r}</option>
				{/each}
			</select>
			<input
				class="input input-bordered input-sm w-56"
				type="text"
				bind:value={q}
				placeholder="Suche (Name, Beschreibung, Raum, Nr.) …"
			/>
			<div class="flex-1"></div>
			<span class="text-sm text-base-content/50 tabular-nums">{filtered.length} angezeigt</span>
		</div>

		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th class="bg-base-200">Datum</th>
						<th class="bg-base-200">Zeit</th>
						<th class="bg-base-200">Raum</th>
						<th class="bg-base-200">Wer</th>
						<th class="bg-base-200">Beschreibung</th>
						<th class="bg-base-200">Status</th>
					</tr>
				</thead>
				<tbody>
					{#if filtered.length === 0}
						<tr>
							<td colspan="6" class="py-8 text-center text-sm text-base-content/50">
								Keine Buchungen gefunden
							</td>
						</tr>
					{:else}
						{#each filtered as b}
							<tr class="hover {b.mine ? 'bg-secondary/10' : ''}">
								<td class="tabular-nums whitespace-nowrap">{fmtDate(b.startDate)}</td>
								<td class="tabular-nums whitespace-nowrap">
									{fmtTime(b.startDate)}–{fmtTime(b.endDate)}
								</td>
								<td class="font-mono whitespace-nowrap">{b.room ?? '—'}</td>
								<td class="whitespace-nowrap">
									{b.personalizationName ?? '—'}
									{#if b.mine}<span class="badge badge-secondary badge-xs ml-1">meine</span>{/if}
								</td>
								<td class="max-w-[28rem] truncate" title={b.description}>{b.description || '—'}</td>
								<td>
									<span class="badge badge-ghost badge-sm">{b.status}</span>
									{#if b.isBlocker}<span class="badge badge-warning badge-sm ml-1">Blocker</span>{/if}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{:else}
		<!-- Slot-Matrix: T-Raum-Abdeckung je Prüfungsslot -->
		<div
			class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3"
		>
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<input type="checkbox" class="toggle toggle-primary toggle-sm" bind:checked={hideEmpty} />
				<span>nur Slots mit T-Raum-Abdeckung</span>
			</label>
			<div class="flex-1"></div>
			<div class="flex flex-wrap items-center gap-1">
				<span class="text-sm text-base-content/50">Tage:</span>
				{#each availableDays as day}
					<button
						class="badge gap-1 tabular-nums {selectedDays.includes(day)
							? 'badge-primary'
							: 'badge-ghost'}"
						on:click={() => toggleDay(day)}
					>
						{day}
					</button>
				{/each}
				{#if selectedDays.length}
					<button class="btn btn-ghost btn-xs" on:click={() => (selectedDays = [])}>alle</button>
				{/if}
			</div>
		</div>

		<div class="overflow-x-auto rounded-lg border border-base-300">
			<table class="table table-sm">
				<thead>
					<tr>
						<th class="bg-base-200 sticky left-0 z-10">Slot</th>
						{#each roomOrder as room}
							<th class="font-mono">{room}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#if filteredSlots.length === 0}
						<tr>
							<td colspan={roomOrder.length + 1} class="py-8 text-center text-sm text-base-content/50">
								Keine passenden Slots gefunden
							</td>
						</tr>
					{:else}
						{#each filteredSlots as slot}
							<tr class="hover">
								<td class="bg-base-100 sticky left-0 z-10 min-w-[170px] align-top">
									<div class="font-medium tabular-nums">{fmtDate(slot.date)} {slot.start || ''}</div>
									<div class="text-xs text-base-content/50">Tag/Slot {slot.day}/{slot.slot}</div>
									<div class="mt-1">
										<span
											class="badge badge-sm tabular-nums {Number(slot.coveredRooms) > 0
												? 'badge-success'
												: 'badge-ghost'}"
										>
											{slot.coveredRooms} T-Räume belegt
										</span>
									</div>
								</td>
								{#each roomOrder as room}
									<td class="min-w-[230px] align-top">
										{#if (slot.bookingsByRoom[room] || []).length === 0}
											<span class="text-base-content/20">—</span>
										{:else}
											<div class="flex flex-col gap-1.5">
												{#each slot.bookingsByRoom[room] || [] as b}
													<div class="rounded-lg border border-base-300 bg-base-200/40 p-2">
														<div class="text-sm font-medium tabular-nums">
															{fmtTime(b.startDate)} – {fmtTime(b.endDate)}
														</div>
														{#if b.description}
															<div class="mt-0.5 text-xs text-base-content/60">{b.description}</div>
														{/if}
													</div>
												{/each}
											</div>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>
