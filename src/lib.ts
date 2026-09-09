import * as jsyaml from 'js-yaml';

export const callGemini = async (prompt: string, systemInstruction = "", responseSchema: any = null) => {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemInstruction, schema: responseSchema })
  });
  if (!res.ok) throw new Error("API Error");
  const data = await res.json();
  
  let text = data.text || "";
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
    checks: [] as {label: string, pass: boolean}[],
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

  const fmMatch = markdownText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    try {
      const parsed = jsyaml.load(fmMatch[1]) as any;
      results.frontmatter = parsed;
      
      if (parsed && typeof parsed === 'object') {
        if (parsed.name) {
          const isValidKebab = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(parsed.name);
          results.parsedName = parsed.name;
          if (isValidKebab) {
            results.checks.push({ label: isEn ? `Valid frontmatter name: "${parsed.name}" (kebab-case)` : `Nama frontmatter valid: "${parsed.name}" (kebab-case)`, pass: true });
          } else {
            results.score -= 15;
            results.checks.push({ label: isEn ? 'Frontmatter "name" must be lowercase & kebab-case' : 'Frontmatter "name" harus lowercase & kebab-case', pass: false });
            results.issues.push(`Ubah field name "${parsed.name}" menjadi format kebab-case lowercase.`);
          }
        } else {
          results.score -= 20;
          results.checks.push({ label: isEn ? 'Missing "name" field in frontmatter' : 'Field "name" belum ada di frontmatter', pass: false });
          results.issues.push('Tambahkan field "name: <skill-name>" pada YAML frontmatter.');
        }

        if (parsed.description && parsed.description.trim().length > 10) {
          results.checks.push({ label: isEn ? 'Clear trigger & description in frontmatter' : 'Deskripsi & trigger jelas pada frontmatter', pass: true });
        } else {
          results.score -= 15;
          results.checks.push({ label: isEn ? 'Description in frontmatter is missing or too brief' : 'Deskripsi frontmatter terlalu singkat atau tidak ada', pass: false });
          results.issues.push('Tambahkan deskripsi yang jelas dan informatif pada field "description".');
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

  if (lowerContent.includes('workflow') || lowerContent.includes('langkah') || lowerContent.includes('step') || lowerContent.includes('pipeline')) {
    results.checks.push({ label: isEn ? 'Structured workflow pipeline included' : 'Alur kerja terstruktur (Workflow) tersedia', pass: true });
  } else {
    results.score -= 15;
    results.checks.push({ label: isEn ? 'Workflow pipeline is not clearly defined' : 'Alur kerja (Workflow/Steps) belum spesifik', pass: false });
    results.issues.push('Tambahkan bagian alur kerja bertahap (Workflow).');
  }

  if (lowerContent.includes('output') || lowerContent.includes('format') || lowerContent.includes('template') || lowerContent.includes('hasil')) {
    results.checks.push({ label: isEn ? 'Definitive output template & expectations' : 'Format output & template didefinisikan jelas', pass: true });
  } else {
    results.score -= 15;
    results.checks.push({ label: isEn ? 'Output format or template is not clearly specified' : 'Format output belum didefinisikan jelas', pass: false });
    results.issues.push('Tambahkan spesifikasi format output yang diharapkan.');
  }

  if (lowerContent.includes('rule') || lowerContent.includes('aturan') || lowerContent.includes('constraint') || lowerContent.includes('batasan') || lowerContent.includes('jangan')) {
    results.checks.push({ label: isEn ? 'Behavioral constraints & anti-hallucination rules' : 'Batasan perilaku & aturan anti-halusinasi lengkap', pass: true });
  } else {
    results.score -= 10;
    results.checks.push({ label: isEn ? 'Missing explicit constraints/rules' : 'Belum memiliki batasan perilaku (Constraints / Rules)', pass: false });
    results.issues.push('Tambahkan batasan eksplisit untuk mencegah kesalahan model.');
  }

  if (lowerContent.includes('quality') || lowerContent.includes('kualitas') || lowerContent.includes('checklist') || lowerContent.includes('validasi') || lowerContent.includes('standard')) {
    results.checks.push({ label: isEn ? 'Self-check quality criteria included' : 'Quality Assurance Checklist tersedia', pass: true });
  } else {
    results.score -= 10;
    results.checks.push({ label: isEn ? 'Recommended to include Quality Checklist' : 'Disarankan menyertakan Quality Assurance Checklist', pass: false });
    results.issues.push('Sertakan checklist kendali mutu sebelum memberikan respons.');
  }

  results.score = Math.max(10, Math.min(100, results.score));
  return results;
}
