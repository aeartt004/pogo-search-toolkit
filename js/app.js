/**
 * UI 渲染與互動：把 data.js 的 FILTER_GROUPS 畫成表單、收集使用者輸入，
 * 呼叫 query-builder 產生搜尋字串，並串接 storage.js 做常用組合的儲存/載入。
 *
 * 兩種独立的語言設定：
 *  - pageLang（Page Language）：這個網頁本身顯示的文字，來自 js/i18n.js 的 UI_TEXT。
 *  - gameLang（Game Language）：產生出來的搜尋字串要用哪種語言的關鍵字（見 query-builder.js）。
 * 兩者互不影響，各自存在 localStorage，重新整理後會記住上次的選擇。
 */

const selections = {};
const PAGE_LANG_KEY = "pogo-toolkit-page-lang";
const GAME_LANG_KEY = "pogo-toolkit-search-lang";

let pageLang = PAGE_LANGS.includes(localStorage.getItem(PAGE_LANG_KEY))
  ? localStorage.getItem(PAGE_LANG_KEY)
  : DEFAULT_PAGE_LANG;
let gameLang = localStorage.getItem(GAME_LANG_KEY) || "zh";

function currentUI() {
  return getUiText(pageLang);
}

function initSelections() {
  for (const group of FILTER_GROUPS) {
    if (group.type === "text") {
      selections[group.id] = { value: "", family: false };
    } else if (group.type === "range") {
      selections[group.id] = { min: "", max: "" };
    } else if (group.type === "toggle") {
      selections[group.id] = {};
    } else if (group.type === "multi-or") {
      selections[group.id] = {};
    }
  }
}

// 決定某個 option 在目前 Page Language 下應該顯示的文字。
// atk/def/hpiv 三組是共用的「IV 等級（0～4）」概念，用陣列索引取字；其餘用 group.id+value 查字典。
function optionLabel(group, opt, index, gUI, UI) {
  if (group.id === "atk" || group.id === "def" || group.id === "hpiv") {
    return UI.ivTierLabels[index];
  }
  if (gUI.options && gUI.options[opt.value] !== undefined) return gUI.options[opt.value];
  return opt.value;
}

function toggleStateLabel(UI, state) {
  return UI.toggleStates[state === undefined ? "none" : state];
}

function renderForm() {
  const UI = currentUI();
  const root = document.getElementById("filter-form");
  root.innerHTML = "";
  for (const group of FILTER_GROUPS) {
    root.appendChild(renderGroup(group, UI));
  }
}

function renderGroup(group, UI) {
  const gUI = UI.groups[group.id] || {};
  const section = document.createElement("section");
  section.className = "filter-group";

  const heading = document.createElement("h3");
  heading.textContent = gUI.title || group.id;
  section.appendChild(heading);

  if (gUI.help) {
    const help = document.createElement("p");
    help.className = "help-text";
    help.textContent = gUI.help;
    section.appendChild(help);
  }

  if (group.type === "text") {
    section.appendChild(renderTextControl(group, gUI));
  } else if (group.type === "range") {
    section.appendChild(renderRangeControl(group, gUI, UI));
  } else if (group.type === "toggle") {
    section.appendChild(renderToggleControl(group, gUI, UI));
  } else if (group.type === "multi-or") {
    section.appendChild(renderMultiOrControl(group, gUI, UI));
  }

  return section;
}

function renderTextControl(group, gUI) {
  const wrap = document.createElement("div");
  wrap.className = "control control-text";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = gUI.placeholder || "";
  input.value = selections[group.id].value;
  input.addEventListener("input", () => {
    selections[group.id].value = input.value;
    refreshResults();
  });
  wrap.appendChild(input);

  if (group.familyOption) {
    const label = document.createElement("label");
    label.className = "checkbox-label";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!selections[group.id].family;
    cb.addEventListener("change", () => {
      selections[group.id].family = cb.checked;
      refreshResults();
    });
    label.appendChild(cb);
    label.append(` ${gUI.familyLabel || ""}`);
    wrap.appendChild(label);
  }

  return wrap;
}

