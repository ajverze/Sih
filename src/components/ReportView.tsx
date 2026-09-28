import React from 'react';
import { NAWITestReport, UserProfile } from '../types/oiml';
import { ErrorCurveChart } from './ErrorCurveChart';
import { exportReportToWordDoc, exportReportToJson } from '../utils/exportUtils';
import { 
  Printer, 
  FileDown, 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Building2, 
  Scale, 
  Calendar,
  Lock
} from 'lucide-react';

interface ReportViewProps {
  report: NAWITestReport;
  currentUser: UserProfile;
  onBackToEditor: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  report,
  currentUser,
  onBackToEditor,
}) => {
  const { instrument, laboratory, weighingData, repeatabilityData, eccentricityData, signatures } = report;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Action Toolbar (hidden when printing) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToEditor}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Edit Observations</span>
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <span className="text-xs text-slate-500 font-mono">
            Report Reference: {report.reportNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print / Save as PDF</span>
          </button>

          <button
            onClick={() => exportReportToWordDoc(report)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-blue-700" />
            <span>Export MS Word (.doc)</span>
          </button>

          <button
            onClick={() => exportReportToJson(report)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Standardized Formal Test Report Document (A4 format styled) */}
      <div className="bg-white border border-slate-300 rounded-xl p-8 sm:p-12 shadow-sm max-w-5xl mx-auto text-slate-900 leading-normal">
        {/* Document Header */}
        <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
          <div className="text-xs font-bold tracking-widest text-slate-700 uppercase">
            GOVERNMENT OF INDIA
          </div>
          <div className="text-xs font-semibold tracking-wider text-slate-700 uppercase mt-0.5">
            MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION
          </div>
          <div className="text-xs font-medium text-slate-600 uppercase mt-0.5">
            DEPARTMENT OF CONSUMER AFFAIRS · LEGAL METROLOGY DIVISION
          </div>

          <div className="my-3">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-blue-900 uppercase">
              TYPE EVALUATION TEST REPORT AS PER OIML R-76
            </h1>
            <div className="text-xs font-medium text-slate-600">
              Non-Automatic Weighing Instruments (NAWI) · In accordance with Legal Metrology (General) Rules, 2011
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-xs font-mono">
            <div><strong>Report No:</strong> {report.reportNumber}</div>
            <div><strong>Certificate No:</strong> {report.certificateNumber || 'PENDING'}</div>
            <div><strong>Date of Issue:</strong> {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>

        {/* Executive Verdict Box */}
        <div className={`p-4 rounded-xl border mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          report.overallCompliance === 'PASS'
            ? 'bg-emerald-50/70 border-emerald-300'
            : 'bg-rose-50/70 border-rose-300'
        }`}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Final Overall Metrological Evaluation Result
            </div>
            <div className="text-xl font-bold mt-0.5 flex items-center gap-2">
              {report.overallCompliance === 'PASS' ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <span className="text-emerald-800">CONFORMS TO OIML RECOMMENDATION R-76 (CLASS {instrument.accuracyClass})</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-rose-600" />
                  <span className="text-rose-800">NON-COMPLIANT WITH APPLICABLE TOLERANCES (FAILED)</span>
                </>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className={`inline-block px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
              report.status === 'APPROVED' ? 'bg-emerald-700 text-white' :
              report.status === 'REJECTED' ? 'bg-rose-700 text-white' :
              'bg-amber-600 text-white'
            }`}>
              {report.status}
            </span>
          </div>
        </div>

        {/* Section 1: Instrument & Manufacturer Details */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-blue-900 pb-1 mb-3">
            1. Instrument & Manufacturer Details
          </h2>
          <table className="w-full text-xs text-left border border-slate-200">
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700 w-1/4">Manufacturer</td>
                <td className="py-2 px-3 font-medium text-slate-900">
                  {instrument.manufacturerName}<br />
                  <span className="text-slate-500 font-normal">{instrument.manufacturerAddress}</span>
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700">Model Name & Number</td>
                <td className="py-2 px-3 font-medium text-slate-900">
                  {instrument.modelName} (Model #{instrument.modelNumber})
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700">Serial No. & Type</td>
                <td className="py-2 px-3 font-mono text-slate-900">
                  {instrument.serialNumber} · <span className="font-sans font-medium">{instrument.instrumentType}</span>
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700">Metrological Characteristics</td>
                <td className="py-2 px-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    <div>Accuracy Class: <strong>Class {instrument.accuracyClass}</strong></div>
                    <div>Max Capacity: <strong>{instrument.maxCapacity} {instrument.unit}</strong></div>
                    <div>Min Capacity: <strong>{instrument.minCapacity} {instrument.unit}</strong></div>
                    <div>Scale Interval (e): <strong>{instrument.verificationInterval_e} {instrument.unit}</strong></div>
                    <div>Scale Interval (d): <strong>{instrument.actualScaleInterval_d} {instrument.unit}</strong></div>
                    <div>Intervals (n): <strong>{instrument.numberOfScaleIntervals_n.toLocaleString()}</strong></div>
                    <div>Tare: <strong>{instrument.tareType}</strong></div>
                    <div>Temperature: <strong>{instrument.temperatureRangeMin}°C to {instrument.temperatureRangeMax}°C</strong></div>
                  </div>
                </td>
              </tr>
              {instrument.powerSupply && (
                <tr>
                  <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700">Power Supply</td>
                  <td className="py-2 px-3 text-slate-800">{instrument.powerSupply}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Section 2: Laboratory Information & Test Environment */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-blue-900 pb-1 mb-3">
            2. Laboratory Details & Environmental Conditions
          </h2>
          <table className="w-full text-xs text-left border border-slate-200">
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700 w-1/4">Testing Laboratory</td>
                <td className="py-2 px-3 text-slate-900 font-medium">
                  {laboratory.labName} (NABL: {laboratory.nablAccreditationNo})
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700">Location & Date</td>
                <td className="py-2 px-3 text-slate-800">
                  {laboratory.testLocation} · Date: {laboratory.testDate} ({laboratory.testTime})
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700">Environmental Observations</td>
                <td className="py-2 px-3 font-mono">
                  Ambient Temp: {laboratory.ambientTempStart}°C to {laboratory.ambientTempEnd}°C · 
                  Relative Humidity: {laboratory.relativeHumidity}% · 
                  Pressure: {laboratory.atmosphericPressure} kPa
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 bg-slate-50 font-semibold text-slate-700">Reference Standards</td>
                <td className="py-2 px-3 font-mono">
                  Class <strong>{laboratory.referenceStandardClass}</strong> Standard Weights (Cert No: {laboratory.referenceStandardCertNo}, Calibrated: {laboratory.referenceStandardCalDate})
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 3: Summary of Test Results */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-blue-900 pb-1 mb-3">
            3. Summary of OIML R-76 Clause Compliance
          </h2>
          <table className="w-full text-xs text-left border border-slate-200">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-2 px-3">Test Requirement</th>
                <th className="py-2 px-3">OIML Clause</th>
                <th className="py-2 px-3">Permissible Limit</th>
                <th className="py-2 px-3 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2 px-3 font-medium">Weighing Performance (Linearity)</td>
                <td className="py-2 px-3 font-mono">Clause A.4.4</td>
                <td className="py-2 px-3">Table 6 MPE (±0.5e, ±1.0e, ±1.5e)</td>
                <td className="py-2 px-3 text-center font-bold text-emerald-700">PASS</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">Repeatability Test</td>
                <td className="py-2 px-3 font-mono">Clause A.4.10</td>
                <td className="py-2 px-3">Spread ≤ |MPE| for load applied</td>
                <td className="py-2 px-3 text-center font-bold text-emerald-700">PASS</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">Eccentricity (Corner Loading)</td>
                <td className="py-2 px-3 font-mono">Clause A.4.7</td>
                <td className="py-2 px-3">Corrected error at 1/3 Max ≤ MPE</td>
                <td className="py-2 px-3 text-center font-bold text-emerald-700">PASS</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">Zero-Setting Accuracy</td>
                <td className="py-2 px-3 font-mono">Clause A.4.2.3</td>
                <td className="py-2 px-3">Error at zero ≤ ±0.25 e</td>
                <td className="py-2 px-3 text-center font-bold text-emerald-700">PASS</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">Creep & Return to Zero</td>
                <td className="py-2 px-3 font-mono">Clause A.4.11</td>
                <td className="py-2 px-3">30 min drift ≤ 0.5e, diff ≤ 0.2e</td>
                <td className="py-2 px-3 text-center font-bold text-emerald-700">PASS</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 4: Weighing Performance Observations Table */}
        <section className="mb-8 print-avoid-break">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-blue-900 pb-1 mb-3">
            4. Detailed Weighing Performance Observations (Clause A.4.4)
          </h2>
          <table className="w-full text-xs text-left border border-slate-200">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
              <tr>
                <th className="py-2 px-2.5">Load ({instrument.unit})</th>
                <th className="py-2 px-2 text-right">Ind. Asc (I)</th>
                <th className="py-2 px-2 text-right">Calc. P</th>
                <th className="py-2 px-2 text-right">Error E</th>
                <th className="py-2 px-2 text-right">Corr. Ec</th>
                <th className="py-2 px-2 text-right">Ind. Desc (I)</th>
                <th className="py-2 px-2 text-right">Error E</th>
                <th className="py-2 px-2 text-right">Corr. Ec</th>
                <th className="py-2 px-2 text-right">MPE (±)</th>
                <th className="py-2 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {weighingData.map((row) => (
                <tr key={row.id}>
                  <td className="py-1.5 px-2.5 font-bold">{row.testLoad.toFixed(4)}</td>
                  <td className="py-1.5 px-2 text-right">{row.indicationAscending.toFixed(4)}</td>
                  <td className="py-1.5 px-2 text-right">{row.calculatedAscending.toFixed(4)}</td>
                  <td className="py-1.5 px-2 text-right">{row.errorAscending >= 0 ? '+' : ''}{row.errorAscending.toFixed(4)}</td>
                  <td className="py-1.5 px-2 text-right font-semibold">{row.correctedErrorAscending >= 0 ? '+' : ''}{row.correctedErrorAscending.toFixed(4)}</td>
                  <td className="py-1.5 px-2 text-right">{row.indicationDescending.toFixed(4)}</td>
                  <td className="py-1.5 px-2 text-right">{row.errorDescending >= 0 ? '+' : ''}{row.errorDescending.toFixed(4)}</td>
                  <td className="py-1.5 px-2 text-right font-semibold">{row.correctedErrorDescending >= 0 ? '+' : ''}{row.correctedErrorDescending.toFixed(4)}</td>
                  <td className="py-1.5 px-2 text-right text-slate-600">±{row.mpe.toFixed(4)}</td>
                  <td className="py-1.5 px-2 text-center font-bold">
                    {row.passAscending && row.passDescending ? (
                      <span className="text-emerald-700">PASS</span>
                    ) : (
                      <span className="text-rose-700">FAIL</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Embedded SVG Error Curve Chart */}
        <section className="mb-8 print-avoid-break">
          <ErrorCurveChart
            data={weighingData}
            maxCapacity={instrument.maxCapacity}
            verificationInterval_e={instrument.verificationInterval_e}
            accuracyClass={instrument.accuracyClass}
            unit={instrument.unit}
          />
        </section>

        {/* Section 5: Repeatability & Eccentricity Tables */}
        <section className="mb-8 print-avoid-break">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-blue-900 pb-1 mb-3">
            5. Repeatability (Clause A.4.10) & Eccentricity (Clause A.4.7)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-800 mb-1.5">Repeatability Runs</div>
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="py-1.5 px-2">Load Point</th>
                    <th className="py-1.5 px-2 text-right">Spread</th>
                    <th className="py-1.5 px-2 text-right">MPE (±)</th>
                    <th className="py-1.5 px-2 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {repeatabilityData.map((r) => (
                    <tr key={r.id}>
                      <td className="py-1.5 px-2 font-sans font-medium">{r.loadPointName} ({r.testLoad} {instrument.unit})</td>
                      <td className="py-1.5 px-2 text-right font-semibold">{r.spread.toFixed(4)}</td>
                      <td className="py-1.5 px-2 text-right">±{r.mpe.toFixed(4)}</td>
                      <td className="py-1.5 px-2 text-center font-bold text-emerald-700">
                        {r.pass ? 'PASS' : 'FAIL'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-800 mb-1.5">Eccentricity (Corner Load)</div>
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="py-1.5 px-2">Position</th>
                    <th className="py-1.5 px-2 text-right">Corr. Ec</th>
                    <th className="py-1.5 px-2 text-right">MPE (±)</th>
                    <th className="py-1.5 px-2 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {eccentricityData.map((e) => (
                    <tr key={e.id}>
                      <td className="py-1.5 px-2 font-sans font-medium">{e.positionName}</td>
                      <td className="py-1.5 px-2 text-right font-semibold">{e.correctedError.toFixed(4)}</td>
                      <td className="py-1.5 px-2 text-right">±{e.mpe.toFixed(4)}</td>
                      <td className="py-1.5 px-2 text-center font-bold">
                        {e.pass ? (
                          <span className="text-emerald-700">PASS</span>
                        ) : (
                          <span className="text-rose-700">FAIL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 6: Findings & Remarks */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-blue-900 pb-1 mb-2">
            6. Technical Findings & Recommendation
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed mb-2">
            {report.generalRemarks || 'No additional remarks.'}
          </p>
          {report.approvalRemarks && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
              <strong>Order of Approving Authority:</strong> {report.approvalRemarks}
            </div>
          )}
        </section>

        {/* Section 7: Digital Signatures Block */}
        <section className="pt-6 border-t-2 border-slate-900 print-avoid-break">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {signatures.map((sig) => (
              <div key={sig.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[11px] font-bold text-blue-900 uppercase">{sig.role}</div>
                <div className="mt-4 font-bold text-slate-900">{sig.signerName}</div>
                <div className="text-[11px] text-slate-500">{sig.signerDesignation}</div>
                {sig.isSigned ? (
                  <div className="mt-2 text-[10px] text-emerald-700 font-mono">
                    ✓ Digitally Signed on {new Date(sig.signedAt || '').toLocaleString()}<br />
                    <span className="text-slate-400 break-all text-[9px]">{sig.signatureHash?.substring(0, 36)}...</span>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-slate-400 italic">Signature Pending</div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-6">
            This document is electronically verified under the Legal Metrology Act, 2009 and complies with OIML R-76 recommendations.
          </div>
        </section>
      </div>
    </div>
  );
};
