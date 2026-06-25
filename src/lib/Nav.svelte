<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		validationSummary,
		validationDots,
		runValidationCheck,
		zpaSummary,
		runZpaCheck
	} from '$lib/validation/store';

	function dotClass(level: string) {
		if (level === 'ok') return 'bg-success';
		if (level === 'warning') return 'bg-warning';
		if (level === 'error') return 'bg-error';
		return 'bg-base-content/30';
	}

	function pillBorder(level: string) {
		if (level === 'ok') return 'border-success/40';
		if (level === 'warning') return 'border-warning/40';
		if (level === 'error') return 'border-error/40';
		return 'border-base-300';
	}

	function ago(ts: number | null) {
		if (!ts) return 'noch nicht geprüft';
		const sec = Math.round((Date.now() - ts) / 1000);
		if (sec < 60) return 'gerade eben';
		const min = Math.round(sec / 60);
		if (min < 60) return `vor ${min} Min.`;
		const h = Math.round(min / 60);
		if (h < 24) return `vor ${h} Std.`;
		return `vor ${Math.round(h / 24)} Tg.`;
	}

	function statusTitle(
		name: string,
		s: {
			level: string;
			errors: number;
			warnings: number;
			ts: number | null;
			partial: boolean;
		}
	) {
		const base = s.ts ? `zuletzt geprüft ${ago(s.ts)}` : 'noch nicht geprüft';
		const counts = s.level === 'unknown' ? '' : ` — ${s.errors} Fehler, ${s.warnings} Warnungen`;
		const part = s.partial && s.ts ? ' (unvollständig)' : '';
		return `${name}: ${base}${counts}${part} · klicken zum Prüfen`;
	}

	let semester = 'unknown';
	async function getSemester() {
		const response = await fetch('/api/semester', { method: 'GET' });
		semester = await response.json();
	}

	onMount(() => {
		getSemester();
	});

	type MenuLink = { href: string; label: string };
	// Ein Menüeintrag ist entweder ein Link oder eine Abschnittsüberschrift (Trenner).
	type MenuItem = MenuLink | { section: string };
	type Menu = { label: string; items: MenuItem[] };

	const isLink = (i: MenuItem): i is MenuLink => 'href' in i;

	const menus: Menu[] = [
		{
			label: 'Vorbereitung',
			items: [
				{ section: 'ZPA-Prüfungen' },
				{ href: '/exam/examsToPlan', label: '📝 ZPA-Prüfungen planen' },
				{ href: '/exam/examersToPlan', label: '🧑‍🏫 Zu planende Prüfende' },
				{ section: 'Constraints & Computer-Prüfungen' },
				{ href: '/exam/constraints', label: '📌 Constraints (Übersicht)' },
				{ href: '/exam/kdp', label: '💻 EXaHM/SEB' },
				{ href: '/preplan', label: '🖥️ SEB/EXaHM-Vorplanung' },
				{ section: 'Anmeldungen' },
				{ href: '/exam/connected', label: '🔗 Anmeldungszuordnung (ZPA/Primuss)' }
			]
		},
		{
			label: 'Terminplanung',
			items: [
				{ href: '/exam/generatedExams', label: '📋 generierte Prüfungen mit Anmeldungen, etc.' },
				{ href: '/plan/pre', label: '🔮 Vorab-Planung (ohne Primuss-Daten)' },
				{ href: '/plan/exams', label: '🗓️ Prüfungen planen' },
				{ href: '/plan/exams/validate', label: '✅ Validierung' }
			]
		},
		{
			label: 'Raumplanung',
			items: [
				{ href: '/plan/rooms', label: '🏢 Raumplanung' },
				{ href: '/plan/kdprooms', label: '💻 Anny-Anforderungen (KDP)' },
				{ href: '/plan/roomRequests', label: '🛠️ Gebäudemanagement-Anforderungen' },
				{ href: '/plan/rooms/validate', label: '✅ Validierung' }
			]
		},
		{
			label: 'Aufsichtenplanung',
			items: [
				{ href: '/plan/invigilation/planning', label: '👀 Anforderungen und Planung' },
				{ href: '/plan/invigilation/constraints', label: '📌 Aufsichts-Constraints' },
				{ href: '/plan/invigilation', label: '⏰ Zeitplan' },
				{ href: '/plan/invigilation/generate', label: '✨ Generierung' },
				{ href: '/plan/invigilation/validate', label: '✅ Validierung' }
			]
		},
		{
			label: 'E-Mails',
			items: [
				{ href: '/email', label: '📧 E-Mails versenden' },
				{ href: '/email/attachments', label: '📎 Anhänge (Deckblätter, Bilder)' }
			]
		},
		{
			label: 'Semesterdaten',
			items: [
				{ section: 'ZPA' },
				{ href: '/zpa/publish', label: '📥 ZPA-Import & Veröffentlichung' },
				{ href: '/zpa/exams', label: '📋 Prüfungsliste (ZPA)' },
				{ href: '/zpa/teacher', label: '👥 Dozierende & Aufsichten (ZPA)' },
				{ href: '/zpa/studentregs', label: '⚠️ Importfehler Anmeldungen (ZPA)' },
				{ section: 'Primuss' },
				{ href: '/primuss/mucdai', label: '💻 MUC.DAI-Prüfungen' },
				{ href: '/primuss/exams', label: '🧾 Primuss-Anmeldedaten' },
				{ section: 'Weitere' },
				{ href: '/plan/annyBookings', label: '📅 Anny-Buchungen' },
				{ href: '/nta/semester', label: '♿ NTA' },
				{ section: 'Konfiguration' },
				{ href: '/config', label: '⚙️ Semester-Konfiguration' },
				{ href: '/config/new', label: '➕ Neues Semester anlegen' }
			]
		},
		{
			label: 'Stammdaten',
			items: [
				{ href: '/studyprograms', label: '🎓 Studiengänge' },
				{ href: '/rooms', label: '🚪 Räume' },
				{ href: '/nta/all', label: '♿ NTAs' },
				{ href: '/invigilators', label: '👀 Aufsichten' }
			]
		}
	];

	// Aktiver Pfad: der am besten passende (längste) Treffer unter allen Links —
	// so gewinnt z. B. /plan/invigilation/generate gegen /plan/invigilation.
	function matchLen(href: string, path: string) {
		if (path === href) return href.length + 1;
		if (href !== '/' && path.startsWith(href + '/')) return href.length;
		return 0;
	}

	$: pathname = $page.url.pathname;
	$: activeHref = menus
		.flatMap((m) => m.items.filter(isLink).map((i) => i.href))
		.reduce(
			(best, href) => (matchLen(href, pathname) > matchLen(best, pathname) ? href : best),
			''
		);
	$: activeMenu =
		menus.find((m) => m.items.some((i) => isLink(i) && i.href === activeHref))?.label ?? '';

	const themes = [
		'light',
		'dark',
		'cupcake',
		'bumblebee',
		'emerald',
		'corporate',
		'synthwave',
		'retro',
		'cyberpunk',
		'valentine',
		'halloween',
		'garden',
		'forest',
		'aqua',
		'lofi',
		'pastel',
		'fantasy',
		'wireframe',
		'black',
		'luxury',
		'dracula',
		'cmyk',
		'autumn',
		'business',
		'acid',
		'lemonade',
		'night',
		'coffee',
		'winter',
		'dim',
		'nord',
		'sunset'
	];