function renderRangeControl(group, gUI, UI) {
  const wrap = document.createElement("div");
  wrap.className = "control control-range";

  const [minPh, maxPh] = gUI.placeholder || ["", ""];

  const minInput = document.createElement("input");
  minInput.type = "number";
  minInput.placeholder = minPh;
  minInput.value = selections[group.id].min || "";
  if (group.min !== undefined) minInput.min = group.min;
  if (group.max !== undefined) minInput.max = group.max;
  minInput.addEventListener("input", () => {
    selections[group.id].min = minInput.value;
    refreshResults();
  });

  const sep = document.createElement("span");
  sep.className = "range-sep";
  sep.textContent = UI.rangeSep;

  const maxInput = document.createElement("input");
  maxInput.type = "number";
  maxInput.placeholder = maxPh;
  maxInput.value = selections[group.id].max || "";
  if (group.min !== undefined) maxInput.min = group.min;
  if (group.max !== undefined) maxInput.max = group.max;
  maxInput.addEventListener("input", () => {
    selections[group.id].max = maxInput.value;
    refreshResults();
  });

  wrap.append(minInput, sep, maxInput);
  return wrap;
}

const TOGGLE_STATES = [undefined, "include", "exclude"];

function renderToggleControl(group, gUI, UI) {
  const wrap = document.createElement("div");
  wrap.className = "control control-chips";

  group.options.forEach((opt, index) => {
    const label = optionLabel(group, opt, index, gUI, UI);
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = `${label}: ${toggleStateLabel(UI, undefined)}`;
    chip.dataset.state = "none";

    chip.addEventListener("click", () => {
      const current = selections[group.id][opt.value];
      const idx = TOGGLE_STATES.indexOf(current);
      const next = TOGGLE_STATES[(idx + 1) % TOGGLE_STATES.length];
      if (next === undefined) delete selections[group.id][opt.value];
      else selections[group.id][opt.value] = next;

      const nowUI = currentUI();
      const nowLabel = optionLabel(group, opt, index, nowUI.groups[group.id] || {}, nowUI);
      chip.textContent = `${nowLabel}: ${toggleStateLabel(nowUI, next)}`;
      chip.className = "chip" + (next ? ` chip-${next}` : "");
      refreshResults();
    });

    wrap.appendChild(chip);
  });
  return wrap;
}

function renderMultiOrControl(group, gUI, UI) {
  const wrap = document.createElement("div");
  wrap.className = "control control-checkboxes";

  group.options.forEach((opt, index) => {
    const label = document.createElement("label");
    label.className = "checkbox-label";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!selections[group.id][opt.value];
    cb.addEventListener("change", () => {
      if (cb.checked) selections[group.id][opt.value] = true;
      else delete selections[group.id][opt.value];
      refreshResults();
    });
    label.appendChild(cb);
    label.append(` ${optionLabel(group, opt, index, gUI, UI)}`);
    wrap.appendChild(label);
  });
  return wrap;
}

