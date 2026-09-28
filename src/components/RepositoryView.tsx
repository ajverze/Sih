import React, { useState, useMemo } from 'react';
import { NAWITestReport, AccuracyClass, TestStatus, ComplianceResult } from '../types/oiml';
import { 
  Search, 
  Filter, 
  FileDown, 
  Printer, 
  Eye, 
  Scale, 
  Copy, 
  Trash2, 
  Plus, 
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { exportReportToWordDoc, exportReportToJson } from '../utils/exportUtils';

interface RepositoryViewProps {
  reports: NAWITestReport[];
  onSelectReport: (report: NAWITestReport) => void;
  onEditReport: (report: NAWITestReport) => void;
  onDuplicateReport: (report: NAWITestReport) => void;
  onDeleteReport: (reportId: string) => void;
  onImportReport: (report: NAWITestReport) => void;
  onNewTest: () => void;
}

export const RepositoryView: React.FC<RepositoryViewProps> = ({
  reports,
  onSelectReport,
  onEditReport,
  onDuplicateReport,
  onDeleteReport,
  onImportReport,
  onNewTest,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TestStatus>('ALL');
  const [classFilter, setClassFilter] = useState<'ALL' | AccuracyClass>('ALL');
  const [complianceFilter, setComplianceFilter] = useState<'ALL' | ComplianceResult>('ALL');

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.instrument.manufacturerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.instrument.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.instrument.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.laboratory.labName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || report.status === statusFilter;
      const matchesClass = classFilter === 'ALL' || report.instrument.accuracyClass === classFilter;
      const matchesCompliance = complianceFilter === 'ALL' || report.overallCompliance === complianceFilter;

      return matchesSearch && matchesStatus && matchesClass && matchesCompliance;
    });
  }, [reports, searchTerm, statusFilter, classFilter, complianceFilter]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.instrument && parsed.weighingData) {
          onImportReport(parsed);
        } else {
          alert('Invalid OIML report JSON format.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Digital Test Report Repository
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, retrieve, audit, and export non-automatic weighing instrument evaluation records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <button
            onClick={onNewTest}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Test</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Report ID, Manufacturer, Model, Serial No, or Lab..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Classes (I-IV)</option>
              <option value="I">Class I (Special)</option>
              <option value="II">Class II (High)</option>
              <option value="III">Class III (Medium)</option>
              <option value="IIII">Class IIII (Ordinary)</option>
            </select>

            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Results</option>
              <option value="PASS">PASS Only</option>
              <option value="FAIL">FAIL Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="TESTING">In Testing</option>
              <option value="DRAFT">Draft</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {(searchTerm || classFilter !== 'ALL' || complianceFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setClassFilter('ALL');
                  setComplianceFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-xs text-blue-700 hover:text-blue-800 font-semibold px-2 py-1 whitespace-nowrap cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Found {filteredReports.length} records in repository</span>
          <span className="font-mono text-[11px]">Storage: Local Encrypted Metrology Cache</span>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-700">No test reports found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Try adjusting your search criteria or create a new test evaluation report.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Report Number</th>
                  <th className="py-3 px-4">Instrument Details</th>
                  <th className="py-3 px-4">Capacity & Interval</th>
                  <th className="py-3 px-4">Test Date & Lab</th>
                  <th className="py-3 px-4">Compliance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      <div className="font-semibold text-blue-700">{report.reportNumber}</div>
                      {report.certificateNumber && (
                        <div className="text-[11px] text-slate-400">
                          Cert: {report.certificateNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{report.instrument.modelName}</div>
                      <div className="text-slate-600 text-[11px]">
                        {report.instrument.manufacturerName}
                      </div>
                      <div className="text-slate-400 font-mono text-[10px]">
                        SN: {report.instrument.serialNumber} · {report.instrument.instrumentType}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-slate-900 font-medium">
                        Max {report.instrument.maxCapacity} {report.instrument.unit}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        e = {report.instrument.verificationInterval_e} {report.instrument.unit} (Class {report.instrument.accuracyClass})
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        n = {report.instrument.numberOfScaleIntervals_n.toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{report.laboratory.testDate}</div>
                      <div className="text-slate-500 text-[11px] truncate max-w-[150px]">
                        {report.laboratory.labName}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {report.overallCompliance === 'PASS' ? (
                        <div className="flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASS</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-rose-700 font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>FAIL</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700 text-[11px]">
                        {report.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectReport(report)}
                          title="View Official Report"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditReport(report)}
                          title="Edit Observations"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Scale className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => exportReportToWordDoc(report)}
                          title="Export to Word (.doc)"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => exportReportToJson(report)}
                          title="Export JSON Data"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDuplicateReport(report)}
                          title="Duplicate Test"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete report ${report.reportNumber}?`)) {
                              onDeleteReport(report.id);
                            }
                          }}
                          title="Delete Report"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
