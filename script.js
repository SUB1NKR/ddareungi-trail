const adaptivePopup = document.querySelector("#adaptivePopup");
const startButton = document.querySelector("#startButton");
const loadingPage = document.querySelector("#loading");
const slides = document.querySelectorAll(".safety-slide");
const loadingFill = document.querySelector("#loadingFill");
const gnb = document.querySelector("#gnb");
const menuButton = document.querySelector("#menuButton");
const menuPanel = document.querySelector("#menuPanel");
const mainVideo = document.querySelector("#mainVideo");
const scrollGuide = document.querySelector("#scrollGuide");
const endCta = document.querySelector("#endCta");
const scrollProxy = document.querySelector("#scrollProxy");
const externalNotice = document.querySelector("#externalNotice");
const externalNoticeClose = document.querySelector("#externalNoticeClose");
const externalNoticeCancel = document.querySelector("#externalNoticeCancel");
const externalNoticeConfirm = document.querySelector("#externalNoticeConfirm");
const courseIndexExternalLink = document.querySelector("#courseIndexExternalLink");

const slideInterval = 2000;
const totalLoadingTime = Math.max(slides.length * slideInterval, 1200);
const menuDuration = 780;
const introPlaySeconds = 2;
const scrollScreens = 12;
const courseIndexUrl = "https://www.sisul.or.kr/open_content/traffic/bike_course/index.html";

let currentSlideIndex = 0;
let slideTimer = null;
let scrollGuideTimer = null;
let pendingExternalUrl = "";
let isPageReady = false;
let isVideoAutoPlaying = false;
let isMenuOpen = false;
let isMenuClosing = false;
let isModalOpen = false;
let lastScrollY = 0;
let lockedScrollY = 0;
let ticking = false;
let allowProgrammaticScroll = false;
let isRestoringScroll = false;
let lastGuideUpdateTime = 0;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getScrollableDistance() {
  return window.innerHeight * scrollScreens;
}

function updateScrollProxyHeight() {
  if (!scrollProxy) return;
  scrollProxy.style.height = `${getScrollableDistance() + window.innerHeight}px`;
}

function getScrollProgress() {
  const distance = getScrollableDistance();
  if (distance <= 0) return 0;
  return clamp(window.scrollY / distance, 0, 1);
}

function getScrubDuration() {
  if (!mainVideo || !Number.isFinite(mainVideo.duration)) return 0;
  return Math.max(mainVideo.duration - introPlaySeconds, 0);
}

function updateVideoByScroll() {
  if (!isPageReady || isVideoAutoPlaying || isMenuOpen || isMenuClosing || isModalOpen || !mainVideo) return;
  const scrubDuration = getScrubDuration();
  if (scrubDuration <= 0) return;
  const progress = getScrollProgress();
  const targetTime = introPlaySeconds + progress * scrubDuration;
  if (Math.abs(mainVideo.currentTime - targetTime) > 0.035) {
    mainVideo.currentTime = targetTime;
  }
  updateEndCta(progress);
}

function updateEndCta(progress = getScrollProgress()) {
  if (!endCta) return;
  if (progress >= 0.985) {
    endCta.classList.add("is-visible");
    endCta.setAttribute("aria-hidden", "false");
    hideScrollGuide();
    return;
  }
  endCta.classList.remove("is-visible");
  endCta.setAttribute("aria-hidden", "true");
}

function showGnb() {
  if (!gnb) return;
  gnb.classList.remove("is-hidden");
  requestAnimationFrame(() => gnb.classList.add("is-visible"));
}

function hideGnb() {
  if (!gnb || isMenuOpen || isMenuClosing) return;
  gnb.classList.remove("is-visible");
  gnb.classList.add("is-hidden");
}

function updateGnbByScrollDirection() {
  if (!gnb || !isPageReady || isVideoAutoPlaying || isMenuOpen || isMenuClosing || isModalOpen) return;
  const currentScrollY = window.scrollY;
  if (Math.abs(currentScrollY - lastScrollY) < 4) return;
  if (currentScrollY <= 10) showGnb();
  else if (currentScrollY > lastScrollY) hideGnb();
  else showGnb();
  lastScrollY = currentScrollY;
}

function showScrollGuide() {
  if (!scrollGuide || isMenuOpen || isMenuClosing || isVideoAutoPlaying || isModalOpen) return;
  if (getScrollProgress() >= 0.985) return;
  scrollGuide.classList.add("is-visible");
}

function hideScrollGuide() {
  scrollGuide?.classList.remove("is-visible");
}

function restartScrollGuideTimer() {
  clearTimeout(scrollGuideTimer);
  if (getScrollProgress() >= 0.985) return;
  scrollGuideTimer = setTimeout(showScrollGuide, 5000);
}

