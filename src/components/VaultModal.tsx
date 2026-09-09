import React, { useEffect, useState } from 'react';
import { X, Upload, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { getAllSkillsFromDB, deleteSkillFromDB, saveSkillToDB } from '../lib';

export const VaultModal = () => {
  const { isVaultOpen, setIsVaultOpen, t, showToast, setCurrentSkillId, setActiveSkillName, setPurpose, setLanguage, setTargetAudience, setIdea, setCurrentMarkdown, setAnalysis, setHistory, refreshVaultCount, setShowWorkspace } = useAppContext();
  const [skills, setSkills] = useState<any[]>([]);

  useEffect(() => {
    if (isVaultOpen) {
      loadSkills();
    }
  }, [isVaultOpen]);

  const loadSkills = async () => {
    try {
      const dbSkills = await getAllSkillsFromDB();
      setSkills(dbSkills);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSkillFromDB(id);
      showToast(t('toastDeletedVault'), 'info');
      loadSkills();
      refreshVaultCount();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoad = (skill: any) => {
    setCurrentSkillId(skill.id);
    setActiveSkillName(skill.name);
    setPurpose(skill.purpose);
    setLanguage(skill.language);
    setTargetAudience(skill.targetAudience);
    setIdea(skill.idea);
    setCurrentMarkdown(skill.markdown);
    setAnalysis(skill.analysis);
    setHistory(skill.history);
    setShowWorkspace(true);
    setIsVaultOpen(false);
    showToast(t('toastLoadedVault'), 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const newSkill = {
        name: file.name.replace(/\.SKILL\.md$/i, '').replace(/\.md$/i, ''),
        markdown: text,
        idea: "Imported from file: " + file.name,
      };
      const saved = await saveSkillToDB(newSkill);
      showToast('File successfully imported!', 'success');
      loadSkills();
      refreshVaultCount();
      handleLoad(saved);
    };
    reader.readAsText(file);
  };

  if (!isVaultOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('vaultModalTitle')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('vaultModalSubtitle')}</p>
          </div>
          <button onClick={() => setIsVaultOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {skills.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-brand-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('vaultEmptyTitle')}</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{t('vaultEmptySubtitle')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((skill) => (
                <div key={skill.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col gap-3 hover:border-brand-300 dark:hover:border-brand-700 transition">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white truncate" title={skill.name}>{skill.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{skill.idea}</p>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>{new Date(skill.updatedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    <button onClick={() => handleLoad(skill)} className="flex-1 px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded hover:bg-brand-500 transition flex justify-center items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Load
                    </button>
                    <button onClick={() => handleDelete(skill.id)} className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded transition flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-b-xl flex justify-between items-center">
          <label className="cursor-pointer px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-lg transition flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload .SKILL.md
            <input type="file" accept=".md,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
