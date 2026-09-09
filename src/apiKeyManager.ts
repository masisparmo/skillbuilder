const STORAGE_KEY = 'gemini_api_keys';
const STORAGE_INDEX_KEY = 'gemini_api_key_index';

export interface ApiKeyItem {
  key: string;
  masked: string;
  isValid?: boolean | null;
  error?: string;
}

/**
 * Memecah string input berformat koma (dan/atau baris baru) menjadi array API key bersih.
 */
export function parseApiKeys(input: string): string[] {
  if (!input) return [];
  // Pisahkan berdasarkan koma dan/atau baris baru
  const rawList = input.split(/[\n,]+/);
  const cleanedList: string[] = [];
  const seen = new Set<string>();

  for (const item of rawList) {
    const trimmed = item.trim().replace(/^['"]|['"]$/g, '');
    if (trimmed.length > 5 && !seen.has(trimmed)) {
      seen.add(trimmed);
      cleanedList.push(trimmed);
    }
  }

  return cleanedList;
}

/**
 * Mengambil array API keys dari localStorage
 */
export function getApiKeys(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter(k => typeof k === 'string' && k.trim().length > 5);
    }
    return [];
  } catch (e) {
    console.error('Gagal membaca API keys dari localStorage', e);
    return [];
  }
}

/**
 * Mengambil string asli berformat koma untuk ditampilkan di form input
 */
export function getRawApiKeys(): string {
  const keys = getApiKeys();
  return keys.join(', ');
}

/**
 * Menyimpan API keys ke localStorage
 */
export function saveApiKeys(input: string | string[]): string[] {
  const keys = Array.isArray(input) ? input : parseApiKeys(input);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    // Reset index jika di luar jangkauan
    const currentIndex = getRoundRobinIndex();
    if (currentIndex >= keys.length) {
      setRoundRobinIndex(0);
    }
  } catch (e) {
    console.error('Gagal menyimpan API keys ke localStorage', e);
  }
  return keys;
}

/**
 * Menghapus seluruh API key
 */
export function clearApiKeys(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_INDEX_KEY);
  } catch (e) {
    console.error('Gagal menghapus API keys', e);
  }
}

/**
 * Mengecek apakah pengguna sudah memiliki minimal 1 API key yang valid
 */
export function hasValidApiKey(): boolean {
  return getApiKeys().length > 0;
}

/**
 * Mendapatkan index Round Robin saat ini
 */
export function getRoundRobinIndex(): number {
  try {
    const raw = localStorage.getItem(STORAGE_INDEX_KEY);
    if (raw === null) return 0;
    const num = parseInt(raw, 10);
    return isNaN(num) || num < 0 ? 0 : num;
  } catch {
    return 0;
  }
}

/**
 * Mengatur index Round Robin
 */
export function setRoundRobinIndex(index: number): void {
  try {
    localStorage.setItem(STORAGE_INDEX_KEY, String(index));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Mengambil API key berikutnya menggunakan sistem Round Robin.
 * Index akan bertambah secara memutar (modulo jumlah keys).
 */
export function getNextApiKey(): { key: string; index: number; total: number } | null {
  const keys = getApiKeys();
  if (keys.length === 0) return null;

  let currentIndex = getRoundRobinIndex();
  if (currentIndex >= keys.length) {
    currentIndex = 0;
  }

  const selectedKey = keys[currentIndex];
  const nextIndex = (currentIndex + 1) % keys.length;
  setRoundRobinIndex(nextIndex);

  return {
    key: selectedKey,
    index: currentIndex,
    total: keys.length
  };
}

/**
 * Menyamarkan API Key untuk privasi di tampilan UI
 * Contoh: AIzaSyD987...12ab
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 10) return '••••••••';
  const prefix = trimmed.slice(0, 6);
  const suffix = trimmed.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Menguji apakah suatu API Key valid dengan memanggil endpoint Gemini
 */
export async function testApiKey(key: string): Promise<{ success: boolean; message: string }> {
  if (!key || key.trim().length < 10) {
    return { success: false, message: 'Format API key tidak valid atau terlalu pendek.' };
  }

  const cleanKey = key.trim();

  // Coba verifikasi langsung ke Google Generative Language API (berjalan di GitHub Pages maupun lokal)
  try {
    const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(cleanKey)}`;
    const res = await fetch(directUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Ping test. Reply with OK' }] }]
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: data?.error?.message || `HTTP ${res.status}: API Key tidak valid.`
      };
    }

    return {
      success: true,
      message: 'API Key valid dan aktif.'
    };
  } catch (directErr: any) {
    // Fallback ke server lokal jika ada
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Ping test',
          apiKey: cleanKey
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: 'API Key valid dan aktif.' };
      }
      return {
        success: false,
        message: data.error || `HTTP ${res.status}: Gagal memvalidasi API key.`
      };
    } catch {
      return {
        success: false,
        message: directErr.message || 'Gagal tersambung ke layanan Google AI.'
      };
    }
  }
}

