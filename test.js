/* ============================================================
   НАЛАШТУВАННЯ
   ============================================================ */

// Google Apps Script Web App
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw7qy_3A-DjvsvxN5kqLe9L7AC7Th9oPgBpXdOFAvEqU3gbvLrf0z06bM7iMWyARV_LDw/exec";

// Telegram
// ВСТАВ СВІЙ АКТУАЛЬНИЙ ТОКЕН БОТА
const TELEGRAM_BOT_TOKEN = "8923050722:AAH66L5pmpKpUSQDnKLjB_4mYnksvMugnoo";
const TELEGRAM_CHAT_ID = "564669923";

// Telegram-групи за результатом тесту
const GROUP_1_URL = "https://t.me/+8a7XdlVsYpkxMzky";
const GROUP_2_URL = "https://t.me/+JT4xV_thmT02OGUy";

/* ============================================================ */

const form = document.getElementById("profileForm");
const questions = [...document.querySelectorAll(".question")];

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");

const formError = document.getElementById("formError");

let step = 0;

/* ============================================================
   БАЛИ
   ============================================================ */

const scores = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
};

/* ============================================================
   ТЕКСТИ ВІДПОВІДЕЙ
   ============================================================ */

const labels = {
  q1: {
    A: "Тільки починаю навчання",
    B: "Навчаюся, але вже маю базові знання з психології",
    C: "Завершую навчання або маю базову психологічну освіту",
    D: "Маю психологічну освіту та додаткову професійну підготовку",
  },

  q2: {
    A: "Ні, ще не консультував/ла",
    B: "Був досвід навчального консультування або рольових практик",
    C: "Маю невеликий досвід роботи з реальними клієнтами",
    D: "Регулярно консультую клієнтів",
  },
};

/* ============================================================
   ДОПОМІЖНІ ФУНКЦІЇ
   ============================================================ */

function checkedValues(name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(
    (input) => input.value,
  );
}

