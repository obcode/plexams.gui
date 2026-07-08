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
	slotTimeWeight
	slotTimeWinterEarliest
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
`;

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
		// Terminplan: ungünstige Tageszeiten meiden (auf der Terminplan-Seite editiert)
		slotTimeMode: (c.slotTimeMode as string) ?? 'AUTO',
		slotTimeWeight: num(c.slotTimeWeight),
		slotTimeWinterEarliest: (c.slotTimeWinterEarliest as string) ?? '10:00',
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
		preplanCapacityFactor: num(c.preplanCapacityFactor)
	};
}
