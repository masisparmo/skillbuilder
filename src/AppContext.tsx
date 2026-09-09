import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18N, STARTER_DEMO, PRESETS } from './i18n';
import { saveSkillToDB, getAllSkillsFromDB } from './lib';

export const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [uiLang, setUiLang] = useState<'id' | 'en'>('id');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentSkillId, setCurrentSkillId] = useState<string | null>(null);
  
  const [idea, setIdea] = useState(STARTER_DEMO.id.idea);
  const [targetAudience, setTargetAudience] = useState(STARTER_DEMO.id.target);
  const [purpose, setPurpose] = useState(STARTER_DEMO.id.purpose);
  const [language, setLanguage] = useState(STARTER_DEMO.id.lang);
  
  const [activeSkillName, setActiveSkillName] = useState('infographic-designer');
  const [currentMarkdown, setCurrentMarkdown] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultCount, setVaultCount] = useState(0);
  
  const [toasts, setToasts] = useState<any[]>([]);

  const t = (key: string) => I18N[uiLang][key] || key;
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const prevLang = uiLang === 'id' ? 'en' : 'id';
    if (!currentMarkdown) {
      // Check STARTER DEMO
      if (idea === STARTER_DEMO[prevLang].idea) {
        setIdea(STARTER_DEMO[uiLang].idea);
        setTargetAudience(STARTER_DEMO[uiLang].target);
        setPurpose(STARTER_DEMO[uiLang].purpose);
        setLanguage(STARTER_DEMO[uiLang].lang);
        return;
      }
      
      // Check PRESETS
      for (const [key, preset] of Object.entries(PRESETS[prevLang])) {
        if (idea === preset.idea) {
          setIdea(PRESETS[uiLang][key].idea);
          setTargetAudience(PRESETS[uiLang][key].target);
          setPurpose(PRESETS[uiLang][key].purpose);
          return;
        }
      }
    }
  }, [uiLang]);

  const refreshVaultCount = async () => {
    try {
      const skills = await getAllSkillsFromDB();
      setVaultCount(skills.length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshVaultCount();
  }, []);

  useEffect(() => {
    if (!currentMarkdown || !currentSkillId) return;
    const timer = setTimeout(async () => {
      try {
        await saveSkillToDB({
          id: currentSkillId,
          name: activeSkillName,
          purpose: purpose,
          language: language,
          targetAudience: targetAudience,
          idea: idea,
          markdown: currentMarkdown,
          analysis: analysis,
          history: history
        });
        refreshVaultCount();
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentMarkdown, currentSkillId, activeSkillName, purpose, language, targetAudience, idea, analysis, history]);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3500);
  };
  
  return (
    <AppContext.Provider value={{
      uiLang, setUiLang,
      theme, setTheme,
      currentSkillId, setCurrentSkillId,
      idea, setIdea,
      targetAudience, setTargetAudience,
      purpose, setPurpose,
      language, setLanguage,
      activeSkillName, setActiveSkillName,
      currentMarkdown, setCurrentMarkdown,
      analysis, setAnalysis,
      history, setHistory,
      isGenerating, setIsGenerating,
      showWorkspace, setShowWorkspace,
      isVaultOpen, setIsVaultOpen,
      vaultCount, refreshVaultCount,
      toasts, showToast,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
