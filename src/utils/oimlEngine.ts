import {
  AccuracyClass,
  OIMLClassConfig,
  WeighingPerformanceObservation,
  RepeatabilityTestRun,
  EccentricityTestPoint,
  ZeroAccuracyTest,
  TemperatureEffectTest,
  CreepTestRun,
  ComplianceResult,
  UnitType,
  TarePerformanceObservation,
} from '../types/oiml';

// Default OIML R-76-1:2006 Rules Configuration
export const DEFAULT_OIML_CONFIGS: Record<AccuracyClass, OIMLClassConfig> = {
  I: {
    accuracyClass: 'I',
    classNameTitle: 'Class I (Special Accuracy / Analytical)',
    minScaleInterval_e: 0.001, // 1 mg
    min_n: 50000,
    max_n: 10000000,
    minCapacityMultiplier_e: 100, // 100e
    step1_limit_e: 50000,
    step2_limit_e: 200000,
    mpeStep1_e: 0.5,
    mpeStep2_e: 1.0,
    mpeStep3_e: 1.5,
    zeroTolerance_e: 0.25,
  },
  II: {
    accuracyClass: 'II',
    classNameTitle: 'Class II (High Accuracy / Precision)',
    minScaleInterval_e: 0.001, // 1 mg to 50 mg
    min_n: 100,
    max_n: 100000,
    minCapacityMultiplier_e: 20, // 20e (or 50e depending on e range)
    step1_limit_e: 5000,
    step2_limit_e: 20000,
    mpeStep1_e: 0.5,
    mpeStep2_e: 1.0,
    mpeStep3_e: 1.5,
    zeroTolerance_e: 0.25,
  },
  III: {
    accuracyClass: 'III',
    classNameTitle: 'Class III (Medium Accuracy / Commercial & Industrial)',
    minScaleInterval_e: 0.1, // 0.1 g
    min_n: 100,
    max_n: 10000,
    minCapacityMultiplier_e: 20, // 20e
    step1_limit_e: 500,
    step2_limit_e: 2000,
    mpeStep1_e: 0.5,
    mpeStep2_e: 1.0,
    mpeStep3_e: 1.5,
    zeroTolerance_e: 0.25,
  },
  IIII: {
    accuracyClass: 'IIII',
    classNameTitle: 'Class IIII (Ordinary Accuracy / Coarse Weights)',
    minScaleInterval_e: 5.0, // 5 g
    min_n: 100,
    max_n: 1000,
    minCapacityMultiplier_e: 10, // 10e
    step1_limit_e: 50,
    step2_limit_e: 200,
    mpeStep1_e: 0.5,
    mpeStep2_e: 1.0,
    mpeStep3_e: 1.5,
    zeroTolerance_e: 0.25,
  },
};

const OIML_CONFIG_STORAGE_KEY = 'oiml_r76_class_configs_v1';

