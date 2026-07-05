<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		validationSummary,
		validationDots,
		runValidationCheck,
		zpaSummary,
		runZpaCheck
	} from '$lib/validation/store';
	import { assembledExamsState, checkAssembledExams } from '$lib/assembledExams/store';
	import { studentRegsState, checkStudentRegs } from '$lib/studentRegs/store';

	/** @param {string | null} iso */
	function fmtChangedAt(iso: string | null) {
		if (!iso) return '';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		return d.toLocaleString('de-DE', {
			timeZone: 'Europe/Berlin',
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

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

	type Sem = {
		id: string;
		semester: string;
		compatible: boolean;
		readOnly: boolean;
		schemaVersion: number | null;
	};
	let semester = $state('unknown');
	let currentSem = $state<Sem | null>(null);
	let allSemesters = $state<Sem[]>([]);
	// read-only kommt SSR-korrekt aus dem Layout-load ($page.data); der Client-Fetch
	// liefert nur noch die Auswahlliste fürs Dropdown.
	let readOnly = $derived(page.data?.readOnly ?? currentSem?.readOnly ?? false);
	// logisches Semester, falls es vom DB-Label abweicht (Test-DB → echtes Semester)
	let logicalSem = $derived(
		currentSem?.semester && currentSem.semester !== currentSem.id ? currentSem.semester : ''
	);
	async function getSemester() {
		const response = await fetch('/api/semester/semesters', { method: 'GET' });
		const d = await response.json().catch(() => ({}));
		if (d?.current) {
			currentSem = d.current;
			semester = d.current.id;
		}
		if (Array.isArray(d?.all)) allSemesters = d.all;
	}

	// DB-Schutz (read-only) umschalten → bei Erfolg neu laden
	let togglingReadOnly = $state(false);
	async function toggleReadOnly(value: boolean) {
		if (togglingReadOnly) return;
		togglingReadOnly = true;
		semesterError = '';
		semesterErrorTitle = 'Schutz ändern fehlgeschlagen';
		try {
			const res = await fetch('/api/semester/setSemesterReadOnly', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ readOnly: value })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				semesterError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			window.location.reload();
		} catch (e) {
			semesterError = e instanceof Error ? e.message : String(e);
		} finally {
			togglingReadOnly = false;
		}
	}

	// Semester umschalten → bei Erfolg alles neu laden (graphql-request hat keinen
	// Cache; ein voller Reload entspricht client.resetStore()).
	let switchingSemester = $state(false);
	let semesterError = $state('');
	let semesterErrorTitle = $state('Aktion fehlgeschlagen');

	// Workspace = Datenbank. id ist der DB-Name (Schaltschlüssel), semester das
	// logische Semester (Anzeige). schemaVersion == null ⇒ DB ohne Daten.
	/** @param s {Sem} */
	const noData = (s: Sem | null) => !!s && s.compatible && s.schemaVersion == null;

	/**
	 * @param name DB-Name (= id aus allSemesterNames)
	 * @param override optionaler logischer Semester-Override (nur für noch nicht
	 *   gestempelte DB)
	 */
	async function switchSemester(name: string, override?: string) {
		if (switchingSemester) return;
		if (!override && name === currentSem?.id) return;
		switchingSemester = true;
		semesterError = '';
		semesterErrorTitle = 'Semesterwechsel fehlgeschlagen';
		try {
			const res = await fetch('/api/semester/setSemester', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name, semester: override || null })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				semesterError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			window.location.reload();
		} catch (e) {
			semesterError = e instanceof Error ? e.message : String(e);
		} finally {
			switchingSemester = false;
		}
	}

	// Neuen Test-Workspace (DB) anlegen und hineinwechseln.
	let wsOpen = $state(false);
	let wsName = $state('');
	let wsFromSemester = $state('');
	let wsCreating = $state(false);
	let wsNameValid = $derived(/^[A-Za-z0-9 _-]+$/.test(wsName.trim()));

	function openNewWorkspace() {
		wsName = '';
		wsFromSemester = currentSem?.id ?? allSemesters[0]?.id ?? '';
		semesterError = '';
		wsOpen = true;
	}
	async function createWorkspace() {
		if (wsCreating || !wsNameValid || !wsFromSemester) return;
		wsCreating = true;
		semesterError = '';
		semesterErrorTitle = 'Workspace anlegen fehlgeschlagen';
		try {
			const res = await fetch('/api/semester/createWorkspace', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ database: wsName.trim(), fromSemester: wsFromSemester })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) {
				semesterError = d?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			// angelegt → dorthin wechseln (setSemester + voller Reload)
			wsOpen = false;
			await switchSemester(wsName.trim());
		} catch (e) {
			semesterError = e instanceof Error ? e.message : String(e);
		} finally {
			wsCreating = false;
		}
	}

	function checkStaleStates() {
		checkAssembledExams();
		checkStudentRegs();
	}

	// aktuell aktives Theme (von theme-change als data-theme am <html> gesetzt),
	// damit der Umschalter es anzeigen und im Dropdown markieren kann.
	let currentTheme = $state('');

	onMount(() => {
		getSemester();
		// „… veraltet?" — beim Laden, bei Tab-Fokus und im leichten Intervall
		// prüfen (reine Read-Queries, nicht write-gelockt).
		checkStaleStates();
		const onFocus = () => checkStaleStates();
		window.addEventListener('focus', onFocus);
		const iv = setInterval(checkStaleStates, 20000);

		// theme-change setzt data-theme am <html>; per Observer live spiegeln.
		const readTheme = () => {
			currentTheme = document.documentElement.getAttribute('data-theme') ?? '';
		};
		readTheme();
		const themeObserver = new MutationObserver(readTheme);
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

		return () => {
			window.removeEventListener('focus', onFocus);
			clearInterval(iv);
			themeObserver.disconnect();
		};
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
				{ section: 'SEB/EXaHM-Prüfungen' },
				{ href: '/preplan', label: '🖥️ SEB/EXaHM-Vorplanung' },
				{ section: 'ZPA-Prüfungen' },
				{ href: '/exam/examsToPlan', label: '📝 ZPA-Prüfungen planen' },
				{ href: '/exam/examersToPlan', label: '🧑‍🏫 Zu planende Prüfende' },
				{ section: 'Anmeldungen' },
				{ href: '/exam/connected', label: '🔗 Anmeldungszuordnung (ZPA/Primuss)' },
				{ href: '/exam/assembledExams', label: '📋 Aufbereitete Prüfungen' }
			]
		},
		{
			label: 'Terminplanung',
			items: [
				{ href: '/plan/exams', label: '🗓️ Terminplanung' },
				{ href: '/plan/exams/roomsphase', label: '🏗️ EXaHM/SEB in T-Bau (Phase A)' },
				{ href: '/plan/exams/generate', label: '✨ Terminplan generieren (Phase B)' },
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
				{ href: '/plan/invigilation/generate', label: '✨ Einteilung' },
				{ href: '/plan/invigilation/validate', label: '✅ Validierung' }
			]
		},
		{
			label: 'E-Mails',
			items: [
				{ href: '/email', label: '📧 E-Mails versenden' },
				{ href: '/email/attachments', label: '📎 Anhänge (Deckblätter, Bilder)' },
				{ href: '/email/specialInterests', label: '⭐ Special Interests' }
			]
		},
		{
			label: 'Semesterdaten',
			items: [
				{ section: 'ZPA' },
				{ href: '/zpa/publish', label: '📥 ZPA-Import & Veröffentlichung' },
				{ href: '/zpa/additionalExams', label: '➕ Zusätzliche Prüfungen' },
				{ href: '/zpa/teacher', label: '👥 Dozierende & Aufsichten (ZPA)' },
				{ section: 'Primuss' },
				{ href: '/primuss/mucdai', label: '💻 MUC.DAI-Prüfungen' },
				{ href: '/primuss/exams', label: '🧾 Primuss-Anmeldedaten' },
				{ href: '/students', label: '🎓 Studierende' },
				{ section: 'Weitere' },
				{ href: '/exam/external', label: '🌐 Prüfungen anderer FKs (MUC.DAI & nicht von mir)' },
				{ href: '/rooms/annyBookings', label: '📅 Anny-Buchungen' },
				{ href: '/nta/semester', label: '♿ NTA' },
				{ href: '/log', label: '🧾 Mutations-Log' },
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
				{ href: '/invigilators', label: '👀 Permanente Nicht-Aufsichten' }
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

	let pathname = $derived(page.url.pathname);
	// bei jedem Seitenwechsel den „veraltet"-Zustand neu prüfen (im SPA feuert
	// window.focus nicht, und der Intervall hätte bis zu 20 s Latenz)
	let lastCheckedPath = $state('');
	$effect(() => {
		if (pathname && pathname !== lastCheckedPath) {
			lastCheckedPath = pathname;
			checkStaleStates();
		}
	});
	let activeHref = $derived(
		menus
			.flatMap((m) => m.items.filter(isLink).map((i) => i.href))
			.reduce(
				(best, href) => (matchLen(href, pathname) > matchLen(best, pathname) ? href : best),
				''
			)
	);
	let activeMenu = $derived(
		menus.find((m) => m.items.some((i) => isLink(i) && i.href === activeHref))?.label ?? ''
	);

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
				onclick={runValidationCheck}
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
				onclick={runZpaCheck}
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
				class="btn btn-ghost btn-sm gap-1"
				title="Theme wählen — aktuell: {currentTheme}"
				aria-label="Theme wählen, aktuell {currentTheme}"
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
				<span class="hidden capitalize md:inline">{currentTheme}</span>
			</div>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<ul
				tabindex="0"
				class="menu dropdown-content z-50 mt-3 max-h-96 w-44 flex-nowrap gap-0.5 overflow-y-auto rounded-2xl border border-base-200 bg-base-100 p-2 shadow-xl"
			>
				{#each themes as theme}
					<li>
						<button
							class="flex items-center justify-between rounded-lg capitalize {theme === currentTheme
								? 'bg-primary font-semibold text-primary-content'
								: ''}"
							data-set-theme={theme}
							onclick={() => (currentTheme = theme)}
						>
							<span>{theme}</span>
							{#if theme === currentTheme}<span aria-hidden="true">✓</span>{/if}
						</button>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Semester-Umschalter -->
		<div class="dropdown dropdown-end hidden sm:block">
			<div
				tabindex="0"
				role="button"
				title="Semester wechseln"
				class="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
			>
				<span class="inline-block h-1.5 w-1.5 rounded-full bg-primary"></span>
				{#if switchingSemester}
					<span class="loading loading-spinner loading-xs"></span>
				{/if}
				<span class="tabular-nums">{semester}</span>
				{#if logicalSem}<span class="opacity-70" title="logisches Semester">· {logicalSem}</span
					>{/if}
				{#if noData(currentSem)}<span class="text-warning" title="DB ohne Daten">· ⚠</span>{/if}
				{#if readOnly}<span title="nur lesen (read-only)">🔒</span>{/if}
				<svg
					class="h-3 w-3 opacity-60"
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
				class="menu dropdown-content z-50 mt-3 max-h-96 w-64 flex-nowrap gap-0.5 overflow-y-auto rounded-2xl border border-base-200 bg-base-100 p-2 shadow-xl"
			>
				{#each allSemesters as s}
					<li>
						{#if !s.compatible}
							<span class="rounded-lg text-base-content/30" title="inkompatibel (keine Config)">
								<span class="font-medium tabular-nums">{s.id}</span>
								<span class="text-warning">⚠ inkompatibel</span>
							</span>
						{:else}
							<button
								class="flex flex-col items-start gap-0 rounded-lg {s.id === semester
									? 'bg-primary/15 text-primary'
									: ''}"
								disabled={switchingSemester}
								onclick={() => switchSemester(s.id)}
							>
								<span class="flex items-center gap-1">
									<span class="font-medium tabular-nums">{s.id}</span>
									{#if s.readOnly}<span title="nur lesen (read-only)">🔒</span>{/if}
								</span>
								<span class="text-xs text-base-content/50">
									{#if s.semester}Semester {s.semester}{:else}— kein Semester{/if}
									{#if noData(s)}· <span class="text-warning">⚠ keine Daten</span>{/if}
								</span>
							</button>
						{/if}
					</li>
				{/each}

				<li class="menu-title px-2 pt-2 pb-0.5 text-xs">Schutz</li>
				<li>
					{#if readOnly}
						<button
							class="rounded-lg"
							disabled={togglingReadOnly}
							onclick={() => toggleReadOnly(false)}>🔓 Schutz aufheben</button
						>
					{:else}
						<button
							class="rounded-lg"
							disabled={togglingReadOnly}
							onclick={() => toggleReadOnly(true)}>🔒 Diese DB schützen</button
						>
					{/if}
				</li>

				<li class="menu-title px-2 pt-2 pb-0.5 text-xs">Workspace</li>
				<li>
					<button class="rounded-lg" disabled={switchingSemester} onclick={openNewWorkspace}>
						🧪 Neuen Workspace anlegen …
					</button>
				</li>
			</ul>
		</div>

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

	<!-- Banner: Vorbereitung veraltet (aufbereitete Prüfungen und/oder StudentRegs) -->
	{#if $assembledExamsState.dirty || $studentRegsState.dirty}
		{@const reason = $assembledExamsState.dirty
			? $assembledExamsState.reason
			: $studentRegsState.reason}
		{@const changedAt = $assembledExamsState.dirty
			? $assembledExamsState.changedAt
			: $studentRegsState.changedAt}
		<div
			class="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-warning/40 bg-warning/15 px-3 py-1.5 text-sm text-warning-content"
		>
			<span>⚠</span>
			<span class="font-medium">
				{#if $assembledExamsState.dirty && $studentRegsState.dirty}
					Aufbereitete Prüfungen &amp; StudentRegs sind veraltet
				{:else if $assembledExamsState.dirty}
					Aufbereitete Prüfungen sind veraltet
				{:else}
					StudentRegs sind veraltet
				{/if}
			</span>
			{#if reason}<span class="opacity-70">— zuletzt: {reason}</span>{/if}
			{#if changedAt}<span class="opacity-60">· {fmtChangedAt(changedAt)}</span>{/if}
			<div class="flex-1"></div>
			<a class="btn btn-warning btn-xs" href="/exam/assembledExams">→ Generieren</a>
		</div>
	{/if}

	<!-- Banner: Semester read-only -->
	{#if readOnly}
		<div
			class="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-error/40 bg-error/15 px-3 py-1.5 text-sm text-error-content"
		>
			<span>🔒</span>
			<span class="font-medium">Dieses Semester ist geschützt (nur lesen)</span>
			<span class="opacity-70">— Schreibvorgänge werden vom Backend abgelehnt.</span>
			<div class="flex-1"></div>
			<button
				class="btn btn-error btn-xs"
				disabled={togglingReadOnly}
				onclick={() => toggleReadOnly(false)}
			>
				{togglingReadOnly ? '…' : 'Schutz aufheben'}
			</button>
		</div>
	{/if}
</header>

<!-- Neuen Test-Workspace (DB) anlegen -->
{#if wsOpen}
	<div class="modal modal-open">
		<div class="modal-box max-w-md">
			<h2 class="text-lg font-semibold">Neuen Workspace anlegen</h2>
			<p class="mt-1 text-sm text-base-content/60">
				Legt eine neue (leere) Datenbank an, die auf einem vorhandenen Semester basiert. Danach wird
				direkt hineingewechselt — die Daten müssen noch importiert werden. Funktioniert auch,
				während das Quell-Semester geschützt ist.
			</p>
			<div class="mt-3 flex flex-col gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Name der neuen DB</span>
					<input
						type="text"
						class="input input-bordered input-sm"
						bind:value={wsName}
						placeholder="z. B. test-v2"
					/>
					{#if wsName.trim() && !wsNameValid}
						<span class="text-xs text-error">
							Erlaubt: Buchstaben, Ziffern, Leerzeichen, „-" und „_".
						</span>
					{/if}
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">für Semester</span>
					<select class="select select-bordered select-sm" bind:value={wsFromSemester}>
						{#each allSemesters as s}
							<option value={s.id} disabled={!s.compatible}>
								{s.id}{s.semester ? ` · ${s.semester}` : ''}{!s.compatible ? ' (inkompatibel)' : ''}
							</option>
						{/each}
					</select>
				</label>
			</div>
			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" onclick={() => (wsOpen = false)}>Abbrechen</button>
				<button
					class="btn btn-primary btn-sm"
					disabled={wsCreating || switchingSemester || !wsNameValid || !wsFromSemester}
					onclick={createWorkspace}
				>
					{wsCreating || switchingSemester ? 'legt an …' : 'anlegen & wechseln'}
				</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" onclick={() => (wsOpen = false)}></button>
	</div>
{/if}

<!-- Semester-Wechsel: Fehler-Dialog -->
{#if semesterError}
	<div class="modal modal-open">
		<div class="modal-box">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				<span class="badge badge-error badge-sm">Fehler</span>
				{semesterErrorTitle}
			</h2>
			<p class="mt-3 font-mono text-sm break-words whitespace-pre-wrap">{semesterError}</p>
			<div class="modal-action">
				<button class="btn btn-sm" onclick={() => (semesterError = '')}>schließen</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" onclick={() => (semesterError = '')}
		></button>
	</div>
{/if}
