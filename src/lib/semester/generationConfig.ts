// Zentrale Definition der globalen generationConfig (Query generationConfig /
// Mutation setGenerationConfig). Die drei Solver teilen sich eine Config:
//   • Terminplan (examplan)  — exam*-Gewichte
//   • Pre-Plan               — preplanCapacityFactor
//   • Aufsichten (invigplan) — weight*-/Verfahren-Felder
//
// GenerationConfigInput ist komplett non-null. Jedes Editier-Formular ändert nur
// einen Teil (Terminplan-Seite: Tageszeiten; Aufsichten-Seite: erweiterte
// Parameter), muss aber die *vollständige* Config zurückschreiben. Darum die
// gemeinsame Feldliste und der Round-Trip-Helfer hier statt dupliziert je Seite.

/** Vollständige Feld-Selektion für die generationConfig-Query. */
export const GENERATION_CONFIG_FIELDS = `
	iterations
	startTemp
	endTemp
	toleranceMin
	maxSpanHours
	weightMinuteBalance
	weightBeyondTolerance
	weightOverTargetFactor
	weightCoverage
	weightMaxDays
	weightPreferExamDays
	weightDistribution
	weightDaySpan
	slotTimeMode
	slotTimeEnforcement
	slotTimeWeight
	slotTimeWinterEarliest
	slotTimeSummerLatest
	slotTimeGradientWeight
	examAdjacent
	examSameDay
	examDayFactor
	examWorstCase
	examRepeatFactor
	examAttract
	examSlotLoad
	examLoadThreshold
	examUnplaced
	examCrossCampus
	examTbauFill
	examHole
	examClosenessFalloffMin
	preplanCapacityFactor
	roomHeatMode
	roomUnplaced
	roomBuffer
	roomSplit
	roomCompaction
	roomHeatFloor
	roomChurn
	roomHeatBaselineHour
`;

/**
 * Ein editierbares Feld der generationConfig. Die drei Solver teilen sich die
 * Config, die Feldgruppen leben aber auf der jeweils zuständigen Seite
 * (Terminplan → /plan/exams/generate, Phase A → /plan/exams/roomsphase,
 * Pre-Plan → /preplan, Aufsichten → /plan/invigilation/generate). Gerendert
 * werden sie einheitlich von GenerationConfigFields.svelte.
 */
export interface GenerationConfigField {
	key: string;
	label: string;
	/** ganzzahliges Feld (step=1) statt Float. */
	int?: boolean;
	/** dominanter Parameter — Warnhinweis anzeigen, nur mit Vorsicht ändern. */
	caution?: boolean;
	hint?: string;
	/**
	 * Enum-/Auswahlfeld: wird als <select> gerendert statt als Zahleneingabe. Der
	 * Default kommt aus der geladenen Config (nicht 0).
	 */
	options?: { value: string; label: string }[];
}

/**
 * Terminplan (examplan) — Spread-/Verteilungs-Gewichte der Phase B
 * (Seite „Terminplan generieren"). `examTbauFill` gehört NICHT hierher — das
 * wirkt nur in der T-Bau-Raumphase A und steht dort.
 */
export const EXAM_SCHEDULE_WEIGHT_FIELDS: GenerationConfigField[] = [
	{
		key: 'examAdjacent',
		label: 'direkt hintereinander',
		hint: 'zwei Prüfungen direkt hintereinander am selben Tag (sehr schlecht)'
	},
	{ key: 'examSameDay', label: 'selber Tag', hint: 'selber Tag, nicht direkt hintereinander' },
	{
		key: 'examDayFactor',
		label: 'Tagesabstand-Faktor',
		hint: 'über Tage: fällt mit dem echten Stundenabstand'
	},
	{
		key: 'examWorstCase',
		label: 'Worst-Case-Schutz',
		hint: 'schützt den am schlechtesten verteilten Studierenden'
	},
	{
		key: 'examRepeatFactor',
		label: 'Wiederholungs-Faktor',
		hint: 'Abwertung für (wahrscheinliche) Wiederholungs-Konflikte (0..1)'
	},
	{
		key: 'examAttract',
		label: 'Zusammenziehen',
		hint: 'zieht Parallelgruppen/kleine Prüfungen desselben Prüfers zusammen'
	},
	{
		key: 'examSlotLoad',
		label: 'Startzeit-Auslastung',
		hint: 'Gleichverteilung über Startzeiten'
	},
	{
		key: 'examLoadThreshold',
		label: 'Auslastungs-Schwelle',
		int: true,
		hint: 'Schwelle für die Gleichverteilung über Startzeiten'
	},
	{
		key: 'examUnplaced',
		label: 'ungeplante Prüfung',
		caution: true,
		hint: 'Strafe pro ungeplanter Prüfung — dominant, hoch lassen'
	},
	{
		key: 'examCrossCampus',
		label: 'Standortwechsel',
		hint: 'selber Tag über verschiedene Standorte (Reisezeit)'
	},
	{
		key: 'examHole',
		label: 'Startzeit-Lücke',
		hint: 'leere Startzeit zwischen belegten am selben Tag (schlecht für Aufsichten)'
	},
	{
		key: 'examClosenessFalloffMin',
		label: 'Zeit-Falloff (min)',
		hint: '0 = raster-äquivalent; >0 = kontinuierlicher Zeit-Falloff (Zeitkonstante in Minuten) für feinere Startzeiten'
	}
];

