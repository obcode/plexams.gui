<script>
	import { GLOSSARY } from '#lib/help/glossary.js';
	import { PHASE_HELP, stepHelp } from '#lib/help/workflow.js';
	import { conditionLink } from '#lib/semester/conditionLinks.js';

	let { data } = $props();

	const glossary = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term, 'de'));
</script>

<svelte:head><title>Hilfe · Plexams</title></svelte:head>

<div class="mx-2 mt-4 flex max-w-4xl flex-col gap-6">
	<header class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold">Hilfe</h1>
		<p class="max-w-3xl text-sm text-base-content/70">
			Plexams begleitet die Prüfungsplanung eines Semesters von der ersten Abfrage bis zum
			verschickten Deckblatt. Diese Seite erklärt den Ablauf Schritt für Schritt, die Begriffe und
			was die Meldungen der Validierung bedeuten.
		</p>
		<nav class="flex flex-wrap gap-2 text-sm">
			<a class="btn btn-outline btn-xs" href="#grundlagen">Grundlagen</a>
			<a class="btn btn-outline btn-xs" href="#ablauf">Ablauf</a>
			<a class="btn btn-outline btn-xs" href="#validierung">Validierung</a>
			<a class="btn btn-outline btn-xs" href="#fehler">Wenn etwas nicht geht</a>
			<a class="btn btn-outline btn-xs" href="#glossar">Glossar</a>
		</nav>
	</header>

	<section id="grundlagen" class="flex scroll-mt-4 flex-col gap-3">
		<h2 class="text-xl font-semibold">Grundlagen</h2>
		<div class="grid gap-3 sm:grid-cols-2">
			<div class="rounded-lg border border-base-300 bg-base-100 p-4 text-sm">
				<h3 class="mb-1 font-semibold">Was Plexams zusammenführt</h3>
				<p class="text-base-content/80">
					Das ZPA kennt die Prüfungen, aber nicht, wer sie schreibt. Primuss kennt die Anmeldungen,
					aber keine Räume. Anny kennt die Raumbuchungen, aber keine Prüfungen. Plexams führt das
					zusammen und macht daraus einen Plan: Termine, Räume, Aufsichten.
				</p>
			</div>
			<div class="rounded-lg border border-base-300 bg-base-100 p-4 text-sm">
				<h3 class="mb-1 font-semibold">Die Startseite ist dein Fahrplan</h3>
				<p class="text-base-content/80">
					Die <a class="link" href="/">Startseite</a> zeigt alle Schritte als Checkliste in fünf Phasen.
					Ein Klick auf einen Schritt führt zu der Seite, auf der er erledigt wird. Manche Häkchen setzen
					sich von selbst, die anderen setzt du, wenn der Schritt getan ist.
				</p>
			</div>
			<div class="rounded-lg border border-base-300 bg-base-100 p-4 text-sm">
				<h3 class="mb-1 font-semibold">Erst Probelauf, dann speichern</h3>
				<p class="text-base-content/80">
					Fast alles mit Folgen gibt es zweimal: als Probelauf, der nur rechnet und anzeigt, und als
					echten Lauf, der speichert oder verschickt. E-Mails gehen im Probelauf nur an dich selbst.
					Sieh dir immer zuerst den Probelauf an.
				</p>
			</div>
			<div class="rounded-lg border border-base-300 bg-base-100 p-4 text-sm">
				<h3 class="mb-1 font-semibold">Der Rechner plant, du entscheidest</h3>
				<p class="text-base-content/80">
					Termine, Räume und Aufsichten verteilt jeweils ein Generator. Du gibst vor, was feststeht
					(fixieren, sperren, Vorgaben), prüfst das Ergebnis und besserst einzelne Stellen von Hand
					nach. Was du fixiert hast, bleibt bei einem neuen Lauf erhalten.
				</p>
			</div>
			<div class="rounded-lg border border-base-300 bg-base-100 p-4 text-sm">
				<h3 class="mb-1 font-semibold">Veröffentlicht heißt gesperrt</h3>
				<p class="text-base-content/80">
					Sobald die Veröffentlichungs-E-Mail eines Plans verschickt ist (🔒 in der Checkliste),
					lässt er sich nicht mehr neu generieren. Einzelne Änderungen von Hand gehen weiter. Für
					einen neuen Lauf nimmst du das Häkchen auf der Startseite zurück und setzt es danach
					wieder.
				</p>
			</div>
			<div class="rounded-lg border border-base-300 bg-base-100 p-4 text-sm">
				<h3 class="mb-1 font-semibold">Die Anzeigen oben in der Leiste</h3>
				<p class="text-base-content/80">
					Rechts oben stehen die Semesterauswahl, die Ampel der Validierung, die Ampel des
					ZPA-Abgleichs und die offenen Todos. Ein Klick auf eine Ampel startet die Prüfung. Ein
					gelbes Band darunter weist darauf hin, wenn das Semester geschützt ist oder seit der
					letzten Sicherung etwas geändert wurde.
				</p>
			</div>
		</div>
	</section>

	<section id="ablauf" class="flex scroll-mt-4 flex-col gap-3">
		<h2 class="text-xl font-semibold">Der Ablauf in fünf Phasen</h2>
		<p class="max-w-3xl text-sm text-base-content/70">
			Die Schritte stehen in der Reihenfolge, in der sie üblicherweise erledigt werden. ✓ heißt: im
			aktuellen Semester schon erledigt. 🔒 heißt: dieser Schritt sperrt das Neu-Generieren seines
			Bereichs. „automatisch" heißt: das Häkchen setzt Plexams selbst.
		</p>
		{#if data.phases.length === 0}
			<div class="alert alert-warning py-2 text-sm">
				<span>
					Die Schritte konnten gerade nicht geladen werden, weil der Plexams-Server nicht
					geantwortet hat. Lade die Seite neu.
				</span>
			</div>
		{/if}
		{#each data.phases as phase (phase.key)}
			<div
				id={phase.key}
				class="flex scroll-mt-4 flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4"
			>
				<h3 class="font-semibold">{PHASE_HELP[phase.key]?.title ?? phase.title}</h3>
				{#if PHASE_HELP[phase.key]}
					<p class="max-w-3xl text-sm text-base-content/70">{PHASE_HELP[phase.key].intro}</p>
				{/if}
				<ol class="flex flex-col gap-3">
					{#each phase.conditions as cond, i (cond.key)}
						{@const help = stepHelp(cond.key)}
						{@const href = conditionLink(cond.key)}
						<li id="schritt-{cond.key}" class="flex scroll-mt-4 gap-3 text-sm">
							<span
								class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold {cond.done
									? 'bg-success/20 text-success'
									: 'bg-base-200 text-base-content/60'}"
								title={cond.done ? 'erledigt' : 'offen'}
							>
								{cond.done ? '✓' : i + 1}
							</span>
							<div class="flex min-w-0 flex-col gap-0.5">
								<div class="flex flex-wrap items-center gap-2">
									{#if href}
										<a class="link link-hover font-medium" {href}>{cond.title}</a>
									{:else}
										<span class="font-medium">{cond.title}</span>
									{/if}
									{#if cond.gate}
										<span class="badge badge-ghost badge-sm">🔒 sperrt Neu-Generieren</span>
									{/if}
									{#if cond.auto}
										<span class="badge badge-ghost badge-sm">automatisch</span>
									{/if}
								</div>
								{#if help}
									<p class="text-base-content/80">{help.what}</p>
									<p class="text-base-content/60">{help.why}</p>
									{#if help.note}
										<p class="text-base-content/60">
											<span class="font-medium">Achtung:</span>
											{help.note}
										</p>
									{/if}
								{/if}
							</div>
						</li>
					{/each}
				</ol>
			</div>
		{/each}
	</section>

	<section id="validierung" class="flex scroll-mt-4 flex-col gap-3">
		<h2 class="text-xl font-semibold">Was die Validierung meldet</h2>
		<p class="max-w-3xl text-sm text-base-content/70">
			Die Validierung prüft den aktuellen Stand gegen die Regeln der Planung. Sie ändert nichts.
			Lass sie nach jedem größeren Schritt laufen: über die Ampel oben in der Leiste oder über „…
			validieren" im jeweiligen Menü. Während sie läuft, sind Änderungen kurz gesperrt.
		</p>
		<div class="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
			<table class="table table-sm">
				<thead>
					<tr><th>Zeichen</th><th>Stufe</th><th>Bedeutung</th><th>Was tun</th></tr>
				</thead>
				<tbody>
					<tr>
						<td>⛔</td>
						<td class="font-medium">Fehler</td>
						<td>Eine Regel ist verletzt. So kann der Plan nicht bleiben.</td>
						<td>Beheben, bevor du den Plan veröffentlichst.</td>
					</tr>
					<tr>
						<td>⚠️</td>
						<td class="font-medium">Warnung</td>
						<td>Etwas ist ungünstig oder noch offen, kann aber so gewollt sein.</td>
						<td>Jede Warnung ansehen und entscheiden: ändern oder bewusst so lassen.</td>
					</tr>
					<tr>
						<td>•</td>
						<td class="font-medium">Info</td>
						<td>
							Ein Hinweis, kein Problem. Zum Beispiel eine Ausnahme, die du schon akzeptiert hast.
						</td>
						<td>Nichts.</td>
					</tr>
					<tr>
						<td>–</td>
						<td class="font-medium">übersprungen</td>
						<td>
							Die Prüfung konnte noch nicht laufen, weil die Daten dafür fehlen, etwa weil es noch
							keinen Terminplan gibt.
						</td>
						<td>Nichts. Sie läuft, sobald der Schritt davor erledigt ist.</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="max-w-3xl text-sm text-base-content/70">
			Eine Prüfung gilt als bestanden (✓), wenn sie keine Fehler hat, auch wenn Warnungen übrig
			sind. Die Ampel in der Leiste ist rot bei Fehlern, gelb bei Warnungen und grün, wenn nichts zu
			tun ist.
		</p>
	</section>

	<section id="fehler" class="flex scroll-mt-4 flex-col gap-3">
		<h2 class="text-xl font-semibold">Wenn etwas nicht geht</h2>
		<div class="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
			<table class="table table-sm">
				<thead><tr><th>Was du siehst</th><th>Woran es liegt</th><th>Was du tust</th></tr></thead>
				<tbody>
					<tr>
						<td>„Das geht gerade nicht, weil im Hintergrund noch etwas läuft"</td>
						<td>
							Eine Validierung, ein Import, eine Übertragung ins ZPA, ein Generierungslauf oder ein
							E-Mail-Versand läuft. Währenddessen sind Änderungen gesperrt.
						</td>
						<td>Warten, bis der Vorgang fertig ist, dann noch einmal versuchen.</td>
					</tr>
					<tr>
						<td>„Dieses Semester ist geschützt"</td>
						<td>Das Semester wurde auf „nur lesen" gestellt.</td>
						<td>In der Semesterauswahl oben „Schutz aufheben", wenn du wirklich ändern willst.</td>
					</tr>
					<tr>
						<td>„Dieser Plan ist bereits veröffentlicht"</td>
						<td>Die Veröffentlichungs-E-Mail ist verschickt, Neu-Generieren ist gesperrt.</td>
						<td>
							Von Hand ändern, oder auf der Startseite das Häkchen „… veröffentlicht" zurücknehmen.
						</td>
					</tr>
					<tr>
						<td>„Diese E-Mail wurde bereits verschickt"</td>
						<td>Sammel-E-Mails gehen nur einmal raus.</td>
						<td>
							Nur wenn sie wirklich noch einmal raus soll: das Häkchen des Schritts auf der
							Startseite zurücknehmen.
						</td>
					</tr>
					<tr>
						<td>„Dein Zugang darf nur lesen"</td>
						<td>Dein Konto hat die Rolle VIEWER.</td>
						<td>Eine:n Administrator:in um die Rolle PLANER bitten.</td>
					</tr>
					<tr>
						<td>Knöpfe fehlen oder sind grau</td>
						<td>
							Grau: das Semester ist geschützt oder der Bereich ist nach der Veröffentlichung
							gesperrt. Fehlend: dein Konto darf nur lesen.
						</td>
						<td>Bei grauen Knöpfen mit der Maus darauf zeigen: der Hinweis nennt den Grund.</td>
					</tr>
					<tr>
						<td>Band „Aufbereitete Prüfungen sind veraltet"</td>
						<td>
							Anmeldungen, Nachteilsausgleiche oder Vorgaben wurden seit dem letzten Generieren
							geändert.
						</td>
						<td>
							Auf <a class="link" href="/exam/assembledExams">Aufbereitete Prüfungen</a> neu generieren.
						</td>
					</tr>
					<tr>
						<td>„In Plexams ist ein interner Fehler aufgetreten"</td>
						<td>Ein Fehler im Programm, nicht in deiner Eingabe.</td>
						<td>
							Noch einmal versuchen; sonst mit Uhrzeit und Seite der Plexams-Betreuung melden.
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section id="glossar" class="flex scroll-mt-4 flex-col gap-3">
		<h2 class="text-xl font-semibold">Glossar</h2>
		<dl class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4 text-sm">
			{#each glossary as entry (entry.id)}
				<div id="glossar-{entry.id}" class="scroll-mt-4 rounded target:bg-base-200 target:p-2">
					<dt class="font-semibold">{entry.term}</dt>
					<dd class="text-base-content/80">{entry.long}</dd>
				</div>
			{/each}
		</dl>
	</section>
</div>
