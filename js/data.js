/**
 * Pokémon GO 搜尋欄篩選定義資料 — 只放「結構」與「遊戲搜尋語法」，不放任何顯示文字。
 * 顯示文字（標題、說明、選項標籤、按鈕文字等）統一放在 js/i18n.js，依 Page Language 切換。
 *
 * group.type 說明：
 *  - "multi-or"   : 複選勾選框；使用者若選 2 個以上，這些值彼此是 OR（用逗號),
 *                   會被 query-builder 標記為「OR 群組」，可能觸發笛卡兒積拆解。
 *  - "toggle"     : 三態切換鈕（不限 / 需要 / 排除），每個選項互相獨立，用 & 疊加。
 *  - "range"      : 最小值/最大值數字輸入，組成 `prefix#-#` 這類語法。
 *  - "text"       : 自由輸入文字（物種名稱、暱稱、自訂詞等）。
 *
 * 多語系搜尋關鍵字（Game Language）：
 * Pokémon GO 會依照「遊戲畫面顯示語言」翻譯部分搜尋關鍵字（例如中文版要打「0防禦」
 * 而不是「0defense」）。因此 toggle / multi-or 的每個 option 可以額外帶一個 `zh` 欄位，
 * 代表繁體中文版本應該輸出的關鍵字；沒有 `zh` 欄位的，代表尚未確認中文版是否有不同關鍵字，
 * 暫時中英文都輸出同一個字串（例如 cp/hp/age 等縮寫、地區專有名詞等，通常不會被翻譯）。
 * range 類型的 group 若中文有不同前綴，可以加上 `zhPrefix` 欄位。
 * 實際輸出哪一種由 query-builder.js 的 buildQueries(selections, gameLang) 決定。
 *
 * option 的顯示文字（label）一律用 group.id（+ option.value 當 key）去 i18n.js 的
 * UI_TEXT[pageLang].groups[group.id].options[option.value] 查詢，這裡不重複放。
 */