function updateScrollGuideByUserScroll() {
  if (!isPageReady || isVideoAutoPlaying || isMenuOpen || isMenuClosing || isModalOpen) return;
  const now = performance.now();
  if (now - lastGuideUpdateTime < 300) return;
  lastGuideUpdateTime = now;
  hideScrollGuide();
  restartScrollGuideTimer();
}

function shouldLockPageScroll() {
  return !isPageReady || isVideoAutoPlaying || isMenuOpen || isMenuClosing || isModalOpen;
}

function saveLockedScrollPosition() {
  lockedScrollY = window.scrollY;
}

function preventScrollInput(event) {
  if (!shouldLockPageScroll()) return;
  event.preventDefault();
}

function preventScrollKey(event) {
  if (!shouldLockPageScroll()) return;
  const scrollKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
  if (scrollKeys.includes(event.key)) event.preventDefault();
}

function restoreLockedScroll() {
  if (!shouldLockPageScroll()) return;
  if (allowProgrammaticScroll || isRestoringScroll || window.scrollY === lockedScrollY) return;
  isRestoringScroll = true;
  window.scrollTo(0, lockedScrollY);
  requestAnimationFrame(() => { isRestoringScroll = false; });
}

function handlePageScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    if (shouldLockPageScroll()) {
      restoreLockedScroll();
      ticking = false;
      return;
    }
    updateVideoByScroll();
    updateGnbByScrollDirection();
    updateScrollGuideByUserScroll();
    ticking = false;
  });
}

function startScrollProtection() {
  window.addEventListener("wheel", preventScrollInput, { passive: false });
  window.addEventListener("touchmove", preventScrollInput, { passive: false });
  window.addEventListener("keydown", preventScrollKey);
  window.addEventListener("scroll", handlePageScroll, { passive: true });
}

function setScrollWithoutLock(y) {
  allowProgrammaticScroll = true;
  window.scrollTo(0, y);
  requestAnimationFrame(() => { allowProgrammaticScroll = false; });
}

function openExternalNotice(url) {
  pendingExternalUrl = url;
  isModalOpen = true;
  saveLockedScrollPosition();
  document.body.classList.add("is-modal-open");
  externalNotice?.classList.add("is-visible");
  externalNotice?.setAttribute("aria-hidden", "false");
}

function closeExternalNotice() {
  pendingExternalUrl = "";
  isModalOpen = false;
  document.body.classList.remove("is-modal-open");
  externalNotice?.classList.remove("is-visible");
  externalNotice?.setAttribute("aria-hidden", "true");
}

function confirmExternalMove() {
  if (!pendingExternalUrl) return closeExternalNotice();
  const url = pendingExternalUrl;
  closeExternalNotice();
  window.location.href = url;
}

function startMainVideoFlow() {
  if (!mainVideo) return;
  isVideoAutoPlaying = true;
  isPageReady = false;
  saveLockedScrollPosition();
  document.body.classList.add("is-video-autoplay");
  hideGnb();
  hideScrollGuide();
  updateScrollProxyHeight();
  mainVideo.classList.add("is-visible");
  mainVideo.style.opacity = "1";
  mainVideo.pause();
  mainVideo.currentTime = 0;

  const playAfterReady = () => {
    setTimeout(() => {
      const promise = mainVideo.play();
      if (promise?.catch) promise.catch(() => finishIntroPlay());
    }, 1000);
  };

  if (mainVideo.readyState >= 1) playAfterReady();
  else mainVideo.addEventListener("loadedmetadata", playAfterReady, { once: true });

  const introTimer = setInterval(() => {
    if (!isVideoAutoPlaying) {
      clearInterval(introTimer);
      return;
    }
    if (mainVideo.currentTime >= introPlaySeconds || mainVideo.ended) {
      clearInterval(introTimer);
      finishIntroPlay();
    }
  }, 80);
}

function finishIntroPlay() {
  if (!mainVideo) return;
  mainVideo.pause();
  if (Number.isFinite(mainVideo.duration) && mainVideo.duration > introPlaySeconds) {
    mainVideo.currentTime = introPlaySeconds;
  }
  setScrollWithoutLock(0);
  lockedScrollY = 0;
  lastScrollY = 0;
  isVideoAutoPlaying = false;
  isPageReady = true;
  document.body.classList.remove("is-video-autoplay");
  showGnb();
  showScrollGuide();
  restartScrollGuideTimer();
  updateVideoByScroll();
}