function oneValue(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

/* ============================================================
   ПЕРЕМИКАННЯ ПИТАНЬ
   ============================================================ */

function renderStep() {
  questions.forEach((question, index) => {
    question.classList.toggle("is-active", index === step);
  });

  const percent = Math.round(((step + 1) / questions.length) * 100);

  progressBar.style.width = `${percent}%`;

  progressText.textContent = `Питання ${step + 1} з ${questions.length}`;

  progressPercent.textContent = `${percent}%`;

  prevBtn.style.visibility = step === 0 ? "hidden" : "visible";

  nextBtn.style.display =
    step === questions.length - 1 ? "none" : "inline-flex";

  submitBtn.style.display =
    step === questions.length - 1 ? "inline-flex" : "none";

  formError.textContent = "";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* ============================================================
   ВАЛІДАЦІЯ
   ============================================================ */

function validateCurrent() {
  const number = step + 1;

  // Питання 1–2 — один варіант
  if (number <= 2 && !oneValue(`q${number}`)) {
    return "Оберіть один варіант відповіді.";
  }

  // Питання 3–6 — мінімум один checkbox
  if (number >= 3 && checkedValues(`q${number}`).length === 0) {
    return "Оберіть щонайменше один варіант.";
  }

  return "";
}

/* ============================================================
   КНОПКА ДАЛІ
   ============================================================ */

nextBtn.addEventListener("click", () => {
  const error = validateCurrent();

  if (error) {
    formError.textContent = error;
    return;
  }

  step += 1;

  renderStep();
});

/* ============================================================
   КНОПКА НАЗАД
   ============================================================ */

prevBtn.addEventListener("click", () => {
  if (step > 0) {
    step -= 1;

    renderStep();
  }
});

/* ============================================================
   ВИЗНАЧЕННЯ РЕЗУЛЬТАТУ
   ============================================================ */

function makeResult(score) {
  /* ------------------------------
     ГРУПА 1
     2–4 бали
     ------------------------------ */

  if (score <= 4) {
    return {
      level: "Базовий рівень",

      group: "Група 1",

      groupUrl: GROUP_1_URL,

      description:
        "Ви перебуваєте на початковому етапі професійної підготовки та/або ще не маєте достатнього практичного досвіду. Основний акцент — основи психологічного консультування, структура консультації, формування запиту, терапевтичний контакт, професійні межі, базові техніки та практичне відпрацювання навичок.",
    };
  }

  /* ------------------------------
     ГРУПА 2
     5–8 балів
     ------------------------------ */

  return {
    level: "Практичний рівень",

    group: "Група 2",

    groupUrl: GROUP_2_URL,

    description:
      "Ви маєте психологічну освіту та/або досвід консультування і вже маєте базове уявлення про професійну практику. Основний акцент — розбір складних випадків, розвиток консультативних навичок, професійна рефлексія, інтервізія та супервізійна підтримка.",
  };
}

/* ============================================================
   ФОРМУВАННЯ ДАНИХ
   ============================================================ */

function buildPayload() {
  const q1 = oneValue("q1");
  const q2 = oneValue("q2");

  const score = scores[q1] + scores[q2];

  const result = makeResult(score);

  return {
    q1,

    q2,

    q3: checkedValues("q3"),

    q4: checkedValues("q4"),

    q5: checkedValues("q5"),

    q6: checkedValues("q6"),

    score,

    level: result.level,

    group_name: result.group,
  };
}

/* ============================================================
   GOOGLE SHEETS
   ============================================================ */

async function saveToGoogleSheets(payload) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_")) {
    throw new Error("Не вказаний APPS_SCRIPT_URL");
  }

  /*
    Використовуємо URLSearchParams,
    щоб не створювати CORS preflight.
  */

  const body = new URLSearchParams({
    payload: JSON.stringify(payload),
  });

  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script HTTP ${response.status}`);
  }

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.error || "Не вдалося записати відповідь");
  }
}

/* ============================================================
   TELEGRAM BOT
   ============================================================ */

async function sendTelegram(payload) {
  if (
    !TELEGRAM_BOT_TOKEN ||
    TELEGRAM_BOT_TOKEN.includes("ВСТАВ_") ||
    !TELEGRAM_CHAT_ID
  ) {
    console.warn("Telegram не налаштований — повідомлення пропущено.");

    return;
  }

  const text = [
    "🧠 Нова анкета професійного профілю",

    "",

    `Рівень: ${payload.level}`,

    `Бали: ${payload.score} / 8`,

    `Рекомендована група: ${payload.group_name}`,

    "",

    `1. Освіта: ${labels.q1[payload.q1]}`,

    `2. Досвід: ${labels.q2[payload.q2]}`,

    "",

    `3. Категорії клієнтів:\n• ${payload.q3.join("\n• ")}`,

    "",

    `4. Напрями:\n• ${payload.q4.join("\n• ")}`,

    "",

    `5. Формат діяльності:\n• ${payload.q5.join("\n• ")}`,

    "",

    `6. Хоче поглибити:\n• ${payload.q6.join("\n• ")}`,
  ].join("\n");

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,

      text,

      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error("Telegram API error");
  }
}

/* ============================================================
   ПОКАЗ РЕЗУЛЬТАТУ
   ============================================================ */

function showResult(payload) {
  const result = makeResult(payload.score);

  /* Приховуємо тест */

  form.style.display = "none";

  const intro = document.querySelector(".quiz-intro");

  if (intro) {
    intro.style.display = "none";
  }

  const topbar = document.querySelector(".quiz-topbar");

  if (topbar) {
    topbar.style.display = "none";
  }

  const progress = document.querySelector(".progress");

  if (progress) {
    progress.style.display = "none";
  }

  /* Результат */

  document.getElementById("resultScore").textContent = payload.score;

  document.getElementById("resultTitle").textContent = result.level;

  document.getElementById("resultDescription").textContent = result.description;

  document.getElementById("resultGroup").textContent = result.group;

  /* ========================================================
     TELEGRAM GROUP BUTTON
     ======================================================== */

  let groupButton = document.getElementById("telegramGroupButton");

  /*
    Якщо кнопки ще немає в HTML —
    створюємо її автоматично.
  */

  if (!groupButton) {
    groupButton = document.createElement("a");

    groupButton.id = "telegramGroupButton";

    groupButton.className = "btn";

    groupButton.innerHTML = `
        <i class="fa-brands fa-telegram"></i>
        Приєднатися до Telegram-групи
      `;

    groupButton.target = "_blank";

    groupButton.rel = "noopener noreferrer";

    groupButton.style.marginTop = "24px";

    groupButton.style.display = "inline-flex";

    groupButton.style.alignItems = "center";

    groupButton.style.justifyContent = "center";

    groupButton.style.gap = "10px";

    const resultCard = document.getElementById("resultCard");

    resultCard.appendChild(groupButton);
  }

  /*
    ВАЖЛИВО:
    посилання залежить від результату.
  */

  groupButton.href = result.groupUrl;

  /* Показуємо картку */

  document.getElementById("resultCard").classList.add("is-visible");

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* ============================================================
   SUBMIT
   ============================================================ */

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const error = validateCurrent();

  if (error) {
    formError.textContent = error;

    return;
  }

  const payload = buildPayload();

  const originalButton = submitBtn.innerHTML;

  submitBtn.disabled = true;

  submitBtn.innerHTML = `
        <i class="fa-solid fa-circle-notch fa-spin"></i>
        Зберігаємо...
      `;

  formError.textContent = "";

  try {
    /*
        1. Записуємо результат
           у Google Sheets.
      */

    await saveToGoogleSheets(payload);

    /*
        2. Відправляємо
           результат у Telegram.

        Якщо Telegram тимчасово
        не відповість —
        тест все одно завершиться,
        бо дані вже записані
        в Google Sheets.
      */

    try {
      await sendTelegram(payload);
    } catch (telegramError) {
      console.error("Telegram:", telegramError);
    }

    /*
        3. Показуємо студенту
           його результат
           + правильну Telegram-групу.
      */

    showResult(payload);
  } catch (error) {
    console.error(error);

    formError.textContent =
      "Не вдалося зберегти відповідь. Перевірте підключення та спробуйте ще раз.";

    submitBtn.disabled = false;

    submitBtn.innerHTML = originalButton;
  }
});

/* ============================================================
   START
   ============================================================ */

renderStep();
