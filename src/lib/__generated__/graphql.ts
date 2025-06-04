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
  duration: Scalars['Int']['output'];
  groups: Array<Scalars['String']['output']>;
  isRepeaterExam: Scalars['Boolean']['output'];
  mainExamer: Scalars['String']['output'];
  mainExamerID: Scalars['Int']['output'];
  module: Scalars['String']['output'];
};

export type AdditionalExamInput = {
  ancode: Scalars['Int']['input'];
  duration: Scalars['Int']['input'];
  groups: Array<Scalars['String']['input']>;
  isRepeaterExam: Scalars['Boolean']['input'];
  mainExamerID: Scalars['Int']['input'];
  module: Scalars['String']['input'];
};

export type AnCode = {
  __typename?: 'AnCode';
  ancode: Scalars['Int']['output'];
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
  errors: Array<Scalars['String']['output']>;
  otherPrimussExams: Array<PrimussExam>;
  primussExams: Array<PrimussExam>;
  zpaExam: ZpaExam;
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

export type Emails = {
  __typename?: 'Emails';
  fs: Scalars['String']['output'];
  lbas: Scalars['String']['output'];
  profs: Scalars['String']['output'];
};

export type EnhancedPrimussExam = {
  __typename?: 'EnhancedPrimussExam';
  conflicts: Array<Conflict>;
  exam: PrimussExam;
  ntas: Array<Nta>;
  studentRegs: Array<StudentReg>;
};

export type Exam = {
  __typename?: 'Exam';
  ancode: Scalars['Int']['output'];
  conflicts: Array<ConflictsPerProgramAncode>;
  connectErrors: Array<Scalars['String']['output']>;
  constraints?: Maybe<Constraints>;
  externalExam?: Maybe<ExternalExam>;
  ntaStudents?: Maybe<Array<Student>>;
  primussExams: Array<PrimussExam>;
  regularStudents?: Maybe<Array<Student>>;
  rooms?: Maybe<Array<RoomForExam>>;
  slot?: Maybe<Slot>;
  studentRegs: Array<StudentRegsPerAncodeAndProgram>;
  zpaExam?: Maybe<ZpaExam>;
};

export type ExamDay = {
  __typename?: 'ExamDay';
  date: Scalars['Time']['output'];
  number: Scalars['Int']['output'];
};

export type ExamGroup = {
  __typename?: 'ExamGroup';
  examGroupCode: Scalars['Int']['output'];
  examGroupInfo?: Maybe<ExamGroupInfo>;
  exams: Array<ExamToPlan>;
};

export type ExamGroupConflict = {
  __typename?: 'ExamGroupConflict';
  count: Scalars['Int']['output'];
  examGroupCode: Scalars['Int']['output'];
};

export type ExamGroupInfo = {
  __typename?: 'ExamGroupInfo';
  conflicts?: Maybe<Array<Maybe<ExamGroupConflict>>>;
  excludeDays?: Maybe<Array<Scalars['Int']['output']>>;
  fixedDay?: Maybe<Scalars['Int']['output']>;
  fixedSlot?: Maybe<Slot>;
  maxDuration: Scalars['Int']['output'];
  maxDurationNTA?: Maybe<Scalars['Int']['output']>;
  notPlannedByMe: Scalars['Boolean']['output'];
  possibleDays?: Maybe<Array<Scalars['Int']['output']>>;
  possibleSlots?: Maybe<Array<Slot>>;
  programs: Array<Scalars['String']['output']>;
  studentRegs: Scalars['Int']['output'];
};

export type ExamInPlan = {
  __typename?: 'ExamInPlan';
  constraints?: Maybe<Constraints>;
  exam: ExamWithRegs;
  nta?: Maybe<Array<NtaWithRegs>>;
  slot?: Maybe<Slot>;
};

export type ExamToPlan = {
  __typename?: 'ExamToPlan';
  constraints?: Maybe<Constraints>;
  exam: ExamWithRegs;
};

export type ExamWithRegs = {
  __typename?: 'ExamWithRegs';
  ancode: Scalars['Int']['output'];
  conflicts: Array<ConflictPerProgram>;
  connectErrors: Array<Scalars['String']['output']>;
  primussExams: Array<PrimussExam>;
  studentRegs: Array<StudentRegsPerAncodeAndProgram>;
  zpaExam: ZpaExam;
};

export type ExamWithRegsAndRooms = {
  __typename?: 'ExamWithRegsAndRooms';
  exam: PlannedExam;
  normalRegsMtknr: Array<Scalars['String']['output']>;
  ntas: Array<Nta>;
  rooms: Array<PlannedRoom>;
};

export type ExamerInPlan = {
  __typename?: 'ExamerInPlan';
  mainExamer: Scalars['String']['output'];
  mainExamerID: Scalars['Int']['output'];
};

export type ExternalExam = {
  __typename?: 'ExternalExam';
  ancode: Scalars['Int']['output'];
  duration: Scalars['Int']['output'];
  mainExamer: Scalars['String']['output'];
  module: Scalars['String']['output'];
  program: Scalars['String']['output'];
};

export type Fk07Program = {
  __typename?: 'FK07Program';
  name: Scalars['String']['output'];
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
  roomName?: Maybe<Scalars['String']['output']>;
  slot: Slot;
};

export type InvigilationSlot = {
  __typename?: 'InvigilationSlot';
  reserve?: Maybe<Teacher>;
  roomsWithInvigilators: Array<RoomWithInvigilator>;
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

export type InvigilatorRequirements = {
  __typename?: 'InvigilatorRequirements';
  allContributions: Scalars['Int']['output'];
  examDateTimes: Array<Scalars['Time']['output']>;
  examDays: Array<Scalars['Int']['output']>;
  excludedDates: Array<Scalars['Time']['output']>;
  excludedDays: Array<Scalars['Int']['output']>;
  factor: Scalars['Float']['output'];
  freeSemester: Scalars['Float']['output'];
  liveCodingContribution: Scalars['Int']['output'];
  masterContribution: Scalars['Int']['output'];
  onlyInSlots: Array<Slot>;
  oralExamsContribution: Scalars['Int']['output'];
  overtimeLastSemester: Scalars['Float']['output'];
  overtimeThisSemester: Scalars['Float']['output'];
  partTime: Scalars['Float']['output'];
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
  addAdditionalExam: Scalars['Boolean']['output'];
  addConstraints: Constraints;
  addExamGroupToSlot: Scalars['Boolean']['output'];
  addExamToSlot: Scalars['Boolean']['output'];
  addNTA: Nta;
  addRoomToExam: Scalars['Boolean']['output'];
  addZpaExamToPlan: Scalars['Boolean']['output'];
  exahm: Scalars['Boolean']['output'];
  excludeDays: Scalars['Boolean']['output'];
  lab: Scalars['Boolean']['output'];
  notPlannedByMe: Scalars['Boolean']['output'];
  online: Scalars['Boolean']['output'];
  placesWithSockets: Scalars['Boolean']['output'];
  possibleDays: Scalars['Boolean']['output'];
  removePrimussExam: Scalars['Boolean']['output'];
  rmConstraints: Scalars['Boolean']['output'];
  rmExamFromSlot: Scalars['Boolean']['output'];
  rmExamGroupFromSlot: Scalars['Boolean']['output'];
  rmZpaExamFromPlan: Scalars['Boolean']['output'];
  sameSlot: Scalars['Boolean']['output'];
  seb: Scalars['Boolean']['output'];
  setSemester: Semester;
  zpaExamsToPlan: Array<ZpaExam>;
};


export type MutationAddAdditionalExamArgs = {
  exam: AdditionalExamInput;
};


export type MutationAddConstraintsArgs = {
  ancode: Scalars['Int']['input'];
  constraints: ConstraintsInput;
};


export type MutationAddExamGroupToSlotArgs = {
  day: Scalars['Int']['input'];
  examGroupCode: Scalars['Int']['input'];
  time: Scalars['Int']['input'];
};


export type MutationAddExamToSlotArgs = {
  ancode: Scalars['Int']['input'];
  day: Scalars['Int']['input'];
  time: Scalars['Int']['input'];
};


export type MutationAddNtaArgs = {
  input: NtaInput;
};


export type MutationAddRoomToExamArgs = {
  input: RoomForExamInput;
};


export type MutationAddZpaExamToPlanArgs = {
  ancode: Scalars['Int']['input'];
};


export type MutationExahmArgs = {
  ancode: Scalars['Int']['input'];
};


export type MutationExcludeDaysArgs = {
  ancode: Scalars['Int']['input'];
  days: Array<Scalars['String']['input']>;
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


export type MutationRemovePrimussExamArgs = {
  input?: InputMaybe<PrimussExamInput>;
};


export type MutationRmConstraintsArgs = {
  ancode: Scalars['Int']['input'];
};


export type MutationRmExamFromSlotArgs = {
  ancode: Scalars['Int']['input'];
};


export type MutationRmExamGroupFromSlotArgs = {
  examGroupCode: Scalars['Int']['input'];
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


export type MutationSetSemesterArgs = {
  input: Scalars['String']['input'];
};


export type MutationZpaExamsToPlanArgs = {
  input: Array<Scalars['Int']['input']>;
};

export type Nta = {
  __typename?: 'NTA';
  compensation: Scalars['String']['output'];
  deactivated: Scalars['Boolean']['output'];
  deltaDurationPercent: Scalars['Int']['output'];
  email?: Maybe<Scalars['String']['output']>;
  exams: Array<NtaExam>;
  from: Scalars['String']['output'];
  lastSemester?: Maybe<Scalars['String']['output']>;
  mtknr: Scalars['String']['output'];
  name: Scalars['String']['output'];
  needsHardware: Scalars['Boolean']['output'];
  needsRoomAlone: Scalars['Boolean']['output'];
  program: Scalars['String']['output'];
  until: Scalars['String']['output'];
};

export type NtaExam = {
  __typename?: 'NTAExam';
  ancode: Scalars['String']['output'];
  mainExamer: Scalars['String']['output'];
  module: Scalars['String']['output'];
  semester: Scalars['String']['output'];
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

export type Plan = {
  __typename?: 'Plan';
  semesterConfig?: Maybe<SemesterConfig>;
  slots?: Maybe<Array<Maybe<SlotWithExamGroups>>>;
};

export type PlanEntry = {
  __typename?: 'PlanEntry';
  ancode: Scalars['Int']['output'];
  dayNumber: Scalars['Int']['output'];
  locked: Scalars['Boolean']['output'];
  slotNumber: Scalars['Int']['output'];
  starttime: Scalars['Time']['output'];
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

export type PlannedExamWithNta = {
  __typename?: 'PlannedExamWithNTA';
  constraints?: Maybe<Constraints>;
  exam: ExamWithRegs;
  nta?: Maybe<Array<NtaWithRegs>>;
};

export type PlannedRoom = {
  __typename?: 'PlannedRoom';
  ancode: Scalars['Int']['output'];
  day: Scalars['Int']['output'];
  duration: Scalars['Int']['output'];
  handicap: Scalars['Boolean']['output'];
  handicapRoomAlone: Scalars['Boolean']['output'];
  ntaMtknr?: Maybe<Scalars['String']['output']>;
  reserve: Scalars['Boolean']['output'];
  room: Room;
  slot: Scalars['Int']['output'];
  studentsInRoom: Array<Scalars['String']['output']>;
};

export type PreExam = {
  __typename?: 'PreExam';
  constraints?: Maybe<Constraints>;
  planEntry?: Maybe<PlanEntry>;
  zpaExam: ZpaExam;
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
  additionalExams: Array<AdditionalExam>;
  allProgramsInPlan?: Maybe<Array<Scalars['String']['output']>>;
  allSemesterNames: Array<Semester>;
  allowedSlots?: Maybe<Array<Slot>>;
  ancodesInPlan?: Maybe<Array<Scalars['Int']['output']>>;
  awkwardSlots: Array<Slot>;
  conflictingAncodes?: Maybe<Array<Conflict>>;
  connectedExam?: Maybe<ConnectedExam>;
  connectedExams: Array<ConnectedExam>;
  constraintForAncode?: Maybe<Constraints>;
  dayOkForInvigilator?: Maybe<Scalars['Boolean']['output']>;
  exam?: Maybe<Exam>;
  examGroup?: Maybe<ExamGroup>;
  examGroups: Array<ExamGroup>;
  examGroupsWithoutSlot?: Maybe<Array<ExamGroup>>;
  examWithRegs?: Maybe<ExamWithRegs>;
  examerInPlan?: Maybe<Array<ExamerInPlan>>;
  exams: Array<Exam>;
  examsInPlan?: Maybe<Array<ExamInPlan>>;
  examsInSlot?: Maybe<Array<PlannedExam>>;
  examsInSlotWithRooms?: Maybe<Array<ExamWithRegsAndRooms>>;
  examsWithRegs?: Maybe<Array<ExamWithRegs>>;
  examsWithoutSlot: Array<PlannedExam>;
  externalExams: Array<ExternalExam>;
  fk07programs: Array<Fk07Program>;
  generatedExam?: Maybe<GeneratedExam>;
  generatedExams: Array<GeneratedExam>;
  invigilatorTodos?: Maybe<InvigilationTodos>;
  invigilators: Array<ZpaInvigilator>;
  invigilatorsForDay?: Maybe<InvigilatorsForDay>;
  invigilatorsWithReq: Array<Invigilator>;
  mucdaiExams: Array<MucDaiExam>;
  nextDeadline?: Maybe<Step>;
  nta?: Maybe<NtaWithRegs>;
  ntas?: Maybe<Array<Nta>>;
  ntasWithRegs?: Maybe<Array<Student>>;
  ntasWithRegsByTeacher?: Maybe<Array<NtaWithRegsByExamAndTeacher>>;
  plannedExam?: Maybe<PlannedExam>;
  plannedExams: Array<PlannedExam>;
  plannedExamsInSlot?: Maybe<Array<PlannedExamWithNta>>;
  plannedRoomForStudent?: Maybe<PlannedRoom>;
  plannedRoomNames?: Maybe<Array<Scalars['String']['output']>>;
  plannedRoomNamesInSlot?: Maybe<Array<Scalars['String']['output']>>;
  plannedRoomsInSlot?: Maybe<Array<PlannedRoom>>;
  preExamsInSlot?: Maybe<Array<PreExam>>;
  primussExam: PrimussExam;
  primussExams?: Maybe<Array<Maybe<PrimussExamByProgram>>>;
  primussExamsForAnCode?: Maybe<Array<PrimussExam>>;
  rooms: Array<Room>;
  roomsForSlot?: Maybe<SlotWithRooms>;
  roomsWithConstraints: Array<Room>;
  roomsWithInvigilationsForSlot?: Maybe<InvigilationSlot>;
  semester: Semester;
  semesterConfig: SemesterConfig;
  studentByMtknr?: Maybe<Student>;
  studentRegsForProgram?: Maybe<Array<StudentReg>>;
  studentRegsImportErrors: Array<RegWithError>;
  students: Array<Student>;
  studentsByName: Array<Student>;
  teacher?: Maybe<Teacher>;
  teachers: Array<Teacher>;
  workflow: Array<Step>;
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


export type QueryDayOkForInvigilatorArgs = {
  day: Scalars['Int']['input'];
  invigilatorID: Scalars['Int']['input'];
};


export type QueryExamArgs = {
  ancode: Scalars['Int']['input'];
};


export type QueryExamGroupArgs = {
  examGroupCode: Scalars['Int']['input'];
};


export type QueryExamWithRegsArgs = {
  ancode: Scalars['Int']['input'];
};


export type QueryExamsInSlotArgs = {
  day: Scalars['Int']['input'];
  time: Scalars['Int']['input'];
};


export type QueryExamsInSlotWithRoomsArgs = {
  day: Scalars['Int']['input'];
  time: Scalars['Int']['input'];
};


export type QueryGeneratedExamArgs = {
  ancode: Scalars['Int']['input'];
};


export type QueryInvigilatorsForDayArgs = {
  day: Scalars['Int']['input'];
};


export type QueryNtaArgs = {
  mtknr: Scalars['String']['input'];
};


export type QueryPlannedExamArgs = {
  ancode: Scalars['Int']['input'];
};


export type QueryPlannedExamsInSlotArgs = {
  day: Scalars['Int']['input'];
  time: Scalars['Int']['input'];
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


export type QueryRoomsWithConstraintsArgs = {
  exahm?: InputMaybe<Scalars['Boolean']['input']>;
  handicap: Scalars['Boolean']['input'];
  lab: Scalars['Boolean']['input'];
  placesWithSocket: Scalars['Boolean']['input'];
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

export type Room = {
  __typename?: 'Room';
  exahm: Scalars['Boolean']['output'];
  handicap: Scalars['Boolean']['output'];
  lab: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  needsRequest: Scalars['Boolean']['output'];
  placesWithSocket: Scalars['Boolean']['output'];
  seats: Scalars['Int']['output'];
  seb: Scalars['Boolean']['output'];
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

export type RoomForExam = {
  __typename?: 'RoomForExam';
  ancode: Scalars['Int']['output'];
  duration: Scalars['Int']['output'];
  handicap: Scalars['Boolean']['output'];
  reserve: Scalars['Boolean']['output'];
  room?: Maybe<Room>;
  seatsPlanned: Scalars['Int']['output'];
  students: Array<StudentReg>;
};

export type RoomForExamInput = {
  ancode: Scalars['Int']['input'];
  day: Scalars['Int']['input'];
  duration: Scalars['Int']['input'];
  handicap: Scalars['Boolean']['input'];
  mktnrs?: InputMaybe<Array<Scalars['String']['input']>>;
  roomName: Scalars['String']['input'];
  seatsPlanned: Scalars['Int']['input'];
  time: Scalars['Int']['input'];
};

export type RoomWithInvigilator = {
  __typename?: 'RoomWithInvigilator';
  invigilator?: Maybe<Teacher>;
  maxDuration: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  roomAndExams: Array<RoomAndExam>;
  studentCount: Scalars['Int']['output'];
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
  fromFK07: Scalars['Time']['output'];
  goDay0: Scalars['Time']['output'];
  goSlots: Array<Slot>;
  goSlotsRaw?: Maybe<Array<Array<Scalars['Int']['output']>>>;
  slots: Array<Slot>;
  starttimes: Array<Starttime>;
  until: Scalars['Time']['output'];
};

export type Slot = {
  __typename?: 'Slot';
  dayNumber: Scalars['Int']['output'];
  slotNumber: Scalars['Int']['output'];
  starttime: Scalars['Time']['output'];
};

export type SlotWithExamGroups = {
  __typename?: 'SlotWithExamGroups';
  dayNumber: Scalars['Int']['output'];
  examGroups?: Maybe<Array<Maybe<ExamGroup>>>;
  slotNumber: Scalars['Int']['output'];
};

export type SlotWithRooms = {
  __typename?: 'SlotWithRooms';
  dayNumber: Scalars['Int']['output'];
  exahmRooms: Array<Room>;
  labRooms: Array<Room>;
  normalRooms: Array<Room>;
  ntaRooms: Array<Room>;
  slotNumber: Scalars['Int']['output'];
};

export type Starttime = {
  __typename?: 'Starttime';
  number: Scalars['Int']['output'];
  start: Scalars['String']['output'];
};

export type Step = {
  __typename?: 'Step';
  deadline?: Maybe<Scalars['Time']['output']>;
  done: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  number: Scalars['Int']['output'];
};

export type Student = {
  __typename?: 'Student';
  group: Scalars['String']['output'];
  mtknr: Scalars['String']['output'];
  name: Scalars['String']['output'];
  nta?: Maybe<Nta>;
  program: Scalars['String']['output'];
  regs: Array<Scalars['Int']['output']>;
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

export type Teacher = {
  __typename?: 'Teacher';
  email: Scalars['String']['output'];
  fk: Scalars['String']['output'];
  fullname: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  isLBA: Scalars['Boolean']['output'];
  isProf: Scalars['Boolean']['output'];
  isProfHC: Scalars['Boolean']['output'];
  isStaff: Scalars['Boolean']['output'];
  lastSemester: Scalars['String']['output'];
  shortname: Scalars['String']['output'];
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
