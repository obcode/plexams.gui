<script>
	/**
	 * @typedef {Object} ServerInfo
	 * @property {string} [version]      plexams.go-Version (bringt das führende „v" bereits mit)
	 * @property {string} [commit]       Git-Commit des Backends
	 * @property {string|null} [releaseURL] Link zum GitHub-Release (null bei dev-Build)
	 * @property {string} [mongoHost]     Mongo-Host:Port (Credentials herausgefiltert)
	 * @property {string} [mongoDatabase] Mongo-Datenbank / Semester
	 *
	 * @typedef {Object} Props
	 * @property {string} [guiVersion]           eigene GUI-Version (Buildzeit, aus semantic-release-Tag)
	 * @property {ServerInfo|null} [serverInfo]  Server-Infos vom Backend
	 */

	/** @type {Props} */
	let { guiVersion, serverInfo = null } = $props();

	/**
	 * Eine Version einheitlich als „v1.2.3" darstellen — egal ob die Quelle das
	 * „v" schon mitbringt (Server, Git-Tag) oder nicht (package.json-Platzhalter).
	 * @param {string|null|undefined} raw
	 */
	function display(raw) {
		if (!raw) return null;
		return raw.startsWith('v') ? raw : `v${raw}`;
	}

	/**
	 * Nur ein exakter semantic-release-Tag (v1.2.3) hat ein GitHub-Release; ein
	 * dirty/ahead `git describe` (v1.2.3-4-gabc123, …-dirty) ist ein dev-Build.
	 * @param {string|null|undefined} raw
	 */
	function isReleaseTag(raw) {
		return !!raw && /^v?\d+\.\d+\.\d+$/.test(raw);
	}

	const guiDisplay = $derived(display(guiVersion));
	// Link aufs GUI-Release nur, wenn die Version ein sauberer Tag ist.
	const guiReleaseURL = $derived(
		isReleaseTag(guiVersion)
			? `https://github.com/obcode/plexams.gui/releases/tag/${display(guiVersion)}`
			: null
	);

	const serverDisplay = $derived(display(serverInfo?.version));
</script>

<footer
	class="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-base-300 pt-3 text-xs text-base-content/60"
>
	<!-- Eigene GUI-Version -->
	{#if guiDisplay}
		<span>
			GUI
			{#if guiReleaseURL}
				<a class="link link-hover" href={guiReleaseURL} target="_blank" rel="noopener">
					{guiDisplay}
				</a>
			{:else}
				{guiDisplay}
			{/if}
		</span>
	{/if}

	{#if serverDisplay}
		<span aria-hidden="true">·</span>
		<!-- plexams.go-Version: als Link, wenn ein Release existiert, sonst reiner dev-Build -->
		<span>
			plexams.go
			{#if serverInfo?.releaseURL}
				<a class="link link-hover" href={serverInfo.releaseURL} target="_blank" rel="noopener">
					{serverDisplay}
				</a>
				<span class="opacity-70">(↗ Release)</span>
			{:else}
				<span title={serverInfo?.commit ?? undefined}>{serverDisplay} (dev)</span>
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
