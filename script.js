(() => {
  'use strict';

  const CONFIG = {
    autoPlaySeconds: 2,
    externalUrl: 'https://www.sisul.or.kr/open_content/traffic/bike_course/index.html',
    externalDelay: 1600,
    scrubEase: 0.12,
  };

  const $ = (selector) => document.querySelector(selector);
  const body = document.body;
  const loadingScreen = $('#loadingScreen');
  const loadingProgress = $('#loadingProgress');
  const guideOverlay = $('#guideOverlay');
  const startButton = $('#startButton');
  const video = $('#mainVideo');
  const videoFallback = $('#videoFallback');
  const menuButton = $('#menuButton');
  const menuPanel = $('#menuPanel');
  const menuClose = $('#menuClose');
  const externalModal = $('#externalModal');
  const externalClose = $('#externalClose');
  const externalCancel = $('#externalCancel');
  const externalGo = $('#externalGo');
  const externalProgress = $('#externalProgress');

  let duration = 0;
  let targetTime = 0;
  let currentTime = 0;
  let rafId = null;
  let isScrubReady = false;
  let externalTimer = null;
  let progressTimer = null;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function hideLoading() {
    if (!loadingScreen) return;
    loadingProgress.style.width = '100%';
    window.setTimeout(() => loadingScreen.classList.add('is-hidden'), 250);
  }

  function initLoading() {
    let progress = 0;
    const timer = window.setInterval(() => {
      progress = Math.min(progress + Math.random() * 22, 94);
      loadingProgress.style.width = `${progress}%`;
    }, 140);

    const done = () => {
      window.clearInterval(timer);
      hideLoading();
    };

    if (video) {
      video.addEventListener('loadedmetadata', done, { once: true });
      video.addEventListener('error', () => {
        videoFallback?.classList.add('is-visible');
        done();
      }, { once: true });
      window.setTimeout(done, 1800);
    } else {
      done();
    }
  }

  async function startExperience() {
    guideOverlay?.classList.add('is-hidden');
    body.classList.remove('is-locked');

    if (!video || !Number.isFinite(video.duration)) return;
    duration = video.duration;

    try {
      video.currentTime = 0;
      await video.play();
      window.setTimeout(() => {
        video.pause();
        video.currentTime = Math.min(CONFIG.autoPlaySeconds, duration - 0.05);
        currentTime = video.currentTime;
        targetTime = currentTime;
        isScrubReady = true;
        requestScrubFrame();
      }, CONFIG.autoPlaySeconds * 1000);
    } catch (error) {
      isScrubReady = true;
      requestScrubFrame();
    }
  }

  function getScrollProgress() {
    const hero = document.querySelector('.hero-scroll');
    if (!hero) return 0;
    const rect = hero.getBoundingClientRect();
    const maxScroll = hero.offsetHeight - window.innerHeight;
    return clamp(-rect.top / maxScroll, 0, 1);
  }

  function updateTargetTime() {
    if (!isScrubReady || !video || !duration) return;
    const progress = getScrollProgress();
    const start = Math.min(CONFIG.autoPlaySeconds, duration - 0.05);
    const end = Math.max(start, duration - 0.05);
    targetTime = start + (end - start) * progress;
    requestScrubFrame();
  }

  function requestScrubFrame() {
    if (rafId) return;
    rafId = requestAnimationFrame(scrubVideo);
  }

  function scrubVideo() {
    rafId = null;
    if (!video || !isScrubReady) return;

    currentTime += (targetTime - currentTime) * CONFIG.scrubEase;
    if (Math.abs(video.currentTime - currentTime) > 0.025) {
      video.currentTime = clamp(currentTime, 0, duration || 0);
    }

    if (Math.abs(targetTime - currentTime) > 0.02) requestScrubFrame();
  }

  function toggleMenu(force) {
    const shouldOpen = typeof force === 'boolean' ? force : !menuPanel.classList.contains('is-open');
    menuPanel.classList.toggle('is-open', shouldOpen);
    menuPanel.setAttribute('aria-hidden', String(!shouldOpen));
    menuButton?.setAttribute('aria-expanded', String(shouldOpen));
  }

  function openExternalNotice(event) {
    event?.preventDefault();
    closeExternalNotice(false);
    externalModal?.classList.add('is-visible');
    externalModal?.setAttribute('aria-hidden', 'false');
    externalProgress.style.width = '0%';

    let elapsed = 0;
    progressTimer = window.setInterval(() => {
      elapsed += 100;
      externalProgress.style.width = `${Math.min((elapsed / CONFIG.externalDelay) * 100, 100)}%`;
    }, 100);

    externalTimer = window.setTimeout(() => {
      window.location.href = CONFIG.externalUrl;
    }, CONFIG.externalDelay);
  }

  function closeExternalNotice(keepFocus = true) {
    window.clearTimeout(externalTimer);
    window.clearInterval(progressTimer);
    externalTimer = null;
    progressTimer = null;
    externalModal?.classList.remove('is-visible');
    externalModal?.setAttribute('aria-hidden', 'true');
    if (externalProgress) externalProgress.style.width = '0%';
    if (keepFocus) document.activeElement?.blur();
  }

  function bindEvents() {
    startButton?.addEventListener('click', startExperience);
    window.addEventListener('scroll', updateTargetTime, { passive: true });
    window.addEventListener('resize', updateTargetTime, { passive: true });

    menuButton?.addEventListener('click', () => toggleMenu());
    menuClose?.addEventListener('click', () => toggleMenu(false));

    ['#courseExternalLink', '#courseExternalLinkMenu'].forEach((selector) => {
      document.querySelector(selector)?.addEventListener('click', (event) => {
        toggleMenu(false);
        openExternalNotice(event);
      });
    });

    externalClose?.addEventListener('click', () => closeExternalNotice());
    externalCancel?.addEventListener('click', () => closeExternalNotice());
    externalGo?.addEventListener('click', () => { window.location.href = CONFIG.externalUrl; });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        toggleMenu(false);
        closeExternalNotice();
      }
    });
  }

  function init() {
    body.classList.add('is-locked');
    const params = new URLSearchParams(window.location.search);
    if (params.get('skipLoading') === '1') {
      guideOverlay?.classList.add('is-hidden');
      body.classList.remove('is-locked');
    }
    initLoading();
    bindEvents();
  }

  init();
})();