export function getStoredOIMLConfigs(): Record<AccuracyClass, OIMLClassConfig> {
  try {
    const raw = localStorage.getItem(OIML_CONFIG_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load custom OIML configs', e);
  }
  return DEFAULT_OIML_CONFIGS;
}

export function saveOIMLConfigs(configs: Record<AccuracyClass, OIMLClassConfig>) {
  localStorage.setItem(OIML_CONFIG_STORAGE_KEY, JSON.stringify(configs));
}

export function resetOIMLConfigs(): Record<AccuracyClass, OIMLClassConfig> {
  localStorage.removeItem(OIML_CONFIG_STORAGE_KEY);
  return DEFAULT_OIML_CONFIGS;
}

/**
 * Calculates the Maximum Permissible Error (MPE) in units of the verification scale interval 'e'
 * as per OIML R-76-1:2006 Table 6 for Initial Verification / Type Evaluation.
 */
export function calculateMPE_in_e(
  loadInE: number,
  accuracyClass: AccuracyClass,
  configs = getStoredOIMLConfigs()
): number {
  const config = configs[accuracyClass] || DEFAULT_OIML_CONFIGS[accuracyClass];
  const absLoadInE = Math.abs(loadInE);

  if (absLoadInE <= config.step1_limit_e) {
    return config.mpeStep1_e; // +/- 0.5 e
  } else if (absLoadInE <= config.step2_limit_e) {
    return config.mpeStep2_e; // +/- 1.0 e
  } else {
    return config.mpeStep3_e; // +/- 1.5 e
  }
}

/**
 * Converts MPE in e to actual physical measurement units (e.g. grams or kg)
 */
export function calculateMPE_in_units(
  load: number,
  verificationInterval_e: number,
  accuracyClass: AccuracyClass,
  configs = getStoredOIMLConfigs()
): number {
  if (verificationInterval_e <= 0) return 0;
  const loadInE = Math.abs(load) / verificationInterval_e;
  const mpe_e = calculateMPE_in_e(loadInE, accuracyClass, configs);
  return Number((mpe_e * verificationInterval_e).toFixed(6));
}

/**
 * Turning Point Equation (OIML R-76-1 Clause A.4.4.3):
 * P = I + 0.5*d - deltaL
 * where:
 * - I is the displayed indication
 * - d is the actual scale interval
 * - deltaL is the additional small load (0.1d increments) required to step to I + d
 */
export function calculateTurningPointP(
  indication: number,
  deltaL: number,
  actualScaleInterval_d: number
): number {
  if (isNaN(indication)) return 0;
  // If deltaL is 0 or not provided, direct indication is used
  if (deltaL === 0 || isNaN(deltaL)) {
    return indication;
  }
  const P = indication + 0.5 * actualScaleInterval_d - deltaL;
  return Number(P.toFixed(6));
}

/**
 * Recomputes all values for a weighing performance row
 */
export function recomputeWeighingRow(
  row: WeighingPerformanceObservation,
  e: number,
  d: number,
  accuracyClass: AccuracyClass,
  zeroErrorAsc: number = 0,
  zeroErrorDesc: number = 0,
  configs = getStoredOIMLConfigs()
): WeighingPerformanceObservation {
  const mpe = calculateMPE_in_units(row.testLoad, e, accuracyClass, configs);

  // Ascending
  const calcAsc = calculateTurningPointP(row.indicationAscending, row.deltaAscending, d);
  const errAsc = Number((calcAsc - row.testLoad).toFixed(6));
  const corrErrAsc = Number((errAsc - zeroErrorAsc).toFixed(6));
  const passAsc = Math.abs(corrErrAsc) <= mpe + 0.000001;

  // Descending
  const calcDesc = calculateTurningPointP(row.indicationDescending, row.deltaDescending, d);
  const errDesc = Number((calcDesc - row.testLoad).toFixed(6));
  const corrErrDesc = Number((errDesc - zeroErrorDesc).toFixed(6));
  const passDesc = Math.abs(corrErrDesc) <= mpe + 0.000001;

  return {
    ...row,
    calculatedAscending: calcAsc,
    errorAscending: errAsc,
    correctedErrorAscending: corrErrAsc,
    calculatedDescending: calcDesc,
    errorDescending: errDesc,
    correctedErrorDescending: corrErrDesc,
    mpe,
    passAscending: passAsc,
    passDescending: passDesc,
  };
}

/**
 * Recomputes Repeatability Test Spread
 */
export function recomputeRepeatability(
  item: RepeatabilityTestRun,
  e: number,
  accuracyClass: AccuracyClass,
  configs = getStoredOIMLConfigs()
): RepeatabilityTestRun {
  const validReadings = item.readings.filter((r) => !isNaN(r) && r !== null);
  if (validReadings.length === 0) {
    return {
      ...item,
      minReading: 0,
      maxReading: 0,
      spread: 0,
      mpe: calculateMPE_in_units(item.testLoad, e, accuracyClass, configs),
      pass: true,
    };
  }

  const min = Math.min(...validReadings);
  const max = Math.max(...validReadings);
  const spread = Number((max - min).toFixed(6));
  const mpe = calculateMPE_in_units(item.testLoad, e, accuracyClass, configs);
  const pass = spread <= mpe + 0.000001;

  return {
    ...item,
    minReading: min,
    maxReading: max,
    spread,
    mpe,
    pass,
  };
}

/**
 * Recomputes Eccentricity Point
 */
export function recomputeEccentricityPoint(
  item: EccentricityTestPoint,
  centerError: number,
  e: number,
  d: number,
  accuracyClass: AccuracyClass,
  configs = getStoredOIMLConfigs()
): EccentricityTestPoint {
  const calcP = calculateTurningPointP(item.indication, item.deltaL, d);
  const err = Number((calcP - item.testLoad).toFixed(6));
  // In OIML R-76, corrected error on eccentricity is evaluated relative to center or zero
  const corrErr = Number((err - centerError).toFixed(6));
  const mpe = calculateMPE_in_units(item.testLoad, e, accuracyClass, configs);
  const pass = Math.abs(corrErr) <= mpe + 0.000001;

  return {
    ...item,
    calculatedP: calcP,
    error: err,
    correctedError: corrErr,
    mpe,
    pass,
  };
}

/**
 * Recomputes Tare observation
 */
export function recomputeTareObservation(
  item: TarePerformanceObservation,
  e: number,
  d: number,
  accuracyClass: AccuracyClass,
  configs = getStoredOIMLConfigs()
): TarePerformanceObservation {
  const calcP = calculateTurningPointP(item.indication, item.deltaL, d);
  const err = Number((calcP - item.netTestLoad).toFixed(6));
  const mpe = calculateMPE_in_units(item.netTestLoad, e, accuracyClass, configs);
  const pass = Math.abs(err) <= mpe + 0.000001;

  return {
    ...item,
    calculatedP: calcP,
    error: err,
    mpe,
    pass,
  };
}

/**
 * Recomputes Creep Test
 */
export function recomputeCreep(
  creep: CreepTestRun,
  e: number
): CreepTestRun {
  const creep30min = Number(Math.abs(creep.reading30min - creep.reading0min).toFixed(6));
  const creepDiff15to30 = Number(Math.abs(creep.reading30min - creep.reading15min).toFixed(6));
  const zeroReturnError = Number(Math.abs(creep.readingZeroReturn).toFixed(6));

  const creep30minLimit = Number((0.5 * e).toFixed(6));
  const creep15to30Limit = Number((0.2 * e).toFixed(6));
  const zeroReturnLimit = Number((0.5 * e).toFixed(6));

  const pass =
    creep30min <= creep30minLimit + 0.000001 &&
    creepDiff15to30 <= creep15to30Limit + 0.000001 &&
    zeroReturnError <= zeroReturnLimit + 0.000001;

  return {
    ...creep,
    creep30min,
    creepDiff15to30,
    zeroReturnError,
    creep30minLimit,
    creep15to30Limit,
    zeroReturnLimit,
    pass,
  };
}

/**
 * Overall Compliance Evaluator
 */
export function evaluateOverallCompliance(report: {
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
}): {
  overall: ComplianceResult;
  weighingPass: boolean;
  repeatabilityPass: boolean;
  eccentricityPass: boolean;
  tarePass: boolean;
  zeroPass: boolean;
  temperaturePass: boolean;
  creepPass: boolean;
  failedItems: string[];
} {
  const failedItems: string[] = [];

  // Weighing
  let weighingPass = true;
  if (report.selectedTests.weighingPerformance) {
    for (const row of report.weighingData) {
      if (!row.passAscending || !row.passDescending) {
        weighingPass = false;
        failedItems.push(`Weighing Performance at Load ${row.testLoad} exceeds MPE (+/- ${row.mpe})`);
      }
    }
  }

  // Repeatability
  let repeatabilityPass = true;
  if (report.selectedTests.repeatability) {
    for (const run of report.repeatabilityData) {
      if (!run.pass) {
        repeatabilityPass = false;
        failedItems.push(`Repeatability at ${run.loadPointName} (${run.testLoad}) spread ${run.spread} exceeds MPE ${run.mpe}`);
      }
    }
  }

  // Eccentricity
  let eccentricityPass = true;
  if (report.selectedTests.eccentricity) {
    for (const p of report.eccentricityData) {
      if (!p.pass) {
        eccentricityPass = false;
        failedItems.push(`Eccentricity at ${p.positionName} error ${p.correctedError} exceeds MPE ${p.mpe}`);
      }
    }
  }

  // Tare
  let tarePass = true;
  if (report.selectedTests.tare) {
    for (const t of report.tareData) {
      if (!t.pass) {
        tarePass = false;
        failedItems.push(`Tare Performance at Net Load ${t.netTestLoad} exceeds MPE ${t.mpe}`);
      }
    }
  }

  // Zero
  let zeroPass = true;
  if (report.selectedTests.zeroSetting) {
    if (!report.zeroData.pass) {
      zeroPass = false;
      failedItems.push(`Zero setting error ${report.zeroData.calculatedError} exceeds limit ${report.zeroData.maxPermissibleZeroError}`);
    }
  }

  // Temperature
  let temperaturePass = true;
  if (report.selectedTests.temperatureEffect) {
    for (const temp of report.temperatureData) {
      if (!temp.pass) {
        temperaturePass = false;
        failedItems.push(`Temperature effect at ${temp.nominalTemp}°C exceeds permissible limit`);
      }
    }
  }

  // Creep
  let creepPass = true;
  if (report.selectedTests.creep) {
    if (!report.creepData.pass) {
      creepPass = false;
      failedItems.push(`Creep Test failed: 30min=${report.creepData.creep30min} (lim ${report.creepData.creep30minLimit})`);
    }
  }

  const overall: ComplianceResult = failedItems.length === 0 ? 'PASS' : 'FAIL';

  return {
    overall,
    weighingPass,
    repeatabilityPass,
    eccentricityPass,
    tarePass,
    zeroPass,
    temperaturePass,
    creepPass,
    failedItems,
  };
}

/**
 * Validates instrument parameters against OIML R-76 Table 3
 */
export function validateInstrumentMetrology(
  max: number,
  min: number,
  e: number,
  d: number,
  accuracyClass: AccuracyClass,
  unit: UnitType
): {
  isValid: boolean;
  calculatedN: number;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (max <= 0) errors.push('Maximum capacity (Max) must be greater than zero.');
  if (min <= 0) errors.push('Minimum capacity (Min) must be greater than zero.');
  if (min >= max) errors.push('Minimum capacity (Min) must be strictly less than Max.');
  if (e <= 0) errors.push('Verification scale interval (e) must be greater than zero.');
  if (d <= 0) errors.push('Actual scale interval (d) must be greater than zero.');
  if (d > e) errors.push('Actual scale interval (d) cannot exceed verification interval (e). Usually d <= e.');

  const n = e > 0 ? Math.round(max / e) : 0;
  const configs = getStoredOIMLConfigs();
  const config = configs[accuracyClass];

  if (config) {
    if (n < config.min_n) {
      warnings.push(`Scale intervals n = ${n.toLocaleString()} is below the standard minimum (${config.min_n.toLocaleString()}) for Class ${accuracyClass}.`);
    }
    if (n > config.max_n) {
      warnings.push(`Scale intervals n = ${n.toLocaleString()} exceeds the standard maximum (${config.max_n.toLocaleString()}) for Class ${accuracyClass}.`);
    }

    const minRequired = config.minCapacityMultiplier_e * e;
    if (min < minRequired - 0.00001) {
      warnings.push(`Min capacity (${min} ${unit}) is less than recommended ${config.minCapacityMultiplier_e}e (${minRequired} ${unit}) for Class ${accuracyClass}.`);
    }
  }

  return {
    isValid: errors.length === 0,
    calculatedN: n,
    warnings,
    errors,
  };
}
