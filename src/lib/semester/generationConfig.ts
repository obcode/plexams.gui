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
		hint: 'Strafpunkte, wenn eine Person zwei Prüfungen am selben Tag direkt hintereinander hat (sehr schlecht)'
	},
	{
		key: 'examSameDay',
		label: 'selber Tag',
		hint: 'Strafpunkte für zwei Prüfungen einer Person am selben Tag, nicht direkt hintereinander'
	},
	{
		key: 'examDayFactor',
		label: 'Tagesabstand-Faktor',
		hint: 'Strafpunkte für Prüfungen einer Person an verschiedenen Tagen; je mehr Abstand, desto weniger'
	},
	{
		key: 'examWorstCase',
		label: 'Worst-Case-Schutz',
		hint: 'wächst mit dem Quadrat der Belastung einer Person und schützt so die, deren Prüfungen am dichtesten liegen'
	},
	{
		key: 'examRepeatFactor',
		label: 'Wiederholungs-Faktor',
		hint: 'Faktor (0 bis 1) für Konflikte, die wohl nur Wiederholer:innen betreffen; kleiner heißt weniger wichtig'
	},
	{
		key: 'examAttract',
		label: 'Zusammenziehen',
		hint: 'legt Parallelgruppen eines Moduls und kleine Prüfungen derselben Person möglichst zur selben Zeit'
	},
	{
		key: 'examSlotLoad',
		label: 'Startzeit-Auslastung',
		hint: 'Strafpunkte je Platz, den eine Startzeit über der Auslastungs-Schwelle belegt'
	},
	{
		key: 'examLoadThreshold',
		label: 'Auslastungs-Schwelle',
		int: true,
		hint: 'so viele Plätze je Startzeit gelten noch als normal ausgelastet'
	},
	{
		key: 'examUnplaced',
		label: 'ungeplante Prüfung',
		caution: true,
		hint: 'Strafpunkte je Prüfung ohne Termin; muss alles andere überwiegen, deshalb hoch lassen'
	},
	{
		key: 'examCrossCampus',
		label: 'Standortwechsel',
		hint: 'zusätzliche Strafpunkte, wenn eine Person am selben Tag an zwei Standorten geprüft wird'
	},
	{
		key: 'examHole',
		label: 'Startzeit-Lücke',
		hint: 'Strafpunkte je leerer Startzeit zwischen belegten am selben Tag (schlecht für die Aufsichten)'
	},
	{
		key: 'examClosenessFalloffMin',
		label: 'Zeit-Falloff (min)',
		hint: '0 = nur „direkt hintereinander“ oder „selber Tag“; größer 0 = die Strafe nimmt mit dem Abstand in Minuten gleitend ab (nur bei vielen verschiedenen Startzeiten sinnvoll)'
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
		hint: 'Strafpunkte je gebuchtem, aber ungenutztem Platz im T-Bau'
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
		hint: 'Strafpunkte je Studierende:r ohne Platz; muss alles andere überwiegen, deshalb hoch lassen'
	},
	{
		key: 'roomBuffer',
		label: 'Puffer',
		hint: 'Strafpunkte, wenn in einem Raum zu wenige oder zu viele Plätze frei bleiben'
	},
	{
		key: 'roomSplit',
		label: 'Aufteilung',
		hint: 'Strafpunkte, wenn eine Prüfung auf mehrere Räume verteilt wird'
	},
	{
		key: 'roomCompaction',
		label: 'Verdichtung',
		hint: 'je höher, desto mehr kommen die Prüfungen in wenigen Räumen zusammen'
	},
	{
		key: 'roomHeatFloor',
		label: 'Hitze-Stockwerk',
		hint: 'niedrigstes Stockwerk, das noch als „heiß" zählt'
	},
	{
		key: 'roomChurn',
		label: 'Umverteilung',
		hint: 'Strafpunkte, wenn beim Verbessern der bestehenden Zuteilung ein Raum wechselt'
	},
	{
		key: 'roomHeatBaselineHour',
		label: 'Hitze-Basisstunde',
		hint: 'ab dieser vollen Stunde zählen obere Stockwerke im Sommer als zunehmend heiß'
	}
];

/** Pre-Plan (SEB/EXaHM, Seite „SEB/EXaHM-Vorplanung"). */
export const PREPLAN_CONFIG_FIELDS: GenerationConfigField[] = [
	{
		key: 'preplanCapacityFactor',
		label: 'Kapazitäts-Faktor',
		hint: 'so viel der gebuchten Anny-Plätze wird genutzt (1.0 = alle)'
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
		roomHeatFloor: num(c.roomHeatFloor),
		roomChurn: num(c.roomChurn),
		roomHeatBaselineHour: num(c.roomHeatBaselineHour)
	};
}
