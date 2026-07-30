/**
 * UI 渲染與互動：把 data.js 的 FILTER_GROUPS 畫成表單、收集使用者輸入、
 * 呼叫 query-builder 產生搜尋字串，並串接 storage.js 做常用組合的儲存/載入。
 */

const selections = {};

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

function renderForm() {
  const root = document.getElementById("filter-form");
  root.innerHTML = "";
  for (const group of FILTER_GROUPS) {
    root.appendChild(renderGroup(group));
  }
}

function renderGroup(group) {
  const section = document.createElement("section");
  section.className = "filter-group";

  const heading = document.createElement("h3");
  heading.textContent = group.title;
  section.appendChild(heading);

  if (group.help) {
    const help = document.createElement("p");
    help.className = "help-text";
    help.textContent = group.help;
    section.appendChild(help);
  }

  if (group.type === "text") {
    section.appendChild(renderTextControl(group));
  } else if (group.type === "range") {
    section.appendChild(renderRangeControl(group));
  } else if (group.type === "toggle") {
    section.appendChild(renderToggleControl(group));
  } else if (group.type === "multi-or") {
    section.appendChild(renderMultiOrControl(group));
  }

  return section;
}

function renderTextControl(group) {
  const wrap = document.createElement("div");
  wrap.className = "control control-text";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = group.placeholder || "";
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
    cb.addEventListener("change", () => {
      selections[group.id].family = cb.checked;
      refreshResults();
    });
    label.appendChild(cb);
    label.append(" 含整個進化家族（自動加上 + 前綴）");
    wrap.appendChild(label);
  }

  return wrap;
}

function renderRangeControl(group) {
  const wrap = document.createElement("div");
  wrap.className = "control control-range";

  const [minPh, maxPh] = group.placeholder || ["最小值", "最大值"];

  const minInput = document.createElement("input");
  minInput.type = "number";
  minInput.placeholder = minPh;
  if (group.min !== undefined) minInput.min = group.min;
  if (group.max !== undefined) minInput.max = group.max;
  minInput.addEventListener("input", () => {
    selections[group.id].min = minInput.value;
    refreshResults();
  });

  const sep = document.createElement("span");
  sep.className = "range-sep";
  sep.textContent = "～";

  const maxInput = document.createElement("input");
  maxInput.type = "number";
  maxInput.placeholder = maxPh;
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
const TOGGLE_LABELS = { undefined: "不限", include: "需要 ✓", exclude: "排除 ✕" };

function renderToggleControl(group) {
  const wrap = document.createElement("div");
  wrap.className = "control control-chips";

  for (const opt of group.options) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = `${opt.label}：${TOGGLE_LABELS[undefined]}`;
    chip.dataset.state = "none";

    chip.addEventListener("click", () => {
      const current = selections[group.id][opt.value];
      const idx = TOGGLE_STATES.indexOf(current);
      const next = TOGGLE_STATES[(idx + 1) % TOGGLE_STATES.length];
      if (next === undefined) delete selections[group.id][opt.value];
      else selections[group.id][opt.value] = next;

      chip.textContent = `${opt.label}：${TOGGLE_LABELS[next]}`;
      chip.className = "chip" + (next ? ` chip-${next}` : "");
      refreshResults();
    });

    wrap.appendChild(chip);
  }
  return wrap;
}

function renderMultiOrControl(group) {
  const wrap = document.createElement("div");
  wrap.className = "control control-checkboxes";

  for (const opt of group.options) {
    const label = document.createElement("label");
    label.className = "checkbox-label";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.addEventListener("change", () => {
      if (cb.checked) selections[group.id][opt.value] = true;
      else delete selections[group.id][opt.value];
      refreshResults();
    });
    label.appendChild(cb);
    label.append(` ${opt.label}`);
    wrap.appendChild(label);
  }
  return wrap;
}

function refreshResults() {
  const { queries, warnings } = buildQueries(selections);
  const resultsEl = document.getElementById("results");
  const warningsEl = document.getElementById("warnings");

  warningsEl.innerHTML = "";
  for (const w of warnings) {
    const div = document.createElement("div");
    div.className = "warning-box";
    div.textContent = `⚠️ ${w}`;
    warningsEl.appendChild(div);
  }

  resultsEl.innerHTML = "";
  if (queries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "help-text";
    empty.textContent = "尚未設定任何條件，請在上方勾選/輸入你要的篩選條件。";
    resultsEl.appendChild(empty);
    return;
  }

  queries.forEach((q, i) => {
    const row = document.createElement("div");
    row.className = "result-row";

    const code = document.createElement("code");
    code.textContent = q || "（空字串）";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "複製";
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(q);
        btn.textContent = "已複製 ✓";
        setTimeout(() => (btn.textContent = "複製"), 1200);
      } catch (e) {
        alert("複製失敗，請手動選取文字複製。");
      }
    });

    if (queries.length > 1) {
      const idx = document.createElement("span");
      idx.className = "result-index";
      idx.textContent = `第 ${i + 1} 條`;
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
  const list = document.getElementById("preset-list");
  list.innerHTML = "";
  const presets = PresetStore.list();
  if (presets.length === 0) {
    const li = document.createElement("li");
    li.className = "help-text";
    li.textContent = "尚未儲存任何組合。";
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
    loadBtn.textContent = "載入";
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
    delBtn.textContent = "刪除";
    delBtn.addEventListener("click", () => {
      if (confirm(`確定要刪除「${preset.name}」嗎？`)) {
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
  const root = document.getElementById("filter-form");
  const sections = root.children;
  FILTER_GROUPS.forEach((group, i) => {
    const section = sections[i];
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
        chip.textContent = `${opt.label}：${TOGGLE_LABELS[s]}`;
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
    const name = document.getElementById("preset-name-input").value.trim();
    if (!name) {
      alert("請先輸入組合名稱");
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
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const count = PresetStore.importJSON(text);
      alert(`匯入完成，目前共有 ${count} 筆已儲存組合。`);
      renderPresets();
    } catch (err) {
      alert(`匯入失敗：${err.message}`);
    }
    e.target.value = "";
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("確定要清空目前所有已勾選的條件嗎？（不會刪除已儲存的組合）")) {
      resetAll();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSelections();
  renderForm();
  refreshResults();
  renderPresets();
  setupSaveLoadUI();
});
