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
const scrollScreens = 32;
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
let externalNoticeTimer = null;
let targetVideoTime = introPlaySeconds;
let targetScrollProgress = 0;
let easedScrollProgress = 0;
let videoScrubRaf = null;
let smoothScrollTargetY = 0;
let smoothScrollCurrentY = 0;
let smoothScrollRaf = null;
const videoScrubEase = 0.055;
const videoSeekThreshold = 0.006;
const smoothScrollEase = 0.115;
const wheelScrollMultiplier = 0.92;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getScrollableDistance() {
  return window.innerHeight * scrollScreens;
}

function getMaxPageScroll() {
  return Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
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

function startVideoScrubEase() {
  if (videoScrubRaf || !mainVideo) return;

  const tick = () => {
    if (!mainVideo) {
      videoScrubRaf = null;
      return;
    }

    if (!isPageReady || isVideoAutoPlaying || isMenuOpen || isMenuClosing || isModalOpen) {
      videoScrubRaf = null;
      return;
    }

    const scrubDuration = getScrubDuration();
    if (scrubDuration <= 0) {
      videoScrubRaf = null;
      return;
    }

    const progressDiff = targetScrollProgress - easedScrollProgress;

    if (Math.abs(progressDiff) <= 0.00055) {
      easedScrollProgress = targetScrollProgress;
      targetVideoTime = introPlaySeconds + easedScrollProgress * scrubDuration;

      if (Math.abs(mainVideo.currentTime - targetVideoTime) > videoSeekThreshold) {
        mainVideo.currentTime = clamp(targetVideoTime, introPlaySeconds, mainVideo.duration || targetVideoTime);
      }

      updateEndCta(easedScrollProgress);
      videoScrubRaf = null;
      return;
    }

    // 스크롤 위치와 영상 시간을 동시에 부드럽게 보간합니다.
    // wheel 입력 → smooth scroll → eased progress → video currentTime 순서로 처리해
    // currentTime이 큰 폭으로 튀는 현상을 줄입니다.
    easedScrollProgress = clamp(easedScrollProgress + progressDiff * videoScrubEase, 0, 1);
    targetVideoTime = introPlaySeconds + easedScrollProgress * scrubDuration;

    if (Math.abs(mainVideo.currentTime - targetVideoTime) > videoSeekThreshold) {
      mainVideo.currentTime = clamp(targetVideoTime, introPlaySeconds, mainVideo.duration || targetVideoTime);
    }

    updateEndCta(easedScrollProgress);
    videoScrubRaf = requestAnimationFrame(tick);
  };

  videoScrubRaf = requestAnimationFrame(tick);
}

function updateVideoByScroll() {
  if (!isPageReady || isVideoAutoPlaying || isMenuOpen || isMenuClosing || isModalOpen || !mainVideo) return;

  const scrubDuration = getScrubDuration();
  if (scrubDuration <= 0) return;

  targetScrollProgress = getScrollProgress();
  startVideoScrubEase();
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

function canUseSmoothScroll() {
  return isPageReady && !isVideoAutoPlaying && !isMenuOpen && !isMenuClosing && !isModalOpen;
}

function syncSmoothScrollPosition(y = window.scrollY) {
  smoothScrollTargetY = clamp(y, 0, getMaxPageScroll());
  smoothScrollCurrentY = smoothScrollTargetY;
}

function startSmoothScrollEase() {
  if (smoothScrollRaf) return;

  const tick = () => {
    if (!canUseSmoothScroll()) {
      smoothScrollRaf = null;
      syncSmoothScrollPosition();
      return;
    }

    const diff = smoothScrollTargetY - smoothScrollCurrentY;

    if (Math.abs(diff) < 0.45) {
      smoothScrollCurrentY = smoothScrollTargetY;
      window.scrollTo(0, smoothScrollCurrentY);
      smoothScrollRaf = null;
      return;
    }

    smoothScrollCurrentY += diff * smoothScrollEase;
    window.scrollTo(0, smoothScrollCurrentY);
    smoothScrollRaf = requestAnimationFrame(tick);
  };

  smoothScrollRaf = requestAnimationFrame(tick);
}

function handleSmoothWheel(event) {
  if (!canUseSmoothScroll()) return;

  event.preventDefault();
  smoothScrollTargetY = clamp(smoothScrollTargetY + event.deltaY * wheelScrollMultiplier, 0, getMaxPageScroll());
  startSmoothScrollEase();
}

function handleSmoothKey(event) {
  if (!canUseSmoothScroll()) return;

  const keyMap = {
    ArrowDown: window.innerHeight * 0.42,
    PageDown: window.innerHeight * 0.86,
    End: getMaxPageScroll(),
    ArrowUp: -window.innerHeight * 0.42,
    PageUp: -window.innerHeight * 0.86,
    Home: -getMaxPageScroll(),
    " ": event.shiftKey ? -window.innerHeight * 0.86 : window.innerHeight * 0.86
  };

  if (!(event.key in keyMap)) return;

  event.preventDefault();

  if (event.key === "Home") smoothScrollTargetY = 0;
  else if (event.key === "End") smoothScrollTargetY = getMaxPageScroll();
  else smoothScrollTargetY = clamp(smoothScrollTargetY + keyMap[event.key], 0, getMaxPageScroll());

  startSmoothScrollEase();
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
  window.addEventListener("wheel", handleSmoothWheel, { passive: false });
  window.addEventListener("keydown", handleSmoothKey);
  window.addEventListener("scroll", handlePageScroll, { passive: true });
}

function setScrollWithoutLock(y) {
  allowProgrammaticScroll = true;
  syncSmoothScrollPosition(y);
  window.scrollTo(0, y);
  requestAnimationFrame(() => { allowProgrammaticScroll = false; });
}

function openExternalNotice(url) {
  if (!url) return;

  pendingExternalUrl = url;
  isModalOpen = true;
  saveLockedScrollPosition();
  clearTimeout(externalNoticeTimer);
  document.body.classList.add("is-modal-open");

  if (!externalNotice) {
    externalNoticeTimer = setTimeout(() => {
      window.location.href = url;
    }, 2000);
    return;
  }

  externalNotice.style.display = "flex";
  externalNotice.setAttribute("aria-hidden", "false");
  externalNotice.classList.remove("is-closing");

  requestAnimationFrame(() => {
    externalNotice.classList.add("is-visible");
  });

  externalNoticeTimer = setTimeout(() => {
    const targetUrl = pendingExternalUrl;
    if (!targetUrl) return;
    pendingExternalUrl = "";
    window.location.href = targetUrl;
  }, 2000);
}

function closeExternalNotice() {
  clearTimeout(externalNoticeTimer);
  pendingExternalUrl = "";
  isModalOpen = false;
  document.body.classList.remove("is-modal-open");
  externalNotice?.classList.remove("is-visible");
  externalNotice?.setAttribute("aria-hidden", "true");
  if (externalNotice) {
    setTimeout(() => {
      if (!externalNotice.classList.contains("is-visible")) {
        externalNotice.style.display = "none";
      }
    }, 260);
  }
}

function confirmExternalMove() {
  const url = pendingExternalUrl;
  if (!url) return closeExternalNotice();
  pendingExternalUrl = "";
  clearTimeout(externalNoticeTimer);
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
    targetVideoTime = introPlaySeconds;
    targetScrollProgress = 0;
    easedScrollProgress = 0;
  }
  setScrollWithoutLock(0);
  lockedScrollY = 0;
  lastScrollY = 0;
  syncSmoothScrollPosition(0);
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
  syncSmoothScrollPosition();
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
  syncSmoothScrollPosition();
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
