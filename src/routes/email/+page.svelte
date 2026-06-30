<script>
	import EmailSender from '$lib/email/EmailSender.svelte';
	import EmailCard from '$lib/email/EmailCard.svelte';
	import ExamPlanningInfoSender from '$lib/email/ExamPlanningInfoSender.svelte';
	import { emailGroups } from '$lib/email/emails';
	import { EMAIL_CONDITION } from '$lib/email/emailConditions';

	export let data;

	// „bereits gesendet": zugehörige Bedingung ist done. Solche Versände wandern
	// nach unten, oben bleibt nur Offenes (oberste Karte = nächster Schritt).
	// Reaktiv (referenziert conditionsDone), damit sich die Sortierung aktualisiert,
	// sobald die async geladenen Bedingungen eintreffen.
	/** @param {import('$lib/email/emails').EmailDef} email */
	$: isSent = (email) => {
		const k = email.conditionKey || EMAIL_CONDITION[email.key];
		return !!k && conditionsDone[k] === true;
	};
	$: sentEmails = emailGroups.flatMap((g) => g.emails).filter(isSent);

	// Gestreamte Load-Daten: Seite rendert sofort, diese füllen sich nach.
	/** @type {Record<string, boolean>} */
	let conditionsDone = {};
	let allRequirementsPresent = false;
	/** @type {any[]} */
	let examPlanningMailRecipients = [];
	$: data.conditionsDone.then((/** @type {Record<string, boolean>} */ v) => (conditionsDone = v));
	$: data.allRequirementsPresent.then((/** @type {boolean} */ v) => (allRequirementsPresent = v));
	$: data.examPlanningMailRecipients.then((/** @type {any[]} */ v) => (examPlanningMailRecipients = v));

	// Einzelversand mit Argumenten (wiederholbar, kein Gate)
	let pdAncode = '';
	let pdUpdated = false;
	let puProgram = '';
	let puAncode = '';
	let puEmail = '';
	let newNtaMtknr = '';
	let roomAloneMtknr = '';
</script>

<div class="mx-2 mt-4 flex flex-col gap-6">
	<div class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold">E-Mails versenden</h1>
		<p class="max-w-3xl text-sm text-base-content/60">
			Jeder Versand ist standardmäßig ein <strong>Probelauf</strong> — die Mails gehen dann nicht an
			die Empfänger, sondern werden als <span class="font-mono">.eml</span>-Anhänge gebündelt an die
			Testadresse (dich als Planer) geschickt. Über „Wirklich senden …" wird nach einer Bestätigung
			an alle Empfänger versendet. Solange eine Validierung oder ein ZPA-Transfer läuft, lehnt der
			Server den Versand ab; das wird hier nur als Hinweis angezeigt.
		</p>
	</div>

	{#each emailGroups as group}
		{@const open = group.emails.filter((e) => !isSent(e))}
		{#if open.length || group.id === 'constraints'}
			<section class="flex flex-col gap-3">
				<h2 class="text-lg font-semibold text-base-content/80">{group.title}</h2>
				{#if group.id === 'constraints'}
					<ExamPlanningInfoSender recipients={examPlanningMailRecipients} {conditionsDone} />
				{/if}
				{#if open.length}
					<div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
						{#each open as email (email.key)}
							<EmailCard {email} {conditionsDone} {allRequirementsPresent} />
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	{/each}

	<!-- Einzelversand mit Parametern (wiederholbar) -->
	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-semibold text-base-content/80">Einzelversand</h2>
		<div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
			<!-- Primuss-Daten einer Prüfung -->
			<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
				<div class="flex flex-wrap items-end gap-3">
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">AnCode</span>
						<input type="number" class="input input-bordered input-sm w-28" bind:value={pdAncode} />
					</label>
					<label class="label cursor-pointer gap-2">
						<input type="checkbox" class="checkbox checkbox-sm" bind:checked={pdUpdated} />
						<span class="label-text">geändert</span>
					</label>
				</div>
				<EmailSender
					emailKey="sendEmailPrimussData"
					title="Primuss-Daten (eine Prüfung)"
					description="Primuss-Daten zur gewählten Prüfung."
					extraArgs={{
						ancode: { type: 'Int!', value: Number(pdAncode) },
						updated: { type: 'Boolean!', value: pdUpdated }
					}}
					disabled={!pdAncode}
					{conditionsDone}
				/>
			</div>

			<!-- Primuss-Daten nicht geplant -->
			<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
				<div class="flex flex-wrap items-end gap-2">
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">Studiengang</span>
						<input type="text" class="input input-bordered input-sm w-28" bind:value={puProgram} />
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">AnCode</span>
						<input type="number" class="input input-bordered input-sm w-24" bind:value={puAncode} />
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">E-Mail</span>
						<input type="text" class="input input-bordered input-sm w-48" bind:value={puEmail} />
					</label>
				</div>
				<EmailSender
					emailKey="sendEmailPrimussDataUnplanned"
					title="Primuss-Daten (nicht geplant)"
					description="Primuss-Daten zu einer nicht geplanten Prüfung an eine Adresse."
					extraArgs={{
						program: { type: 'String!', value: puProgram },
						ancode: { type: 'Int!', value: Number(puAncode) },
						email: { type: 'String!', value: puEmail }
					}}
					disabled={!(puProgram && puAncode && puEmail)}
					{conditionsDone}
				/>
			</div>

			<!-- Neuer NTA -->
			<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Matrikelnummer</span>
					<input
						type="text"
						inputmode="numeric"
						class="input input-bordered input-sm w-40"
						bind:value={newNtaMtknr}
					/>
				</label>
				<EmailSender
					emailKey="sendEmailNewNTA"
					title="„Neuer NTA“ an Prüfende"
					description="Info an die betroffenen Prüfenden über einen nachträglich eingegangenen NTA-Bescheid (mtknr)."
					extraArgs={{ mtknr: { type: 'String!', value: newNtaMtknr } }}
					disabled={!newNtaMtknr}
					{conditionsDone}
				/>
			</div>

			<!-- NTA Einzelraum einzeln -->
			<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Matrikelnummer</span>
					<input
						type="text"
						inputmode="numeric"
						class="input input-bordered input-sm w-40"
						bind:value={roomAloneMtknr}
					/>
				</label>
				<EmailSender
					emailKey="sendEmailNTARoomAlone"
					title="NTA Einzelraum (eine Person)"
					description="Info zum eigenen Raum für eine/n NTA-Studierende/n."
					extraArgs={{ mtknr: { type: 'String!', value: roomAloneMtknr } }}
					disabled={!roomAloneMtknr}
					{conditionsDone}
				/>
			</div>
		</div>
	</section>

	<!-- Bereits gesendet: ganz unten, in Workflow-Reihenfolge -->
	{#if sentEmails.length}
		<section class="flex flex-col gap-3 border-t border-base-300 pt-4">
			<h2 class="text-lg font-semibold text-base-content/50">
				Bereits gesendet
				<span class="badge badge-ghost badge-sm tabular-nums">{sentEmails.length}</span>
			</h2>
			<div class="grid grid-cols-1 gap-3 opacity-80 xl:grid-cols-2">
				{#each sentEmails as email (email.key)}
					<EmailCard {email} {conditionsDone} {allRequirementsPresent} />
				{/each}
			</div>
		</section>
	{/if}
</div>
