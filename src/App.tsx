import React, { useState, useEffect } from 'react';
import { NAWITestReport, UserProfile, AccuracyClass } from './types/oiml';
import { CURRENT_USER, INITIAL_REPORTS } from './utils/sampleData';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { RepositoryView } from './components/RepositoryView';
import { TestEditor } from './components/TestEditor/TestEditor';
import { ReportView } from './components/ReportView';
import { OimlRulesConfigurator } from './components/OimlRulesConfigurator';
import { calculateMPE_in_units } from './utils/oimlEngine';

const STORAGE_KEY_REPORTS = 'doca_nawi_reports_v1';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'repository' | 'editor' | 'report' | 'rules'>('dashboard');

  // User & Roles
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);

  // Reports Repository State
  const [reports, setReports] = useState<NAWITestReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REPORTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load reports from storage', e);
    }
    return INITIAL_REPORTS;
  });

  // Active Report being edited or viewed
  const [activeReportId, setActiveReportId] = useState<string>(reports[0]?.id || '');

  // Save reports to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
    } catch (e) {
      console.error('Failed to save reports', e);
    }
  }, [reports]);

  const activeReport = reports.find((r) => r.id === activeReportId) || reports[0];

  // Handler: Create brand new test report
  const handleCreateNewTest = (accuracyClass: AccuracyClass = 'III') => {
    const reportSeq = Math.floor(1000 + Math.random() * 9000);
    const newId = `REP-DOCA-2026-${reportSeq}`;
    const reportNumber = `DOCA/RRSL/BLR/2026/${reportSeq}`;

    const unit = accuracyClass === 'I' ? 'g' : accuracyClass === 'II' ? 'g' : 'kg';
    const maxCapacity = accuracyClass === 'I' ? 220 : accuracyClass === 'II' ? 500 : 30;
    const e = accuracyClass === 'I' ? 0.001 : accuracyClass === 'II' ? 0.01 : 0.005;
    const d = e;
    const minCapacity = accuracyClass === 'I' ? 100 * e : 20 * e;

    const newReport: NAWITestReport = {
      id: newId,
      reportNumber,
      certificateNumber: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'DRAFT',
      instrument: {
        manufacturerName: 'Bharat Metrology Systems Pvt. Ltd.',
        manufacturerAddress: 'Industrial Suburb, Yeshwanthpur, Bengaluru, Karnataka 560022',
        modelName: accuracyClass === 'I' ? 'Micro-Analytical Laboratory Balance' : accuracyClass === 'II' ? 'High Precision Industrial Scale' : 'Commercial Electronic Counter Scale',
        modelNumber: `BMS-${accuracyClass}-${Math.floor(Math.random() * 900 + 100)}`,
        serialNumber: `SN-2026-${Math.floor(Math.random() * 89999 + 10000)}`,
        instrumentType: accuracyClass === 'I' ? 'Analytical Precision Balance' : accuracyClass === 'II' ? 'Analytical Precision Balance' : 'Retail Price-Computing Scale',
        unit,
        maxCapacity,
        minCapacity,
        verificationInterval_e: e,
        actualScaleInterval_d: d,
        accuracyClass,
        numberOfScaleIntervals_n: Math.round(maxCapacity / e),
        tareCapacity: maxCapacity / 2,
        tareType: 'Subtractive',
        temperatureRangeMin: -10,
        temperatureRangeMax: 40,
        powerSupply: '230 V AC, 50 Hz & 6 V Internal Battery',
        indicatorModel: 'Digital High-Contrast Dual VFD Display',
        loadCellModel: 'High Precision Electromagnetic Force Restoration / Strain Gauge',
        softwareVersion: 'v3.1.2-OIML',
        remarks: 'Sample submitted for Type Approval under Legal Metrology Act, 2009.',
      },
      laboratory: {
        labName: currentUser.labName,
        nablAccreditationNo: 'TC-5124 (ISO/IEC 17025:2017)',
        docaRegistrationNo: 'DOCA/LM/LAB/04',
        testLocation: 'Type Approval Division, Room 102',
        testDate: new Date().toISOString().split('T')[0],
        testTime: '10:00 AM - 04:30 PM',
        ambientTempStart: 21.5,
        ambientTempEnd: 22.0,
        relativeHumidity: 50.5,
        atmosphericPressure: 99.2,
        referenceStandardClass: accuracyClass === 'I' ? 'E2' : accuracyClass === 'II' ? 'F1' : 'F2',
        referenceStandardCertNo: 'NPL/MS/2026/8941',
        referenceStandardCalDate: '2026-03-01',
        testEquipmentUsed: 'Standard Weights Set (OIML R 111) & Environmental Test Chamber',
        testedByEngineer: currentUser.name,
        reviewedByOfficer: 'Dr. Anita Deshmukh',
      },
      selectedTests: {
        weighingPerformance: true,
        repeatability: true,
        eccentricity: true,
        tare: true,
        zeroSetting: true,
        temperatureEffect: false,
        creep: true,
      },
      weighingData: [
        {
          id: 'w-1',
          testLoad: 0.0,
          indicationAscending: 0.0,
          deltaAscending: 0.0,
          calculatedAscending: 0.0,
          errorAscending: 0.0,
          correctedErrorAscending: 0.0,
          indicationDescending: 0.0,
          deltaDescending: 0.0,
          calculatedDescending: 0.0,
          errorDescending: 0.0,
          correctedErrorDescending: 0.0,
          mpe: calculateMPE_in_units(0, e, accuracyClass),
          passAscending: true,
          passDescending: true,
        },
        {
          id: 'w-2',
          testLoad: minCapacity,
          indicationAscending: minCapacity,
          deltaAscending: 0.0,
          calculatedAscending: minCapacity,
          errorAscending: 0.0,
          correctedErrorAscending: 0.0,
          indicationDescending: minCapacity,
          deltaDescending: 0.0,
          calculatedDescending: minCapacity,
          errorDescending: 0.0,
          correctedErrorDescending: 0.0,
          mpe: calculateMPE_in_units(minCapacity, e, accuracyClass),
          passAscending: true,
          passDescending: true,
        },
        {
          id: 'w-3',
          testLoad: Number((maxCapacity * 0.25).toFixed(4)),
          indicationAscending: Number((maxCapacity * 0.25).toFixed(4)),
          deltaAscending: 0.0,
          calculatedAscending: Number((maxCapacity * 0.25).toFixed(4)),
          errorAscending: 0.0,
          correctedErrorAscending: 0.0,
          indicationDescending: Number((maxCapacity * 0.25).toFixed(4)),
          deltaDescending: 0.0,
          calculatedDescending: Number((maxCapacity * 0.25).toFixed(4)),
          errorDescending: 0.0,
          correctedErrorDescending: 0.0,
          mpe: calculateMPE_in_units(maxCapacity * 0.25, e, accuracyClass),
          passAscending: true,
          passDescending: true,
        },
        {
          id: 'w-4',
          testLoad: Number((maxCapacity * 0.5).toFixed(4)),
          indicationAscending: Number((maxCapacity * 0.5).toFixed(4)),
          deltaAscending: 0.0,
          calculatedAscending: Number((maxCapacity * 0.5).toFixed(4)),
          errorAscending: 0.0,
          correctedErrorAscending: 0.0,
          indicationDescending: Number((maxCapacity * 0.5).toFixed(4)),
          deltaDescending: 0.0,
          calculatedDescending: Number((maxCapacity * 0.5).toFixed(4)),
          errorDescending: 0.0,
          correctedErrorDescending: 0.0,
          mpe: calculateMPE_in_units(maxCapacity * 0.5, e, accuracyClass),
          passAscending: true,
          passDescending: true,
        },
        {
          id: 'w-5',
          testLoad: maxCapacity,
          indicationAscending: maxCapacity,
          deltaAscending: 0.0,
          calculatedAscending: maxCapacity,
          errorAscending: 0.0,
          correctedErrorAscending: 0.0,
          indicationDescending: maxCapacity,
          deltaDescending: 0.0,
          calculatedDescending: maxCapacity,
          errorDescending: 0.0,
          correctedErrorDescending: 0.0,
          mpe: calculateMPE_in_units(maxCapacity, e, accuracyClass),
          passAscending: true,
          passDescending: true,
        },
      ],
      repeatabilityData: [
        {
          id: 'r-1',
          loadPointName: '0.5 Max',
          testLoad: Number((maxCapacity * 0.5).toFixed(4)),
          readings: [
            Number((maxCapacity * 0.5).toFixed(4)),
            Number((maxCapacity * 0.5).toFixed(4)),
            Number((maxCapacity * 0.5).toFixed(4)),
          ],
          minReading: Number((maxCapacity * 0.5).toFixed(4)),
          maxReading: Number((maxCapacity * 0.5).toFixed(4)),
          spread: 0,
          mpe: calculateMPE_in_units(maxCapacity * 0.5, e, accuracyClass),
          pass: true,
        },
        {
          id: 'r-2',
          loadPointName: 'Max',
          testLoad: maxCapacity,
          readings: [maxCapacity, maxCapacity, maxCapacity],
          minReading: maxCapacity,
          maxReading: maxCapacity,
          spread: 0,
          mpe: calculateMPE_in_units(maxCapacity, e, accuracyClass),
          pass: true,
        },
      ],
      eccentricityData: [
        {
          id: 'e-1',
          positionName: 'Center',
          testLoad: Number((maxCapacity / 3).toFixed(4)),
          indication: Number((maxCapacity / 3).toFixed(4)),
          deltaL: 0,
          calculatedP: Number((maxCapacity / 3).toFixed(4)),
          error: 0,
          correctedError: 0,
          mpe: calculateMPE_in_units(maxCapacity / 3, e, accuracyClass),
          pass: true,
        },
        {
          id: 'e-2',
          positionName: 'Position 1 (Front Left)',
          testLoad: Number((maxCapacity / 3).toFixed(4)),
          indication: Number((maxCapacity / 3).toFixed(4)),
          deltaL: 0,
          calculatedP: Number((maxCapacity / 3).toFixed(4)),
          error: 0,
          correctedError: 0,
          mpe: calculateMPE_in_units(maxCapacity / 3, e, accuracyClass),
          pass: true,
        },
        {
          id: 'e-3',
          positionName: 'Position 2 (Back Left)',
          testLoad: Number((maxCapacity / 3).toFixed(4)),
          indication: Number((maxCapacity / 3).toFixed(4)),
          deltaL: 0,
          calculatedP: Number((maxCapacity / 3).toFixed(4)),
          error: 0,
          correctedError: 0,
          mpe: calculateMPE_in_units(maxCapacity / 3, e, accuracyClass),
          pass: true,
        },
        {
          id: 'e-4',
          positionName: 'Position 3 (Back Right)',
          testLoad: Number((maxCapacity / 3).toFixed(4)),
          indication: Number((maxCapacity / 3).toFixed(4)),
          deltaL: 0,
          calculatedP: Number((maxCapacity / 3).toFixed(4)),
          error: 0,
          correctedError: 0,
          mpe: calculateMPE_in_units(maxCapacity / 3, e, accuracyClass),
          pass: true,
        },
        {
          id: 'e-5',
          positionName: 'Position 4 (Front Right)',
          testLoad: Number((maxCapacity / 3).toFixed(4)),
          indication: Number((maxCapacity / 3).toFixed(4)),
          deltaL: 0,
          calculatedP: Number((maxCapacity / 3).toFixed(4)),
          error: 0,
          correctedError: 0,
          mpe: calculateMPE_in_units(maxCapacity / 3, e, accuracyClass),
          pass: true,
        },
      ],
      tareData: [],
      zeroData: {
        zeroSettingMode: 'Semi-Automatic',
        testLoadNearZero: 0,
        indication: 0,
        deltaL: 0,
        calculatedError: 0,
        maxPermissibleZeroError: 0.25 * e,
        pass: true,
      },
      temperatureData: [],
      creepData: {
        testLoad: maxCapacity,
        reading0min: maxCapacity,
        reading5min: maxCapacity,
        reading15min: maxCapacity,
        reading30min: maxCapacity,
        readingZeroReturn: 0,
        creep30min: 0,
        creepDiff15to30: 0,
        zeroReturnError: 0,
        creep30minLimit: 0.5 * e,
        creep15to30Limit: 0.2 * e,
        zeroReturnLimit: 0.5 * e,
        pass: true,
      },
      attachments: [],
      signatures: [
        {
          id: 'sig-1',
          role: 'Test Engineer',
          signerName: currentUser.name,
          signerDesignation: currentUser.designation,
          isSigned: false,
        },
        {
          id: 'sig-2',
          role: 'Reviewing Officer',
          signerName: 'Shri Vikram Malhotra',
          signerDesignation: 'Assistant Director (Legal Metrology)',
          isSigned: false,
        },
        {
          id: 'sig-3',
          role: 'Approving Authority',
          signerName: 'Dr. Anita Deshmukh',
          signerDesignation: 'Joint Secretary & Director of Legal Metrology, DoCA',
          isSigned: false,
        },
      ],
      overallCompliance: 'PASS',
      generalRemarks: 'Initial test setup created. Observations recorded in laboratory.',
    };

    setReports((prev) => [newReport, ...prev]);
    setActiveReportId(newId);
    setActiveTab('editor');
  };

  const handleSaveReport = (updatedReport: NAWITestReport) => {
    setReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
    );
  };

  const handleDuplicateReport = (reportToClone: NAWITestReport) => {
    const cloneSeq = Math.floor(1000 + Math.random() * 9000);
    const cloned: NAWITestReport = {
      ...reportToClone,
      id: `REP-DOCA-2026-${cloneSeq}`,
      reportNumber: `DOCA/RRSL/BLR/2026/${cloneSeq}`,
      certificateNumber: '',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      signatures: reportToClone.signatures.map((s) => ({
        ...s,
        isSigned: false,
        signedAt: undefined,
        signatureHash: undefined,
      })),
    };
    setReports((prev) => [cloned, ...prev]);
    setActiveReportId(cloned.id);
    setActiveTab('editor');
  };

  const handleDeleteReport = (idToDelete: string) => {
    setReports((prev) => {
      const remaining = prev.filter((r) => r.id !== idToDelete);
      if (activeReportId === idToDelete && remaining.length > 0) {
        setActiveReportId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleImportReport = (imported: NAWITestReport) => {
    setReports((prev) => [imported, ...prev]);
    setActiveReportId(imported.id);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col">
      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onNewTest={() => handleCreateNewTest('III')}
        hasActiveReport={!!activeReport}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            reports={reports}
            onSelectReport={(r) => {
              setActiveReportId(r.id);
              setActiveTab('report');
            }}
            onEditReport={(r) => {
              setActiveReportId(r.id);
              setActiveTab('editor');
            }}
            onNewTest={() => handleCreateNewTest('III')}
            onLoadTemplate={(cls) => handleCreateNewTest(cls)}
          />
        )}

        {activeTab === 'repository' && (
          <RepositoryView
            reports={reports}
            onSelectReport={(r) => {
              setActiveReportId(r.id);
              setActiveTab('report');
            }}
            onEditReport={(r) => {
              setActiveReportId(r.id);
              setActiveTab('editor');
            }}
            onDuplicateReport={handleDuplicateReport}
            onDeleteReport={handleDeleteReport}
            onImportReport={handleImportReport}
            onNewTest={() => handleCreateNewTest('III')}
          />
        )}

        {activeTab === 'editor' && activeReport && (
          <TestEditor
            report={activeReport}
            currentUser={currentUser}
            onSaveReport={handleSaveReport}
            onViewReport={(r) => {
              handleSaveReport(r);
              setActiveReportId(r.id);
              setActiveTab('report');
            }}
          />
        )}

        {activeTab === 'report' && activeReport && (
          <ReportView
            report={activeReport}
            currentUser={currentUser}
            onBackToEditor={() => setActiveTab('editor')}
          />
        )}

        {activeTab === 'rules' && (
          <OimlRulesConfigurator
            userRole={currentUser.role}
            onConfigsUpdated={() => {
              // Trigger refresh if needed
              if (activeReport) {
                handleSaveReport({ ...activeReport });
              }
            }}
          />
        )}
      </main>

      {/* Official Government & Legal Metrology Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              Department of Consumer Affairs (DoCA)
            </span>
            <span aria-hidden="true">·</span>
            <span>Legal Metrology Act, 2009 & General Rules, 2011</span>
            <span aria-hidden="true">·</span>
            <span>OIML R-76-1:2006</span>
          </div>
          <div className="text-slate-400">
            Regional Reference Standard Laboratories (RRSL) & National Physical Laboratory (NPL) Network
          </div>
        </div>
      </footer>
    </div>
  );
}
