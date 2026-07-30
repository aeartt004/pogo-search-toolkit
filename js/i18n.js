/**
 * 介面顯示語言字典（Page Language）。
 *
 * 這裡的語言跟 query-builder.js 的「Game Language（遊戲搜尋語法語言）」是兩件獨立的事：
 *  - Page Language 只影響「這個網頁本身」顯示的文字（標題、說明、按鈕…）。
 *  - Game Language 影響「產生出來的搜尋字串」要用哪種語言的關鍵字（例如 0防禦 / 0defense）。
 * 兩者可以任意組合，例如介面用英文、但搜尋語法輸出中文，反之亦然。
 *
 * 之後要新增日文／韓文等語言，只要在 UI_TEXT 底下新增一個對應的 key（例如 "ja"、"ko"），
 * 並在 PAGE_LANGS 陣列加上該語言即可，不需要更動任何渲染邏輯。
 */

const PAGE_LANGS = ["zh", "en"];
const DEFAULT_PAGE_LANG = "zh";

const IV_TIER_LABELS = {
  zh: ["0（IV = 0）", "1（IV 1–5）", "2（IV 6–10）", "3（IV 11–14）", "4（IV = 15，完美）"],
  en: ["0 (IV = 0)", "1 (IV 1–5)", "2 (IV 6–10)", "3 (IV 11–14)", "4 (IV = 15, Perfect)"],
};

