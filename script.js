const canvas = document.getElementById("video-canvas");
const context = canvas.getContext("2d");
const scrollContainer = document.getElementById("scroll-container");

// 원본 이미지 시퀀스 해상도에 맞춰 수정하세요.
const sequenceWidth = 1920;
const sequenceHeight = 980;

// 최종 이미지 수: frame_000.webp ~ frame_2551.webp = 총 2552장
const frameCount = 2552;

// 초반 자동재생: 0번 프레임부터 70번 프레임까지 자동재생
const autoPlayEndFrame = 70;
const autoPlayDelay = 1000;
const autoPlayDuration = 2200;

// 이미지 경로: assets/frames/frame_000.webp 형식
const currentFrame = (index) => {
  return `./assets/frames/frame_${index.toString().padStart(3, "0")}.webp`;
};

canvas.width = sequenceWidth;
canvas.height = sequenceHeight;

const images = [];
const sequence = { frame: 0 };
let loadedCount = 0;
let isAutoPlaying = true;
let scrollTween = null;

function resizeCanvas() {
  const windowRatio = window.innerWidth / window.innerHeight;
  const imageRatio = sequenceWidth / sequenceHeight;

  if (windowRatio > imageRatio) {
    canvas.style.width = "100vw";
    canvas.style.height = "auto";
  } else {
    canvas.style.width = "auto";
    canvas.style.height = "100vh";
  }
}

function render() {
  const frameIndex = Math.min(frameCount - 1, Math.max(0, Math.round(sequence.frame)));
  const image = images[frameIndex];

  if (!image || !image.complete) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
}

function preloadImages() {
  for (let i = 0; i < frameCount; i += 1) {
    const image = new Image();

    image.onload = () => {
      loadedCount += 1;

      if (i === 0) {
        render();
      }
    };

    image.onerror = () => {
      console.warn(`이미지 로드 실패: ${currentFrame(i)}`);
    };

    image.src = currentFrame(i);
    images.push(image);
  }
}

function createScrollTrigger() {
  gsap.registerPlugin(ScrollTrigger);

  scrollTween = gsap.to(sequence, {
    frame: frameCount - 1,
    snap: "frame",
    ease: "none",
    paused: true,
    scrollTrigger: {
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        if (isAutoPlaying) return;

        const scrollFrameStart = autoPlayEndFrame;
        const scrollFrameRange = frameCount - 1 - scrollFrameStart;
        sequence.frame = scrollFrameStart + self.progress * scrollFrameRange;
        render();
      }
    }
  });
}

function startAutoPlay() {
  sequence.frame = 0;
  render();

  document.body.classList.add("is-autoplaying");

  setTimeout(() => {
    gsap.to(sequence, {
      frame: autoPlayEndFrame,
      duration: autoPlayDuration / 1000,
      ease: "power2.inOut",
      snap: "frame",
      onUpdate: render,
      onComplete: () => {
        isAutoPlaying = false;
        document.body.classList.remove("is-autoplaying");
        sequence.frame = autoPlayEndFrame;
        render();
        ScrollTrigger.refresh();
      }
    });
  }, autoPlayDelay);
}

resizeCanvas();
preloadImages();
createScrollTrigger();
startAutoPlay();

window.addEventListener("resize", () => {
  resizeCanvas();
  render();
});
