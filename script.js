const adaptivePopup = document.querySelector("#adaptivePopup");
const startButton = document.querySelector("#startButton");

const loadingPage = document.querySelector("#loading");
const slides = document.querySelectorAll(".safety-slide");
const loadingFill = document.querySelector("#loadingFill");

const gnb = document.querySelector("#gnb");
const menuButton = document.querySelector("#menuButton");
const menuPanel = document.querySelector("#menuPanel");

const introVideo = document.querySelector("#introVideo");
const scrollGuide = document.querySelector("#scrollGuide");
const frameImage = document.querySelector("#frameImage");
const endCta = document.querySelector("#endCta");

const externalNotice = document.querySelector("#externalNotice");
const courseIndexExternalLink = document.querySelector("#courseIndexExternalLink");

const slideInterval = 2000;
const totalLoadingTime = slides.length * slideInterval;
const menuDuration = 780;

const courseIndexUrl = "https://www.sisul.or.kr/open_content/traffic/bike_course/index.html";

/*
  프레임 이미지 설정
  BX사이트0000.webp ~ BX사이트0361.webp = 362장
*/
const frameCount = 0361;
const frameStartIndex = 0;
const framePath = "./assets/frames/";
const framePrefix = "BX사이트";
const frameExtension = ".webp";

/*
  영상 종료 후 스크롤 프레임 시작 위치
  영상 마지막 장면이 BX사이트0000.webp 근처와 이어진다는 전제
*/
const scrollStartFrame = 0000;

let currentSlideIndex = 0;
let slideTimer = null;
let scrollGuideTimer = null;

let isPageReady = false;
let isVideoPlaying = false;
let isMenuOpen = false;
let isMenuClosing = false;

let currentFrameIndex = -1;
let lastScrollY = 0;
let lockedScrollY = 0;
let isRestoringScroll = false;
let allowProgrammaticScroll = false;

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
  return Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
}

function getScrollProgress() {
  const maxScroll = getMaxScroll();

  if (maxScroll <= 0) return 0;

  return clamp(window.scrollY / maxScroll, 0, 1);
}

function preloadFrames() {
  for (let index = scrollStartFrame; index < frameCount; index += 1) {
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
  if (!isPageReady || isVideoPlaying || isMenuOpen || isMenuClosing) return;

  const progress = getScrollProgress();
  const frameRange = frameCount - 1 - scrollStartFrame;
  const frameIndex = scrollStartFrame + Math.round(progress * frameRange);

  setFrame(frameIndex);
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

function showGnb() {
  if (!gnb) return;

  gnb.classList.remove("is-hidden");

  requestAnimationFrame(() => {
    gnb.classList.add("is-visible");
  });
}

function hideGnb() {
  if (!gnb || isMenuOpen || isMenuClosing) return;

  gnb.classList.remove("is-visible");
  gnb.classList.add("is-hidden");
}

function updateGnbByScrollDirection() {
  if (!gnb || !isPageReady || isVideoPlaying || isMenuOpen || isMenuClosing) return;

  const currentScrollY = window.scrollY;

  if (Math.abs(currentScrollY - lastScrollY) < 4) return;

  if (currentScrollY <= 10) {
    showGnb();
  } else if (currentScrollY > lastScrollY) {
    hideGnb();
  } else {
    showGnb();
  }

  lastScrollY = currentScrollY;
}

function showScrollGuide() {
  if (!scrollGuide || isMenuOpen || isMenuClosing || isVideoPlaying) return;
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

function updateScrollGuideByUserScroll() {
  if (!isPageReady || isVideoPlaying || isMenuOpen || isMenuClosing) return;

  hideScrollGuide();
  restartScrollGuideTimer();
}

function shouldLockPageScroll() {
  return !isPageReady || isMenuOpen || isMenuClosing || isVideoPlaying;
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
  if (!shouldLockPageScroll()) return;
  if (allowProgrammaticScroll) return;
  if (isRestoringScroll) return;
  if (window.scrollY === lockedScrollY) return;

  isRestoringScroll = true;

  window.scrollTo(0, lockedScrollY);

  requestAnimationFrame(() => {
    isRestoringScroll = false;
  });
}

function handlePageScroll() {
  if (shouldLockPageScroll()) {
    restoreLockedScroll();
    return;
  }

  updateFrameByScroll();
  updateGnbByScrollDirection();
  updateScrollGuideByUserScroll();
}

function startScrollProtection() {
  window.addEventListener("wheel", preventScrollInput, { passive: false });
  window.addEventListener("touchmove", preventScrollInput, { passive: false });
  window.addEventListener("keydown", preventScrollKey);
  window.addEventListener("scroll", handlePageScroll);
}

function setScrollWithoutLock(y) {
  allowProgrammaticScroll = true;

  window.scrollTo(0, y);

  requestAnimationFrame(() => {
    allowProgrammaticScroll = false;
  });
}

function showExternalNoticeAndMove(url) {
  if (!externalNotice) {
    window.location.href = url;
    return;
  }

  externalNotice.classList.add("is-visible");

  setTimeout(() => {
    window.location.href = url;
  }, 1200);
}

/* =========================
   영상 → 프레임 시퀀스
========================= */

function startIntroVideo() {
  isVideoPlaying = true;
  isPageReady = false;

  saveLockedScrollPosition();
  hideGnb();
  hideScrollGuide();

  frameImage?.classList.remove("is-visible");

  if (!introVideo) {
    finishIntroVideo();
    return;
  }

  introVideo.currentTime = 0;
  introVideo.classList.add("is-visible");

  introVideo.addEventListener("ended", finishIntroVideo, {
    once: true
  });

  setTimeout(() => {
    const playPromise = introVideo.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        finishIntroVideo();
      });
    }
  }, 1000);
}

