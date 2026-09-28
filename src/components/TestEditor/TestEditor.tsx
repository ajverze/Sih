import React, { useState, useEffect } from 'react';
import { 
  NAWITestReport, 
  InstrumentDetails, 
  LabEnvironment, 
  AccuracyClass, 
  UnitType, 
  WeighingPerformanceObservation, 
  RepeatabilityTestRun, 
  EccentricityTestPoint, 
  UserProfile, 
  UserRole,
  ReportAttachment 
} from '../../types/oiml';
import { 
  validateInstrumentMetrology, 
  recomputeWeighingRow, 
  recomputeRepeatability, 
  recomputeEccentricityPoint, 
  recomputeCreep, 
  evaluateOverallCompliance, 
  calculateMPE_in_units 
} from '../../utils/oimlEngine';
import { ErrorCurveChart } from '../ErrorCurveChart';
import { 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  ShieldCheck, 
  Upload, 
  FileText, 
  Scale, 
  Sparkles,
  Lock,
  Building,
  Thermometer,
  Layers,
  Paperclip
} from 'lucide-react';

interface TestEditorProps {
  report: NAWITestReport;
  currentUser: UserProfile;
  onSaveReport: (updated: NAWITestReport) => void;
  onViewReport: (report: NAWITestReport) => void;
}

