import React from 'react';
import { Sparkles, Globe, Moon, Sun, Archive, Key } from 'lucide-react';
import { useAppContext } from '../AppContext';

export const Header = () => {
  const { 
    uiLang, 
    setUiLang, 
    theme, 
    setTheme, 
    t, 
    showToast, 
    setIsVaultOpen, 
    vaultCount,
    setIsApiKeyModalOpen,
    apiKeysCount
  } = useAppContext();

  const toggleLanguage = () => {
    const nextLang = uiLang === 'id' ? 'en' : 'id';
    setUiLang(nextLang);
    showToast(nextLang === 'id' ? 'Bahasa Indonesia diaktifkan' : 'Switched to English', 'info');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(nextTheme === 'dark' ? 'Mode Gelap Aktif' : 'Light Mode Active', 'info');
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand & App Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-none whitespace-nowrap">
              {t('appTitle')}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block truncate mt-0.5">
              {t('appSubtitle')}
            </p>
          </div>
        </div>

        {/* Right Actions - All buttons have uniform h-9 (36px) height */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* API Key Settings Button */}
          <button 
            onClick={() => setIsApiKeyModalOpen(true)}
            className={`h-9 px-2.5 sm:px-3 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center gap-1.5 shrink-0 transition border shadow-xs ${
              apiKeysCount > 0
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 animate-pulse'
            }`}
            title={t('apiKeyModalTitle')}
          >
            <Key className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline font-mono">
              {apiKeysCount > 0 
                ? t('apiKeyBtnConfigured').replace('{count}', String(apiKeysCount))
                : t('apiKeyBtnMissing')}
            </span>
            <span className="sm:hidden font-mono text-[11px] leading-none">
              {apiKeysCount > 0 ? `${apiKeysCount} Key` : 'Key'}
            </span>
          </button>

          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage} 
            className="h-9 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center gap-1.5 shrink-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
          >
            <Globe className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="leading-none">{uiLang.toUpperCase()}</span>
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="h-9 w-9 p-0 rounded-lg text-xs inline-flex items-center justify-center shrink-0 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0"></div>

          {/* Vault Button */}
          <button 
            onClick={() => setIsVaultOpen(true)} 
            className="h-9 px-2.5 sm:px-3 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center gap-1.5 shrink-0 bg-brand-600/10 hover:bg-brand-600/20 text-brand-600 dark:text-brand-400 border border-brand-500/30 transition shadow-xs"
          >
            <Archive className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{t('savedSkillsBtn')}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-brand-600 text-white font-mono leading-none">{vaultCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
