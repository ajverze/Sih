import React, { useState } from 'react';
import { AccuracyClass, OIMLClassConfig, UserRole } from '../types/oiml';
import { 
  DEFAULT_OIML_CONFIGS, 
  getStoredOIMLConfigs, 
  saveOIMLConfigs, 
  resetOIMLConfigs 
} from '../utils/oimlEngine';
import { Settings, ShieldCheck, RefreshCw, Save, CheckCircle2, Info } from 'lucide-react';

interface OimlRulesConfiguratorProps {
  userRole: UserRole;
  onConfigsUpdated: () => void;
}

export const OimlRulesConfigurator: React.FC<OimlRulesConfiguratorProps> = ({
  userRole,
  onConfigsUpdated,
}) => {
  const [configs, setConfigs] = useState<Record<AccuracyClass, OIMLClassConfig>>(() => getStoredOIMLConfigs());
  const [selectedClass, setSelectedClass] = useState<AccuracyClass>('III');
  const [saveNotice, setSaveNotice] = useState(false);

  const activeConfig = configs[selectedClass];
  const canEdit = userRole === 'admin' || userRole === 'reviewer';

  const handleFieldChange = (field: keyof OIMLClassConfig, value: number) => {
    setConfigs((prev) => ({
      ...prev,
      [selectedClass]: {
        ...prev[selectedClass],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    saveOIMLConfigs(configs);
    onConfigsUpdated();
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Reset all OIML R-76 rule limits to official 2006 international recommendation standard?')) {
      const def = resetOIMLConfigs();
      setConfigs(def);
      onConfigsUpdated();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <span>Core Metrological Engine Configuration</span>
            <span aria-hidden="true">·</span>
            <span>OIML R-76 Architecture</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            OIML R-76 Rules & Permissible Error Limits Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Configure step-limits, maximum permissible errors (MPE), and zero-setting tolerances for future OIML R-76
            amendments or national Legal Metrology (General) Rules, 2011 requirements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Rule Engine</span>
            </button>
          )}
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>OIML R-76 rules engine successfully updated. Calculations in current and future tests will use these parameters.</span>
        </div>
      )}

      {/* Class Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {(['I', 'II', 'III', 'IIII'] as AccuracyClass[]).map((cls) => (
          <button
            key={cls}
            onClick={() => setSelectedClass(cls)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              selectedClass === cls
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Class {cls} ({cls === 'I' ? 'Special' : cls === 'II' ? 'High' : cls === 'III' ? 'Medium' : 'Ordinary'})
          </button>
        ))}
      </div>

      {/* Configuration Form Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">
            {activeConfig.classNameTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Governs Table 3 (Instrument verification intervals) and Table 6 (MPE steps) for initial verification.
          </p>
        </div>

        {/* Section 1: Verification Scale Intervals & Resolution */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            1. Scale Interval & Resolution Boundaries (Table 3)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Minimum Interval (e) in grams
              </label>
              <input
                type="number"
                step="0.0001"
                disabled={!canEdit}
                value={activeConfig.minScaleInterval_e}
                onChange={(e) => handleFieldChange('minScaleInterval_e', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">OIML baseline: {DEFAULT_OIML_CONFIGS[selectedClass].minScaleInterval_e} g</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Minimum Resolution (n = Max/e)
              </label>
              <input
                type="number"
                disabled={!canEdit}
                value={activeConfig.min_n}
                onChange={(e) => handleFieldChange('min_n', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Standard: {DEFAULT_OIML_CONFIGS[selectedClass].min_n.toLocaleString()}</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Maximum Resolution (n = Max/e)
              </label>
              <input
                type="number"
                disabled={!canEdit}
                value={activeConfig.max_n}
                onChange={(e) => handleFieldChange('max_n', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Standard: {DEFAULT_OIML_CONFIGS[selectedClass].max_n.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Maximum Permissible Error Steps */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            2. Permissible Error Limits & Step Thresholds (Table 6)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs font-semibold text-slate-800 mb-1">
                Step 1: Lower Load Region
              </div>
              <p className="text-[11px] text-slate-500 mb-2">0 to m₁ verification intervals (e)</p>
              
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-600 block">Upper limit m₁ (in e)</label>
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={activeConfig.step1_limit_e}
                    onChange={(e) => handleFieldChange('step1_limit_e', parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block">Permissible Error (± e)</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={!canEdit}
                    value={activeConfig.mpeStep1_e}
                    onChange={(e) => handleFieldChange('mpeStep1_e', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs font-semibold text-slate-800 mb-1">
                Step 2: Medium Load Region
              </div>
              <p className="text-[11px] text-slate-500 mb-2">m₁ to m₂ verification intervals (e)</p>
              
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-600 block">Upper limit m₂ (in e)</label>
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={activeConfig.step2_limit_e}
                    onChange={(e) => handleFieldChange('step2_limit_e', parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block">Permissible Error (± e)</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={!canEdit}
                    value={activeConfig.mpeStep2_e}
                    onChange={(e) => handleFieldChange('mpeStep2_e', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs font-semibold text-slate-800 mb-1">
                Step 3: High Load Region
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Greater than m₂ up to Max</p>
              
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-600 block">Load Threshold</label>
                  <div className="text-xs font-mono py-1.5 text-slate-700">
                    &gt; {activeConfig.step2_limit_e.toLocaleString()} e
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block">Permissible Error (± e)</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={!canEdit}
                    value={activeConfig.mpeStep3_e}
                    onChange={(e) => handleFieldChange('mpeStep3_e', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Zero-Setting & Creep Limits */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            3. Zero Setting & Stability Tolerances
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Zero-Setting Tolerance (Clause A.4.2.3) in e
              </label>
              <input
                type="number"
                step="0.05"
                disabled={!canEdit}
                value={activeConfig.zeroTolerance_e}
                onChange={(e) => handleFieldChange('zeroTolerance_e', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">OIML R-76 default: ±0.25 e</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Minimum Capacity Multiplier (Min in e)
              </label>
              <input
                type="number"
                disabled={!canEdit}
                value={activeConfig.minCapacityMultiplier_e}
                onChange={(e) => handleFieldChange('minCapacityMultiplier_e', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Standard for Class {selectedClass}: {DEFAULT_OIML_CONFIGS[selectedClass].minCapacityMultiplier_e} e</span>
            </div>
          </div>
        </div>

        {!canEdit && (
          <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500" />
            <span>You are viewing in <strong>{userRole}</strong> mode. Switch role to <strong>Administrator</strong> or <strong>Reviewer</strong> in the top bar to edit OIML engine parameters.</span>
          </div>
        )}
      </div>
    </div>
  );
};
