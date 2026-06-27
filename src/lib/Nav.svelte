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
	import {
		generatedExamsState,
		regenerating,
		checkGeneratedExams,
		regenerateGeneratedExams
	} from '$lib/generatedExams/store';
	import {
		studentRegsState,
		regeneratingStudents,
		checkStudentRegs,
		regenerateStudentRegs
	} from '$lib/studentRegs/store';

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

	// Ergebnis-Toast / Fehler-Dialog des Banner-Buttons
	let genResult: { changes: any[] } | null = null;
	let genError = '';
	const KIND_BADGE: Record<string, string> = {
		added: 'badge-success',
		removed: 'badge-error',
		changed: 'badge-warning'
	};
	const KIND_LABEL: Record<string, string> = {
		added: 'neu',
		removed: 'entfernt',
		changed: 'geändert'
	};

	async function runRegenerate() {
		genError = '';
		const { changes, error } = await regenerateGeneratedExams();
		if (error) {
			genError = error;
			return;
		}
		genResult = { changes };
	}

	// StudentRegs: Ergebnis-Toast / Fehler-Dialog
	let stuResult: { studentCount: number } | null = null;
	let stuError = '';
	async function runRegenerateStudents() {
		stuError = '';
		const { studentCount, error } = await regenerateStudentRegs();
		if (error) {
			stuError = error;
			return;
		}
		stuResult = { studentCount };
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
	let semester = 'unknown';
	let currentSem: Sem | null = null;
	let allSemesters: Sem[] = [];
	// read-only kommt SSR-korrekt aus dem Layout-load ($page.data); der Client-Fetch
	// liefert nur noch die Auswahlliste fürs Dropdown.
	$: readOnly = ($page.data?.readOnly ?? currentSem?.readOnly) ?? false;
	// logisches Semester, falls es vom DB-Label abweicht (Test-DB → echtes Semester)
	$: logicalSem =
		currentSem?.semester && currentSem.semester !== currentSem.id ? currentSem.semester : '';
	async function getSemester() {
		const response = await fetch('/api/semesters', { method: 'GET' });
		const d = await response.json().catch(() => ({}));
		if (d?.current) {
			currentSem = d.current;
			semester = d.current.id;
		}
		if (Array.isArray(d?.all)) allSemesters = d.all;
	}

	// DB-Schutz (read-only) umschalten → bei Erfolg neu laden
	let togglingReadOnly = false;
	async function toggleReadOnly(value: boolean) {
		if (togglingReadOnly) return;
		togglingReadOnly = true;
		semesterError = '';
		try {
			const res = await fetch('/api/setSemesterReadOnly', {
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
	let switchingSemester = false;
	let semesterError = '';

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
		try {
			const res = await fetch('/api/setSemester', {
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
	let wsOpen = false;
	let wsName = '';
	let wsFromSemester = '';
	let wsCreating = false;
	$: wsNameValid = /^[A-Za-z0-9 _-]+$/.test(wsName.trim());

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
		try {
			const res = await fetch('/api/createWorkspace', {
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
		checkGeneratedExams();
		checkStudentRegs();
	}

	onMount(() => {
		getSemester();
		// „… veraltet?" — beim Laden, bei Tab-Fokus und im leichten Intervall
		// prüfen (reine Read-Queries, nicht write-gelockt).
		checkStaleStates();
		const onFocus = () => checkStaleStates();
		window.addEventListener('focus', onFocus);
		const iv = setInterval(checkStaleStates, 20000);
		return () => {
			window.removeEventListener('focus', onFocus);
			clearInterval(iv);
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
				{ section: 'ZPA-Prüfungen' },
				{ href: '/exam/examsToPlan', label: '📝 ZPA-Prüfungen planen' },
				{ href: '/exam/examersToPlan', label: '🧑‍🏫 Zu planende Prüfende' },
				{ section: 'Computer-Prüfungen' },
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
				{ href: '/config/generation', label: '⚙️ Generierungs-Parameter' },
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
				{ href: '/plan/annyBookings', label: '📅 Anny-Buchungen' },
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
	// bei jedem Seitenwechsel den „veraltet"-Zustand neu prüfen (im SPA feuert
	// window.focus nicht, und der Intervall hätte bis zu 20 s Latenz)
	let lastCheckedPath = '';
	$: if (pathname && pathname !== lastCheckedPath) {
		lastCheckedPath = pathname;
		checkStaleStates();
	}
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
							<span
								class="rounded-lg text-base-content/30"
								title="inkompatibel (keine Config)"
							>
								<span class="font-medium tabular-nums">{s.id}</span>
								<span class="text-warning">⚠ inkompatibel</span>
							</span>
						{:else}
							<button
								class="flex flex-col items-start gap-0 rounded-lg {s.id === semester
									? 'bg-primary/15 text-primary'
									: ''}"
								disabled={switchingSemester}
								on:click={() => switchSemester(s.id)}
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
							on:click={() => toggleReadOnly(false)}>🔓 Schutz aufheben</button
						>
					{:else}
						<button
							class="rounded-lg"
							disabled={togglingReadOnly}
							on:click={() => toggleReadOnly(true)}>🔒 Diese DB schützen</button
						>
					{/if}
				</li>

				<li class="menu-title px-2 pt-2 pb-0.5 text-xs">Workspace</li>
				<li>
					<button class="rounded-lg" disabled={switchingSemester} on:click={openNewWorkspace}>
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

	<!-- Banner: generierte Prüfungen veraltet -->
	{#if $generatedExamsState.dirty}
		<div
			class="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-warning/40 bg-warning/15 px-3 py-1.5 text-sm text-warning-content"
		>
			<span>⚠</span>
			<span class="font-medium">Generierte Prüfungen sind veraltet</span>
			{#if $generatedExamsState.reason}
				<span class="opacity-70">— zuletzt: {$generatedExamsState.reason}</span>
			{/if}
			{#if $generatedExamsState.changedAt}
				<span class="opacity-60">· {fmtChangedAt($generatedExamsState.changedAt)}</span>
			{/if}
			<div class="flex-1"></div>
			<button class="btn btn-warning btn-xs" disabled={$regenerating} on:click={runRegenerate}>
				{$regenerating ? 'generiert …' : 'neu generieren'}
			</button>
		</div>
	{/if}

	<!-- Banner: StudentRegs veraltet -->
	{#if $studentRegsState.dirty}
		<div
			class="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-warning/40 bg-warning/15 px-3 py-1.5 text-sm text-warning-content"
		>
			<span>⚠</span>
			<span class="font-medium">StudentRegs sind veraltet</span>
			{#if $studentRegsState.reason}
				<span class="opacity-70">— zuletzt: {$studentRegsState.reason}</span>
			{/if}
			{#if $studentRegsState.changedAt}
				<span class="opacity-60">· {fmtChangedAt($studentRegsState.changedAt)}</span>
			{/if}
			<div class="flex-1"></div>
			<button
				class="btn btn-warning btn-xs"
				disabled={$regeneratingStudents}
				on:click={runRegenerateStudents}
			>
				{$regeneratingStudents ? 'generiert …' : 'neu generieren'}
			</button>
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
			<button class="btn btn-error btn-xs" disabled={togglingReadOnly} on:click={() => toggleReadOnly(false)}>
				{togglingReadOnly ? '…' : 'Schutz aufheben'}
			</button>
		</div>
	{/if}
</header>

<!-- Ergebnis-Toast nach dem Generieren -->
{#if genResult}
	<div class="toast toast-end z-[60]">
		<div class="alert alert-success max-w-md flex-col items-start gap-2 shadow-lg">
			<div class="flex w-full items-center gap-2">
				<span class="font-medium">Generiert: {genResult.changes.length} Änderung(en)</span>
				<div class="flex-1"></div>
				<button class="btn btn-ghost btn-xs" on:click={() => (genResult = null)}>schließen</button>
			</div>
			{#if genResult.changes.length}
				<ul class="flex max-h-72 w-full flex-col gap-1 overflow-y-auto text-sm">
					{#each genResult.changes as c}
						<li class="rounded border border-base-300/40 bg-base-100/40 p-1.5">
							<div class="flex flex-wrap items-center gap-2">
								<span class="badge badge-sm {KIND_BADGE[c.kind] ?? 'badge-ghost'}">
									{KIND_LABEL[c.kind] ?? c.kind}
								</span>
								<span class="font-mono tabular-nums">{c.ancode}</span>
								<span class="text-base-content">{c.module}</span>
							</div>
							{#if (c.details ?? []).length}
								<ul class="mt-1 ml-1 list-inside list-disc text-xs text-base-content/70">
									{#each c.details as d}
										<li>{d}</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<span class="text-sm opacity-70">nichts geändert</span>
			{/if}
		</div>
	</div>
{/if}

<!-- Fehler-Dialog -->
{#if genError}
	<div class="modal modal-open">
		<div class="modal-box">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				<span class="badge badge-error badge-sm">Fehler</span> Generieren fehlgeschlagen
			</h2>
			<p class="mt-3 font-mono text-sm break-words whitespace-pre-wrap">{genError}</p>
			<div class="modal-action">
				<button class="btn btn-sm" on:click={() => (genError = '')}>schließen</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" on:click={() => (genError = '')}></button>
	</div>
{/if}

<!-- StudentRegs: Toast nach dem Generieren -->
{#if stuResult}
	<div class="toast toast-end z-[60]">
		<div class="alert alert-success shadow-lg">
			<span class="font-medium">{stuResult.studentCount} Studierende generiert</span>
			<button class="btn btn-ghost btn-xs" on:click={() => (stuResult = null)}>schließen</button>
		</div>
	</div>
{/if}

<!-- StudentRegs: Fehler-Dialog -->
{#if stuError}
	<div class="modal modal-open">
		<div class="modal-box">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				<span class="badge badge-error badge-sm">Fehler</span> StudentRegs-Generieren fehlgeschlagen
			</h2>
			<p class="mt-3 font-mono text-sm break-words whitespace-pre-wrap">{stuError}</p>
			<div class="modal-action">
				<button class="btn btn-sm" on:click={() => (stuError = '')}>schließen</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" on:click={() => (stuError = '')}></button>
	</div>
{/if}

<!-- Neuen Test-Workspace (DB) anlegen -->
{#if wsOpen}
	<div class="modal modal-open">
		<div class="modal-box max-w-md">
			<h2 class="text-lg font-semibold">Neuen Workspace anlegen</h2>
			<p class="mt-1 text-sm text-base-content/60">
				Legt eine neue (leere) Datenbank an, die auf einem vorhandenen Semester basiert. Danach wird
				direkt hineingewechselt — die Daten müssen noch importiert werden.
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
								{s.id}{s.semester ? ` · ${s.semester}` : ''}{!s.compatible
									? ' (inkompatibel)'
									: ''}
							</option>
						{/each}
					</select>
				</label>
			</div>
			<div class="modal-action">
				<button class="btn btn-ghost btn-sm" on:click={() => (wsOpen = false)}>Abbrechen</button>
				<button
					class="btn btn-primary btn-sm"
					disabled={wsCreating || switchingSemester || !wsNameValid || !wsFromSemester}
					on:click={createWorkspace}
				>
					{wsCreating || switchingSemester ? 'legt an …' : 'anlegen & wechseln'}
				</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" on:click={() => (wsOpen = false)}></button>
	</div>
{/if}

<!-- Semester-Wechsel: Fehler-Dialog -->
{#if semesterError}
	<div class="modal modal-open">
		<div class="modal-box">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				<span class="badge badge-error badge-sm">Fehler</span> Semesterwechsel fehlgeschlagen
			</h2>
			<p class="mt-3 font-mono text-sm break-words whitespace-pre-wrap">{semesterError}</p>
			<div class="modal-action">
				<button class="btn btn-sm" on:click={() => (semesterError = '')}>schließen</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="schließen" on:click={() => (semesterError = '')}
		></button>
	</div>
{/if}
