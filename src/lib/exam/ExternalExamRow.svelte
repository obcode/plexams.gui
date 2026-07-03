<script lang="ts">
	// Eine Prüfungszeile mit Inline-Termineingabe (Datum + Zeit, kein Popup).
	// Setzt die externe Zeit über /api/setExternalExamTime(ancode) und meldet
	// Erfolg per onsaved-Callback nach oben (dort invalidateAll).
	import WriteButton from '$lib/WriteButton.svelte';

	let { exam, onsaved }: { exam: any; onsaved?: () => void } = $props();

	/** „13.07. 08:30" (Berlin) */
	const dateTime = (iso: string) => {
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
	/** {date:'yyyy-mm-dd', time:'HH:MM'} in Berlin */
	function berlinParts(iso: string) {
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
	/** „yyyy-mm-dd" → „dd.mm.yyyy" */
	function toServerDate(iso: string) {
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
		return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
	}

	let date = $state('');
	let time = $state('');
	// Eingaben aus externalTime vorbelegen; reseedet nur bei Änderung der externen
	// Zeit (der Effekt liest nur externalTime, nicht date/time → nicht beim Tippen).
	$effect(() => {
		const iso = exam.planEntry?.externalTime;
		const p = iso ? berlinParts(iso) : { date: '', time: '' };
		date = p.date;
		time = p.time;
	});

	const hasTime = $derived(!!exam.planEntry?.externalTime);
	// Zeit außerhalb des Prüfungszeitraums: nur externalTime, kein echter Slot
	// (dayNumber/slotNumber == 0). Dann keinen Slot zeigen, nur die Zeit + Hinweis.
	const outsidePeriod = $derived(
		hasTime && !exam.planEntry?.dayNumber && !exam.planEntry?.slotNumber
	);
	let saving = $state(false);
	let error = $state('');

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
			onsaved?.();
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
		{#if (exam.extra ?? []).length || exam.isRepeaterExam || exam.sourceLabel}
			<div class="flex flex-wrap items-center gap-1">
				{#if exam.sourceLabel}
					<span class="badge badge-outline badge-xs" title="Quelle">{exam.sourceLabel}</span>
				{/if}
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
			{:else}
				<span class="badge badge-warning badge-sm">kein Termin</span>
			{/if}
			<input type="date" class="input input-bordered input-xs w-36" bind:value={date} />
			<input type="time" class="input input-bordered input-xs w-24" bind:value={time} />
			<WriteButton class="btn btn-primary btn-xs" disabled={saving || !date || !time} onclick={save}>
				{saving ? '…' : hasTime ? 'ändern' : 'setzen'}
			</WriteButton>
			{#if outsidePeriod}
				<span class="badge badge-ghost badge-sm" title="Zeit außerhalb des Prüfungszeitraums">
					außerhalb des Prüfungszeitraums
				</span>
			{/if}
		</div>
		{#if error}<div class="mt-1 text-xs text-error">{error}</div>{/if}
	</td>
</tr>
