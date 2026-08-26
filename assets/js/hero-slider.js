document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const buttons = document.querySelectorAll(".slider-btn");
  const heroContainer = document.querySelector(".hero-slider");
  const canvasContainer = document.getElementById("canvas");
  
  let currentIndex = 0;
  let autoSlideTimer = null;
  const slideDuration = 8000;

  if (!slides.length || !heroContainer) return;

  // Setup Canvas
  const canvas = document.createElement("canvas");
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

  let isAnimating = false;

  // ==========================================
  // CATÁLOGO DE EFECTOS / TRANSICIONES
  // ==========================================

  // Efecto 1: Cuadrados Explotando
  function explosiveBlocks() {
    const cols = 12, rows = 8;
    const bw = canvas.width / cols, bh = canvas.height / rows;
    const blocks = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        blocks.push({
          x: c * bw, y: r * bh,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          size: 1
        });
      }
    }

    let progress = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      progress += 0.035;

      blocks.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        b.size = Math.max(0, 1 - progress);

        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.fillRect(b.x, b.y, bw * b.size, bh * b.size);
        ctx.strokeRect(b.x, b.y, bw * b.size, bh * b.size);
        ctx.restore();
      });

      if (progress < 1) requestAnimationFrame(render);
      else { ctx.clearRect(0, 0, canvas.width, canvas.height); isAnimating = false; }
    }
    render();
  }

  // Efecto 2: Cortina Digital / Caída por Columnas (Matrix)
  function matrixColumns() {
    const cols = 16;
    const bw = canvas.width / cols;
    const columns = [];

    for (let c = 0; c < cols; c++) {
      columns.push({
        x: c * bw,
        height: 0,
        speed: 15 + Math.random() * 25,
        delay: Math.random() * 200
      });
    }

    let startTime = Date.now();
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = Date.now() - startTime;
      let allDone = true;

      columns.forEach(col => {
        if (elapsed > col.delay) {
          col.height += col.speed;
          if (col.height < canvas.height) allDone = false;

          ctx.save();
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 1;
          ctx.fillRect(col.x, 0, bw, col.height);
          ctx.strokeRect(col.x, 0, bw, col.height);
          ctx.restore();
        } else {
          allDone = false;
        }
      });

      if (!allDone) requestAnimationFrame(render);
      else { ctx.clearRect(0, 0, canvas.width, canvas.height); isAnimating = false; }
    }
    render();
  }

  // Efecto 3: Expansión Giratoria
  function centerRipple() {
    const cols = 10, rows = 6;
    const bw = canvas.width / cols, bh = canvas.height / rows;
    let progress = 0;

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      progress += 0.03;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * bw + bw / 2;
          const y = r * bh + bh / 2;
          const size = (1 - progress) * Math.min(bw, bh);

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(progress * Math.PI);
          ctx.globalAlpha = Math.max(0, 1 - progress);
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 2;
          ctx.fillRect(-size / 2, -size / 2, size, size);
          ctx.strokeRect(-size / 2, -size / 2, size, size);
          ctx.restore();
        }
      }

      if (progress < 1) requestAnimationFrame(render);
      else { ctx.clearRect(0, 0, canvas.width, canvas.height); isAnimating = false; }
    }
    render();
  }

  // Selector de Animación por Diapositiva
  function playTransitionEffect(targetIndex) {
    if (isAnimating) return;
    isAnimating = true;

    // Asignar una transición única según la diapositiva a la que vas
    switch (targetIndex) {
      case 0:
        explosiveBlocks();
        break;
      case 1:
        matrixColumns();
        break;
      case 2:
        centerRipple();
        break;
      case 3:
        explosiveBlocks();
        break;
      default:
        // Aleatorio para el resto
        const effects = [explosiveBlocks, matrixColumns, centerRipple];
        const randomFx = effects[Math.floor(Math.random() * effects.length)];
        randomFx();
        break;
    }
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

    // Ejecuta la transición específica para la nueva diapositiva
    playTransitionEffect(targetIndex);

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