function finishIntroVideo() {
  if (introVideo) {
    introVideo.pause();
    introVideo.classList.remove("is-visible");
  }

  frameImage?.classList.add("is-visible");

  preloadFrames();

  setScrollWithoutLock(0);

  currentFrameIndex = -1;
  setFrame(0);

  lockedScrollY = 0;
  lastScrollY = 0;

  isVideoPlaying = false;
  isPageReady = true;

  showGnb();
  showScrollGuide();
  restartScrollGuideTimer();
}

/* =========================
   로딩
========================= */

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

    startIntroVideo();
  }, 800);
}

function skipLoadingAndStart() {
  adaptivePopup?.classList.add("is-hidden");
  loadingPage?.classList.add("is-hidden");

  if (adaptivePopup) adaptivePopup.style.display = "none";
  if (loadingPage) loadingPage.style.display = "none";

  startIntroVideo();
}

/* =========================
   메뉴
========================= */

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

  setScrollWithoutLock(lockedScrollY);
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

  if (isMenuOpen) {
    closeMenu(() => {
      window.location.href = "./index.html?skipLoading=1";
    });

    return;
  }

  window.location.href = "./index.html?skipLoading=1";
}

/* =========================
   초기 실행
========================= */

function initPage() {
  saveLockedScrollPosition();
  startScrollProtection();

  const params = new URLSearchParams(window.location.search);
  const shouldSkipLoading = params.get("skipLoading") === "1";

  setFrame(0);
  frameImage?.classList.remove("is-visible");

  if (shouldSkipLoading) {
    window.history.replaceState({}, document.title, "./index.html");
    skipLoadingAndStart();
  }
}

menuButton?.addEventListener("click", toggleMenu);

document.querySelector("[data-home-link]")?.addEventListener("click", moveToHome);

courseIndexExternalLink?.addEventListener("click", (event) => {
  event.preventDefault();

  if (isMenuOpen) {
    closeMenu(() => {
      showExternalNoticeAndMove(courseIndexUrl);
    });

    return;
  }

  showExternalNoticeAndMove(courseIndexUrl);
});

startButton?.addEventListener("click", startLoading);

initPage();
