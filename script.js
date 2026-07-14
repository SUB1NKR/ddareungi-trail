window.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const adaptivePopup = document.querySelector("#adaptivePopup");
  const startButton = document.querySelector("#startButton");
  const loadingPage = document.querySelector("#loading");
  const slides = document.querySelectorAll(".safety-slide");
  const loadingFill = document.querySelector("#loadingFill");

  const gnb = document.querySelector("#gnb");
  const menuButton = document.querySelector("#menuButton");
  const menuPanel = document.querySelector("#menuPanel");

  const canvas = document.querySelector("#sequenceCanvas");
  const context = canvas.getContext("2d");
  const scrollSection = document.querySelector("#scrollSection");
  const scrollGuide = document.querySelector("#scrollGuide");
  const endCta = document.querySelector("#endCta");

  const externalNotice = document.querySelector("#externalNotice");
  const externalCancelButton = document.querySelector("#externalCancelButton");
  const externalMoveButton = document.querySelector("#externalMoveButton");
  const courseIndexExternalLink = document.querySelector("#courseIndexExternalLink");

  const customCursor = document.querySelector("#customCursor");

  const frameCount = 2552;
  const autoPlayEndFrame = 70;
  const autoPlayDelay = 1000;
  const autoPlayDuration = 2600;
  const framePath = "./assets/frames/";
  const framePrefix = "frame_";
  const frameExtension = ".webp";
  const canvasBaseWidth = 1920;
  const canvasBaseHeight = 980;
  const slideInterval = 2000;
  const loadingTotalTime = Math.max(slides.length, 1) * slideInterval;
  const menuDuration = 780;
  const courseIndexUrl = "https://www.sisul.or.kr/open_content/traffic/bike_course/index.html";

  const images = [];
  const sequence = { frame: 0 };

  let currentSlideIndex = 0;
  let slideTimer = null;
  let isMenuOpen = false;
  let isMenuClosing = false;
  let pendingExternalUrl = "";
  let externalTimer = null;
  let scrollTween = null;
  let isSequenceReady = false;
  let isAutoPlaying = false;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function getFrameSrc(index) {
    return `${framePath}${framePrefix}${String(index).padStart(3, "0")}${frameExtension}`;
  }

  function loadImage(index) {
    if (images[index]) return images[index];

    const img = new Image();
    img.src = getFrameSrc(index);
    images[index] = img;

    return img;
  }

  function preloadRange(start, end) {
    const safeStart = clamp(start, 0, frameCount - 1);
    const safeEnd = clamp(end, 0, frameCount - 1);

    for (let i = safeStart; i <= safeEnd; i += 1) {
      loadImage(i);
    }
  }

  function preloadAllInBatches() {
    let index = 0;
    const batchSize = 32;

    function batch() {
      const end = Math.min(index + batchSize, frameCount);

      for (; index < end; index += 1) {
        loadImage(index);
      }

      if (index < frameCount) {
        requestIdleCallback ? requestIdleCallback(batch) : setTimeout(batch, 16);
      }
    }

    batch();
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    render();
  }

  function drawCover(image) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const imageRatio = canvasBaseWidth / canvasBaseHeight;
    const viewportRatio = viewportWidth / viewportHeight;

    let drawWidth;
    let drawHeight;
    let offsetX;
    let offsetY;

    if (viewportRatio > imageRatio) {
      drawWidth = viewportWidth;
      drawHeight = viewportWidth / imageRatio;
      offsetX = 0;
      offsetY = (viewportHeight - drawHeight) / 2;
    } else {
      drawHeight = viewportHeight;
      drawWidth = viewportHeight * imageRatio;
      offsetX = (viewportWidth - drawWidth) / 2;
      offsetY = 0;
    }

    context.clearRect(0, 0, viewportWidth, viewportHeight);
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  }

  function render() {
    const frameIndex = clamp(Math.round(sequence.frame), 0, frameCount - 1);
    const image = loadImage(frameIndex);

    if (!image || !image.complete) {
      image.onload = render;
      return;
    }

    drawCover(image);
    updateEndCta(frameIndex);
  }

  function updateEndCta(frameIndex) {
    if (!endCta) return;

    const shouldShow = isSequenceReady && !isAutoPlaying && frameIndex >= frameCount - 8;

    endCta.classList.toggle("is-visible", shouldShow);
  }

  function setupScrollTrigger() {
    if (scrollTween) {
      scrollTween.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    }

    scrollTween = gsap.to(sequence, {
      frame: frameCount - 1,
      snap: "frame",
      ease: "none",
      paused: false,
      scrollTrigger: {
        trigger: scrollSection,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: () => {
          if (!isSequenceReady || isAutoPlaying) return;
          render();
        }
      }
    });

    ScrollTrigger.refresh();
  }

  function setScrollToFrame(frameIndex) {
    const trigger = ScrollTrigger.getAll()[0];
    if (!trigger) return;

    const progress = frameIndex / (frameCount - 1);
    const targetScroll = trigger.start + (trigger.end - trigger.start) * progress;

    window.scrollTo(0, targetScroll);
  }

  function showGnb() {
    gnb?.classList.add("is-visible");
  }

  function hideGnb() {
    gnb?.classList.remove("is-visible");
  }

  function showScrollGuide() {
    scrollGuide?.classList.add("is-visible");
  }

  function hideScrollGuide() {
    scrollGuide?.classList.remove("is-visible");
  }

  function startAutoPlay() {
    isAutoPlaying = true;
    isSequenceReady = false;

    hideScrollGuide();
    hideGnb();
    endCta?.classList.remove("is-visible");

    canvas.classList.add("is-visible");
    sequence.frame = 0;
    render();

    setTimeout(() => {
      const startTime = performance.now();

      function animate(now) {
        const elapsed = now - startTime;
        const progress = clamp(elapsed / autoPlayDuration, 0, 1);
        const eased = easeInOutCubic(progress);

        sequence.frame = Math.round(eased * autoPlayEndFrame);
        render();

        if (progress < 1) {
          requestAnimationFrame(animate);
          return;
        }

        sequence.frame = autoPlayEndFrame;
        render();

        isAutoPlaying = false;
        isSequenceReady = true;

        setupScrollTrigger();
        setScrollToFrame(autoPlayEndFrame);

        showGnb();
        showScrollGuide();
        gnb?.classList.add("is-solid");
      }

      requestAnimationFrame(animate);
    }, autoPlayDelay);
  }

  function startLoading() {
    adaptivePopup?.classList.add("is-hidden");
    loadingPage?.classList.add("is-visible");

    clearInterval(slideTimer);

    currentSlideIndex = 0;
    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === 0);
    });

    if (loadingFill) {
      loadingFill.style.width = "0%";
      requestAnimationFrame(() => {
        loadingFill.style.width = "100%";
      });
    }

    slideTimer = setInterval(() => {
      slides[currentSlideIndex]?.classList.remove("is-active");
      currentSlideIndex = (currentSlideIndex + 1) % slides.length;
      slides[currentSlideIndex]?.classList.add("is-active");
    }, slideInterval);

    setTimeout(() => {
      clearInterval(slideTimer);
      loadingPage?.classList.remove("is-visible");
      loadingPage?.classList.add("is-hidden");
      startAutoPlay();
    }, loadingTotalTime);
  }

  function skipLoadingAndStart() {
    adaptivePopup?.classList.add("is-hidden");
    loadingPage?.classList.add("is-hidden");
    startAutoPlay();
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
      isMenuClosing = false;

      menuPanel.classList.remove("is-closing");
      menuButton.classList.remove("is-open");
      menuButton.setAttribute("aria-label", "메뉴 열기");
      document.body.classList.remove("is-menu-closing");

      if (typeof callback === "function") callback();
    }, menuDuration);
  }

  function toggleMenu() {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function showExternalNotice(url) {
    pendingExternalUrl = url;
    externalNotice?.classList.add("is-visible");

    clearTimeout(externalTimer);
  }

  function hideExternalNotice() {
    pendingExternalUrl = "";
    externalNotice?.classList.remove("is-visible");

    clearTimeout(externalTimer);
  }

  function moveExternalNow() {
    if (!pendingExternalUrl) return;
    window.location.href = pendingExternalUrl;
  }

  function initCustomCursor() {
    if (!customCursor) return;

    window.addEventListener("mousemove", (event) => {
      customCursor.style.left = `${event.clientX}px`;
      customCursor.style.top = `${event.clientY}px`;
    });

    document.querySelectorAll("a, button").forEach((element) => {
      element.addEventListener("mouseenter", () => {
        document.body.classList.add("is-cursor-hover");
      });

      element.addEventListener("mouseleave", () => {
        document.body.classList.remove("is-cursor-hover");
      });
    });
  }

  function initPage() {
    resizeCanvas();
    preloadRange(0, Math.min(autoPlayEndFrame + 20, frameCount - 1));
    preloadAllInBatches();

    const params = new URLSearchParams(window.location.search);

    if (params.get("skipLoading") === "1") {
      window.history.replaceState({}, document.title, window.location.pathname);
      skipLoadingAndStart();
      return;
    }

    adaptivePopup?.classList.remove("is-hidden");
  }

  startButton?.addEventListener("click", startLoading);
  menuButton?.addEventListener("click", toggleMenu);

  courseIndexExternalLink?.addEventListener("click", (event) => {
    event.preventDefault();

    if (isMenuOpen) {
      closeMenu(() => showExternalNotice(courseIndexUrl));
      return;
    }

    showExternalNotice(courseIndexUrl);
  });

  externalCancelButton?.addEventListener("click", hideExternalNotice);
  externalMoveButton?.addEventListener("click", moveExternalNow);

  window.addEventListener("resize", () => {
    resizeCanvas();
    ScrollTrigger.refresh();
  });

  window.addEventListener("scroll", () => {
    if (!gnb) return;
    gnb.classList.toggle("is-solid", window.scrollY > 40);
  });

  initCustomCursor();
  initPage();
});
