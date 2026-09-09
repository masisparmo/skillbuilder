import * as jsyaml from 'js-yaml';
import { getNextApiKey, getApiKeys, maskApiKey } from './apiKeyManager';

// Helper untuk pemanggilan langsung Google Generative Language API (client-side / serverless)
async function callDirectGoogleGemini(apiKey: string, prompt: string, systemInstruction = "", responseSchema: any = null): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
  
  const payload: any = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (responseSchema) {
    payload.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}: Gagal memproses permintaan`;
    throw new Error(msg);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
}

export const callGemini = async (prompt: string, systemInstruction = "", responseSchema: any = null) => {
  const allKeys = getApiKeys();
  if (allKeys.length === 0) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gemini_api_key_missing'));
    }
    throw new Error("Gemini API Key belum dimasukkan. Silakan masukkan API Key Anda.");
  }

  // Coba sejumlah keys yang tersedia (hingga semua key dicoba) jika terjadi error rate-limit atau quota
  const maxAttempts = Math.max(1, allKeys.length);
  let lastError: any = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const keyInfo = getNextApiKey();
    if (!keyInfo) break;

    try {
      let text = "";
      
      // Jika di lingkungan statis (misal GitHub Pages / custom domain), langsung panggil API client-side
      const isStaticHost = typeof window !== 'undefined' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1';

      if (isStaticHost) {
        text = await callDirectGoogleGemini(keyInfo.key, prompt, systemInstruction, responseSchema);
      } else {
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': keyInfo.key
            },
            body: JSON.stringify({
              prompt,
              systemInstruction,
              schema: responseSchema,
              apiKey: keyInfo.key
            })
          });

          if (res.status === 404) {
            text = await callDirectGoogleGemini(keyInfo.key, prompt, systemInstruction, responseSchema);
          } else {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(data.error || `HTTP ${res.status}`);
            }
            text = data.text || "";
          }
        } catch {
          // Fallback ke pemanggilan client-side jika server lokal mati
          text = await callDirectGoogleGemini(keyInfo.key, prompt, systemInstruction, responseSchema);
        }
      }

      if (text) {
        text = text.trim();
        
        // Strip markdown codeblock wrappers if present
        const codeBlockMatch = text.match(/^```[a-z]*\n([\s\S]*?)\n```$/i);
        if (codeBlockMatch) {
          text = codeBlockMatch[1];
        } else {
          // Manual fallback in case the regex didn't perfectly match
          if (text.startsWith('```')) {
            const lines = text.split('\n');
            lines.shift();
            if (lines.length > 0 && lines[lines.length - 1].trim().startsWith('```')) {
              lines.pop();
            }
            text = lines.join('\n');
          }
        }
        
        text = text.trim();

        // Force the string to start exactly at the first ---
        const frontmatterIndex = text.indexOf('---');
        if (frontmatterIndex > 0) {
          text = text.substring(frontmatterIndex);
        }
      }
      return text;
    } catch (err: any) {
      lastError = err;
      if (attempt === maxAttempts - 1) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Gagal memanggil Gemini API dengan semua API Key yang tersedia.");
};

const DB_NAME = 'SkillBuilderSparkDB';
const DB_VERSION = 1;
const STORE_NAME = 'skills';
let dbInstance: IDBDatabase | null = null;

export function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('purpose', 'purpose', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
    req.onsuccess = (e: any) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    req.onerror = (e) => reject(e);
  });
}

