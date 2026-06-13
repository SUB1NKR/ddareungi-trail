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

  현재:
  BX사이트000.webp ~ BX사이트361.webp = 362장

  나중에 500장으로 늘리면:
  BX사이트000.webp ~ BX사이트499.webp까지 넣고
  frameCount만 500으로 바꾸면 됩니다.
*/
const frameCount = 362;
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

let currentSlideIndex = 0;
let slideTimer = null;
let scrollGuideTimer = null;

let isPageReady = false;
let isMenuOpen = false;
let isMenuClosing = false;
let isAutoPlaying = false;
let isRestoringScroll = false;

let currentFrameIndex = -1;
let lastScrollY = 0;
let lockedScrollY = 0;

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

function getMaxScroll() {
  return Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
}

function getScrollProgress() {
  return clamp(window.scrollY / getMaxScroll(), 0, 1);
}

function getScrollYByFrame(frameIndex) {
  const progress = frameIndex / (frameCount - 1);
  return getMaxScroll() * progress;
}

function shouldLockActualScroll() {
  return !isPageReady || isMenuOpen || isMenuClosing || isAutoPlaying;
}

function saveLockedScrollPosition() {
  lockedScrollY = window.scrollY;
}

function preventActualScroll(event) {
  if (!shouldLockActualScroll()) return;
  event.preventDefault();
}

function preventScrollKey(event) {
  if (!shouldLockActualScroll()) return;

  const scrollKeys = [
    "ArrowUp",
    "ArrowDown",
    "PageUp",
    "PageDown",
    "Home",
    "End",
    " "
  ];

  if (scrollKeys.includes(event.key)) {
    event.preventDefault();
  }
}

function restoreLockedScroll() {
  if (!shouldLockActualScroll()) return;
  if (isRestoringScroll) return;
  if (window.scrollY === lockedScrollY) return;

  isRestoringScroll = true;
  window.scrollTo(0, lockedScrollY);

  requestAnimationFrame(() => {
    isRestoringScroll = false;
  });
}

function startScrollLockWatch() {
  window.addEventListener("wheel", preventActualScroll, { passive: false });
  window.addEventListener("touchmove", preventActualScroll, { passive: false });
  window.addEventListener("keydown", preventScrollKey);
  window.addEventListener("scroll", restoreLockedScroll);
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

function updateFrameByScroll() {
  if (!isPageReady || isAutoPlaying) return;

  const progress = getScrollProgress();
  const frameIndex = Math.round(progress * (frameCount - 1));

  setFrame(frameIndex);

  if (frameIndex < frameCount - 1) {
    hideScrollGuide();
    restartScrollGuideTimer();
  }
}

function updateGnbByScrollDirection() {
  if (!gnb || !isPageReady || isAutoPlaying || isMenuOpen || isMenuClosing) return;

  const currentScrollY = window.scrollY;

  if (Math.abs(currentScrollY - lastScrollY) < 4) return;

  if (currentScrollY > lastScrollY) {
    hideGnbByDirection();
  } else {
    showGnbByDirection();
  }

  lastScrollY = currentScrollY;
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

function startFrameSequence() {
  if (!frameImage) return;

  window.scrollTo(0, 0);
  lastScrollY = 0;
  lockedScrollY = 0;

  setFrame(0);
  preloadFrames();

  window.addEventListener("scroll", () => {
    updateFrameByScroll();
    updateGnbByScrollDirection();
  });

  startIntroAutoPlay();
}

function startIntroAutoPlay() {
  isAutoPlaying = true;
  saveLockedScrollPosition();
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

    const targetScrollY = getScrollYByFrame(autoPlayEndFrame);

    isAutoPlaying = false;
    window.scrollTo(0, targetScrollY);

    lastScrollY = targetScrollY;
    lockedScrollY = targetScrollY;

    setFrame(autoPlayEndFrame);
    showScrollGuide();
    restartScrollGuideTimer();
  }

  requestAnimationFrame(animate);
}

function startLoading() {
  saveLockedScrollPosition();

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

  saveLockedScrollPosition();

  document.body.classList.add("is-menu-open");
  document.body.classList.remove("is-menu-closing");

  menuPanel.classList.remove("is-closing");
  menuPanel.classList.add("is-open");

  menuButton.classList.add("is-open");
  menuButton.setAttribute("aria-label", "메뉴 닫기");

  showGnb();
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

  window.scrollTo(0, lockedScrollY);
  lastScrollY = lockedScrollY;

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
    window.scrollTo(0, 0);
    lastScrollY = 0;
    lockedScrollY = 0;
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

saveLockedScrollPosition();
startScrollLockWatch();

menuButton?.addEventListener("click", toggleMenu);

document.querySelector("[data-home-link]")?.addEventListener("click", moveToHome);

startButton?.addEventListener("click", startLoading);