function refreshResults() {
  const UI = currentUI();
  const { queries, warningInfo } = buildQueries(selections, gameLang);
  const resultsEl = document.getElementById("results");
  const warningsEl = document.getElementById("warnings");

  warningsEl.innerHTML = "";
  if (warningInfo) {
    const groupNames = warningInfo.groupIds
      .map((id) => (UI.groups[id] && UI.groups[id].title) || id)
      .join(UI.listSeparator || ", ");
    const text = UI.warning.conflict(
      groupNames,
      warningInfo.groupIds.length,
      warningInfo.total,
      warningInfo.capped,
      warningInfo.cap
    );
    const div = document.createElement("div");
    div.className = "warning-box";
    div.textContent = `⚠️ ${text}`;
    warningsEl.appendChild(div);
  }

  resultsEl.innerHTML = "";
  if (queries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "help-text";
    empty.textContent = UI.resultsPanel.emptyResults;
    resultsEl.appendChild(empty);
    return;
  }

  queries.forEach((q, i) => {
    const row = document.createElement("div");
    row.className = "result-row";

    const code = document.createElement("code");
    code.textContent = q || UI.resultsPanel.emptyQueryPlaceholder;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = UI.resultsPanel.copyBtn;
    btn.addEventListener("click", async () => {
      const nowUI = currentUI();
      try {
        await navigator.clipboard.writeText(q);
        btn.textContent = nowUI.resultsPanel.copiedBtn;
        setTimeout(() => (btn.textContent = nowUI.resultsPanel.copyBtn), 1200);
      } catch (e) {
        alert(nowUI.resultsPanel.copyFailAlert);
      }
    });

    if (queries.length > 1) {
      const idx = document.createElement("span");
      idx.className = "result-index";
      idx.textContent = UI.resultsPanel.resultIndex(i + 1);
      row.appendChild(idx);
    }

    row.append(code, btn);
    resultsEl.appendChild(row);
  });
}

function resetAll() {
  initSelections();
  renderForm();
  refreshResults();
}

// ---------- 已儲存組合 ----------

function renderPresets() {
  const UI = currentUI();
  const list = document.getElementById("preset-list");
  list.innerHTML = "";
  const presets = PresetStore.list();
  if (presets.length === 0) {
    const li = document.createElement("li");
    li.className = "help-text";
    li.textContent = UI.presetsPanel.emptyList;
    list.appendChild(li);
    return;
  }
  for (const preset of presets) {
    const li = document.createElement("li");
    li.className = "preset-item";

    const name = document.createElement("span");
    name.textContent = preset.name;

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.textContent = UI.presetsPanel.loadBtn;
    loadBtn.addEventListener("click", () => {
      Object.keys(selections).forEach((k) => delete selections[k]);
      Object.assign(selections, JSON.parse(JSON.stringify(preset.selections)));
      renderForm();
      applySelectionsToControls();
      refreshResults();
    });

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "danger";
    delBtn.textContent = UI.presetsPanel.deleteBtn;
    delBtn.addEventListener("click", () => {
      const nowUI = currentUI();
      if (confirm(nowUI.presetsPanel.deleteConfirm(preset.name))) {
        PresetStore.remove(preset.id);
        renderPresets();
      }
    });

    li.append(name, loadBtn, delBtn);
    list.appendChild(li);
  }
}

// 載入已儲存組合後，把 selections 的值同步回表單控制項的顯示狀態
function applySelectionsToControls() {
  const UI = currentUI();
  const root = document.getElementById("filter-form");
  const sections = root.children;
  FILTER_GROUPS.forEach((group, i) => {
    const section = sections[i];
    const gUI = UI.groups[group.id] || {};
    const state = selections[group.id];
    if (group.type === "text") {
      const input = section.querySelector("input[type=text]");
      if (input) input.value = state.value || "";
      const cb = section.querySelector("input[type=checkbox]");
      if (cb) cb.checked = !!state.family;
    } else if (group.type === "range") {
      const inputs = section.querySelectorAll("input[type=number]");
      if (inputs[0]) inputs[0].value = state.min || "";
      if (inputs[1]) inputs[1].value = state.max || "";
    } else if (group.type === "toggle") {
      const chips = section.querySelectorAll(".chip");
      group.options.forEach((opt, idx) => {
        const chip = chips[idx];
        const s = state[opt.value];
        const label = optionLabel(group, opt, idx, gUI, UI);
        chip.textContent = `${label}: ${toggleStateLabel(UI, s)}`;
        chip.className = "chip" + (s ? ` chip-${s}` : "");
      });
    } else if (group.type === "multi-or") {
      const cbs = section.querySelectorAll("input[type=checkbox]");
      group.options.forEach((opt, idx) => {
        cbs[idx].checked = !!state[opt.value];
      });
    }
  });
}