/**
 * Terminplan Phase A (EXaHM/SEB in den T-Bau, Seite „EXaHM/SEB in T-Bau
 * planen"). Nur hier relevant.
 */
export const ROOM_PHASE_A_WEIGHT_FIELDS: GenerationConfigField[] = [
	{
		key: 'examTbauFill',
		label: 'T-Bau-Sitze',
		hint: 'Strafe pro ungenutztem gebuchten T-Bau-Sitz (nur EXaHM/SEB-Raumphase A)'
	}
];

/**
 * Raumplanung (roomplan) — Steuerung der automatischen Raumzuteilung
 * (Seite „Räume generieren"). `roomHeatMode` ist ein Auswahlfeld, der Rest sind
 * Gewichte/Parameter.
 */
export const ROOM_GENERATION_FIELDS: GenerationConfigField[] = [
	{
		key: 'roomHeatMode',
		label: 'Hitze-Modus',
		options: [
			{ value: 'AUTO', label: 'Automatik (nach Semester)' },
			{ value: 'SUMMER', label: 'Sommer (immer an)' },
			{ value: 'OFF', label: 'Aus' }
		],
		hint: 'Vermeidet im Sommer heiße Räume in oberen Stockwerken. Automatik wirkt nur im Sommersemester.'
	},
	{
		key: 'roomUnplaced',
		label: 'ungeplante Prüfung',
		caution: true,
		hint: 'Strafe pro nicht platzierter Prüfung — dominant, hoch lassen'
	},
	{
		key: 'roomBuffer',
		label: 'Puffer',
		hint: 'Strafe für fehlende bzw. überzogene Reserveplätze (Kapazitätspuffer)'
	},
	{
		key: 'roomSplit',
		label: 'Aufteilung',
		hint: 'Strafe für das Aufteilen einer Prüfung auf mehrere Räume'
	},
	{
		key: 'roomCompaction',
		label: 'Verdichtung',
		hint: 'Belohnung für das Zusammenziehen auf wenige Räume/Gebäude'
	},
	{
		key: 'roomHeatFloor',
		label: 'Hitze-Stockwerk',
		int: true,
		hint: 'niedrigstes Stockwerk, das noch als „heiß" zählt'
	},
	{
		key: 'roomChurn',
		label: 'Umverteilung (Churn)',
		hint: 'Strafe für das Umverteilen bereits zugeordneter Räume (Warm-Start)'
	},
	{
		key: 'roomHeatBaselineHour',
		label: 'Hitze-Basisstunde',
		int: true,
		hint: 'Uhrzeit (Stunde), ab der der Hitze-Term ansteigt'
	}
];

/** Pre-Plan (SEB/EXaHM, Seite „SEB/EXaHM-Vorplanung"). */
export const PREPLAN_CONFIG_FIELDS: GenerationConfigField[] = [
	{
		key: 'preplanCapacityFactor',
		label: 'Kapazitäts-Faktor',
		hint: 'nutzbarer Anteil der gebuchten Anny-Sitze (1.0 = voll füllen)'
	}
];

/** Aufsichten (invigplan) — Verfahren (Simulated Annealing). */
export const INVIG_METHOD_FIELDS: GenerationConfigField[] = [
	{ key: 'iterations', label: 'Iterationen', int: true },
	{ key: 'startTemp', label: 'Start-Temperatur' },
	{ key: 'endTemp', label: 'End-Temperatur' },
	{ key: 'toleranceMin', label: 'Toleranz (min)', int: true },
	{ key: 'maxSpanHours', label: 'max. Spanne (h)' }
];

