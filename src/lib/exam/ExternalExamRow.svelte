<script>
	// Eine Prüfungszeile mit Inline-Termineingabe (Datum + Zeit, kein Popup).
	// Setzt die externe Zeit über /api/setExternalExamTime(ancode) und meldet
	// Erfolg per `saved`-Event nach oben (dort invalidateAll).
	import { createEventDispatcher } from 'svelte';
	import WriteButton from '$lib/WriteButton.svelte';

	/** @type {any} */
	export let exam;

	const dispatch = createEventDispatcher();

	/** @param {string} iso → „13.07. 08:30" (Berlin) */
	const dateTime = (iso) => {
		const d = new Date(iso);
		return Number.isNaN(d.getTime())
			? ''
			: d.toLocaleString('de-DE', {
					timeZone: 'Europe/Berlin',
					weekday: 'short',
					day: '2-digit',
					month: '2-digit',
					hour: '2-digit',
					minute: '2-digit'
				});
	};
	/** @param {string} iso → {date:'yyyy-mm-dd', time:'HH:MM'} in Berlin */
	function berlinParts(iso) {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return { date: '', time: '' };
		const s = new Intl.DateTimeFormat('sv-SE', {
			timeZone: 'Europe/Berlin',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(d);
		const [date, time] = s.replace(',', '').split(' ');
		return { date, time };
	}
	/** @param {string} iso „yyyy-mm-dd" → „dd.mm.yyyy" */
	function toServerDate(iso) {
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
		return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
	}

	let date = '';
	let time = '';
	// Eingaben aus dem (ggf. nach dem Speichern aktualisierten) externalTime
	// vorbelegen. Läuft nur neu, wenn sich die externe Zeit ändert — nicht
	// während des Tippens.
	$: syncFrom(exam.planEntry?.externalTime);
	/** @param {string | null | undefined} iso */
	function syncFrom(iso) {
		const p = iso ? berlinParts(iso) : { date: '', time: '' };
		date = p.date;
		time = p.time;
	}

	$: hasTime = !!exam.planEntry?.externalTime;
	// Zeit außerhalb des Prüfungszeitraums: nur externalTime, kein echter Slot
	// (dayNumber/slotNumber == 0). Dann keinen Slot zeigen, nur die Zeit + Hinweis.
	$: outsidePeriod =
		hasTime && !exam.planEntry?.dayNumber && !exam.planEntry?.slotNumber;
	let saving = false;
	let error = '';

	async function save() {
		if (!date || !time) {
			error = 'Datum und Zeit angeben.';
			return;
		}
		saving = true;
		error = '';
		try {
			const res = await fetch('/api/setExternalExamTime', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ancode: exam.ancode, date: toServerDate(date), time })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				error = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			dispatch('saved');
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}
</script>

<tr class="hover {hasTime ? '' : 'bg-warning/10'}">
	<td class="align-top font-mono tabular-nums">
		{exam.ancode ?? '—'}
		{#if exam.primussAncode != null}
			<div class="text-xs text-base-content/50">P {exam.primussAncode}</div>
		{/if}
	</td>
	<td class="align-top">
		<div class="font-medium">{exam.module}</div>
		{#if (exam.extra ?? []).length || exam.isRepeaterExam}
			<div class="flex flex-wrap items-center gap-1">
				{#each exam.extra ?? [] as x}<span class="badge badge-ghost badge-xs">{x}</span>{/each}
				{#if exam.isRepeaterExam}<span title="Wiederholung">🔁</span>{/if}
			</div>
		{/if}
	</td>
	<td class="align-top text-sm">
		<div class="flex flex-wrap items-center gap-1">
			<span>{exam.mainExamer}</span>
			{#if exam.fkLabel}
				<span class="badge badge-neutral badge-xs" title="Fakultät">{exam.fkLabel}</span>
			{/if}
		</div>
	</td>
	<td class="align-top text-sm text-base-content/70">{exam.examType}</td>
	<td class="align-top">
		<div class="flex flex-wrap items-center gap-2">
			{#if hasTime}
				<span class="font-mono text-sm whitespace-nowrap tabular-nums">
					{dateTime(exam.planEntry.externalTime)} Uhr
				</span>
				{#if outsidePeriod}
					<span class="badge badge-ghost badge-sm" title="Zeit außerhalb des Prüfungszeitraums">
						außerhalb des Prüfungszeitraums
					</span>
				{/if}
			{:else}
				<span class="badge badge-warning badge-sm">kein Termin</span>
			{/if}
			<input type="date" class="input input-bordered input-xs w-36" bind:value={date} />
			<input type="time" class="input input-bordered input-xs w-24" bind:value={time} />
			<WriteButton
				class="btn btn-primary btn-xs"
				disabled={saving || !date || !time}
				on:click={save}
			>
				{saving ? '…' : hasTime ? 'ändern' : 'setzen'}
			</WriteButton>
		</div>
		{#if error}<div class="mt-1 text-xs text-error">{error}</div>{/if}
	</td>
</tr>
