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
 */

const MAX_GENERATED_QUERIES = 50;

/**
 * @param {Object} selections - 依 FILTER_GROUPS 各 group.id 對應的目前選擇狀態
 * @returns {{queries: string[], warnings: string[]}}
 */
function buildQueries(selections) {
  const andTerms = [];
  const orGroups = []; // 每個元素是「同一分類底下彼此互斥的候選字串」陣列
  const warnings = [];

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
      const term = buildRangeTerm(group.prefix, state.min, state.max);
      if (term) andTerms.push(term);
    } else if (group.type === "toggle") {
      for (const opt of group.options) {
        const s = state[opt.value]; // "include" | "exclude" | undefined
        if (s === "include") andTerms.push(opt.value);
        else if (s === "exclude") andTerms.push(`!${opt.value}`);
      }
    } else if (group.type === "multi-or") {
      const selected = group.options
        .filter((opt) => state[opt.value])
        .map((opt) => opt.value);
      if (selected.length === 1) {
        andTerms.push(selected[0]);
      } else if (selected.length > 1) {
        orGroups.push({ groupTitle: group.title, terms: selected });
      }
    }
  }

  if (orGroups.length === 0) {
    const query = andTerms.join("&");
    return { queries: query ? [query] : [], warnings };
  }

  if (orGroups.length === 1) {
    const query = [orGroups[0].terms.join(","), ...andTerms].join("&");
    return { queries: [query], warnings };
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
  if (combos.length > MAX_GENERATED_QUERIES) {
    combos = combos.slice(0, MAX_GENERATED_QUERIES);
  }

  const groupNames = orGroups.map((g) => g.groupTitle).join("、");
  warnings.push(
    `偵測到你同時在「${groupNames}」這 ${orGroups.length} 個分類做了複選。` +
      `因為 Pokémon GO 搜尋語法不支援括號，且 OR 的優先權高於 AND，直接把它們用 & 串在一起會產生錯誤的搜尋結果。` +
      `已自動拆成 ${totalBeforeCap} 條各自獨立、邏輯正確的查詢字串，請依序使用。` +
      (totalBeforeCap > MAX_GENERATED_QUERIES
        ? `（組合數過多，僅顯示前 ${MAX_GENERATED_QUERIES} 條，建議減少勾選數量。）`
        : "")
  );

  const queries = combos.map((combo) => [...combo, ...andTerms].join("&"));
  return { queries, warnings };
}

function buildRangeTerm(prefix, min, max) {
  const hasMin = min !== undefined && min !== null && min !== "";
  const hasMax = max !== undefined && max !== null && max !== "";
  if (!hasMin && !hasMax) return null;
  if (hasMin && hasMax) return `${prefix}${min}-${max}`;
  if (hasMin) return `${prefix}${min}-`;
  return `${prefix}-${max}`;
}
