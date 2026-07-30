/**
 * Pokémon GO 搜尋欄篩選定義資料。
 * 每一種篩選分類（group）描述了在 UI 上要怎麼呈現，以及要怎麼組成搜尋語法字串。
 *
 * group.type 說明：
 *  - "multi-or"   : 複選勾選框；使用者若選 2 個以上，這些值彼此是 OR（用逗號),
 *                   會被 query-builder 標記為「OR 群組」，可能觸發笛卡兒積拆解。
 *  - "toggle"     : 三態切換鈕（不限 / 需要 / 排除），每個選項互相獨立，用 & 疊加。
 *  - "range"      : 最小值/最大值數字輸入，組成 `prefix#-#` 這類語法。
 *  - "text"       : 自由輸入文字（物種名稱、暱稱、自訂詞等）。
 */

const FILTER_GROUPS = [
  {
    id: "species",
    title: "物種／暱稱搜尋",
    type: "text",
    placeholder: "例如：pikachu（僅比對名稱開頭，不支援中間比對）",
    familyOption: true, // 是否顯示「含整個進化家族 (+)」勾選框
    help: "只比對名稱開頭（前綴），例如打 nitar 找不到 Tyranitar。若要找一整個進化家族，勾選下方選項會自動加上「+」前綴。",
  },
  {
    id: "dexnum",
    title: "圖鑑編號範圍",
    type: "range",
    prefix: "",
    min: 1,
    max: 1025,
    placeholder: ["起始編號", "結束編號"],
    help: "直接輸入數字，不用加 # 字號。例如 1-151 代表第一世代全部寶可夢。",
  },
  {
    id: "star",
    title: "IV 星等",
    type: "multi-or",
    options: [
      { value: "0*", label: "0★（IV 0–49%）" },
      { value: "1*", label: "1★（IV 51–64%）" },
      { value: "2*", label: "2★（IV 67–80%）" },
      { value: "3*", label: "3★（IV 82–98%）" },
      { value: "4*", label: "4★／完美（IV 100%）" },
    ],
    help: "星等是官方鑑定的整數區間，不是連續百分比，中間會有天然的百分比空隙（因為個體值只能是整數）。",
  },
  {
    id: "atk",
    title: "個別數值 - 攻擊",
    type: "multi-or",
    keywordSuffix: "attack",
    options: tierOptions("attack"),
  },
  {
    id: "def",
    title: "個別數值 - 防禦",
    type: "multi-or",
    keywordSuffix: "defense",
    options: tierOptions("defense"),
  },
  {
    id: "hpiv",
    title: "個別數值 - 體力（HP IV）",
    type: "multi-or",
    keywordSuffix: "hp",
    options: tierOptions("hp"),
  },
  {
    id: "cp",
    title: "CP 範圍",
    type: "range",
    prefix: "cp",
    min: 10,
    max: 9999,
    placeholder: ["最小 CP", "最大 CP"],
  },
  {
    id: "hp",
    title: "HP 範圍",
    type: "range",
    prefix: "hp",
    min: 1,
    max: 999,
    placeholder: ["最小 HP", "最大 HP"],
  },
  {
    id: "age",
    title: "抓到天數（age）",
    type: "range",
    prefix: "age",
    min: 0,
    max: 3650,
    placeholder: ["最少幾天前", "最多幾天前"],
    help: "age0＝過去 24 小時內抓到（滾動窗口，不是「今天」這種日曆天）。想找「10 天內」請填 0～10。",
  },
  {
    id: "year",
    title: "抓到年份",
    type: "range",
    prefix: "year",
    min: 2016,
    max: 2100,
    placeholder: ["起始年份", "結束年份"],
  },
  {
    id: "distance",
    title: "捕捉地點距離（公里）",
    type: "range",
    prefix: "distance",
    min: 0,
    max: 20000,
    placeholder: ["最短距離", "最長距離"],
    help: "以目前你所在位置為基準，計算捕捉/孵化地點的距離。",
  },
  {
    id: "type",
    title: "屬性（可複選＝OR）",
    type: "multi-or",
    options: [
      "normal","fire","water","grass","electric","ice","fighting","poison",
      "ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy",
    ].map((t) => ({ value: t, label: typeLabel(t) })),
  },
  {
    id: "region",
    title: "地區（可複選＝OR）",
    type: "multi-or",
    options: [
      { value: "kanto", label: "關都 Kanto（第1代）" },
      { value: "johto", label: "城都 Johto（第2代）" },
      { value: "hoenn", label: "豐緣 Hoenn（第3代）" },
      { value: "sinnoh", label: "神奧 Sinnoh（第4代）" },
      { value: "unova", label: "合眾 Unova（第5代）" },
      { value: "kalos", label: "卡洛斯 Kalos（第6代）" },
      { value: "alola", label: "阿羅拉 Alola（第7代）" },
      { value: "galar", label: "伽勒爾 Galar（第8代）" },
      { value: "hisui", label: "洗翠 Hisui" },
      { value: "paldea", label: "帕底亞 Paldea（第9代）" },
    ],
  },
  {
    id: "buddy",
    title: "夥伴等級（可複選＝OR）",
    type: "multi-or",
    options: [
      { value: "buddy0", label: "從未設為夥伴" },
      { value: "buddy1", label: "曾設為夥伴（未達好夥伴）" },
      { value: "buddy2", label: "好夥伴 Good Buddy" },
      { value: "buddy3", label: "超級夥伴 Great Buddy" },
      { value: "buddy4", label: "特極夥伴 Ultra Buddy" },
      { value: "buddy5", label: "至極夥伴 Best Buddy" },
    ],
  },
  {
    id: "special",
    title: "稀有／特殊狀態",
    type: "toggle",
    options: [
      { value: "shiny", label: "閃光" },
      { value: "legendary", label: "傳說" },
      { value: "mythical", label: "夢幻／幻之" },
      { value: "ultrabeast", label: "究極異獸" },
      { value: "shadow", label: "暗影" },
      { value: "purified", label: "淨化" },
      { value: "lucky", label: "幸運" },
      { value: "costume", label: "節慶造型" },
      { value: "defender", label: "正在道館駐守" },
    ],
  },
  {
    id: "source",
    title: "取得來源",
    type: "toggle",
    options: [
      { value: "hatched", label: "蛋孵化" },
      { value: "raid", label: "團體戰" },
      { value: "research", label: "研究任務" },
      { value: "rocket", label: "火箭隊" },
      { value: "gbl", label: "對戰聯盟獎勵" },
      { value: "traded", label: "交換取得" },
      { value: "snapshot", label: "GO 隨拍偷拍" },
    ],
  },
  {
    id: "gender",
    title: "性別",
    type: "toggle",
    options: [
      { value: "male", label: "雄性" },
      { value: "female", label: "雌性" },
      { value: "genderunknown", label: "無性別" },
    ],
  },
  {
    id: "size",
    title: "體型",
    type: "toggle",
    options: [
      { value: "xxs", label: "超小型 XXS" },
      { value: "xs", label: "小型 XS" },
      { value: "xl", label: "大型 XL" },
      { value: "xxl", label: "超大型 XXL" },
    ],
  },
  {
    id: "evolution",
    title: "進化／巨大化",
    type: "toggle",
    options: [
      { value: "evolve", label: "目前可進化（糖果足夠）" },
      { value: "evolvenew", label: "進化後會是新圖鑑" },
      { value: "item", label: "需要進化道具" },
      { value: "tradeevolve", label: "交換進化資格" },
      { value: "megaevolve", label: "可Mega進化／原始回歸" },
      { value: "dynamax", label: "可極巨化" },
      { value: "gigantamax", label: "可超極巨化" },
    ],
  },
  {
    id: "custom",
    title: "自訂搜尋詞（進階，直接用 &串接）",
    type: "text",
    placeholder: "例如：@crunch 或 tradeevolve 等任何官方語法",
    help: "這裡打的內容會原封不動用 & 接到整串查詢後面，適合進階玩家自行輸入招式(@)、標籤等語法。",
  },
];

function tierOptions(_suffixUnused) {
  return [
    { value: "0", label: "0（IV = 0）" },
    { value: "1", label: "1（IV 1–5）" },
    { value: "2", label: "2（IV 6–10）" },
    { value: "3", label: "3（IV 11–14）" },
    { value: "4", label: "4（IV = 15，完美）" },
  ];
}

function typeLabel(t) {
  const zh = {
    normal: "一般", fire: "火", water: "水", grass: "草", electric: "電",
    ice: "冰", fighting: "格鬥", poison: "毒", ground: "地面", flying: "飛行",
    psychic: "超能力", bug: "蟲", rock: "岩石", ghost: "幽靈", dragon: "龍",
    dark: "惡", steel: "鋼", fairy: "妖精",
  };
  return `${zh[t] || t}（${t}）`;
}
