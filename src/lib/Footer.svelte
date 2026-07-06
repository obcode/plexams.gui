<script>
	/**
	 * @typedef {Object} ServerInfo
	 * @property {string} [version]      plexams.go-Version
	 * @property {string} [commit]       Git-Commit des Backends
	 * @property {string|null} [releaseURL] Link zum GitHub-Release (null bei dev-Build)
	 * @property {string} [mongoHost]     Mongo-Host:Port (Credentials herausgefiltert)
	 * @property {string} [mongoDatabase] Mongo-Datenbank / Semester
	 *
	 * @typedef {Object} Props
	 * @property {string} [guiVersion]           eigene GUI-Version (aus package.json)
	 * @property {ServerInfo|null} [serverInfo]  Server-Infos vom Backend
	 */

	/** @type {Props} */
	let { guiVersion, serverInfo = null } = $props();

	// Link auf das GUI-GitHub-Release (Tag folgt der package.json-Version).
	const guiReleaseURL = $derived(
		guiVersion ? `https://github.com/obcode/plexams.gui/releases/tag/v${guiVersion}` : null
	);
</script>

<footer
	class="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-base-300 pt-3 text-xs text-base-content/60"
>
	<!-- Eigene GUI-Version -->
	{#if guiVersion}
		<span>
			GUI
			{#if guiReleaseURL}
				<a class="link link-hover" href={guiReleaseURL} target="_blank" rel="noopener">
					v{guiVersion}
				</a>
			{:else}
				v{guiVersion}
			{/if}
		</span>
	{/if}

	{#if serverInfo?.version}
		<span aria-hidden="true">·</span>
		<!-- plexams.go-Version: als Link, wenn ein Release existiert, sonst reiner dev-Build -->
		<span>
			plexams.go
			{#if serverInfo.releaseURL}
				<a class="link link-hover" href={serverInfo.releaseURL} target="_blank" rel="noopener">
					v{serverInfo.version}
				</a>
				<span class="opacity-70">(↗ Release)</span>
			{:else}
				<span title={serverInfo.commit ?? undefined}>v{serverInfo.version} (dev)</span>
			{/if}
		</span>
	{/if}

	{#if serverInfo?.mongoHost || serverInfo?.mongoDatabase}
		<span aria-hidden="true">·</span>
		<!-- Mongo-Verbindung: Host / Datenbank (Credentials werden backendseitig entfernt) -->
		<span>
			mongo:
			{#if serverInfo.mongoHost && serverInfo.mongoDatabase}
				{serverInfo.mongoHost} / {serverInfo.mongoDatabase}
			{:else}
				{serverInfo.mongoHost || serverInfo.mongoDatabase}
			{/if}
		</span>
	{/if}
</footer>
