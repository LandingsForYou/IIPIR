const burgerBtn = document.getElementById("burgerBtn");
const mobileMenu = document.getElementById("mobileMenu");
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

const slider = document.querySelector("#teachersSlider");

if (slider) {
  const track = slider.querySelector(".slider-track");
  const slides = Array.from(slider.querySelectorAll(".person-card"));
  const prevBtn = slider.querySelector(".slider-arrow--prev");
  const nextBtn = slider.querySelector(".slider-arrow--next");
  const dotsWrap = slider.querySelector(".slider-dots");

  let currentIndex = 0;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let isDragging = false;
  let visibleSlides = getVisibleSlides();
  let maxIndex = Math.max(0, slides.length - visibleSlides);

  function getVisibleSlides() {
    if (window.innerWidth <= 767) return 1;
    if (window.innerWidth <= 991) return 2;
    return 3;
  }

  function updateSizes() {
    visibleSlides = getVisibleSlides();
    maxIndex = Math.max(0, slides.length - visibleSlides);

    if (currentIndex > maxIndex) {
      currentIndex = maxIndex;
    }

    createDots();
    updateSlider();
  }

  function getSlideStep() {
    if (slides.length < 2) return slides[0].offsetWidth;

    const slideWidth = slides[0].offsetWidth;
    const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
    return slideWidth + gap;
  }

  function updateSlider() {
    const step = getSlideStep();
    currentTranslate = -(currentIndex * step);
    prevTranslate = currentTranslate;
    track.style.transform = `translateX(${currentTranslate}px)`;

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;

    const dots = dotsWrap.querySelectorAll(".slider-dot");
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentIndex);
    });
  }

  function createDots() {
    const totalDots = maxIndex + 1;
    dotsWrap.innerHTML = "";

    for (let i = 0; i < totalDots; i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "slider-dot";
      dot.setAttribute("aria-label", `Перейти до слайда ${i + 1}`);
      dot.addEventListener("click", () => {
        currentIndex = i;
        updateSlider();
      });
      dotsWrap.appendChild(dot);
    }
  }

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateSlider();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentIndex < maxIndex) {
      currentIndex++;
      updateSlider();
    }
  });

  function touchStart(index) {
    return function (event) {
      isDragging = true;
      startX = getPositionX(event);
      track.style.transition = "none";
    };
  }

  function touchMove(event) {
    if (!isDragging) return;
    const currentPosition = getPositionX(event);
    const moved = currentPosition - startX;
    currentTranslate = prevTranslate + moved;
    track.style.transform = `translateX(${currentTranslate}px)`;
  }

  function touchEnd() {
    if (!isDragging) return;
    isDragging = false;

    const movedBy = currentTranslate - prevTranslate;
    track.style.transition = "transform 0.45s ease";

    if (movedBy < -80 && currentIndex < maxIndex) {
      currentIndex++;
    }

    if (movedBy > 80 && currentIndex > 0) {
      currentIndex--;
    }

    updateSlider();
  }

  function getPositionX(event) {
    return event.type.includes("mouse")
      ? event.pageX
      : event.touches[0].clientX;
  }

  slides.forEach((slide, index) => {
    slide.addEventListener("dragstart", (e) => e.preventDefault());

    slide.addEventListener("touchstart", touchStart(index), { passive: true });
    slide.addEventListener("touchmove", touchMove, { passive: true });
    slide.addEventListener("touchend", touchEnd);

    slide.addEventListener("mousedown", touchStart(index));
    slide.addEventListener("mousemove", touchMove);
    slide.addEventListener("mouseup", touchEnd);
    slide.addEventListener("mouseleave", () => {
      if (isDragging) touchEnd();
    });
  });

  window.addEventListener("resize", updateSizes);

  createDots();
  updateSizes();
}

const teacherModal = document.getElementById("teacherModal");
const teacherModalTitle = document.getElementById("teacherModalTitle");
const certsTrack = document.querySelector(".teacher-certs-track");
const certsDots = document.querySelector(".teacher-certs-dots");
const certPrev = document.querySelector(".teacher-certs-arrow--prev");
const certNext = document.querySelector(".teacher-certs-arrow--next");

const teacherCards = document.querySelectorAll(".person-card");
const closeModalElements = document.querySelectorAll("[data-close-modal]");

let certIndex = 0;
let certSlides = [];
let certStartX = 0;
let certCurrentTranslate = 0;
let certPrevTranslate = 0;
let certDragging = false;

