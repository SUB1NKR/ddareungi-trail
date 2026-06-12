const adaptivePopup = document.querySelector("#adaptivePopup");
const startButton = document.querySelector("#startButton");

const loadingPage = document.querySelector("#loading");
const slides = document.querySelectorAll(".safety-slide");
const loadingFill = document.querySelector("#loadingFill");

const gnb = document.querySelector("#gnb");
const menuButton = document.querySelector("#menuButton");
const menuPanel = document.querySelector("#menuPanel");

const scrollGuide = document.querySelector("#scrollGuide");
const frameImage = document.querySelector("#frameImage");
const endCta = document.querySelector("#endCta");

const slideInterval = 2000;
const totalLoadingTime = slides.length * slideInterval;
const menuDuration = 780;

/*
  프레임 이미지 설정
  사진을 더 추가하면 frameCount만 바꾸면 됩니다.

  예:
  BX사이트000.webp ~ BX사이트361.webp = 362
  BX사이트000.webp ~ BX사이트499.webp = 500
*/
const frameCount = 100;
const frameStartIndex = 0;
const framePath = "./assets/frames/";
const framePrefix = "BX사이트";
const frameExtension = ".webp";

/*
  자동재생 설정
  0번부터 150번까지 5초 동안 자동 재생됩니다.
*/
const autoPlayEndFrame = 150;
const autoPlayDuration = 5000;

/*
  휠 / 키보드 / 터치 감도
  너무 빠르면 wheelSensitivity와 maxWheelDelta를 더 낮추면 됩니다.
*/
const wheelSensitivity = 0.00012;
const maxWheelDelta = 0.006;
const keyStep = 0.006;
const touchSensitivity = 0.00035;

let currentSlideIndex = 0;
let slideTimer = null;
let scrollGuideTimer = null;

let isPageReady = false;
let isMenuOpen = false;
let isMenuClosing = false;
let isAutoPlaying = false;

let progress = 0;
let currentFrameIndex = -1;
let touchStartY = 0;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getFrameSrc(index) {
  const frameNumber = String(frameStartIndex + index).padStart(3, "0");
  return `${framePath}${framePrefix}${frameNumber}${frameExtension}`;
}

function shouldBlockFrameControl() {
  return !isPageReady || isMenuOpen || isMenuClosing || isAutoPlaying;
}

function preloadFrames() {
  for (let index = 0; index < frameCount; index += 1) {
    const image = new Image();
    image.src = getFrameSrc(index);
  }
}

function setFrame(index) {
  if (!frameImage) return;

  const safeIndex = clamp(index, 0, frameCount - 1);

  if (safeIndex === currentFrameIndex) return;

  currentFrameIndex = safeIndex;
  frameImage.src = getFrameSrc(currentFrameIndex);

  updateEndCta();
}

function updateFrame() {
  const nextFrameIndex = Math.round(progress * (frameCount - 1));
  setFrame(nextFrameIndex);
}

function updateEndCta() {
  if (!endCta) return;

  if (currentFrameIndex >= frameCount - 1) {
    endCta.classList.add("is-visible");
    endCta.setAttribute("aria-hidden", "false");
    hideScrollGuide();
    return;
  }

  endCta.classList.remove("is-visible");
  endCta.setAttribute("aria-hidden", "true");
}

function changeProgress(delta) {
  progress = clamp(progress + delta, 0, 1);
  updateFrame();

  if (currentFrameIndex < frameCount - 1) {
    hideScrollGuide();
    restartScrollGuideTimer();
  }
}

function hideGnbByDirection() {
  if (!gnb || isMenuOpen || isMenuClosing) return;

  gnb.classList.remove("is-visible");
  gnb.classList.add("is-hidden");
}

function showGnbByDirection() {
  if (!gnb || isMenuOpen || isMenuClosing) return;

  gnb.classList.remove("is-hidden");
  gnb.classList.add("is-visible");
}

function handleWheel(event) {
  event.preventDefault();

  if (shouldBlockFrameControl()) return;

  const isScrollDown = event.deltaY > 0;
  const isScrollUp = event.deltaY < 0;

  if (isScrollDown) {
    hideGnbByDirection();
  }

  if (isScrollUp) {
    showGnbByDirection();
  }

  const rawDelta = event.deltaY * wheelSensitivity;
  const limitedDelta = clamp(rawDelta, -maxWheelDelta, maxWheelDelta);

  changeProgress(limitedDelta);
}

function handleKeydown(event) {
  const nextKeys = ["ArrowDown", "PageDown", " "];
  const prevKeys = ["ArrowUp", "PageUp"];
  const controlKeys = [...nextKeys, ...prevKeys, "Home", "End"];

  if (!controlKeys.includes(event.key)) return;

  event.preventDefault();

  if (shouldBlockFrameControl()) return;

  if (nextKeys.includes(event.key)) {
    hideGnbByDirection();
    changeProgress(keyStep);
  }

  if (prevKeys.includes(event.key)) {
    showGnbByDirection();
    changeProgress(-keyStep);
  }

  if (event.key === "Home") {
    progress = 0;
    showGnbByDirection();
    updateFrame();
    showScrollGuide();
  }

  if (event.key === "End") {
    progress = 1;
    hideGnbByDirection();
    updateFrame();
  }
}

function handleTouchStart(event) {
  if (!event.touches || event.touches.length === 0) return;
  touchStartY = event.touches[0].clientY;
}