</script>

<header
	class="sticky top-0 z-50 border-b border-base-300/60 bg-base-100/80 backdrop-blur-md supports-[backdrop-filter]:bg-base-100/70"
>
	<div class="mx-auto flex h-16 items-center gap-2 px-3">
		<!-- Brand -->
		<a href="/" class="group flex items-center gap-2 rounded-xl px-1 py-1">
			<span
				class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-lg font-black text-primary-content shadow-sm transition-transform group-hover:scale-105"
			>
				P
			</span>
			<span
				class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-bold tracking-tight text-transparent"
			>
				Plexams
			</span>
		</a>

		<!-- Hauptmenü (Desktop) -->
		<nav class="ml-2 hidden items-center gap-0.5 lg:flex">
			{#each menus as menu}
				<div class="dropdown dropdown-bottom">
					<div
						tabindex="0"
						role="button"
						class="btn btn-ghost btn-sm gap-1 rounded-full font-medium hover:bg-base-200 {menu.label ===
						activeMenu
							? 'bg-primary/10 text-primary'
							: 'text-base-content/70 hover:text-base-content'}"
					>
						{menu.label}
						<svg
							class="h-3 w-3 opacity-50"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
						</svg>
					</div>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<ul
						tabindex="0"
						class="menu dropdown-content z-50 mt-3 w-64 gap-0.5 rounded-2xl border border-base-200 bg-base-100 p-2 shadow-xl"
					>
						{#each menu.items as item}
							{#if isLink(item)}
								<li>
									<a
										class="rounded-lg {item.href === activeHref
											? 'bg-primary/15 font-medium text-primary'
											: ''}"
										href={item.href}>{item.label}</a
									>
								</li>
							{:else}
								<li class="menu-title px-2 pt-2 pb-0.5 text-xs">{item.section}</li>
							{/if}
						{/each}
					</ul>
				</div>
			{/each}
		</nav>

		<div class="flex-1"></div>

		<!-- Validierungs-Pille mit Status -->
		<div
			class="flex items-center gap-0.5 rounded-full border bg-base-100 p-0.5 {pillBorder(
				$validationSummary.level
			)}"
		>
			<a
				class="btn btn-ghost btn-sm rounded-full font-medium hover:text-base-content {pathname ===
				'/validate'
					? 'bg-primary/10 text-primary'
					: 'text-base-content/80'}"
				href="/validate"
			>
				Validierung
			</a>
			<button
				class="btn btn-ghost btn-sm gap-1 px-2"
				aria-label="Validierung jetzt prüfen"
				on:click={runValidationCheck}
			>
				{#each $validationDots as d}
					<span
						class="inline-block h-2.5 w-2.5 rounded-full {d.running
							? 'animate-pulse bg-info'
							: dotClass(d.level)}"
						class:animate-pulse={d.level === 'error'}
						title={statusTitle(d.title, d)}
					></span>
				{/each}
			</button>
		</div>

		<!-- ZPA-Pille mit eigener Status-Ampel -->
		<div
			class="flex items-center gap-0.5 rounded-full border bg-base-100 p-0.5 {pillBorder(
				$zpaSummary.level
			)}"
		>
			<a
				class="btn btn-ghost btn-sm rounded-full font-medium hover:text-base-content {pathname ===
				'/zpa/publish'
					? 'bg-primary/10 text-primary'
					: 'text-base-content/80'}"
				href="/zpa/publish"
			>
				ZPA
			</a>
			<button
				class="btn btn-ghost btn-sm btn-circle"
				title={statusTitle('ZPA-Validierung', $zpaSummary)}
				aria-label="ZPA jetzt prüfen"
				on:click={runZpaCheck}
			>
				{#if $zpaSummary.running}
					<span class="loading loading-spinner loading-xs"></span>
				{:else}
					<span
						class="inline-block h-2.5 w-2.5 rounded-full {dotClass($zpaSummary.level)}"
						class:animate-pulse={$zpaSummary.level === 'error'}
					></span>
				{/if}
			</button>
		</div>

		<!-- Theme-Auswahl -->
		<div class="dropdown dropdown-end">
			<div
				tabindex="0"
				role="button"
				class="btn btn-ghost btn-sm btn-circle"
				title="Theme wählen"
				aria-label="Theme wählen"
			>
				<svg
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9.53 16.12a3 3 0 0 0-5.78 1.13 2.25 2.25 0 0 1-2.4 2.24 4.5 4.5 0 0 0 8.4-2.24c0-.4-.08-.78-.22-1.13Zm0 0a16 16 0 0 0 3.39-1.62m-5.04-.03a16 16 0 0 1 1.62-3.39m3.42 3.42a16 16 0 0 0 4.76-4.65l3.88-5.81a1.15 1.15 0 0 0-1.6-1.6l-5.81 3.88a16 16 0 0 0-4.65 4.76m3.42 3.42a6.78 6.78 0 0 0-3.42-3.42"
					/>
				</svg>
			</div>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<ul
				tabindex="0"
				class="menu dropdown-content z-50 mt-3 max-h-96 w-44 flex-nowrap gap-0.5 overflow-y-auto rounded-2xl border border-base-200 bg-base-100 p-2 shadow-xl"
			>
				{#each themes as theme}
					<li>
						<button
							class="rounded-lg capitalize"
							data-set-theme={theme}
							data-act-class="font-semibold"
						>
							{theme}
						</button>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Semester -->
		<span
			class="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary sm:inline-flex"
		>
			<span class="inline-block h-1.5 w-1.5 rounded-full bg-primary"></span>
			{semester}
		</span>

		<!-- Hamburger (Mobile/Tablet) -->
		<div class="dropdown dropdown-end lg:hidden">
			<div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-circle" aria-label="Menü">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</div>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<ul
				tabindex="0"
				class="menu dropdown-content z-50 mt-3 max-h-[80vh] w-72 flex-nowrap gap-0.5 overflow-y-auto rounded-2xl border border-base-200 bg-base-100 p-2 shadow-xl"
			>
				{#each menus as menu}
					<li>
						<details open={menu.label === activeMenu}>
							<summary class="font-medium {menu.label === activeMenu ? 'text-primary' : ''}"
								>{menu.label}</summary
							>
							<ul>
								{#each menu.items as item}
									{#if isLink(item)}
										<li>
											<a
												class={item.href === activeHref
													? 'bg-primary/15 font-medium text-primary'
													: ''}
												href={item.href}>{item.label}</a
											>
										</li>
									{:else}
										<li class="menu-title px-2 pt-2 pb-0.5 text-xs">{item.section}</li>
									{/if}
								{/each}
							</ul>
						</details>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</header>