export async function saveSkillToDB(record: any) {
  if (!dbInstance) await initIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = dbInstance!.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item = {
      id: record.id || `skill_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: record.name || 'custom-skill',
      purpose: record.purpose || 'General',
      language: record.language || 'Indonesian',
      targetAudience: record.targetAudience || '',
      idea: record.idea || '',
      markdown: record.markdown || '',
      analysis: record.analysis || null,
      history: record.history || [],
      score: record.score || 95,
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = (err) => reject(err);
  });
}

export async function getAllSkillsFromDB(): Promise<any[]> {
  if (!dbInstance) await initIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = dbInstance!.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const sorted = (req.result || []).sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      resolve(sorted);
    };
    req.onerror = (err) => reject(err);
  });
}

export async function getSkillFromDB(id: string) {
  if (!dbInstance) await initIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = dbInstance!.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (err) => reject(err);
  });
}

export async function deleteSkillFromDB(id: string) {
  if (!dbInstance) await initIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = dbInstance!.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = (err) => reject(err);
  });
}

export async function clearAllSkillsFromDB() {
  if (!dbInstance) await initIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = dbInstance!.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = (err) => reject(err);
  });
}

export function validateSkillContent(markdownText: string, isEn: boolean) {
  const results = {
    score: 100,
    checks: [] as { label: string; pass: boolean }[],
    issues: [] as string[],
    frontmatter: null as any,
    parsedName: 'skill'
  };

  if (!markdownText || !markdownText.trim()) {
    return {
      score: 0,
      checks: [{ label: isEn ? 'File must not be empty' : 'File tidak boleh kosong', pass: false }],
      issues: [isEn ? 'SKILL.md content is empty.' : 'Isi SKILL.md kosong.'],
      frontmatter: null,
      parsedName: 'untitled-skill'
    };
  }

  // 1. YAML Frontmatter Check
  const fmMatch = markdownText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    try {
      const parsed = jsyaml.load(fmMatch[1]) as any;
      results.frontmatter = parsed;
      
      if (parsed && typeof parsed === 'object') {
        // Name Validation
        if (parsed.name) {
          const rawName = String(parsed.name).trim();
          const isValidKebab = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(rawName);
          results.parsedName = rawName;

          if (isValidKebab) {
            results.checks.push({ 
              label: isEn ? `Frontmatter "name": "${rawName}" (kebab-case)` : `Nama frontmatter valid: "${rawName}" (kebab-case)`, 
              pass: true 
            });

            // Google Guideline: Avoid vague words like helper, tools, data
            const forbiddenVagueWords = ['helper', 'tools', 'tool', 'data'];
            const nameParts = rawName.split('-');
            const hasVague = nameParts.some(p => forbiddenVagueWords.includes(p));
            if (hasVague) {
              results.score -= 10;
              results.checks.push({ 
                label: isEn ? 'Avoid vague name words (helper, tools, data)' : 'Hindari kata umum (helper, tools, data)', 
                pass: false 
              });
              results.issues.push(isEn 
                ? `Google recommends avoiding vague words like "helper", "tools", or "data" in skill names. Focus on specific action verbs.` 
                : `Panduan resmi Google menyarankan menghindari kata umum seperti "helper", "tools", atau "data". Gunakan kata kerja spesifik (contoh: plan-meal-from-recipe).`);
            } else {
              results.checks.push({ 
                label: isEn ? 'Action-focused skill name (no vague words)' : 'Nama skill berorientasi aksi (tanpa kata umum)', 
                pass: true 
              });
            }
          } else {
            results.score -= 20;
            results.checks.push({ 
              label: isEn ? 'Frontmatter "name" must be lowercase & kebab-case' : 'Frontmatter "name" harus lowercase & kebab-case', 
              pass: false 
            });
            results.issues.push(`Ubah field name "${rawName}" menjadi format lowercase kebab-case (contoh: plan-meal-from-recipe).`);
          }
        } else {
          results.score -= 25;
          results.checks.push({ label: isEn ? 'Missing "name" field in frontmatter' : 'Field "name" belum ada di frontmatter', pass: false });
          results.issues.push('Tambahkan field "name: <action-verb-kebab-case>" pada YAML frontmatter.');
        }

        // Description Validation
        if (parsed.description && String(parsed.description).trim().length > 10) {
          const descStr = String(parsed.description).trim();
          
          // Check 1024 character limit from Google
          if (descStr.length <= 1024) {
            results.checks.push({ 
              label: isEn ? `Description within 1024 chars (${descStr.length}/1024)` : `Deskripsi dalam batas 1024 karakter (${descStr.length}/1024)`, 
              pass: true 
            });
          } else {
            results.score -= 15;
            results.checks.push({ 
              label: isEn ? `Description exceeds 1024 chars (${descStr.length}/1024)` : `Deskripsi melebihi batas 1024 karakter (${descStr.length}/1024)`, 
              pass: false 
            });
            results.issues.push('Deskripsi skill melebihi batas resmi 1024 karakter dari Google.');
          }

          // Google Guideline: Include trigger situation starting with "Use when..."
          const lowerDesc = descStr.toLowerCase();
          const hasTrigger = lowerDesc.includes('use when') || lowerDesc.includes('gunakan saat') || lowerDesc.includes('gunakan ketika');
          if (hasTrigger) {
            results.checks.push({ 
              label: isEn ? 'Trigger condition included ("Use when...")' : 'Klausa pemicu tersedia ("Use when..." / "Gunakan saat...")', 
              pass: true 
            });
          } else {
            results.score -= 15;
            results.checks.push({ 
              label: isEn ? 'Missing "Use when..." trigger condition' : 'Belum menyertakan pemicu "Use when..." / "Gunakan saat..."', 
              pass: false 
            });
            results.issues.push(isEn 
              ? 'Add a trigger clause starting with "Use when..." to help Gemini Spark auto-recognize relevance.'
              : 'Sertakan klausul pemicu "Use when..." atau "Gunakan ketika..." pada deskripsi agar Gemini Spark dapat mengaktifkannya otomatis.');
          }

          // Google Guideline: Third-person capability statement
          const isFirstOrSecondPerson = /^(i can|you can|saya dapat|anda dapat|kamu dapat)/i.test(descStr);
          if (!isFirstOrSecondPerson) {
            results.checks.push({ 
              label: isEn ? 'Third-person capability statement' : 'Pernyataan kapabilitas sudut pandang orang ketiga', 
              pass: true 
            });
          } else {
            results.score -= 10;
            results.checks.push({ 
              label: isEn ? 'Avoid first/second-person in description' : 'Hindari sudut pandang orang pertama/kedua ("I can", "You can")', 
              pass: false 
            });
            results.issues.push(isEn 
              ? 'Google guidelines recommend writing descriptions in the third-person (e.g., "Categorizes...", "Designs..."), not "I can" or "You can".' 
              : 'Gunakan sudut pandang orang ketiga (contoh: "Menganalisis...", "Merancang...") bukan "Saya dapat" atau "Anda dapat".');
          }
        } else {
          results.score -= 20;
          results.checks.push({ label: isEn ? 'Description in frontmatter is missing or too brief' : 'Deskripsi frontmatter tidak ada atau terlalu singkat', pass: false });
          results.issues.push('Tambahkan deskripsi yang menjelaskan kapabilitas dan situasi pemakaian pada field "description".');
        }
      } else {
        results.score -= 30;
        results.checks.push({ label: 'Invalid YAML object in frontmatter', pass: false });
      }
    } catch (e) {
      results.score -= 35;
      results.checks.push({ label: 'YAML frontmatter syntax error', pass: false });
      results.issues.push('Perbaiki sintaks YAML frontmatter di bagian paling atas file.');
    }
  } else {
    results.score -= 40;
    results.checks.push({ label: isEn ? 'Missing YAML frontmatter (---)' : 'YAML frontmatter belum ada (---)', pass: false });
    results.issues.push('File SKILL.md wajib diawali dengan YAML frontmatter (---).');
  }

  const lowerContent = markdownText.toLowerCase();

  // 2. Structured Workflow & Checklists (Google: "Use workflows & checklists... [ ] Step 1")
  const hasWorkflow = lowerContent.includes('workflow') || lowerContent.includes('langkah') || lowerContent.includes('step') || lowerContent.includes('pipeline') || lowerContent.includes('[ ]') || lowerContent.includes('checklist');
  if (hasWorkflow) {
    results.checks.push({ label: isEn ? 'Structured workflow & checklist pipeline' : 'Alur kerja terstruktur & checklist bertahap', pass: true });
  } else {
    results.score -= 15;
    results.checks.push({ label: isEn ? 'Workflow checklist is not defined' : 'Alur kerja bertahap belum didefinisikan', pass: false });
    results.issues.push('Sertakan checklist alur kerja bertahap (contoh: - [ ] Step 1: ...).');
  }

  // 3. Output Format & Template (Google: "Use formats & output templates for specific results")
  const hasTemplate = lowerContent.includes('output') || lowerContent.includes('format') || lowerContent.includes('template') || lowerContent.includes('hasil') || markdownText.includes('```');
  if (hasTemplate) {
    results.checks.push({ label: isEn ? 'Definitive output template & formatting rules' : 'Format output & aturan template spesifik', pass: true });
  } else {
    results.score -= 15;
    results.checks.push({ label: isEn ? 'Output format or template is not specified' : 'Format output belum ditentukan', pass: false });
    results.issues.push('Tambahkan contoh template format output yang diharapkan.');
  }

  // 4. Common Mistakes to Avoid (Google: 'Add a "common mistakes" section')
  const hasMistakesSection = lowerContent.includes('common mistake') || lowerContent.includes('kesalahan umum') || lowerContent.includes('mistakes to avoid') || lowerContent.includes('hindari') || lowerContent.includes('jangan') || lowerContent.includes('prohibited') || lowerContent.includes('anti-hallucination');
  if (hasMistakesSection) {
    results.checks.push({ label: isEn ? 'Common mistakes to avoid section included' : 'Bagian kesalahan umum yang harus dihindari tersedia', pass: true });
  } else {
    results.score -= 10;
    results.checks.push({ label: isEn ? 'Recommended to include "Common Mistakes to Avoid"' : 'Disarankan menyertakan bagian "Kesalahan Umum yang Harus Dihindari"', pass: false });
    results.issues.push('Tambahkan bagian panduan kesalahan umum yang harus dihindari (Common Mistakes to Avoid).');
  }

  // 5. Handling Missing Information (Google: "Tell Gemini how to handle missing information")
  const hasMissingInfo = lowerContent.includes('missing') || lowerContent.includes('informasi kurang') || lowerContent.includes('tidak lengkap') || lowerContent.includes('ask') || lowerContent.includes('tanya') || lowerContent.includes('clarif');
  if (hasMissingInfo) {
    results.checks.push({ label: isEn ? 'Instructions for handling missing information' : 'Instruksi penanganan informasi yang kurang lengkap', pass: true });
  } else {
    results.score -= 10;
    results.checks.push({ label: isEn ? 'Recommended: rules for handling missing information' : 'Disarankan: aturan penanganan data/informasi yang kurang', pass: false });
    results.issues.push('Berikan instruksi jelas jika data input pengguna belum lengkap (misal: tanyakan klarifikasi alih-alih berasumsi).');
  }

  results.score = Math.max(10, Math.min(100, results.score));
  return results;
}