function openTeacherModal(card) {
  teacherModalTitle.textContent = card.dataset.teacherName || "";

  const certs = [];
  let i = 1;

  while (card.dataset[`cert${i}`]) {
    certs.push(card.dataset[`cert${i}`]);
    i++;
  }

  buildCertSlider(certs, card.dataset.teacherName || "");
  teacherModal.classList.add("is-open");
  teacherModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeTeacherModal() {
  teacherModal.classList.remove("is-open");
  teacherModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function buildCertSlider(images, teacherName) {
  certsTrack.innerHTML = "";
  certsDots.innerHTML = "";
  certIndex = 0;

  images.forEach((src, index) => {
    const slide = document.createElement("div");
    slide.className = "teacher-cert-slide";
    slide.innerHTML = `<img src="${src}" alt="Сертифікат ${index + 1} - ${teacherName}">`;
    certsTrack.appendChild(slide);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "teacher-certs-dot";
    dot.addEventListener("click", () => {
      certIndex = index;
      updateCertSlider();
    });
    certsDots.appendChild(dot);
  });

  certSlides = Array.from(document.querySelectorAll(".teacher-cert-slide"));
  updateCertSlider();
}

function updateCertSlider() {
  if (!certSlides.length) return;

  const slideWidth = certSlides[0].offsetWidth;
  const gap = parseFloat(window.getComputedStyle(certsTrack).gap) || 0;
  const step = slideWidth + gap;

  certCurrentTranslate = -(certIndex * step);
  certPrevTranslate = certCurrentTranslate;
  certsTrack.style.transform = `translateX(${certCurrentTranslate}px)`;

  certPrev.disabled = certIndex === 0;
  certNext.disabled = certIndex === certSlides.length - 1;

  const dots = certsDots.querySelectorAll(".teacher-certs-dot");
  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === certIndex);
  });
}

certPrev.addEventListener("click", () => {
  if (certIndex > 0) {
    certIndex--;
    updateCertSlider();
  }
});

certNext.addEventListener("click", () => {
  if (certIndex < certSlides.length - 1) {
    certIndex++;
    updateCertSlider();
  }
});

teacherCards.forEach((card) => {
  const btn = card.querySelector(".card-docs-btn");
  if (btn) {
    btn.addEventListener("click", () => openTeacherModal(card));
  }
});

closeModalElements.forEach((el) => {
  el.addEventListener("click", closeTeacherModal);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && teacherModal.classList.contains("is-open")) {
    closeTeacherModal();
  }
});

window.addEventListener("resize", () => {
  if (teacherModal.classList.contains("is-open")) {
    updateCertSlider();
  }
});

function getPositionX(event) {
  return event.type.includes("mouse") ? event.pageX : event.touches[0].clientX;
}

function certTouchStart(event) {
  certDragging = true;
  certStartX = getPositionX(event);
  certsTrack.style.transition = "none";
}

function certTouchMove(event) {
  if (!certDragging) return;
  const currentPosition = getPositionX(event);
  const moved = currentPosition - certStartX;
  certCurrentTranslate = certPrevTranslate + moved;
  certsTrack.style.transform = `translateX(${certCurrentTranslate}px)`;
}

function certTouchEnd() {
  if (!certDragging) return;
  certDragging = false;
  certsTrack.style.transition = "transform 0.4s ease";

  const movedBy = certCurrentTranslate - certPrevTranslate;

  if (movedBy < -70 && certIndex < certSlides.length - 1) {
    certIndex++;
  }

  if (movedBy > 70 && certIndex > 0) {
    certIndex--;
  }

  updateCertSlider();
}

certsTrack.addEventListener("touchstart", certTouchStart, { passive: true });
certsTrack.addEventListener("touchmove", certTouchMove, { passive: true });
certsTrack.addEventListener("touchend", certTouchEnd);

certsTrack.addEventListener("mousedown", certTouchStart);
certsTrack.addEventListener("mousemove", certTouchMove);
certsTrack.addEventListener("mouseup", certTouchEnd);
certsTrack.addEventListener("mouseleave", () => {
  if (certDragging) certTouchEnd();
});

const offerModal = document.getElementById("offerModal");
const companyModal = document.getElementById("companyModal");
const legalOpenButtons = document.querySelectorAll("[data-open-legal]");
const legalCloseButtons = document.querySelectorAll("[data-close-legal]");

function openLegalModal(type) {
  if (type === "offer") {
    offerModal?.classList.add("is-open");
    offerModal?.setAttribute("aria-hidden", "false");
  }

  if (type === "company") {
    companyModal?.classList.add("is-open");
    companyModal?.setAttribute("aria-hidden", "false");
  }

  document.body.style.overflow = "hidden";
}

function closeLegalModals() {
  offerModal?.classList.remove("is-open");
  companyModal?.classList.remove("is-open");
  offerModal?.setAttribute("aria-hidden", "true");
  companyModal?.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

legalOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openLegalModal(button.dataset.openLegal);
  });
});

legalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeLegalModals);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLegalModals();
  }
});

const courseToggleButtons = document.querySelectorAll(".course-toggle-btn");

courseToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const courseCard = button.closest(".course-card");
    const details = courseCard.querySelector(".course-details");

    if (!details) return;

    const isOpen = details.classList.toggle("is-open");

    // 🔥 ОЦЕ НОВЕ
    courseCard.classList.toggle("is-open", isOpen);

    button.setAttribute("aria-expanded", String(isOpen));
    button.textContent = isOpen ? "Сховати" : "Дізнатись більше";
  });
});
