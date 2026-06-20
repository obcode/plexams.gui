<script>
	import EmailSender from '$lib/email/EmailSender.svelte';
	import { emailGroups } from '$lib/email/emails';
</script>

<div class="mx-2 mt-4 flex flex-col gap-6">
	<div class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold">E-Mails versenden</h1>
		<p class="max-w-3xl text-sm text-base-content/60">
			Jeder Versand ist standardmäßig ein <strong>Probelauf</strong> — die E-Mail geht dann nur an
			dich (den Planer). Über „Wirklich senden …" wird nach einer Bestätigung an alle Empfänger
			versendet. Solange eine Validierung oder ein ZPA-Transfer läuft, lehnt der Server den Versand
			ab; das wird hier nur als Hinweis angezeigt.
		</p>
	</div>

	{#each emailGroups as group}
		<section class="flex flex-col gap-3">
			<h2 class="text-lg font-semibold text-base-content/80">{group.title}</h2>
			<div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
				{#each group.emails as email (email.key)}
					<EmailSender emailKey={email.key} title={email.title} description={email.description} />
				{/each}
			</div>
		</section>
	{/each}

	<!-- Verweise auf Versände, die Anhänge brauchen und woanders vorbereitet werden -->
	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-semibold text-base-content/80">Mit Anhängen (auf anderer Seite)</h2>
		<div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
			<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
				<div>
					<div class="font-medium">Deckblätter</div>
					<div class="text-xs text-base-content/50">
						Der Bulk-Versand „Deckblätter (alle)" ist oben. Zum <strong>Hochladen</strong> der PDFs
						(ZIP oder einzeln), zum Status-Abgleich und zum <strong>Einzelversand</strong> an eine/n
						Prüfende/n geht es auf die Anhänge-Seite.
					</div>
				</div>
				<a href="/email/attachments" class="btn btn-primary btn-sm w-fit gap-2">
					→ Anhänge: Deckblätter
				</a>
			</div>

			<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
				<div>
					<div class="font-medium">Aufsichtskalender (Bilder)</div>
					<div class="text-xs text-base-content/50">
						Der Bulk-Versand „Veröffentlichte Aufsichten" ist oben. Die Kalender-PNGs werden auf
						„Aufsichten mit Anforderungen" <strong>erzeugt &amp; hochgeladen</strong>; Status und
						Versand findest du auf der Anhänge-Seite.
					</div>
				</div>
				<div class="flex flex-wrap gap-2">
					<a href="/email/attachments" class="btn btn-primary btn-sm gap-2">→ Anhänge: Kalender</a>
					<a href="/zpa/invigilator_requirements" class="btn btn-outline btn-sm gap-2">
						→ Aufsichten mit Anforderungen
					</a>
				</div>
			</div>
		</div>
	</section>
</div>
