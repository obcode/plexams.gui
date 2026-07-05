<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import ConstraintsModal from '$lib/exam/ConstraintsModal.svelte';
	import WriteButton from '$lib/WriteButton.svelte';

	let { data } = $props();

	// Lokale, optimistisch patchbare Liste als writable $derived: folgt den
	// Load-Daten (Reset bei jedem neuen Load) und wird zwischendurch per
	// Reassignment — nie in-place — aktualisiert, damit das $derived reaktiv
	// bleibt. $derived füllt die Liste auch bei SSR (kein leeres Flackern).
	/** @type {any[]} */
	let items = $derived((data.items ?? []).map((/** @type {any} */ e) => ({ ...e })));
	// Status-Filter: beim Laden nur „zu planen"; gibt es „nicht zugeordnete",
	// zunächst nur die zeigen. Snapshot der Load-Daten (bewusst nicht reaktiv).
	/** @type {string | null} */
	// svelte-ignore state_referenced_locally
	let filterStatus = $state(
		(data.items ?? []).some((/** @type {any} */ e) => e.status === 'unknown') ? 'unknown' : 'toPlan'
	);

	/** Genau einen Eintrag (per ancode) optimistisch ersetzen — Reassignment statt
	 * In-place-Mutation, damit das writable $derived reaktiv bleibt.
	 * @param {number} ancode @param {(e:any)=>any} fn */
	function patchItem(ancode, fn) {
		items = items.map((/** @type {any} */ e) => (e.ancode === ancode ? fn(e) : e));
	}

	let byAncode = $derived(new Map(items.map((/** @type {any} */ e) => [e.ancode, e])));

	// Slot-Infos für den „vorgeplant"-Tooltip
	let dateByDay = $derived(new Map(data.days.map((/** @type {any} */ d) => [d.number, d.date])));
	let startBySlot = $derived(
		new Map(data.starttimes.map((/** @type {any} */ s) => [s.number, s.start]))
	);
	/** @param {string} iso → „13.07." */
	const ddmm = (iso) => {
		const [, m, d] = (iso ?? '').slice(0, 10).split('-');
		return m ? `${d}.${m}.` : '';
	};
	/** @param {any} e → „13.07. 08:30" (leer, wenn kein Slot bekannt) */
	function slotLabel(e) {
		if (!e.slot) return '';
		const st = (startBySlot.get(e.slot.slotNumber) ?? '').slice(0, 5);
		return `${ddmm(dateByDay.get(e.slot.dayNumber))} ${st}`.trim();
	}
	/** @param {any} e */
	function slotTip(e) {
		if (e.slot) {
			const st = (startBySlot.get(e.slot.slotNumber) ?? '').slice(0, 5);
			return `schon (vor)geplant: ${ddmm(dateByDay.get(e.slot.dayNumber))} ${st} (${e.slot.dayNumber}/${e.slot.slotNumber})`;
		}
		return 'schon (vor)geplant (Vorplanung, noch ohne Slot)';
	}

	let examTypes = $derived(
		[...new Set(items.map((/** @type {any} */ e) => e.examTypeFull).filter(Boolean))].sort(
			(/** @type {string} */ a, /** @type {string} */ b) => a.localeCompare(b)
		)
	);
	let examType = $state('');

	/** @type {Set<number>} */
	let busy = $state(new Set());
	let actionError = $state('');

	let counts = $derived({
		total: items.length,
		toPlan: items.filter((/** @type {any} */ e) => e.status === 'toPlan').length,
		notToPlan: items.filter((/** @type {any} */ e) => e.status === 'notToPlan').length,
		unknown: items.filter((/** @type {any} */ e) => e.status === 'unknown').length,
		// „zu planen", aber nicht von mir geplant
		notMe: items.filter(
			(/** @type {any} */ e) => e.status === 'toPlan' && e.constraints?.notPlannedByMe
		).length
	});
	let toPlanByMe = $derived(counts.toPlan - counts.notMe);

	// --- Constraints-Helfer ---
	/** @param {any} rc */
	const roomSet = (rc) =>
		!!rc &&
		(rc.exahm ||
			rc.seb ||
			rc.lab ||
			rc.placesWithSocket ||
			(rc.allowedRooms ?? []).length ||
			rc.maxStudents ||
			rc.additionalSeats ||
			rc.comments ||
			rc.kdpJiraURL);
	/** @param {any} c */
	const hasConstraints = (c) =>
		!!c &&
		(c.notPlannedByMe ||
			c.doNotPublish ||
			c.online ||
			(c.excludeDays ?? []).length ||
			(c.possibleDays ?? []).length ||
			(c.sameSlot ?? []).length ||
			roomSet(c.roomConstraints));
	// andere Constraints außer notPlannedByMe (das schließt alle anderen aus)
	/** @param {any} c */
	const hasOtherConstraints = (c) =>
		!!c &&
		(c.doNotPublish ||
			c.online ||
			(c.excludeDays ?? []).length ||
			(c.possibleDays ?? []).length ||
			(c.sameSlot ?? []).length ||
			roomSet(c.roomConstraints));
	const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	/** @param {string} iso → „Mo, 06.07." */
	const day = (iso) => {
		const p = (iso ?? '').slice(0, 10);
		const [y, m, d] = p.split('-').map(Number);
		if (!y) return p;
		const dt = new Date(Date.UTC(y, m - 1, d));
		return `${WD[dt.getUTCDay()]}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.`;
	};

	// „Dauer 0": zu planen, nicht notPlannedByMe, keine Dauer (auch kein Override)
	/** @param {any} e */
	const isDurZero = (e) =>
		e.status === 'toPlan' &&
		!e.constraints?.notPlannedByMe &&
		!(e.duration > 0) &&
		!(e.durationOverride > 0);

	// Dauer-Override setzen/entfernen (nur bei ZPA-Dauer 0). Aktualisiert lokal.
	/** @type {Record<number, number|string>} */
	let durInput = $state({});
	/** @param {any} e */
	async function setDur(e) {
		const v = Number(durInput[e.ancode]);
		if (!v || busy.has(e.ancode)) return;
		busy = new Set(busy).add(e.ancode);
		actionError = '';
		try {
			const res = await fetch('/api/exam/setExamDuration', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ancode: e.ancode, duration: v })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				actionError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			patchItem(e.ancode, (it) => ({ ...it, durationOverride: v }));
			durInput[e.ancode] = '';
		} catch (err) {
			actionError = err instanceof Error ? err.message : String(err);
		} finally {
			const s = new Set(busy);
			s.delete(e.ancode);
			busy = s;
		}
	}
	/** @param {any} e */
	async function rmDur(e) {
		if (busy.has(e.ancode)) return;
		busy = new Set(busy).add(e.ancode);
		actionError = '';
		try {
			const res = await fetch('/api/exam/removeExamDuration', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ancode: e.ancode })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				actionError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			patchItem(e.ancode, (it) => ({ ...it, durationOverride: null }));
		} catch (err) {
			actionError = err instanceof Error ? err.message : String(err);
		} finally {
			const s = new Set(busy);
			s.delete(e.ancode);
			busy = s;
		}
	}
	let durZeroCount = $derived(items.filter(isDurZero).length);

	// --- Filter ---
	// (filterStatus ist oben deklariert und aus den Load-Daten initialisiert)
	let cFilter = $state('alle');
	let durZero = $state(false);
	let nonFK07 = $state(false);
	let q = $state('');

	// Prüfende außerhalb der FK07 (bekannte, abweichende Fakultät).
	/** @param {any} e */
	const isNonFK07 = (e) => !!e.examerFk && e.examerFk !== 'FK07';
	let nonFK07Count = $derived(items.filter(isNonFK07).length);

	// „Dauer 0" blendet den Status-Filter aus; beim Ausschalten wieder herstellen
	/** @type {string | null} */
	let prevFilterStatus = 'toPlan';
	function toggleDurZero() {
		durZero = !durZero;
		if (durZero) {
			prevFilterStatus = filterStatus;
			filterStatus = null;
		} else {
			filterStatus = prevFilterStatus;
		}
	}
	const setStatusFilter = (/** @type {string} */ s) =>
		(filterStatus = filterStatus === s ? null : s);

	/** @param {any} e */
	function passesConstraint(e) {
		const c = e.constraints;
		const rc = c?.roomConstraints;
		switch (cFilter) {
			case 'mit':
				return hasConstraints(c) && !c.notPlannedByMe;
			case 'ohne':
				return !hasConstraints(c);
			case 'exahm':
				return !!rc?.exahm;
			case 'seb':
				return !!rc?.seb;
			case 'exahmseb':
				return !!rc?.exahm || !!rc?.seb;
			case 'lab':
				return !!rc?.lab;
			case 'socket':
				return !!rc?.placesWithSocket;
			case 'notme':
				return !!c?.notPlannedByMe;
			default:
				return true;
		}
	}

	let filtered = $derived(
		items.filter((/** @type {any} */ e) => {
			if (filterStatus && e.status !== filterStatus) return false;
			if (durZero && !isDurZero(e)) return false;
			if (nonFK07 && !isNonFK07(e)) return false;
			if (cFilter !== 'alle' && !passesConstraint(e)) return false;
			if (examType && e.examTypeFull !== examType) return false;
			if (q.trim()) {
				const n = q.trim().toLowerCase();
				const hay =
					`${e.ancode} ${e.module} ${e.mainExamer} ${e.examTypeFull} ` + (e.groups ?? []).join(' ');
				if (!hay.toLowerCase().includes(n)) return false;
			}
			return true;
		})
	);

	// „nicht von mir geplant"-Prüfungen ans Ende schieben (bleiben in „zu planen").
	let displayed = $derived(
		[...filtered].sort(
			(/** @type {any} */ a, /** @type {any} */ b) =>
				Number(!!a.constraints?.notPlannedByMe) - Number(!!b.constraints?.notPlannedByMe)
		)
	);

	/** Toggle „nicht von mir geplant" — schließt andere Constraints aus. @param {any} e */
	async function toggleNotMe(e) {
		if (busy.has(e.ancode)) return;
		const want = !e.constraints?.notPlannedByMe;
		if (
			want &&
			hasOtherConstraints(e.constraints) &&
			!confirm(
				'„nicht von mir geplant" setzen? Andere Constraints dieser Prüfung werden dabei entfernt.'
			)
		)
			return;
		const prev = e.constraints;
		// notPlannedByMe darf keine anderen Constraints haben → vollständig ersetzen.
		// location bleibt aber erhalten (gilt auch für notPlannedByMe-Prüfungen).
		const loc = e.constraints?.location || null;
		const fk = e.constraints?.notPlannedByMeInFK || null;
		const next = want
			? { notPlannedByMe: true, location: loc, notPlannedByMeInFK: fk }
			: loc
				? { notPlannedByMe: false, location: loc }
				: null;
		patchItem(e.ancode, (it) => ({ ...it, constraints: next }));
		busy = new Set(busy).add(e.ancode);
		actionError = '';
		try {
			const res = await fetch('/api/exam/addConstraints', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					ancode: e.ancode,
					constraints: want
						? { notPlannedByMe: true, location: loc, notPlannedByMeInFK: fk }
						: { notPlannedByMe: false, location: loc }
				})
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				patchItem(e.ancode, (it) => ({ ...it, constraints: prev }));
				actionError = d?.error || `Fehler (HTTP ${res.status})`;
			}
		} catch (err) {
			patchItem(e.ancode, (it) => ({ ...it, constraints: prev }));
			actionError = err instanceof Error ? err.message : String(err);
		} finally {
			const s = new Set(busy);
			s.delete(e.ancode);
			busy = s;
		}
	}

	/** notPlannedByMe-Constraints (Ort + planende FK) inline speichern; das jeweils
	 * andere Feld bleibt erhalten. Constraints sind bei notPlannedByMe simpel.
	 * @param {any} e @param {{location?: string|null, fk?: string|null}} patch */
	async function saveNotMe(e, patch) {
		if (busy.has(e.ancode)) return;
		const prev = e.constraints;
		const doNotPublish = !!e.constraints?.doNotPublish;
		const loc = ('location' in patch ? patch.location : e.constraints?.location) || null;
		const fk = ('fk' in patch ? patch.fk : e.constraints?.notPlannedByMeInFK) || null;
		const next = { notPlannedByMe: true, doNotPublish, location: loc, notPlannedByMeInFK: fk };
		patchItem(e.ancode, (it) => ({ ...it, constraints: next }));
		busy = new Set(busy).add(e.ancode);
		actionError = '';
		try {
			const res = await fetch('/api/exam/addConstraints', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ancode: e.ancode, constraints: next })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				patchItem(e.ancode, (it) => ({ ...it, constraints: prev }));
				actionError = d?.error || `Fehler (HTTP ${res.status})`;
			}
		} catch (err) {
			patchItem(e.ancode, (it) => ({ ...it, constraints: prev }));
			actionError = err instanceof Error ? err.message : String(err);
		} finally {
			const s = new Set(busy);
			s.delete(e.ancode);
			busy = s;
		}
	}

	/** @param {any} item @param {'toPlan'|'notToPlan'} target */
	async function setStatus(item, target) {
		if (item.status === target || busy.has(item.ancode)) return;
		const prev = item.status;
		patchItem(item.ancode, (it) => ({ ...it, status: target }));
		busy = new Set(busy).add(item.ancode);
		actionError = '';
		try {
			const path = target === 'toPlan' ? 'addToPlan' : 'rmFromPlan';
			const res = await fetch(`/api/zpaexams/${path}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ancode: item.ancode })
			});
			if (!res.ok) throw new Error(`Fehler (HTTP ${res.status})`);
		} catch (e) {
			patchItem(item.ancode, (it) => ({ ...it, status: prev }));
			actionError = e instanceof Error ? e.message : String(e);
		} finally {
			const s = new Set(busy);
			s.delete(item.ancode);
			busy = s;
		}
	}

	// --- Constraints-Editor (Modal) ---
	/** @type {any} */
	let editExam = $state(null);
	/** @param {any} e */
	const openEdit = (e) => (editExam = e);
	/** @param {any} nc das gespeicherte Constraint-Objekt */
	function onSaved(nc) {
		const it = byAncode.get(nc.ancode);
		// sameSlot ist symmetrisch: setzt/entfernt man den Bezug an einer Prüfung,
		// ändert das Backend auch die Partner. Diese hier lokal mitziehen, sonst
		// zeigen sie den neuen/entfernten sameSlot erst nach einem Voll-Reload.
		// Alles in einem Reassignment (Kopien der betroffenen Einträge).
		const oldSame = new Set((it?.constraints?.sameSlot ?? []).map(Number));
		const newSame = new Set((nc.sameSlot ?? []).map(Number));
		items = items.map((/** @type {any} */ e) => {
			if (e.ancode === nc.ancode) return { ...e, constraints: nc };
			if (newSame.has(e.ancode) && !oldSame.has(e.ancode)) return withSameSlotPartner(e, nc.ancode);
			if (oldSame.has(e.ancode) && !newSame.has(e.ancode))
				return withoutSameSlotPartner(e, nc.ancode);
			return e;
		});
		editExam = null;
	}

	/** Kopie von `e` mit `ancode` in constraints.sameSlot ergänzt.
	 * @param {any} e @param {number} ancode */
	function withSameSlotPartner(e, ancode) {
		const c = e.constraints ?? { ancode: e.ancode, sameSlot: [] };
		const same = c.sameSlot ?? [];
		if (same.map(Number).includes(ancode)) return e;
		return { ...e, constraints: { ...c, sameSlot: [...same, ancode] } };
	}

	/** Kopie von `e` mit `ancode` aus constraints.sameSlot entfernt.
	 * @param {any} e @param {number} ancode */
	function withoutSameSlotPartner(e, ancode) {
		const c = e.constraints;
		if (!c?.sameSlot) return e;
		return {
			...e,
			constraints: {
				...c,
				sameSlot: c.sameSlot.filter((/** @type {number} */ x) => Number(x) !== ancode)
			}
		};
	}

	onMount(() => {
		const a = Number(page.url.searchParams.get('ancode'));
		if (a) {
			const it = items.find((/** @type {any} */ e) => e.ancode === a);
			if (it) {
				filterStatus = null;
				editExam = it;
			}
		}
	});
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">ZPA-Prüfungen planen</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{filtered.length} / {counts.total}</span
		>
	</div>

	<!-- Banner: nicht zugeordnete Prüfungen -->
	{#if counts.unknown > 0}
		<div class="alert alert-warning">
			<span>
				<strong>{counts.unknown}</strong> Prüfung{counts.unknown === 1 ? '' : 'en'} noch
				<strong>nicht zugeordnet</strong> — bitte entscheiden: planen oder nicht planen.
			</span>
			<button class="btn btn-sm" onclick={() => (filterStatus = 'unknown')}>anzeigen</button>
		</div>
	{/if}

	{#if actionError}
		<div class="alert alert-error py-2 text-sm"><span>{actionError}</span></div>
	{/if}

	<!-- Filter -->
	<div class="flex flex-wrap items-center gap-2 rounded-lg border border-base-300 bg-base-100 p-3">
		<div class="flex flex-wrap items-center gap-1.5">
			<button
				class="badge badge-success gap-1 tabular-nums {filterStatus && filterStatus !== 'toPlan'
					? 'opacity-40'
					: ''}"
				title={counts.notMe
					? `${toPlanByMe} von mir, ${counts.notMe} nicht von mir geplant`
					: 'zu planen'}
				onclick={() => setStatusFilter('toPlan')}
			>
				✓ {toPlanByMe}{counts.notMe ? ` +${counts.notMe}` : ''} zu planen
			</button>
			<button
				class="badge badge-ghost gap-1 tabular-nums {filterStatus && filterStatus !== 'notToPlan'
					? 'opacity-40'
					: ''}"
				onclick={() => setStatusFilter('notToPlan')}
			>
				✕ {counts.notToPlan} nicht planen
			</button>
			<button
				class="badge badge-warning gap-1 tabular-nums {filterStatus && filterStatus !== 'unknown'
					? 'opacity-40'
					: ''}"
				onclick={() => setStatusFilter('unknown')}
			>
				? {counts.unknown} nicht zugeordnet
			</button>
			<button
				class="badge badge-error gap-1 tabular-nums {durZero ? '' : 'badge-outline'}"
				title="zu planen, nicht „nicht von mir geplant“, ohne hinterlegte Dauer"
				onclick={toggleDurZero}
			>
				⏱ {durZeroCount} Dauer 0
			</button>
			<button
				class="badge badge-neutral gap-1 tabular-nums {nonFK07 ? '' : 'badge-outline'}"
				title="Prüfende außerhalb der FK07"
				onclick={() => (nonFK07 = !nonFK07)}
			>
				🏛 {nonFK07Count} nicht FK07
			</button>
		</div>
		<div class="flex-1"></div>
		<label class="flex items-center gap-1 text-sm">
			<span class="text-base-content/50">Art</span>
			<select class="select select-bordered select-sm" bind:value={examType}>
				<option value="">alle</option>
				{#each examTypes as t}
					<option value={t}>{t}</option>
				{/each}
			</select>
		</label>
		<label class="flex items-center gap-1 text-sm">
			<span class="text-base-content/50">Constraints</span>
			<select class="select select-bordered select-sm" bind:value={cFilter}>
				<option value="alle">alle</option>
				<option value="mit">mit Constraints</option>
				<option value="ohne">ohne Constraints</option>
				<option value="exahm">EXaHM</option>
				<option value="seb">SEB</option>
				<option value="exahmseb">EXaHM oder SEB</option>
				<option value="lab">Labor</option>
				<option value="socket">Steckdosen</option>
				<option value="notme">nicht von mir geplant</option>
			</select>
		</label>
		<input
			class="input input-bordered input-sm w-56"
			type="text"
			bind:value={q}
			placeholder="Ancode, Modul, Prüfender, Gruppe …"
		/>
	</div>

	<!-- Liste -->
	<div class="flex flex-col gap-1.5">
		{#each displayed as e (e.ancode)}
			<div
				class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-l-4 border-base-200 p-3 {e.status ===
				'unknown'
					? 'border-l-warning bg-warning/5'
					: e.status === 'toPlan'
						? 'border-l-success/40'
						: 'border-l-base-300 opacity-60'} {e.status === 'toPlan' &&
				e.constraints?.notPlannedByMe
					? 'opacity-50'
					: ''}"
			>
				<!-- Status -->
				<div class="flex w-40 shrink-0 items-center gap-2">
					{#if e.status === 'unknown'}
						<WriteButton
							class="btn btn-success btn-xs"
							disabled={busy.has(e.ancode)}
							onclick={() => setStatus(e, 'toPlan')}>planen</WriteButton
						>
						<WriteButton
							class="btn btn-error btn-xs"
							disabled={busy.has(e.ancode)}
							onclick={() => setStatus(e, 'notToPlan')}>nicht</WriteButton
						>
					{:else}
						<input
							type="checkbox"
							class="toggle toggle-success toggle-sm"
							checked={e.status === 'toPlan'}
							disabled={busy.has(e.ancode)}
							onchange={(ev) => setStatus(e, ev.currentTarget.checked ? 'toPlan' : 'notToPlan')}
						/>
						<span class="text-xs text-base-content/60">
							{e.status === 'toPlan' ? 'zu planen' : 'nicht planen'}
						</span>
					{/if}
				</div>

				<!-- Prüfung -->
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-baseline gap-x-2">
						<span class="font-mono text-lg font-semibold tabular-nums">{e.ancode}</span>
						<span class="font-medium">{e.module}</span>
						{#if e.isRepeaterExam}<span title="Wiederholungsprüfung">🔁</span>{/if}
						{#if e.preplanned}
							<span class="badge badge-ghost badge-sm tabular-nums" title={slotTip(e)}>
								📌{slotLabel(e) ? ` ${slotLabel(e)}` : ''}
							</span>
						{/if}
					</div>
					<div class="flex flex-wrap items-center gap-x-1 text-sm text-base-content/70">
						<span>{e.mainExamer}</span>
						{#if isNonFK07(e)}<span
								class="badge badge-neutral badge-xs"
								title="Prüfende außerhalb der FK07">{e.examerFk}</span
							>{/if}
						<span class="text-base-content/50">· {e.examTypeFull} ·</span>
						{#if e.duration > 0}
							<span class="tabular-nums text-base-content/50">{e.duration} min</span>
						{:else if e.durationOverride > 0}
							<span
								class="badge badge-success badge-sm tabular-nums"
								title="manuell gesetzte Dauer"
							>
								{e.durationOverride} min
							</span>
							<WriteButton
								class="btn btn-ghost btn-xs"
								disabled={busy.has(e.ancode)}
								title="Dauer-Override entfernen"
								onclick={() => rmDur(e)}>✕</WriteButton
							>
						{:else}
							<span class="badge badge-error badge-sm" title="keine Dauer hinterlegt">Dauer 0</span>
							<input
								type="number"
								class="input input-bordered input-xs w-16 tabular-nums"
								placeholder="min"
								bind:value={durInput[e.ancode]}
								disabled={busy.has(e.ancode)}
							/>
							<WriteButton
								class="btn btn-ghost btn-xs"
								disabled={busy.has(e.ancode) || !durInput[e.ancode]}
								onclick={() => setDur(e)}>setzen</WriteButton
							>
						{/if}
					</div>
					<div class="mt-1 flex flex-wrap items-center gap-1">
						{#each e.groups ?? [] as g}
							<span class="badge badge-ghost badge-xs">{g}</span>
						{/each}
					</div>
				</div>

				<!-- Constraints kompakt (nur bei „zu planen") -->
				{#if e.status === 'toPlan'}
					{@const c = e.constraints}
					<div class="flex w-72 shrink-0 flex-wrap items-center gap-1 self-stretch text-xs">
						<!-- Toggle „nicht von mir geplant" (schließt andere Constraints aus) -->
						<label
							class="flex cursor-pointer items-center gap-1"
							title="„nicht von mir geplant“ — wird geplant, aber von jemand anderem; schließt andere Constraints aus"
						>
							<input
								type="checkbox"
								class="toggle toggle-neutral toggle-xs"
								checked={!!c?.notPlannedByMe}
								disabled={busy.has(e.ancode)}
								onchange={() => toggleNotMe(e)}
							/>
							<span class="text-base-content/60">nicht von mir</span>
						</label>
						{#if c?.notPlannedByMe}
							<span class="badge badge-neutral badge-sm">geplant von anderen</span>
							<!-- planende FK inline (z. B. „FK10“) -->
							<input
								type="text"
								class="input input-bordered input-xs w-16"
								placeholder="FK…"
								title="planende Fakultät (z. B. „FK10“)"
								value={c?.notPlannedByMeInFK ?? ''}
								disabled={busy.has(e.ancode)}
								onchange={(ev) => saveNotMe(e, { fk: ev.currentTarget.value.trim() })}
							/>
							<!-- Ort inline (ohne Modal), da für notPlannedByMe interessant -->
							<select
								class="select select-bordered select-xs"
								title="Ort/Campus (wirkt im Terminplan)"
								value={c?.location ?? ''}
								disabled={busy.has(e.ancode)}
								onchange={(ev) => saveNotMe(e, { location: ev.currentTarget.value })}
							>
								<option value="">Lothstraße</option>
								<option value="Campus Pasing">Campus Pasing</option>
							</select>
						{:else}
							{#if c?.location}
								<span class="badge badge-sm" title="Ort/Campus">📍 {c.location}</span>
							{/if}
							{#if c?.doNotPublish}
								<span
									class="badge badge-error badge-outline badge-sm"
									title="nicht ins ZPA hochladen">nicht veröffentlichen</span
								>
							{/if}
							{#if c?.online}<span class="badge badge-info badge-sm">Online</span>{/if}
							{#if c?.roomConstraints?.exahm}<span class="badge badge-error badge-sm">EXaHM</span
								>{/if}
							{#if c?.roomConstraints?.seb}<span class="badge badge-warning badge-sm">SEB</span
								>{/if}
							{#if c?.roomConstraints?.lab}<span class="badge badge-neutral badge-sm">Labor</span
								>{/if}
							{#if c?.roomConstraints?.placesWithSocket}<span class="badge badge-sm"
									>Steckdosen</span
								>{/if}
							{#if c?.roomConstraints?.kdpJiraURL}<a
									class="badge badge-info badge-outline badge-sm"
									href={c.roomConstraints.kdpJiraURL}
									target="_blank"
									rel="noopener"
									title={c.roomConstraints.kdpJiraURL}>Jira ↗</a
								>{/if}
							{#if (c?.excludeDays ?? []).length}<span class="badge badge-ghost badge-sm"
									>🚫 {c.excludeDays.map(day).join(', ')}</span
								>{/if}
							{#if (c?.possibleDays ?? []).length}<span class="badge badge-ghost badge-sm"
									>nur {c.possibleDays.map(day).join(', ')}</span
								>{/if}
							{#each c?.sameSlot ?? [] as a}
								<button
									class="badge badge-outline badge-sm tabular-nums hover:badge-primary"
									title={byAncode.get(a)
										? `gleicher Slot wie ${a} — ${byAncode.get(a).module} (${
												byAncode.get(a).mainExamer
											})`
										: `gleicher Slot wie ${a}`}
									onclick={() => byAncode.get(a) && openEdit(byAncode.get(a))}
								>
									↔ {a}
								</button>
							{/each}
							{#if c?.roomConstraints?.maxStudents}<span class="badge badge-ghost badge-sm"
									>max {c.roomConstraints.maxStudents}</span
								>{/if}
							{#if c?.roomConstraints?.additionalSeats}<span
									class="badge badge-ghost badge-sm"
									title="Platz-Puffer">+{c.roomConstraints.additionalSeats} Plätze</span
								>{/if}
							{#if !hasConstraints(c)}<span class="text-base-content/30">keine</span>{/if}
							<button class="btn btn-ghost btn-xs ml-auto" onclick={() => openEdit(e)}>✎</button>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div class="p-6 text-center text-sm text-base-content/50">
				Keine Prüfungen entsprechen dem Filter.
			</div>
		{/each}
	</div>
</div>

{#if editExam}
	<ConstraintsModal
		exam={editExam}
		days={data.days}
		rooms={data.rooms}
		allExams={items}
		onsaved={onSaved}
		onclose={() => (editExam = null)}
	/>
{/if}