function handleTouchMove(event) {
  event.preventDefault();

  if (shouldBlockFrameControl()) return;
  if (!event.touches || event.touches.length === 0) return;

  const currentY = event.touches[0].clientY;
  const deltaY = touchStartY - currentY;

  touchStartY = currentY;

  if (deltaY > 0) {
    hideGnbByDirection();
  }

  if (deltaY < 0) {
    showGnbByDirection();
  }

  changeProgress(deltaY * touchSensitivity);
}

function startFrameSequence() {
  if (!frameImage) return;

  setFrame(0);
  preloadFrames();

  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("touchstart", handleTouchStart, { passive: false });
  window.addEventListener("touchmove", handleTouchMove, { passive: false });

  startIntroAutoPlay();
}

function startIntroAutoPlay() {
  isAutoPlaying = true;
  hideScrollGuide();

  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const rawProgress = clamp(elapsed / autoPlayDuration, 0, 1);
    const easedProgress = easeInOutCubic(rawProgress);

    const frameIndex = Math.round(easedProgress * autoPlayEndFrame);

    setFrame(frameIndex);

    if (rawProgress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    progress = autoPlayEndFrame / (frameCount - 1);
    setFrame(autoPlayEndFrame);

    isAutoPlaying = false;
    showScrollGuide();
    restartScrollGuideTimer();
  }

  requestAnimationFrame(animate);
}

function startLoading() {
  adaptivePopup.classList.add("is-hidden");

  setTimeout(() => {
    adaptivePopup.style.display = "none";
    loadingPage.classList.add("is-running");

    runLoadingProgress();
    runSafetySlides();
  }, 600);
}

function runLoadingProgress() {
  const startTime = performance.now();

  function updateProgress(currentTime) {
    const elapsed = currentTime - startTime;
    const rawProgress = Math.min(elapsed / totalLoadingTime, 1);
    const easedProgress = easeInOutCubic(rawProgress);

    loadingFill.style.width = `${easedProgress * 100}%`;

    if (rawProgress < 1) {
      requestAnimationFrame(updateProgress);
      return;
    }

    loadingFill.style.width = "100%";
    finishLoading();
  }

  requestAnimationFrame(updateProgress);
}

function runSafetySlides() {
  slideTimer = setInterval(() => {
    if (currentSlideIndex >= slides.length - 1) {
      clearInterval(slideTimer);
      return;
    }

    slides[currentSlideIndex].classList.remove("active");
    currentSlideIndex += 1;
    slides[currentSlideIndex].classList.add("active");
  }, slideInterval);
}

function finishLoading() {
  loadingPage.classList.add("is-hidden");

  setTimeout(() => {
    loadingPage.style.display = "none";

    isPageReady = true;

    startFrameSequence();
    showGnb();
  }, 800);
}

function showGnb() {
  if (!gnb) return;

  gnb.classList.remove("is-hidden");

  requestAnimationFrame(() => {
    gnb.classList.add("is-visible");
  });
}

function openMenu() {
  if (!menuButton || !menuPanel || isMenuClosing) return;

  isMenuOpen = true;
  isMenuClosing = false;

  document.body.classList.add("is-menu-open");
  document.body.classList.remove("is-menu-closing");

  menuPanel.classList.remove("is-closing");
  menuPanel.classList.add("is-open");

  menuButton.classList.add("is-open");
  menuButton.setAttribute("aria-label", "메뉴 닫기");

  hideScrollGuide();
}

function closeMenu(callback) {
  if (!menuButton || !menuPanel || !isMenuOpen || isMenuClosing) return;

  isMenuOpen = false;
  isMenuClosing = true;

  document.body.classList.remove("is-menu-open");
  document.body.classList.add("is-menu-closing");

  menuPanel.classList.remove("is-open");
  menuPanel.classList.add("is-closing");

  setTimeout(() => {
    finishCloseMenu(callback);
  }, menuDuration);
}

function finishCloseMenu(callback) {
  isMenuClosing = false;

  menuPanel.classList.remove("is-closing");

  menuButton.classList.remove("is-open");
  menuButton.setAttribute("aria-label", "메뉴 열기");

  document.body.classList.remove("is-menu-closing");

  showGnb();

  if (typeof callback === "function") {
    callback();
  }
}

function toggleMenu() {
  if (isMenuOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}

function moveToHome(event) {
  event.preventDefault();

  closeMenu(() => {
    progress = 0;
    isAutoPlaying = false;
    setFrame(0);
    showGnb();
    showScrollGuide();
  });
}

function showScrollGuide() {
  if (!scrollGuide || isMenuOpen || isMenuClosing || isAutoPlaying) return;
  if (currentFrameIndex >= frameCount - 1) return;

  scrollGuide.classList.add("is-visible");
}

function hideScrollGuide() {
  if (!scrollGuide) return;

  scrollGuide.classList.remove("is-visible");
}

function restartScrollGuideTimer() {
  clearTimeout(scrollGuideTimer);

  if (currentFrameIndex >= frameCount - 1) return;

  scrollGuideTimer = setTimeout(showScrollGuide, 5000);
}

menuButton?.addEventListener("click", toggleMenu);

document.querySelector("[data-home-link]")?.addEventListener("click", moveToHome);

startButton?.addEventListener("click", startLoading);