/** Aufsichten (invigplan) — Gewichte. */
export const INVIG_WEIGHT_FIELDS: GenerationConfigField[] = [
	{ key: 'weightMinuteBalance', label: 'Minuten-Balance' },
	{ key: 'weightBeyondTolerance', label: 'über Toleranz' },
	{ key: 'weightOverTargetFactor', label: 'über Soll (Faktor)' },
	{ key: 'weightCoverage', label: 'Abdeckung' },
	{ key: 'weightMaxDays', label: 'max. Tage' },
	{ key: 'weightPreferExamDays', label: 'Prüfungstage bevorzugen' },
	{ key: 'weightDistribution', label: 'Verteilung' },
	{ key: 'weightDaySpan', label: 'Tages-Spanne' }
];

type AnyConfig = Record<string, unknown>;

const num = (v: unknown): number => {
	const n = Number(v);
	return Number.isFinite(n) ? n : 0;
};
const int = (v: unknown): number => Math.round(num(v));

/**
 * Baut aus einer voll geladenen generationConfig (plus optionalen Overrides aus
 * einem Formular) das komplette GenerationConfigInput. Alle Felder werden auf
 * ihren GraphQL-Typ gebracht (Int! → ganzzahlig, Float! → Zahl, Enum/String
 * durchgereicht), damit unbeteiligte Solver-Parameter beim Speichern erhalten
 * bleiben statt verloren zu gehen.
 */
export function toGenerationConfigInput(config: AnyConfig | null, overrides: AnyConfig = {}) {
	const c = { ...(config ?? {}), ...overrides };
	return {
		// Aufsichten: Verfahren (Simulated Annealing)
		iterations: int(c.iterations),
		startTemp: num(c.startTemp),
		endTemp: num(c.endTemp),
		toleranceMin: int(c.toleranceMin),
		maxSpanHours: num(c.maxSpanHours),
		// Aufsichten: Gewichte
		weightMinuteBalance: num(c.weightMinuteBalance),
		weightBeyondTolerance: num(c.weightBeyondTolerance),
		weightOverTargetFactor: num(c.weightOverTargetFactor),
		weightCoverage: num(c.weightCoverage),
		weightMaxDays: num(c.weightMaxDays),
		weightPreferExamDays: num(c.weightPreferExamDays),
		weightDistribution: num(c.weightDistribution),
		weightDaySpan: num(c.weightDaySpan),
		// Terminplan: Tageszeit-Fenster (auf der Terminplan-Seite editiert)
		slotTimeMode: (c.slotTimeMode as string) ?? 'AUTO',
		slotTimeEnforcement: (c.slotTimeEnforcement as string) ?? 'HARD',
		slotTimeWeight: num(c.slotTimeWeight),
		slotTimeWinterEarliest: (c.slotTimeWinterEarliest as string) ?? '10:00',
		slotTimeSummerLatest: (c.slotTimeSummerLatest as string) ?? '14:00',
		slotTimeGradientWeight: num(c.slotTimeGradientWeight),
		// Terminplan: Solver-Gewichte
		examAdjacent: num(c.examAdjacent),
		examSameDay: num(c.examSameDay),
		examDayFactor: num(c.examDayFactor),
		examWorstCase: num(c.examWorstCase),
		examRepeatFactor: num(c.examRepeatFactor),
		examAttract: num(c.examAttract),
		examSlotLoad: num(c.examSlotLoad),
		examLoadThreshold: int(c.examLoadThreshold),
		examUnplaced: num(c.examUnplaced),
		examCrossCampus: num(c.examCrossCampus),
		examTbauFill: num(c.examTbauFill),
		examHole: num(c.examHole),
		examClosenessFalloffMin: num(c.examClosenessFalloffMin),
		// Pre-Plan
		preplanCapacityFactor: num(c.preplanCapacityFactor),
		// Raumplanung (auf der Seite „Räume generieren" editiert)
		roomHeatMode: (c.roomHeatMode as string) ?? 'AUTO',
		roomUnplaced: num(c.roomUnplaced),
		roomBuffer: num(c.roomBuffer),
		roomSplit: num(c.roomSplit),
		roomCompaction: num(c.roomCompaction),
		roomHeatFloor: int(c.roomHeatFloor),
		roomChurn: num(c.roomChurn),
		roomHeatBaselineHour: int(c.roomHeatBaselineHour)
	};
}
