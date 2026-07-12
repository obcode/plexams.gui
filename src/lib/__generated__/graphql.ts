export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Time: { input: any; output: any; }
};

export type AdditionalExam = {
  __typename?: 'AdditionalExam';
  ancode: Scalars['Int']['output'];
  /** date in dd.mm.yyyy. */
  date: Scalars['String']['output'];
  rooms: Array<AdditionalExamRoom>;
  /** time in HH:MM. */
  time: Scalars['String']['output'];
};

export type AdditionalExamInput = {
  ancode: Scalars['Int']['input'];
  date: Scalars['String']['input'];
  rooms: Array<AdditionalExamRoomInput>;
  time: Scalars['String']['input'];
};

export type AdditionalExamRoom = {
  __typename?: 'AdditionalExamRoom';
  duration: Scalars['Int']['output'];
  invigilatorID: Scalars['Int']['output'];
  isHandicap: Scalars['Boolean']['output'];
  isReserve: Scalars['Boolean']['output'];
  roomName: Scalars['String']['output'];
  studentCount: Scalars['Int']['output'];
};

export type AdditionalExamRoomInput = {
  duration: Scalars['Int']['input'];
  invigilatorID: Scalars['Int']['input'];
  isHandicap: Scalars['Boolean']['input'];
  isReserve: Scalars['Boolean']['input'];
  roomName: Scalars['String']['input'];
  studentCount: Scalars['Int']['input'];
};

export type AnCode = {
  __typename?: 'AnCode';
  zpaAncode: Scalars['Int']['output'];
};

/**
 * Ancodes bundles an exam's internal (ZPA) ancode with its external Primuss identities.
 * Internal use → zpaAncode; external communication (Primuss/MUC.DAI) → primussAncodes.
 * For FK07 exams they are normally equal; for MUC.DAI/external exams they differ.
 */
export type Ancodes = {
  __typename?: 'Ancodes';
  primussAncodes: Array<ZpaPrimussAncodes>;
  zpaAncode: Scalars['Int']['output'];
};

export type AnnyBooking = {
  __typename?: 'AnnyBooking';
  blockerEndDate: Scalars['Time']['output'];
  blockerStartDate: Scalars['Time']['output'];
  bookingGroupIdentifier?: Maybe<Scalars['String']['output']>;
  canEdit: Scalars['Boolean']['output'];
  cancelableUntil?: Maybe<Scalars['Time']['output']>;
  canceledAt?: Maybe<Scalars['Time']['output']>;
  chargedDuration: Scalars['Int']['output'];
  createdAt: Scalars['Time']['output'];
  description: Scalars['String']['output'];
  endDate: Scalars['Time']['output'];
  hasCustomDescription: Scalars['Boolean']['output'];
  isBlocker: Scalars['Boolean']['output'];
  isEditable: Scalars['Boolean']['output'];
  manuallyCreated: Scalars['Boolean']['output'];
  /** true when the booking's personalization name is one of ours (annyConfig.personalizationNames). */
  mine: Scalars['Boolean']['output'];
  note: Scalars['String']['output'];
  number: Scalars['String']['output'];
  personalizationName: Scalars['String']['output'];
  room?: Maybe<Scalars['String']['output']>;
  self: Scalars['String']['output'];
  startDate: Scalars['Time']['output'];
  status: Scalars['String']['output'];
  updatedAt: Scalars['Time']['output'];
};

export type AnnyConfig = {
  __typename?: 'AnnyConfig';
  /** names whose bookings are flagged as ours (mine=true). */
  personalizationNames: Array<Scalars['String']['output']>;
};

export type ArgFilterInput = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type AssembledExam = {
  __typename?: 'AssembledExam';
  ancode: Scalars['Int']['output'];
  /** internal/external ancode identity of the exam (zpaAncode + program-scoped primussAncodes) */
  ancodes: Ancodes;
  conflicts: Array<ZpaConflict>;
  constraints?: Maybe<Constraints>;
  mainExamer: Teacher;
  maxDuration: Scalars['Int']['output'];
  ntas: Array<Nta>;
  primussExams: Array<EnhancedPrimussExam>;
  studentRegsCount: Scalars['Int']['output'];
  zpaExam: ZpaExam;
};

export type AssembledExamsChange = {
  __typename?: 'AssembledExamsChange';
  ancode: Scalars['Int']['output'];
  /** human-readable change descriptions, e.g. 'Anmeldungen 42 → 43'. */
  details: Array<Scalars['String']['output']>;
  /** added | removed | changed */
  kind: Scalars['String']['output'];
  module: Scalars['String']['output'];
};

export type AssembledExamsState = {
  __typename?: 'AssembledExamsState';
  /** when they were last marked stale or (re)generated. */
  changedAt?: Maybe<Scalars['Time']['output']>;
  /** true when the assembled exams are stale relative to their inputs. */
  dirty: Scalars['Boolean']['output'];
  /** the operation that last marked them stale (mutation/subscription name). */
  reason?: Maybe<Scalars['String']['output']>;
};

/** BalanceReport: are all invigilators within ±tolerance of their target minutes. */
export type BalanceReport = {
  __typename?: 'BalanceReport';
  invigilators: Scalars['Int']['output'];
  maxOver: Scalars['Int']['output'];
  maxUnder: Scalars['Int']['output'];
  over: Scalars['Int']['output'];
  satisfied: Scalars['Boolean']['output'];
  toleranceMin: Scalars['Int']['output'];
  under: Scalars['Int']['output'];
  withinTolerance: Scalars['Int']['output'];
};

/** A room blocked at one exam time (not usable for planning there). */
export type BlockedRoom = {
  __typename?: 'BlockedRoom';
  reason?: Maybe<Scalars['String']['output']>;
  room: Scalars['String']['output'];
  /** Absolute start time of the blocked slot. */
  starttime?: Maybe<Scalars['Time']['output']>;
};

export type Conflict = {
  __typename?: 'Conflict';
  ancode: Scalars['Int']['output'];
  numberOfStuds: Scalars['Int']['output'];
};

/**
 * ConflictDecision is an explicit per-student override of the automatic handling:
 * ACCEPT drops that student's proximity penalty; VETO forces it to count at full weight
 * (overriding an automatic repeat down-weighting).
 */
export enum ConflictDecision {
  Accept = 'ACCEPT',
  Veto = 'VETO'
}

export type ConflictPerProgram = {
  __typename?: 'ConflictPerProgram';
  conflicts: Array<Conflict>;
  program: Scalars['String']['output'];
};

export type ConflictStudent = {
  __typename?: 'ConflictStudent';
  /** effective: penalty dropped for this student (explicit ACCEPT, or autoAccepted and not vetoed). */
  accepted: Scalars['Boolean']['output'];
  /**
   * true if this is (heuristically) a repeat for this student (repeater exam or
   * the student's semester is above the exam's) — auto down-weighted and accepted by default.
   */
  autoAccepted: Scalars['Boolean']['output'];
  /** explicit decision for this student, if any (overrides the automatic handling). */
  decision?: Maybe<ConflictDecision>;
  /** the student's cohort/group, e.g. "IF4B". */
  group: Scalars['String']['output'];
  mtknr: Scalars['String']['output'];
  name: Scalars['String']['output'];
  /** the student's study program, e.g. "IF". */
  program: Scalars['String']['output'];
};

export type Conflicts = {
  __typename?: 'Conflicts';
  ancode: Scalars['Int']['output'];
  conflicts: Array<Conflict>;
  mainExamer: Scalars['String']['output'];
  module: Scalars['String']['output'];
};

export type ConflictsPerProgramAncode = {
  __typename?: 'ConflictsPerProgramAncode';
  ancode: Scalars['Int']['output'];
  conflicts?: Maybe<Conflicts>;
  program: Scalars['String']['output'];
};

export type ConnectedExam = {
  __typename?: 'ConnectedExam';
  otherPrimussExams: Array<PrimussExam>;
  primussExams: Array<PrimussExam>;
  /** Findings from connecting ZPA and Primuss data, graded by level. */
  warnings: Array<ConnectedExamWarning>;
  zpaExam: ZpaExam;
};

/** A finding from connecting a ZPA exam to its Primuss registrations. */
export type ConnectedExamWarning = {
  __typename?: 'ConnectedExamWarning';
  /** The Primuss ancode this finding refers to, if any. */
  ancode?: Maybe<Scalars['Int']['output']>;
  /** The examer of the referenced Primuss exam, if known. */
  examer?: Maybe<Scalars['String']['output']>;
  /** info | warning | error */
  level: Scalars['String']['output'];
  message: Scalars['String']['output'];
  /** The module/exam name of the referenced Primuss exam, if known. */
  module?: Maybe<Scalars['String']['output']>;
  /** The Primuss program this finding refers to (for an add/fix/remove action), if any. */
  program?: Maybe<Scalars['String']['output']>;
};

export type ConstraintCost = {
  __typename?: 'ConstraintCost';
  cost: Scalars['Float']['output'];
  name: Scalars['String']['output'];
};

export type Constraints = {
  __typename?: 'Constraints';
  ancode: Scalars['Int']['output'];
  /** do not upload this exam to the ZPA when publishing the plan. */
  doNotPublish: Scalars['Boolean']['output'];
  excludeDays?: Maybe<Array<Scalars['Time']['output']>>;
  fixedDay?: Maybe<Scalars['Time']['output']>;
  fixedTime?: Maybe<Scalars['Time']['output']>;
  /**
   * fixed exam location/campus, e.g. "Campus Pasing"; empty = default campus
   * (Lothstraße). Used for a minimum travel gap between exams at different campuses.
   */
  location?: Maybe<Scalars['String']['output']>;
  notPlannedByMe: Scalars['Boolean']['output'];
  /** the faculty that plans this exam when notPlannedByMe (e.g. "FK10" for Pasing ZPA exams). */
  notPlannedByMeInFK?: Maybe<Scalars['String']['output']>;
  online: Scalars['Boolean']['output'];
  possibleDays?: Maybe<Array<Scalars['Time']['output']>>;
  roomConstraints?: Maybe<RoomConstraints>;
  sameSlot?: Maybe<Array<Scalars['Int']['output']>>;
};