function setupSaveLoadUI() {
  document.getElementById("save-preset-btn").addEventListener("click", () => {
    const UI = currentUI();
    const name = document.getElementById("preset-name-input").value.trim();
    if (!name) {
      alert(UI.resultsPanel.presetNameRequiredAlert);
      return;
    }
    PresetStore.save(name, JSON.parse(JSON.stringify(selections)));
    document.getElementById("preset-name-input").value = "";
    renderPresets();
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    const json = PresetStore.exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pogo-toolkit-presets.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("import-input").addEventListener("change", async (e) => {
    const UI = currentUI();
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const count = PresetStore.importJSON(text);
      alert(UI.presetsPanel.importSuccess(count));
      renderPresets();
    } catch (err) {
      alert(UI.presetsPanel.importFail(err.message));
    }
    e.target.value = "";
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    const UI = currentUI();
    if (confirm(UI.resultsPanel.resetConfirm)) {
      resetAll();
    }
  });
}

// ---------- 靜態文字（標題／按鈕／說明等不隨表單重繪的部分） ----------

function applyStaticText() {
  const UI = currentUI();
  document.documentElement.lang = UI.meta.htmlLang;
  document.title = UI.meta.pageTitle;
  document.getElementById("header-title").textContent = UI.header.title;
  document.getElementById("header-subtitle").textContent = UI.header.subtitle;
  document.getElementById("results-heading").textContent = UI.resultsPanel.heading;
  document.getElementById("game-lang-label").textContent = UI.langSwitcher.gameLangLabel;
  document.getElementById("game-lang-help").textContent = UI.langSwitcher.gameLangHelp;
  document.getElementById("preset-name-input").placeholder = UI.resultsPanel.presetNamePlaceholder;
  document.getElementById("save-preset-btn").textContent = UI.resultsPanel.saveBtn;
  document.getElementById("reset-btn").textContent = UI.resultsPanel.resetBtn;
  document.getElementById("presets-heading").textContent = UI.presetsPanel.heading;
  document.getElementById("export-btn").textContent = UI.presetsPanel.exportBtn;
  document.getElementById("import-label-text").textContent = UI.presetsPanel.importLabel;
  document.getElementById("presets-help").textContent = UI.presetsPanel.helpText;
  document.getElementById("footer-text").textContent = UI.footer;
}

// ---------- 語言切換（Page Language / Game Language 各自独立） ----------

function setupLangSwitchers() {
  const pageZh = document.getElementById("page-lang-zh");
  const pageEn = document.getElementById("page-lang-en");
  pageZh.checked = pageLang === "zh";
  pageEn.checked = pageLang === "en";

  const onPageLangChange = () => {
    pageLang = pageEn.checked ? "en" : "zh";
    localStorage.setItem(PAGE_LANG_KEY, pageLang);
    applyStaticText();
    renderForm();
    applySelectionsToControls();
    refreshResults();
    renderPresets();
  };
  pageZh.addEventListener("change", onPageLangChange);
  pageEn.addEventListener("change", onPageLangChange);

  const gameZh = document.getElementById("game-lang-zh");
  const gameEn = document.getElementById("game-lang-en");
  gameZh.checked = gameLang === "zh";
  gameEn.checked = gameLang === "en";

  const onGameLangChange = () => {
    gameLang = gameEn.checked ? "en" : "zh";
    localStorage.setItem(GAME_LANG_KEY, gameLang);
    refreshResults();
  };
  gameZh.addEventListener("change", onGameLangChange);
  gameEn.addEventListener("change", onGameLangChange);
}

document.addEventListener("DOMContentLoaded", () => {
  initSelections();
  applyStaticText();
  renderForm();
  setupLangSwitchers();
  refreshResults();
  renderPresets();
  setupSaveLoadUI();
});
