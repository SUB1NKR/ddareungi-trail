(() => {
  const entryPopup = document.getElementById("entryPopup");
  const startButton = document.getElementById("startButton");
  const loadingPage = document.getElementById("loadingPage");
  const loadingSlides = Array.from(document.querySelectorAll(".loading-slide"));
  const loadingFill = document.getElementById("loadingFill");

  const gnb = document.getElementById("gnb");
  const menuButton = document.getElementById("menuButton");
  const menuPanel = document.getElementById("menuPanel");

  const courseIndexButton = document.getElementById("courseIndexButton");
  const externalNotice = document.getElementById("externalNotice");
  const externalNoticeClose = document.getElementById("externalNoticeClose");

  const mainVideo = document.getElementById("mainVideo");
  const scrollGuide = document.getElementById("scrollGuide");
  const endCta = document.getElementById("endCta");

  const courseIndexUrl = "https://www.sisul.or.kr/open_content/traffic/bike_course/index.html";

  const loadingDuration = 6000;
  const slideInterval = 2000;

  const autoPlaySeconds = 2;
  const scrollLengthMultiplier = 7;
  const lerpAmount = 0.08;
  const scrollGuideDelay = 5000;

  let isMenuOpen = false;
  let isPageReady = false;
  let isAutoPlaying = false;
  let isScrollControlReady = false;

  let videoDuration = 0;
  let scrollStartTime = autoPlaySeconds;
  let scrollEndTime = 0;

  let targetProgress = 0;
  let currentProgress = 0;

  let animationFrameId = null;
  let scrollGuideTimer = null;
  let externalMoveTimer = null;

  let lockedScrollY = 0;
  let previousScrollY = 0;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function hasSkipLoading() {
    const params = new URLSearchParams(window.location.search);
    return params.get("skipLoading") === "1";
  }

  function lockBodyScroll() {
    lockedScrollY = window.scrollY || window.pageYOffset;
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.classList.add("is-locked");
  }

  function unlockBodyScroll() {
    const restoreY = Math.abs(parseInt(document.body.style.top || "0", 10));

    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.classList.remove("is-locked");

    window.scrollTo(0, restoreY || lockedScrollY || 0);
  }

  function setPageScrollHeight() {
    const scrollHeight = window.innerHeight * scrollLengthMultiplier + window.innerHeight;
    document.body.style.minHeight = `${scrollHeight}px`;
  }

  function getMaxScroll() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function updateTargetProgress() {
    if (!isScrollControlReady || isMenuOpen) return;

    const nextProgress = window.scrollY / getMaxScroll();
    targetProgress = clamp(nextProgress, 0, 1);

    updateGnbByScrollDirection();
    hideScrollGuide();
    restartScrollGuideTimer();
  }

  function updateVideoByScroll() {
    if (!isScrollControlReady || !videoDuration) return;

    currentProgress += (targetProgress - currentProgress) * lerpAmount;

    if (Math.abs(targetProgress - currentProgress) < 0.0004) {
      currentProgress = targetProgress;
    }

    const controllableDuration = Math.max(0.01, scrollEndTime - scrollStartTime);
    const nextTime = scrollStartTime + currentProgress * controllableDuration;

    if (Number.isFinite(nextTime) && Math.abs(mainVideo.currentTime - nextTime) > 0.015) {
      mainVideo.currentTime = nextTime;
    }

    updateEndCta();
  }

  function animationLoop() {
    updateVideoByScroll();
    animationFrameId = window.requestAnimationFrame(animationLoop);
  }

  function startAnimationLoop() {
    if (animationFrameId) return;
    animationFrameId = window.requestAnimationFrame(animationLoop);
  }

  function showGnb() {
    gnb.classList.add("is-visible");
  }

  function hideGnb() {
    gnb.classList.remove("is-visible");
  }

  function updateGnbByScrollDirection() {
    if (!isPageReady || isMenuOpen) return;

    const currentY = window.scrollY || window.pageYOffset;

    if (currentY > previousScrollY && currentY > 120) {
      gnb.classList.add("is-hidden-by-scroll");
    } else {
      gnb.classList.remove("is-hidden-by-scroll");
    }

    previousScrollY = currentY;
  }

  function showScrollGuide() {
    if (!isScrollControlReady || targetProgress > 0.94) return;
    scrollGuide.classList.add("is-visible");
  }

  function hideScrollGuide() {
    scrollGuide.classList.remove("is-visible");
  }

  function restartScrollGuideTimer() {
    window.clearTimeout(scrollGuideTimer);

    if (!isScrollControlReady || targetProgress > 0.94) return;

    scrollGuideTimer = window.setTimeout(() => {
      showScrollGuide();
    }, scrollGuideDelay);
  }

  function updateEndCta() {
    if (currentProgress >= 0.985) {
      endCta.classList.add("is-visible");
      hideScrollGuide();
    } else {
      endCta.classList.remove("is-visible");
    }
  }

  function startLoading() {
    entryPopup.classList.add("is-hidden");

    window.setTimeout(() => {
      entryPopup.style.display = "none";
      loadingPage.classList.add("is-visible");
      loadingPage.setAttribute("aria-hidden", "false");

      runLoadingSlides();
      runLoadingBar();

      window.setTimeout(() => {
        finishLoading();
      }, loadingDuration);
    }, 420);
  }

  function runLoadingSlides() {
    loadingSlides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === 0);
    });

    let currentIndex = 0;

    const slideTimer = window.setInterval(() => {
      currentIndex += 1;

      loadingSlides.forEach((slide, index) => {
        slide.classList.toggle("is-active", index === currentIndex);
      });

      if (currentIndex >= loadingSlides.length - 1) {
        window.clearInterval(slideTimer);
      }
    }, slideInterval);
  }

  function runLoadingBar() {
    loadingFill.style.transition = "none";
    loadingFill.style.width = "0%";

    window.requestAnimationFrame(() => {
      loadingFill.style.transition = `width ${loadingDuration}ms linear`;
      loadingFill.style.width = "100%";
    });
  }

  function finishLoading() {
    loadingPage.classList.add("is-hidden");

    window.setTimeout(() => {
      loadingPage.style.display = "none";
      loadingPage.setAttribute("aria-hidden", "true");
      startMainExperience();
    }, 520);
  }

  function prepareVideoMetadata() {
    return new Promise((resolve) => {
      if (mainVideo.readyState >= 1 && Number.isFinite(mainVideo.duration)) {
        resolve();
        return;
      }

      mainVideo.addEventListener("loadedmetadata", resolve, { once: true });
      mainVideo.load();
    });
  }

  async function startMainExperience() {
    lockBodyScroll();

    await prepareVideoMetadata();

    videoDuration = mainVideo.duration || 0;
    scrollStartTime = Math.min(autoPlaySeconds, Math.max(0, videoDuration - 0.1));
    scrollEndTime = videoDuration;

    setPageScrollHeight();

    mainVideo.classList.add("is-visible");
    mainVideo.currentTime = 0;
    mainVideo.muted = true;
    mainVideo.playsInline = true;

    isAutoPlaying = true;
    hideGnb();
    hideScrollGuide();

    try {
      await mainVideo.play();
    } catch (error) {
      mainVideo.currentTime = 0;
    }

    watchAutoPlayEnd();
  }

  function watchAutoPlayEnd() {
    const check = () => {
      if (!isAutoPlaying) return;

      if (mainVideo.currentTime >= scrollStartTime || mainVideo.ended) {
        finishAutoPlay();
        return;
      }

      window.requestAnimationFrame(check);
    };

    window.requestAnimationFrame(check);
  }

  function finishAutoPlay() {
    isAutoPlaying = false;

    mainVideo.pause();
    mainVideo.currentTime = scrollStartTime;

    window.scrollTo(0, 0);
    targetProgress = 0;
    currentProgress = 0;

    isPageReady = true;
    isScrollControlReady = true;

    unlockBodyScroll();
    showGnb();
    showScrollGuide();
    restartScrollGuideTimer();
    startAnimationLoop();
  }

  function openMenu() {
    if (isMenuOpen) return;

    isMenuOpen = true;
    menuPanel.classList.add("is-open");
    menuPanel.setAttribute("aria-hidden", "false");
    menuButton.classList.add("is-active");
    menuButton.setAttribute("aria-label", "메뉴 닫기");
    gnb.classList.add("is-visible");
    gnb.classList.remove("is-hidden-by-scroll");

    lockBodyScroll();
  }

  function closeMenu() {
    if (!isMenuOpen) return;

    isMenuOpen = false;
    menuPanel.classList.remove("is-open");
    menuPanel.setAttribute("aria-hidden", "true");
    menuButton.classList.remove("is-active");
    menuButton.setAttribute("aria-label", "메뉴 열기");

    unlockBodyScroll();
  }

  function toggleMenu() {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function showExternalNotice() {
    closeMenu();

    externalNotice.classList.add("is-visible");
    externalNotice.setAttribute("aria-hidden", "false");

    window.clearTimeout(externalMoveTimer);

    externalMoveTimer = window.setTimeout(() => {
      window.location.href = courseIndexUrl;
    }, 1200);
  }

  function closeExternalNotice() {
    window.clearTimeout(externalMoveTimer);
    externalNotice.classList.remove("is-visible");
    externalNotice.setAttribute("aria-hidden", "true");
  }

  function initSkipLoadingMode() {
    entryPopup.style.display = "none";
    loadingPage.style.display = "none";
    startMainExperience();
  }

  function bindEvents() {
    startButton.addEventListener("click", startLoading);
    menuButton.addEventListener("click", toggleMenu);
    courseIndexButton.addEventListener("click", showExternalNotice);
    externalNoticeClose.addEventListener("click", closeExternalNotice);

    window.addEventListener("scroll", updateTargetProgress, { passive: true });

    window.addEventListener("resize", () => {
      setPageScrollHeight();
      updateTargetProgress();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (externalNotice.classList.contains("is-visible")) {
          closeExternalNotice();
        }

        if (isMenuOpen) {
          closeMenu();
        }
      }
    });
  }

  function init() {
    bindEvents();
    hideGnb();

    if (hasSkipLoading()) {
      initSkipLoadingMode();
    } else {
      lockBodyScroll();
    }
  }

  init();
})();