export type ConstraintsInput = {
  additionalSeats?: InputMaybe<Scalars['Int']['input']>;
  allowedRooms?: InputMaybe<Array<Scalars['String']['input']>>;
  comments?: InputMaybe<Scalars['String']['input']>;
  doNotPublish?: InputMaybe<Scalars['Boolean']['input']>;
  exahm?: InputMaybe<Scalars['Boolean']['input']>;
  excludeDays?: InputMaybe<Array<Scalars['Time']['input']>>;
  fixedDay?: InputMaybe<Scalars['Time']['input']>;
  fixedTime?: InputMaybe<Scalars['Time']['input']>;
  kdpJiraURL?: InputMaybe<Scalars['String']['input']>;
  lab?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  maxStudents?: InputMaybe<Scalars['Int']['input']>;
  notPlannedByMe?: InputMaybe<Scalars['Boolean']['input']>;
  /** the faculty that plans this exam when notPlannedByMe (e.g. "FK10"). */
  notPlannedByMeInFK?: InputMaybe<Scalars['String']['input']>;
  online?: InputMaybe<Scalars['Boolean']['input']>;
  placesWithSocket?: InputMaybe<Scalars['Boolean']['input']>;
  possibleDays?: InputMaybe<Array<Scalars['Time']['input']>>;
  /** Trailing time (Nachlauf) in minutes after the exam; total that replaces the default 15. */
  postExamMinutes?: InputMaybe<Scalars['Int']['input']>;
  /** Lead time (Vorlauf) in minutes before the exam; total that replaces the default 15. */
  preExamMinutes?: InputMaybe<Scalars['Int']['input']>;
  sameSlot?: InputMaybe<Array<Scalars['Int']['input']>>;
  seb?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CountBucket = {
  __typename?: 'CountBucket';
  /** Number of exams; the top bucket uses this as its lower bound (label carries the '+'). */
  examCount: Scalars['Int']['output'];
  label: Scalars['String']['output'];
  share: Scalars['Float']['output'];
  students: Scalars['Int']['output'];
};

/** CoverageReport: how many positions are filled. */
export type CoverageReport = {
  __typename?: 'CoverageReport';
  positions: Scalars['Int']['output'];
  unfilled: Scalars['Int']['output'];
};

export type DistributionBucket = {
  __typename?: 'DistributionBucket';
  count: Scalars['Int']['output'];
  invigilators: Scalars['Int']['output'];
};

/** Status of the per-session dry-run recipient override shown on the Probeläufe page. */
export type DryRunTestMailStatus = {
  __typename?: 'DryRunTestMailStatus';
  /** The address dry-run mails currently go to (override, or the configured default). */
  current: Scalars['String']['output'];
  /** The configured default (effective testMail) that a reset falls back to. */
  default: Scalars['String']['output'];
  /** True when an override is active and deviates from the default — the GUI should show a warning banner. */
  overridden: Scalars['Boolean']['output'];
  /** The active session override, or null when none is set (the configured default is used). */
  override?: Maybe<Scalars['String']['output']>;
};

/**
 * EmailAttachmentInfo describes one uploaded attachment (without its binary data).
 * kind is e.g. "cover-page" or "invigilation-image"; key is the teacher /
 * invigilator id the attachment belongs to. The binaries themselves are uploaded
 * via the REST endpoints /upload/email-attachment and /upload/email-attachments-zip.
 */
export type EmailAttachmentInfo = {
  __typename?: 'EmailAttachmentInfo';
  contentType: Scalars['String']['output'];
  filename: Scalars['String']['output'];
  key: Scalars['String']['output'];
  kind: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  uploadedAt: Scalars['Time']['output'];
};

/**
 * EmailTemplate is one editable email body template (a Markdown *.md.tmpl). The built-in
 * embedded template is the default; a stored override replaces it. The layout templates
 * (emailBaseHTML/jiraOnHTML) are not editable here.
 */
export type EmailTemplate = {
  __typename?: 'EmailTemplate';
  /** the built-in default Markdown (for preview and reset-to-default). */
  defaultMarkdown: Scalars['String']['output'];
  /** a short human-readable purpose of this email (for the GUI list; not part of the mail). */
  description: Scalars['String']['output'];
  /** true when no override is stored (the built-in default is in use). */
  isDefault: Scalars['Boolean']['output'];
  /** the effective Markdown: the stored override if any, otherwise the built-in default. */
  markdown: Scalars['String']['output'];
  /** the template's file name, e.g. "exahmEmail.md.tmpl". */
  name: Scalars['String']['output'];
  /** the variables (placeholders) this template may use, with a description and an example. */
  variables: Array<EmailTemplateVariable>;
};

/**
 * EmailTemplateFunction documents a helper function callable in every email template, e.g.
 * `jiraURL` or `plural`. The list is global (all functions are available in all templates).
 */
export type EmailTemplateFunction = {
  __typename?: 'EmailTemplateFunction';
  /** what it does, in plain language. */
  description: Scalars['String']['output'];
  /** the function name, e.g. "plural". */
  name: Scalars['String']['output'];
  /** how to call it, e.g. "{{ plural .N \"Platz\" \"Plätze\" }}". */
  usage: Scalars['String']['output'];
};

/**
 * EmailTemplatePreview is the rendered result of a (possibly not-yet-saved) template against
 * representative sample data. On a template error, `error` holds the message and html/text
 * are empty — so the GUI can show parse/exec mistakes live while editing.
 */
export type EmailTemplatePreview = {
  __typename?: 'EmailTemplatePreview';
  /** the error message if the template does not parse/execute; null on success. */
  error?: Maybe<Scalars['String']['output']>;
  /** the rendered HTML part (the shared layout is applied), for an in-GUI preview. */
  html: Scalars['String']['output'];
  /** the rendered plain-text part. */
  text: Scalars['String']['output'];
};

/**
 * EmailTemplateVariable documents one placeholder available in a template, e.g.
 * `.Teacher.Fullname`. Meant to be shown next to the editor so a non-technical user knows
 * which values exist and how to write them.
 */
export type EmailTemplateVariable = {
  __typename?: 'EmailTemplateVariable';
  /** what the value is, in plain language. */
  description: Scalars['String']['output'];
  /** the value used for this placeholder in the live preview. */
  example: Scalars['String']['output'];
  /** how to write it in the template, e.g. "{{ .Teacher.Fullname }}". */
  name: Scalars['String']['output'];
};

export type Emails = {
  __typename?: 'Emails';
  additionalExamer: Array<Scalars['String']['output']>;
  fs: Scalars['String']['output'];
  /** Recipient for the EXaHM/SEB room overview (KDP). */
  kdp: Scalars['String']['output'];
  /** Recipient for the overview of LBAs' repeat exams (Lehrbeauftragten-Beauftragte:r). */
  lbaba: Scalars['String']['output'];
  lbas: Scalars['String']['output'];
  lbasLastSemester: Scalars['String']['output'];
  profs: Scalars['String']['output'];
  /** Recipient for building-management room requests (Gebäudemanagement). */
  roomManagement: Scalars['String']['output'];
  sekr: Scalars['String']['output'];
};

export type EmailsInput = {
  additionalExamer: Array<Scalars['String']['input']>;
  fs: Scalars['String']['input'];
  kdp: Scalars['String']['input'];
  lbaba: Scalars['String']['input'];
  lbas: Scalars['String']['input'];
  lbasLastSemester: Scalars['String']['input'];
  profs: Scalars['String']['input'];
  roomManagement: Scalars['String']['input'];
  sekr: Scalars['String']['input'];
};

export type EnhancedPrimussExam = {
  __typename?: 'EnhancedPrimussExam';
  conflicts: Array<Conflict>;
  exam: PrimussExam;
  ntas: Array<Nta>;
  studentRegs: Array<EnhancedStudentReg>;
};

export type EnhancedStudentReg = {
  __typename?: 'EnhancedStudentReg';
  group: Scalars['String']['output'];
  mtknr: Scalars['String']['output'];
  name: Scalars['String']['output'];
  presence: Scalars['String']['output'];
  /** Primuss ancode (per-program namespace); == the ZPA ancode only for FK07 exams */
  primussAncode: Scalars['Int']['output'];
  program: Scalars['String']['output'];
  zpaStudent?: Maybe<ZpaStudent>;
};

export type ExamDay = {
  __typename?: 'ExamDay';
  date: Scalars['Time']['output'];
};

export type ExamDurationOverride = {
  __typename?: 'ExamDurationOverride';
  ancode: Scalars['Int']['output'];
  duration: Scalars['Int']['output'];
};

/** ExamPair is a pair of exams with display info (for canShareSlot lists/suggestions). */
export type ExamPair = {
  __typename?: 'ExamPair';
  ancode1: Scalars['Int']['output'];
  ancode2: Scalars['Int']['output'];
  mainExamer1: Scalars['String']['output'];
  mainExamer2: Scalars['String']['output'];
  module1: Scalars['String']['output'];
  module2: Scalars['String']['output'];
};

/** One exam I plan for an examer, for the planning info email (no slot/date). */
export type ExamPlanningMailExam = {
  __typename?: 'ExamPlanningMailExam';
  ancode: Scalars['Int']['output'];
  constraints?: Maybe<Constraints>;
  /** Human-readable exam type (ZPA full name). */
  examType: Scalars['String']['output'];
  module: Scalars['String']['output'];
};

export type ExamPlanningMailRecipient = {
  __typename?: 'ExamPlanningMailRecipient';
  /** withExams = I plan at least one of their exams; fk07NoExams = FK07 examer I plan nothing for. */
  category: Scalars['String']['output'];
  /** The exams I plan for this examer (empty for fk07NoExams). */
  exams: Array<ExamPlanningMailExam>;
  teacher: Teacher;
};

/** State of the EXaHM/SEB room phase (phase A) relative to phase B. */
export type ExamRoomsPhaseState = {
  __typename?: 'ExamRoomsPhaseState';
  /** planned > 0 and every planned EXaHM/SEB exam is frozen — safe to run phase B. */
  allFixed: Scalars['Boolean']['output'];
  /** of those, how many are frozen (phaseFixed) so phase B leaves them untouched. */
  fixed: Scalars['Int']['output'];
  /** planned EXaHM/SEB exams (have a plan entry — the set the room phase freezes). */
  planned: Scalars['Int']['output'];
};

/**
 * ExamScheduleConflict is a conflict in the CURRENT plan: two exams a student is
 * registered in that ended up close in time, aggregated over all affected students. A
 * conflict is only meaningful per student — the per-student acceptance lives on
 * affectedStudents.
 */
export type ExamScheduleConflict = {
  __typename?: 'ExamScheduleConflict';
  /** the affected students (registered in both); acceptance is set per student here. */
  affectedStudents: Array<ConflictStudent>;
  ancode1: Scalars['Int']['output'];
  ancode2: Scalars['Int']['output'];
  /** true if the pair is declared can-share-slot. */
  canShareSlot: Scalars['Boolean']['output'];
  /**
   * status relative to the currently saved plan, only set in a generation report: "new"
   * (not in the saved plan), "worse"/"better" (proximity changed), "unchanged", or
   * "resolved" (was in the saved plan, gone now). Empty outside a diff context.
   */
  diffStatus: Scalars['String']['output'];
  /** the study groups exam 1 is offered for (e.g. ["IF2A"]). */
  groups1: Array<Scalars['String']['output']>;
  groups2: Array<Scalars['String']['output']>;
  /** true if BOTH exams are external (planned by another faculty): information only. */
  infoOnly: Scalars['Boolean']['output'];
  /** true if exam 1 is a repeater exam. */
  isRepeaterExam1: Scalars['Boolean']['output'];
  isRepeaterExam2: Scalars['Boolean']['output'];
  /** exam 1's campus/location (empty = default campus Lothstraße). */
  location1: Scalars['String']['output'];
  location2: Scalars['String']['output'];
  mainExamer1: Scalars['String']['output'];
  mainExamer2: Scalars['String']['output'];
  module1: Scalars['String']['output'];
  module2: Scalars['String']['output'];
  /** worst time proximity across affected students: OVERLAP | TOO_CLOSE | SAME_DAY. */
  proximity: Scalars['String']['output'];
  /** the planned slot of exam 1. */
  slot1: Slot;
  slot2: Slot;
  /** number of students registered in both, in the plan. */
  studentCount: Scalars['Int']['output'];
};

/** Quality report of a generated (or current) exam schedule. */
export type ExamScheduleDiagnostics = {
  __typename?: 'ExamScheduleDiagnostics';
  further: Scalars['Int']['output'];
  /** Peak number of exams sharing a single start time. */
  maxExamsAt: Scalars['Int']['output'];
  /** Peak concurrent seats across all start times. */
  maxSeatsAt: Scalars['Int']['output'];
  nextDay: Scalars['Int']['output'];
  /** Two of a student's exams overlap in time (a hard violation — should be 0). */
  overlaps: Scalars['Int']['output'];
  pairs: Scalars['Int']['output'];
  sameDay: Scalars['Int']['output'];
  slotsOverThreshold: Scalars['Int']['output'];
  /** Distinct start times holding at least one of our exams. */
  starttimesUsed: Scalars['Int']['output'];
  students: Scalars['Int']['output'];
  studentsWithSameDay: Scalars['Int']['output'];
  studentsWithTooClose: Scalars['Int']['output'];
  /** Two of a student's exams are directly consecutive / too close in time. */
  tooClose: Scalars['Int']['output'];
  within3: Scalars['Int']['output'];
  worstStudentPenalty: Scalars['Float']['output'];
};

export type ExamScheduleReport = {
  __typename?: 'ExamScheduleReport';
  /**
   * conflicts of the generated schedule (to review/rate, also on a dry run). Each
   * carries a diffStatus relative to the saved plan (new/worse/better/unchanged).
   */
  conflicts: Array<ExamScheduleConflict>;
  cost: Scalars['Float']['output'];
  costByConstraint: Array<ConstraintCost>;
  diagnostics: ExamScheduleDiagnostics;
  /**
   * EXaHM/SEB exams (ancodes) that carry an NTA. Their NTA time extension is not
   * gated against the Anny booking window (the NTA student is seated in a separate
   * NTA room booked later at room planning) — this is the reminder to book that room.
   */
  exahmNtaAncodes: Array<Scalars['Int']['output']>;
  fixed: Scalars['Int']['output'];
  hardViolations: Array<Scalars['String']['output']>;
  iterations: Scalars['Int']['output'];
  placed: Scalars['Int']['output'];
  /** conflicts that were in the saved plan but are gone in the generated one (diffStatus "resolved"). */
  resolvedConflicts: Array<ExamScheduleConflict>;
  /** the seed used — pass it back to reproduce this exact plan. */
  seed: Scalars['Int']['output'];
  stoppedEarly: Scalars['Boolean']['output'];
  units: Scalars['Int']['output'];
  unplaced: Scalars['Int']['output'];
  unplacedAncodes: Array<Scalars['Int']['output']>;
  /** why each unplaced exam could not be scheduled (empty when everything was placed). */
  unplacedReasons: Array<UnplacedExamReason>;
  written: Scalars['Boolean']['output'];
};

export type ExamSpreadStatistics = {
  __typename?: 'ExamSpreadStatistics';
  /** Share (%) of multi-exam students whose tightest gap is two consecutive days (0 free days). */
  adjacentDayShare: Scalars['Float']['output'];
  /**
   * freeDayShare over ALL students incl. the excluded outliers — for a 'barely
   * differs' note; equals freeDayShare when there are no outliers.
   */
  allFreeDayShare: Scalars['Float']['output'];
  avgExamsPerStudent: Scalars['Float']['output'];
  /** Average, over multi-exam students, of their SMALLEST free-days-between-exams (same day = -1, overlap = -2). */
  avgMinFreeDays: Scalars['Float']['output'];
  /** Carter-style proximity index averaged per multi-exam student (lower = better); the objective the solver minimizes. */
  avgProximityCost: Scalars['Float']['output'];
  /** Per study program breakdown, most students first. */
  byProgram: Array<ProgramSpread>;
  /** Share (%) of multi-exam students with a real overlap/too-close conflict (should be 0). */
  conflictShare: Scalars['Float']['output'];
  /** Students grouped by how many exams they have. */
  examCountBuckets: Array<CountBucket>;
  /** The travel/break buffer (minutes) below which two exams count as an overlap. */
  examGapMinutes: Scalars['Int']['output'];
  /** Students excluded here because they have more than maxRegularNonRepeatExams non-repeat exams (repeat-heavy outliers). */
  excludedStudentCount: Scalars['Int']['output'];
  /** Share (%) of multi-exam students who have >= 1 free day between ALL consecutive exams. */
  freeDayShare: Scalars['Float']['output'];
  maxExamsPerStudent: Scalars['Int']['output'];
  /** The non-repeat-exam cap for the in-scope population (6 = the most possible in a normal semester). */
  maxRegularNonRepeatExams: Scalars['Int']['output'];
  medianMinFreeDays: Scalars['Float']['output'];
  /**
   * Students with at least one ratable gap (>= 2 exams, after dropping spurious
   * foreign-foreign / same-slot pairs); denominator of the shares.
   */
  multiExamStudentCount: Scalars['Int']['output'];
  /** The same-day start-to-start threshold (minutes) below which two exams count as too close. */
  notTooCloseMinutes: Scalars['Int']['output'];
  /** All consecutive-exam gaps grouped by proximity class. */
  pairBuckets: Array<SpreadBucket>;
  /** Share (%) of multi-exam students who have two exams on the same day. */
  sameDayShare: Scalars['Float']['output'];
  /** Students grouped by their WORST (tightest) consecutive-exam gap. */
  studentBuckets: Array<SpreadBucket>;
  /** Students in scope with at least one exam placed within the exam period. */
  studentCount: Scalars['Int']['output'];
  /** Students who still have at least one not-yet-placed exam (coverage caveat). */
  studentsWithUnplannedExams: Scalars['Int']['output'];
  /** Number of students with three or more exam sittings on a single day. */
  threeExamsOneDayCount: Scalars['Int']['output'];
  /** Total placed exam registrations counted across all students in scope. */
  totalPlannedExams: Scalars['Int']['output'];
  /** The most tightly-scheduled students, for GUI drill-down (not part of the aggregate PDF). */
  worstStudents: Array<WorstStudent>;
};

/**
 * ExamTime is the time span of one exam an invigilator is the main examer of:
 * from the start time of the slot until the end time (start + maxDuration of the
 * exam, i.e. the longest exam in the slot including NTA extensions).
 */
export type ExamTime = {
  __typename?: 'ExamTime';
  from: Scalars['Time']['output'];
  until: Scalars['Time']['output'];
};

export type ExamWithRegsAndRooms = {
  __typename?: 'ExamWithRegsAndRooms';
  exam: PlannedExam;
  normalRegsMtknr: Array<Scalars['String']['output']>;
  ntasInAloneRooms: Array<Nta>;
  ntasInNormalRooms: Array<Nta>;
  rooms: Array<PlannedRoom>;
};

export type ExamerInPlan = {
  __typename?: 'ExamerInPlan';
  mainExamer: Scalars['String']['output'];
  mainExamerID: Scalars['Int']['output'];
};

export type Fk07Program = {
  __typename?: 'FK07Program';
  name: Scalars['String']['output'];
};

/**
 * FairnessDistribution: per-invigilator count histogram for one kind (reserve/nta).
 * buckets reads as "count:invigilators", e.g. count 1 / invigilators 48.
 */
export type FairnessDistribution = {
  __typename?: 'FairnessDistribution';
  buckets: Array<DistributionBucket>;
  kind: Scalars['String']['output'];
  max: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type GenerateAssembledExamsResult = {
  __typename?: 'GenerateAssembledExamsResult';
  /** what changed vs the previously cached assembled exams (empty = nothing changed). */
  changes: Array<AssembledExamsChange>;
  /** the new state (dirty=false). */
  state: AssembledExamsState;
};

export type GeneratePreparationResult = {
  __typename?: 'GeneratePreparationResult';
  assembledExams: GenerateAssembledExamsResult;
  studentRegs: GenerateStudentRegsResult;
};

export type GenerateStudentRegsResult = {
  __typename?: 'GenerateStudentRegsResult';
  state: StudentRegsState;
  /** number of students with planned registrations after the (re)generation. */
  studentCount: Scalars['Int']['output'];
};

export type GenerationConfig = {
  __typename?: 'GenerationConfig';
  endTemp: Scalars['Float']['output'];
  /** spread: two exams of a student directly consecutive on the same day (very bad). */
  examAdjacent: Scalars['Float']['output'];
  /** attract: pull parallel sections / small same-examer exams close together. */
  examAttract: Scalars['Float']['output'];
  /** 0 = tiered/grid-equivalent same-day cost; >0 = continuous falloff time constant (minutes) for finer start times. */
  examClosenessFalloffMin: Scalars['Float']['output'];
  /** extra penalty for a same-day student pair across campuses (travel gap). */
  examCrossCampus: Scalars['Float']['output'];
  /** spread across days: DayFactor · 24 / hours between the two exams. */
  examDayFactor: Scalars['Float']['output'];
  /** per empty start time between two occupied ones on the same day (bad for invigilation). */
  examHole: Scalars['Float']['output'];
  /** soft seat threshold per start time for the slot-load term. */
  examLoadThreshold: Scalars['Int']['output'];
  /** down-weight applied to (likely) repeat-exam conflict pairs (0..1). */
  examRepeatFactor: Scalars['Float']['output'];
  /** spread: two exams of a student on the same day but not consecutive. */
  examSameDay: Scalars['Float']['output'];
  /** even distribution: convex penalty on the seat load per start time. */
  examSlotLoad: Scalars['Float']['output'];
  /** per unused booked T-building seat in the EXaHM/SEB room phase (phase A only). */
  examTbauFill: Scalars['Float']['output'];
  /** penalty per unplaced exam (dominant — keep very high so all exams get placed). */
  examUnplaced: Scalars['Float']['output'];
  /** convex term protecting the least well-spread student (+ WorstCase · P²). */
  examWorstCase: Scalars['Float']['output'];
  iterations: Scalars['Int']['output'];
  maxSpanHours: Scalars['Float']['output'];
  /** Pre-plan (SEB/EXaHM): usable fraction of a slot's booked Anny seats (1.0 = fill completely). */
  preplanCapacityFactor: Scalars['Float']['output'];
  /** Terminplan: how strictly the window is enforced — HARD (domain restriction, default) or SOFT (penalty). */
  slotTimeEnforcement: SlotTimeConstraintEnforcement;
  /**
   * Terminplan (summer): mild 'earlier is better' pull below the cutoff (per
   * registration, per hour later than the day's first slot). 0 = use default.
   */
  slotTimeGradientWeight: Scalars['Float']['output'];
  /** Terminplan: whether/how the start-time window applies (default AUTO by semester). */
  slotTimeMode: SlotTimeConstraintMode;
  /**
   * Terminplan (summer): exams must not start after this (HH:MM), e.g. 14:00
   * (non-climatised rooms get too hot in the afternoon).
   */
  slotTimeSummerLatest: Scalars['String']['output'];
  /**
   * Terminplan: SOFT-mode window penalty (per registration, per hour outside the
   * window). Unused in HARD mode. 0 = use default.
   */
  slotTimeWeight: Scalars['Float']['output'];
  /** Terminplan (winter): exams must not start before this (HH:MM), e.g. 10:00. */
  slotTimeWinterEarliest: Scalars['String']['output'];
  startTemp: Scalars['Float']['output'];
  /** allowed deviation (minutes) from an invigilator's target workload. */
  toleranceMin: Scalars['Int']['output'];
  weightBeyondTolerance: Scalars['Float']['output'];
  weightCoverage: Scalars['Float']['output'];
  weightDaySpan: Scalars['Float']['output'];
  weightDistribution: Scalars['Float']['output'];
  weightMaxDays: Scalars['Float']['output'];
  weightMinuteBalance: Scalars['Float']['output'];
  weightOverTargetFactor: Scalars['Float']['output'];
  weightPreferExamDays: Scalars['Float']['output'];
};

export type GenerationConfigInput = {
  endTemp: Scalars['Float']['input'];
  examAdjacent: Scalars['Float']['input'];
  examAttract: Scalars['Float']['input'];
  examClosenessFalloffMin: Scalars['Float']['input'];
  examCrossCampus: Scalars['Float']['input'];
  examDayFactor: Scalars['Float']['input'];
  examHole: Scalars['Float']['input'];
  examLoadThreshold: Scalars['Int']['input'];
  examRepeatFactor: Scalars['Float']['input'];
  examSameDay: Scalars['Float']['input'];
  examSlotLoad: Scalars['Float']['input'];
  examTbauFill: Scalars['Float']['input'];
  examUnplaced: Scalars['Float']['input'];
  examWorstCase: Scalars['Float']['input'];
  iterations: Scalars['Int']['input'];
  maxSpanHours: Scalars['Float']['input'];
  preplanCapacityFactor: Scalars['Float']['input'];
  slotTimeEnforcement: SlotTimeConstraintEnforcement;
  slotTimeGradientWeight: Scalars['Float']['input'];
  slotTimeMode: SlotTimeConstraintMode;
  slotTimeSummerLatest: Scalars['String']['input'];
  slotTimeWeight: Scalars['Float']['input'];
  slotTimeWinterEarliest: Scalars['String']['input'];
  startTemp: Scalars['Float']['input'];
  toleranceMin: Scalars['Int']['input'];
  weightBeyondTolerance: Scalars['Float']['input'];
  weightCoverage: Scalars['Float']['input'];
  weightDaySpan: Scalars['Float']['input'];
  weightDistribution: Scalars['Float']['input'];
  weightMaxDays: Scalars['Float']['input'];
  weightMinuteBalance: Scalars['Float']['input'];
  weightOverTargetFactor: Scalars['Float']['input'];
  weightPreferExamDays: Scalars['Float']['input'];
};

export type ImportMucDaiResult = {
  __typename?: 'ImportMucDaiResult';
  /** new non-ZPA exams created (non-FK07, not existing yet). */
  examsCreated: Scalars['Int']['output'];
  /** non-FK07 exams that already existed (kept with their ancode). */
  examsExisting: Scalars['Int']['output'];
  /** total exam rows imported into the mucdai_<program> collections. */
  examsImported: Scalars['Int']['output'];
  /** assembled exams of the imported programs removed because they are no longer in the CSV (or flipped to FK07). */
  examsRemoved: Scalars['Int']['output'];
  /** FK07 exams skipped (they exist as ZPA exams, only linked). */
  examsSkippedFK07: Scalars['Int']['output'];
  /** programs (Studiengruppen) found in the CSV. */
  programs: Array<Scalars['String']['output']>;
};

export type Invigilation = {
  __typename?: 'Invigilation';
  duration: Scalars['Int']['output'];
  invigilatorID: Scalars['Int']['output'];
  isReserve: Scalars['Boolean']['output'];
  isSelfInvigilation: Scalars['Boolean']['output'];
  prePlanned: Scalars['Boolean']['output'];
  roomName?: Maybe<Scalars['String']['output']>;
  slot: Slot;
};

/**
 * InvigilationReport is the structured outcome of an invigilation generation run,
 * mirroring the textual report. It is delivered once on the final RESULT line of
 * the assignInvigilations subscription (also for dryRun, where nothing is
 * written to the database).
 */
export type InvigilationReport = {
  __typename?: 'InvigilationReport';
  balance: BalanceReport;
  coverage: CoverageReport;
  fairness: Array<FairnessDistribution>;
  iterations: Scalars['Int']['output'];
  iterationsRun: Scalars['Int']['output'];
  minutes: MinutesReport;
  outliers: Array<InvigilatorOutlier>;
  seed: Scalars['Int']['output'];
  softCost: SoftCostReport;
  stoppedEarly: Scalars['Boolean']['output'];
};

export type InvigilationSlot = {
  __typename?: 'InvigilationSlot';
  reserve?: Maybe<Teacher>;
  /** true if the reserve invigilation in this slot is pre-planned (fixed). */
  reservePrePlanned: Scalars['Boolean']['output'];
  roomsWithInvigilators: Array<RoomWithInvigilator>;
};

/**
 * InvigilationTimeWindow restricts, for one calendar date, the times an
 * invigilator may invigilate. An assigned invigilation must start no earlier than
 * from (if set) and end no later than until (if set). The check is sub-slot
 * granular and NTA-aware, since the end time includes the room's (possibly
 * NTA-extended) duration.
 */
export type InvigilationTimeWindow = {
  __typename?: 'InvigilationTimeWindow';
  date: Scalars['Time']['output'];
  from?: Maybe<Scalars['Time']['output']>;
  until?: Maybe<Scalars['Time']['output']>;
};

/** date is the calendar day; from/until are clock times on that day (at least one of from/until must be set). */
export type InvigilationTimeWindowInput = {
  date: Scalars['Time']['input'];
  from?: InputMaybe<Scalars['Time']['input']>;
  until?: InputMaybe<Scalars['Time']['input']>;
};

export type InvigilationTodos = {
  __typename?: 'InvigilationTodos';
  invigilatorCount: Scalars['Int']['output'];
  invigilators: Array<Invigilator>;
  sumExamRooms: Scalars['Int']['output'];
  sumOtherContributions: Scalars['Int']['output'];
  sumOtherContributionsOvertimeCutted: Scalars['Int']['output'];
  sumReserve: Scalars['Int']['output'];
  todoPerInvigilator: Scalars['Int']['output'];
  todoPerInvigilatorOvertimeCutted: Scalars['Int']['output'];
};

export type Invigilator = {
  __typename?: 'Invigilator';
  requirements?: Maybe<InvigilatorRequirements>;
  teacher: Teacher;
  todos?: Maybe<InvigilatorTodos>;
};

/**
 * InvigilatorConstraints are the per-invigilator constraints kept in the DB and
 * edited via the GUI (separate from the ZPA-sourced invigilator_requirements,
 * which is overwritten on every ZPA pull). They are merged on top of the ZPA
 * requirements: isNotInvigilator removes the person from invigilation duty,
 * excludedDates add whole blocked days, and timeWindows block parts of a day.
 */
export type InvigilatorConstraints = {
  __typename?: 'InvigilatorConstraints';
  excludedDates: Array<Scalars['Time']['output']>;
  isNotInvigilator: Scalars['Boolean']['output'];
  teacherID: Scalars['Int']['output'];
  timeWindows: Array<InvigilationTimeWindow>;
};

export type InvigilatorConstraintsInput = {
  excludedDates: Array<Scalars['Time']['input']>;
  isNotInvigilator: Scalars['Boolean']['input'];
  teacherID: Scalars['Int']['input'];
  timeWindows: Array<InvigilationTimeWindowInput>;
};

/** InvigilatorOutlier: a person whose assigned minutes are furthest from target. */
export type InvigilatorOutlier = {
  __typename?: 'InvigilatorOutlier';
  doing: Scalars['Int']['output'];
  invigilatorID: Scalars['Int']['output'];
  open: Scalars['Int']['output'];
  percent: Scalars['Float']['output'];
  target: Scalars['Int']['output'];
};

export type InvigilatorRequirements = {
  __typename?: 'InvigilatorRequirements';
  allContributions: Scalars['Int']['output'];
  examDays: Array<Scalars['Int']['output']>;
  examTimes: Array<ExamTime>;
  excludedDates: Array<Scalars['Time']['output']>;
  excludedDays: Array<Scalars['Int']['output']>;
  factor: Scalars['Float']['output'];
  freeSemester: Scalars['Float']['output'];
  /**
   * fromZpa is false if the invigilator has not yet entered their requirements in
   * the ZPA. In that case default requirements (full time, no contributions) are
   * used and the invigilator still has to provide their real requirements.
   */
  fromZpa: Scalars['Boolean']['output'];
  liveCodingContribution: Scalars['Int']['output'];
  masterContribution: Scalars['Int']['output'];
  oralExamsContribution: Scalars['Int']['output'];
  overtimeLastSemester: Scalars['Float']['output'];
  overtimeThisSemester: Scalars['Float']['output'];
  partTime: Scalars['Float']['output'];
  timeWindows: Array<InvigilationTimeWindow>;
};

export type InvigilatorTodos = {
  __typename?: 'InvigilatorTodos';
  doingMinutes: Scalars['Int']['output'];
  enough: Scalars['Boolean']['output'];
  invigilationDays?: Maybe<Array<Scalars['Int']['output']>>;
  invigilations?: Maybe<Array<Invigilation>>;
  totalMinutes: Scalars['Int']['output'];
};

export type InvigilatorsForDay = {
  __typename?: 'InvigilatorsForDay';
  can: Array<Invigilator>;
  want: Array<Invigilator>;
};

/** A single comment on a Jira issue. */
export type JiraComment = {
  __typename?: 'JiraComment';
  author?: Maybe<JiraUser>;
  body: Scalars['String']['output'];
  created?: Maybe<Scalars['Time']['output']>;
};

/** A Jira issue (the subset plexams reads/writes). */
export type JiraIssue = {
  __typename?: 'JiraIssue';
  /** The issue's comments, oldest first. Only populated by jiraIssue(key); empty in list views. */
  comments: Array<JiraComment>;
  /** Creation time, when known. */
  created?: Maybe<Scalars['Time']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  issueType?: Maybe<Scalars['String']['output']>;
  key: Scalars['String']['output'];
  /** The reporter/author. Populated in list and detail views. */
  reporter?: Maybe<JiraUser>;
  status?: Maybe<Scalars['String']['output']>;
  summary: Scalars['String']['output'];
  /** Browse URL, e.g. https://jira.cc.hm.edu/browse/PLEX-42. */
  url: Scalars['String']['output'];
};

/** Open issues of one issue type — the grouping returned by jiraOpenIssuesByType. */
export type JiraIssueGroup = {
  __typename?: 'JiraIssueGroup';
  issueType: Scalars['String']['output'];
  issues: Array<JiraIssue>;
};

/** Open issues of one JSM customer request type — returned by jiraOpenIssuesByRequestType (FK07PP is a service desk project). */
export type JiraRequestTypeGroup = {
  __typename?: 'JiraRequestTypeGroup';
  issues: Array<JiraIssue>;
  /** Customer request type name, or "(kein Anfragetyp)" for issues raised without one. */
  requestType: Scalars['String']['output'];
};

/** A workflow transition currently available on an issue; ids are workflow- and status-specific. */
export type JiraTransition = {
  __typename?: 'JiraTransition';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

/** Authenticated Jira user — returned by jiraConnection to verify the configured PAT. */
export type JiraUser = {
  __typename?: 'JiraUser';
  displayName: Scalars['String']['output'];
  emailAddress: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

/**
 * LogLevel classifies a streamed LogLine. PROGRESS lines are throttled optimizer
 * snapshots and should be rendered in-place (like a spinner) instead of appended.
 * DONE marks the final line of a stream.
 */
export enum LogLevel {
  Done = 'DONE',
  Error = 'ERROR',
  Info = 'INFO',
  Progress = 'PROGRESS',
  Result = 'RESULT',
  Warn = 'WARN'
}

/**
 * LogLine is one streamed line of output. text carries the rendered line including
 * ANSI color codes, so a terminal-like frontend can display it verbatim. progress
 * is only set when level is PROGRESS; report is only set on the final RESULT line
 * of an invigilation generation and carries the structured outcome.
 */
export type LogLine = {
  __typename?: 'LogLine';
  examReport?: Maybe<ExamScheduleReport>;
  level: LogLevel;
  progress?: Maybe<OptimizerProgress>;
  report?: Maybe<InvigilationReport>;
  text: Scalars['String']['output'];
  validation?: Maybe<ValidationReport>;
};

/** MinutesReport: distribution of assigned vs. target minutes around the tolerance band. */
export type MinutesReport = {
  __typename?: 'MinutesReport';
  over: Scalars['Int']['output'];
  toleranceMin: Scalars['Int']['output'];
  under: Scalars['Int']['output'];
  withinTolerance: Scalars['Int']['output'];
};

export type MucDaiExam = {
  __typename?: 'MucDaiExam';
  /**
   * Ancode of the created/linked exam: our ZPA ancode for FK07-planned exams, the
   * auto-assigned ancode for exams planned by other faculties. null if not yet
   * created/linked.
   */
  ancode?: Maybe<Scalars['Int']['output']>;
  duration: Scalars['Int']['output'];
  examType: Scalars['String']['output'];
  isRepeaterExam: Scalars['Boolean']['output'];
  /**
   * Link status to our data: "external" (auto-created external exam, linked), "zpa"
   * (linked to a ZPA exam), or "unresolved" (FK07 exam with no clear ZPA match — needs
   * manual linking).
   */
  linkStatus: Scalars['String']['output'];
  mainExamer: Scalars['String']['output'];
  mainExamerID?: Maybe<Scalars['Int']['output']>;
  module: Scalars['String']['output'];
  /** The plan entry, if planned: dayNumber/slotNumber = my time, externalTime = the other faculty's time. */
  planEntry?: Maybe<PlanEntry>;
  /** the responsible faculty (Prüfungsplanung), e.g. FK07 / FK03 / FK08 / FK12. */
  plannedBy: Scalars['String']['output'];
  primussAncode: Scalars['Int']['output'];
  program: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addConstraints: Constraints;
  /** Add a plain-text comment to an issue. Returns true on success. */
  addJiraComment: Scalars['Boolean']['output'];
  addNTA: Nta;
  /**
   * Accept that an NTA gives up the room-alone right for one exam (key:
   * mtknr/ancode), with a reason. Downgrades the rooms validation to a warning and
   * is added to the NTA email.
   */
  addNtaRoomAloneWaiver: NtaRoomAloneWaiver;
  addPreplanExam: PreplanExam;
  /**
   * Add a Primuss ancode mapping to a ZPA exam.
   * Returns the (live computed) connected exam.
   */
  addPrimussAncode: ConnectedExam;
  /** Create a new room (key: name). Errors if a room with that name already exists. */
  addRoom: Room;
  /** Manually add a single room request (key: room + starttime). Errors if one already exists. Starts active and not approved. */
  addRoomRequest: RoomRequest;
  /**
   * addStudentReg manually adds a single student registration (mtknr) to a Primuss exam
   * (program + ancode), e.g. to correct a missing registration. Returns true on success.
   * Blocked while a validation or transfer/email is running.
   */
  addStudentReg: Scalars['Boolean']['output'];
  addZpaExamToPlan: Scalars['Boolean']['output'];
  /**
   * Generate room requests from the current plan and REPLACE all existing ones
   * (one-shot, no merge). Generated requests start active and not approved. Errors
   * if requests already exist unless force is true (force discards them, including
   * approved flags). Returns the number written.
   */
  applyRoomRequestsPreview: Scalars['Int']['output'];
  /** Block a room at an exam time so it is not used for planning there (e.g. otherwise occupied). reason is an optional note. */
  blockRoomAt: BlockedRoom;
  /** Block a room at several times at once (e.g. a whole day or a time range). Returns the stored blocks. */
  blockRoomAtTimes: Array<BlockedRoom>;
  clearEmailAttachments: Scalars['Int']['output'];
  /**
   * Link the pre-exam to a real ZPA exam (its ancode). The ancode must exist and
   * must not already be linked by another pre-exam.
   */
  connectPreplanExamToAncode: PreplanExam;
  /**
   * Create a Jira issue. project/issueType fall back to the jira.project config /
   * "Task" when omitted. Returns the created issue.
   */
  createJiraIssue: JiraIssue;
  /**
   * Create a new semester (in its own database) with the given config. The
   * semester must match YYYY-SS / YYYY-WS and must not already have a config.
   * Use setSemester to switch the running server to it afterwards.
   */
  createSemester: SaveSemesterConfigResult;
  /**
   * Create a new, independent database (workspace) for the logical semester of
   * `fromSemester` (e.g. "2026-SS"), copying that semester's config (dates/slots/
   * emails) so it matches. `database` is the new database name (e.g. "test-v2"); it
   * must not exist yet. The data stays empty — switch to it and import (e.g. from ZPA,
   * which uses the logical semester). Returns the new workspace.
   */
  createWorkspace: Semester;
  /** Delete an additional exam by ancode. Returns false if there was none. */
  deleteAdditionalExam: Scalars['Boolean']['output'];
  /** Remove the constraints record of one invigilator (key: teacherID). Returns false if there was none. */
  deleteInvigilatorConstraints: Scalars['Boolean']['output'];
  deletePreplanExam: Scalars['Boolean']['output'];
  /** Delete a special-interest group by name. Returns false if there was none. */
  deleteSpecialInterest: Scalars['Boolean']['output'];
  /** Delete a study program by its shortname. Returns false if there was none. */
  deleteStudyProgram: Scalars['Boolean']['output'];
  /** Remove the ZPA link from a pre-exam. */
  disconnectPreplanExam: PreplanExam;
  exahm: Scalars['Boolean']['output'];
  /**
   * fixExamRoomsPhase freezes the phase-A EXaHM/SEB placement (sets PhaseFixed, distinct
   * from the manual Locked). Returns the number of exams fixed. Phase B then treats them
   * as immovable obstacles.
   */
  fixExamRoomsPhase: Scalars['Int']['output'];
  /**
   * Renumber a Primuss exam (exam + student regs + conflicts) from fromAncode to
   * toAncode within a program. Returns the (live computed) connected exam.
   */
  fixPrimussAncode: ConnectedExam;
  /**
   * Regenerate the cached assembled exams from the current data and clear the stale
   * flag. Fast (~100ms); returns the new state plus the list of changes vs the
   * previously cached assembled exams.
   */
  generateAssembledExams: GenerateAssembledExamsResult;
  /**
   * Regenerate both the cached assembled exams and the per-student planned
   * registrations in one step. They share the same inputs (connected exams + Primuss
   * data) and are independent of each other, so they are always (re)generated together.
   * Clears both stale flags and reports both results.
   */
  generatePreparation: GeneratePreparationResult;
  /**
   * Generate a slot assignment for the pre-exams, distributing them only over the
   * MUC.DAI slots that already have Anny rooms booked (up to ~90% of each slot's
   * booked seats). Exams of the same study program never share a slot and are spread
   * across days; the most important exams (EXaHM, then large SEB) are placed first.
   * Uses a DSATUR constructive pass with a simulated-annealing repair for the hard
   * residue. Fixed pre-exams keep their slot; all non-fixed exams are re-planned
   * (with keepAssigned, currently-slotted non-fixed exams are kept too). The new
   * assignment is persisted; the result is its validation.
   */
  generatePreplanAssignment: PreplanValidation;
  /**
   * Regenerate the per-student planned registrations from the current data and clear
   * the stale flag. Returns the new state plus the number of students.
   */
  generateStudentRegs: GenerateStudentRegsResult;
  /**
   * Import MUC.DAI exams from a CSV (the file you get from MUC.DAI; columns Nr,
   * Modulname, Prüfungsform, Bewertung, Dauer, Erstpruefender, Zweitpruefender,
   * IstWiederholung, Studiengruppe, Prüfungsplanung). Replaces the mucdai_<program>
   * data and generates the non-ZPA exams for everything not planned by FK07 (FK07
   * exams already exist as ZPA exams and are only linked). The GUI sends the file
   * content as text.
   */
  importMucDaiExams: ImportMucDaiResult;
  lab: Scalars['Boolean']['output'];
  /** Mark an exam as planned by another faculty; inFK is that faculty (e.g. "FK10"). */
  notPlannedByMe: Scalars['Boolean']['output'];
  online: Scalars['Boolean']['output'];
  /** Pre-plan (fix) an invigilator for a room (roomName) or the reserve (roomName == null) at an exam time. */
  prePlanInvigilation: Scalars['Boolean']['output'];
  /**
   * prePlanInvigilationAt promotes the invigilation currently planned for a room
   * (roomName) or the reserve (roomName == null) at an exam time to a pre-planned,
   * fixed assignment, so it survives a re-run of the automatic planning.
   */
  prePlanInvigilationAt: Scalars['Boolean']['output'];
  prePlanRoom: Scalars['Boolean']['output'];
  /** Remove the duration override for an ancode. Returns false if there was none. */
  removeExamDuration: Scalars['Boolean']['output'];
  removeExamsCanShareSlot: Scalars['Boolean']['output'];
  /** Remove the (manual) link of a MUC.DAI exam and fall back to automatic detection. */
  removeMucDaiLink: MucDaiExam;
  /** Remove an NTA room-alone waiver (key: mtknr/ancode). */
  removeNtaRoomAloneWaiver: Scalars['Boolean']['output'];
  /** Remove a permanent non-invigilator (key: teacherID). Returns false if there was none. */
  removePermanentNonInvigilator: Scalars['Boolean']['output'];
  /** Remove a pre-planned invigilation (key: starttime/roomName; roomName null = the reserve). */
  removePrePlannedInvigilation: Scalars['Boolean']['output'];
  /** Remove a pre-planned room from an exam (key: ancode/roomName/mtknr). mtknr null = the room for normal students. */
  removePrePlannedRoom: Scalars['Boolean']['output'];
  /**
   * Remove a (manually added) Primuss ancode mapping of a program from a ZPA exam.
   * Returns the (live computed) connected exam.
   */
  removePrimussAncode: ConnectedExam;
  /** Remove the explicit decision (back to automatic handling). */
  removeStudentConflictDecision: Scalars['Boolean']['output'];
  /**
   * removeStudentReg manually removes a single student registration (mtknr) from a Primuss
   * exam (program + ancode). Returns the number of registrations removed (0 or 1). Blocked
   * while a validation or transfer/email is running.
   */
  removeStudentReg: Scalars['Int']['output'];
  /** Remove a user from the allow-list, so they can no longer log in. Requires role ADMIN. */
  removeUser: Scalars['Boolean']['output'];
  /**
   * Delete the cached assembled exams and their state, undoing a generation; they can be
   * rebuilt with generateAssembledExams. Returns how many assembled exams were removed.
   * Blocked while a validation or transfer/email is running.
   */
  resetAssembledExams: Scalars['Int']['output'];
  /** Reset the session dry-run recipient override back to the configured default. */
  resetDryRunTestMail: DryRunTestMailStatus;
  /** Remove a template's override, reverting to the built-in default. False if there was none. */
  resetEmailTemplate: Scalars['Boolean']['output'];
  /**
   * resetExamSchedule removes the generated exam schedule (phase B): all placements that
   * are not manually locked, not external / not-planned-by-me and not frozen by the
   * EXaHM/SEB room phase (phaseFixed). Returns the number of entries removed. A full reset
   * (incl. phase A) = unfixExamRoomsPhase then resetExamSchedule. Blocked while published.
   */
  resetExamSchedule: Scalars['Int']['output'];
  /**
   * Reset the assigned invigilations (invigilations_other) so only the
   * pre-planning remains; self-invigilations are refreshed on the next generation.
   * Blocked while the invigilation plan is published.
   */
  resetInvigilations: Scalars['Boolean']['output'];
  /**
   * Reset the Vorplanung: clear the planned time of every NON-fixed pre-exam
   * (fixed ones and the pre-exams themselves are kept). Returns how many were reset.
   */
  resetPreplanTimes: Scalars['Int']['output'];
  /**
   * resetPrimussData deletes all imported Primuss Sammellisten collections (the
   * per-program studentregs/exams/count/conflicts written by the ZIP import), undoing an
   * import. The manually maintained ancode overlay is kept. Returns the programs whose
   * data was removed. Blocked while a validation or transfer/email is running.
   */
  resetPrimussData: Array<Scalars['String']['output']>;
  /**
   * Reset the assigned room plan (planned_rooms) so only the pre-planning remains;
   * re-assignment re-applies it. Blocked while the room plan is published.
   */
  resetRoomsForExams: Scalars['Boolean']['output'];
  rmZpaExamFromPlan: Scalars['Boolean']['output'];
  seb: Scalars['Boolean']['output'];
  /**
   * Seed study programs from the configured lists (fk07programs, mucdaiprograms,
   * miscprograms) without overwriting existing ones. Returns the number created.
   */
  seedStudyProgramsFromConfig: Scalars['Int']['output'];
  /**
   * Set the personalization names that mark 'our' Anny bookings (mine=true). Does
   * not filter; all bookings are still fetched and shown.
   */
  setAnnyPersonalizationNames: AnnyConfig;
  /** Override the dry-run recipient for this session only (Probeläufe page). Empty string resets to the default. */
  setDryRunTestMail: DryRunTestMailStatus;
  /**
   * Store a Markdown override for an email template. The Markdown is validated (must parse
   * with the template functions) before it is saved. Returns the updated template.
   */
  setEmailTemplate: EmailTemplate;
  /** Set the duration override (minutes) for an ancode. Applied only when the ZPA duration is 0. */
  setExamDuration: ExamDurationOverride;
  /**
   * Place an exam at an absolute start time (the source of truth). Any time is accepted;
   * the GUI should warn — but still allow — when the time is not one of the semester's
   * standard start times (semesterConfig.starttimes).
   */
  setExamTime: Scalars['Boolean']['output'];
  /** Declare / undeclare that two exams may share a slot. */
  setExamsCanShareSlot: Scalars['Boolean']['output'];
  /**
   * Set the external date/time of an exam (e.g. a MUC.DAI exam planned by another
   * faculty). The matching slot is computed and stored as the plan entry's
   * externalTime. date: dd.mm.yyyy, time: HH:MM.
   */
  setExternalExamTime: Scalars['Boolean']['output'];
  /** Store the generation config (global). Returns the saved config. */
  setGenerationConfig: GenerationConfig;
  /** Create or replace the whole constraints record of one invigilator (key: teacherID). */
  setInvigilatorConstraints: InvigilatorConstraints;
  /**
   * Manually link a MUC.DAI exam (program + primussAncode) to a ZPA exam (zpaAncode),
   * for the unresolved/wrong FK07 cases. Stored as a manual link that survives re-imports.
   */
  setMucDaiZpaLink: MucDaiExam;
  /** Activate/deactivate an NTA (key: mtknr). A deactivated NTA is not applied to exams. */
  setNTAActive: Nta;
  /**
   * Add or update a permanent (cross-semester) non-invigilator (key: teacherID),
   * e.g. someone retired. name is the display name (pass the candidate's name; if
   * empty the backend tries to resolve it).
   */
  setPermanentNonInvigilator: PermanentNonInvigilator;
  /**
   * Set the planner, stored in the global DB. name + email are required; the remaining
   * fields are optional sender-identity overrides — pass null/empty to fall back to the
   * derived default (testMail/cc = email with +plexams, noreplyMail = noreply+plexams@hm.edu,
   * noreplyName = "Prüfungsplanung FK07 (NOREPLY)").
   */
  setPlaner: Planer;
  /** Set or clear a planning condition by hand (e.g. mark/unmark a plan as published). Returns the new state. */
  setPlanningCondition: PlanningState;
  /**
   * Mark (canShare=true) or unmark (false) another pre-exam as "may run at the same time /
   * right after" this one despite a shared study program (no common students). The link is
   * kept symmetric and cancels the program-based spreading for that pair.
   */
  setPreplanExamCanShareSlot: PreplanExam;
  /**
   * Set the constraints of a pre-exam (room restrictions, same-slot, …). Reuses the
   * normal ConstraintsInput, but its `sameSlot` references other PRE-EXAM ids (not
   * ancodes) — they are kept symmetric. On connectPreplanExamToAncode these
   * constraints are carried over to the ZPA exam (sameSlot translated to ancodes).
   */
  setPreplanExamConstraints: PreplanExam;
  /**
   * Pin/unpin the pre-exam's current slot. A fixed pre-exam keeps its slot when the
   * automatic assignment is (re-)generated; all non-fixed exams are re-planned.
   */
  setPreplanExamFixed: PreplanExam;
  /**
   * Mark (conflict=true) or unmark (false) another pre-exam as "must not run at the same
   * time" as this one (same students). The link is kept symmetric. Soft: the automatic
   * assignment then spreads the two apart (different days, else max slot distance).
   */
  setPreplanExamNotSameSlot: PreplanExam;
  /**
   * Assign the pre-exam to a start time, or clear it (pass starttime or null). The time
   * must be a real slot start of this semester.
   */
  setPreplanExamTime: PreplanExam;
  /** Activate/deactivate a room (key: name). A deactivated room is not used for planning. */
  setRoomActive: Room;
  /** Activate/deactivate a room request; inactive requests are not used for room planning. */
  setRoomRequestActive: RoomRequest;
  /** Set the approved flag of a room request (key: room + starttime). */
  setRoomRequestApproved: RoomRequest;
  /**
   * Switch the running server to another database (workspace) at runtime. `name` is
   * the database name from allSemesterNames (id), e.g. "2026-SS" or "test-v2". The
   * logical semester used against external systems (ZPA) is the database's own stored
   * semester — independent of the database name. `semester` is an optional override,
   * only needed for a database that has no stored semester yet (then it is
   * remembered). The target may be empty (config null until created/imported).
   * Refused while an operation is running. The GUI must refetch all data afterwards.
   */
  setSemester: Semester;
  /**
   * Replace the raw per-semester config. The derived semesterConfig (days, slots,
   * go-slots) is recomputed and stored. Returns warnings for changes that may
   * invalidate an existing plan (the change is still applied).
   */
  setSemesterConfigInput: SaveSemesterConfigResult;
  /**
   * Protect or unprotect the current database: when read-only, all data-changing
   * operations (mutations and imports/generation/uploads) are rejected, but the
   * semester can still be viewed and validated, and you can switch away. Useful to
   * guard the real semester while replaying in a clone.
   */
  setSemesterReadOnly: Semester;
  /**
   * Set an explicit decision for a student's conflict (ACCEPT drops the penalty;
   * VETO forces it to count despite an automatic repeat down-weighting).
   */
  setStudentConflictDecision: Scalars['Boolean']['output'];
  /**
   * Create or update a user (upsert by email). Admin surface for opening access to a
   * wider circle with restricted rights (seed VIEWER users here). Requires role ADMIN.
   */
  setUser: User;
  /** Move an issue through a workflow transition (id from jiraTransitions). Returns true on success. */
  transitionJiraIssue: Scalars['Boolean']['output'];
  /** Remove a room block (key: room + starttime). */
  unblockRoomAt: Scalars['Boolean']['output'];
  /** Remove the room blocks at several times at once. Returns how many blocks were removed. */
  unblockRoomAtTimes: Scalars['Int']['output'];
  /** unfixExamRoomsPhase clears the phase-A freeze on all exams (manual Locked stays). */
  unfixExamRoomsPhase: Scalars['Boolean']['output'];
  /** Update the editable fields of an existing NTA (key: mtknr). Errors if it does not exist. */
  updateNTA: Nta;
  updatePreplanExam: PreplanExam;
  /** Update an existing room (key: name). Errors if it does not exist; keeps the active state. */
  updateRoom: Room;
  /**
   * Change the time range of an existing room request, e.g. extend it for an NTA
   * (key: room + starttime). Errors if it does not exist.
   */
  updateRoomRequestTime: RoomRequest;
  /** Create or update an additional exam (key: ancode). */
  upsertAdditionalExam: AdditionalExam;
  /** Create or update a special-interest group (key: name). */
  upsertSpecialInterest: SpecialInterest;
  /** Create or update a study program (key: shortname/Kürzel). */
  upsertStudyProgram: StudyProgram;
};


export type MutationAddConstraintsArgs = {
  ancode: Scalars['Int']['input'];
  constraints: ConstraintsInput;
};


export type MutationAddJiraCommentArgs = {
  body: Scalars['String']['input'];
  key: Scalars['String']['input'];
};


export type MutationAddNtaArgs = {
  input: NtaInput;
};


export type MutationAddNtaRoomAloneWaiverArgs = {
  ancode: Scalars['Int']['input'];
  mtknr: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationAddPreplanExamArgs = {
  input: PreplanExamInput;
};


export type MutationAddPrimussAncodeArgs = {
  primussAncode: Scalars['Int']['input'];
  program: Scalars['String']['input'];
  zpaAncode: Scalars['Int']['input'];
};


export type MutationAddRoomArgs = {
  input: RoomInput;
};


export type MutationAddRoomRequestArgs = {
  from: Scalars['Time']['input'];
  room: Scalars['String']['input'];
  starttime: Scalars['Time']['input'];
  until: Scalars['Time']['input'];
};


export type MutationAddStudentRegArgs = {
  ancode: Scalars['Int']['input'];
  mtknr: Scalars['String']['input'];
  program: Scalars['String']['input'];
};


export type MutationAddZpaExamToPlanArgs = {
  ancode: Scalars['Int']['input'];
};


export type MutationApplyRoomRequestsPreviewArgs = {
  force: Scalars['Boolean']['input'];
};


export type MutationBlockRoomAtArgs = {
  reason?: InputMaybe<Scalars['String']['input']>;
  room: Scalars['String']['input'];
  starttime: Scalars['Time']['input'];
};


export type MutationBlockRoomAtTimesArgs = {
  reason?: InputMaybe<Scalars['String']['input']>;
  room: Scalars['String']['input'];
  starttimes: Array<Scalars['Time']['input']>;
};


export type MutationClearEmailAttachmentsArgs = {
  kind: Scalars['String']['input'];
};


export type MutationConnectPreplanExamToAncodeArgs = {
  ancode: Scalars['Int']['input'];
  id: Scalars['Int']['input'];
};


export type MutationCreateJiraIssueArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  issueType?: InputMaybe<Scalars['String']['input']>;
  project?: InputMaybe<Scalars['String']['input']>;
  summary: Scalars['String']['input'];
};


export type MutationCreateSemesterArgs = {
  input: SemesterConfigInputData;
  semester: Scalars['String']['input'];
};


export type MutationCreateWorkspaceArgs = {
  database: Scalars['String']['input'];
  fromSemester: Scalars['String']['input'];
};


export type MutationDeleteAdditionalExamArgs = {
  ancode: Scalars['Int']['input'];
};


export type MutationDeleteInvigilatorConstraintsArgs = {
  teacherID: Scalars['Int']['input'];
};


export type MutationDeletePreplanExamArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteSpecialInterestArgs = {
  name: Scalars['String']['input'];
};


export type MutationDeleteStudyProgramArgs = {
  shortname: Scalars['String']['input'];
};


export type MutationDisconnectPreplanExamArgs = {
  id: Scalars['Int']['input'];
};


export type MutationExahmArgs = {
  ancode: Scalars['Int']['input'];
};


export type MutationFixPrimussAncodeArgs = {
  fromAncode: Scalars['Int']['input'];
  program: Scalars['String']['input'];
  toAncode: Scalars['Int']['input'];
  zpaAncode: Scalars['Int']['input'];
};


export type MutationGeneratePreplanAssignmentArgs = {
  keepAssigned?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationImportMucDaiExamsArgs = {
  csv: Scalars['String']['input'];
};


export type MutationLabArgs = {
  ancode: Scalars['Int']['input'];
};


export type MutationNotPlannedByMeArgs = {
  ancode: Scalars['Int']['input'];
  inFK?: InputMaybe<Scalars['String']['input']>;
};


export type MutationOnlineArgs = {
  ancode: Scalars['Int']['input'];
};


export type MutationPrePlanInvigilationArgs = {
  invigilatorID: Scalars['Int']['input'];
  roomName?: InputMaybe<Scalars['String']['input']>;
  starttime: Scalars['Time']['input'];
};


export type MutationPrePlanInvigilationAtArgs = {
  roomName?: InputMaybe<Scalars['String']['input']>;
  starttime: Scalars['Time']['input'];
};


export type MutationPrePlanRoomArgs = {
  ancode: Scalars['Int']['input'];
  mtknr?: InputMaybe<Scalars['String']['input']>;
  reserve: Scalars['Boolean']['input'];
  roomName: Scalars['String']['input'];
  seats?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationRemoveExamDurationArgs = {
  ancode: Scalars['Int']['input'];
};


export type MutationRemoveExamsCanShareSlotArgs = {
  ancode1: Scalars['Int']['input'];
  ancode2: Scalars['Int']['input'];
};


export type MutationRemoveMucDaiLinkArgs = {
  primussAncode: Scalars['Int']['input'];
  program: Scalars['String']['input'];
};


export type MutationRemoveNtaRoomAloneWaiverArgs = {
  ancode: Scalars['Int']['input'];
  mtknr: Scalars['String']['input'];
};


export type MutationRemovePermanentNonInvigilatorArgs = {
  teacherID: Scalars['Int']['input'];
};


export type MutationRemovePrePlannedInvigilationArgs = {
  roomName?: InputMaybe<Scalars['String']['input']>;
  starttime: Scalars['Time']['input'];
};


export type MutationRemovePrePlannedRoomArgs = {
  ancode: Scalars['Int']['input'];
  mtknr?: InputMaybe<Scalars['String']['input']>;
  roomName: Scalars['String']['input'];
};


export type MutationRemovePrimussAncodeArgs = {
  program: Scalars['String']['input'];
  zpaAncode: Scalars['Int']['input'];
};


export type MutationRemoveStudentConflictDecisionArgs = {
  ancode1: Scalars['Int']['input'];
  ancode2: Scalars['Int']['input'];
  mtknr: Scalars['String']['input'];
};


export type MutationRemoveStudentRegArgs = {
  ancode: Scalars['Int']['input'];
  mtknr: Scalars['String']['input'];
  program: Scalars['String']['input'];
};


export type MutationRemoveUserArgs = {
  email: Scalars['String']['input'];
};


export type MutationResetEmailTemplateArgs = {
  name: Scalars['String']['input'];
};


export type MutationRmZpaExamFromPlanArgs = {
  ancode: Scalars['Int']['input'];
};


export type MutationSebArgs = {
  ancode: Scalars['Int']['input'];
};


export type MutationSetAnnyPersonalizationNamesArgs = {
  names: Array<Scalars['String']['input']>;
};


export type MutationSetDryRunTestMailArgs = {
  email: Scalars['String']['input'];
};


export type MutationSetEmailTemplateArgs = {
  markdown: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationSetExamDurationArgs = {
  ancode: Scalars['Int']['input'];
  duration: Scalars['Int']['input'];
};


export type MutationSetExamTimeArgs = {
  ancode: Scalars['Int']['input'];
  starttime: Scalars['Time']['input'];
};


export type MutationSetExamsCanShareSlotArgs = {
  ancode1: Scalars['Int']['input'];
  ancode2: Scalars['Int']['input'];
};


export type MutationSetExternalExamTimeArgs = {
  ancode: Scalars['Int']['input'];
  date: Scalars['String']['input'];
  time: Scalars['String']['input'];
};


export type MutationSetGenerationConfigArgs = {
  input: GenerationConfigInput;
};


export type MutationSetInvigilatorConstraintsArgs = {
  input: InvigilatorConstraintsInput;
};


export type MutationSetMucDaiZpaLinkArgs = {
  primussAncode: Scalars['Int']['input'];
  program: Scalars['String']['input'];
  zpaAncode: Scalars['Int']['input'];
};


export type MutationSetNtaActiveArgs = {
  active: Scalars['Boolean']['input'];
  mtknr: Scalars['String']['input'];
};


export type MutationSetPermanentNonInvigilatorArgs = {
  name: Scalars['String']['input'];
  reason: Scalars['String']['input'];
  teacherID: Scalars['Int']['input'];
};


export type MutationSetPlanerArgs = {
  cc?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  noreplyMail?: InputMaybe<Scalars['String']['input']>;
  noreplyName?: InputMaybe<Scalars['String']['input']>;
  testMail?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetPlanningConditionArgs = {
  done: Scalars['Boolean']['input'];
  key: Scalars['String']['input'];
};


export type MutationSetPreplanExamCanShareSlotArgs = {
  canShare: Scalars['Boolean']['input'];
  id: Scalars['Int']['input'];
  otherID: Scalars['Int']['input'];
};


export type MutationSetPreplanExamConstraintsArgs = {
  constraints: ConstraintsInput;
  id: Scalars['Int']['input'];
};


export type MutationSetPreplanExamFixedArgs = {
  fixed: Scalars['Boolean']['input'];
  id: Scalars['Int']['input'];
};


export type MutationSetPreplanExamNotSameSlotArgs = {
  conflict: Scalars['Boolean']['input'];
  id: Scalars['Int']['input'];
  otherID: Scalars['Int']['input'];
};


export type MutationSetPreplanExamTimeArgs = {
  id: Scalars['Int']['input'];
  starttime?: InputMaybe<Scalars['Time']['input']>;
};


export type MutationSetRoomActiveArgs = {
  active: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
};


export type MutationSetRoomRequestActiveArgs = {
  active: Scalars['Boolean']['input'];
  room: Scalars['String']['input'];
  starttime: Scalars['Time']['input'];
};


export type MutationSetRoomRequestApprovedArgs = {
  approved: Scalars['Boolean']['input'];
  room: Scalars['String']['input'];
  starttime: Scalars['Time']['input'];
};


export type MutationSetSemesterArgs = {
  name: Scalars['String']['input'];
  semester?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetSemesterConfigInputArgs = {
  input: SemesterConfigInputData;
};


export type MutationSetSemesterReadOnlyArgs = {
  readOnly: Scalars['Boolean']['input'];
};


export type MutationSetStudentConflictDecisionArgs = {
  ancode1: Scalars['Int']['input'];
  ancode2: Scalars['Int']['input'];
  decision: ConflictDecision;
  mtknr: Scalars['String']['input'];
};


export type MutationSetUserArgs = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  role: Role;
};


export type MutationTransitionJiraIssueArgs = {
  key: Scalars['String']['input'];
  transitionId: Scalars['String']['input'];
};


export type MutationUnblockRoomAtArgs = {
  room: Scalars['String']['input'];
  starttime: Scalars['Time']['input'];
};


export type MutationUnblockRoomAtTimesArgs = {
  room: Scalars['String']['input'];
  starttimes: Array<Scalars['Time']['input']>;
};


export type MutationUpdateNtaArgs = {
  input: NtaInput;
};


export type MutationUpdatePreplanExamArgs = {
  id: Scalars['Int']['input'];
  input: PreplanExamInput;
};


export type MutationUpdateRoomArgs = {
  input: RoomInput;
};


export type MutationUpdateRoomRequestTimeArgs = {
  from: Scalars['Time']['input'];
  room: Scalars['String']['input'];
  starttime: Scalars['Time']['input'];
  until: Scalars['Time']['input'];
};


export type MutationUpsertAdditionalExamArgs = {
  input: AdditionalExamInput;
};


export type MutationUpsertSpecialInterestArgs = {
  input: SpecialInterestInput;
};


export type MutationUpsertStudyProgramArgs = {
  input: StudyProgramInput;
};

export type MutationLogArg = {
  __typename?: 'MutationLogArg';
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type MutationLogEntry = {
  __typename?: 'MutationLogEntry';
  /** Ancodes referenced by the arguments (ancode / zpaAncode / primussAncode / …). */
  ancodes: Array<Scalars['Int']['output']>;
  /** The call arguments, flattened to key/value pairs (nested input objects included). */
  args: Array<MutationLogArg>;
  durationMs: Scalars['Int']['output'];
  /** Set when the operation returned an error (for subscriptions only the start error, if any). */
  error?: Maybe<Scalars['String']['output']>;
  /** GraphQL operation/field name, e.g. addPreplanExam. */
  name: Scalars['String']['output'];
  time: Scalars['Time']['output'];
  /** mutation | subscription | upload */
  type: Scalars['String']['output'];
  /**
   * The operator (Prüfungsplaner) who triggered the operation; from the local
   * operator.* config (empty for entries written before this was configured).
   */
  user?: Maybe<Scalars['String']['output']>;
};

export type Nta = {
  __typename?: 'NTA';
  compensation: Scalars['String']['output'];
  deactivated: Scalars['Boolean']['output'];
  deltaDurationPercent: Scalars['Int']['output'];
  email?: Maybe<Scalars['String']['output']>;
  from: Scalars['String']['output'];
  lastSemester?: Maybe<Scalars['String']['output']>;
  mtknr: Scalars['String']['output'];
  name: Scalars['String']['output'];
  needsHardware: Scalars['Boolean']['output'];
  needsRoomAlone: Scalars['Boolean']['output'];
  program: Scalars['String']['output'];
  until: Scalars['String']['output'];
};

export type NtaInput = {
  compensation: Scalars['String']['input'];
  deltaDurationPercent: Scalars['Int']['input'];
  email?: InputMaybe<Scalars['String']['input']>;
  from: Scalars['String']['input'];
  mtknr: Scalars['String']['input'];
  name: Scalars['String']['input'];
  needsHardware: Scalars['Boolean']['input'];
  needsRoomAlone: Scalars['Boolean']['input'];
  program: Scalars['String']['input'];
  until: Scalars['String']['input'];
};

export type NtaWithRegs = {
  __typename?: 'NTAWithRegs';
  nta: Nta;
  regs?: Maybe<StudentRegsPerStudent>;
};

export type NtaWithRegsByExam = {
  __typename?: 'NTAWithRegsByExam';
  exam: ZpaExam;
  ntas?: Maybe<Array<NtaWithRegs>>;
};

export type NtaWithRegsByExamAndTeacher = {
  __typename?: 'NTAWithRegsByExamAndTeacher';
  exams?: Maybe<Array<NtaWithRegsByExam>>;
  teacher: Teacher;
};

export type NtaRoomAloneWaiver = {
  __typename?: 'NtaRoomAloneWaiver';
  ancode: Scalars['Int']['output'];
  mtknr: Scalars['String']['output'];
  reason: Scalars['String']['output'];
};

/** OptimizerConstraint describes one applied constraint (for the read-only view). */
export type OptimizerConstraint = {
  __typename?: 'OptimizerConstraint';
  description: Scalars['String']['output'];
  /** hard | soft */
  kind: Scalars['String']['output'];
  name: Scalars['String']['output'];
  /** display priority (lower = more important). */
  tier: Scalars['Int']['output'];
  title: Scalars['String']['output'];
  /** soft-constraint weight (0 for hard). */
  weight: Scalars['Float']['output'];
};

/**
 * OptimizerProgress is the structured payload of a PROGRESS LogLine, mirroring the
 * simulated-annealing optimizer snapshot.
 */
export type OptimizerProgress = {
  __typename?: 'OptimizerProgress';
  balance: Scalars['Boolean']['output'];
  bestCost: Scalars['Float']['output'];
  iteration: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  unfilled: Scalars['Int']['output'];
};

/**
 * PermanentNonInvigilator is a teacher who never does invigilation duty again
 * (e.g. retired). It lives in the global plexams database and therefore carries
 * over between semesters; it always implies isNotInvigilator.
 */
export type PermanentNonInvigilator = {
  __typename?: 'PermanentNonInvigilator';
  /** Denormalized display name, kept so the entry stays readable even after the teacher has left the FK07 invigilator pool. */
  name: Scalars['String']['output'];
  reason: Scalars['String']['output'];
  teacherID: Scalars['Int']['output'];
};

export type PlanEntry = {
  __typename?: 'PlanEntry';
  ancode: Scalars['Int']['output'];
  /** true for an exam placed by another faculty (kept when the generated plan is reset). */
  external: Scalars['Boolean']['output'];
  locked: Scalars['Boolean']['output'];
  /** fixed by the EXaHM/SEB room phase (phase A), distinct from the manual lock. */
  phaseFixed: Scalars['Boolean']['output'];
  /** The absolute start time — the source of truth for the placement. */
  starttime: Scalars['Time']['output'];
};

export type Planer = {
  __typename?: 'Planer';
  /** Override for the Cc added to every real send; null/empty => defaultMail. */
  cc?: Maybe<Scalars['String']['output']>;
  /** Derived default for testMail/cc: the planner email with +plexams (e.g. x+plexams@hm.edu). */
  defaultMail: Scalars['String']['output'];
  /** The Cc actually added to real sends (override → config → defaultMail). */
  effectiveCc: Scalars['String']['output'];
  /** The noreply address actually used (override → config → noreply+plexams@hm.edu). */
  effectiveNoreplyMail: Scalars['String']['output'];
  /** The noreply display name actually used (override → config → default). */
  effectiveNoreplyName: Scalars['String']['output'];
  /** The address dry-run mails actually go to (override → config → defaultMail). */
  effectiveTestMail: Scalars['String']['output'];
  email: Scalars['String']['output'];
  name: Scalars['String']['output'];
  /** Override for the noreply From/Reply-To address of JIRA-answered mails; null/empty => noreply+plexams@hm.edu. */
  noreplyMail?: Maybe<Scalars['String']['output']>;
  /** Override for the noreply display name; null/empty => "Prüfungsplanung FK07 (NOREPLY)". */
  noreplyName?: Maybe<Scalars['String']['output']>;
  /** Override for the dry-run recipient; null/empty => defaultMail. */
  testMail?: Maybe<Scalars['String']['output']>;
};

export type PlannedExam = {
  __typename?: 'PlannedExam';
  ancode: Scalars['Int']['output'];
  /** internal/external ancode identity of the exam (zpaAncode + program-scoped primussAncodes) */
  ancodes: Ancodes;
  conflicts: Array<ZpaConflict>;
  constraints?: Maybe<Constraints>;
  mainExamer: Teacher;
  maxDuration: Scalars['Int']['output'];
  ntas: Array<Nta>;
  planEntry?: Maybe<PlanEntry>;
  plannedRooms?: Maybe<Array<PlannedRoom>>;
  primussExams: Array<EnhancedPrimussExam>;
  studentRegsCount: Scalars['Int']['output'];
  zpaExam: ZpaExam;
};

export type PlannedRoom = {
  __typename?: 'PlannedRoom';
  ancode: Scalars['Int']['output'];
  duration: Scalars['Int']['output'];
  handicap: Scalars['Boolean']['output'];
  handicapRoomAlone: Scalars['Boolean']['output'];
  ntaMtknr?: Maybe<Scalars['String']['output']>;
  prePlanned: Scalars['Boolean']['output'];
  reserve: Scalars['Boolean']['output'];
  room: Room;
  /** Absolute start time of the exam using this room. */
  starttime?: Maybe<Scalars['Time']['output']>;
  studentsInRoom: Array<Scalars['String']['output']>;
};

export type PlanningCondition = {
  __typename?: 'PlanningCondition';
  /**
   * true when the condition is computed automatically from the underlying data
   * (read-only: it cannot be toggled by hand, done follows the data).
   */
  auto: Scalars['Boolean']['output'];
  /** true when the condition (milestone) is reached. */
  done: Scalars['Boolean']['output'];
  /** If set, the area this condition gates while done (e.g. ROOMS, INVIGILATIONS); null if it is not a gate. */
  gate?: Maybe<PlanningGate>;
  key: Scalars['String']['output'];
  phase: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

/** Areas that can be locked by a published gate. */
export enum PlanningGate {
  Exams = 'EXAMS',
  Invigilations = 'INVIGILATIONS',
  Rooms = 'ROOMS'
}

export type PlanningPhase = {
  __typename?: 'PlanningPhase';
  conditions: Array<PlanningCondition>;
  key: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type PlanningState = {
  __typename?: 'PlanningState';
  /** Areas whose generation is currently locked because a gate condition is set. */
  blockedAreas: Array<PlanningGate>;
  phases: Array<PlanningPhase>;
};

export type PreExam = {
  __typename?: 'PreExam';
  constraints?: Maybe<Constraints>;
  planEntry?: Maybe<PlanEntry>;
  zpaExam: ZpaExam;
};

/**
 * PrePlannedInvigilation fixes an invigilator for a room (or the reserve) in a
 * slot before the automatic invigilation planning runs. roomName is null for a
 * reserve invigilation.
 */
export type PrePlannedInvigilation = {
  __typename?: 'PrePlannedInvigilation';
  invigilatorID: Scalars['Int']['output'];
  isReserve: Scalars['Boolean']['output'];
  roomName?: Maybe<Scalars['String']['output']>;
  /** Absolute start time. */
  starttime?: Maybe<Scalars['Time']['output']>;
};

export type PrePlannedRoom = {
  __typename?: 'PrePlannedRoom';
  ancode: Scalars['Int']['output'];
  mtknr?: Maybe<Scalars['String']['output']>;
  reserve: Scalars['Boolean']['output'];
  roomName: Scalars['String']['output'];
  /** Optional exact number of students planned for this room; taken verbatim when generating. */
  seats?: Maybe<Scalars['Int']['output']>;
};

/**
 * A manually entered pseudo-exam for the SEB/EXaHM pre-planning, captured before the
 * ZPA exam list / Primuss data exist. Linked to a ZPA ancode later (phase 4).
 */
export type PreplanExam = {
  __typename?: 'PreplanExam';
  /** Set once linked to a real ZPA exam. */
  ancode?: Maybe<Scalars['Int']['output']>;
  /**
   * PRE-EXAM ids that may run at the same time / right after this one despite sharing a
   * study program (no common students). Cancels the spreading for that pair.
   */
  canShareSlot?: Maybe<Array<Scalars['Int']['output']>>;
  /**
   * Constraints captured during pre-planning (room restrictions, same-slot, …),
   * carried over to the ZPA exam on linking. In sameSlot the ints are PRE-EXAM ids.
   */
  constraints?: Maybe<Constraints>;
  duration?: Maybe<Scalars['Int']['output']>;
  /** EXaHM | SEB */
  examKind: Scalars['String']['output'];
  examerID: Scalars['Int']['output'];
  /** Snapshot of the examer's name. */
  examerName: Scalars['String']['output'];
  expectedStudents: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  /** True when the slot is pinned and survives a re-run of the automatic assignment. */
  isFixed: Scalars['Boolean']['output'];
  module: Scalars['String']['output'];
  /**
   * PRE-EXAM ids that should not run at the same time as this one (same students). Soft:
   * the assignment spreads them apart (different days, else maximum slot distance).
   */
  notSameSlot?: Maybe<Array<Scalars['Int']['output']>>;
  notes?: Maybe<Scalars['String']['output']>;
  /** Absolute start time the pre-exam is assigned to (null = not yet assigned). */
  plannedStarttime?: Maybe<Scalars['Time']['output']>;
  /** StudyProgram shortnames. */
  programs: Array<Scalars['String']['output']>;
};

export type PreplanExamInput = {
  duration?: InputMaybe<Scalars['Int']['input']>;
  examKind: Scalars['String']['input'];
  examerID: Scalars['Int']['input'];
  expectedStudents: Scalars['Int']['input'];
  module: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  programs: Array<Scalars['String']['input']>;
};

/** One graded finding of the pre-plan validation (same levels as ValidationFinding). */
export type PreplanFinding = {
  __typename?: 'PreplanFinding';
  level: ValidationLevel;
  message: Scalars['String']['output'];
};

export type PreplanKindNeed = {
  __typename?: 'PreplanKindNeed';
  examCount: Scalars['Int']['output'];
  /** Names of the suggested rooms (largest first). */
  rooms: Array<Scalars['String']['output']>;
  /** Greedily suggested number of rooms of this kind to cover the seats. */
  roomsSuggested: Scalars['Int']['output'];
  /** Rooms still to book in Anny to cover the demand (largest first); empty when enough is booked. */
  roomsToBook: Array<Scalars['String']['output']>;
  /** Total seats available across all rooms of this kind (per slot ceiling). */
  seatsAvailable: Scalars['Int']['output'];
  /** Seats already booked in Anny for this slot (0 for the unslotted bucket). */
  seatsBooked: Scalars['Int']['output'];
  seatsNeeded: Scalars['Int']['output'];
};

export type PreplanOverview = {
  __typename?: 'PreplanOverview';
  slots: Array<PreplanSlotNeed>;
};

export type PreplanProgramConflict = {
  __typename?: 'PreplanProgramConflict';
  modules: Array<Scalars['String']['output']>;
  preplanExamIDs: Array<Scalars['Int']['output']>;
  program: Scalars['String']['output'];
};

export type PreplanRule = {
  __typename?: 'PreplanRule';
  /** One- or two-sentence German explanation, including the relevant values. */
  description: Scalars['String']['output'];
  kind: PreplanRuleKind;
  /** Short German title. */
  title: Scalars['String']['output'];
};

export enum PreplanRuleKind {
  /** Must always hold; a plan violating it is invalid. */
  Hard = 'HARD',
  /** Optimization goal; the solver trades these off (weighted). */
  Soft = 'SOFT'
}

export type PreplanSameSlotGroup = {
  __typename?: 'PreplanSameSlotGroup';
  /** true when every member is connected (the same-slot is fully carried over to the ZPA exams). */
  complete: Scalars['Boolean']['output'];
  members: Array<PreplanSameSlotMember>;
};

export type PreplanSameSlotMember = {
  __typename?: 'PreplanSameSlotMember';
  ancode?: Maybe<Scalars['Int']['output']>;
  /** true when this member is linked to a ZPA ancode. */
  connected: Scalars['Boolean']['output'];
  examKind: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  module: Scalars['String']['output'];
};

export type PreplanSlotNeed = {
  __typename?: 'PreplanSlotNeed';
  /** Programs that appear in more than one pre-exam of this slot (possible clash). */
  conflicts: Array<PreplanProgramConflict>;
  exahm: PreplanKindNeed;
  seb: PreplanKindNeed;
  /** null starttime = the bucket of pre-exams without a slot yet. */
  starttime?: Maybe<Scalars['Time']['output']>;
};

export type PreplanValidation = {
  __typename?: 'PreplanValidation';
  assignedCount: Scalars['Int']['output'];
  /**
   * Graded findings. Small SEB exams that fit the R-building (no Anny booking needed)
   * are warnings, real capacity shortfalls are errors.
   */
  findings: Array<PreplanFinding>;
  /** Human-readable findings (German), flat text at all levels (kept for backward compatibility; prefer findings). */
  messages: Array<Scalars['String']['output']>;
  /** True when there are no error-level findings; warnings and infos do not fail the validation. */
  ok: Scalars['Boolean']['output'];
  /** Why the validation was skipped, if skipped. */
  skipReason?: Maybe<Scalars['String']['output']>;
  /**
   * True when the validation did not run because there are no SEB/EXaHM pre-exams yet.
   * Not a failure — render neutrally ("übersprungen"), not as a green pass.
   */
  skipped: Scalars['Boolean']['output'];
  /** ids of pre-exams without a slot. */
  unassignedIDs: Array<Scalars['Int']['output']>;
};

export type PrimussExam = {
  __typename?: 'PrimussExam';
  ancode: Scalars['Int']['output'];
  examType: Scalars['String']['output'];
  mainExamer: Scalars['String']['output'];
  module: Scalars['String']['output'];
  presence: Scalars['String']['output'];
  program: Scalars['String']['output'];
};

export type PrimussExamAncode = {
  __typename?: 'PrimussExamAncode';
  ancode: Scalars['Int']['output'];
  numberOfStuds: Scalars['Int']['output'];
  program: Scalars['String']['output'];
};

export type PrimussExamByProgram = {
  __typename?: 'PrimussExamByProgram';
  exams: Array<PrimussExamWithCount>;
  program: Scalars['String']['output'];
};

export type PrimussExamInput = {
  ancode: Scalars['Int']['input'];
  program: Scalars['String']['input'];
};

export type PrimussExamWithCount = {
  __typename?: 'PrimussExamWithCount';
  ancode: Scalars['Int']['output'];
  /** true if this Primuss exam is connected to a ZPA or external (MUC.DAI) exam. */
  connected: Scalars['Boolean']['output'];
  examType: Scalars['String']['output'];
  mainExamer: Scalars['String']['output'];
  module: Scalars['String']['output'];
  /**
   * true if connected to a ZPA exam selected to be planned by us (a subset of
   * connected; false for external/MUC.DAI links or not-to-plan ZPA exams).
   */
  plannedZPA: Scalars['Boolean']['output'];
  presence: Scalars['String']['output'];
  program: Scalars['String']['output'];
  studentRegsCount: Scalars['Int']['output'];
};

export type ProgramSpread = {
  __typename?: 'ProgramSpread';
  avgExamsPerStudent: Scalars['Float']['output'];
  avgMinFreeDays: Scalars['Float']['output'];
  freeDayShare: Scalars['Float']['output'];
  /** True when too few multi-exam students back the shares to be meaningful (read them with care). */
  lowSampleSize: Scalars['Boolean']['output'];
  multiExamStudentCount: Scalars['Int']['output'];
  program: Scalars['String']['output'];
  sameDayShare: Scalars['Float']['output'];
  studentCount: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  /**
   * Additional exams: fully specified entries that are appended to the ZPA upload
   * but are not part of the normal plan (replaces publish.additionalExams).
   */
  additionalExams: Array<AdditionalExam>;
  allAnnyBookings: Array<AnnyBooking>;
  allProgramsInPlan?: Maybe<Array<Scalars['String']['output']>>;
  allSemesterNames: Array<Semester>;
  allowedSlots?: Maybe<Array<Slot>>;
  ancodesInPlan?: Maybe<Array<Scalars['Int']['output']>>;
  annyBookings: Array<AnnyBooking>;
  /** The Anny settings stored in the DB (the token stays in the config file). */
  annyConfig: AnnyConfig;
  assembledExam?: Maybe<AssembledExam>;
  assembledExams: Array<AssembledExam>;
  /**
   * State of the cached assembled exams. dirty=true means an input changed since the
   * last generation (connected exams, zpa-exams-to-plan, constraints, NTAs, imports),
   * so the assembled exams — and everything derived from them (planned exams) — are
   * stale and should be regenerated.
   */
  assembledExamsState: AssembledExamsState;
  awkwardSlots: Array<Slot>;
  /** All rooms blocked for a specific slot (not usable there, e.g. otherwise occupied). */
  blockedRooms: Array<BlockedRoom>;
  /** Auto-detected canShareSlot candidates (same module+program, different examer) not yet declared. */
  canShareSlotSuggestions: Array<ExamPair>;
  conflictingAncodes?: Maybe<Array<Conflict>>;
  connectedExam?: Maybe<ConnectedExam>;
  connectedExams: Array<ConnectedExam>;
  constraintForAncode?: Maybe<Constraints>;
  /** The current dry-run recipient status (session override vs. configured default) for the Probeläufe page. */
  dryRunTestMail: DryRunTestMailStatus;
  emailAttachments: Array<EmailAttachmentInfo>;
  /** The helper functions available in every email template (jiraURL, plural, …). */
  emailTemplateFunctions: Array<EmailTemplateFunction>;
  /** All editable email templates with their effective Markdown, description and variables. */
  emailTemplates: Array<EmailTemplate>;
  /**
   * Per-ancode exam duration overrides. They are only applied to exams whose ZPA
   * duration is 0 (i.e. not set in the ZPA); they feed the assembled exams.
   */
  examDurationOverrides: Array<ExamDurationOverride>;
  /**
   * Candidates for the consolidated exam-planning info email (replacing the separate
   * constraints + prepared emails): one entry per examer — every examer with at least one
   * exam I plan (toPlan and not notPlannedByMe, any faculty), plus the FK07 examers who do
   * have ZPA exam(s) this semester but none that I plan. Examers without any ZPA exam, and
   * non-FK07 examers without a planned exam, are excluded. For selecting/deselecting
   * recipients before sending. No slot/date is included.
   */
  examPlanningMailRecipients: Array<ExamPlanningMailRecipient>;
  /**
   * Summary of the EXaHM/SEB room phase for the GUI: how many EXaHM/SEB exams are planned and
   * how many of those are frozen (phaseFixed) for phase B. Use allFixed to decide whether to
   * warn before running generateExamSchedule (phase B), and planned/fixed to show the state
   * next to the fix/unfix buttons.
   */
  examRoomsPhaseState: ExamRoomsPhaseState;
  /** Conflicts of the current plan, to review (accept per student). */
  examScheduleConflicts: Array<ExamScheduleConflict>;
  /** The read-only list of hard/soft constraints the exam-schedule generator applies. */
  examScheduleConstraints: Array<OptimizerConstraint>;
  /**
   * Student-centric quality statistics of the current plan: how well the exams are
   * spread out in time for the individual students. Covers our OWN students (enrolled in
   * an FK07 or MUC.DAI program) with at most `maxRegularNonRepeatExams` non-repeat exams —
   * the most anyone can have in a normal course of study; students beyond that (many
   * repeat registrations) are excluded from the figures and only summarized via
   * `excludedStudentCount` / `allFreeDayShare`, since including them barely moves the
   * aggregate.
   *
   * Aggregates the gaps between each student's consecutive exams (NTA-aware, absolute
   * times, calendar-day gaps) into human-readable shares (e.g. "share of students with at
   * least one exam-free day between all their exams"), a distribution histogram, a
   * per-program breakdown and a Carter-style proximity index.
   *
   * Spurious pairs are dropped from the gap statistics (as ValidateConflicts does):
   * two exams of other faculties (not ours to resolve) and two exams declared same-slot
   * or can-share-slot (a student may not sit both, so the registration is invalid). Only
   * registrations that appear in the plan are counted (to-plan ZPA exams and external
   * exams); not-to-plan ZPA exams (e.g. Modularbeiten) and orphan MUC.DAI Primuss
   * registrations are already excluded upstream.
   *
   * Same data feeds the GUI and the printable PDF (/download/pdf/spread-statistics).
   */
  examSpreadStatistics: ExamSpreadStatistics;
  examerInPlan?: Maybe<Array<ExamerInPlan>>;
  /**
   * examersWithExamsPlannedByMe returns the main examers of all planned exams that
   * are planned by me (not flagged NotPlannedByMe).
   */
  examersWithExamsPlannedByMe: Array<Teacher>;
  examsAt?: Maybe<Array<PlannedExam>>;
  /** Exam pairs declared as allowed to share a slot (no student legitimately sits both). */
  examsCanShareSlot: Array<ExamPair>;
  /**
   * examsNotOnSlotGrid returns the planned exams whose absolute start time is NOT one of the
   * semester's standard slot start times (e.g. another faculty's exam placed at 11:00). They
   * are invisible in a purely slot-by-slot grid, so the GUI must surface them separately —
   * e.g. rendered in the slot whose time window they overlap, with the real start time shown.
   */
  examsNotOnSlotGrid: Array<PlannedExam>;
  examsWithNtas: Array<PlannedExam>;
  examsWithoutSlot: Array<PlannedExam>;
  fk07programs: Array<Fk07Program>;
  /**
   * Global generation tuning: the invigilation optimizer (simulated annealing)
   * parameters. Stored in the global plexams database; the config file is only a
   * seed/fallback. Steers invigilation generation. (The room/invigilation turnaround
   * moved to the per-semester config as timelagMin.)
   */
  generationConfig: GenerationConfig;
  invigilator?: Maybe<Teacher>;
  /**
   * All teachers in the invigilator pool, including the ones currently excluded
   * (isNotInvigilator / permanent). Use this to manage constraints for everyone —
   * invigilatorsWithReq only returns the ones who actually invigilate.
   */
  invigilatorCandidates: Array<Teacher>;
  /**
   * Per-invigilator constraints stored in the DB (managed via the GUI): whether
   * they do no invigilation at all, additional excluded whole days and time
   * windows when they cannot invigilate. These are merged on top of the ZPA requirements.
   */
  invigilatorConstraints: Array<InvigilatorConstraints>;
  invigilatorTodos?: Maybe<InvigilationTodos>;
  invigilators: Array<ZpaInvigilator>;
  /**
   * invigilatorsExcludedByConfig returns the invigilators who would do invigilation
   * duty (factor > 0) but are excluded only because isNotInvigilator is set in their
   * DB constraints (see invigilatorConstraints). People who are out anyway are not
   * listed. (The field name is kept for backwards compatibility.)
   */
  invigilatorsExcludedByConfig: Array<Invigilator>;
  invigilatorsForDay?: Maybe<InvigilatorsForDay>;
  invigilatorsWithReq: Array<Invigilator>;
  /** Verify the configured Jira connection (GET /rest/api/2/myself). */
  jiraConnection: JiraUser;
  /** Fetch a single Jira issue by key (e.g. "PLEX-42"). */
  jiraIssue: JiraIssue;
  /**
   * All open (not-done) issues, newest first. project falls back to the
   * jira.project config; omit both to span all visible projects.
   */
  jiraOpenIssues: Array<JiraIssue>;
  /**
   * The open issues grouped by JSM customer request type (Anfragetyp), groups
   * sorted by name. Only for service desk projects like FK07PP.
   */
  jiraOpenIssuesByRequestType: Array<JiraRequestTypeGroup>;
  /** The open issues grouped by issue type (groups sorted by type, empty groups omitted). */
  jiraOpenIssuesByType: Array<JiraIssueGroup>;
  /** List the workflow transitions currently available for an issue in its current status. */
  jiraTransitions: Array<JiraTransition>;
  /**
   * The currently authenticated user — from the auth-proxy header, or the local dev
   * fallback when auth is disabled. The GUI uses it to show identity/role and adapt
   * the UI cosmetically; it is NEVER a security boundary (enforcement is in the backend).
   */
  me: User;
  /**
   * Suggested ZPA exams for linking an (unresolved) MUC.DAI exam, ranked: ZPA exams that
   * carry the program with a missing number (0/-1) first, then same-examer + similar
   * module, then either. For the GUI to confirm/correct the link.
   */
  mucDaiZpaCandidates: Array<ZpaExam>;
  mucdaiExams: Array<MucDaiExam>;
  /**
   * Audit log of mutating operations (mutations + data-changing subscriptions),
   * newest first. Filter by operation name, by an ancode referenced in the
   * arguments, by arbitrary argument key/value pairs, and/or a time range.
   */
  mutationLog: Array<MutationLogEntry>;
  /** Distinct operation names present in the mutation log (for a filter dropdown). */
  mutationLogNames: Array<Scalars['String']['output']>;
  /**
   * A template for creating a new semester, seeded from the current semester's
   * config (slots/emails/go-slots carry over; the planner adjusts the dates).
   */
  newSemesterConfigDefaults: SemesterConfigInput;
  nta?: Maybe<NtaWithRegs>;
  /** All accepted NTA room-alone waivers of the semester. */
  ntaRoomAloneWaivers: Array<NtaRoomAloneWaiver>;
  ntas?: Maybe<Array<Nta>>;
  ntasWithRegs?: Maybe<Array<Student>>;
  /**
   * Teachers who never do invigilation duty again (e.g. retired). Global (plexams
   * DB), carries over between semesters; always implies isNotInvigilator.
   */
  permanentNonInvigilators: Array<PermanentNonInvigilator>;
  /** The planner (name + email + sender-identity overrides). Stored globally in the DB; the config is only a fallback. */
  planer: Planer;
  plannedExam?: Maybe<PlannedExam>;
  plannedExams: Array<PlannedExam>;
  plannedRoomForStudent?: Maybe<PlannedRoom>;
  plannedRoomNames?: Maybe<Array<Scalars['String']['output']>>;
  plannedRoomNamesAt?: Maybe<Array<Scalars['String']['output']>>;
  plannedRooms: Array<PlannedRoom>;
  plannedRoomsAt?: Maybe<Array<PlannedRoom>>;
  /** The planning state (phases, conditions, currently locked areas). */
  planningState: PlanningState;
  preExamsAt?: Maybe<Array<PreExam>>;
  prePlannedInvigilations: Array<PrePlannedInvigilation>;
  prePlannedRooms: Array<PrePlannedRoom>;
  /**
   * The hard and soft rules the SEB/EXaHM pre-planning uses, as a human-readable list
   * for a read-only display in the GUI. Derived from the solver so it stays in sync.
   */
  preplanConstraints: Array<PreplanRule>;
  preplanExam?: Maybe<PreplanExam>;
  /**
   * Candidate ZPA exams for linking the given pre-exam, ranked by examer (same
   * teacher) and module-name similarity. Empty before the ZPA exams are imported.
   */
  preplanExamAncodeSuggestions: Array<ZpaExam>;
  /** SEB/EXaHM pre-planning pseudo-exams of this semester. */
  preplanExams: Array<PreplanExam>;
  /**
   * Room-need and program-overlap overview for the SEB/EXaHM pre-planning: per slot
   * (plus one entry with null day/slot for not-yet-slotted pre-exams) the seat demand
   * and a suggested set of rooms per kind, and the program overlaps within the slot.
   */
  preplanOverview: PreplanOverview;
  /**
   * Same-slot groups of pre-exams (>= 2 members) with each member's connection status, so
   * the GUI can show which members are still pending. The same-slot is only carried over to
   * the ZPA exams once every member of a group is connected (complete = true).
   */
  preplanSameSlotGroups: Array<PreplanSameSlotGroup>;
  primussExam: PrimussExam;
  primussExams?: Maybe<Array<Maybe<PrimussExamByProgram>>>;
  primussExamsForAnCode?: Maybe<Array<PrimussExam>>;
  /**
   * Render the given Markdown for the named template against representative sample data and
   * return the HTML/text preview. Does not save. Used for the live preview + validation while
   * editing; a template error is returned in the preview's `error` field, not as a GraphQL error.
   */
  renderEmailTemplatePreview: EmailTemplatePreview;
  /** All building-management room requests of the semester. */
  roomRequests: Array<RoomRequest>;
  /** Dry-run: which management rooms would be requested for which exams (read-only, changes nothing). */
  roomRequestsPreview: Array<RoomRequestPreview>;
  rooms: Array<Room>;
  roomsAt?: Maybe<RoomsForSlot>;
  roomsForSlots: Array<RoomsForSlot>;
  /**
   * All rooms allowed at a time with their free seats and which exams already use
   * them — for sharing a room (e.g. as a reserve).
   */
  roomsWithFreeSeatsAt: Array<RoomWithFreeSeats>;
  roomsWithInvigilationsAt?: Maybe<InvigilationSlot>;
  semester: Semester;
  /** null when the semester has no config yet (fresh/empty DB) — create it via createSemester / init. */
  semesterConfig?: Maybe<SemesterConfig>;
  /** The raw, editable per-semester config (source of truth for the derived semesterConfig). */
  semesterConfigInput?: Maybe<SemesterConfigInput>;
  /**
   * Runtime information about the running plexams.go server: its build version
   * and the MongoDB it is connected to. Used e.g. for the GUI footer.
   */
  serverInfo: ServerInfo;
  /** Special-interest groups (named ancode lists) used for the Studierenden-Info PDFs. */
  specialInterests: Array<SpecialInterest>;
  studentByMtknr?: Maybe<Student>;
  /** All explicit per-student conflict decisions currently stored. */
  studentConflictDecisions: Array<StudentConflictDecision>;
  studentRegsForProgram?: Maybe<Array<StudentReg>>;
  studentRegsImportErrors: Array<RegWithError>;
  /**
   * State of the prepared student registrations (the per-student planned regs shown
   * via `students`). dirty=true means an input changed since the last generation
   * (connected exams, which exams are planned, NTAs, ZPA imports), so they should be
   * regenerated.
   */
  studentRegsState: StudentRegsState;
  students: Array<Student>;
  studentsByName: Array<Student>;
  /** All study programs (Studiengänge), global/cross-semester. */
  studyPrograms: Array<StudyProgram>;
  /**
   * Transfer history (imports from / uploads to ZPA, Anny, …), newest first.
   * The whole history since the start of the semester is kept; pass limit to cap it.
   */
  syncLog: Array<SyncLogEntry>;
  teacher?: Maybe<Teacher>;
  teachers: Array<Teacher>;
  /**
   * Students that could not be assigned a real room in their slot during the last
   * room generation (the replacement for the old 'No Room' placeholder).
   */
  unplacedExams: Array<UnplacedExam>;
  /** All known users (the authorization allow-list). Admin view for managing who may log in. */
  users: Array<User>;
  /** Validate the current slot assignment of the pre-exams (unassigned, capacity, program overlaps). */
  validatePreplanAssignment: PreplanValidation;
  zpaAnCodes?: Maybe<Array<Maybe<AnCode>>>;
  zpaExam?: Maybe<ZpaExam>;
  zpaExams: Array<ZpaExam>;
  zpaExamsByType: Array<ZpaExamsForType>;
  zpaExamsNotToPlan: Array<ZpaExam>;
  zpaExamsPlaningStatusUnknown: Array<ZpaExam>;
  zpaExamsToPlanWithConstraints: Array<ZpaExamWithConstraints>;
};


export type QueryAllowedSlotsArgs = {
  ancode: Scalars['Int']['input'];
};


export type QueryAnnyBookingsArgs = {
  room?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAssembledExamArgs = {
  ancode: Scalars['Int']['input'];
};


export type QueryAwkwardSlotsArgs = {
  ancode: Scalars['Int']['input'];
};


export type QueryConflictingAncodesArgs = {
  ancode: Scalars['Int']['input'];
};


export type QueryConnectedExamArgs = {
  ancode: Scalars['Int']['input'];
};


export type QueryConstraintForAncodeArgs = {
  ancode: Scalars['Int']['input'];
};


export type QueryEmailAttachmentsArgs = {
  kind: Scalars['String']['input'];
};


export type QueryExamsAtArgs = {
  starttime: Scalars['Time']['input'];
};


export type QueryInvigilatorArgs = {
  room: Scalars['String']['input'];
  starttime: Scalars['Time']['input'];
};


export type QueryInvigilatorsForDayArgs = {
  date: Scalars['Time']['input'];
};


export type QueryJiraIssueArgs = {
  key: Scalars['String']['input'];
};


export type QueryJiraOpenIssuesArgs = {
  project?: InputMaybe<Scalars['String']['input']>;
};


export type QueryJiraOpenIssuesByRequestTypeArgs = {
  project?: InputMaybe<Scalars['String']['input']>;
};


export type QueryJiraOpenIssuesByTypeArgs = {
  project?: InputMaybe<Scalars['String']['input']>;
};


export type QueryJiraTransitionsArgs = {
  key: Scalars['String']['input'];
};


export type QueryMucDaiZpaCandidatesArgs = {
  primussAncode: Scalars['Int']['input'];
  program: Scalars['String']['input'];
};


export type QueryMutationLogArgs = {
  ancode?: InputMaybe<Scalars['Int']['input']>;
  args?: InputMaybe<Array<ArgFilterInput>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  since?: InputMaybe<Scalars['Time']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  until?: InputMaybe<Scalars['Time']['input']>;
  user?: InputMaybe<Scalars['String']['input']>;
};


export type QueryNtaArgs = {
  mtknr: Scalars['String']['input'];
};


export type QueryPlannedExamArgs = {
  ancode: Scalars['Int']['input'];
};


export type QueryPlannedRoomForStudentArgs = {
  ancode: Scalars['Int']['input'];
  mtknr: Scalars['String']['input'];
};


export type QueryPlannedRoomNamesAtArgs = {
  starttime: Scalars['Time']['input'];
};


export type QueryPlannedRoomsAtArgs = {
  starttime: Scalars['Time']['input'];
};


export type QueryPreExamsAtArgs = {
  starttime: Scalars['Time']['input'];
};


export type QueryPreplanExamArgs = {
  id: Scalars['Int']['input'];
};


export type QueryPreplanExamAncodeSuggestionsArgs = {
  id: Scalars['Int']['input'];
};


export type QueryPrimussExamArgs = {
  ancode: Scalars['Int']['input'];
  program: Scalars['String']['input'];
};


export type QueryPrimussExamsForAnCodeArgs = {
  ancode: Scalars['Int']['input'];
};


export type QueryRenderEmailTemplatePreviewArgs = {
  markdown: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type QueryRoomsAtArgs = {
  starttime: Scalars['Time']['input'];
};


export type QueryRoomsWithFreeSeatsAtArgs = {
  starttime: Scalars['Time']['input'];
};


export type QueryRoomsWithInvigilationsAtArgs = {
  starttime: Scalars['Time']['input'];
};


export type QueryStudentByMtknrArgs = {
  mtknr: Scalars['String']['input'];
};


export type QueryStudentRegsForProgramArgs = {
  program: Scalars['String']['input'];
};


export type QueryStudentsByNameArgs = {
  regex: Scalars['String']['input'];
};


export type QuerySyncLogArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTeacherArgs = {
  id: Scalars['Int']['input'];
};


export type QueryTeachersArgs = {
  fromZPA?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryZpaExamArgs = {
  ancode: Scalars['Int']['input'];
};


export type QueryZpaExamsArgs = {
  fromZPA?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RegWithError = {
  __typename?: 'RegWithError';
  error: ZpaStudentRegError;
  registration: ZpaStudentReg;
};

/**
 * RegWithProgram is one student's registration for one exam in one study program — the
 * per-program projection of an exam's Ancodes: the external primussAncode plus the
 * internal zpaAncode (equal for FK07, different for MUC.DAI/external exams).
 */
export type RegWithProgram = {
  __typename?: 'RegWithProgram';
  primussAncode: Scalars['Int']['output'];
  program: Scalars['String']['output'];
  zpaAncode: Scalars['Int']['output'];
};

/**
 * A role governs what a logged-in user may do. A user has exactly one role; the roles
 * form a hierarchy ADMIN ⊇ PLANER ⊇ VIEWER:
 * - VIEWER: read-only (queries + validations, no mutations/data-changing subscriptions).
 * - PLANER: full planning access (everything VIEWER can, plus all data-changing ops).
 * - ADMIN:  everything PLANER can, plus user administration (setUser/removeUser).
 * The enum is intentionally extensible for finer-grained roles later.
 */
export enum Role {
  Admin = 'ADMIN',
  Planer = 'PLANER',
  Viewer = 'VIEWER'
}

export type Room = {
  __typename?: 'Room';
  deactivated: Scalars['Boolean']['output'];
  exahm: Scalars['Boolean']['output'];
  handicap: Scalars['Boolean']['output'];
  hmebSeats?: Maybe<Scalars['Int']['output']>;
  lab: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  /** needsRequest is derived: true when requestWith is not NONE. */
  needsRequest: Scalars['Boolean']['output'];
  placesWithSocket: Scalars['Boolean']['output'];
  /** Lower number = preferred when generating room requests (e.g. R1.006/R1.046 = 1, R1.049 = 2). */
  requestPriority: Scalars['Int']['output'];
  requestWith: RoomRequestType;
  seats: Scalars['Int']['output'];
  seb: Scalars['Boolean']['output'];
  sebSeats?: Maybe<Scalars['Int']['output']>;
};

export type RoomAndExam = {
  __typename?: 'RoomAndExam';
  exam: ZpaExam;
  room: PlannedRoom;
};

export type RoomConstraints = {
  __typename?: 'RoomConstraints';
  /** extra seats to reserve on top of the registered students (capacity buffer). */
  additionalSeats?: Maybe<Scalars['Int']['output']>;
  allowedRooms?: Maybe<Array<Scalars['String']['output']>>;
  comments?: Maybe<Scalars['String']['output']>;
  exahm: Scalars['Boolean']['output'];
  kdpJiraURL?: Maybe<Scalars['String']['output']>;
  lab: Scalars['Boolean']['output'];
  maxStudents?: Maybe<Scalars['Int']['output']>;
  placesWithSocket: Scalars['Boolean']['output'];
  /**
   * Trailing time (Nachlauf) in minutes the rooms stay occupied AFTER this exam ends, total
   * that REPLACES the default 15 min (null = default).
   */
  postExamMinutes?: Maybe<Scalars['Int']['output']>;
  /**
   * Lead time (Vorlauf) in minutes the rooms must be free BEFORE this exam starts, as a
   * total that REPLACES the default 15 min (null = default). Used for setup that exceeds the
   * ordinary turnaround, e.g. an EXaHM exam in the T-building.
   */
  preExamMinutes?: Maybe<Scalars['Int']['output']>;
  seb: Scalars['Boolean']['output'];
};

/** One exam's use of a room in a slot. */
export type RoomInSlotUsage = {
  __typename?: 'RoomInSlotUsage';
  ancode: Scalars['Int']['output'];
  examer: Scalars['String']['output'];
  module: Scalars['String']['output'];
  studentCount: Scalars['Int']['output'];
};

export type RoomInput = {
  exahm: Scalars['Boolean']['input'];
  handicap: Scalars['Boolean']['input'];
  hmebSeats?: InputMaybe<Scalars['Int']['input']>;
  lab: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  placesWithSocket: Scalars['Boolean']['input'];
  /** Lower number = preferred when generating room requests. Optional; defaults to 0 (irrelevant when requestWith is NONE). */
  requestPriority?: Scalars['Int']['input'];
  requestWith: RoomRequestType;
  seats: Scalars['Int']['input'];
  seb: Scalars['Boolean']['input'];
  sebSeats?: InputMaybe<Scalars['Int']['input']>;
};

export type RoomRequest = {
  __typename?: 'RoomRequest';
  active: Scalars['Boolean']['output'];
  approved: Scalars['Boolean']['output'];
  from: Scalars['Time']['output'];
  room: Scalars['String']['output'];
  /** Absolute start time of the exam the room is requested for. */
  starttime: Scalars['Time']['output'];
  until: Scalars['Time']['output'];
};

/**
 * RoomRequestPreview is one entry of the dry-run room-request generation: a
 * management room that would be requested for an exam in a slot. It carries the
 * triggering exam and the other (simultaneous) exams in that slot so the result can
 * be eyeballed in the GUI. The preview is read-only and changes nothing.
 */
export type RoomRequestPreview = {
  __typename?: 'RoomRequestPreview';
  exam: PlannedExam;
  from: Scalars['Time']['output'];
  room: Scalars['String']['output'];
  seats: Scalars['Int']['output'];
  simultaneousExams: Array<PlannedExam>;
  /** Absolute start time of the exam the room would be requested for. */
  starttime: Scalars['Time']['output'];
  students: Scalars['Int']['output'];
  until: Scalars['Time']['output'];
};

/**
 * RoomRequestType says how a room that needs requesting must be requested:
 * NONE = no request needed, ANNY = via the Anny website (T-building), MANAGEMENT =
 * via the building management (Gebäudemanagement).
 */
export enum RoomRequestType {
  Anny = 'ANNY',
  Management = 'MANAGEMENT',
  None = 'NONE'
}

/** A room allowed in a slot, with its free seats and the exams already using it. */
export type RoomWithFreeSeats = {
  __typename?: 'RoomWithFreeSeats';
  exahm: Scalars['Boolean']['output'];
  freeSeats: Scalars['Int']['output'];
  /** handicap = true: NTA room, only for NTAs (not for normal students / non-NTA reserve). */
  handicap: Scalars['Boolean']['output'];
  lab: Scalars['Boolean']['output'];
  roomName: Scalars['String']['output'];
  seats: Scalars['Int']['output'];
  seb: Scalars['Boolean']['output'];
  /** The exams already using this room in the slot (empty if the room is still free). */
  usedBy: Array<RoomInSlotUsage>;
  usedSeats: Scalars['Int']['output'];
};

export type RoomWithInvigilator = {
  __typename?: 'RoomWithInvigilator';
  invigilator?: Maybe<Teacher>;
  maxDuration: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  /** true if the invigilation for this room in this slot is pre-planned (fixed). */
  prePlanned: Scalars['Boolean']['output'];
  roomAndExams: Array<RoomAndExam>;
  studentCount: Scalars['Int']['output'];
};

export type RoomsForSlot = {
  __typename?: 'RoomsForSlot';
  rooms: Array<Room>;
  starttime: Scalars['Time']['output'];
};

export type SaveSemesterConfigResult = {
  __typename?: 'SaveSemesterConfigResult';
  ok: Scalars['Boolean']['output'];
  /** Non-fatal warnings, e.g. changes that may invalidate an existing plan. */
  warnings: Array<Scalars['String']['output']>;
};

export type Semester = {
  __typename?: 'Semester';
  /** false for databases that cannot be used with this code (no semester config). */
  compatible: Scalars['Boolean']['output'];
  /** the database label (e.g. '2026 SS' or a clone '2026 SS-Test'); selects the database. */
  id: Scalars['String']['output'];
  /** true when the database is protected: it can be selected, but all mutations fail. */
  readOnly: Scalars['Boolean']['output'];
  /** data schema version of the database (null when unknown/never stamped). */
  schemaVersion?: Maybe<Scalars['Int']['output']>;
  /**
   * the logical semester used against external systems (ZPA), e.g. '2026 SS' — for
   * a clone this stays the real semester, not the database name.
   */
  semester?: Maybe<Scalars['String']['output']>;
};

export type SemesterConfig = {
  __typename?: 'SemesterConfig';
  /** Effective end-to-start travel buffer (minutes) between a student's two exams at different campuses. */
  crossCampusGapMinutes: Scalars['Int']['output'];
  days: Array<ExamDay>;
  emails: Emails;
  /** Effective travel/break buffer (minutes) between a student's consecutive exams. */
  examGapMinutes: Scalars['Int']['output'];
  forbiddenSlots?: Maybe<Array<Slot>>;
  from: Scalars['Time']['output'];
  /** Effective max students examined at the same start time (0 = no limit). */
  maxSeatsPerSlot: Scalars['Int']['output'];
  /** Absolute start times allowed for MUC.DAI exams (echo of the raw config). */
  mucDaiAllowedTimes?: Maybe<Array<Scalars['Time']['output']>>;
  mucDaiSlots: Array<Slot>;
  /** Effective "too close" threshold (minutes, same day) for a student's two exams. */
  notTooCloseMinutes: Scalars['Int']['output'];
  slots: Array<Slot>;
  starttimes: Array<Starttime>;
  /** Effective turnaround (minutes) between two uses of a room / between two invigilations. */
  timelagMin: Scalars['Int']['output'];
  until: Scalars['Time']['output'];
};

/**
 * SemesterConfigInput is the raw, editable per-semester configuration — the values
 * that used to live in <semester>.yaml. The derived SemesterConfig is computed from
 * it.
 */
export type SemesterConfigInput = {
  __typename?: 'SemesterConfigInput';
  /**
   * End-to-start travel buffer (minutes) a student needs between two exams at
   * DIFFERENT campuses (null = default 120). Applied as a hard separation whenever
   * the two exams' locations differ.
   */
  crossCampusGapMinutes?: Maybe<Scalars['Int']['output']>;
  emails: Emails;
  /** Travel/break buffer (minutes) a student needs between two consecutive exams (null = default). */
  examGapMinutes?: Maybe<Scalars['Int']['output']>;
  forbiddenDays?: Maybe<Array<Scalars['Time']['output']>>;
  /** Start of the planning period; day 1 = from. Exams of other faculties may lie earlier (no check). */
  from: Scalars['Time']['output'];
  /**
   * Max students examined at the same start time (configurable per-time capacity
   * for the Terminplan solver; null/0 = no limit).
   */
  maxSeatsPerSlot?: Maybe<Scalars['Int']['output']>;
  /** Absolute start times allowed for MUC.DAI exams (currently "morning vs afternoon"; will become allowed/forbidden times). */
  mucDaiAllowedTimes?: Maybe<Array<Scalars['Time']['output']>>;
  /** Two exams of a student closer than this (minutes, same day) are flagged as "too close" (null = default 120). */
  notTooCloseMinutes?: Maybe<Scalars['Int']['output']>;
  /** Allowed daily exam start times as "HH:MM". */
  startTimes: Array<Scalars['String']['output']>;
  /** Minimum turnaround (minutes) between two uses of a room / between two invigilations (null = default). */
  timelagMin?: Maybe<Scalars['Int']['output']>;
  until: Scalars['Time']['output'];
};

export type SemesterConfigInputData = {
  /**
   * End-to-start travel buffer (minutes) a student needs between two exams at
   * DIFFERENT campuses (null = default 120). Applied as a hard separation whenever
   * the two exams' locations differ.
   */
  crossCampusGapMinutes?: InputMaybe<Scalars['Int']['input']>;
  emails: EmailsInput;
  /** Travel/break buffer (minutes) a student needs between two consecutive exams (null = default). */
  examGapMinutes?: InputMaybe<Scalars['Int']['input']>;
  forbiddenDays?: InputMaybe<Array<Scalars['Time']['input']>>;
  from: Scalars['Time']['input'];
  /**
   * Max students examined at the same start time (configurable per-time capacity
   * for the Terminplan solver; null/0 = no limit).
   */
  maxSeatsPerSlot?: InputMaybe<Scalars['Int']['input']>;
  /** Absolute start times allowed for MUC.DAI exams (currently "morning vs afternoon"; will become allowed/forbidden times). */
  mucDaiAllowedTimes?: InputMaybe<Array<Scalars['Time']['input']>>;
  /** Two exams of a student closer than this (minutes, same day) are flagged as "too close" (null = default 120). */
  notTooCloseMinutes?: InputMaybe<Scalars['Int']['input']>;
  startTimes: Array<Scalars['String']['input']>;
  /** Minimum turnaround (minutes) between two uses of a room / between two invigilations (null = default). */
  timelagMin?: InputMaybe<Scalars['Int']['input']>;
  until: Scalars['Time']['input'];
};

export type ServerInfo = {
  __typename?: 'ServerInfo';
  /** Who built the binary ("unknown" if not set). */
  builtBy: Scalars['String']['output'];
  /** Git commit the binary was built from ("none" if unknown). */
  commit: Scalars['String']['output'];
  /** Build date ("unknown" if not set). */
  date: Scalars['String']['output'];
  /** The MongoDB database (workspace) currently in use, e.g. "2026-SS". */
  mongoDatabase: Scalars['String']['output'];
  /** The MongoDB host:port the server is connected to (credentials redacted). */
  mongoHost: Scalars['String']['output'];
  /**
   * Link to the GitHub release for this version, or null for dev/unreleased
   * builds where no matching release exists.
   */
  releaseURL?: Maybe<Scalars['String']['output']>;
  /** plexams.go build version, e.g. "1.99.0" or "dev" for local builds. */
  version: Scalars['String']['output'];
};

export type Slot = {
  __typename?: 'Slot';
  starttime: Scalars['Time']['output'];
};

/**
 * How strictly the start-time window is enforced. HARD (default): a hard domain restriction —
 * a non-exempt exam is never placed outside its window; one that fits nowhere is left UNPLACED
 * with a clear reason (the rest of the plan is still written). SOFT: a strong penalty instead —
 * the exam may be placed outside the window (deliberate emergency deviation) but is reported as
 * a violation. EXaHM/SEB exams (booked T-building rooms) are exempt in both cases.
 */
export enum SlotTimeConstraintEnforcement {
  Hard = 'HARD',
  Soft = 'SOFT'
}

/**
 * When the exam-schedule generator (Terminplan) applies the start-time window constraint, and
 * which way. AUTO follows the semester (winter → exams must not start before the morning limit,
 * e.g. 10:00; summer → exams must not start after the afternoon limit, e.g. 14:00, because the
 * non-climatised rooms get too hot); WINTER/SUMMER force one variant (for testing); OFF disables
 * it. Booked, climate-controlled T-building rooms (EXaHM/SEB) are always exempt. Default AUTO.
 */
export enum SlotTimeConstraintMode {
  Auto = 'AUTO',
  Off = 'OFF',
  Summer = 'SUMMER',
  Winter = 'WINTER'
}

export type SoftCostItem = {
  __typename?: 'SoftCostItem';
  cost: Scalars['Float']['output'];
  name: Scalars['String']['output'];
};

/** SoftCostReport: the weighted soft-constraint penalty score (lower is better). */
export type SoftCostReport = {
  __typename?: 'SoftCostReport';
  breakdown: Array<SoftCostItem>;
  total: Scalars['Float']['output'];
};

export type SpecialInterest = {
  __typename?: 'SpecialInterest';
  ancodes: Array<Scalars['Int']['output']>;
  /** output file name for the generated PDF. */
  filename: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type SpecialInterestInput = {
  ancodes: Array<Scalars['Int']['input']>;
  filename: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

/** A named distribution bucket with an absolute count and a percentage share. */
export type SpreadBucket = {
  __typename?: 'SpreadBucket';
  count: Scalars['Int']['output'];
  /** Stable machine key: OVERLAP | SAME_DAY | ADJACENT | ONE_FREE | TWO_FREE | THREE_PLUS_FREE. */
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
  share: Scalars['Float']['output'];
};

export type Starttime = {
  __typename?: 'Starttime';
  start: Scalars['String']['output'];
};

export type Student = {
  __typename?: 'Student';
  group: Scalars['String']['output'];
  mtknr: Scalars['String']['output'];
  name: Scalars['String']['output'];
  nta?: Maybe<Nta>;
  program: Scalars['String']['output'];
  regsWithProgram: Array<RegWithProgram>;
  /** internal ZPA ancodes the student is registered for (the conflict/plan key) */
  zpaAncodes: Array<Scalars['Int']['output']>;
  zpaStudent?: Maybe<ZpaStudent>;
};

/** StudentConflictDecision is a stored explicit decision for one student's conflict pair. */
export type StudentConflictDecision = {
  __typename?: 'StudentConflictDecision';
  ancode1: Scalars['Int']['output'];
  ancode2: Scalars['Int']['output'];
  decision: ConflictDecision;
  mtknr: Scalars['String']['output'];
};

export type StudentReg = {
  __typename?: 'StudentReg';
  group: Scalars['String']['output'];
  mtknr: Scalars['String']['output'];
  name: Scalars['String']['output'];
  presence: Scalars['String']['output'];
  /** Primuss ancode (per-program namespace); == the ZPA ancode only for FK07 exams */
  primussAncode: Scalars['Int']['output'];
  program: Scalars['String']['output'];
};

export type StudentRegsPerAncode = {
  __typename?: 'StudentRegsPerAncode';
  ancode: Scalars['Int']['output'];
  perProgram: Array<StudentRegsPerAncodeAndProgram>;
};

export type StudentRegsPerAncodeAndProgram = {
  __typename?: 'StudentRegsPerAncodeAndProgram';
  /** external (Primuss/MUC.DAI) ancode of the exam in this program; == zpaAncode for FK07 */
  primussAncode: Scalars['Int']['output'];
  program: Scalars['String']['output'];
  studentRegs: Array<StudentReg>;
  /** internal ZPA ancode of the exam */
  zpaAncode: Scalars['Int']['output'];
};

export type StudentRegsPerStudent = {
  __typename?: 'StudentRegsPerStudent';
  ancodes: Array<Scalars['Int']['output']>;
  student: Student;
};

export type StudentRegsState = {
  __typename?: 'StudentRegsState';
  /** when they were last marked stale or (re)generated. */
  changedAt?: Maybe<Scalars['Time']['output']>;
  dirty: Scalars['Boolean']['output'];
  /** the operation that last marked them stale (mutation/subscription name). */
  reason?: Maybe<Scalars['String']['output']>;
};

/** A study program (Studiengang), e.g. IF / DE / GN. */
export type StudyProgram = {
  __typename?: 'StudyProgram';
  active: Scalars['Boolean']['output'];
  /** Origin/grouping: fk07 | mucdai | misc. */
  category: Scalars['String']['output'];
  /** e.g. Bachelor / Master. */
  degree?: Maybe<Scalars['String']['output']>;
  /**
   * Base ancode for external (e.g. MUC.DAI) exams of this program: the local ZPA
   * ancode is externalExamsBase + primussAncode. Only for externally imported
   * programs (mucdai/misc).
   */
  externalExamsBase?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  /** A retired fk07 program counts as an "old program" (no longer planned). */
  retired: Scalars['Boolean']['output'];
  /** Kürzel, e.g. IF (unique key). */
  shortname: Scalars['String']['output'];
};

export type StudyProgramInput = {
  active: Scalars['Boolean']['input'];
  category: Scalars['String']['input'];
  degree?: InputMaybe<Scalars['String']['input']>;
  externalExamsBase?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  retired: Scalars['Boolean']['input'];
  shortname: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  /**
   * assignInvigilations runs the automatic invigilation planning and streams its
   * output line by line (terminal style). With dryRun the optimizer only reports;
   * nothing is written to the database. seed and iterations override the config
   * defaults (0/null = keep config/default). The stream ends with a DONE line.
   */
  assignInvigilations: LogLine;
  /**
   * Assign rooms to all exams (rooms-for-exams) and stream the output. The allowed
   * rooms per slot are computed live from the current rooms/requests/bookings;
   * there is no separate rooms-for-slots step or cache.
   */
  assignRoomsForExams: LogLine;
  /**
   * generateExamRoomsPhase runs phase A: it schedules ONLY the EXaHM/SEB exams into the
   * booked T-building slots, maximizing room usage, and streams its output line by line.
   * With dryRun nothing is written. After a satisfactory run, fixExamRoomsPhase freezes
   * the result so the regular generateExamSchedule (phase B) leaves those exams untouched.
   */
  generateExamRoomsPhase: LogLine;
  /**
   * generateExamSchedule runs the automatic exam-schedule (Terminplan) generation and
   * streams its terminal-style output line by line. With dryRun nothing is written; the
   * final RESULT line carries the structured examReport either way. A non-dry-run write
   * is refused while the plan is gated (draft sent / published). With keepAssigned the
   * current plan is used as the warm start (only improve, minimal churn) instead of
   * building a fresh assignment from scratch.
   */
  generateExamSchedule: LogLine;
  /** Fetch the room bookings from anny.eu and store them (used for the EXaHM room slots). Streams its output. */
  importAnnyBookings: LogLine;
  /** Fetch exams from ZPA and cache them. */
  importExamsFromZPA: LogLine;
  /** Fetch invigilator requirements from ZPA and cache them. */
  importInvigilatorRequirementsFromZPA: LogLine;
  /** Fetch the ZPA infos of students with registrations and cache them. */
  importStudentsFromZPA: LogLine;
  /** Fetch teachers from ZPA and cache them. */
  importTeachersFromZPA: LogLine;
  /** Send the cover-page email to a single examer. */
  sendEmailCoverPage: LogLine;
  /** Send cover-page emails to all examers with exams planned by me. */
  sendEmailCoverPages: LogLine;
  sendEmailDraft: LogLine;
  sendEmailExaHM: LogLine;
  /**
   * Send the consolidated exam-planning info email to the selected examers (teacherIDs;
   * null/empty = all candidates from examPlanningMailRecipients). Per examer: the exams I
   * plan with their constraints (no slot/date) and a Jira link for (further) constraints,
   * or — for FK07 examers I plan nothing for — a note that I plan none of their exams.
   */
  sendEmailExamPlanningInfo: LogLine;
  sendEmailInvigilations: LogLine;
  sendEmailInvigilationsMissing: LogLine;
  /**
   * Send the secretariat a short note that the invigilation planning is finished,
   * everything is in ZPA and the plan may be posted. Send after publishing the
   * invigilation plan.
   */
  sendEmailInvigilationsSecretariat: LogLine;
  /**
   * Send the KDP the overview of the EXaHM/SEB room planning (by day/time and
   * room, with per-exam seat counts and a room-oriented CSV attachment). Send
   * after publishing the room plan.
   */
  sendEmailKdpExahm: LogLine;
  /**
   * Send the Lehrbeauftragten-Beauftragte:r (lbaba) an overview of all repeat
   * exams of LBAs I planned (dates and invigilations only).
   */
  sendEmailLbaRepeaters: LogLine;
  /** Email all NTAs their planned rooms after room planning. */
  sendEmailNTAPlanned: LogLine;
  /** Email NTAs with a claim to a room of their own (mtknr, or "all"). */
  sendEmailNTARoomAlone: LogLine;
  /** Inform the examers about a new NTA (by Matrikelnummer). */
  sendEmailNewNTA: LogLine;
  /** Send the primuss-data email for a single exam (by ZPA ancode). updated marks it as an update. */
  sendEmailPrimussData: LogLine;
  /** Send the primuss-data email to every examer with exams planned by me. */
  sendEmailPrimussDataAll: LogLine;
  /** Send primuss data for an exam not planned by us to a single address. */
  sendEmailPrimussDataUnplanned: LogLine;
  sendEmailPublishedExams: LogLine;
  /** Send an individual published-invigilations email (with the personal plan PNG) to each invigilator. */
  sendEmailPublishedInvigilations: LogLine;
  sendEmailPublishedRooms: LogLine;
  /** Send the request for the active building-management rooms to the Gebäudemanagement. */
  sendEmailRoomRequests: LogLine;
  /**
   * Send the secretariat the room occupancy (per non-request room, when it is used
   * by an exam; overlapping NTA times merged) with a request to check it against
   * ZPA. Send before publishing the room plan.
   */
  sendEmailRoomsSecretariat: LogLine;
  /** Upload the planned exams to ZPA without rooms or invigilators (dryRun = build only, do not post). */
  uploadExamsToZPA: LogLine;
  /** Upload the planned exams to ZPA including planned rooms and invigilators. */
  uploadExamsWithInvigilatorsToZPA: LogLine;
  /** Upload the planned exams to ZPA including planned rooms. */
  uploadExamsWithRoomsToZPA: LogLine;
  /** Upload the student registrations to ZPA. */
  uploadStudentRegsToZPA: LogLine;
  validateConflicts: LogLine;
  validateConstraints: LogLine;
  validateDBConstraints: LogLine;
  validateDBNtas: LogLine;
  validateDBPlanEntries: LogLine;
  validateDBReferences: LogLine;
  validateDBRooms: LogLine;
  validateInvigilationConstraints: LogLine;
  validateInvigilationDuplicates: LogLine;
  validateInvigilationsTimeDistance: LogLine;
  validateInvigilatorRequirements: LogLine;
  validateInvigilatorSlots: LogLine;
  validateRoomsBlocked: LogLine;
  validateRoomsEnoughSeats: LogLine;
  validateRoomsNeedRequest: LogLine;
  validateRoomsPerExam: LogLine;
  validateRoomsPerSlot: LogLine;
  validateRoomsTimeDistance: LogLine;
  /**
   * validateSemesterTimes checks the generated Terminplan against the semester start-time
   * window (winter: not before slotTimeWinterEarliest; summer: not after slotTimeSummerLatest).
   * Our own non-exempt exams outside the window are graded by the configured enforcement
   * (HARD → error, SOFT → warning); EXaHM/SEB (climate-controlled T-Bau) placements outside
   * the window are reported as INFO only.
   */
  validateSemesterTimes: LogLine;
  validateStudentRegs: LogLine;
  validateZPADateTimes: LogLine;
  validateZPAInvigilators: LogLine;
  validateZPARooms: LogLine;
};


export type SubscriptionAssignInvigilationsArgs = {
  dryRun: Scalars['Boolean']['input'];
  iterations?: InputMaybe<Scalars['Int']['input']>;
  seed?: InputMaybe<Scalars['Int']['input']>;
};


export type SubscriptionGenerateExamRoomsPhaseArgs = {
  dryRun: Scalars['Boolean']['input'];
  iterations?: InputMaybe<Scalars['Int']['input']>;
  seed?: InputMaybe<Scalars['Int']['input']>;
};


export type SubscriptionGenerateExamScheduleArgs = {
  dryRun: Scalars['Boolean']['input'];
  ignoreRatings?: InputMaybe<Scalars['Boolean']['input']>;
  iterations?: InputMaybe<Scalars['Int']['input']>;
  keepAssigned?: InputMaybe<Scalars['Boolean']['input']>;
  seed?: InputMaybe<Scalars['Int']['input']>;
};


export type SubscriptionSendEmailCoverPageArgs = {
  run: Scalars['Boolean']['input'];
  teacherID: Scalars['Int']['input'];
};


export type SubscriptionSendEmailCoverPagesArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailDraftArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailExaHmArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailExamPlanningInfoArgs = {
  run: Scalars['Boolean']['input'];
  teacherIDs?: InputMaybe<Array<Scalars['Int']['input']>>;
};


export type SubscriptionSendEmailInvigilationsArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailInvigilationsMissingArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailInvigilationsSecretariatArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailKdpExahmArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailLbaRepeatersArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailNtaPlannedArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailNtaRoomAloneArgs = {
  mtknr: Scalars['String']['input'];
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailNewNtaArgs = {
  mtknr: Scalars['String']['input'];
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailPrimussDataArgs = {
  ancode: Scalars['Int']['input'];
  run: Scalars['Boolean']['input'];
  updated: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailPrimussDataAllArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailPrimussDataUnplannedArgs = {
  ancode: Scalars['Int']['input'];
  email: Scalars['String']['input'];
  program: Scalars['String']['input'];
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailPublishedExamsArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailPublishedInvigilationsArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailPublishedRoomsArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailRoomRequestsArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionSendEmailRoomsSecretariatArgs = {
  run: Scalars['Boolean']['input'];
};


export type SubscriptionUploadExamsToZpaArgs = {
  dryRun: Scalars['Boolean']['input'];
};


export type SubscriptionUploadExamsWithInvigilatorsToZpaArgs = {
  dryRun: Scalars['Boolean']['input'];
};


export type SubscriptionUploadExamsWithRoomsToZpaArgs = {
  dryRun: Scalars['Boolean']['input'];
};


export type SubscriptionValidateConflictsArgs = {
  ancode: Scalars['Int']['input'];
  onlyPlannedByMe: Scalars['Boolean']['input'];
};

export type SyncChangeEntry = {
  __typename?: 'SyncChangeEntry';
  /** set only for changed entries */
  fields?: Maybe<Array<SyncFieldChange>>;
  name: Scalars['String']['output'];
  /** added | removed | changed */
  type: Scalars['String']['output'];
};

export type SyncFieldChange = {
  __typename?: 'SyncFieldChange';
  field: Scalars['String']['output'];
  new: Scalars['String']['output'];
  old: Scalars['String']['output'];
};

/**
 * SyncLogEntry records one external transfer (import from / upload to ZPA, Anny, …).
 * For imports it also carries the diff against the DB state right before it.
 */
export type SyncLogEntry = {
  __typename?: 'SyncLogEntry';
  added: Scalars['Int']['output'];
  changed: Scalars['Int']['output'];
  /** import | upload */
  direction: Scalars['String']['output'];
  /** per-entry detail (imports only) */
  entries?: Maybe<Array<SyncChangeEntry>>;
  /** human-readable label */
  label: Scalars['String']['output'];
  ok: Scalars['Boolean']['output'];
  /** stable key, e.g. zpa-import-exams, zpa-upload-plan-exams-rooms, anny-import-bookings */
  operation: Scalars['String']['output'];
  removed: Scalars['Int']['output'];
  summary: Scalars['String']['output'];
  /** ZPA | Anny | … */
  system: Scalars['String']['output'];
  time: Scalars['Time']['output'];
};

export type Teacher = {
  __typename?: 'Teacher';
  email: Scalars['String']['output'];
  fk: Scalars['String']['output'];
  fullname: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  isActive: Scalars['Boolean']['output'];
  isLBA: Scalars['Boolean']['output'];
  isProf: Scalars['Boolean']['output'];
  isProfHC: Scalars['Boolean']['output'];
  isStaff: Scalars['Boolean']['output'];
  lastSemester: Scalars['String']['output'];
  shortname: Scalars['String']['output'];
};

/**
 * Students of an exam that could not be assigned a real room in their slot during
 * room generation (kept out of the planned rooms).
 */
export type UnplacedExam = {
  __typename?: 'UnplacedExam';
  ancode: Scalars['Int']['output'];
  mtknrs: Array<Scalars['String']['output']>;
  /** set if these are NTA students (then mtknrs has exactly one entry). */
  ntaMtknr?: Maybe<Scalars['String']['output']>;
  /** Absolute start time of the exam. */
  starttime?: Maybe<Scalars['Time']['output']>;
};

/** UnplacedExamReason is the reason a single exam ended up unplaced in a generation run. */
export type UnplacedExamReason = {
  __typename?: 'UnplacedExamReason';
  ancode: Scalars['Int']['output'];
  reason: Scalars['String']['output'];
};

/**
 * A user is a login identity supplied by the auth proxy (Shibboleth/OIDC, matched by
 * email) together with a role. Users live in the global plexams DB and are the
 * authorization allow-list. Kept strictly separate from the planer (the shared email
 * sender identity).
 */
export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  name: Scalars['String']['output'];
  role: Role;
};

/**
 * ValidationFinding is one problem (or note) found by a validator. message is clean
 * text (no ANSI); the optional reference fields let the GUI link a finding to the
 * affected exam / room / slot / invigilator / student and render it as a row.
 */
export type ValidationFinding = {
  __typename?: 'ValidationFinding';
  ancode?: Maybe<Scalars['Int']['output']>;
  invigilatorID?: Maybe<Scalars['Int']['output']>;
  level: ValidationLevel;
  message: Scalars['String']['output'];
  relatedAncodes?: Maybe<Array<Scalars['Int']['output']>>;
  room?: Maybe<Scalars['String']['output']>;
  /** Absolute start time of the affected slot (derived; null when not slot-related). */
  starttime?: Maybe<Scalars['Time']['output']>;
  studentMtknr?: Maybe<Scalars['String']['output']>;
};

/** ValidationLevel classifies a single validation finding. */
export enum ValidationLevel {
  Error = 'ERROR',
  Info = 'INFO',
  Warning = 'WARNING'
}

/**
 * ValidationReport is the structured outcome of one validator. It is delivered on
 * the final RESULT line of the validator's subscription (in LogLine.validation),
 * while the human-readable lines stream before it.
 */
export type ValidationReport = {
  __typename?: 'ValidationReport';
  errorCount: Scalars['Int']['output'];
  findings: Array<ValidationFinding>;
  infoCount: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  ok: Scalars['Boolean']['output'];
  /** Why the validator was skipped, if skipped. */
  skipReason?: Maybe<Scalars['String']['output']>;
  /**
   * True when the validator did not run because the data it checks does not exist yet
   * (e.g. no exam plan, no rooms, no invigilations). Not a failure — render neutrally
   * ("übersprungen"), not as a green pass.
   */
  skipped: Scalars['Boolean']['output'];
  warningCount: Scalars['Int']['output'];
};

export type WorstStudent = {
  __typename?: 'WorstStudent';
  examCount: Scalars['Int']['output'];
  exams: Array<WorstStudentExam>;
  group: Scalars['String']['output'];
  /** Smallest free-days-between over the student's consecutive exams: -2 overlap, -1 same day, 0 adjacent, k = k free days. */
  minFreeDays: Scalars['Int']['output'];
  mtknr: Scalars['String']['output'];
  name: Scalars['String']['output'];
  program: Scalars['String']['output'];
  worstLabel: Scalars['String']['output'];
};

export type WorstStudentExam = {
  __typename?: 'WorstStudentExam';
  ancode: Scalars['Int']['output'];
  durationMinutes: Scalars['Int']['output'];
  module: Scalars['String']['output'];
  starttime: Scalars['Time']['output'];
};

export type ZpaConflict = {
  __typename?: 'ZPAConflict';
  ancode: Scalars['Int']['output'];
  numberOfStuds: Scalars['Int']['output'];
  primussAncodes: Array<PrimussExamAncode>;
};

export type ZpaExam = {
  __typename?: 'ZPAExam';
  ancode: Scalars['Int']['output'];
  duration: Scalars['Int']['output'];
  examType: Scalars['String']['output'];
  examTypeFull: Scalars['String']['output'];
  /**
   * Responsible faculty (Prüfungsplanung), e.g. FK03/FK08/FK12 for external MUC.DAI
   * exams. Empty for our own FK07 exams — the GUI can treat empty as FK07.
   */
  faculty: Scalars['String']['output'];
  groups: Array<Scalars['String']['output']>;
  isRepeaterExam: Scalars['Boolean']['output'];
  mainExamer: Scalars['String']['output'];
  mainExamerID: Scalars['Int']['output'];
  module: Scalars['String']['output'];
  primussAncodes: Array<ZpaPrimussAncodes>;
  semester: Scalars['String']['output'];
  zpaID: Scalars['Int']['output'];
};

export type ZpaExamWithConstraints = {
  __typename?: 'ZPAExamWithConstraints';
  constraints?: Maybe<Constraints>;
  planEntry?: Maybe<PlanEntry>;
  zpaExam: ZpaExam;
};

export type ZpaExamsForType = {
  __typename?: 'ZPAExamsForType';
  exams: Array<ZpaExam>;
  type: Scalars['String']['output'];
};

export type ZpaInvigilator = {
  __typename?: 'ZPAInvigilator';
  hasSubmittedRequirements: Scalars['Boolean']['output'];
  teacher: Teacher;
};

export type ZpaPrimussAncodes = {
  __typename?: 'ZPAPrimussAncodes';
  ancode: Scalars['Int']['output'];
  program: Scalars['String']['output'];
};

export type ZpaStudent = {
  __typename?: 'ZPAStudent';
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  gender: Scalars['String']['output'];
  greeting: Scalars['String']['output'];
  group: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  mtknr: Scalars['String']['output'];
};

export type ZpaStudentReg = {
  __typename?: 'ZPAStudentReg';
  ancode: Scalars['Int']['output'];
  mtknr: Scalars['String']['output'];
  program: Scalars['String']['output'];
};

export type ZpaStudentRegError = {
  __typename?: 'ZPAStudentRegError';
  ancode: Scalars['String']['output'];
  exam: Scalars['String']['output'];
  mtknr: Scalars['String']['output'];
  program: Scalars['String']['output'];
  semester: Scalars['String']['output'];
};