export const TestEditor: React.FC<TestEditorProps> = ({
  report: initialReport,
  currentUser,
  onSaveReport,
  onViewReport,
}) => {
  const [report, setReport] = useState<NAWITestReport>(initialReport);
  const [activeStep, setActiveStep] = useState<
    'instrument' | 'lab' | 'weighing' | 'auxiliary' | 'attachments' | 'signatures'
  >('instrument');
  const [saveToast, setSaveToast] = useState(false);

  // Keep local state in sync if parent report changes
  useEffect(() => {
    setReport(initialReport);
  }, [initialReport.id]);

  // Metrological validation
  const validation = validateInstrumentMetrology(
    report.instrument.maxCapacity,
    report.instrument.minCapacity,
    report.instrument.verificationInterval_e,
    report.instrument.actualScaleInterval_d,
    report.instrument.accuracyClass,
    report.instrument.unit
  );

  // Recalculate everything when core parameters change
  const triggerFullRecalculation = (currentReport: NAWITestReport): NAWITestReport => {
    const e = currentReport.instrument.verificationInterval_e;
    const d = currentReport.instrument.actualScaleInterval_d;
    const cls = currentReport.instrument.accuracyClass;

    // Zero errors
    const zeroRow = currentReport.weighingData.find((w) => w.testLoad === 0);
    const zeroErrAsc = zeroRow ? zeroRow.errorAscending : 0;
    const zeroErrDesc = zeroRow ? zeroRow.errorDescending : 0;

    const updatedWeighing = currentReport.weighingData.map((row) =>
      recomputeWeighingRow(row, e, d, cls, zeroErrAsc, zeroErrDesc)
    );

    const updatedRepeatability = currentReport.repeatabilityData.map((rep) =>
      recomputeRepeatability(rep, e, cls)
    );

    const centerPoint = currentReport.eccentricityData.find((p) => p.positionName === 'Center');
    const centerErr = centerPoint ? centerPoint.error : 0;
    const updatedEccentricity = currentReport.eccentricityData.map((ecc) =>
      recomputeEccentricityPoint(ecc, centerErr, e, d, cls)
    );

    const updatedCreep = recomputeCreep(currentReport.creepData, e);

    const compliance = evaluateOverallCompliance({
      ...currentReport,
      weighingData: updatedWeighing,
      repeatabilityData: updatedRepeatability,
      eccentricityData: updatedEccentricity,
      creepData: updatedCreep,
    });

    return {
      ...currentReport,
      instrument: {
        ...currentReport.instrument,
        numberOfScaleIntervals_n: e > 0 ? Math.round(currentReport.instrument.maxCapacity / e) : 0,
      },
      weighingData: updatedWeighing,
      repeatabilityData: updatedRepeatability,
      eccentricityData: updatedEccentricity,
      creepData: updatedCreep,
      overallCompliance: compliance.overall,
      updatedAt: new Date().toISOString(),
    };
  };

  const handleInstrumentChange = (field: keyof InstrumentDetails, value: any) => {
    setReport((prev) => {
      const updatedInstrument = { ...prev.instrument, [field]: value };
      const updatedReport = { ...prev, instrument: updatedInstrument };
      return triggerFullRecalculation(updatedReport);
    });
  };

  const handleLabChange = (field: keyof LabEnvironment, value: any) => {
    setReport((prev) => ({
      ...prev,
      laboratory: {
        ...prev.laboratory,
        [field]: value,
      },
    }));
  };

  // Weighing data row update
  const handleWeighingCellChange = (
    id: string,
    field: 'testLoad' | 'indicationAscending' | 'deltaAscending' | 'indicationDescending' | 'deltaDescending',
    value: number
  ) => {
    setReport((prev) => {
      const e = prev.instrument.verificationInterval_e;
      const d = prev.instrument.actualScaleInterval_d;
      const cls = prev.instrument.accuracyClass;

      const updatedRows = prev.weighingData.map((row) => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          return recomputeWeighingRow(updatedRow, e, d, cls);
        }
        return row;
      });

      const updatedReport = { ...prev, weighingData: updatedRows };
      return triggerFullRecalculation(updatedReport);
    });
  };

  const handleAddWeighingRow = () => {
    setReport((prev) => {
      const e = prev.instrument.verificationInterval_e;
      const d = prev.instrument.actualScaleInterval_d;
      const cls = prev.instrument.accuracyClass;
      const lastLoad = prev.weighingData.length > 0 
        ? prev.weighingData[prev.weighingData.length - 1].testLoad 
        : 0;
      const newLoad = Number((lastLoad + prev.instrument.maxCapacity * 0.2).toFixed(4));

      const newRow: WeighingPerformanceObservation = {
        id: `w-${Date.now()}`,
        testLoad: newLoad,
        indicationAscending: newLoad,
        deltaAscending: 0,
        calculatedAscending: newLoad,
        errorAscending: 0,
        correctedErrorAscending: 0,
        indicationDescending: newLoad,
        deltaDescending: 0,
        calculatedDescending: newLoad,
        errorDescending: 0,
        correctedErrorDescending: 0,
        mpe: calculateMPE_in_units(newLoad, e, cls),
        passAscending: true,
        passDescending: true,
      };

      const updatedRows = [...prev.weighingData, newRow];
      const updatedReport = { ...prev, weighingData: updatedRows };
      return triggerFullRecalculation(updatedReport);
    });
  };

  const handleDeleteWeighingRow = (id: string) => {
    setReport((prev) => {
      const updatedRows = prev.weighingData.filter((r) => r.id !== id);
      const updatedReport = { ...prev, weighingData: updatedRows };
      return triggerFullRecalculation(updatedReport);
    });
  };

  // Repeatability observation update
  const handleRepeatabilityReadingChange = (runId: string, index: number, value: number) => {
    setReport((prev) => {
      const updatedRuns = prev.repeatabilityData.map((r) => {
        if (r.id === runId) {
          const newReadings = [...r.readings];
          newReadings[index] = value;
          return recomputeRepeatability(
            { ...r, readings: newReadings },
            prev.instrument.verificationInterval_e,
            prev.instrument.accuracyClass
          );
        }
        return r;
      });
      const updatedReport = { ...prev, repeatabilityData: updatedRuns };
      return triggerFullRecalculation(updatedReport);
    });
  };

  // Eccentricity update
  const handleEccentricityChange = (
    id: string,
    field: 'indication' | 'deltaL',
    val: number
  ) => {
    setReport((prev) => {
      const updatedEcc = prev.eccentricityData.map((p) => {
        if (p.id === id) {
          return { ...p, [field]: val };
        }
        return p;
      });
      const updatedReport = { ...prev, eccentricityData: updatedEcc };
      return triggerFullRecalculation(updatedReport);
    });
  };

  // Creep update
  const handleCreepFieldChange = (field: keyof typeof report.creepData, val: number) => {
    setReport((prev) => {
      const updatedCreep = { ...prev.creepData, [field]: val };
      const recalculated = recomputeCreep(updatedCreep, prev.instrument.verificationInterval_e);
      const updatedReport = { ...prev, creepData: recalculated };
      return triggerFullRecalculation(updatedReport);
    });
  };

  // Digital Signature Signing Handler
  const handleSign = (roleToSign: 'Test Engineer' | 'Reviewing Officer' | 'Approving Authority') => {
    const timestamp = new Date().toISOString();
    const hash = `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    setReport((prev) => {
      const updatedSigs = prev.signatures.map((sig) => {
        if (sig.role === roleToSign) {
          return {
            ...sig,
            signerName: currentUser.name,
            signerDesignation: currentUser.designation,
            signedAt: timestamp,
            signatureHash: hash,
            isSigned: true,
            comments: `Verified in accordance with Legal Metrology Act, 2009 and OIML R-76 requirements.`,
          };
        }
        return sig;
      });

      let nextStatus = prev.status;
      if (roleToSign === 'Test Engineer') nextStatus = 'PENDING_REVIEW';
      if (roleToSign === 'Approving Authority') {
        nextStatus = prev.overallCompliance === 'PASS' ? 'APPROVED' : 'REJECTED';
      }

      return {
        ...prev,
        signatures: updatedSigs,
        status: nextStatus,
        updatedAt: timestamp,
      };
    });
  };

  const handleSave = () => {
    const fullRecalc = triggerFullRecalculation(report);
    onSaveReport(fullRecalc);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  // Step Tabs definition
  const steps = [
    { id: 'instrument', label: '1. Instrument Metrology', icon: Scale },
    { id: 'lab', label: '2. Lab & Conditions', icon: Thermometer },
    { id: 'weighing', label: '3. Weighing Performance', icon: Layers },
    { id: 'auxiliary', label: '4. Repeatability & Creep', icon: Building },
    { id: 'attachments', label: '5. Photos & Docs', icon: Paperclip },
    { id: 'signatures', label: '6. Review & Approval', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <span>Type Evaluation Workbench</span>
            <span aria-hidden="true">·</span>
            <span>Report Ref: {report.reportNumber}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {report.instrument.modelName || 'New Instrument Evaluation'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Accuracy Class: <strong>Class {report.instrument.accuracyClass}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Capacity: <strong>{report.instrument.maxCapacity} {report.instrument.unit}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Status: <strong className="text-slate-800">{report.status}</strong></span>
            <span aria-hidden="true">·</span>
            <span>
              Overall: {report.overallCompliance === 'PASS' ? (
                <strong className="text-emerald-700">PASS (Compliant)</strong>
              ) : (
                <strong className="text-rose-700">FAIL (Non-Compliant)</strong>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onViewReport(report)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>Preview Report</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Observations</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All observations, metrological errors, and compliance results saved successfully.</span>
        </div>
      )}

      {/* Validation warning banner if any */}
      {!validation.isValid && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Metrological Input Validation Error:</span>
          </div>
          {validation.errors.map((err, i) => (
            <div key={i} className="pl-5">• {err}</div>
          ))}
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>OIML R-76 Table 3 Advisory Notice:</span>
          </div>
          {validation.warnings.map((w, i) => (
            <div key={i} className="pl-5">• {w}</div>
          ))}
        </div>
      )}

      {/* Workflow Navigation Steps */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {steps.map((st) => {
          const Icon = st.icon;
          const isActive = activeStep === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setActiveStep(st.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: Instrument & Manufacturer Details */}
      {activeStep === 'instrument' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              1. Instrument & Manufacturer Details
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Metrological parameters, capacity ratings, and manufacturer identification as per Legal Metrology rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Manufacturer Name *
              </label>
              <input
                type="text"
                value={report.instrument.manufacturerName}
                onChange={(e) => handleInstrumentChange('manufacturerName', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Manufacturer Address
              </label>
              <input
                type="text"
                value={report.instrument.manufacturerAddress}
                onChange={(e) => handleInstrumentChange('manufacturerAddress', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Model Name & Model Number *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Retail Counter Scale"
                  value={report.instrument.modelName}
                  onChange={(e) => handleInstrumentChange('modelName', e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Model #"
                  value={report.instrument.modelNumber}
                  onChange={(e) => handleInstrumentChange('modelNumber', e.target.value)}
                  className="w-28 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Serial Number *
              </label>
              <input
                type="text"
                value={report.instrument.serialNumber}
                onChange={(e) => handleInstrumentChange('serialNumber', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Instrument Type
              </label>
              <select
                value={report.instrument.instrumentType}
                onChange={(e) => handleInstrumentChange('instrumentType', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Retail Price-Computing Scale">Retail Price-Computing Scale</option>
                <option value="Electronic Tabletop Scale">Electronic Tabletop Scale</option>
                <option value="Analytical Precision Balance">Analytical Precision Balance</option>
                <option value="Industrial Platform Scale">Industrial Platform Scale</option>
                <option value="Weighbridge / Truck Scale">Weighbridge / Truck Scale</option>
                <option value="Crane / Hanging Scale">Crane / Hanging Scale</option>
                <option value="Micro-Balance">Micro-Balance</option>
                <option value="Other NAWI">Other NAWI</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Measurement Unit
              </label>
              <select
                value={report.instrument.unit}
                onChange={(e) => handleInstrumentChange('unit', e.target.value as UnitType)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="mg">Milligram (mg)</option>
                <option value="t">Tonne (t)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Accuracy Class (OIML R-76) *
              </label>
              <select
                value={report.instrument.accuracyClass}
                onChange={(e) => handleInstrumentChange('accuracyClass', e.target.value as AccuracyClass)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-blue-800"
              >
                <option value="I">Class I — Special Accuracy</option>
                <option value="II">Class II — High Accuracy</option>
                <option value="III">Class III — Medium Accuracy</option>
                <option value="IIII">Class IIII — Ordinary Accuracy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Maximum Capacity (Max) in {report.instrument.unit} *
              </label>
              <input
                type="number"
                step="any"
                value={report.instrument.maxCapacity}
                onChange={(e) => handleInstrumentChange('maxCapacity', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Minimum Capacity (Min) in {report.instrument.unit} *
              </label>
              <input
                type="number"
                step="any"
                value={report.instrument.minCapacity}
                onChange={(e) => handleInstrumentChange('minCapacity', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Verification Scale Interval (e) in {report.instrument.unit} *
              </label>
              <input
                type="number"
                step="any"
                value={report.instrument.verificationInterval_e}
                onChange={(e) => handleInstrumentChange('verificationInterval_e', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Actual Scale Interval (d) in {report.instrument.unit}
              </label>
              <input
                type="number"
                step="any"
                value={report.instrument.actualScaleInterval_d}
                onChange={(e) => handleInstrumentChange('actualScaleInterval_d', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Calculated Scale Intervals n */}
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500">Calculated Intervals n = Max/e</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {report.instrument.numberOfScaleIntervals_n.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {report.instrument.numberOfScaleIntervals_n >= 100 && report.instrument.numberOfScaleIntervals_n <= 10000
                  ? '✓ Standard Class III Range'
                  : `Class ${report.instrument.accuracyClass} resolution`}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tare Mechanism
              </label>
              <select
                value={report.instrument.tareType}
                onChange={(e) => handleInstrumentChange('tareType', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Subtractive">Subtractive Tare (T = -Max)</option>
                <option value="Additive">Additive Tare</option>
                <option value="Both">Both Subtractive & Additive</option>
                <option value="None">None</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Temperature Limits (°C)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={report.instrument.temperatureRangeMin}
                  onChange={(e) => handleInstrumentChange('temperatureRangeMin', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-center"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="number"
                  value={report.instrument.temperatureRangeMax}
                  onChange={(e) => handleInstrumentChange('temperatureRangeMax', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Power Supply / Operating Voltage
              </label>
              <input
                type="text"
                value={report.instrument.powerSupply}
                onChange={(e) => handleInstrumentChange('powerSupply', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveStep('lab')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
            >
              <span>Next: Lab Conditions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Laboratory & Environmental Conditions */}
      {activeStep === 'lab' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              2. Laboratory & Environmental Testing Conditions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accreditation data, temperature and humidity monitoring, and reference mass traceability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Designated Testing Laboratory *
              </label>
              <input
                type="text"
                value={report.laboratory.labName}
                onChange={(e) => handleLabChange('labName', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                NABL Accreditation No.
              </label>
              <input
                type="text"
                value={report.laboratory.nablAccreditationNo}
                onChange={(e) => handleLabChange('nablAccreditationNo', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                DoCA Registration Reference
              </label>
              <input
                type="text"
                value={report.laboratory.docaRegistrationNo}
                onChange={(e) => handleLabChange('docaRegistrationNo', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Test Location / Chamber
              </label>
              <input
                type="text"
                value={report.laboratory.testLocation}
                onChange={(e) => handleLabChange('testLocation', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Test Date & Time *
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={report.laboratory.testDate}
                  onChange={(e) => handleLabChange('testDate', e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="e.g. 10:00 - 16:30"
                  value={report.laboratory.testTime}
                  onChange={(e) => handleLabChange('testTime', e.target.value)}
                  className="w-32 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ambient Temperature Range (°C)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Start"
                  value={report.laboratory.ambientTempStart}
                  onChange={(e) => handleLabChange('ambientTempStart', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-center"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="End"
                  value={report.laboratory.ambientTempEnd}
                  onChange={(e) => handleLabChange('ambientTempEnd', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Relative Humidity (% RH)
              </label>
              <input
                type="number"
                step="0.1"
                value={report.laboratory.relativeHumidity}
                onChange={(e) => handleLabChange('relativeHumidity', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Atmospheric Pressure (kPa)
              </label>
              <input
                type="number"
                step="0.1"
                value={report.laboratory.atmosphericPressure}
                onChange={(e) => handleLabChange('atmosphericPressure', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reference Mass Standard Class (OIML R 111)
              </label>
              <select
                value={report.laboratory.referenceStandardClass}
                onChange={(e) => handleLabChange('referenceStandardClass', e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-blue-800"
              >
                <option value="E1">Class E1 (Primary Metrology Standard)</option>
                <option value="E2">Class E2 (High Precision Analytical)</option>
                <option value="F1">Class F1 (Precision Laboratory Weights)</option>
                <option value="F2">Class F2 (High Accuracy Commercial)</option>
                <option value="M1">Class M1 (Industrial & Platform Scales)</option>
                <option value="M2">Class M2 (Commercial Weighing)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reference Standard Calibration Cert No.
              </label>
              <input
                type="text"
                value={report.laboratory.referenceStandardCertNo}
                onChange={(e) => handleLabChange('referenceStandardCertNo', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reference Calibration Due Date
              </label>
              <input
                type="date"
                value={report.laboratory.referenceStandardCalDate}
                onChange={(e) => handleLabChange('referenceStandardCalDate', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveStep('instrument')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Instrument</span>
            </button>

            <button
              onClick={() => setActiveStep('weighing')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
            >
              <span>Next: Weighing Performance</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Weighing Performance (Clause A.4.4) */}
      {activeStep === 'weighing' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  3. Weighing Performance Test (Clause A.4.4)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter ascending and descending test loads. The engine calculates turning-point indication $P = I + 0.5d - \Delta L$, 
                  corrected error $E_c = E - E_0$, and compares with $\pm MPE$.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddWeighingRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Test Point</span>
                </button>
              </div>
            </div>

            {/* Weighing Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Load ({report.instrument.unit})</th>
                    <th className="py-2.5 px-3 bg-blue-50/50 text-blue-900">Ind. Asc (I)</th>
                    <th className="py-2.5 px-3 bg-blue-50/50 text-blue-900">ΔL (Asc)</th>
                    <th className="py-2.5 px-3 bg-blue-50/50 text-blue-900">Calc. Ec</th>
                    <th className="py-2.5 px-3 bg-indigo-50/50 text-indigo-900">Ind. Desc (I)</th>
                    <th className="py-2.5 px-3 bg-indigo-50/50 text-indigo-900">ΔL (Desc)</th>
                    <th className="py-2.5 px-3 bg-indigo-50/50 text-indigo-900">Calc. Ec</th>
                    <th className="py-2.5 px-3 text-slate-900">MPE (±)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {report.weighingData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Test Load Input */}
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="any"
                          value={row.testLoad}
                          onChange={(e) =>
                            handleWeighingCellChange(row.id, 'testLoad', parseFloat(e.target.value) || 0)
                          }
                          className="w-24 px-2 py-1 bg-slate-50 border border-slate-300 rounded-md font-semibold text-slate-900"
                        />
                      </td>

                      {/* Indication Ascending */}
                      <td className="py-2 px-3 bg-blue-50/30">
                        <input
                          type="number"
                          step="any"
                          value={row.indicationAscending}
                          onChange={(e) =>
                            handleWeighingCellChange(row.id, 'indicationAscending', parseFloat(e.target.value) || 0)
                          }
                          className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-md text-blue-950 font-medium"
                        />
                      </td>

                      {/* Delta L Ascending */}
                      <td className="py-2 px-3 bg-blue-50/30">
                        <input
                          type="number"
                          step="any"
                          value={row.deltaAscending}
                          onChange={(e) =>
                            handleWeighingCellChange(row.id, 'deltaAscending', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 px-1.5 py-1 bg-white border border-slate-200 rounded-md text-slate-600"
                        />
                      </td>

                      {/* Corrected Error Ascending */}
                      <td className="py-2 px-3 bg-blue-50/30">
                        <span
                          className={`font-semibold ${
                            row.passAscending ? 'text-emerald-700' : 'text-rose-700 font-bold'
                          }`}
                        >
                          {row.correctedErrorAscending >= 0 ? '+' : ''}
                          {row.correctedErrorAscending.toFixed(4)}
                        </span>
                      </td>

                      {/* Indication Descending */}
                      <td className="py-2 px-3 bg-indigo-50/30">
                        <input
                          type="number"
                          step="any"
                          value={row.indicationDescending}
                          onChange={(e) =>
                            handleWeighingCellChange(row.id, 'indicationDescending', parseFloat(e.target.value) || 0)
                          }
                          className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-md text-indigo-950 font-medium"
                        />
                      </td>

                      {/* Delta L Descending */}
                      <td className="py-2 px-3 bg-indigo-50/30">
                        <input
                          type="number"
                          step="any"
                          value={row.deltaDescending}
                          onChange={(e) =>
                            handleWeighingCellChange(row.id, 'deltaDescending', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 px-1.5 py-1 bg-white border border-slate-200 rounded-md text-slate-600"
                        />
                      </td>

                      {/* Corrected Error Descending */}
                      <td className="py-2 px-3 bg-indigo-50/30">
                        <span
                          className={`font-semibold ${
                            row.passDescending ? 'text-emerald-700' : 'text-rose-700 font-bold'
                          }`}
                        >
                          {row.correctedErrorDescending >= 0 ? '+' : ''}
                          {row.correctedErrorDescending.toFixed(4)}
                        </span>
                      </td>

                      {/* MPE (+/-) */}
                      <td className="py-2 px-3 text-slate-700 font-semibold">
                        ±{row.mpe.toFixed(4)}
                      </td>

                      {/* PASS / FAIL */}
                      <td className="py-2 px-3 text-center">
                        {row.passAscending && row.passDescending ? (
                          <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-sm">
                            PASS
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-sm">
                            FAIL
                          </span>
                        )}
                      </td>

                      {/* Delete */}
                      <td className="py-2 px-2 text-right">
                        <button
                          onClick={() => handleDeleteWeighingRow(row.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-sm cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setActiveStep('lab')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back: Lab Conditions</span>
              </button>

              <button
                onClick={() => setActiveStep('auxiliary')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
              >
                <span>Next: Repeatability & Creep</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Live Error Curve */}
          <ErrorCurveChart
            data={report.weighingData}
            maxCapacity={report.instrument.maxCapacity}
            verificationInterval_e={report.instrument.verificationInterval_e}
            accuracyClass={report.instrument.accuracyClass}
            unit={report.instrument.unit}
          />
        </div>
      )}

      {/* STEP 4: Auxiliary Tests (Repeatability, Eccentricity, Zero, Creep) */}
      {activeStep === 'auxiliary' && (
        <div className="space-y-6">
          {/* Repeatability Test */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                4. Repeatability Test (Clause A.4.10)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Maximum difference between observations for identical load must not exceed $|MPE|$ for that load.
              </p>
            </div>

            <div className="space-y-4">
              {report.repeatabilityData.map((run) => (
                <div key={run.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-xs text-slate-900">
                      Load Point: {run.loadPointName} ({run.testLoad} {report.instrument.unit})
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span>Max - Min Spread: <strong>{run.spread.toFixed(4)} {report.instrument.unit}</strong></span>
                      <span>MPE: <strong>±{run.mpe.toFixed(4)}</strong></span>
                      <span className={run.pass ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {run.pass ? '✓ PASS' : '✖ FAIL'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {run.readings.map((reading, idx) => (
                      <div key={idx}>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Run #{idx + 1}</label>
                        <input
                          type="number"
                          step="any"
                          value={reading}
                          onChange={(e) =>
                            handleRepeatabilityReadingChange(run.id, idx, parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-300 rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Eccentricity Test (Clause A.4.7) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                5. Eccentricity (Corner Loading) Test (Clause A.4.7)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Load of approximately $1/3\,Max$ applied at Center and 4 corners. Corrected errors must comply with initial verification MPE.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Position</th>
                    <th className="py-2.5 px-3">Applied Load</th>
                    <th className="py-2.5 px-3">Indication (I)</th>
                    <th className="py-2.5 px-3">Calc. P</th>
                    <th className="py-2.5 px-3">Corr. Error Ec</th>
                    <th className="py-2.5 px-3">MPE (±)</th>
                    <th className="py-2.5 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {report.eccentricityData.map((pt) => (
                    <tr key={pt.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-sans font-medium text-slate-800">
                        {pt.positionName}
                      </td>
                      <td className="py-2 px-3">{pt.testLoad} {report.instrument.unit}</td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="any"
                          value={pt.indication}
                          onChange={(e) =>
                            handleEccentricityChange(pt.id, 'indication', parseFloat(e.target.value) || 0)
                          }
                          className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-md font-medium"
                        />
                      </td>
                      <td className="py-2 px-3">{pt.calculatedP.toFixed(4)}</td>
                      <td className="py-2 px-3 font-semibold">
                        <span className={pt.pass ? 'text-emerald-700' : 'text-rose-700 font-bold'}>
                          {pt.correctedError >= 0 ? '+' : ''}{pt.correctedError.toFixed(4)}
                        </span>
                      </td>
                      <td className="py-2 px-3">±{pt.mpe.toFixed(4)}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={pt.pass ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                          {pt.pass ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Creep & Return to Zero Test (Clause A.4.11) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                6. Creep Test & Return to Zero (Clause A.4.11)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Load at Max maintained for 30 minutes. 30 min drift limit $\le 0.5e$; 15 to 30 min drift limit $\le 0.2e$.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">0 min reading</label>
                <input
                  type="number"
                  step="any"
                  value={report.creepData.reading0min}
                  onChange={(e) => handleCreepFieldChange('reading0min', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">5 min reading</label>
                <input
                  type="number"
                  step="any"
                  value={report.creepData.reading5min}
                  onChange={(e) => handleCreepFieldChange('reading5min', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">15 min reading</label>
                <input
                  type="number"
                  step="any"
                  value={report.creepData.reading15min}
                  onChange={(e) => handleCreepFieldChange('reading15min', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">30 min reading</label>
                <input
                  type="number"
                  step="any"
                  value={report.creepData.reading30min}
                  onChange={(e) => handleCreepFieldChange('reading30min', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">Return to Zero</label>
                <input
                  type="number"
                  step="any"
                  value={report.creepData.readingZeroReturn}
                  onChange={(e) => handleCreepFieldChange('readingZeroReturn', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-md"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div>
                30-min Creep: <strong>{report.creepData.creep30min.toFixed(4)}</strong> (Limit: {report.creepData.creep30minLimit.toFixed(4)})
              </div>
              <div>
                15-to-30 min Diff: <strong>{report.creepData.creepDiff15to30.toFixed(4)}</strong> (Limit: {report.creepData.creep15to30Limit.toFixed(4)})
              </div>
              <div>
                Zero Return Error: <strong>{report.creepData.zeroReturnError.toFixed(4)}</strong> (Limit: {report.creepData.zeroReturnLimit.toFixed(4)})
              </div>
              <div className={report.creepData.pass ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                {report.creepData.pass ? '✓ PASS' : '✖ FAIL'}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setActiveStep('weighing')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back: Weighing</span>
              </button>

              <button
                onClick={() => setActiveStep('attachments')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
              >
                <span>Next: Photos & Attachments</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Photos & Supporting Documents */}
      {activeStep === 'attachments' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                5. Photographic Evidence & Supporting Attachments
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Instrument front view, rating plate marking, test setup, and primary calibration certificates.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Upload Attachment</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const newAtt: ReportAttachment = {
                        id: `att-${Date.now()}`,
                        title: file.name.replace(/\.[^/.]+$/, ''),
                        category: 'Instrument Photo',
                        filename: file.name,
                        uploadedAt: new Date().toLocaleString(),
                        sizeBytes: file.size,
                      };
                      setReport((prev) => ({
                        ...prev,
                        attachments: [...prev.attachments, newAtt],
                      }));
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {report.attachments.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
              <Paperclip className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">No attachments uploaded yet</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Click &quot;Upload Attachment&quot; to attach instrument photographs or calibration certificates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.attachments.map((att) => (
                <div key={att.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm">
                        {att.category}
                      </span>
                      <button
                        onClick={() =>
                          setReport((prev) => ({
                            ...prev,
                            attachments: prev.attachments.filter((a) => a.id !== att.id),
                          }))
                        }
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="font-semibold text-xs text-slate-900 truncate">{att.title}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{att.filename}</div>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-400">
                    Uploaded: {att.uploadedAt}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveStep('auxiliary')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Auxiliary Tests</span>
            </button>

            <button
              onClick={() => setActiveStep('signatures')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer"
            >
              <span>Next: Review & Signatures</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Review & Signatures */}
      {activeStep === 'signatures' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              6. Evaluation Remarks, Review & Digital Signatures
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized sign-off workflow as per Department of Consumer Affairs Legal Metrology procedures.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                General Metrological Remarks & Technical Evaluation Findings
              </label>
              <textarea
                rows={3}
                value={report.generalRemarks}
                onChange={(e) => setReport((prev) => ({ ...prev, generalRemarks: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Approving Authority Order / Remarks
              </label>
              <textarea
                rows={2}
                value={report.approvalRemarks || ''}
                onChange={(e) => setReport((prev) => ({ ...prev, approvalRemarks: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Signatures List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {report.signatures.map((sig) => {
              const canSign =
                !sig.isSigned &&
                ((sig.role === 'Test Engineer' && (currentUser.role === 'engineer' || currentUser.role === 'admin')) ||
                  (sig.role === 'Reviewing Officer' && (currentUser.role === 'reviewer' || currentUser.role === 'admin')) ||
                  (sig.role === 'Approving Authority' && (currentUser.role === 'reviewer' || currentUser.role === 'admin')));

              return (
                <div
                  key={sig.id}
                  className={`p-4 rounded-xl border ${
                    sig.isSigned
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-slate-50 border-slate-200'
                  } flex flex-col justify-between space-y-3`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{sig.role}</span>
                      {sig.isSigned ? (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Signed
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-medium">Pending</span>
                      )}
                    </div>
                    <div className="font-semibold text-xs text-slate-900 mt-1">{sig.signerName}</div>
                    <div className="text-[11px] text-slate-500">{sig.signerDesignation}</div>
                    {sig.signedAt && (
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        Signed: {new Date(sig.signedAt).toLocaleString()}
                      </div>
                    )}
                    {sig.signatureHash && (
                      <div className="text-[9px] text-slate-400 font-mono break-all mt-1">
                        Hash: {sig.signatureHash.substring(0, 32)}...
                      </div>
                    )}
                  </div>

                  <div>
                    {canSign ? (
                      <button
                        onClick={() => handleSign(sig.role)}
                        className="w-full py-1.5 px-3 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        Sign as {currentUser.name.split(' ')[0]}
                      </button>
                    ) : (
                      <div className="text-[11px] text-slate-400 text-center py-1">
                        {sig.isSigned ? 'Digitally Verified' : 'Awaiting credentials'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveStep('attachments')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Attachments</span>
            </button>

            <button
              onClick={() => onViewReport(report)}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Preview & Print Official Certificate</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
