const adaptivePopup = document.querySelector('#adaptivePopup');
const startButton = document.querySelector('#startButton');
const loadingPage = document.querySelector('#loading');
const slides = document.querySelectorAll('.safety-slide');
const loadingFill = document.querySelector('#loadingFill');
const gnb = document.querySelector('#gnb');
const menuButton = document.querySelector('#menuButton');
const menuPanel = document.querySelector('#menuPanel');
const scrollGuide = document.querySelector('#scrollGuide');
const endCta = document.querySelector('#endCta');
const externalNotice = document.querySelector('#externalNotice');
const externalCancelButton = document.querySelector('#externalCancelButton');
const externalMoveButton = document.querySelector('#externalMoveButton');
const courseIndexExternalLink = document.querySelector('#courseIndexExternalLink');
const canvas = document.querySelector('#sequenceCanvas');
const cursor = document.querySelector('#brandCursor');

const context = canvas ? canvas.getContext('2d') : null;

const slideInterval = 2000;
const totalLoadingTime = slides.length * slideInterval;
const menuDuration = 780;
const courseIndexUrl = 'https://www.sisul.or.kr/open_content/traffic/bike_course/index.html';

const frameCount = 2552;
const autoPlayEndFrame = 70;
const autoPlayDelay = 1000;
const autoPlayDuration = 2400;
const framePath = './assets/frames/';
const framePrefix = 'frame_';
const frameExtension = '.webp';
const canvasWidth = 1920;
const canvasHeight = 980;

let currentSlideIndex = 0;
let slideTimer = null;
let scrollGuideTimer = null;
let isPageReady = false;
let isAutoPlaying = false;
let isMenuOpen = false;
let isMenuClosing = false;
let currentFrameIndex = -1;
let externalTargetUrl = '';
let scrollTween = null;

const images = [];
const sequence = { frame: autoPlayEndFrame };

