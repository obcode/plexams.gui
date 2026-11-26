<script>
	// The head of a planner page: title, optional count, and the introduction every
	// page owes a planner who is new to it -- what the page is for, when in the
	// workflow it is due, and what comes next. Longer how-to text goes into the
	// collapsible `howto` snippet so it does not push the page content down.
	//
	//   <PageIntro title="Aufbereitete Prüfungen" count={exams.length} step="assembledExams">
	//     Hier führt Plexams je Prüfung zusammen, …
	//     {#snippet howto()} <ol>…</ol> {/snippet}
	//   </PageIntro>

	/**
	 * @typedef {Object} Props
	 * @property {string} title
	 * @property {number | string} [count] shown as a badge next to the title
	 * @property {string} [subtitle] short qualifier next to the title
	 * @property {string} [help] anchor on /hilfe to link to, e.g. "phase0"
	 * @property {import('svelte').Snippet} [children] the introduction (2-4 sentences)
	 * @property {import('svelte').Snippet} [howto] step-by-step text, collapsed by default
	 * @property {import('svelte').Snippet} [actions] buttons shown right of the title
	 */

	/** @type {Props} */
	let { title, count, subtitle, help, children, howto, actions } = $props();
</script>

<header class="flex flex-col gap-2">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">{title}</h1>
		{#if count !== undefined && count !== null}
			<span class="badge badge-primary badge-lg tabular-nums">{count}</span>
		{/if}
		{#if subtitle}
			<span class="text-sm text-base-content/50">{subtitle}</span>
		{/if}
		{#if actions}
			<div class="flex-1"></div>
			{@render actions()}
		{/if}
	</div>
	{#if children}
		<p class="max-w-3xl text-sm text-base-content/70">
			{@render children()}
			{#if help}
				<a class="link link-hover whitespace-nowrap text-base-content/50" href="/hilfe#{help}">
					Mehr dazu in der Hilfe →
				</a>
			{/if}
		</p>
	{/if}
	{#if howto}
		<details class="max-w-3xl rounded-lg border border-base-300 bg-base-100 text-sm">
			<summary class="cursor-pointer px-3 py-2 font-medium text-base-content/80">
				So gehst du vor
			</summary>
			<div class="prose prose-sm max-w-none px-3 pb-3 text-base-content/80">
				{@render howto()}
			</div>
		</details>
	{/if}
</header>
