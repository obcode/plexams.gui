export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
	[_ in K]?: never;
};
export type Incremental<T> =
	| T
	| { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: { input: string; output: string };
	String: { input: string; output: string };
	Boolean: { input: boolean; output: boolean };
	Int: { input: number; output: number };
	Float: { input: number; output: number };
	Time: { input: any; output: any };
};

export type AnCode = {
	__typename?: 'AnCode';
	ancode: Scalars['Int']['output'];
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
	note: Scalars['String']['output'];
	number: Scalars['String']['output'];
	personalizationName: Scalars['String']['output'];
	room?: Maybe<Scalars['String']['output']>;
	self: Scalars['String']['output'];
	startDate: Scalars['Time']['output'];
	status: Scalars['String']['output'];
	updatedAt: Scalars['Time']['output'];
};

/** Filter über ein einzelnes Mutation-Argument (key=value). */
export type ArgFilterInput = {
	key?: InputMaybe<Scalars['String']['input']>;
	value?: InputMaybe<Scalars['String']['input']>;
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

/** A room blocked for one slot (not usable for planning there). */
export type BlockedRoom = {
	__typename?: 'BlockedRoom';
	day: Scalars['Int']['output'];
	reason?: Maybe<Scalars['String']['output']>;
	room: Scalars['String']['output'];
	slot: Scalars['Int']['output'];
};

export type Conflict = {
	__typename?: 'Conflict';
	ancode: Scalars['Int']['output'];
	numberOfStuds: Scalars['Int']['output'];
};

export type ConflictPerProgram = {
	__typename?: 'ConflictPerProgram';
	conflicts: Array<Conflict>;
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
	warnings: Array<ConnectedExamWarning>;
	zpaExam: ZpaExam;
};

/** A structured note on a ZPA↔Primuss connection. level ∈ info | warning | error. */
export type ConnectedExamWarning = {
	__typename?: 'ConnectedExamWarning';
	ancode?: Maybe<Scalars['Int']['output']>;
	examer?: Maybe<Scalars['String']['output']>;
	level: Scalars['String']['output'];
	message: Scalars['String']['output'];
	module?: Maybe<Scalars['String']['output']>;
	program?: Maybe<Scalars['String']['output']>;
};

export type Constraints = {
	__typename?: 'Constraints';
	ancode: Scalars['Int']['output'];
	excludeDays?: Maybe<Array<Scalars['Time']['output']>>;
	fixedDay?: Maybe<Scalars['Time']['output']>;
	fixedTime?: Maybe<Scalars['Time']['output']>;
	notPlannedByMe: Scalars['Boolean']['output'];
	online: Scalars['Boolean']['output'];
	possibleDays?: Maybe<Array<Scalars['Time']['output']>>;
	roomConstraints?: Maybe<RoomConstraints>;
	sameSlot?: Maybe<Array<Scalars['Int']['output']>>;
};

export type ConstraintsInput = {
	allowedRooms?: InputMaybe<Array<Scalars['String']['input']>>;
	comments?: InputMaybe<Scalars['String']['input']>;
	exahm?: InputMaybe<Scalars['Boolean']['input']>;
	excludeDays?: InputMaybe<Array<Scalars['Time']['input']>>;
	fixedDay?: InputMaybe<Scalars['Time']['input']>;
	fixedTime?: InputMaybe<Scalars['Time']['input']>;
	kdpJiraURL?: InputMaybe<Scalars['String']['input']>;
	lab?: InputMaybe<Scalars['Boolean']['input']>;
	maxStudents?: InputMaybe<Scalars['Int']['input']>;
	notPlannedByMe?: InputMaybe<Scalars['Boolean']['input']>;
	online?: InputMaybe<Scalars['Boolean']['input']>;
	placesWithSocket?: InputMaybe<Scalars['Boolean']['input']>;
	possibleDays?: InputMaybe<Array<Scalars['Time']['input']>>;
	sameSlot?: InputMaybe<Array<Scalars['Int']['input']>>;
	seb?: InputMaybe<Scalars['Boolean']['input']>;
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
	ancode: Scalars['Int']['output'];
	group: Scalars['String']['output'];
	mtknr: Scalars['String']['output'];
	name: Scalars['String']['output'];
	presence: Scalars['String']['output'];
	program: Scalars['String']['output'];
	zpaStudent?: Maybe<ZpaStudent>;
};

export type ExamDay = {
	__typename?: 'ExamDay';
	date: Scalars['Time']['output'];
	number: Scalars['Int']['output'];
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

export type GeneratedExam = {
	__typename?: 'GeneratedExam';
	ancode: Scalars['Int']['output'];
	conflicts: Array<ZpaConflict>;
	constraints?: Maybe<Constraints>;
	mainExamer: Teacher;
	maxDuration: Scalars['Int']['output'];
	ntas: Array<Nta>;
	primussExams: Array<EnhancedPrimussExam>;
	studentRegsCount: Scalars['Int']['output'];
	zpaExam: ZpaExam;
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
 * the generateInvigilations subscription (also for dryRun, where nothing is
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
	duration: Scalars['Int']['output'];
	examType: Scalars['String']['output'];
	isRepeaterExam: Scalars['Boolean']['output'];
	mainExamer: Scalars['String']['output'];
	mainExamerID?: Maybe<Scalars['Int']['output']>;
	module: Scalars['String']['output'];
	plannedBy: Scalars['String']['output'];
	primussAncode: Scalars['Int']['output'];
	program: Scalars['String']['output'];
};

export type Mutation = {
	__typename?: 'Mutation';
	addConstraints: Constraints;
	addExamToSlot: Scalars['Boolean']['output'];
	addNTA: Nta;
	/**
	 * Accept that an NTA gives up the room-alone right for one exam (key:
	 * mtknr/ancode), with a reason. Downgrades the rooms validation to a warning and
	 * is added to the NTA email.
	 */
	addNtaRoomAloneWaiver: NtaRoomAloneWaiver;
	addPreplanExam: PreplanExam;
	/** ZPA↔Primuss-Zuordnung bearbeiten — alle liefern das aktualisierte ConnectedExam. */
	addPrimussAncode: ConnectedExam;
	/** Create a new room (key: name). Errors if a room with that name already exists. */
	addRoom: Room;
	/** Manually add a single room request (key: room/day/slot). Errors if one already exists. Starts active and not approved. */
	addRoomRequest: RoomRequest;
	addZpaExamToPlan: Scalars['Boolean']['output'];
	/**
	 * Generate room requests from the current plan and REPLACE all existing ones
	 * (one-shot, no merge). Generated requests start active and not approved. Errors
	 * if requests already exist unless force is true (force discards them, including
	 * approved flags). Returns the number written.
	 */
	applyRoomRequestsPreview: Scalars['Int']['output'];
	/** Block a room for a slot so it is not used for planning there (e.g. otherwise occupied). reason is an optional note. */
	blockRoomForSlot: BlockedRoom;
	/** Block a room for several slots at once (e.g. a whole day or a time range). Returns the stored blocks. */
	blockRoomForSlots: Array<BlockedRoom>;
	clearEmailAttachments: Scalars['Int']['output'];
	connectPreplanExamToAncode: PreplanExam;
	createSemester: SaveSemesterConfigResult;
	/** Remove the constraints record of one invigilator (key: teacherID). Returns false if there was none. */
	deleteInvigilatorConstraints: Scalars['Boolean']['output'];
	deletePreplanExam: Scalars['Boolean']['output'];
	deleteStudyProgram: Scalars['Boolean']['output'];
	disconnectPreplanExam: PreplanExam;
	exahm: Scalars['Boolean']['output'];
	excludeDays: Scalars['Boolean']['output'];
	fixPrimussAncode: ConnectedExam;
	/**
	 * Generate (and persist) slot assignments for the SEB/EXaHM preplan exams.
	 * keepAssigned: true keeps manually set slots fixed, only places unassigned ones.
	 */
	generatePreplanAssignment: PreplanValidation;
	lab: Scalars['Boolean']['output'];
	/**
	 * One-time migration: copy the invigilatorConstraints from the semester config
	 * (viper) into the DB. Returns the number of records written.
	 */
	migrateInvigilatorConstraints: Scalars['Int']['output'];
	/** One-time import of roomConstraints.<room>.reservations from the semester config into the DB. Returns the number imported. */
	migrateRoomRequestsFromConfig: Scalars['Int']['output'];
	/**
	 * One-time backfill: derive requestWith for all rooms (ANNY for request-rooms
	 * with a T name, MANAGEMENT for other request-rooms, NONE otherwise). Returns
	 * the number of rooms updated.
	 */
	migrateRoomsRequestWith: Scalars['Int']['output'];
	notPlannedByMe: Scalars['Boolean']['output'];
	online: Scalars['Boolean']['output'];
	placesWithSockets: Scalars['Boolean']['output'];
	possibleDays: Scalars['Boolean']['output'];
	/** Pre-plan (fix) an invigilator for a room (roomName) or the reserve (roomName == null) in a slot. */
	prePlanInvigilation: Scalars['Boolean']['output'];
	/**
	 * prePlanInvigilationInSlot promotes the invigilation currently planned for a
	 * room (roomName) or the reserve (roomName == null) in a slot to a pre-planned,
	 * fixed assignment, so it survives a re-run of the automatic planning.
	 */
	prePlanInvigilationInSlot: Scalars['Boolean']['output'];
	prePlanRoom: Scalars['Boolean']['output'];
	/** Remove an NTA room-alone waiver (key: mtknr/ancode). */
	removeNtaRoomAloneWaiver: Scalars['Boolean']['output'];
	/** Remove a permanent non-invigilator (key: teacherID). Returns false if there was none. */
	removePermanentNonInvigilator: Scalars['Boolean']['output'];
	/** Remove a pre-planned invigilation (key: day/slot/roomName; roomName null = the reserve). */
	removePrePlannedInvigilation: Scalars['Boolean']['output'];
	/** Remove a pre-planned room from an exam (key: ancode/roomName/mtknr). mtknr null = the room for normal students. */
	removePrePlannedRoom: Scalars['Boolean']['output'];
	removePrimussAncode: ConnectedExam;
	/**
	 * Reset the generated invigilations (invigilations_other) so only the
	 * pre-planning remains; self-invigilations are refreshed on the next generation.
	 * Blocked while the invigilation plan is published.
	 */
	resetInvigilations: Scalars['Boolean']['output'];
	/**
	 * Reset the generated room plan (planned_rooms) so only the pre-planning
	 * remains; re-generation re-applies it. Blocked while the room plan is published.
	 */
	resetRoomsForExams: Scalars['Boolean']['output'];
	rmConstraints: Scalars['Boolean']['output'];
	rmExamFromSlot: Scalars['Boolean']['output'];
	rmZpaExamFromPlan: Scalars['Boolean']['output'];
	sameSlot: Scalars['Boolean']['output'];
	seb: Scalars['Boolean']['output'];
	seedStudyProgramsFromConfig: Scalars['Int']['output'];
	/** Create or replace the whole constraints record of one invigilator (key: teacherID). */
	setInvigilatorConstraints: InvigilatorConstraints;
	/** Activate/deactivate an NTA (key: mtknr). A deactivated NTA is not applied to exams. */
	setNTAActive: Nta;
	/**
	 * Add or update a permanent (cross-semester) non-invigilator (key: teacherID),
	 * e.g. someone retired. name is the display name (pass the candidate's name; if
	 * empty the backend tries to resolve it).
	 */
	setPermanentNonInvigilator: PermanentNonInvigilator;
	setPlaner: Planer;
	/** Set or clear a planning condition by hand (e.g. mark/unmark a plan as published). Returns the new state. */
	setPlanningCondition: PlanningState;
	setPreplanExamSlot: PreplanExam;
	/** Activate/deactivate a room (key: name). A deactivated room is not used for planning. */
	setRoomActive: Room;
	/** Activate/deactivate a room request; inactive requests are not used for room planning. */
	setRoomRequestActive: RoomRequest;
	/** Set the approved flag of a room request (key: room/day/slot). */
	setRoomRequestApproved: RoomRequest;
	setSemesterConfigInput: SaveSemesterConfigResult;
	/** Remove a room block for a slot (key: room/day/slot). */
	unblockRoomForSlot: Scalars['Boolean']['output'];
	/** Remove the room blocks for several slots at once. Returns how many blocks were removed. */
	unblockRoomForSlots: Scalars['Int']['output'];
	/** Update the editable fields of an existing NTA (key: mtknr). Errors if it does not exist. */
	updateNTA: Nta;
	updatePreplanExam: PreplanExam;
	/** Update an existing room (key: name). Errors if it does not exist; keeps the active state. */
	updateRoom: Room;
	/**
	 * Change the time range of an existing room request, e.g. extend it for an NTA
	 * (key: room/day/slot). Errors if it does not exist.
	 */
	updateRoomRequestTime: RoomRequest;
	upsertStudyProgram: StudyProgram;
	zpaExamsToPlan: Array<ZpaExam>;
};

export type MutationAddConstraintsArgs = {
	ancode: Scalars['Int']['input'];
	constraints: ConstraintsInput;
};

export type MutationAddExamToSlotArgs = {
	ancode: Scalars['Int']['input'];
	day: Scalars['Int']['input'];
	time: Scalars['Int']['input'];
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
	day: Scalars['Int']['input'];
	from: Scalars['Time']['input'];
	room: Scalars['String']['input'];
	slot: Scalars['Int']['input'];
	until: Scalars['Time']['input'];
};

export type MutationAddZpaExamToPlanArgs = {
	ancode: Scalars['Int']['input'];
};

export type MutationApplyRoomRequestsPreviewArgs = {
	force: Scalars['Boolean']['input'];
};

export type MutationBlockRoomForSlotArgs = {
	day: Scalars['Int']['input'];
	reason?: InputMaybe<Scalars['String']['input']>;
	room: Scalars['String']['input'];
	slot: Scalars['Int']['input'];
};

export type MutationBlockRoomForSlotsArgs = {
	reason?: InputMaybe<Scalars['String']['input']>;
	room: Scalars['String']['input'];
	slots: Array<SlotInput>;
};

export type MutationClearEmailAttachmentsArgs = {
	kind: Scalars['String']['input'];
};

export type MutationConnectPreplanExamToAncodeArgs = {
	ancode: Scalars['Int']['input'];
	id: Scalars['Int']['input'];
};

export type MutationCreateSemesterArgs = {
	input: SemesterConfigInputData;
	semester: Scalars['String']['input'];
};

export type MutationDeleteInvigilatorConstraintsArgs = {
	teacherID: Scalars['Int']['input'];
};

export type MutationDeletePreplanExamArgs = {
	id: Scalars['Int']['input'];
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

export type MutationExcludeDaysArgs = {
	ancode: Scalars['Int']['input'];
	days: Array<Scalars['String']['input']>;
};

export type MutationFixPrimussAncodeArgs = {
	fromAncode: Scalars['Int']['input'];
	program: Scalars['String']['input'];
	toAncode: Scalars['Int']['input'];
	zpaAncode: Scalars['Int']['input'];
};

export type MutationGeneratePreplanAssignmentArgs = {
	keepAssigned: Scalars['Boolean']['input'];
};

export type MutationLabArgs = {
	ancode: Scalars['Int']['input'];
};

export type MutationNotPlannedByMeArgs = {
	ancode: Scalars['Int']['input'];
};

export type MutationOnlineArgs = {
	ancode: Scalars['Int']['input'];
};

export type MutationPlacesWithSocketsArgs = {
	ancode: Scalars['Int']['input'];
};

export type MutationPossibleDaysArgs = {
	ancode: Scalars['Int']['input'];
	days: Array<Scalars['String']['input']>;
};

export type MutationPrePlanInvigilationArgs = {
	day: Scalars['Int']['input'];
	invigilatorID: Scalars['Int']['input'];
	roomName?: InputMaybe<Scalars['String']['input']>;
	slot: Scalars['Int']['input'];
};

export type MutationPrePlanInvigilationInSlotArgs = {
	day: Scalars['Int']['input'];
	roomName?: InputMaybe<Scalars['String']['input']>;
	slot: Scalars['Int']['input'];
};

export type MutationPrePlanRoomArgs = {
	ancode: Scalars['Int']['input'];
	mtknr?: InputMaybe<Scalars['String']['input']>;
	reserve: Scalars['Boolean']['input'];
	roomName: Scalars['String']['input'];
	seats?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationRemoveNtaRoomAloneWaiverArgs = {
	ancode: Scalars['Int']['input'];
	mtknr: Scalars['String']['input'];
};

export type MutationRemovePermanentNonInvigilatorArgs = {
	teacherID: Scalars['Int']['input'];
};

export type MutationRemovePrePlannedInvigilationArgs = {
	day: Scalars['Int']['input'];
	roomName?: InputMaybe<Scalars['String']['input']>;
	slot: Scalars['Int']['input'];
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

export type MutationRmConstraintsArgs = {
	ancode: Scalars['Int']['input'];
};

export type MutationRmExamFromSlotArgs = {
	ancode: Scalars['Int']['input'];
};

export type MutationRmZpaExamFromPlanArgs = {
	ancode: Scalars['Int']['input'];
};

export type MutationSameSlotArgs = {
	ancode: Scalars['Int']['input'];
	ancodes: Array<Scalars['Int']['input']>;
};

export type MutationSebArgs = {
	ancode: Scalars['Int']['input'];
};

export type MutationSetInvigilatorConstraintsArgs = {
	input: InvigilatorConstraintsInput;
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
	email: Scalars['String']['input'];
	name: Scalars['String']['input'];
};

export type MutationSetPlanningConditionArgs = {
	done: Scalars['Boolean']['input'];
	key: Scalars['String']['input'];
};

export type MutationSetPreplanExamSlotArgs = {
	dayNumber?: InputMaybe<Scalars['Int']['input']>;
	id: Scalars['Int']['input'];
	slotNumber?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationSetRoomActiveArgs = {
	active: Scalars['Boolean']['input'];
	name: Scalars['String']['input'];
};

export type MutationSetRoomRequestActiveArgs = {
	active: Scalars['Boolean']['input'];
	day: Scalars['Int']['input'];
	room: Scalars['String']['input'];
	slot: Scalars['Int']['input'];
};

export type MutationSetRoomRequestApprovedArgs = {
	approved: Scalars['Boolean']['input'];
	day: Scalars['Int']['input'];
	room: Scalars['String']['input'];
	slot: Scalars['Int']['input'];
};

export type MutationSetSemesterConfigInputArgs = {
	input: SemesterConfigInputData;
};

export type MutationUnblockRoomForSlotArgs = {
	day: Scalars['Int']['input'];
	room: Scalars['String']['input'];
	slot: Scalars['Int']['input'];
};

export type MutationUnblockRoomForSlotsArgs = {
	room: Scalars['String']['input'];
	slots: Array<SlotInput>;
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
	day: Scalars['Int']['input'];
	from: Scalars['Time']['input'];
	room: Scalars['String']['input'];
	slot: Scalars['Int']['input'];
	until: Scalars['Time']['input'];
};

export type MutationUpsertStudyProgramArgs = {
	input: StudyProgramInput;
};

export type MutationZpaExamsToPlanArgs = {
	input: Array<Scalars['Int']['input']>;
};

export type MutationLogArg = {
	__typename?: 'MutationLogArg';
	key: Scalars['String']['output'];
	value: Scalars['String']['output'];
};

/** Ein Audit-Log-Eintrag. type ∈ mutation | subscription | cli. */
export type MutationLogEntry = {
	__typename?: 'MutationLogEntry';
	ancodes: Array<Scalars['Int']['output']>;
	args: Array<MutationLogArg>;
	durationMs: Scalars['Int']['output'];
	error?: Maybe<Scalars['String']['output']>;
	name: Scalars['String']['output'];
	time: Scalars['Time']['output'];
	type: Scalars['String']['output'];
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
	dayNumber: Scalars['Int']['output'];
	externalTime?: Maybe<Scalars['Time']['output']>;
	locked: Scalars['Boolean']['output'];
	slotNumber: Scalars['Int']['output'];
	starttime: Scalars['Time']['output'];
};

/** Global planner (name + e-mail), stored in the DB, semester-independent. */
export type Planer = {
	__typename?: 'Planer';
	email: Scalars['String']['output'];
	name: Scalars['String']['output'];
};

export type PlannedExam = {
	__typename?: 'PlannedExam';
	ancode: Scalars['Int']['output'];
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
	day: Scalars['Int']['output'];
	duration: Scalars['Int']['output'];
	handicap: Scalars['Boolean']['output'];
	handicapRoomAlone: Scalars['Boolean']['output'];
	ntaMtknr?: Maybe<Scalars['String']['output']>;
	prePlanned: Scalars['Boolean']['output'];
	reserve: Scalars['Boolean']['output'];
	room: Room;
	slot: Scalars['Int']['output'];
	studentsInRoom: Array<Scalars['String']['output']>;
};

export type PlanningCondition = {
	__typename?: 'PlanningCondition';
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
	day: Scalars['Int']['output'];
	invigilatorID: Scalars['Int']['output'];
	isReserve: Scalars['Boolean']['output'];
	roomName?: Maybe<Scalars['String']['output']>;
	slot: Scalars['Int']['output'];
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

/** Suggested ZPA exam (ancode) for a PreplanExam — best matches first. */
export type PreplanAncodeSuggestion = {
	__typename?: 'PreplanAncodeSuggestion';
	ancode: Scalars['Int']['output'];
	examType: Scalars['String']['output'];
	mainExamer: Scalars['String']['output'];
	mainExamerID: Scalars['Int']['output'];
	module: Scalars['String']['output'];
};

/**
 * PreplanExam is an SEB/EXaHM exam pre-planned for a semester (kept in that
 * semester's DB). Slot assignment (plannedDayNumber/SlotNumber) and ancode are
 * managed separately and survive updates.
 */
export type PreplanExam = {
	__typename?: 'PreplanExam';
	ancode?: Maybe<Scalars['Int']['output']>;
	duration?: Maybe<Scalars['Int']['output']>;
	examKind: Scalars['String']['output'];
	examerID: Scalars['Int']['output'];
	examerName: Scalars['String']['output'];
	expectedStudents: Scalars['Int']['output'];
	id: Scalars['Int']['output'];
	module: Scalars['String']['output'];
	notes?: Maybe<Scalars['String']['output']>;
	plannedDayNumber?: Maybe<Scalars['Int']['output']>;
	plannedSlotNumber?: Maybe<Scalars['Int']['output']>;
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

export type PreplanKindNeed = {
	__typename?: 'PreplanKindNeed';
	examCount: Scalars['Int']['output'];
	rooms: Array<Scalars['String']['output']>;
	roomsSuggested: Scalars['Int']['output'];
	roomsToBook: Array<Scalars['String']['output']>;
	seatsAvailable: Scalars['Int']['output'];
	seatsBooked: Scalars['Int']['output'];
	seatsNeeded: Scalars['Int']['output'];
};

export type PreplanOverview = {
	__typename?: 'PreplanOverview';
	slots: Array<PreplanSlotNeed>;
};

export type PreplanSlotConflict = {
	__typename?: 'PreplanSlotConflict';
	modules: Array<Scalars['String']['output']>;
	preplanExamIDs: Array<Scalars['Int']['output']>;
	program: Scalars['String']['output'];
};

/**
 * PreplanSlotNeed: per-slot SEB/EXaHM room demand. A slot with all of
 * dayNumber/slotNumber/starttime null is the "without slot" bucket.
 */
export type PreplanSlotNeed = {
	__typename?: 'PreplanSlotNeed';
	conflicts: Array<PreplanSlotConflict>;
	dayNumber?: Maybe<Scalars['Int']['output']>;
	exahm: PreplanKindNeed;
	seb: PreplanKindNeed;
	slotNumber?: Maybe<Scalars['Int']['output']>;
	starttime?: Maybe<Scalars['Time']['output']>;
};

/** Result of validating or generating the SEB/EXaHM preplan slot assignment. */
export type PreplanValidation = {
	__typename?: 'PreplanValidation';
	assignedCount: Scalars['Int']['output'];
	messages: Array<Scalars['String']['output']>;
	ok: Scalars['Boolean']['output'];
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
	examType: Scalars['String']['output'];
	mainExamer: Scalars['String']['output'];
	module: Scalars['String']['output'];
	presence: Scalars['String']['output'];
	program: Scalars['String']['output'];
	studentRegsCount: Scalars['Int']['output'];
};

export type Query = {
	__typename?: 'Query';
	allAnnyBookings: Array<AnnyBooking>;
	allProgramsInPlan?: Maybe<Array<Scalars['String']['output']>>;
	allSemesterNames: Array<Semester>;
	allowedSlots?: Maybe<Array<Slot>>;
	ancodesInPlan?: Maybe<Array<Scalars['Int']['output']>>;
	annyBookings: Array<AnnyBooking>;
	awkwardSlots: Array<Slot>;
	/** All rooms blocked for a specific slot (not usable there, e.g. otherwise occupied). */
	blockedRooms: Array<BlockedRoom>;
	conflictingAncodes?: Maybe<Array<Conflict>>;
	connectedExam?: Maybe<ConnectedExam>;
	connectedExams: Array<ConnectedExam>;
	constraintForAncode?: Maybe<Constraints>;
	emailAttachments: Array<EmailAttachmentInfo>;
	examerInPlan?: Maybe<Array<ExamerInPlan>>;
	/**
	 * examersWithExamsPlannedByMe returns the main examers of all planned exams that
	 * are planned by me (not flagged NotPlannedByMe).
	 */
	examersWithExamsPlannedByMe: Array<Teacher>;
	examsInSlot?: Maybe<Array<PlannedExam>>;
	examsWithNtas: Array<PlannedExam>;
	examsWithoutSlot: Array<PlannedExam>;
	fk07programs: Array<Fk07Program>;
	generatedExam?: Maybe<GeneratedExam>;
	generatedExams: Array<GeneratedExam>;
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
	mucdaiExams: Array<MucDaiExam>;
	mutationLog: Array<MutationLogEntry>;
	mutationLogNames: Array<Scalars['String']['output']>;
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
	planer: Planer;
	plannedExam?: Maybe<PlannedExam>;
	plannedExams: Array<PlannedExam>;
	plannedRoomForStudent?: Maybe<PlannedRoom>;
	plannedRoomNames?: Maybe<Array<Scalars['String']['output']>>;
	plannedRoomNamesInSlot?: Maybe<Array<Scalars['String']['output']>>;
	plannedRooms: Array<PlannedRoom>;
	plannedRoomsInSlot?: Maybe<Array<PlannedRoom>>;
	/** The planning state (phases, conditions, currently locked areas). */
	planningState: PlanningState;
	preExamsInSlot?: Maybe<Array<PreExam>>;
	prePlannedInvigilations: Array<PrePlannedInvigilation>;
	prePlannedRooms: Array<PrePlannedRoom>;
	preplanExam?: Maybe<PreplanExam>;
	preplanExamAncodeSuggestions: Array<PreplanAncodeSuggestion>;
	preplanExams: Array<PreplanExam>;
	preplanOverview: PreplanOverview;
	primussExam: PrimussExam;
	primussExams?: Maybe<Array<Maybe<PrimussExamByProgram>>>;
	primussExamsForAnCode?: Maybe<Array<PrimussExam>>;
	/** All building-management room requests of the semester. */
	roomRequests: Array<RoomRequest>;
	/** Dry-run: which management rooms would be requested for which exams (read-only, changes nothing). */
	roomRequestsPreview: Array<RoomRequestPreview>;
	rooms: Array<Room>;
	roomsForSlot?: Maybe<RoomsForSlot>;
	roomsForSlots: Array<RoomsForSlot>;
	/**
	 * All rooms allowed in a slot with their free seats and which exams already use
	 * them — for sharing a room (e.g. as a reserve).
	 */
	roomsWithFreeSeatsForSlot: Array<RoomWithFreeSeats>;
	roomsWithInvigilationsForSlot?: Maybe<InvigilationSlot>;
	semester: Semester;
	semesterConfig: SemesterConfig;
	semesterConfigInput?: Maybe<SemesterConfigInput>;
	studentByMtknr?: Maybe<Student>;
	studentRegsForProgram?: Maybe<Array<StudentReg>>;
	studentRegsImportErrors: Array<RegWithError>;
	students: Array<Student>;
	studentsByName: Array<Student>;
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
	validatePreplanAssignment: PreplanValidation;
	zpaAnCodes?: Maybe<Array<Maybe<AnCode>>>;
	zpaExam?: Maybe<ZpaExam>;
	zpaExams: Array<ZpaExam>;
	zpaExamsByType: Array<ZpaExamsForType>;
	zpaExamsNotToPlan: Array<ZpaExam>;
	zpaExamsPlaningStatusUnknown: Array<ZpaExam>;
	zpaExamsToPlan: Array<ZpaExam>;
	zpaExamsToPlanWithConstraints: Array<ZpaExamWithConstraints>;
};

export type QueryAllowedSlotsArgs = {
	ancode: Scalars['Int']['input'];
};

export type QueryAnnyBookingsArgs = {
	room?: InputMaybe<Scalars['String']['input']>;
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

export type QueryExamsInSlotArgs = {
	day: Scalars['Int']['input'];
	time: Scalars['Int']['input'];
};

export type QueryGeneratedExamArgs = {
	ancode: Scalars['Int']['input'];
};

export type QueryInvigilatorArgs = {
	day: Scalars['Int']['input'];
	room: Scalars['String']['input'];
	time: Scalars['Int']['input'];
};

export type QueryInvigilatorsForDayArgs = {
	day: Scalars['Int']['input'];
};

export type QueryMutationLogArgs = {
	ancode?: InputMaybe<Scalars['Int']['input']>;
	args?: InputMaybe<Array<ArgFilterInput>>;
	limit?: InputMaybe<Scalars['Int']['input']>;
	name?: InputMaybe<Scalars['String']['input']>;
	since?: InputMaybe<Scalars['Time']['input']>;
	type?: InputMaybe<Scalars['String']['input']>;
	until?: InputMaybe<Scalars['Time']['input']>;
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

export type QueryPlannedRoomNamesInSlotArgs = {
	day: Scalars['Int']['input'];
	time: Scalars['Int']['input'];
};

export type QueryPlannedRoomsInSlotArgs = {
	day: Scalars['Int']['input'];
	time: Scalars['Int']['input'];
};

export type QueryPreExamsInSlotArgs = {
	day: Scalars['Int']['input'];
	time: Scalars['Int']['input'];
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

export type QueryRoomsForSlotArgs = {
	day: Scalars['Int']['input'];
	time: Scalars['Int']['input'];
};

export type QueryRoomsWithFreeSeatsForSlotArgs = {
	day: Scalars['Int']['input'];
	time: Scalars['Int']['input'];
};

export type QueryRoomsWithInvigilationsForSlotArgs = {
	day: Scalars['Int']['input'];
	time: Scalars['Int']['input'];
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

export type RegWithProgram = {
	__typename?: 'RegWithProgram';
	program: Scalars['String']['output'];
	reg: Scalars['Int']['output'];
};

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
	allowedRooms?: Maybe<Array<Scalars['String']['output']>>;
	comments?: Maybe<Scalars['String']['output']>;
	exahm: Scalars['Boolean']['output'];
	kdpJiraURL?: Maybe<Scalars['String']['output']>;
	lab: Scalars['Boolean']['output'];
	maxStudents?: Maybe<Scalars['Int']['output']>;
	placesWithSocket: Scalars['Boolean']['output'];
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
	day: Scalars['Int']['output'];
	from: Scalars['Time']['output'];
	room: Scalars['String']['output'];
	slot: Scalars['Int']['output'];
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
	day: Scalars['Int']['output'];
	exam: PlannedExam;
	from: Scalars['Time']['output'];
	room: Scalars['String']['output'];
	seats: Scalars['Int']['output'];
	simultaneousExams: Array<PlannedExam>;
	slot: Scalars['Int']['output'];
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
	day: Scalars['Int']['output'];
	rooms: Array<Room>;
	slot: Scalars['Int']['output'];
};

export type SaveSemesterConfigResult = {
	__typename?: 'SaveSemesterConfigResult';
	ok: Scalars['Boolean']['output'];
	warnings: Array<Scalars['String']['output']>;
};

export type Semester = {
	__typename?: 'Semester';
	id: Scalars['String']['output'];
};

export type SemesterConfig = {
	__typename?: 'SemesterConfig';
	days: Array<ExamDay>;
	emails: Emails;
	forbiddenSlots?: Maybe<Array<Slot>>;
	from: Scalars['Time']['output'];
	mucDaiSlots: Array<Slot>;
	mucDaiSlotsRaw?: Maybe<Array<Array<Scalars['Int']['output']>>>;
	slots: Array<Slot>;
	starttimes: Array<Starttime>;
	until: Scalars['Time']['output'];
};

/**
 * SemesterConfigInput is the editable semester configuration (raw input form,
 * before days/slots are computed). Null for a fresh semester without config.
 * NOTE: hand-written stub for the GUI — regenerate via update-schema.graphql.
 */
export type SemesterConfigInput = {
	__typename?: 'SemesterConfigInput';
	emails: Emails;
	forbiddenDays?: Maybe<Array<Scalars['Time']['output']>>;
	from: Scalars['Time']['output'];
	mucDaiSlots?: Maybe<Array<Array<Scalars['Int']['output']>>>;
	slots: Array<Scalars['String']['output']>;
	until: Scalars['Time']['output'];
};

export type SemesterConfigInputData = {
	emails: EmailsInput;
	forbiddenDays?: InputMaybe<Array<Scalars['Time']['input']>>;
	from: Scalars['Time']['input'];
	mucDaiSlots?: InputMaybe<Array<Array<Scalars['Int']['input']>>>;
	slots: Array<Scalars['String']['input']>;
	until: Scalars['Time']['input'];
};

export type Slot = {
	__typename?: 'Slot';
	dayNumber: Scalars['Int']['output'];
	slotNumber: Scalars['Int']['output'];
	starttime: Scalars['Time']['output'];
};

/** A day/slot pair, used to block a room for several slots at once. */
export type SlotInput = {
	day: Scalars['Int']['input'];
	slot: Scalars['Int']['input'];
};

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

export type Starttime = {
	__typename?: 'Starttime';
	number: Scalars['Int']['output'];
	start: Scalars['String']['output'];
};

export type Student = {
	__typename?: 'Student';
	group: Scalars['String']['output'];
	mtknr: Scalars['String']['output'];
	name: Scalars['String']['output'];
	nta?: Maybe<Nta>;
	program: Scalars['String']['output'];
	regs: Array<Scalars['Int']['output']>;
	regsWithProgram: Array<RegWithProgram>;
	zpaStudent?: Maybe<ZpaStudent>;
};

export type StudentReg = {
	__typename?: 'StudentReg';
	ancode: Scalars['Int']['output'];
	group: Scalars['String']['output'];
	mtknr: Scalars['String']['output'];
	name: Scalars['String']['output'];
	presence: Scalars['String']['output'];
	program: Scalars['String']['output'];
};

export type StudentRegsPerAncode = {
	__typename?: 'StudentRegsPerAncode';
	ancode: Scalars['Int']['output'];
	perProgram: Array<StudentRegsPerAncodeAndProgram>;
};

export type StudentRegsPerAncodeAndProgram = {
	__typename?: 'StudentRegsPerAncodeAndProgram';
	ancode: Scalars['Int']['output'];
	program: Scalars['String']['output'];
	studentRegs: Array<StudentReg>;
};

export type StudentRegsPerStudent = {
	__typename?: 'StudentRegsPerStudent';
	ancodes: Array<Scalars['Int']['output']>;
	student: Student;
};

/**
 * StudyProgram is a global (cross-semester) study program. category groups them
 * (fk07 | mucdai | misc). name may be empty right after the seed.
 */
export type StudyProgram = {
	__typename?: 'StudyProgram';
	active: Scalars['Boolean']['output'];
	category: Scalars['String']['output'];
	degree?: Maybe<Scalars['String']['output']>;
	name: Scalars['String']['output'];
	retired: Scalars['Boolean']['output'];
	shortname: Scalars['String']['output'];
};

export type StudyProgramInput = {
	active: Scalars['Boolean']['input'];
	category: Scalars['String']['input'];
	degree?: InputMaybe<Scalars['String']['input']>;
	name: Scalars['String']['input'];
	retired?: InputMaybe<Scalars['Boolean']['input']>;
	shortname: Scalars['String']['input'];
};

export type Subscription = {
	__typename?: 'Subscription';
	/**
	 * generateInvigilations runs the automatic invigilation planning and streams its
	 * output line by line (terminal style). With dryRun the optimizer only reports;
	 * nothing is written to the database. seed and iterations override the config
	 * defaults (0/null = keep config/default). The stream ends with a DONE line.
	 */
	generateInvigilations: LogLine;
	/**
	 * Assign rooms to all exams (rooms-for-exams) and stream the output. Recomputes
	 * rooms-for-slots first, then writes the planned rooms; no separate
	 * rooms-for-slots step needed.
	 */
	generateRoomsForExams: LogLine;
	/**
	 * Recompute the allowed rooms per slot (rooms-for-slots) and stream the output.
	 * Writes only the derived slot→rooms cache; useful to preview it after editing
	 * rooms or room requests.
	 */
	generateRoomsForSlots: LogLine;
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
	sendEmailConstraints: LogLine;
	/** Send the cover-page email to a single examer. */
	sendEmailCoverPage: LogLine;
	/** Send cover-page emails to all examers with exams planned by me. */
	sendEmailCoverPages: LogLine;
	sendEmailDraft: LogLine;
	sendEmailExaHM: LogLine;
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
	sendEmailPrepared: LogLine;
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
	validateDB: LogLine;
	validateInvigilationConstraints: LogLine;
	validateInvigilationDuplicates: LogLine;
	validateInvigilationsTimeDistance: LogLine;
	validateInvigilatorRequirements: LogLine;
	validateInvigilatorSlots: LogLine;
	validatePrePlannedExahmRooms: LogLine;
	validateRoomsBlocked: LogLine;
	validateRoomsEnoughSeats: LogLine;
	validateRoomsForSlotsFresh: LogLine;
	validateRoomsNeedRequest: LogLine;
	validateRoomsPerExam: LogLine;
	validateRoomsPerSlot: LogLine;
	validateRoomsTimeDistance: LogLine;
	validateStudentRegs: LogLine;
	validateZPADateTimes: LogLine;
	validateZPAInvigilators: LogLine;
	validateZPARooms: LogLine;
};

export type SubscriptionGenerateInvigilationsArgs = {
	dryRun: Scalars['Boolean']['input'];
	iterations?: InputMaybe<Scalars['Int']['input']>;
	seed?: InputMaybe<Scalars['Int']['input']>;
};

export type SubscriptionSendEmailConstraintsArgs = {
	run: Scalars['Boolean']['input'];
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

export type SubscriptionSendEmailPreparedArgs = {
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
	day: Scalars['Int']['output'];
	mtknrs: Array<Scalars['String']['output']>;
	/** set if these are NTA students (then mtknrs has exactly one entry). */
	ntaMtknr?: Maybe<Scalars['String']['output']>;
	slot: Scalars['Int']['output'];
};

/**
 * ValidationFinding is one problem (or note) found by a validator. message is clean
 * text (no ANSI); the optional reference fields let the GUI link a finding to the
 * affected exam / room / slot / invigilator / student and render it as a row.
 */
export type ValidationFinding = {
	__typename?: 'ValidationFinding';
	ancode?: Maybe<Scalars['Int']['output']>;
	day?: Maybe<Scalars['Int']['output']>;
	invigilatorID?: Maybe<Scalars['Int']['output']>;
	level: ValidationLevel;
	message: Scalars['String']['output'];
	relatedAncodes?: Maybe<Array<Scalars['Int']['output']>>;
	room?: Maybe<Scalars['String']['output']>;
	slot?: Maybe<Scalars['Int']['output']>;
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
	warningCount: Scalars['Int']['output'];
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
