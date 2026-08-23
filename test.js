/* ============================================================
   НАЛАШТУВАННЯ
   ============================================================ */

// URL Google Apps Script Web App після Deploy -> New deployment -> Web app
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw7qy_3A-DjvsvxN5kqLe9L7AC7Th9oPgBpXdOFAvEqU3gbvLrf0z06bM7iMWyARV_LDw/exec";

// Ваш існуючий Telegram bot token і chat_id
const TELEGRAM_BOT_TOKEN = "8923050722:AAH66L5pmpKpUSQDnKLjB_4mYnksvMugnoo";
const TELEGRAM_CHAT_ID = "564669923";

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

const scores = { A: 1, B: 2, C: 3, D: 4 };

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

function checkedValues(name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(
    (input) => input.value,
  );
}

function oneValue(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function renderStep() {
  questions.forEach((question, index) =>
    question.classList.toggle("is-active", index === step),
  );

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

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateCurrent() {
  const number = step + 1;

  if (number <= 2 && !oneValue(`q${number}`)) {
    return "Оберіть один варіант відповіді.";
  }

  if (number >= 3 && checkedValues(`q${number}`).length === 0) {
    return "Оберіть щонайменше один варіант.";
  }

  return "";
}

nextBtn.addEventListener("click", () => {
  const error = validateCurrent();
  if (error) {
    formError.textContent = error;
    return;
  }

  step += 1;
  renderStep();
});

prevBtn.addEventListener("click", () => {
  if (step > 0) {
    step -= 1;
    renderStep();
  }
});

function makeResult(score) {
  if (score <= 4) {
    return {
      level: "Базовий рівень",
      group: "Група 1",
      description:
        "Ви перебуваєте на початковому етапі професійної підготовки та/або ще не маєте достатнього практичного досвіду. Основний акцент — основи психологічного консультування, структура консультації, формування запиту, терапевтичний контакт, професійні межі, базові техніки та практичне відпрацювання навичок.",
    };
  }

  return {
    level: "Практичний рівень",
    group: "Група 2",
    description:
      "Ви маєте психологічну освіту та/або досвід консультування і вже маєте базове уявлення про професійну практику. Основний акцент — розбір складних випадків, розвиток консультативних навичок, професійна рефлексія, інтервізія та супервізійна підтримка.",
  };
}

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

async function saveToGoogleSheets(payload) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_")) {
    throw new Error("Не вказаний APPS_SCRIPT_URL");
  }

  // application/x-www-form-urlencoded не створює CORS preflight.
  const body = new URLSearchParams({ payload: JSON.stringify(payload) });

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

async function sendTelegram(payload) {
  if (
    !TELEGRAM_BOT_TOKEN ||
    TELEGRAM_BOT_TOKEN.includes("PASTE_") ||
    !TELEGRAM_CHAT_ID ||
    TELEGRAM_CHAT_ID.includes("PASTE_")
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
    `4. Напрями:\n• ${payload.q4.join("\n• ")}`,
    `5. Формат діяльності:\n• ${payload.q5.join("\n• ")}`,
    `6. Хоче поглибити:\n• ${payload.q6.join("\n• ")}`,
  ].join("\n");

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

function showResult(payload) {
  const result = makeResult(payload.score);

  form.style.display = "none";
  document.querySelector(".quiz-intro").style.display = "none";
  document.querySelector(".quiz-topbar").style.display = "none";
  document.querySelector(".progress").style.display = "none";

  document.getElementById("resultScore").textContent = payload.score;
  document.getElementById("resultTitle").textContent = result.level;
  document.getElementById("resultDescription").textContent = result.description;
  document.getElementById("resultGroup").textContent = result.group;
  document.getElementById("resultCard").classList.add("is-visible");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

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
  submitBtn.innerHTML =
    '<i class="fa-solid fa-circle-notch fa-spin"></i> Зберігаємо...';
  formError.textContent = "";

  try {
    // Спочатку гарантовано зберігаємо відповідь у таблицю.
    await saveToGoogleSheets(payload);

    // Telegram не повинен блокувати успішне завершення анкети,
    // якщо бот тимчасово недоступний.
    try {
      await sendTelegram(payload);
    } catch (telegramError) {
      console.error("Telegram:", telegramError);
    }

    showResult(payload);
  } catch (error) {
    console.error(error);
    formError.textContent =
      "Не вдалося зберегти відповідь. Перевірте URL Google Apps Script і його доступ, потім спробуйте ще раз.";
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalButton;
  }
});

renderStep();
