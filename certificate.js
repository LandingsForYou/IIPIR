/*
  certificate.js
  Локальна форма залишається на сайті.
  Дані надсилаються POST-запитом у Google Apps Script
  через прихований iframe, без CORS.
*/

const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyWg6tVVX88iPuDtV8EHGcartbD56Ks5kMonEgwTGf9BQRhpbO129BbP_M57e2OQif5uA/exec";

// Бургер-меню
const burgerBtn = document.getElementById("burgerBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (burgerBtn && mobileMenu) {
  const menuLinks = mobileMenu.querySelectorAll("a");

  burgerBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("is-open");
    burgerBtn.classList.toggle("is-active", isOpen);
    burgerBtn.setAttribute("aria-expanded", String(isOpen));
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("is-open");
      burgerBtn.classList.remove("is-active");
      burgerBtn.setAttribute("aria-expanded", "false");
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 767) {
      mobileMenu.classList.remove("is-open");
      burgerBtn.classList.remove("is-active");
      burgerBtn.setAttribute("aria-expanded", "false");
    }
  });
}

// Форма
const certificateForm = document.getElementById("certificateForm");
const result = document.getElementById("certificateResult");
const submitButton = document.getElementById("certificateSubmit");
const submitFrame = document.getElementById("certificateSubmitFrame");

let requestInProgress = false;
let responseTimeout = null;

function showResult(message, type = "info") {
  if (!result) return;
  result.className = `certificate-result is-visible is-${type}`;
  result.innerHTML = message;
}

function setLoading(isLoading) {
  requestInProgress = isLoading;

  if (!submitButton) return;

  submitButton.disabled = isLoading;

  const label = submitButton.querySelector("span");

  if (label) {
    label.textContent = isLoading
      ? "Надсилаємо заявку..."
      : "Згенерувати заявку";
  }
}

function clearValidation() {
  certificateForm
    ?.querySelectorAll(".is-invalid")
    .forEach((element) => element.classList.remove("is-invalid"));
}

function validateCertificateForm() {
  if (!certificateForm) return false;

  clearValidation();

  const fullName = certificateForm.elements.fullName;
  const birthDate = certificateForm.elements.birthDate;
  const consent = document.getElementById("consent");

  const invalidFields = [];

  if (!fullName.value.trim() || fullName.value.trim().split(/\s+/).length < 2) {
    invalidFields.push(fullName);
  }

  if (!birthDate.value) {
    invalidFields.push(birthDate);
  }

  invalidFields.forEach((field) => field.classList.add("is-invalid"));

  if (invalidFields.length) {
    invalidFields[0].focus();
    showResult("Будь ласка, заповніть ПІБ та дату народження.", "error");
    return false;
  }

  if (!consent?.checked) {
    consent?.focus();
    showResult(
      "Підтвердьте згоду на обробку даних для оформлення сертифікату.",
      "error"
    );
    return false;
  }

  return true;
}

function sendCertificateRequest() {
  if (!certificateForm || !submitFrame || requestInProgress) return;

  const postForm = document.createElement("form");

  postForm.method = "POST";
  postForm.action = GOOGLE_APPS_SCRIPT_URL;
  postForm.target = "certificateSubmitFrame";
  postForm.style.display = "none";

  const fields = {
    fullName: certificateForm.elements.fullName.value.trim(),
    birthDate: certificateForm.elements.birthDate.value
  };

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");

    input.type = "hidden";
    input.name = name;
    input.value = value;

    postForm.appendChild(input);
  });

  document.body.appendChild(postForm);

  setLoading(true);
  showResult("Заявка надсилається. Зачекайте кілька секунд…", "info");

  if (responseTimeout) {
    clearTimeout(responseTimeout);
  }

  responseTimeout = setTimeout(() => {
    setLoading(false);
    showResult(
      "Сервіс не відповів вчасно. Спробуйте ще раз.",
      "error"
    );
  }, 20000);

  postForm.submit();
  postForm.remove();
}

certificateForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateCertificateForm()) return;

  sendCertificateRequest();
});

// Відповідь з Apps Script
window.addEventListener("message", (event) => {
  const data = event.data;

  if (
    !data ||
    typeof data !== "object" ||
    data.type !== "certificate-response"
  ) {
    return;
  }

  if (responseTimeout) {
    clearTimeout(responseTimeout);
    responseTimeout = null;
  }

  setLoading(false);

  const response = data.payload || {};

  if (response.success) {
    const number = response.certificateNumber
      ? `<br><strong>Номер сертифікату: ${escapeHtml(response.certificateNumber)}</strong>`
      : "";

    showResult(`Заявку успішно створено.${number}`, "success");
    certificateForm.reset();
    return;
  }

  showResult(
    escapeHtml(
      response.message ||
      "Не вдалося створити заявку. Спробуйте ще раз."
    ),
    "error"
  );
});

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value || "");
  return div.innerHTML;
}

certificateForm?.addEventListener("input", (event) => {
  if (event.target.classList.contains("is-invalid")) {
    event.target.classList.remove("is-invalid");
  }
});