function startLoading() {
  saveLockedScrollPosition();
  document.body.classList.add("is-loading-locked");
  adaptivePopup?.classList.add("is-hidden");
  setTimeout(() => {
    if (adaptivePopup) adaptivePopup.style.display = "none";
    loadingPage?.classList.add("is-running");
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
    if (loadingFill) loadingFill.style.width = `${easedProgress * 100}%`;
    if (rawProgress < 1) requestAnimationFrame(updateProgress);
    else {
      if (loadingFill) loadingFill.style.width = "100%";
      finishLoading();
    }
  }
  requestAnimationFrame(updateProgress);
}

function runSafetySlides() {
  slideTimer = setInterval(() => {
    if (currentSlideIndex >= slides.length - 1) {
      clearInterval(slideTimer);
      return;
    }
    slides[currentSlideIndex]?.classList.remove("active");
    currentSlideIndex += 1;
    slides[currentSlideIndex]?.classList.add("active");
  }, slideInterval);
}

function finishLoading() {
  loadingPage?.classList.add("is-hidden");
  setTimeout(() => {
    if (loadingPage) loadingPage.style.display = "none";
    document.body.classList.remove("is-loading-locked");
    startMainVideoFlow();
  }, 800);
}

function skipLoadingAndStart() {
  adaptivePopup?.classList.add("is-hidden");
  loadingPage?.classList.add("is-hidden");
  if (adaptivePopup) adaptivePopup.style.display = "none";
  if (loadingPage) loadingPage.style.display = "none";
  document.body.classList.remove("is-loading-locked");
  startMainVideoFlow();
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
  setTimeout(() => finishCloseMenu(callback), menuDuration);
}

function finishCloseMenu(callback) {
  isMenuClosing = false;
  menuPanel.classList.remove("is-closing");
  menuButton.classList.remove("is-open");
  menuButton.setAttribute("aria-label", "메뉴 열기");
  document.body.classList.remove("is-menu-closing");
  setScrollWithoutLock(lockedScrollY);
  lastScrollY = lockedScrollY;
  showGnb();
  if (typeof callback === "function") callback();
}

function toggleMenu() {
  if (isMenuOpen) closeMenu();
  else openMenu();
}

function moveToHome(event) {
  event.preventDefault();
  const move = () => { window.location.href = "./index.html?skipLoading=1"; };
  if (isMenuOpen) closeMenu(move);
  else move();
}

function initPage() {
  updateScrollProxyHeight();
  saveLockedScrollPosition();
  startScrollProtection();
  const params = new URLSearchParams(window.location.search);
  const shouldSkipLoading = params.get("skipLoading") === "1";
  if (shouldSkipLoading) {
    window.history.replaceState({}, document.title, "./index.html");
    skipLoadingAndStart();
  }
}

menuButton?.addEventListener("click", toggleMenu);
document.querySelector("[data-home-link]")?.addEventListener("click", moveToHome);
courseIndexExternalLink?.addEventListener("click", (event) => {
  event.preventDefault();
  const open = () => openExternalNotice(courseIndexUrl);
  if (isMenuOpen) closeMenu(open);
  else open();
});
startButton?.addEventListener("click", startLoading);
externalNoticeClose?.addEventListener("click", closeExternalNotice);
externalNoticeCancel?.addEventListener("click", closeExternalNotice);
externalNoticeConfirm?.addEventListener("click", confirmExternalMove);
externalNotice?.addEventListener("click", (event) => {
  if (event.target === externalNotice) closeExternalNotice();
});
window.addEventListener("resize", () => {
  updateScrollProxyHeight();
  updateVideoByScroll();
}, { passive: true });


/* =========================
   Smooth Custom Cursor
========================= */
function initCustomCursor() {
  const cursor = document.querySelector("#customCursor");
  if (!cursor) return;

  const canUseCustomCursor = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!canUseCustomCursor) return;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let isStarted = false;

  const hoverTargets = [
    "a",
    "button",
    "[role='button']",
    ".gnb-menu-button",
    ".menu-link",
    ".menu-sns-link",
    ".popup-button",
    ".primary-button",
    ".secondary-button",
    ".answer-button",
    ".result-button",
    ".course-card",
    ".external-notice-close",
    ".notice-secondary",
    ".notice-primary"
  ].join(",");

  function animateCursor() {
    currentX += (targetX - currentX) * 0.17;
    currentY += (targetY - currentY) * 0.17;
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursor);
  }

  function startCursor() {
    cursor.classList.add("is-visible");
    if (isStarted) return;
    isStarted = true;
    requestAnimationFrame(animateCursor);
  }

  function updateHoverState(event) {
    const target = event.target.closest(hoverTargets);
    cursor.classList.toggle("is-hover", Boolean(target));
  }

  window.addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    startCursor();
    updateHoverState(event);
  }, { passive: true });

  window.addEventListener("mousedown", () => {
    cursor.classList.add("is-pressed");
  });

  window.addEventListener("mouseup", () => {
    cursor.classList.remove("is-pressed");
  });

  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("is-visible", "is-hover", "is-pressed");
  });
}

initCustomCursor();
initPage();
