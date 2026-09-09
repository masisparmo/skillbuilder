import React from 'react';
import { Layers, RefreshCw, Check } from 'lucide-react';
import { useAppContext } from '../AppContext';

export const AnalysisSection = () => {
  const { analysis, t } = useAppContext();

  if (!analysis) return null;

  return (
    <section className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('anaSectionTitle')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('anaSectionSubtitle')}</p>
          </div>
        </div>
        <button className="text-xs flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700">
          <RefreshCw className="w-3 h-3" />
          <span>{t('regenAnalysisBtn')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('anaNameLabel')}</span>
            <div className="font-mono text-sm text-brand-600 dark:text-brand-400 font-semibold mt-0.5">{analysis.name}</div>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('anaPurposeLabel')}</span>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{analysis.purpose}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('anaTargetLabel')}</span>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{analysis.targetUser}</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">{t('anaCapsLabel')}</span>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {analysis.capabilities?.map((cap: string, i: number) => (
              <li key={i} className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 mt-0.5 shrink-0" />
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">{t('anaTriggersLabel')}</span>
          <div className="space-y-1.5 text-xs">
            {analysis.triggerExamples?.map((trig: string, i: number) => (
              <div key={i} className="px-2 py-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 font-mono text-[11px]">
                "{trig}"
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
