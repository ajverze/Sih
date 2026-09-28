import { NAWITestReport } from '../types/oiml';

/**
 * Downloads a file with specific MIME type and file extension
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports the complete test report as a standardized MS Word document (.doc)
 * containing formatted tables, official headers, and compliance evaluations.
 */
export function exportReportToWordDoc(report: NAWITestReport) {
  const { instrument, laboratory, weighingData, repeatabilityData, eccentricityData, signatures } = report;

  const docHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' 
        xmlns:w='urn:schemas-microsoft-com:office:word' 
        xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>OIML R-76 Test Report - ${report.reportNumber}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 11pt;
        color: #1a1a1a;
        line-height: 1.4;
      }
      .header-title {
        text-align: center;
        margin-bottom: 20px;
      }
      .gov-title {
        font-size: 12pt;
        font-weight: bold;
        color: #0f172a;
        text-transform: uppercase;
        margin: 2px 0;
      }
      .doc-title {
        font-size: 14pt;
        font-weight: bold;
        color: #1e3a8a;
        margin-top: 10px;
        text-transform: uppercase;
      }
      .report-meta {
        margin: 15px 0;
        padding: 8px;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 14px 0;
        font-size: 10pt;
      }
      th {
        background-color: #f1f5f9;
        color: #0f172a;
        font-weight: bold;
        border: 1px solid #94a3b8;
        padding: 6px 8px;
        text-align: left;
      }
      td {
        border: 1px solid #cbd5e1;
        padding: 5px 8px;
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .pass { color: #15803d; font-weight: bold; }
      .fail { color: #b91c1c; font-weight: bold; }
      .section-heading {
        font-size: 12pt;
        font-weight: bold;
        color: #1e3a8a;
        margin-top: 20px;
        margin-bottom: 6px;
        border-bottom: 2px solid #1e3a8a;
        padding-bottom: 3px;
      }
      .signature-box {
        margin-top: 30px;
        border-top: 1px dashed #64748b;
        padding-top: 15px;
      }
    </style>
  </head>
  <body>
    <div class="header-title">
      <div class="gov-title">GOVERNMENT OF INDIA</div>
      <div class="gov-title">MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION</div>
      <div class="gov-title">DEPARTMENT OF CONSUMER AFFAIRS — LEGAL METROLOGY DIVISION</div>
      <div class="doc-title">TYPE EVALUATION TEST REPORT AS PER OIML R-76-1:2006</div>
      <div>Non-Automatic Weighing Instruments (NAWI)</div>
    </div>

    <div class="report-meta">
      <strong>Report Reference:</strong> ${report.reportNumber} &nbsp;|&nbsp; 
      <strong>Certificate No:</strong> ${report.certificateNumber || 'N/A'} &nbsp;|&nbsp; 
      <strong>Status:</strong> <strong>${report.status}</strong> &nbsp;|&nbsp; 
      <strong>Overall Compliance:</strong> <span class="${report.overallCompliance === 'PASS' ? 'pass' : 'fail'}">${report.overallCompliance}</span>
    </div>

    <div class="section-heading">1. Instrument & Manufacturer Details</div>
    <table>
      <tr>
        <th width="25%">Manufacturer</th>
        <td width="75%">${instrument.manufacturerName}<br><small>${instrument.manufacturerAddress}</small></td>
      </tr>
      <tr>
        <th>Instrument / Model</th>
        <td>${instrument.modelName} (Model No: ${instrument.modelNumber})</td>
      </tr>
      <tr>
        <th>Serial Number & Type</th>
        <td>${instrument.serialNumber} &nbsp;|&nbsp; ${instrument.instrumentType}</td>
      </tr>
      <tr>
        <th>Metrological Parameters</th>
        <td>
          Accuracy Class: <strong>Class ${instrument.accuracyClass}</strong><br>
          Max Capacity: <strong>${instrument.maxCapacity} ${instrument.unit}</strong> &nbsp;|&nbsp; 
          Min Capacity: <strong>${instrument.minCapacity} ${instrument.unit}</strong><br>
          Verification Scale Interval (e): <strong>${instrument.verificationInterval_e} ${instrument.unit}</strong> &nbsp;|&nbsp; 
          Scale Interval (d): <strong>${instrument.actualScaleInterval_d} ${instrument.unit}</strong><br>
          Number of Scale Intervals (n): <strong>${instrument.numberOfScaleIntervals_n.toLocaleString()}</strong>
        </td>
      </tr>
      <tr>
        <th>Environmental Range</th>
        <td>Temperature: ${instrument.temperatureRangeMin}°C to ${instrument.temperatureRangeMax}°C &nbsp;|&nbsp; Power: ${instrument.powerSupply}</td>
      </tr>
    </table>

    <div class="section-heading">2. Testing Laboratory & Conditions</div>
    <table>
      <tr>
        <th width="25%">Testing Laboratory</th>
        <td width="75%">${laboratory.labName} (NABL: ${laboratory.nablAccreditationNo})</td>
      </tr>
      <tr>
        <th>Location & Date</th>
        <td>${laboratory.testLocation} &nbsp;|&nbsp; ${laboratory.testDate} (${laboratory.testTime})</td>
      </tr>
      <tr>
        <th>Environmental Readings</th>
        <td>Ambient Temp: ${laboratory.ambientTempStart}°C to ${laboratory.ambientTempEnd}°C &nbsp;|&nbsp; Relative Humidity: ${laboratory.relativeHumidity}% &nbsp;|&nbsp; Pressure: ${laboratory.atmosphericPressure} kPa</td>
      </tr>
      <tr>
        <th>Reference Standards</th>
        <td>Standard Weights: <strong>Class ${laboratory.referenceStandardClass}</strong> &nbsp;|&nbsp; Cert No: ${laboratory.referenceStandardCertNo} (Cal Date: ${laboratory.referenceStandardCalDate})</td>
      </tr>
    </table>

    <div class="section-heading">3. Weighing Performance Test Observations (Clause A.4.4)</div>
    <table>
      <thead>
        <tr>
          <th>Load (${instrument.unit})</th>
          <th>Ind. (Asc)</th>
          <th>Calc. P</th>
          <th>Error E</th>
          <th>Corr. Ec</th>
          <th>Ind. (Desc)</th>
          <th>Error E</th>
          <th>Corr. Ec</th>
          <th>MPE (±)</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        ${weighingData
          .map(
            (row) => `
          <tr>
            <td class="text-right"><strong>${row.testLoad.toFixed(4)}</strong></td>
            <td class="text-right">${row.indicationAscending.toFixed(4)}</td>
            <td class="text-right">${row.calculatedAscending.toFixed(4)}</td>
            <td class="text-right">${row.errorAscending >= 0 ? '+' : ''}${row.errorAscending.toFixed(4)}</td>
            <td class="text-right">${row.correctedErrorAscending >= 0 ? '+' : ''}${row.correctedErrorAscending.toFixed(4)}</td>
            <td class="text-right">${row.indicationDescending.toFixed(4)}</td>
            <td class="text-right">${row.errorDescending >= 0 ? '+' : ''}${row.errorDescending.toFixed(4)}</td>
            <td class="text-right">${row.correctedErrorDescending >= 0 ? '+' : ''}${row.correctedErrorDescending.toFixed(4)}</td>
            <td class="text-right">±${row.mpe.toFixed(4)}</td>
            <td class="text-center ${row.passAscending && row.passDescending ? 'pass' : 'fail'}">
              ${row.passAscending && row.passDescending ? 'PASS' : 'FAIL'}
            </td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <div class="section-heading">4. Repeatability & Eccentricity Observations</div>
    <table>
      <thead>
        <tr>
          <th>Test Name</th>
          <th>Load Applied</th>
          <th>Spread / Corr. Error</th>
          <th>Permissible Limit (MPE)</th>
          <th>Compliance Status</th>
        </tr>
      </thead>
      <tbody>
        ${repeatabilityData
          .map(
            (r) => `
          <tr>
            <td>Repeatability: ${r.loadPointName}</td>
            <td class="text-right">${r.testLoad} ${instrument.unit}</td>
            <td class="text-right">Spread: ${r.spread.toFixed(4)} ${instrument.unit}</td>
            <td class="text-right">±${r.mpe.toFixed(4)} ${instrument.unit}</td>
            <td class="text-center ${r.pass ? 'pass' : 'fail'}">${r.pass ? 'PASS' : 'FAIL'}</td>
          </tr>`
          )
          .join('')}
        ${eccentricityData
          .map(
            (e) => `
          <tr>
            <td>Eccentricity: ${e.positionName}</td>
            <td class="text-right">${e.testLoad} ${instrument.unit}</td>
            <td class="text-right">Ec: ${e.correctedError.toFixed(4)} ${instrument.unit}</td>
            <td class="text-right">±${e.mpe.toFixed(4)} ${instrument.unit}</td>
            <td class="text-center ${e.pass ? 'pass' : 'fail'}">${e.pass ? 'PASS' : 'FAIL'}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <div class="section-heading">5. Compliance Summary & Technical Findings</div>
    <p><strong>General Remarks:</strong> ${report.generalRemarks || 'None'}</p>
    <p><strong>Approval Authority Remarks:</strong> ${report.approvalRemarks || 'Under Evaluation'}</p>

    <div class="signature-box">
      <table style="border:none;">
        <tr style="border:none;">
          ${signatures
            .map(
              (sig) => `
            <td style="border:none; width:33%; vertical-align:top;">
              <p><strong>${sig.role}:</strong></p>
              <p><strong>${sig.signerName}</strong><br><small>${sig.signerDesignation}</small></p>
              <p><small>${sig.isSigned ? 'Digitally Signed: ' + sig.signedAt : 'Signature Pending'}</small></p>
              ${sig.signatureHash ? `<p style="font-family:monospace; font-size:8pt; word-break:break-all;">Hash: ${sig.signatureHash.substring(0, 32)}...</p>` : ''}
            </td>`
            )
            .join('')}
        </tr>
      </table>
    </div>
  </body>
  </html>`;

  downloadFile(
    docHtml,
    `OIML_R76_Test_Report_${report.reportNumber.replace(/[\/\\]/g, '_')}.doc`,
    'application/msword'
  );
}

/**
 * Exports test report as structured JSON for digital inter-lab transfer
 */
export function exportReportToJson(report: NAWITestReport) {
  const jsonStr = JSON.stringify(report, null, 2);
  downloadFile(
    jsonStr,
    `OIML_Report_${report.reportNumber.replace(/[\/\\]/g, '_')}.json`,
    'application/json'
  );
}