const FILTER_GROUPS = [
  {
    id: "species",
    type: "text",
    familyOption: true, // 是否顯示「含整個進化家族 (+)」勾選框
  },
  {
    id: "dexnum",
    type: "range",
    prefix: "",
    min: 1,
    max: 1025,
  },
  {
    id: "star",
    type: "multi-or",
    options: [
      { value: "0*" },
      { value: "1*" },
      { value: "2*" },
      { value: "3*" },
      { value: "4*" },
    ],
  },
  {
    id: "atk",
    type: "multi-or",
    options: tierOptions("attack", "攻擊"),
  },
  {
    id: "def",
    type: "multi-or",
    options: tierOptions("defense", "防禦"), // 已由使用者實測確認：中文版要用「0防禦」而非「0defense」
  },
  {
    id: "hpiv",
    type: "multi-or",
    options: tierOptions("hp", "hp"), // hp 為縮寫，中文版目前仍可用 hp（使用者實測確認 0hp 可搜尋到）
  },
  {
    id: "cp",
    type: "range",
    prefix: "cp",
    min: 10,
    max: 9999,
  },
  {
    id: "hp",
    type: "range",
    prefix: "hp",
    min: 1,
    max: 999,
  },
  {
    id: "age",
    type: "range",
    prefix: "age",
    zhPrefix: "日數", // 官方繁中文件確認：中文版關鍵字是「日數」，不是 age 的音譯或 day
    min: 0,
    max: 3650,
  },
  {
    id: "year",
    type: "range",
    prefix: "year",
    zhPrefix: "年", // 官方文件範例：年2016
    min: 2016,
    max: 2100,
  },
  {
    id: "distance",
    type: "range",
    prefix: "distance ", // 官方文件範例含空格："distance 1000"（中英文皆有空格，跟 cp/hp/age 不同）
    zhPrefix: "距離 ", // 官方文件範例："距離 1000"
    min: 0,
    max: 20000,
  },
  {
    id: "megalevel",
    type: "range",
    prefix: "mega", // 官方文件：mega1-3，mega1=基礎級，mega2-3=高階~頂尖級
    zhPrefix: "超級", // 官方繁中文件：超級1-3
    min: 1,
    max: 3,
  },
  {
    id: "type",
    type: "multi-or",
    options: [
      "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison",
      "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
    ].map((t) => ({ value: t })),
  },
  {
    id: "region",
    type: "multi-or",
    options: [
      "kanto", "johto", "hoenn", "sinnoh", "unova", "kalos", "alola", "galar", "hisui", "paldea",
    ].map((r) => ({ value: r })),
  },
  {
    id: "buddy",
    type: "multi-or",
    options: [0, 1, 2, 3, 4, 5].map((n) => ({ value: `buddy${n}`, zh: `夥伴${n}` })),
  },
  {
    id: "special",
    type: "toggle",
    // zh 欄位皆已對照官方繁中文件逐一確認；fusion/favorite/hypertraining/background/
    // locationbackground/altcolor 為官方文件有但工具原本沒收錄的全新分類。
    // altcolor（異色）目前只在繁中文件找到，英文版文件沒有對應段落，關鍵字暫時沿用中文拼音
    // 佔位，若你的遊戲是英文介面，這個關鍵字可能無效，請自行實測。
    options: [
      { value: "shiny", zh: "亮晶晶" }, // 修正：不是「閃光」
      { value: "legendary", zh: "傳說" },
      { value: "mythical", zh: "幻" }, // 修正：不是「夢幻／幻之」，官方就是單字「幻」
      { value: "ultrabeast", zh: "究極異獸" },
      { value: "shadow", zh: "暗影" },
      { value: "purified", zh: "淨化" },
      { value: "lucky" }, // 官方繁中文件目前沒有列出對應中文關鍵字，暫時中英文皆用 lucky
      { value: "costume", zh: "特殊" }, // 修正：官方語法是「特殊」（節慶造型只是我們對它的說明文字）
      { value: "defender", zh: "防禦者" },
      { value: "favorite", zh: "我的最愛" }, // 新增：官方文件「我的最愛」
      { value: "fusion", zh: "合體" }, // 新增：合體寶可夢
      { value: "hypertraining", zh: "極限特訓" }, // 新增：正在進行極限特訓
      { value: "background", zh: "背卡" }, // 新增：擁有背卡
      { value: "locationbackground", zh: "紀念背卡" }, // 新增：擁有標記捕捉地點的紀念背卡
      { value: "altcolor", zh: "異色" }, // 新增：異色寶可夢（英文關鍵字未經官方文件證實）
    ],
  },
  {
    id: "source",
    type: "toggle",
    // raid/research/rocket/gbl/snapshot 這幾項目前找不到官方文件依據（只在社群 Wiki 出現過），
    // 中文關鍵字未知，暫時維持中英文皆輸出同一個字串，請自行實測是否還有效。
    options: [
      { value: "hatched", zh: "孵化" },
      { value: "eggsonly", zh: "只限蛋" }, // 新增：僅限蛋出寶可夢（例如波克比），跟「孵化」不同
      { value: "raid" },
      { value: "research" },
      { value: "rocket" },
      { value: "gbl" },
      { value: "traded", zh: "交換" },
      { value: "snapshot" },
    ],
  },
  {
    // 官方文件（中英文版）都沒有提到性別搜尋語法，這組關鍵字目前只有社群 Wiki 依據，
    // 未經官方文件或本次比對驗證，中文關鍵字未知，暫時中英文皆用同一字串。
    id: "gender",
    type: "toggle",
    options: ["male", "female", "genderunknown"].map((v) => ({ value: v })),
  },
  {
    id: "size",
    type: "toggle",
    options: ["xxs", "xs", "xl", "xxl"].map((v) => ({ value: v })),
  },
  {
    id: "evolution",
    type: "toggle",
    options: [
      { value: "evolve", zh: "進化" },
      { value: "evolvenew", zh: "未登錄" }, // 修正：官方語法是「未登錄」（全新進化形）
      { value: "evolvequest", zh: "任務進化" }, // 新增：透過任務進化，跟交換進化不同
      { value: "item", zh: "道具" },
      { value: "tradeevolve", zh: "交換進化" },
      { value: "megaevolve", zh: "超級進化" },
      { value: "dynamax", zh: "極巨化" },
      { value: "gigantamax", zh: "超極巨化" },
    ],
  },
  {
    id: "custom",
    type: "text",
  },
];

// 官方語法是「數字在前、關鍵字在後」，例如 0attack、1defense、2hp（不是 attack0）。
// zhSuffix 是中文版遊戲會用到的翻譯後字尾（若尚未確認就傳跟 enSuffix 一樣的字）。
function tierOptions(enSuffix, zhSuffix) {
  return [0, 1, 2, 3, 4].map((n) => ({ value: `${n}${enSuffix}`, zh: `${n}${zhSuffix}` }));
}
