<script>
	/**
	 * @typedef {Object} ServerInfo
	 * @property {string} [version]      plexams.go-Version (bringt das führende „v" bereits mit)
	 * @property {string} [commit]       Git-Commit des Backends
	 * @property {string|null} [releaseURL] Link zum GitHub-Release (null bei dev-Build)
	 *
	 * @typedef {Object} Props
	 * @property {string} [guiVersion]           eigene GUI-Version (Buildzeit, aus semantic-release-Tag)
	 * @property {string} [buildTime]            Build-Zeitpunkt (ISO-8601), aus Vite-`define`
	 * @property {ServerInfo|null} [serverInfo]  Server-Infos vom Backend
	 */

	/** @type {Props} */
	let { guiVersion, buildTime, serverInfo = null } = $props();

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
	 * Den zugrunde liegenden semantic-release-Tag extrahieren. `git describe`
	 * hängt bei dev-Builds `-<n>-g<sha>` bzw. `-dirty` an (v1.2.3-4-gabc123) —
	 * das führende v1.2.3 ist trotzdem ein real existierendes Release.
	 * @param {string|null|undefined} raw
	 * @returns {string|null} z. B. „v1.2.3" oder null, wenn kein Tag erkennbar
	 */
	function baseReleaseTag(raw) {
		const m = raw?.match(/^v?(\d+\.\d+\.\d+)/);
		return m ? `v${m[1]}` : null;
	}

	/**
	 * Ist die Version ein exakter Tag (kein `git describe`-Suffix)? Dann verweist
	 * der Link auf genau dieses Release, sonst „basiert auf" (dev-Build).
	 * @param {string|null|undefined} raw
	 */
	function isExactTag(raw) {
		return !!raw && /^v?\d+\.\d+\.\d+$/.test(raw);
	}

	/**
	 * Build-/Release-Zeitpunkt fürs Footer formatieren. Bei einem sauberen
	 * Release-Tag reicht das Datum („Release-Date"); bei Dev-Builds ist die
	 * Uhrzeit nützlich, um denselben Tag mehrfach gebaute Stände zu unterscheiden.
	 * Feste Zeitzone/Locale, damit SSR und Client identisch rendern.
	 * @param {string|null|undefined} iso
	 * @param {boolean} withTime
	 */
	function formatBuildTime(iso, withTime) {
		if (!iso) return null;
		const d = new Date(iso);
		if (isNaN(d.getTime())) return null;
		return new Intl.DateTimeFormat('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
			timeZone: 'Europe/Berlin'
		}).format(d);
	}

	const guiDisplay = $derived(display(guiVersion));
	const guiExact = $derived(isExactTag(guiVersion));
	// Sauberer Tag → nur Datum (Release-Date); Dev-Build → Datum + Uhrzeit.
	const buildDisplay = $derived(formatBuildTime(buildTime, !guiExact));
	// Immer aufs zugehörige GitHub-Release verlinken: bei sauberem Tag auf genau
	// dieses, bei dev-Builds auf das zugrunde liegende Release; ist gar kein Tag
	// erkennbar, auf die Releases-Übersicht.
	const guiReleaseTag = $derived(baseReleaseTag(guiVersion));
	const guiReleaseURL = $derived(
		guiReleaseTag
			? `https://github.com/obcode/plexams.gui/releases/tag/${guiReleaseTag}`
			: 'https://github.com/obcode/plexams.gui/releases'
	);

	const serverDisplay = $derived(display(serverInfo?.version));
</script>

<footer
	class="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-base-300 pt-3 text-xs text-base-content/60"
>
	<!-- Eigene GUI-Version: immer als Link aufs (zugehörige) GitHub-Release -->
	{#if guiDisplay}
		<span>
			plexams.gui
			<a class="link link-hover" href={guiReleaseURL} target="_blank" rel="noopener">
				{guiDisplay}
			</a>
			{#if !guiExact}
				<span class="opacity-70">(dev)</span>
			{/if}
			{#if buildDisplay}
				<span class="opacity-70">— {buildDisplay}</span>
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
			{:else}
				<span title={serverInfo?.commit ?? undefined}>{serverDisplay} (dev)</span>
			{/if}
		</span>
	{/if}
</footer>
