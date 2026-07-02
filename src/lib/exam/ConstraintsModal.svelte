<script>
	// Constraints-Editor als Popup. Ersetzt die alte Seite /exam/constraints/<ancode>.
	import { createEventDispatcher } from 'svelte';
	import WriteButton from '$lib/WriteButton.svelte';

	/** @type {any} */
	export let exam;
	/** @type {{number:number, date:string}[]} */
	export let days = [];
	/** @type {string[]} */
	export let rooms = [];
	/** @type {any[]} verfügbare Prüfungen (für „gleicher Slot wie") */
	export let allExams = [];

	const dispatch = createEventDispatcher();

	const c = exam.constraints ?? {};
	const rc = c.roomConstraints ?? {};

	/** @param {string} iso */
	const dayPart = (iso) => (iso ?? '').slice(0, 10);
	/** @param {string} iso → „06.07." */
	const ddmm = (iso) => {
		const [, m, d] = dayPart(iso).split('-');
		return m ? `${d}.${m}.` : dayPart(iso);
	};

	// Tage in ein Wochenraster (Spalten Mo…Fr) gruppieren.
	// @ts-ignore Date.UTC ist hier (Browser) erlaubt
	/** @param {string} iso → 0=Mo … 4=Fr (null bei Wochenende) */
	const col = (iso) => {
		const [y, m, d] = dayPart(iso).split('-').map(Number);
		const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=So…6=Sa
		return dow >= 1 && dow <= 5 ? dow - 1 : null;
	};
	/** @type {({number:number, date:string}|null)[][]} */
	let weeks = [];
	{
		/** @type {any} */
		let cur = null;
		let prev = 99;
		for (const d of days) {
			const cc = col(d.date);
			if (cc == null) continue;
			if (!cur || cc <= prev) {
				cur = [null, null, null, null, null];
				weeks.push(cur);
			}
			cur[cc] = d;
			prev = cc;
		}
	}

	// Formularzustand
	let form = {
		notPlannedByMe: !!c.notPlannedByMe,
		doNotPublish: !!c.doNotPublish,
		online: !!c.online,
		exahm: !!rc.exahm,
		seb: !!rc.seb,
		lab: !!rc.lab,
		placesWithSocket: !!rc.placesWithSocket,
		maxStudents: rc.maxStudents ?? 0,
		additionalSeats: rc.additionalSeats ?? 0,
		comments: rc.comments ?? '',
		kdpJiraURL: rc.kdpJiraURL ?? '',
		/** @type {Set<string>} ausgewählte Sperrtage (date-part) */
		excludeDays: new Set((c.excludeDays ?? []).map(dayPart)),
		/** @type {string[]} */
		allowedRooms: [...(rc.allowedRooms ?? [])],
		/** @type {number[]} */
		sameSlot: [...(c.sameSlot ?? [])]
	};

	let saving = false;
	let error = '';
	/** @type {number | string} */
	let addSlotAncode = '';

	/** @param {string} d */
	function toggleDay(d) {
		const s = new Set(form.excludeDays);
		s.has(d) ? s.delete(d) : s.add(d);
		form.excludeDays = s;
	}
	/** @param {string} name */
	function toggleRoom(name) {
		form.allowedRooms = form.allowedRooms.includes(name)
			? form.allowedRooms.filter((r) => r !== name)
			: [...form.allowedRooms, name];
	}
	function addSameSlot() {
		const a = Number(addSlotAncode);
		if (a && !form.sameSlot.includes(a)) form.sameSlot = [...form.sameSlot, a];
		addSlotAncode = '';
	}
	/** @param {number} a */
	const rmSameSlot = (a) => (form.sameSlot = form.sameSlot.filter((x) => x !== a));
	/** @param {number} a */
	const moduleOf = (a) => allExams.find((e) => e.ancode === a)?.module ?? '';

	async function save() {
		if (saving) return;
		saving = true;
		error = '';
		// Sperrtage als ISO-Werte (die vom Server stammenden day.date)
		const dateByPart = Object.fromEntries(days.map((d) => [dayPart(d.date), d.date]));
		const excludeDays = [...form.excludeDays].map((d) => dateByPart[d]).filter(Boolean);

		const constraints = form.notPlannedByMe
			? { notPlannedByMe: true, doNotPublish: form.doNotPublish }
			: {
					notPlannedByMe: false,
					doNotPublish: form.doNotPublish,
					online: form.online,
					exahm: form.exahm,
					seb: form.seb,
					lab: form.lab,
					placesWithSocket: form.placesWithSocket,
					allowedRooms: form.allowedRooms,
					excludeDays,
					possibleDays: c.possibleDays ?? [],
					sameSlot: form.sameSlot,
					maxStudents: Number(form.maxStudents) || null,
					additionalSeats: Number(form.additionalSeats) || null,
					kdpJiraURL: form.kdpJiraURL.trim() || null,
					comments: form.comments.trim() || null
				};

		try {
			const res = await fetch('/api/addConstraints', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ancode: exam.ancode, constraints })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				error = result?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			// lokal aufbereitetes Constraint-Objekt zurückgeben (kein Reload)
			dispatch('saved', {
				ancode: exam.ancode,
				notPlannedByMe: form.notPlannedByMe,
				doNotPublish: form.doNotPublish,
				online: form.notPlannedByMe ? false : form.online,
				excludeDays: form.notPlannedByMe ? [] : excludeDays,
				possibleDays: form.notPlannedByMe ? [] : (c.possibleDays ?? []),
				sameSlot: form.notPlannedByMe ? [] : form.sameSlot,
				roomConstraints: form.notPlannedByMe
					? null
					: {
							allowedRooms: form.allowedRooms,
							placesWithSocket: form.placesWithSocket,
							lab: form.lab,
							exahm: form.exahm,
							seb: form.seb,
							kdpJiraURL: form.kdpJiraURL.trim() || null,
							maxStudents: Number(form.maxStudents) || null,
							additionalSeats: Number(form.additionalSeats) || null,
							comments: form.comments.trim() || null
						}
			});
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}
</script>

