import React, { useState } from 'react';
import { WeighingPerformanceObservation, AccuracyClass } from '../types/oiml';
import { calculateMPE_in_units } from '../utils/oimlEngine';

interface ErrorCurveChartProps {
  data: WeighingPerformanceObservation[];
  maxCapacity: number;
  verificationInterval_e: number;
  accuracyClass: AccuracyClass;
  unit: string;
}

export const ErrorCurveChart: React.FC<ErrorCurveChartProps> = ({
  data,
  maxCapacity,
  verificationInterval_e,
  accuracyClass,
  unit,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    load: number;
    error: number;
    mpe: number;
    type: 'Ascending' | 'Descending';
    x: number;
    y: number;
  } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-100/60 rounded-xl border border-slate-200 text-slate-500 text-sm">
        No weighing points entered yet to render error curve.
      </div>
    );
  }

  // Width and height
  const width = 800;
  const height = 340;
  const margin = { top: 30, right: 30, bottom: 45, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // X scale: 0 to Max
  const maxX = Math.max(maxCapacity, ...data.map((d) => d.testLoad), 1);
  const scaleX = (val: number) => margin.left + (val / maxX) * innerWidth;

  // Y scale: determine max deviation
  const maxMPE = calculateMPE_in_units(maxX, verificationInterval_e, accuracyClass);
  const maxObsError = Math.max(
    ...data.map((d) => Math.max(Math.abs(d.correctedErrorAscending), Math.abs(d.correctedErrorDescending))),
    maxMPE * 1.2,
    verificationInterval_e * 2
  );
  const yBound = Math.max(maxObsError * 1.25, maxMPE * 1.4);

  const scaleY = (val: number) => {
    // val in [-yBound, +yBound] -> [margin.top + innerHeight, margin.top]
    const norm = (val - -yBound) / (2 * yBound);
    return margin.top + innerHeight - norm * innerHeight;
  };

  const zeroY = scaleY(0);

  // Generate step envelope for MPE (+/-)
  // Sample 80 points along X to draw the tolerance boundary
  const envelopePointsUpper: string[] = [];
  const envelopePointsLower: string[] = [];
  const sampleSteps = 100;
  for (let i = 0; i <= sampleSteps; i++) {
    const curLoad = (i / sampleSteps) * maxX;
    const mpeVal = calculateMPE_in_units(curLoad, verificationInterval_e, accuracyClass);
    const xCoord = scaleX(curLoad);
    envelopePointsUpper.push(`${xCoord.toFixed(1)},${scaleY(mpeVal).toFixed(1)}`);
    envelopePointsLower.push(`${xCoord.toFixed(1)},${scaleY(-mpeVal).toFixed(1)}`);
  }

  // Polygon for shaded permissible region
  const envelopePolygon = [
    ...envelopePointsUpper,
    ...envelopePointsLower.slice().reverse(),
  ].join(' ');

  // Sort data by load for line tracing
  const sortedData = [...data].sort((a, b) => a.testLoad - b.testLoad);

  const ascendingPath = sortedData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.testLoad).toFixed(1)} ${scaleY(d.correctedErrorAscending).toFixed(1)}`)
    .join(' ');

  const descendingPath = sortedData
    .slice()
    .reverse()
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.testLoad).toFixed(1)} ${scaleY(d.correctedErrorDescending).toFixed(1)}`)
    .join(' ');

  return (
    <div className="relative w-full bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3 pb-2 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">
            OIML R-76 Error Curve & Maximum Permissible Error (MPE) Envelope
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Plot of Corrected Error ($E_c$) against Test Load with ±MPE tolerance bounds (Class {accuracyClass})
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-500/15 border border-emerald-500 rounded-xs"></span>
            <span className="text-slate-600">±MPE Tolerance Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-600 inline-block"></span>
            <span className="text-slate-600">Ascending (▲)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-indigo-500 stroke-dash inline-block border-t border-dashed border-indigo-500"></span>
            <span className="text-slate-600">Descending (▼)</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[380px] select-none"
        >
          <defs>
            <linearGradient id="mpeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.16" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.16" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          {[-1, -0.5, 0, 0.5, 1].map((step) => {
            const val = step * yBound;
            const y = scaleY(val);
            return (
              <g key={step}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke={step === 0 ? '#64748b' : '#e2e8f0'}
                  strokeWidth={step === 0 ? 1.5 : 1}
                  strokeDasharray={step === 0 ? undefined : '3,3'}
                />
                <text
                  x={margin.left - 8}
                  y={y + 3.5}
                  fontSize={10}
                  fill="#64748b"
                  textAnchor="end"
                  className="font-mono tabular-nums"
                >
                  {val >= 0 ? `+${val.toFixed(3)}` : val.toFixed(3)}
                </text>
              </g>
            );
          })}

          {/* X-axis tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const loadVal = f * maxX;
            const x = scaleX(loadVal);
            return (
              <g key={f}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={margin.top + innerHeight}
                  stroke="#f1f5f9"
                  strokeWidth={1}
                />
                <line
                  x1={x}
                  y1={margin.top + innerHeight}
                  x2={x}
                  y2={margin.top + innerHeight + 5}
                  stroke="#94a3b8"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={margin.top + innerHeight + 18}
                  fontSize={10}
                  fill="#64748b"
                  textAnchor="middle"
                  className="font-mono tabular-nums"
                >
                  {loadVal.toFixed(1)} {unit}
                </text>
              </g>
            );
          })}

          {/* Permissible MPE Envelope Polygon */}
          <polygon
            points={envelopePolygon}
            fill="url(#mpeGrad)"
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="4,2"
          />

          {/* Trace Ascending Curve */}
          <path
            d={ascendingPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth={2}
          />

          {/* Trace Descending Curve */}
          <path
            d={descendingPath}
            fill="none"
            stroke="#6366f1"
            strokeWidth={1.75}
            strokeDasharray="5,3"
          />

          {/* Data Points */}
          {sortedData.map((d) => {
            const x = scaleX(d.testLoad);
            const yAsc = scaleY(d.correctedErrorAscending);
            const yDesc = scaleY(d.correctedErrorDescending);

            return (
              <g key={d.id}>
                {/* Ascending Point */}
                <circle
                  cx={x}
                  cy={yAsc}
                  r={d.passAscending ? 4.5 : 5.5}
                  fill={d.passAscending ? '#2563eb' : '#ef4444'}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  className="cursor-pointer hover:r-6 transition-all"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      load: d.testLoad,
                      error: d.correctedErrorAscending,
                      mpe: d.mpe,
                      type: 'Ascending',
                      x,
                      y: yAsc,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Descending Point */}
                <rect
                  x={x - 4}
                  y={yDesc - 4}
                  width={8}
                  height={8}
                  fill={d.passDescending ? '#6366f1' : '#ef4444'}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  className="cursor-pointer hover:scale-125 transition-transform origin-center"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      load: d.testLoad,
                      error: d.correctedErrorDescending,
                      mpe: d.mpe,
                      type: 'Descending',
                      x,
                      y: yDesc,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 6}
            fontSize={11}
            fill="#334155"
            textAnchor="middle"
            fontWeight={600}
          >
            Test Load L ({unit})
          </text>
          <text
            x={-height / 2 + 10}
            y={16}
            fontSize={11}
            fill="#334155"
            textAnchor="middle"
            fontWeight={600}
            transform="rotate(-90)"
          >
            Corrected Error Ec ({unit})
          </text>
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-md shadow-lg border border-slate-700 font-mono"
            style={{
              left: `${Math.min(hoveredPoint.x + 10, width - 180)}px`,
              top: `${Math.max(hoveredPoint.y - 45, 10)}px`,
            }}
          >
            <div className="font-semibold text-cyan-300">
              {hoveredPoint.type} Load: {hoveredPoint.load} {unit}
            </div>
            <div>
              Error: <span className={Math.abs(hoveredPoint.error) <= hoveredPoint.mpe ? 'text-emerald-300' : 'text-rose-400 font-bold'}>{hoveredPoint.error >= 0 ? '+' : ''}{hoveredPoint.error} {unit}</span>
            </div>
            <div className="text-slate-400">
              Permissible MPE: ±{hoveredPoint.mpe} {unit}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
