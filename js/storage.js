/**
 * 已儲存篩選組合的本機儲存（v1：僅 localStorage，之後可換成 Firebase 而不動到呼叫端介面）。
 */

const STORAGE_KEY = "pogo-toolkit-presets-v1";

const PresetStore = {
  /** @returns {Array<{id:string, name:string, selections:Object, createdAt:number}>} */
  list() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("讀取已儲存組合失敗", e);
      return [];
    }
  },

  save(name, selections) {
    const presets = this.list();
    const preset = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      selections,
      createdAt: Date.now(),
    };
    presets.unshift(preset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    return preset;
  },

  remove(id) {
    const presets = this.list().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  },

  get(id) {
    return this.list().find((p) => p.id === id) || null;
  },

  exportJSON() {
    return JSON.stringify(this.list(), null, 2);
  },

  importJSON(jsonText) {
    const incoming = JSON.parse(jsonText);
    if (!Array.isArray(incoming)) throw new Error("格式錯誤：需要是一個陣列");
    const existing = this.list();
    const merged = [...incoming, ...existing];
    // 依 id 去重，保留先出現（匯入）的版本
    const seen = new Set();
    const deduped = merged.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
    return deduped.length;
  },
};
