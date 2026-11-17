<script>
	/** @type {{ data: any }} */
	let { data } = $props();

	const curl = $derived(`curl -s ${data.endpoint} \\
  -H "Authorization: Bearer $PLEXAMS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"query":"{ session { email teachers { id fullname } } }"}'`);

	const claudeHint = $derived(`Das Prüfungsplanungs-Portal der FK07 hat eine GraphQL-API unter
${data.endpoint}. Melde dich mit dem Header
"Authorization: Bearer $PLEXAMS_TOKEN" an (das Token steht in der
Umgebungsvariable PLEXAMS_TOKEN). Das Schema kannst du per Introspection
abfragen. Fehler tragen einen festen Code in errors[].extensions.code.
Frage zuerst { session { email teachers { id fullname } } } und
{ inquiries { semester kind open deadline affected } } ab. Meine EXaHM/SEB-Meldungen
liefert preplanSubmissions(semester: "…"). Ändere nichts, ohne mich zu fragen.`);

	const examples = [
		{
			title: 'Offene Abfragen',
			query: '{ inquiries { semester kind open deadline affected nothingToReport } }'
		},
		{
			title: 'Meine EXaHM/SEB-Meldungen',
			query:
				'{ preplanSubmissions(semester: "2027-SS") { id revision withdrawn examKind module programs expectedStudents review reviewNote } }'
		},
		{
			title: 'Eine Prüfung melden (Token mit „Lesen und eintragen“)',
			query:
				'mutation { submitPreplan(semester: "2027-SS", input: { examKind: SEB, module: "Webtechnologien", programs: ["IF"], expectedStudents: 60 }) { id revision } }'
		}
	];
</script>

<h1 class="text-2xl font-semibold">Hilfe zur API</h1>

<p class="mt-2">
	Alles, was das Portal kann, geht auch über eine GraphQL-API. So lassen sich Angaben mit eigenen
	Skripten prüfen – oder mit Claude.
</p>

<h2 class="mt-6 text-lg font-medium">Adresse und Anmeldung</h2>
<ul class="mt-2 list-disc pl-6">
	<li>Adresse: <code class="select-all">{data.endpoint}</code></li>
	<li>
		Anmeldung mit einem persönlichen Token im Header
		<code>Authorization: Bearer plexams_…</code>. Tokens legen Sie unter
		<a class="link" href="/portal/zugang">Zugang für Skripte</a> an.
	</li>
	<li>Wie das Portal selbst nur aus dem Hochschulnetz bzw. über VPN erreichbar.</li>
	<li>
		Ein Token „nur lesen" kann nichts eintragen. Tokens anlegen oder widerrufen geht nur im Browser.
	</li>
	<li>
		Das Schema ist per Introspection abfragbar; Fehler tragen einen festen Code in
		<code>errors[].extensions.code</code>.
	</li>
</ul>

<h2 class="mt-6 text-lg font-medium">Beispiel</h2>
<pre class="mt-2 overflow-x-auto rounded-lg bg-base-200 p-3 text-sm"><code>{curl}</code></pre>

<h2 class="mt-6 text-lg font-medium">Abfragen</h2>
<p class="mt-2 text-sm">
	Jede Operation nennt das Semester ausdrücklich. Eine Änderung braucht die <code>id</code> und die
	zuletzt gelesene <code>revision</code> als <code>expectedRevision</code> – hat sich der Eintrag
	inzwischen geändert, kommt <code>REVISION_CONFLICT</code> und nichts wird geschrieben.
</p>
{#each examples as ex (ex.title)}
	<h3 class="mt-4 text-sm font-medium">{ex.title}</h3>
	<pre class="mt-1 overflow-x-auto rounded-lg bg-base-200 p-3 text-sm whitespace-pre-wrap"><code
			>{ex.query}</code
		></pre>
{/each}

<h2 class="mt-6 text-lg font-medium">Mit Claude</h2>
<p class="mt-2">Setzen Sie das Token als Umgebungsvariable und geben Sie Claude diesen Hinweis:</p>
<pre class="mt-2 overflow-x-auto rounded-lg bg-base-200 p-3 text-sm whitespace-pre-wrap"><code
		>{claudeHint}</code
	></pre>
<p class="mt-2 text-sm text-base-content/70">
	Legen Sie Tokens nie in Dateien ab, die in ein Repository wandern.
</p>