<div class="modal modal-open">
	<div class="modal-box max-w-2xl">
		<h2 class="text-lg font-semibold">
			Constraints — {exam.ancode}. {exam.module}
		</h2>
		<p class="text-sm text-base-content/50">{exam.mainExamer}</p>

		<label class="mt-3 flex cursor-pointer items-center gap-2">
			<input type="checkbox" class="checkbox checkbox-sm" bind:checked={form.notPlannedByMe} />
			<span class="font-medium">nicht von mir geplant</span>
			<span class="text-xs text-base-content/50">(dann sind keine weiteren Constraints nötig)</span>
		</label>

		<label class="mt-1 flex cursor-pointer items-center gap-2">
			<input type="checkbox" class="checkbox checkbox-sm" bind:checked={form.doNotPublish} />
			<span class="font-medium">nicht veröffentlichen</span>
			<span class="text-xs text-base-content/50">(Prüfung nicht ins ZPA hochladen)</span>
		</label>

		<fieldset
			class="mt-3 flex flex-col gap-4 transition-opacity"
			class:pointer-events-none={form.notPlannedByMe}
			class:opacity-40={form.notPlannedByMe}
			disabled={form.notPlannedByMe}
		>
			<!-- Raum / Art -->
			<div class="flex flex-wrap gap-x-5 gap-y-2">
				<label class="flex cursor-pointer items-center gap-2 text-sm">
					<input type="checkbox" class="checkbox checkbox-sm" bind:checked={form.online} /> Online
				</label>
				<label class="flex cursor-pointer items-center gap-2 text-sm">
					<input type="checkbox" class="checkbox checkbox-sm" bind:checked={form.exahm} /> EXaHM
				</label>
				<label class="flex cursor-pointer items-center gap-2 text-sm">
					<input type="checkbox" class="checkbox checkbox-sm" bind:checked={form.seb} /> SEB
				</label>
				<label class="flex cursor-pointer items-center gap-2 text-sm">
					<input type="checkbox" class="checkbox checkbox-sm" bind:checked={form.lab} /> Labor
				</label>
				<label class="flex cursor-pointer items-center gap-2 text-sm">
					<input
						type="checkbox"
						class="checkbox checkbox-sm"
						bind:checked={form.placesWithSocket}
					/>
					Steckdosen
				</label>
			</div>

			<div class="flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">max. Studierende</span>
					<input
						type="number"
						class="input input-bordered input-sm w-28"
						bind:value={form.maxStudents}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Platz-Puffer</span>
					<input
						type="number"
						class="input input-bordered input-sm w-28"
						bind:value={form.additionalSeats}
						title="zusätzliche Plätze (additionalSeats)"
					/>
				</label>
				<label class="flex flex-1 flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">KDP-Jira-URL</span>
					<input type="text" class="input input-bordered input-sm" bind:value={form.kdpJiraURL} />
				</label>
			</div>

			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Kommentar</span>
				<input type="text" class="input input-bordered input-sm" bind:value={form.comments} />
			</label>

			<!-- Sperrtage: 5 Spalten Mo…Fr, je Woche eine Zeile -->
			{#if weeks.length}
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Sperrtage (nicht am)</span>
					<div class="grid grid-cols-5 gap-1 rounded-lg border border-base-300 p-2">
						{#each ['Mo', 'Di', 'Mi', 'Do', 'Fr'] as wd}
							<div class="text-center text-xs font-medium text-base-content/50">{wd}</div>
						{/each}
						{#each weeks as week}
							{#each week as d}
								{#if d}
									<label
										class="flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-sm hover:bg-base-200"
									>
										<input
											type="checkbox"
											class="checkbox checkbox-xs"
											checked={form.excludeDays.has(dayPart(d.date))}
											on:change={() => toggleDay(dayPart(d.date))}
										/>
										<span class="tabular-nums">{ddmm(d.date)}</span>
									</label>
								{:else}
									<div></div>
								{/if}
							{/each}
						{/each}
					</div>
				</div>
			{/if}

			<!-- gleicher Slot wie -->
			<div class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">gleicher Slot wie</span>
				<div class="flex flex-wrap items-center gap-1">
					{#each form.sameSlot as a}
						<span class="badge badge-ghost gap-1">
							{a}{moduleOf(a) ? ` · ${moduleOf(a)}` : ''}
							<button class="text-error" on:click={() => rmSameSlot(a)}>✕</button>
						</span>
					{/each}
				</div>
				<div class="flex items-center gap-2">
					<select class="select select-bordered select-sm w-72" bind:value={addSlotAncode}>
						<option value="">Prüfung wählen …</option>
						<!-- nur zu planende Prüfungen (inkl. externe/notPlannedByMe); die im
						     ZPA nicht geplanten (notToPlan) und unbekannten werden ausgelassen -->
						{#each allExams as e}
							{#if e.status === 'toPlan' && e.ancode !== exam.ancode && !form.sameSlot.includes(e.ancode)}
								<option value={e.ancode}>
									{e.ancode} — {e.module}{e.constraints?.notPlannedByMe ? ' · extern' : ''}
								</option>
							{/if}
						{/each}
					</select>
					<button class="btn btn-ghost btn-sm" disabled={!addSlotAncode} on:click={addSameSlot}>
						+ hinzufügen
					</button>
				</div>
			</div>

			<!-- erlaubte Räume -->
			{#if rooms.length}
				<details>
					<summary class="cursor-pointer text-xs font-medium text-base-content/60">
						erlaubte Räume {form.allowedRooms.length ? `(${form.allowedRooms.length})` : ''}
					</summary>
					<div
						class="mt-1 flex max-h-40 flex-wrap gap-x-4 gap-y-1 overflow-y-auto rounded-lg border border-base-300 p-2"
					>
						{#each rooms as name}
							<label class="flex cursor-pointer items-center gap-1 text-sm">
								<input
									type="checkbox"
									class="checkbox checkbox-xs"
									checked={form.allowedRooms.includes(name)}
									on:change={() => toggleRoom(name)}
								/>
								<span class="font-mono">{name}</span>
							</label>
						{/each}
					</div>
				</details>
			{/if}
		</fieldset>

		{#if error}
			<div class="alert alert-error mt-3 py-2 text-sm"><span>{error}</span></div>
		{/if}

		<div class="modal-action">
			<button class="btn btn-ghost btn-sm" disabled={saving} on:click={() => dispatch('close')}>
				Abbrechen
			</button>
			<WriteButton class="btn btn-primary btn-sm" disabled={saving} on:click={save}>
				{saving ? 'speichert …' : 'Speichern'}
			</WriteButton>
		</div>
	</div>
	<button class="modal-backdrop" aria-label="schließen" on:click={() => dispatch('close')}></button>
</div>
