document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const buttons = document.querySelectorAll(".slider-btn");
  const canvas = document.createElement("canvas");
  const heroContainer = document.querySelector(".hero-slider");
  const canvasContainer = document.getElementById("canvas");
  
  let currentIndex = 0;
  let autoSlideTimer = null;
  const slideDuration = 8000;

  if (!slides.length || !heroContainer) return;

  // Montar el Canvas nativo
  const ctx = canvas.getContext("2d");
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "3";
  
  if (canvasContainer) {
    canvasContainer.appendChild(canvas);
  } else {
    heroContainer.appendChild(canvas);
  }

  function resizeCanvas() {
    canvas.width = heroContainer.clientWidth;
    canvas.height = heroContainer.clientHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // --- ANIMACIÓN DE FRAGMENTOS CUADRADOS ---
  let isAnimating = false;

  function animateSquareTransition(fromVid) {
    if (isAnimating || !fromVid) return;
    isAnimating = true;

    const cols = 12;
    const rows = 8;
    const blockWidth = canvas.width / cols;
    const blockHeight = canvas.height / rows;

    // Crear matriz de fragmentos con posiciones y velocidades aleatorias
    const blocks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        blocks.push({
          x: c * blockWidth,
          y: r * blockHeight,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          size: 1,
          opacity: 1
        });
      }
    }

    let progress = 0;

    function renderFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      progress += 0.03;

      let activeBlocks = 0;

      blocks.forEach((b) => {
        if (b.opacity > 0) {
          activeBlocks++;
          b.x += b.vx;
          b.y += b.vy;
          b.size = Math.max(0, 1 - progress);
          b.opacity = Math.max(0, 1 - progress);

          ctx.save();
          ctx.globalAlpha = b.opacity;
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
          ctx.lineWidth = 1.5;

          // Dibujar cuadro/fragmento
          const w = blockWidth * b.size;
          const h = blockHeight * b.size;
          ctx.fillRect(b.x, b.y, w, h);
          ctx.strokeRect(b.x, b.y, w, h);
          ctx.restore();
        }
      });

      if (progress < 1 && activeBlocks > 0) {
        requestAnimationFrame(renderFrame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isAnimating = false;
      }
    }

    renderFrame();
  }

  // --- LÓGICA DEL SLIDER ---
  function playCurrentVideo() {
    const currentVid = slides[currentIndex].querySelector("video");
    if (currentVid) {
      currentVid.muted = true;
      const playPromise = currentVid.play();
      if (playPromise !== undefined) playPromise.catch(() => {});
    }
  }

  function goToSlide(targetIndex) {
    if (targetIndex === currentIndex) return;

    const currentSlide = slides[currentIndex];
    const nextSlide = slides[targetIndex];
    const prevVid = currentSlide.querySelector("video");

    // Disparar efecto visual de cuadrados explotando/dispersándose
    animateSquareTransition(prevVid);

    if (prevVid) prevVid.pause();

    buttons[currentIndex].classList.remove("active");
    currentSlide.classList.remove("active");

    currentIndex = targetIndex;

    nextSlide.classList.add("active");
    buttons[currentIndex].classList.add("active");

    playCurrentVideo();
    resetTimer();
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.getAttribute("data-slide"));
      goToSlide(index);
    });
  });

  function startTimer() {
    autoSlideTimer = setTimeout(() => {
      let nextIndex = (currentIndex + 1) % slides.length;
      goToSlide(nextIndex);
    }, slideDuration);
  }

  function resetTimer() {
    clearTimeout(autoSlideTimer);
    startTimer();
  }

  slides.forEach((slide) => {
    const vid = slide.querySelector("video");
    if (vid) {
      vid.addEventListener("ended", () => {
        let nextIndex = (currentIndex + 1) % slides.length;
        goToSlide(nextIndex);
      });
    }
  });

  playCurrentVideo();
  startTimer();
});
