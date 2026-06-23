<script>
	import EmailSender from '$lib/email/EmailSender.svelte';
	import { emailGroups } from '$lib/email/emails';

	export let data;

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
			Jeder Versand ist standardmäßig ein <strong>Probelauf</strong> — die E-Mail geht dann nur an dich
			(den Planer). Über „Wirklich senden …" wird nach einer Bestätigung an alle Empfänger versendet.
			Solange eine Validierung oder ein ZPA-Transfer läuft, lehnt der Server den Versand ab; das wird
			hier nur als Hinweis angezeigt.
		</p>
	</div>

	{#each emailGroups as group}
		<section class="flex flex-col gap-3">
			<h2 class="text-lg font-semibold text-base-content/80">{group.title}</h2>
			<div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
				{#each group.emails as email (email.key)}
					<div class="flex flex-col gap-2">
						<EmailSender
							emailKey={email.key}
							title={email.title}
							description={email.description}
							extraArgs={email.extraArgs ?? {}}
							conditionKey={email.conditionKey ?? ''}
							conditionsDone={data.conditionsDone}
							hideRealSend={email.key === 'sendEmailInvigilationsMissing' &&
								data.allRequirementsPresent}
							hideRealSendHint="alle Anforderungen vorhanden — kein Versand nötig"
						/>
						{#if email.links}
							<div class="flex flex-wrap gap-2 px-1">
								{#each email.links as link}
									<a
										href={link.href}
										class="btn btn-sm gap-2 {link.primary ? 'btn-primary' : 'btn-outline'}"
									>
										{link.label}
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</section>
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
					conditionsDone={data.conditionsDone}
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
					conditionsDone={data.conditionsDone}
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
					conditionsDone={data.conditionsDone}
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
					conditionsDone={data.conditionsDone}
				/>
			</div>
		</div>
	</section>
</div>
