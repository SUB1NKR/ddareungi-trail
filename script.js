window.addEventListener('DOMContentLoaded', () => {
  const adaptivePopup = document.querySelector('#adaptivePopup');
  const startButton = document.querySelector('#startButton');
  const loadingPage = document.querySelector('#loading');
  const slides = document.querySelectorAll('.safety-slide');
  const loadingFill = document.querySelector('#loadingFill');
  const gnb = document.querySelector('#gnb');
  const menuButton = document.querySelector('#menuButton');
  const menuPanel = document.querySelector('#menuPanel');
  const sequenceCanvas = document.querySelector('#sequenceCanvas');
  const scrollProxy = document.querySelector('#scrollProxy');
  const scrollGuide = document.querySelector('#scrollGuide');
  const endCta = document.querySelector('#endCta');
  const externalNotice = document.querySelector('#externalNotice');
  const externalCancelButton = document.querySelector('#externalCancelButton');
  const externalMoveButton = document.querySelector('#externalMoveButton');
  const courseIndexExternalLink = document.querySelector('#courseIndexExternalLink');

  const slideInterval = 2000;
  const totalLoadingTime = Math.max(slides.length, 1) * slideInterval;
  const menuDuration = 780;
  const courseIndexUrl = 'https://www.sisul.or.kr/open_content/traffic/bike_course/index.html';

  const frameCount = 362;
  const framePath = './assets/frames/';
  const framePrefix = 'BX사이트';
  const frameExtension = '.webp';
  const firstFrameIndex = 0;
  const autoPlayEndFrame = 130;
  const autoPlayDelay = 1000;
  const autoPlayDuration = 3600;
  const scrollStartFrame = autoPlayEndFrame;
  const maxDevicePixelRatio = 2;

  const ctx = sequenceCanvas ? sequenceCanvas.getContext('2d') : null;
  const frameImages = new Array(frameCount);

  let currentSlideIndex = 0;
  let slideTimer = null;
  let scrollGuideTimer = null;
  let scrollTriggerInstance = null;
  let externalMoveTimer = null;
  let externalTargetUrl = '';
  let isPageReady = false;
  let isIntroAutoPlaying = false;
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
    const frameNumber = String(firstFrameIndex + index).padStart(3, '0');
    return `${framePath}${framePrefix}${frameNumber}${frameExtension}`;
  }

  function loadFrame(index) {
    if (index < 0 || index >= frameCount) return null;
    if (frameImages[index]) return frameImages[index];

    const image = new Image();
    image.decoding = 'async';
    image.src = getFrameSrc(index);
    image.onload = () => {
      if (index === currentFrameIndex) drawFrame(index);
    };
    frameImages[index] = image;
    return image;
  }

  function preloadFrames() {
    loadFrame(0);

    const firstBatchEnd = Math.min(frameCount, 150);
    for (let index = 0; index < firstBatchEnd; index += 1) {
      loadFrame(index);
    }

    const loadRest = () => {
      for (let index = firstBatchEnd; index < frameCount; index += 1) {
        loadFrame(index);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadRest);
    } else {
      setTimeout(loadRest, 400);
    }
  }

  function drawCoverImage(image) {
    if (!sequenceCanvas || !ctx || !image || !image.complete || image.naturalWidth === 0) return;

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth;
    let drawHeight;
    let drawX;
    let drawY;

    if (imageRatio > canvasRatio) {
      drawHeight = canvasHeight;
      drawWidth = drawHeight * imageRatio;
      drawX = (canvasWidth - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = canvasWidth;
      drawHeight = drawWidth / imageRatio;
      drawX = 0;
      drawY = (canvasHeight - drawHeight) / 2;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  function drawFrame(index) {
    if (!ctx) return;
    const safeIndex = clamp(Math.round(index), 0, frameCount - 1);
    const image = loadFrame(safeIndex);
    if (!image || !image.complete || image.naturalWidth === 0) return;
    drawCoverImage(image);
  }

  function setFrame(index) {
    const safeIndex = clamp(Math.round(index), 0, frameCount - 1);
    if (safeIndex === currentFrameIndex) return;
    currentFrameIndex = safeIndex;
    drawFrame(safeIndex);
    updateEndCta();
  }

  function resizeCanvas() {
    if (!sequenceCanvas || !ctx) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);
    const width = window.innerWidth;
    const height = window.innerHeight;

    sequenceCanvas.width = Math.round(width * pixelRatio);
    sequenceCanvas.height = Math.round(height * pixelRatio);
    sequenceCanvas.style.width = `${width}px`;
    sequenceCanvas.style.height = `${height}px`;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawFrame(currentFrameIndex >= 0 ? currentFrameIndex : 0);

    if (scrollTriggerInstance && window.ScrollTrigger) {
      ScrollTrigger.refresh();
    }
  }

  function updateEndCta() {
    if (!endCta) return;

    if (currentFrameIndex >= frameCount - 1) {
      endCta.classList.add('is-visible');
      endCta.setAttribute('aria-hidden', 'false');
      hideScrollGuide();
      return;
    }

    endCta.classList.remove('is-visible');
    endCta.setAttribute('aria-hidden', 'true');
  }

  function showGnb() {
    if (!gnb) return;
    gnb.classList.remove('is-hidden');
    requestAnimationFrame(() => gnb.classList.add('is-visible'));
  }

  function hideGnb() {
    if (!gnb || isMenuOpen || isMenuClosing) return;
    gnb.classList.remove('is-visible');
    gnb.classList.add('is-hidden');
  }

  function showScrollGuide() {
    if (!scrollGuide || isMenuOpen || isMenuClosing || isIntroAutoPlaying) return;
    if (currentFrameIndex >= frameCount - 1) return;
    scrollGuide.classList.add('is-visible');
  }

  function hideScrollGuide() {
    scrollGuide?.classList.remove('is-visible');
  }

  function restartScrollGuideTimer() {
    clearTimeout(scrollGuideTimer);
    if (currentFrameIndex >= frameCount - 1) return;
    scrollGuideTimer = setTimeout(showScrollGuide, 5000);
  }

  function updateGnbByScrollDirection() {
    if (!gnb || !isPageReady || isIntroAutoPlaying || isMenuOpen || isMenuClosing) return;

    const currentScrollY = window.scrollY;
    if (Math.abs(currentScrollY - lastScrollY) < 4) return;

    if (currentScrollY <= 10) showGnb();
    else if (currentScrollY > lastScrollY) hideGnb();
    else showGnb();

    lastScrollY = currentScrollY;
  }

  function shouldLockPageScroll() {
    return !isPageReady || isMenuOpen || isMenuClosing || isIntroAutoPlaying;
  }

  function saveLockedScrollPosition() {
    lockedScrollY = window.scrollY;
  }

  function preventScrollInput(event) {
    if (shouldLockPageScroll()) event.preventDefault();
  }

  function preventScrollKey(event) {
    if (!shouldLockPageScroll()) return;
    const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
    if (scrollKeys.includes(event.key)) event.preventDefault();
  }

  function restoreLockedScroll() {
    if (!shouldLockPageScroll() || allowProgrammaticScroll || isRestoringScroll || window.scrollY === lockedScrollY) return;
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
    updateGnbByScrollDirection();
    hideScrollGuide();
    restartScrollGuideTimer();
  }

  function setScrollWithoutLock(y) {
    allowProgrammaticScroll = true;
    window.scrollTo(0, y);
    requestAnimationFrame(() => {
      allowProgrammaticScroll = false;
    });
  }

  function setupScrollTrigger() {
    if (!window.gsap || !window.ScrollTrigger || !scrollProxy) {
      window.addEventListener('scroll', () => {
        if (!isPageReady || isIntroAutoPlaying || isMenuOpen || isMenuClosing) return;
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
        const progress = maxScroll <= 0 ? 0 : clamp(window.scrollY / maxScroll, 0, 1);
        const frameIndex = scrollStartFrame + Math.round(progress * (frameCount - 1 - scrollStartFrame));
        setFrame(frameIndex);
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }

    scrollTriggerInstance = ScrollTrigger.create({
      trigger: scrollProxy,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        if (!isPageReady || isIntroAutoPlaying || isMenuOpen || isMenuClosing) return;
        const frameIndex = scrollStartFrame + Math.round(self.progress * (frameCount - 1 - scrollStartFrame));
        setFrame(frameIndex);
      }
    });
  }

  function finishIntroAutoPlay() {
    isIntroAutoPlaying = false;
    isPageReady = true;

    setScrollWithoutLock(0);
    lockedScrollY = 0;
    lastScrollY = 0;
    setFrame(scrollStartFrame);

    setupScrollTrigger();
    if (window.ScrollTrigger) ScrollTrigger.refresh();

    showGnb();
    showScrollGuide();
    restartScrollGuideTimer();
  }

  function startIntroAutoPlay() {
    isPageReady = false;
    isIntroAutoPlaying = true;
    saveLockedScrollPosition();
    hideGnb();
    hideScrollGuide();
    sequenceCanvas?.classList.add('is-visible');
    setScrollWithoutLock(0);
    setFrame(0);

    setTimeout(() => {
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

        finishIntroAutoPlay();
      }

      requestAnimationFrame(animate);
    }, autoPlayDelay);
  }

  function showExternalNoticeAndMove(url) {
    if (!externalNotice) {
      window.location.href = url;
      return;
    }

    externalTargetUrl = url;
    externalNotice.classList.add('is-visible');

    clearTimeout(externalMoveTimer);
    externalMoveTimer = setTimeout(() => {
      window.location.href = externalTargetUrl;
    }, 1600);
  }

  function cancelExternalMove() {
    clearTimeout(externalMoveTimer);
    externalMoveTimer = null;
    externalTargetUrl = '';
    externalNotice?.classList.remove('is-visible');
  }

  function moveExternalNow() {
    if (!externalTargetUrl) return;
    clearTimeout(externalMoveTimer);
    window.location.href = externalTargetUrl;
  }

  function startLoading() {
    saveLockedScrollPosition();
    adaptivePopup?.classList.add('is-hidden');

    setTimeout(() => {
      if (adaptivePopup) adaptivePopup.style.display = 'none';
      loadingPage?.classList.add('is-running');
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

      if (rawProgress < 1) {
        requestAnimationFrame(updateProgress);
        return;
      }

      if (loadingFill) loadingFill.style.width = '100%';
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
      slides[currentSlideIndex].classList.remove('active');
      currentSlideIndex += 1;
      slides[currentSlideIndex].classList.add('active');
    }, slideInterval);
  }

  function finishLoading() {
    loadingPage?.classList.add('is-hidden');
    setTimeout(() => {
      if (loadingPage) loadingPage.style.display = 'none';
      startIntroAutoPlay();
    }, 800);
  }

  function skipLoadingAndStart() {
    adaptivePopup?.classList.add('is-hidden');
    loadingPage?.classList.add('is-hidden');
    if (adaptivePopup) adaptivePopup.style.display = 'none';
    if (loadingPage) loadingPage.style.display = 'none';
    startIntroAutoPlay();
  }

  function openMenu() {
    if (!menuButton || !menuPanel || isMenuClosing) return;

    isMenuOpen = true;
    isMenuClosing = false;
    saveLockedScrollPosition();

    document.body.classList.add('is-menu-open');
    document.body.classList.remove('is-menu-closing');
    menuPanel.classList.remove('is-closing');
    menuPanel.classList.add('is-open');
    menuButton.classList.add('is-open');
    menuButton.setAttribute('aria-label', '메뉴 닫기');
    showGnb();
    hideScrollGuide();
  }

  function closeMenu(callback) {
    if (!menuButton || !menuPanel || !isMenuOpen || isMenuClosing) return;

    isMenuOpen = false;
    isMenuClosing = true;
    document.body.classList.remove('is-menu-open');
    document.body.classList.add('is-menu-closing');
    menuPanel.classList.remove('is-open');
    menuPanel.classList.add('is-closing');

    setTimeout(() => {
      isMenuClosing = false;
      menuPanel.classList.remove('is-closing');
      menuButton.classList.remove('is-open');
      menuButton.setAttribute('aria-label', '메뉴 열기');
      document.body.classList.remove('is-menu-closing');
      setScrollWithoutLock(lockedScrollY);
      lastScrollY = lockedScrollY;
      showGnb();
      if (typeof callback === 'function') callback();
    }, menuDuration);
  }

  function toggleMenu() {
    isMenuOpen ? closeMenu() : openMenu();
  }

  function moveToHome(event) {
    event.preventDefault();
    if (isMenuOpen) {
      closeMenu(() => { window.location.href = './index.html?skipLoading=1'; });
      return;
    }
    window.location.href = './index.html?skipLoading=1';
  }

  function initCustomCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'brand-cursor';
    document.body.appendChild(cursor);
    document.body.classList.add('has-brand-cursor');

    window.addEventListener('mousemove', (event) => {
      cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    });

    document.addEventListener('mouseover', (event) => {
      if (event.target.closest('a, button, .menu-link')) cursor.classList.add('is-hover');
    });

    document.addEventListener('mouseout', (event) => {
      if (event.target.closest('a, button, .menu-link')) cursor.classList.remove('is-hover');
    });
  }

  function initPage() {
    saveLockedScrollPosition();
    preloadFrames();
    resizeCanvas();
    setFrame(0);
    sequenceCanvas?.classList.add('is-visible');
    initCustomCursor();

    window.addEventListener('wheel', preventScrollInput, { passive: false });
    window.addEventListener('touchmove', preventScrollInput, { passive: false });
    window.addEventListener('keydown', preventScrollKey);
    window.addEventListener('scroll', handlePageScroll);
    window.addEventListener('resize', resizeCanvas);

    const params = new URLSearchParams(window.location.search);
    const shouldSkipLoading = params.get('skipLoading') === '1';

    if (shouldSkipLoading) {
      window.history.replaceState({}, document.title, './index.html');
      skipLoadingAndStart();
    }
  }

  menuButton?.addEventListener('click', toggleMenu);
  document.querySelector('[data-home-link]')?.addEventListener('click', moveToHome);
  startButton?.addEventListener('click', startLoading);
  externalCancelButton?.addEventListener('click', cancelExternalMove);
  externalMoveButton?.addEventListener('click', moveExternalNow);

  courseIndexExternalLink?.addEventListener('click', (event) => {
    event.preventDefault();
    if (isMenuOpen) {
      closeMenu(() => showExternalNoticeAndMove(courseIndexUrl));
      return;
    }
    showExternalNoticeAndMove(courseIndexUrl);
  });

  initPage();
});
