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
Frage zuerst { session { email teachers { id fullname } } } ab.`);
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

<h2 class="mt-6 text-lg font-medium">Mit Claude</h2>
<p class="mt-2">Setzen Sie das Token als Umgebungsvariable und geben Sie Claude diesen Hinweis:</p>
<pre class="mt-2 overflow-x-auto rounded-lg bg-base-200 p-3 text-sm whitespace-pre-wrap"><code
		>{claudeHint}</code
	></pre>
<p class="mt-2 text-sm text-base-content/70">
	Legen Sie Tokens nie in Dateien ab, die in ein Repository wandern.
</p>
