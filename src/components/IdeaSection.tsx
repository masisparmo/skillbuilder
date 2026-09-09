import React, { useState } from 'react';
import { Sparkles, Lightbulb, Cpu, CheckCircle, Loader, Circle, Check } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { PRESETS } from '../i18n';
import { callGemini } from '../lib';
import { cn } from './Toasts';

export const IdeaSection = () => {
  const { 
    idea, setIdea, targetAudience, setTargetAudience, purpose, setPurpose, language, setLanguage,
    t, uiLang, showToast, isGenerating, setIsGenerating, setAnalysis, 
    setCurrentMarkdown, setHistory, setActiveSkillName, setShowWorkspace, setCurrentSkillId
  } = useAppContext();

  const [loadingStep, setLoadingStep] = useState(0);

  const handlePreset = (key: string) => {
    const langKey = uiLang === 'en' ? 'en' : 'id';
    const p = PRESETS[langKey]?.[key] || PRESETS.id[key];
    if (p) {
      setIdea(p.idea);
      setTargetAudience(p.target);
      setPurpose(p.purpose);
      showToast(`Preset loaded!`, "info");
    }
  };

  const handleGenerate = async () => {
    if (!idea.trim()) {
      showToast(t('toastEmptyIdea'), "warning");
      return;
    }

    setCurrentSkillId(`skill_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
    setIsGenerating(true);
    setLoadingStep(1);
    
    try {
      const anaPrompt = `Analyze this Skill idea for Gemini Spark:
Idea: "${idea}"
Target Audience: "${targetAudience || 'General users'}"
Category: "${purpose}"
Language: "${language}"
Extract the architecture plan in JSON format.`;

      const schema = {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          purpose: { type: "STRING" },
          targetUser: { type: "STRING" },
          capabilities: { type: "ARRAY", items: { type: "STRING" } },
          triggerExamples: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["name", "purpose", "targetUser", "capabilities", "triggerExamples"]
      };

      const jsonStr = await callGemini(anaPrompt, "You are a Skill Architect analyzer.", schema);
      const anaResult = JSON.parse(jsonStr);
      setAnalysis(anaResult);
      setActiveSkillName(anaResult.name);
      
      setLoadingStep(2);
      
      const draftPrompt = `Architect a complete, comprehensive, production-ready SKILL.md file for Gemini Spark based on:
Idea: ${idea}
Target Audience: ${targetAudience}
Category: ${purpose}
Preferred Language: ${language}
Analyzed Name: ${anaResult.name}
Analyzed Purpose: ${anaResult.purpose}
Key Capabilities: ${anaResult.capabilities.join(', ')}

Ensure valid YAML frontmatter (name & description) and complete markdown sections. Make it extremely specific and practical. Return ONLY the raw SKILL.md text.`;

      const ARCHITECT_SYSTEM_PROMPT = `You are a Senior AI Skill Architect for Gemini Spark.
Your mission is to transform a user's idea or workflow requirements into a world-class, production-grade, highly structured SKILL.md file.

Core Architecture Rules for SKILL.md:
1. FRONTMATTER: Must begin with valid YAML frontmatter containing:
   ---
   name: <lowercase-kebab-case-name>
   description: <crisp, high-impact description explaining what the skill does and exact trigger conditions>
   ---
2. IDENTITY & ROLE: Define precise persona, domain mastery, and behavioral posture.
3. PURPOSE & SCOPE: Clear mission statement, what it handles, and out-of-scope boundaries.
4. INPUT SPECIFICATIONS: Supported formats (text, PDF, video, code, tables), required variables, optional parameters.
5. WORKFLOW & EXECUTION PIPELINE: Step-by-step sequential reasoning (Step 1, Step 2, etc.).
6. DECISION RULES & CONSTRAINTS: Uncompromising constraints (e.g., when to ask questions, anti-hallucination rules, mobile-first design, exact formatting requirements).
7. OUTPUT FORMAT & TEMPLATES: Exact schema/template with markdown headings, tables, or codeblocks.
8. QUALITY ASSURANCE CHECKLIST: A validation criteria checklist that Gemini Spark must internally evaluate before finalizing its output.

Guidelines:
- Prefer explicit, unambiguous rules over vague suggestions.
- Do NOT include extraneous conversational filler before or after the markdown.
- Do NOT wrap your response in markdown or yaml blocks.
- Output ONLY the complete, ready-to-use SKILL.md markdown text.`;

      setLoadingStep(3);
      const draftMarkdown = await callGemini(draftPrompt, ARCHITECT_SYSTEM_PROMPT);
      
      setCurrentMarkdown(draftMarkdown);
      setHistory([{
        version: "v1.0",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        summary: "Initial AI Draft",
        content: draftMarkdown
      }]);
      
      setShowWorkspace(true);
      showToast(t('toastSuccessGen'), "success");
      
    } catch (err: any) {
      console.error(err);
      showToast("Error generating Skill: " + err.message, "error");
    } finally {
      setIsGenerating(false);
      setLoadingStep(0);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col min-h-0 transition-all duration-300">
        
        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-brand-500/20"></span>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{t('ideaTitle')}</h2>
            </div>
          </div>

          <div className="relative">
            <textarea 
              value={idea}
              onChange={e => setIdea(e.target.value)}
              placeholder={t('ideaPlaceholder')}
              rows={4} 
              className="w-full bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500 transition shadow-inner resize-y"></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('targetAudienceLabel')}</label>
              <input 
                type="text" 
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                placeholder={t('targetAudiencePlaceholder')}
                className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('skillPurposeLabel')}</label>
              <select 
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                <option value="General">General</option>
                <option value="Productivity">Productivity</option>
                <option value="Research">Research</option>
                <option value="Education">Education</option>
                <option value="Writing">Writing</option>
                <option value="Design">Design</option>
                <option value="Coding">Coding</option>
                <option value="Business">Business</option>
                <option value="Marketing">Marketing</option>
                <option value="Data Analysis">Data Analysis</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('prefLangLabel')}</label>
              <select 
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                <option value="Indonesian">Indonesian (Bahasa Indonesia)</option>
                <option value="English">English</option>
                <option value="Bilingual">Bilingual (ID & EN)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>{t('quickExamplesLabel')}</span>
            </span>
            <button onClick={() => handlePreset('infographic')} className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700/60 transition">
              🎨 <span>{t('chipInfographic')}</span>
            </button>
            <button onClick={() => handlePreset('research')} className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700/60 transition">
              🔬 <span>{t('chipResearch')}</span>
            </button>
            <button onClick={() => handlePreset('prompt')} className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700/60 transition">
              ⚡ <span>{t('chipPrompt')}</span>
            </button>
            <button onClick={() => handlePreset('coding')} className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700/60 transition">
              💻 <span>{t('chipCoding')}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/60">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              {isGenerating ? (
                <span className="text-brand-500 dark:text-brand-400 flex items-center gap-1.5"><Loader className="w-3.5 h-3.5 animate-spin" /> {t('toastGenerating')}</span>
              ) : (
                <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> {t('readyStatus')}</span>
              )}
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white transition-colors bg-brand-600 hover:bg-brand-500 rounded disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>{t('generateBtn')}</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      {isGenerating && (
        <div className="bg-white dark:bg-slate-900 border border-brand-500/30 rounded-2xl p-6 shadow-2xl transition-all">
          <div className="flex flex-col items-center justify-center text-center py-6 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mb-4 relative">
              <Cpu className="w-7 h-7 text-brand-500 dark:text-brand-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('loadingTitle')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t('loadingSubtitle')}</p>
            
            <div className="w-full space-y-2 text-left">
              {[1, 2, 3, 4].map(step => (
                <div key={step} className={cn(
                  "flex items-center gap-3 text-xs p-2 rounded-lg border",
                  loadingStep > step ? "bg-slate-100 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300" :
                  loadingStep === step ? "bg-brand-50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800/50 text-brand-700 dark:text-brand-300" :
                  "bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400"
                )}>
                  {loadingStep > step ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                   loadingStep === step ? <Loader className="w-4 h-4 text-brand-500 animate-spin" /> :
                   <Circle className="w-4 h-4 text-slate-300 dark:text-slate-700" />}
                  <span>{t(`loadingStep${step}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
