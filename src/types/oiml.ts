export type AccuracyClass = 'I' | 'II' | 'III' | 'IIII';

export type UnitType = 'g' | 'kg' | 't' | 'mg';

export type InstrumentType = 
  | 'Electronic Tabletop Scale'
  | 'Analytical Precision Balance'
  | 'Industrial Platform Scale'
  | 'Weighbridge / Truck Scale'
  | 'Crane / Hanging Scale'
  | 'Retail Price-Computing Scale'
  | 'Micro-Balance'
  | 'Other NAWI';

export type TestStatus = 'DRAFT' | 'TESTING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type ComplianceResult = 'PASS' | 'FAIL' | 'NOT_APPLICABLE';

export type UserRole = 'admin' | 'engineer' | 'reviewer' | 'viewer';

export interface UserProfile {
  id: string;
  name: string;
  designation: string;
  role: UserRole;
  labName: string;
}

export interface InstrumentDetails {
  manufacturerName: string;
  manufacturerAddress: string;
  modelName: string;
  modelNumber: string;
  serialNumber: string;
  instrumentType: InstrumentType;
  unit: UnitType;
  maxCapacity: number;
  minCapacity: number;
  verificationInterval_e: number;
  actualScaleInterval_d: number;
  accuracyClass: AccuracyClass;
  numberOfScaleIntervals_n: number;
  tareCapacity?: number;
  tareType: 'Subtractive' | 'Additive' | 'Both' | 'None';
  temperatureRangeMin: number;
  temperatureRangeMax: number;
  powerSupply: string;
  indicatorModel?: string;
  loadCellModel?: string;
  softwareVersion?: string;
  remarks?: string;
}

export interface LabEnvironment {
  labName: string;
  nablAccreditationNo: string;
  docaRegistrationNo: string;
  testLocation: string;
  testDate: string;
  testTime: string;
  ambientTempStart: number;
  ambientTempEnd: number;
  relativeHumidity: number;
  atmosphericPressure: number;
  referenceStandardClass: 'E1' | 'E2' | 'F1' | 'F2' | 'M1' | 'M2';
  referenceStandardCertNo: string;
  referenceStandardCalDate: string;
  testEquipmentUsed: string;
  testedByEngineer: string;
  reviewedByOfficer: string;
}

export interface WeighingPerformanceObservation {
  id: string;
  testLoad: number;
  indicationAscending: number;
  deltaAscending: number; // additional load in d (turning point)
  calculatedAscending: number; // P = I + 0.5d - deltaL
  errorAscending: number; // E = P - L
  correctedErrorAscending: number; // Ec = E - E0
  indicationDescending: number;
  deltaDescending: number;
  calculatedDescending: number;
  errorDescending: number;
  correctedErrorDescending: number;
  mpe: number; // Maximum Permissible Error (+/-)
  passAscending: boolean;
  passDescending: boolean;
}

export interface RepeatabilityTestRun {
  id: string;
  loadPointName: 'Min' | '0.5 Max' | 'Max' | string;
  testLoad: number;
  readings: number[];
  minReading: number;
  maxReading: number;
  spread: number; // Max - Min
  mpe: number;
  pass: boolean;
}

export interface EccentricityTestPoint {
  id: string;
  positionName: 'Center' | 'Position 1 (Front Left)' | 'Position 2 (Back Left)' | 'Position 3 (Back Right)' | 'Position 4 (Front Right)';
  testLoad: number; // normally 1/3 Max
  indication: number;
  deltaL: number;
  calculatedP: number;
  error: number;
  correctedError: number;
  mpe: number;
  pass: boolean;
}

export interface TarePerformanceObservation {
  id: string;
  tareApplied: number;
  netTestLoad: number;
  indication: number;
  deltaL: number;
  calculatedP: number;
  error: number;
  mpe: number;
  pass: boolean;
}

export interface ZeroAccuracyTest {
  zeroSettingMode: 'Initial Zero' | 'Semi-Automatic' | 'Automatic Zero-Tracking';
  testLoadNearZero: number;
  indication: number;
  deltaL: number;
  calculatedError: number;
  maxPermissibleZeroError: number; // +/- 0.25 e
  pass: boolean;
  zeroTrackingRate?: number; // e/s
}

export interface TemperatureEffectTest {
  id: string;
  nominalTemp: number; // e.g. 20, 40, -10, 20
  recordedTemp: number;
  zeroIndication: number;
  zeroError: number;
  maxLoadIndication: number;
  maxLoadError: number;
  mpeZero: number;
  mpeMax: number;
  pass: boolean;
}

export interface CreepTestRun {
  testLoad: number; // normally Max
  reading0min: number;
  reading5min: number;
  reading15min: number;
  reading30min: number;
  readingZeroReturn: number;
  creep30min: number; // |reading30 - reading0|
  creepDiff15to30: number; // |reading30 - reading15|
  zeroReturnError: number;
  creep30minLimit: number; // 0.5 e
  creep15to30Limit: number; // 0.2 e
  zeroReturnLimit: number; // 0.5 e
  pass: boolean;
}

export interface ReportAttachment {
  id: string;
  title: string;
  category: 'Instrument Photo' | 'Nameplate' | 'Test Setup' | 'Calibration Certificate' | 'Supporting Doc';
  filename: string;
  dataUrl?: string;
  uploadedAt: string;
  sizeBytes?: number;
}

export interface DigitalSignature {
  id: string;
  role: 'Test Engineer' | 'Reviewing Officer' | 'Approving Authority';
  signerName: string;
  signerDesignation: string;
  signedAt?: string;
  signatureHash?: string;
  isSigned: boolean;
  comments?: string;
}

export interface NAWITestReport {
  id: string;
  reportNumber: string;
  certificateNumber: string;
  createdAt: string;
  updatedAt: string;
  status: TestStatus;
  instrument: InstrumentDetails;
  laboratory: LabEnvironment;
  selectedTests: {
    weighingPerformance: boolean;
    repeatability: boolean;
    eccentricity: boolean;
    tare: boolean;
    zeroSetting: boolean;
    temperatureEffect: boolean;
    creep: boolean;
  };
  weighingData: WeighingPerformanceObservation[];
  repeatabilityData: RepeatabilityTestRun[];
  eccentricityData: EccentricityTestPoint[];
  tareData: TarePerformanceObservation[];
  zeroData: ZeroAccuracyTest;
  temperatureData: TemperatureEffectTest[];
  creepData: CreepTestRun;
  attachments: ReportAttachment[];
  signatures: DigitalSignature[];
  overallCompliance: ComplianceResult;
  generalRemarks: string;
  approvalRemarks?: string;
}

export interface OIMLClassConfig {
  accuracyClass: AccuracyClass;
  classNameTitle: string;
  minScaleInterval_e: number; // in grams
  min_n: number;
  max_n: number;
  minCapacityMultiplier_e: number;
  step1_limit_e: number; // e.g. 50000 for Class I, 500 for Class III
  step2_limit_e: number; // e.g. 200000 for Class I, 2000 for Class III
  mpeStep1_e: number; // 0.5
  mpeStep2_e: number; // 1.0
  mpeStep3_e: number; // 1.5
  zeroTolerance_e: number; // 0.25 e
}
