import React from 'react';
import { NAWITestReport, AccuracyClass, TestStatus } from '../types/oiml';
import { 
  FileCheck2, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Scale, 
  ArrowRight, 
  PlusCircle, 
  Eye, 
  Printer, 
  FileDown 
} from 'lucide-react';
import { exportReportToWordDoc } from '../utils/exportUtils';

interface DashboardViewProps {
  reports: NAWITestReport[];
  onSelectReport: (report: NAWITestReport) => void;
  onEditReport: (report: NAWITestReport) => void;
  onNewTest: () => void;
  onLoadTemplate: (accuracyClass: AccuracyClass) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  reports,
  onSelectReport,
  onEditReport,
  onNewTest,
  onLoadTemplate,
}) => {
  const totalTests = reports.length;
  const approvedTests = reports.filter((r) => r.status === 'APPROVED').length;
  const inProgress = reports.filter((r) => r.status === 'DRAFT' || r.status === 'TESTING').length;
  const pendingReview = reports.filter((r) => r.status === 'PENDING_REVIEW').length;
  const failedTests = reports.filter((r) => r.overallCompliance === 'FAIL').length;
  const passedTests = reports.filter((r) => r.overallCompliance === 'PASS').length;

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'APPROVED':
        return <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'REJECTED':
        return <span className="text-rose-700 font-semibold text-xs flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'PENDING_REVIEW':
        return <span className="text-amber-700 font-semibold text-xs flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Under Review</span>;
      case 'TESTING':
        return <span className="text-blue-700 font-semibold text-xs flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> In Testing</span>;
      default:
        return <span className="text-slate-600 font-semibold text-xs flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Draft</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner / Executive Greeting */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
            <span>Legal Metrology Automated Evaluation System</span>
            <span aria-hidden="true">·</span>
            <span>OIML R-76 & Rules 2011</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Non-Automatic Weighing Instruments (NAWI) Type Testing & Certification
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-3xl">
            Automates test data recording, maximum permissible error (MPE) calculations, turning-point evaluation, 
            and standardized report generation for type evaluation under the Legal Metrology Act, 2009.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onNewTest}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Type Evaluation</span>
            </button>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 text-xs font-medium text-slate-500">
              <span className="hidden sm:inline">Quick Templates:</span>
              <button
                onClick={() => onLoadTemplate('III')}
                className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                Class III Retail Scale
              </button>
              <button
                onClick={() => onLoadTemplate('II')}
                className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                Class II Precision
              </button>
              <button
                onClick={() => onLoadTemplate('I')}
                className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                Class I Micro-Balance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Evaluations</div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalTests}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Digital records stored</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Passed Criteria</div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            {passedTests}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600">Within MPE tolerances</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Non-Compliant (Fail)</div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600 tabular-nums">
            {failedTests}
          </div>
          <div className="mt-1 text-[11px] text-rose-600">Action / rework required</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Under Review</div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600 tabular-nums">
            {pendingReview}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Awaiting officer sign-off</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Testing In-Progress</div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-600 tabular-nums">
            {inProgress}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Active bench observations</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Certificates Issued</div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-600 tabular-nums">
            {approvedTests}
          </div>
          <div className="mt-1 text-[11px] text-indigo-600">DoCA stamped approval</div>
        </div>
      </div>

      {/* Main Content Split: Recent Evaluations & OIML R-76 Testing Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Evaluations Table (2 spans) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Recent Laboratory Evaluations
            </h2>
            <div className="text-xs text-slate-500">
              Showing {reports.length} instruments
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Instrument / Model</th>
                    <th className="py-3 px-4">Manufacturer</th>
                    <th className="py-3 px-4">Class & Cap</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {report.instrument.modelName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          SN: {report.instrument.serialNumber} · Ref: {report.reportNumber.split('/').pop()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium truncate max-w-[160px]">
                          {report.instrument.manufacturerName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {report.laboratory.testDate}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-900 font-medium">
                          Class {report.instrument.accuracyClass}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {report.instrument.maxCapacity} {report.instrument.unit} (e={report.instrument.verificationInterval_e})
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        {report.overallCompliance === 'PASS' ? (
                          <span className="text-emerald-700 font-bold">PASS</span>
                        ) : (
                          <span className="text-rose-700 font-bold">FAIL</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectReport(report)}
                            title="View Standardized Report"
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditReport(report)}
                            title="Edit Test Data"
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Scale className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => exportReportToWordDoc(report)}
                            title="Download MS Word Report (.doc)"
                            className="p-1.5 text-slate-600 hover:text-indigo-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Metrological Reference Card & OIML Modules */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-blue-700" />
              <span>OIML R-76-1 Testing Modules</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-900">Clause A.4.4: Weighing Linearity</div>
                <div className="text-slate-500 mt-0.5">
                  Increasing & decreasing load steps. Turning point equation $P = I + 0.5d - \Delta L$ with corrected error $E_c = E - E_0$.
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-900">Clause A.4.10: Repeatability</div>
                <div className="text-slate-500 mt-0.5">
                  Spread between max and min measurements for identical load must not exceed $|MPE|$ for that load.
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-900">Clause A.4.7: Eccentricity (Corner Load)</div>
                <div className="text-slate-500 mt-0.5">
                  Load applied at $1/3\,Max$ on 4 quarter positions; errors must comply with initial verification MPE.
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-900">Clause A.4.11 & A.5: Creep & Temperature</div>
                <div className="text-slate-500 mt-0.5">
                  30-minute creep drift $\le 0.5e$, 15-to-30 min drift $\le 0.2e$, span drift from $-10^\circ C$ to $40^\circ C$.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
              Legal Metrology Compliance Note
            </h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              As per Section 22 of the Legal Metrology Act, 2009 and Rule 24 of the Legal Metrology (General) Rules, 2011, 
              every model of weight or measure is tested and approved by an authorized Government laboratory (RRSL / NPL) 
              before manufacturing or import.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
