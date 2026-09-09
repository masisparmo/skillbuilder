import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  ShieldCheck, 
  Trash2, 
  X, 
  HelpCircle,
  Copy,
  Check,
  Cpu
} from 'lucide-react';
import { useAppContext } from '../AppContext';
import { 
  getRawApiKeys, 
  saveApiKeys, 
  clearApiKeys, 
  parseApiKeys, 
  getRoundRobinIndex, 
  maskApiKey, 
  testApiKey,
  hasValidApiKey
} from '../apiKeyManager';

export const ApiKeyModal = () => {
  const { 
    isApiKeyModalOpen, 
    setIsApiKeyModalOpen, 
    showToast, 
    t, 
    apiKeysCount, 
    setApiKeysCount 
  } = useAppContext();

  const [inputVal, setInputVal] = useState('');
  const [parsedList, setParsedList] = useState<string[]>([]);
  const [testingIndex, setTestingIndex] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, { success: boolean; message: string }>>({});
  const [isCopiedStudioUrl, setIsCopiedStudioUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'guide'>('input');

  const roundRobinIndex = getRoundRobinIndex();

  useEffect(() => {
    if (isApiKeyModalOpen) {
      const raw = getRawApiKeys();
      setInputVal(raw);
      setParsedList(parseApiKeys(raw));
      setTestResults({});
    }
  }, [isApiKeyModalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputVal(val);
    const parsed = parseApiKeys(val);
    setParsedList(parsed);
  };

  const handleSave = () => {
    const keys = parseApiKeys(inputVal);
    if (keys.length === 0) {
      showToast(t('toastApiKeyMissing'), 'warning');
      return;
    }

    saveApiKeys(keys);
    setApiKeysCount(keys.length);
    showToast(t('toastApiKeySaved'), 'success');
    setIsApiKeyModalOpen(false);
  };

  const handleClear = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua API Key dari browser?')) {
      clearApiKeys();
      setInputVal('');
      setParsedList([]);
      setTestResults({});
      setApiKeysCount(0);
      showToast(t('toastApiKeyCleared'), 'info');
    }
  };

  const handleTestKey = async (key: string, index: number) => {
    setTestingIndex(index);
    try {
      const res = await testApiKey(key);
      setTestResults(prev => ({ ...prev, [index]: res }));
      if (res.success) {
        showToast(`Key #${index + 1}: ${t('toastApiKeyTestedSuccess')}`, 'success');
      } else {
        showToast(`Key #${index + 1} Gagal: ${res.message}`, 'error');
      }
    } finally {
      setTestingIndex(null);
    }
  };

  const handleTestAll = async () => {
    if (parsedList.length === 0) {
      showToast(t('toastApiKeyMissing'), 'warning');
      return;
    }

    for (let i = 0; i < parsedList.length; i++) {
      await handleTestKey(parsedList[i], i);
    }
  };

  const copyStudioUrl = () => {
    navigator.clipboard.writeText('https://aistudio.google.com/app/apikey');
    setIsCopiedStudioUrl(true);
    setTimeout(() => setIsCopiedStudioUrl(false), 2000);
  };

  if (!isApiKeyModalOpen) return null;

  const hasExistingKeys = hasValidApiKey();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('apiKeyModalTitle')}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t('apiKeyModalSubtitle')}
              </p>
            </div>
          </div>

          {hasExistingKeys && (
            <button 
              onClick={() => setIsApiKeyModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={t('apiKeyCancelBtn')}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2 bg-slate-50/20 dark:bg-slate-800/10 gap-2">
          <button
            onClick={() => setActiveTab('input')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'input'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Form Input & Keys ({parsedList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'guide'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t('apiKeyGuideTitle')}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {activeTab === 'input' ? (
            <>
              {/* Info banner */}
              <div className="p-3.5 rounded-xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{t('apiKeyRoundRobinNotice')}</span>
              </div>

              {/* Textarea Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>{t('apiKeyInputLabel')}</span>
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      (pisahkan dengan koma <code>,</code>)
                    </span>
                  </label>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {t('apiKeyKeysDetected').replace('{count}', String(parsedList.length))}
                  </span>
                </div>

                <textarea
                  value={inputVal}
                  onChange={handleInputChange}
                  placeholder={t('apiKeyInputPlaceholder')}
                  rows={4}
                  className="w-full text-xs font-mono rounded-xl p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition"
                />
              </div>

              {/* Parsed Keys Preview List */}
              {parsedList.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Daftar Key Terdeteksi & Status Rotasi:
                    </span>
                    {parsedList.length > 0 && (
                      <button
                        type="button"
                        onClick={handleTestAll}
                        disabled={testingIndex !== null}
                        className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        <RotateCw className={`w-3 h-3 ${testingIndex !== null ? 'animate-spin' : ''}`} />
                        <span>{t('apiKeyTestBtn')}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {parsedList.map((k, idx) => {
                      const result = testResults[idx];
                      const isTestingThis = testingIndex === idx;

                      return (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-[10px] font-bold flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-mono font-medium text-slate-800 dark:text-slate-200 truncate">
                              {maskApiKey(k)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {result && (
                              result.success ? (
                                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Aktif</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] text-rose-500 font-medium" title={result.message}>
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Error</span>
                                </span>
                              )
                            )}

                            <button
                              type="button"
                              onClick={() => handleTestKey(k, idx)}
                              disabled={isTestingThis}
                              className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
                            >
                              {isTestingThis ? '...' : 'Uji Key'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Security Note */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('apiKeySecurityNote')}</span>
              </div>
            </>
          ) : (
            /* Guide Tab: Cara Mendapatkan API Key Gratis dari Google AI Studio */
            <div className="flex flex-col gap-4 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-brand-500/10 to-indigo-500/10 border border-brand-500/20 flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      Google AI Studio (Free Tier)
                    </span>
                  </div>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition"
                  >
                    <span>Buka Google AI Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Google AI Studio menyediakan akses API gratis dengan kuota harian yang sangat leluasa. Tanpa perlu kartu kredit untuk mulai!
                </p>
              </div>

              {/* Step by step instructions */}
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Langkah-Langkah Mendapatkan Key:
                </h4>

                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-slate-900 dark:text-white">{t('apiKeyGuideStep1')}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-[10px] bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          https://aistudio.google.com/app/apikey
                        </code>
                        <button 
                          onClick={copyStudioUrl}
                          className="text-[10px] font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                        >
                          {isCopiedStudioUrl ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopiedStudioUrl ? 'Tersalin' : 'Salin URL'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                    <span className="font-medium text-slate-900 dark:text-white">{t('apiKeyGuideStep2')}</span>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                    <span className="font-medium text-slate-900 dark:text-white">{t('apiKeyGuideStep3')}</span>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
                    <span className="font-medium text-slate-900 dark:text-white">{t('apiKeyGuideStep4')}</span>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">5</span>
                    <span className="font-medium text-slate-900 dark:text-white">{t('apiKeyGuideStep5')}</span>
                  </div>
                </div>
              </div>

              {/* Tips Multiple Key Callout */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    Keuntungan Menggunakan Beberapa API Key
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    {t('apiKeyGuideMultipleTip')}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('input')}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition"
                >
                  Kembali ke Form Input API Key &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 flex-wrap">
          <div>
            {parsedList.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('apiKeyClearBtn')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasExistingKeys && (
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
              >
                {t('apiKeyCancelBtn')}
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow transition"
            >
              <Check className="w-4 h-4" />
              <span>{t('apiKeySaveBtn')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
