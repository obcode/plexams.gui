<script lang="ts">
	import WriteButton from '$lib/WriteButton.svelte';

	// Gemeinsames Formular zum Anlegen und Bearbeiten eines NTA. Beim Bearbeiten
	// ist die mtknr (Schlüssel) gesperrt. exams/deactivated/lastSemester sind
	// nicht Teil des Inputs und werden serverseitig nicht überschrieben.

	let {
		mode = 'add',
		nta = null,
		onsaved,
		oncancel
	}: {
		mode?: string;
		nta?: any;
		onsaved?: (data: any) => void;
		oncancel?: () => void;
	} = $props();

	const empty = {
		name: '',
		email: '',
		mtknr: '',
		compensation: '',
		deltaDurationPercent: 0,
		needsRoomAlone: false,
		needsHardware: false,
		program: '',
		from: '',
		until: ''
	};

	// „Bescheid vom" wird als DD.MM.YYYY gespeichert, das <input type="date">
	// braucht aber YYYY-MM-DD — daher beim Vorbefüllen/Speichern konvertieren
	// (Speicherformat bleibt DD.MM.YYYY, damit nichts anderes bricht).
	function toISO(d: string) {
		const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d ?? '');
		return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
	}
	function fromISO(d: string) {
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d ?? '');
		return m ? `${m[3]}.${m[2]}.${m[1]}` : (d ?? '');
	}

	function pick(n: any) {
		return {
			name: n.name ?? '',
			email: n.email ?? '',
			mtknr: n.mtknr ?? '',
			compensation: n.compensation ?? '',
			deltaDurationPercent: n.deltaDurationPercent ?? 0,
			needsRoomAlone: !!n.needsRoomAlone,
			needsHardware: !!n.needsHardware,
			program: n.program ?? '',
			from: toISO(n.from),
			until: n.until ?? ''
		};
	}

	let form = $state(nta ? pick(nta) : { ...empty });

	let saving = $state(false);
	let errorMsg = $state<string | null>(null);

	// Clientseitige Validierung. E-Mail nur prüfen, wenn ausgefüllt (optional).
	// Die mtknr ist der Schlüssel: nur Ziffern, aber als String übertragen
	// (führende Nullen müssen erhalten bleiben → kein type="number").
	const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const emailError = $derived(
		form.email && !emailRe.test(form.email) ? 'Ungültige E-Mail-Adresse.' : ''
	);
	const mtknrError = $derived(
		form.mtknr && !/^\d+$/.test(form.mtknr) ? 'Nur Ziffern erlaubt.' : ''
	);
	const formValid = $derived(form.name.trim() !== '' && /^\d+$/.test(form.mtknr) && !emailError);

	async function submit() {
		if (!formValid) {
			errorMsg = 'Bitte die markierten Eingaben prüfen.';
			return;
		}
		saving = true;
		errorMsg = null;
		const url = mode === 'edit' ? '/api/updateNTA' : '/api/addNTA';
		const input = {
			...form,
			deltaDurationPercent: Number(form.deltaDurationPercent),
			from: fromISO(form.from)
		};
		let data;
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ input })
			});
			data = await res.json().catch(() => ({}));
			if (!res.ok || data?.error) {
				errorMsg = data?.error ?? `Fehler (HTTP ${res.status})`;
				return;
			}
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : String(e);
			return;
		} finally {
			saving = false;
		}
		onsaved?.(data);
	}
</script>

<div class="flex flex-col gap-3">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Name</span>
			<input
				type="text"
				placeholder="Name, Vorname"
				class="input input-bordered input-sm"
				bind:value={form.name}
			/>
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">E-Mail</span>
			<input
				type="email"
				placeholder="username@hm.edu"
				class="input input-bordered input-sm {emailError ? 'input-error' : ''}"
				bind:value={form.email}
			/>
			{#if emailError}<span class="text-xs text-error">{emailError}</span>{/if}
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">
				Matrikelnummer {#if mode === 'edit'}<span class="text-base-content/40">(gesperrt)</span
					>{/if}
			</span>
			<input
				type="text"
				inputmode="numeric"
				placeholder="MtkNr"
				class="input input-bordered input-sm {mtknrError ? 'input-error' : ''}"
				bind:value={form.mtknr}
				readonly={mode === 'edit'}
				class:input-disabled={mode === 'edit'}
			/>
			{#if mtknrError}<span class="text-xs text-error">{mtknrError}</span>{/if}
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Studiengang</span>
			<input
				type="text"
				placeholder="Studiengang"
				class="input input-bordered input-sm"
				bind:value={form.program}
			/>
		</label>
	</div>

	<label class="flex flex-col gap-1">
		<span class="text-xs font-medium text-base-content/60">Kompensation</span>
		<textarea
			class="textarea textarea-bordered"
			placeholder="Kompensation"
			bind:value={form.compensation}
		></textarea>
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-xs font-medium text-base-content/60">
			Verlängerung ({form.deltaDurationPercent} %)
		</span>
		<input
			type="range"
			min="0"
			max="100"
			step="5"
			class="range range-sm"
			bind:value={form.deltaDurationPercent}
		/>
	</label>

	<div class="flex flex-wrap gap-6">
		<label class="label cursor-pointer justify-start gap-3 px-0">
			<input type="checkbox" class="toggle toggle-sm" bind:checked={form.needsRoomAlone} />
			<span class="label-text">eigener Raum</span>
		</label>
		<label class="label cursor-pointer justify-start gap-3 px-0">
			<input type="checkbox" class="toggle toggle-sm" bind:checked={form.needsHardware} />
			<span class="label-text">spezielle Hardware (PC o. ä.)</span>
		</label>
	</div>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">mit Bescheid vom</span>
			<input type="date" class="input input-bordered input-sm" bind:value={form.from} />
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">NTA gilt bis</span>
			<input
				type="text"
				placeholder="Ende"
				class="input input-bordered input-sm"
				bind:value={form.until}
			/>
		</label>
	</div>

	{#if errorMsg}
		<div class="alert alert-error py-2 text-sm"><span>{errorMsg}</span></div>
	{/if}

	<div class="flex justify-end gap-2">
		<button class="btn btn-ghost btn-sm" onclick={() => oncancel?.()} disabled={saving}>
			Abbrechen
		</button>
		<WriteButton
			class="btn btn-primary btn-sm gap-2"
			onclick={submit}
			disabled={saving || !formValid}
		>
			{#if saving}<span class="loading loading-spinner loading-xs"></span>{/if}
			{mode === 'edit' ? 'Speichern' : 'Hinzufügen'}
		</WriteButton>
	</div>
</div>