const UI_TEXT = {
  zh: {
    meta: { pageTitle: "Pokémon GO 搜尋條件產生器", htmlLang: "zh-Hant" },
    header: {
      title: "Pokémon GO 搜尋條件產生器",
      subtitle: "勾選你要的條件，自動組出遊戲搜尋欄可以用的語法字串",
    },
    langSwitcher: {
      pageLangLabel: "Page Language",
      gameLangLabel: "Game Language（搜尋語法用字）",
      gameLangHelp:
        "因為 Pokémon GO 會依照你「遊戲畫面顯示語言」翻譯部分搜尋關鍵字（例如中文版要打「0防禦」而不是「0defense」），" +
        "請選擇跟你遊戲內設定相符的語言，這裡才會產生真的能用的語法。不確定的關鍵字目前仍會顯示英文版本。",
    },
    resultsPanel: {
      heading: "產生結果",
      emptyResults: "尚未設定任何條件，請在上方勾選/輸入你要的篩選條件。",
      emptyQueryPlaceholder: "（空字串）",
      resultIndex: (i) => `第 ${i} 條`,
      copyBtn: "複製",
      copiedBtn: "已複製 ✓",
      copyFailAlert: "複製失敗，請手動選取文字複製。",
      presetNamePlaceholder: "組合名稱，例如：低星淘汰名單",
      saveBtn: "💾 儲存這組條件",
      resetBtn: "重設",
      presetNameRequiredAlert: "請先輸入組合名稱",
      resetConfirm: "確定要清空目前所有已勾選的條件嗎？（不會刪除已儲存的組合）",
    },
    presetsPanel: {
      heading: "已儲存的組合",
      emptyList: "尚未儲存任何組合。",
      loadBtn: "載入",
      deleteBtn: "刪除",
      deleteConfirm: (name) => `確定要刪除「${name}」嗎？`,
      exportBtn: "匯出備份 (JSON)",
      importLabel: "匯入備份",
      helpText:
        "目前僅儲存在「這個瀏覽器」裡（localStorage）。換裝置或換瀏覽器不會自動同步，" +
        "可以用上面的匯出/匯入功能手動備份、搬到別的裝置。",
      importSuccess: (count) => `匯入完成，目前共有 ${count} 筆已儲存組合。`,
      importFail: (msg) => `匯入失敗：${msg}`,
    },
    footer:
      "語法規則整理自 Pokémon GO Fandom Wiki 與 Niantic 官方說明，遊戲更新後語法可能變動，若某條件用了無效果請以遊戲內實際結果為準。",
    toggleStates: { none: "不限", include: "需要 ✓", exclude: "排除 ✕" },
    rangeSep: "～",
    listSeparator: "、",
    warning: {
      conflict: (groupNames, groupCount, total, capped, cap) =>
        `偵測到你同時在「${groupNames}」這 ${groupCount} 個分類做了複選。` +
        `因為 Pokémon GO 搜尋語法不支援括號，且 OR 的優先權高於 AND，直接把它們用 & 串在一起會產生錯誤的搜尋結果。` +
        `已自動拆成 ${total} 條各自獨立、邏輯正確的查詢字串，請依序使用。` +
        (capped ? `（組合數過多，僅顯示前 ${cap} 條，建議減少勾選數量。）` : ""),
    },
    ivTierLabels: IV_TIER_LABELS.zh,
    groups: {
      species: {
        title: "物種／暱稱搜尋",
        placeholder: "例如：pikachu（僅比對名稱開頭，不支援中間比對）",
        help: "只比對名稱開頭（前綴），例如打 nitar 找不到 Tyranitar。若要找一整個進化家族，勾選下方選項會自動加上「+」前綴。",
        familyLabel: "含整個進化家族（自動加上 + 前綴）",
      },
      dexnum: {
        title: "圖鑑編號範圍",
        placeholder: ["起始編號", "結束編號"],
        help: "直接輸入數字，不用加 # 字號。例如 1-151 代表第一世代全部寶可夢。",
      },
      star: {
        title: "IV 星等",
        help: "星等是官方鑑定的整數區間，不是連續百分比，中間會有天然的百分比空隙（因為個體值只能是整數）。",
        options: {
          "0*": "0★（IV 0–49%）",
          "1*": "1★（IV 51–64%）",
          "2*": "2★（IV 67–80%）",
          "3*": "3★（IV 82–98%）",
          "4*": "4★／完美（IV 100%）",
        },
      },
      atk: { title: "個別數值 - 攻擊" },
      def: { title: "個別數值 - 防禦" },
      hpiv: { title: "個別數值 - 體力（HP IV）" },
      cp: { title: "CP 範圍", placeholder: ["最小 CP", "最大 CP"] },
      hp: { title: "HP 範圍", placeholder: ["最小 HP", "最大 HP"] },
      age: {
        title: "抓到天數（日數／age）",
        placeholder: ["最少幾天前", "最多幾天前"],
        help: "日數0＝過去 24 小時內抓到（滾動窗口，不是「今天」這種日曆天）。想找「10 天內」請填 0～10。中文遊戲介面請注意搜尋欄要打「日數」，不是「age」。",
      },
      year: { title: "抓到年份", placeholder: ["起始年份", "結束年份"] },
      distance: {
        title: "捕捉地點距離（公里）",
        placeholder: ["最短距離", "最長距離"],
        help: "以目前你所在位置為基準，計算捕捉/孵化地點的距離。官方語法「距離」後面要接空格再接數字。",
      },
      megalevel: {
        title: "超級等級（Mega Level）",
        placeholder: ["最低等級", "最高等級"],
        help: "1＝基礎級，2～3＝高階到頂尖級。範圍請填 1～3。",
      },
      type: {
        title: "屬性（可複選＝OR）",
        options: {
          normal: "一般（normal）", fire: "火（fire）", water: "水（water）", grass: "草（grass）",
          electric: "電（electric）", ice: "冰（ice）", fighting: "格鬥（fighting）", poison: "毒（poison）",
          ground: "地面（ground）", flying: "飛行（flying）", psychic: "超能力（psychic）", bug: "蟲（bug）",
          rock: "岩石（rock）", ghost: "幽靈（ghost）", dragon: "龍（dragon）", dark: "惡（dark）",
          steel: "鋼（steel）", fairy: "妖精（fairy）",
        },
      },
      region: {
        title: "地區（可複選＝OR）",
        options: {
          kanto: "關都 Kanto（第1代）", johto: "城都 Johto（第2代）", hoenn: "豐緣 Hoenn（第3代）",
          sinnoh: "神奧 Sinnoh（第4代）", unova: "合眾 Unova（第5代）", kalos: "卡洛斯 Kalos（第6代）",
          alola: "阿羅拉 Alola（第7代）", galar: "伽勒爾 Galar（第8代）", hisui: "洗翠 Hisui",
          paldea: "帕底亞 Paldea（第9代）",
        },
      },
      buddy: {
        title: "夥伴等級（可複選＝OR）",
        options: {
          buddy0: "從未設為夥伴", buddy1: "曾設為夥伴（未達好夥伴）", buddy2: "好夥伴 Good Buddy",
          buddy3: "超級夥伴 Great Buddy", buddy4: "特極夥伴 Ultra Buddy", buddy5: "至極夥伴 Best Buddy",
        },
      },
      special: {
        title: "稀有／特殊狀態",
        options: {
          shiny: "亮晶晶", legendary: "傳說", mythical: "幻", ultrabeast: "究極異獸",
          shadow: "暗影", purified: "淨化", lucky: "幸運", costume: "活動特殊造型", defender: "正在道館駐守",
          favorite: "我的最愛", fusion: "合體寶可夢", hypertraining: "極限特訓中",
          background: "擁有背卡", locationbackground: "擁有紀念背卡（含捕捉地點）", altcolor: "異色（英文語法未經官方確認）",
        },
      },
      source: {
        title: "取得來源",
        options: {
          hatched: "蛋孵化", eggsonly: "只限蛋出（如波克比）", raid: "團體戰", research: "研究任務",
          rocket: "火箭隊", gbl: "對戰聯盟獎勵", traded: "交換取得", snapshot: "GO 隨拍偷拍",
        },
      },
      gender: {
        title: "性別",
        options: { male: "雄性", female: "雌性", genderunknown: "無性別" },
      },
      size: {
        title: "體型",
        options: { xxs: "超小型 XXS", xs: "小型 XS", xl: "大型 XL", xxl: "超大型 XXL" },
      },
      evolution: {
        title: "進化／巨大化",
        options: {
          evolve: "目前可進化（糖果足夠）", evolvenew: "進化後會是新圖鑑", evolvequest: "可透過任務進化",
          item: "需要進化道具", tradeevolve: "交換進化資格", megaevolve: "可Mega進化／原始回歸",
          dynamax: "可極巨化", gigantamax: "可超極巨化",
        },
      },
      custom: {
        title: "自訂搜尋詞（進階，直接用 &串接）",
        placeholder: "例如：@crunch 或 tradeevolve 等任何官方語法",
        help: "這裡打的內容會原封不動用 & 接到整串查詢後面，適合進階玩家自行輸入招式(@)、標籤等語法。",
      },
    },
  },

  en: {
    meta: { pageTitle: "Pokémon GO Search Query Builder", htmlLang: "en" },
    header: {
      title: "Pokémon GO Search Query Builder",
      subtitle: "Check the filters you want, and it auto-builds a search string you can paste into the game's search bar.",
    },
    langSwitcher: {
      pageLangLabel: "Page Language",
      gameLangLabel: "Game Language (search syntax)",
      gameLangHelp:
        "Pokémon GO translates some search keywords depending on your game's display language " +
        "(e.g. the Chinese client needs \"0防禦\" instead of \"0defense\"). Pick the language that matches your " +
        "in-game setting so the generated syntax actually works. Keywords not yet confirmed still fall back to English.",
    },
    resultsPanel: {
      heading: "Generated Results",
      emptyResults: "No filters set yet — check or type the filters you want above.",
      emptyQueryPlaceholder: "(empty string)",
      resultIndex: (i) => `#${i}`,
      copyBtn: "Copy",
      copiedBtn: "Copied ✓",
      copyFailAlert: "Copy failed, please select and copy the text manually.",
      presetNamePlaceholder: "Preset name, e.g. Low-IV cleanup list",
      saveBtn: "💾 Save this preset",
      resetBtn: "Reset",
      presetNameRequiredAlert: "Please enter a preset name first",
      resetConfirm: "Clear all currently checked filters? (Saved presets will not be deleted.)",
    },
    presetsPanel: {
      heading: "Saved Presets",
      emptyList: "No presets saved yet.",
      loadBtn: "Load",
      deleteBtn: "Delete",
      deleteConfirm: (name) => `Delete "${name}"?`,
      exportBtn: "Export Backup (JSON)",
      importLabel: "Import Backup",
      helpText:
        "Currently only stored in this browser (localStorage). Switching device or browser will not sync automatically — " +
        "use Export/Import above to back up or move presets manually.",
      importSuccess: (count) => `Import complete — you now have ${count} saved preset(s).`,
      importFail: (msg) => `Import failed: ${msg}`,
    },
    footer:
      "Syntax rules compiled from the Pokémon GO Fandom Wiki and Niantic's official documentation. Syntax may change with game updates — " +
      "if a filter has no effect, trust the actual in-game result.",
    toggleStates: { none: "Any", include: "Require ✓", exclude: "Exclude ✕" },
    rangeSep: "–",
    listSeparator: ", ",
    warning: {
      conflict: (groupNames, groupCount, total, capped, cap) =>
        `You checked multiple options in ${groupCount} categories at once ("${groupNames}"). ` +
        `Since Pokémon GO search syntax doesn't support parentheses and OR outranks AND, joining them with & directly ` +
        `would give wrong results. Automatically split into ${total} independent, logically-correct query strings — please use them one at a time.` +
        (capped ? ` (Too many combinations — only the first ${cap} are shown; consider checking fewer options.)` : ""),
    },
    ivTierLabels: IV_TIER_LABELS.en,
    groups: {
      species: {
        title: "Species / Nickname Search",
        placeholder: "e.g. pikachu (prefix match only, no substring match)",
        help: "Matches only the start of the name (prefix), e.g. \"nitar\" won't find Tyranitar. To match a whole evolution family, check the option below to auto-add a \"+\" prefix.",
        familyLabel: "Include whole evolution family (auto-adds + prefix)",
      },
      dexnum: {
        title: "Pokédex Number Range",
        placeholder: ["Start number", "End number"],
        help: "Enter numbers directly, no # needed. E.g. 1-151 covers all of Generation 1.",
      },
      star: {
        title: "IV Star Rating",
        help: "The star rating is an official rounded integer bucket, not a continuous percentage — there are natural gaps between buckets because individual values are whole numbers.",
        options: {
          "0*": "0★ (IV 0–49%)",
          "1*": "1★ (IV 51–64%)",
          "2*": "2★ (IV 67–80%)",
          "3*": "3★ (IV 82–98%)",
          "4*": "4★ / Perfect (IV 100%)",
        },
      },
      atk: { title: "Individual Value - Attack" },
      def: { title: "Individual Value - Defense" },
      hpiv: { title: "Individual Value - Stamina (HP IV)" },
      cp: { title: "CP Range", placeholder: ["Min CP", "Max CP"] },
      hp: { title: "HP Range", placeholder: ["Min HP", "Max HP"] },
      age: {
        title: "Days Since Caught (age)",
        placeholder: ["Min days ago", "Max days ago"],
        help: "age0 = caught within the last 24 hours (a rolling window, not a calendar day). For \"within 10 days\" use 0–10.",
      },
      year: { title: "Year Caught", placeholder: ["Start year", "End year"] },
      distance: {
        title: "Catch Location Distance (km)",
        placeholder: ["Min distance", "Max distance"],
        help: "Distance between your current location and where the Pokémon was caught/hatched. Official syntax needs a space after \"distance\", e.g. \"distance 1000\".",
      },
      megalevel: {
        title: "Mega Level",
        placeholder: ["Min level", "Max level"],
        help: "1 = Base Level, 2–3 = High Level through Max Level. Enter a range of 1–3.",
      },
      type: {
        title: "Type (multi-select = OR)",
        options: {
          normal: "Normal", fire: "Fire", water: "Water", grass: "Grass", electric: "Electric",
          ice: "Ice", fighting: "Fighting", poison: "Poison", ground: "Ground", flying: "Flying",
          psychic: "Psychic", bug: "Bug", rock: "Rock", ghost: "Ghost", dragon: "Dragon",
          dark: "Dark", steel: "Steel", fairy: "Fairy",
        },
      },
      region: {
        title: "Region (multi-select = OR)",
        options: {
          kanto: "Kanto (Gen 1)", johto: "Johto (Gen 2)", hoenn: "Hoenn (Gen 3)",
          sinnoh: "Sinnoh (Gen 4)", unova: "Unova (Gen 5)", kalos: "Kalos (Gen 6)",
          alola: "Alola (Gen 7)", galar: "Galar (Gen 8)", hisui: "Hisui", paldea: "Paldea (Gen 9)",
        },
      },
      buddy: {
        title: "Buddy Level (multi-select = OR)",
        options: {
          buddy0: "Never set as buddy", buddy1: "Set as buddy but never Good Buddy", buddy2: "Good Buddy",
          buddy3: "Great Buddy", buddy4: "Ultra Buddy", buddy5: "Best Buddy",
        },
      },
      special: {
        title: "Rare / Special Status",
        options: {
          shiny: "Shiny", legendary: "Legendary", mythical: "Mythical", ultrabeast: "Ultra Beast",
          shadow: "Shadow", purified: "Purified", lucky: "Lucky", costume: "Special Event Costume", defender: "Currently defending a gym",
          favorite: "Favorite", fusion: "Fusion Pokémon", hypertraining: "Undergoing Hyper Training",
          background: "Has a background", locationbackground: "Has a location background", altcolor: "Alternate Color (zh-only, unconfirmed keyword)",
        },
      },
      source: {
        title: "Acquired From",
        options: {
          hatched: "Hatched from egg", eggsonly: "Egg-exclusive (e.g. Togepi)", raid: "Raid Battle", research: "Research Task",
          rocket: "Team GO Rocket", gbl: "GO Battle League reward", traded: "Received via trade", snapshot: "GO Snapshot photobomb",
        },
      },
      gender: {
        title: "Gender",
        options: { male: "Male", female: "Female", genderunknown: "Genderless" },
      },
      size: {
        title: "Size",
        options: { xxs: "Extra Extra Small (XXS)", xs: "Extra Small (XS)", xl: "Extra Large (XL)", xxl: "Extra Extra Large (XXL)" },
      },
      evolution: {
        title: "Evolution / Dynamax",
        options: {
          evolve: "Currently evolvable (enough candy)", evolvenew: "Evolving unlocks new dex entry", evolvequest: "Evolvable via quest",
          item: "Requires evolution item", tradeevolve: "Eligible for trade evolution", megaevolve: "Can Mega Evolve / Primal Revert",
          dynamax: "Can Dynamax", gigantamax: "Can Gigantamax",
        },
      },
      custom: {
        title: "Custom search term (advanced, appended with &)",
        placeholder: "e.g. @crunch or tradeevolve — any official syntax",
        help: "Whatever you type here is appended verbatim to the end of the full query with &. Good for advanced players entering move (@) or tag syntax.",
      },
    },
  },
};

function getUiText(pageLang) {
  return UI_TEXT[pageLang] || UI_TEXT[DEFAULT_PAGE_LANG];
}
