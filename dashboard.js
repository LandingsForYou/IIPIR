/* ============================================================
   НАЛАШТУВАННЯ
   ============================================================ */

// Той самий URL Google Apps Script Web App, що й у test.js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7qy_3A-DjvsvxN5kqLe9L7AC7Th9oPgBpXdOFAvEqU3gbvLrf0z06bM7iMWyARV_LDw/exec";

/* ============================================================ */

const loadingBox = document.getElementById("loadingBox");
const errorBox = document.getElementById("errorBox");
const refreshBtn = document.getElementById("refreshBtn");
const statsGrid = document.getElementById("statsGrid");
const groupSection = document.getElementById("groupSection");
const chartsGrid = document.getElementById("chartsGrid");

function prettyPercent(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(1).replace(".", ",");
}

function renderBars(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "bar-item";

    row.innerHTML = `
      <div class="bar-meta">
        <span class="bar-label"></span>
        <span class="bar-numbers">
          <strong>${prettyPercent(item.percent)}%</strong>
          <small>${item.count} ос.</small>
        </span>
      </div>
      <div class="bar-track"><div class="bar-fill"></div></div>
    `;

    row.querySelector(".bar-label").textContent = item.label;
    container.appendChild(row);

    requestAnimationFrame(() => {
      row.querySelector(".bar-fill").style.width = `${Math.min(Number(item.percent) || 0, 100)}%`;
    });
  });
}

function findTopInterest(data) {
  const all = ["q3", "q4", "q5", "q6"].flatMap((key) => data[key] || []);
  if (!all.length) return null;

  return all.reduce((best, current) => {
    if (!best || Number(current.percent) > Number(best.percent)) return current;
    return best;
  }, null);
}

function renderDashboard(data) {
  const total = Number(data.total || 0);
  const group1 = data.groups?.group1 || { count: 0, percent: 0 };
  const group2 = data.groups?.group2 || { count: 0, percent: 0 };
  const top = findTopInterest(data);

  document.getElementById("totalResponses").textContent = total;
  document.getElementById("group1Count").textContent = group1.count || 0;
  document.getElementById("group1Percent").textContent = prettyPercent(group1.percent);
  document.getElementById("group2Count").textContent = group2.count || 0;
  document.getElementById("group2Percent").textContent = prettyPercent(group2.percent);

  document.getElementById("topInterest").textContent = top?.label || "Поки немає даних";
  document.getElementById("topInterestPercent").textContent = prettyPercent(top?.percent || 0);

  const g1 = Number(group1.percent || 0);
  const g2 = Number(group2.percent || 0);
  document.getElementById("group1Bar").style.width = `${g1}%`;
  document.getElementById("group2Bar").style.width = `${g2}%`;
  document.getElementById("group1BarLabel").textContent = g1 > 10 ? `Група 1 · ${prettyPercent(g1)}%` : "";
  document.getElementById("group2BarLabel").textContent = g2 > 10 ? `Група 2 · ${prettyPercent(g2)}%` : "";

  renderBars("q3Chart", data.q3 || []);
  renderBars("q4Chart", data.q4 || []);
  renderBars("q5Chart", data.q5 || []);
  renderBars("q6Chart", data.q6 || []);

  const updated = data.generated_at ? new Date(data.generated_at) : new Date();
  document.getElementById("lastUpdated").textContent = updated.toLocaleString("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  statsGrid.hidden = false;
  groupSection.hidden = false;
  chartsGrid.hidden = false;
}

async function loadStatistics() {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_")) {
    errorBox.style.display = "flex";
    errorBox.textContent = "У dashboard.js потрібно вставити URL Google Apps Script Web App.";
    loadingBox.style.display = "none";
    return;
  }

  refreshBtn.disabled = true;
  loadingBox.style.display = "flex";
  errorBox.style.display = "none";

  try {
    const separator = APPS_SCRIPT_URL.includes("?") ? "&" : "?";
    const response = await fetch(`${APPS_SCRIPT_URL}${separator}action=stats&t=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "Помилка статистики");

    renderDashboard(data);
  } catch (error) {
    console.error(error);
    errorBox.style.display = "flex";
    errorBox.textContent =
      "Не вдалося завантажити статистику. Перевірте URL Apps Script, права доступу Web App і наявність листа Responses.";
  } finally {
    refreshBtn.disabled = false;
    loadingBox.style.display = "none";
  }
}

refreshBtn.addEventListener("click", loadStatistics);
loadStatistics();
