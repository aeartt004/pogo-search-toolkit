/**
 * 核心邏輯：把使用者在 UI 上的選擇，組合成 Pokémon GO 搜尋欄可用的語法字串。
 *
 * 重點限制（已用研究確認）：
 *  - Pokémon GO 搜尋語法不支援括號。
 *  - OR（半形逗號 ,）的運算優先權「高於」 AND（&）。
 *    例如 "a,b&c" 會被遊戲解讀成 "(a OR b) AND c"，而不是 "a OR (b AND c)"。
 *
 * 因此：如果使用者同時在兩個以上的分類做了「複選」，代表產生了兩個以上的 OR 群組，
 * 這些 OR 群組沒辦法直接安全地用 & 串在一起（會產生錯誤結果）。
 * 解法：用笛卡兒積（cartesian product）把每個 OR 群組展開，
 * 拆成多條「內部完全沒有歧義」的查詢字串，讓使用者依序使用。
 *
 * 多語系（Game Language）：Pokémon GO 會依照遊戲畫面顯示語言翻譯部分關鍵字（例如中文版
 * 「0防禦」而非「0defense」）。buildQueries 的第二個參數 gameLang（"zh" 或 "en"）決定要
 * 輸出哪個版本，實際取用哪個字串由 termFor() / prefixFor() 決定：group/option 有提供對應
 * 語言欄位就用它，沒有就一律 fallback 回英文（value / prefix）。
 *
 * 注意：這裡不直接產生「衝突警告」的最終文字（那是 Page Language 的顯示文字），
 * 而是回傳結構化的 warningInfo，讓呼叫端（app.js）依照目前的 Page Language 自行組字。
 */

const MAX_GENERATED_QUERIES = 50;

function termFor(opt, gameLang) {
  if (gameLang === "zh" && opt.zh) return opt.zh;
  return opt.value;
}

function prefixFor(group, gameLang) {
  if (gameLang === "zh" && group.zhPrefix) return group.zhPrefix;
  return group.prefix;
}

/**
 * @param {Object} selections - 依 FILTER_GROUPS 各 group.id 對應的目前選擇狀態
 * @param {string} gameLang - "zh"（繁體中文遊戲語言）或 "en"（英文），預設 "zh"
 * @returns {{queries: string[], warningInfo: null | {groupIds: string[], total: number, capped: boolean, cap: number}}}
 */
function buildQueries(selections, gameLang = "zh") {
  const andTerms = [];
  const orGroups = []; // 每個元素是「同一分類底下彼此互斥的候選字串」陣列

  for (const group of FILTER_GROUPS) {
    const state = selections[group.id];
    if (!state) continue;

    if (group.type === "text") {
      if (group.id === "species") {
        const raw = (state.value || "").trim();
        if (raw) {
          const term = state.family ? `+${raw}` : raw;
          andTerms.push(term);
        }
      } else {
        const raw = (state.value || "").trim();
        if (raw) andTerms.push(raw);
      }
    } else if (group.type === "range") {
      const term = buildRangeTerm(prefixFor(group, gameLang), state.min, state.max);
      if (term) andTerms.push(term);
    } else if (group.type === "toggle") {
      for (const opt of group.options) {
        const s = state[opt.value]; // "include" | "exclude" | undefined
        if (s === "include") andTerms.push(termFor(opt, gameLang));
        else if (s === "exclude") andTerms.push(`!${termFor(opt, gameLang)}`);
      }
    } else if (group.type === "multi-or") {
      const selected = group.options
        .filter((opt) => state[opt.value])
        .map((opt) => termFor(opt, gameLang));
      if (selected.length === 1) {
        andTerms.push(selected[0]);
      } else if (selected.length > 1) {
        orGroups.push({ groupId: group.id, terms: selected });
      }
    }
  }

  if (orGroups.length === 0) {
    const query = andTerms.join("&");
    return { queries: query ? [query] : [], warningInfo: null };
  }

  if (orGroups.length === 1) {
    const query = [orGroups[0].terms.join(","), ...andTerms].join("&");
    return { queries: [query], warningInfo: null };
  }

  // 2 個以上的 OR 群組：用笛卡兒積展開成多條安全的查詢字串。
  let combos = [[]];
  for (const group of orGroups) {
    const next = [];
    for (const combo of combos) {
      for (const term of group.terms) {
        next.push([...combo, term]);
      }
    }
    combos = next;
  }

  const totalBeforeCap = combos.length;
  const capped = combos.length > MAX_GENERATED_QUERIES;
  if (capped) {
    combos = combos.slice(0, MAX_GENERATED_QUERIES);
  }

  const warningInfo = {
    groupIds: orGroups.map((g) => g.groupId),
    total: totalBeforeCap,
    capped,
    cap: MAX_GENERATED_QUERIES,
  };

  const queries = combos.map((combo) => [...combo, ...andTerms].join("&"));
  return { queries, warningInfo };
}

function buildRangeTerm(prefix, min, max) {
  const hasMin = min !== undefined && min !== null && min !== "";
  const hasMax = max !== undefined && max !== null && max !== "";
  if (!hasMin && !hasMax) return null;
  if (hasMin && hasMax) return `${prefix}${min}-${max}`;
  if (hasMin) return `${prefix}${min}-`;
  return `${prefix}-${max}`;
}