if (canvas) {
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getFrameSrc(index) {
  return `${framePath}${framePrefix}${String(index).padStart(3, '0')}${frameExtension}`;
}

function drawCoverImage(image) {
  if (!context || !canvas || !image || !image.complete) return;

  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = canvas.width / canvas.height;
  let drawWidth = canvas.width;
  let drawHeight = canvas.height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = canvas.height;
    drawWidth = drawHeight * imageRatio;
    offsetX = (canvas.width - drawWidth) / 2;
  } else {
    drawWidth = canvas.width;
    drawHeight = drawWidth / imageRatio;
    offsetY = (canvas.height - drawHeight) / 2;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function renderFrame(frameIndex) {
  const safeIndex = clamp(Math.round(frameIndex), 0, frameCount - 1);
  if (safeIndex === currentFrameIndex && images[safeIndex]?.complete) return;

  currentFrameIndex = safeIndex;
  const image = images[safeIndex];

  if (image && image.complete) {
    drawCoverImage(image);
  }

  updateEndCta(safeIndex);
}

function preloadFrames() {
  for (let i = 0; i < frameCount; i += 1) {
    if (images[i]) continue;

    const image = new Image();
    image.src = getFrameSrc(i);
    images[i] = image;
  }

  if (images[0]) {
    images[0].onload = () => renderFrame(0);
  }
}

function updateEndCta(frameIndex) {
  if (!endCta) return;

  if (frameIndex >= frameCount - 8) {
    endCta.classList.add('is-visible');
  } else {
    endCta.classList.remove('is-visible');
  }
}

function showGnb() {
  gnb?.classList.add('is-visible');
}

function hideGnb() {
  gnb?.classList.remove('is-visible');
}

function showScrollGuide() {
  scrollGuide?.classList.add('is-visible');
}

function hideScrollGuide() {
  scrollGuide?.classList.remove('is-visible');
}

function restartScrollGuideTimer() {
  clearTimeout(scrollGuideTimer);
  scrollGuideTimer = setTimeout(() => hideScrollGuide(), 4200);
}

function createScrollTrigger() {
  if (!window.gsap || !window.ScrollTrigger) {
    window.addEventListener('scroll', handleFallbackScroll, { passive: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  scrollTween?.kill();
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

  sequence.frame = autoPlayEndFrame;

  scrollTween = gsap.to(sequence, {
    frame: frameCount - 1,
    snap: 'frame',
    ease: 'none',
    scrollTrigger: {
      trigger: '#scrollProxy',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1
    },
    onUpdate: () => renderFrame(sequence.frame)
  });

  ScrollTrigger.refresh();
}

function handleFallbackScroll() {
  if (!isPageReady || isMenuOpen || isMenuClosing) return;

  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = clamp(window.scrollY / maxScroll, 0, 1);
  const frameRange = frameCount - 1 - autoPlayEndFrame;
  renderFrame(autoPlayEndFrame + progress * frameRange);
}

function startFrameAutoPlay() {
  preloadFrames();
  window.scrollTo(0, 0);

  isAutoPlaying = true;
  isPageReady = false;
  hideGnb();
  hideScrollGuide();
  endCta?.classList.remove('is-visible');

  renderFrame(0);

  setTimeout(() => {
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = clamp(elapsed / autoPlayDuration, 0, 1);
      const eased = easeInOutCubic(progress);
      const frame = Math.round(eased * autoPlayEndFrame);

      renderFrame(frame);

      if (progress < 1) {
        requestAnimationFrame(animate);
        return;
      }

      renderFrame(autoPlayEndFrame);
      isAutoPlaying = false;
      isPageReady = true;
      showGnb();
      showScrollGuide();
      restartScrollGuideTimer();
      createScrollTrigger();
    }

    requestAnimationFrame(animate);
  }, autoPlayDelay);
}

function startLoading() {
  adaptivePopup?.classList.add('is-hidden');
  loadingPage?.classList.add('is-visible');

  if (loadingFill) {
    loadingFill.style.animationDuration = `${totalLoadingTime}ms`;
    loadingFill.classList.add('is-running');
  }

  currentSlideIndex = 0;
  slides.forEach((slide, index) => slide.classList.toggle('active', index === 0));

  slideTimer = setInterval(() => {
    slides[currentSlideIndex]?.classList.remove('active');
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    slides[currentSlideIndex]?.classList.add('active');
  }, slideInterval);

  setTimeout(() => {
    clearInterval(slideTimer);
    loadingPage?.classList.remove('is-visible');
    loadingPage?.classList.add('is-hidden');
    startFrameAutoPlay();
  }, totalLoadingTime);
}

function skipLoadingAndStart() {
  adaptivePopup?.classList.add('is-hidden');
  loadingPage?.classList.add('is-hidden');
  startFrameAutoPlay();
}

function openMenu() {
  if (!menuButton || !menuPanel || isMenuClosing) return;

  isMenuOpen = true;
  isMenuClosing = false;
  document.body.classList.add('is-menu-open');
  document.body.classList.remove('is-menu-closing');
  menuPanel.classList.remove('is-closing');
  menuPanel.classList.add('is-open');
  menuButton.classList.add('is-open');
  menuButton.setAttribute('aria-label', '메뉴 닫기');
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

    if (typeof callback === 'function') callback();
  }, menuDuration);
}

function toggleMenu() {
  if (isMenuOpen) closeMenu();
  else openMenu();
}

function openExternalNotice(url) {
  externalTargetUrl = url;
  externalNotice?.classList.add('is-visible');
  externalNotice?.setAttribute('aria-hidden', 'false');
}

function closeExternalNotice() {
  externalTargetUrl = '';
  externalNotice?.classList.remove('is-visible');
  externalNotice?.setAttribute('aria-hidden', 'true');
}

function moveToExternalTarget() {
  if (!externalTargetUrl) return;
  window.location.href = externalTargetUrl;
}

function initCursor() {
  if (!cursor || window.matchMedia('(pointer: coarse)').matches) return;

  window.addEventListener('mousemove', (event) => {
    cursor.classList.add('is-visible');
    cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
  });

  document.querySelectorAll('a, button, .menu-link, .menu-sns-link').forEach((element) => {
    element.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
    element.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
  });
}

function initPage() {
  preloadFrames();
  renderFrame(0);
  hideGnb();
  hideScrollGuide();

  const params = new URLSearchParams(window.location.search);
  const shouldSkipLoading = params.get('skipLoading') === '1';

  if (shouldSkipLoading) {
    params.delete('skipLoading');
    const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', cleanUrl);
    skipLoadingAndStart();
  }

  initCursor();
}

menuButton?.addEventListener('click', toggleMenu);
startButton?.addEventListener('click', startLoading);
courseIndexExternalLink?.addEventListener('click', (event) => {
  event.preventDefault();
  if (isMenuOpen) {
    closeMenu(() => openExternalNotice(courseIndexUrl));
    return;
  }
  openExternalNotice(courseIndexUrl);
});
externalCancelButton?.addEventListener('click', closeExternalNotice);
externalMoveButton?.addEventListener('click', moveToExternalTarget);

window.addEventListener('resize', () => {
  renderFrame(currentFrameIndex < 0 ? 0 : currentFrameIndex);
});

initPage();
