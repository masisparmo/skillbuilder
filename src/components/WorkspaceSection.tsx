import React, { useState, useEffect } from 'react';
import { ListTree, ChevronRight, MessageSquarePlus, RefreshCw, History, Code, Eye, FileText, Copy, CheckCircle2, Download } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { callGemini, validateSkillContent } from '../lib';
import { hasValidApiKey } from '../apiKeyManager';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from './Toasts';

export const WorkspaceSection = () => {
  const { 
    showWorkspace, currentMarkdown, setCurrentMarkdown, activeSkillName, 
    history, setHistory, t, showToast, uiLang, setIsApiKeyModalOpen
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [revisionInput, setRevisionInput] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  
  const [validation, setValidation] = useState<any>(null);

  useEffect(() => {
    if (currentMarkdown) {
      setValidation(validateSkillContent(currentMarkdown, uiLang === 'en'));
    }
  }, [currentMarkdown, uiLang]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentMarkdown);
    showToast(t('copiedBtn'), 'success');
  };

  const downloadSkillFile = () => {
    if (!currentMarkdown) return;
    const blob = new Blob([currentMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSkillName || 'custom-skill'}.SKILL.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(t('toastSuccessDownload'), "success");
  };

  if (!showWorkspace) return null;

  const ARCHITECT_SYSTEM_PROMPT = `You are a Principal AI Skill Architect maintaining and refining official SKILL.md files for Google Gemini Spark, adhering strictly to Google's official documentation (answer/17094296 and answer/17102773).

OFFICIAL GEMINI SPARK STANDARDS:
1. YAML FRONTMATTER:
   - "name": lowercase-kebab-case starting with an action verb (e.g. plan-meal-from-recipe, design-mobile-infographic). NEVER use vague words like helper, tools, data.
   - "description": Third-person statement under 1024 chars, including a trigger clause starting with "Use when..." (or "Gunakan saat..." / "Gunakan ketika...").
2. INSTRUCTION PHILOSOPHY: "Cheat sheets, not manuals" - concise, high-density, structured.
3. MANDATORY SECTIONS:
   - Role & Core Purpose
   - Workflow & Step-by-Step Checklist (- [ ] Step 1: ...)
   - Formatting Rules & Output Template (concrete template with codeblocks/markdown)
   - Handling Missing Information (ask user for missing parameters instead of assuming)
   - Common Mistakes to Avoid (clear pitfalls and anti-hallucination constraints)

Maintain all official standards while applying the user's requested revision. Return ONLY the complete updated raw SKILL.md markdown text starting with "---".`;

  const handleRevise = async () => {
    if (!hasValidApiKey()) {
      setIsApiKeyModalOpen(true);
      showToast(t('toastApiKeyMissing'), "warning");
      return;
    }

    if (!revisionInput.trim()) return;
    setIsRevising(true);
    try {
      const prompt = `CURRENT SKILL.md:\n${currentMarkdown}\n\nUSER REVISION REQUEST:\n"${revisionInput}"\n\nTask: Modify according to request. Return ONLY the complete updated SKILL.md content.`;
      const updated = await callGemini(prompt, ARCHITECT_SYSTEM_PROMPT);
      setCurrentMarkdown(updated);
      setHistory((prev: any[]) => [{
        version: `v${prev.length + 1}.0`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        summary: revisionInput.slice(0, 30) + '...',
        content: updated
      }, ...prev]);
      setRevisionInput('');
      showToast(t('toastSuccessRev'), "success");
    } catch (err: any) {
      showToast("Error: " + err.message, "error");
    } finally {
      setIsRevising(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT PANEL */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Outline Card */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ListTree className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{t('structureTitle')}</h4>
            </div>
          </div>
          <nav className="space-y-1 text-xs">
            {['frontmatter', 'role', 'goal', 'inputs', 'workflow', 'rules', 'output', 'quality'].map((sec) => (
              <button key={sec} className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition group">
                <span className="flex items-center gap-2 capitalize">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>{t('sec' + sec.charAt(0).toUpperCase() + sec.slice(1))}</span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Revision Card */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-brand-500/20 text-brand-600 dark:text-brand-400">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{t('askAiTitle')}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('askAiSubtitle')}</p>
            </div>
          </div>
          <textarea 
            value={revisionInput}
            onChange={e => setRevisionInput(e.target.value)}
            rows={3} 
            className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition resize-y" />
          <button 
            onClick={handleRevise}
            disabled={isRevising}
            className="w-full py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-brand-600/20 transition disabled:opacity-50">
            {isRevising ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>{t('reviseBtn')}</span>
          </button>
        </div>

        {/* History Card */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t('historyTitle')}</h4>
            </div>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                    <span className="font-mono text-brand-600 dark:text-brand-400 text-[11px]">{h.version}</span>
                    <span>•</span>
                    <span className="truncate max-w-[120px]">{h.summary}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{h.time}</span>
                </div>
                <button onClick={() => setCurrentMarkdown(h.content)} className="text-[11px] px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-brand-600 text-slate-700 dark:text-slate-300 hover:text-white transition">
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:col-span-8 space-y-4">
        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 transition-colors">
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button onClick={() => setActiveTab('edit')} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5", activeTab === 'edit' ? "bg-brand-600 text-white shadow" : "text-slate-600 dark:text-slate-400")}>
              <Code className="w-3.5 h-3.5" /> <span>{t('tabEdit')}</span>
            </button>
            <button onClick={() => setActiveTab('preview')} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5", activeTab === 'preview' ? "bg-brand-600 text-white shadow" : "text-slate-600 dark:text-slate-400")}>
              <Eye className="w-3.5 h-3.5" /> <span>{t('tabPreview')}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
              <span>{activeSkillName}.SKILL.md</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={downloadSkillFile} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30 transition flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> <span>{t('downloadBtn')}</span>
            </button>
            <button onClick={copyToClipboard} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5" /> <span>{t('copyBtn')}</span>
            </button>
          </div>
        </div>

        {activeTab === 'edit' ? (
          <div className="relative bg-slate-900 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[520px]">
            <textarea 
              value={currentMarkdown}
              onChange={e => setCurrentMarkdown(e.target.value)}
              className="w-full h-[520px] bg-transparent text-slate-100 font-mono text-xs sm:text-sm p-4 leading-6 resize-none focus:outline-none overflow-y-auto whitespace-pre"
              placeholder="SKILL.md content will appear here..."
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 min-h-[520px] max-h-[700px] overflow-y-auto shadow-sm transition-colors">
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentMarkdown}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Validation Card */}
        {validation && (
          <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={cn("w-9 h-9 rounded-xl border font-bold text-sm flex items-center justify-center font-mono", validation.score >= 90 ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400")}>
                  {validation.score}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{t('validatorTitle')}</h4>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {validation.checks.map((c: any, i: number) => (
                <div key={i} className={cn("flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/70 border", c.pass ? 'border-emerald-500/20 text-slate-700 dark:text-slate-300' : 'border-rose-500/30 text-rose-600 dark:text-rose-300')}>
                  <CheckCircle2 className={cn("w-4 h-4 shrink-0", c.pass ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400')} />
                  <span className="truncate">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
