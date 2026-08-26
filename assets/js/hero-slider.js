document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const buttons = document.querySelectorAll(".slider-btn");
  const heroContainer = document.querySelector(".hero-slider");
  const canvasContainer = document.getElementById("canvas");
  
  let currentIndex = 0;
  let autoSlideTimer = null;
  const slideDuration = 8000;
  let isAnimating = false;

  if (!slides.length || !heroContainer) return;

  // 1. Configuración del Canvas
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

  // 2. Precarga e inicialización de todos los vídeos
  slides.forEach((slide) => {
    const vid = slide.querySelector("video");
    if (vid) {
      vid.muted = true;
      vid.playsInline = true;
      vid.preload = "auto";
      // Cargar activamente sin reproducir
      vid.load();
    }
  });

  // Obtener fuente válida para el canvas
  function getSlideSource(slide) {
    const video = slide.querySelector("video");
    if (video && video.readyState >= 2 && video.videoWidth > 0) {
      return video;
    }
    const img = slide.querySelector("img");
    if (img && img.complete && img.naturalWidth > 0) {
      return img;
    }
    return null;
  }

  // --- EFECTOS DE CANVA ---
  function explosiveImageBlocks(sourceElement) {
    const cols = 10, rows = 6;
    const bw = canvas.width / cols;
    const bh = canvas.height / rows;
    const blocks = [];

    const srcW = sourceElement.videoWidth || sourceElement.width || canvas.width;
    const srcH = sourceElement.videoHeight || sourceElement.height || canvas.height;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        blocks.push({
          sx: c * (srcW / cols),
          sy: r * (srcH / rows),
          sWidth: srcW / cols,
          sHeight: srcH / rows,
          x: c * bw,
          y: r * bh,
          vx: (Math.random() - 0.5) * 25,
          vy: (Math.random() - 0.5) * 25,
          scale: 1,
          rotation: (Math.random() - 0.5) * 0.5
        });
      }
    }

    let progress = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      progress += 0.03;

      blocks.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        b.scale = Math.max(0, 1 - progress);

        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.translate(b.x + bw / 2, b.y + bh / 2);
        ctx.rotate(b.rotation * progress);
        
        try {
          ctx.drawImage(
            sourceElement,
            b.sx, b.sy, b.sWidth, b.sHeight,
            - (bw * b.scale) / 2, - (bh * b.scale) / 2, bw * b.scale, bh * b.scale
          );
        } catch (e) {}

        ctx.restore();
      });

      if (progress < 1) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isAnimating = false;
      }
    }
    render();
  }

  function curtainImageSlats(sourceElement) {
    const cols = 12;
    const bw = canvas.width / cols;
    const slats = [];

    const srcW = sourceElement.videoWidth || sourceElement.width || canvas.width;
    const srcH = sourceElement.videoHeight || sourceElement.height || canvas.height;

    for (let c = 0; c < cols; c++) {
      slats.push({
        sx: c * (srcW / cols),
        sy: 0,
        sWidth: srcW / cols,
        sHeight: srcH,
        x: c * bw,
        y: 0,
        speedY: (c % 2 === 0 ? 1 : -1) * (12 + Math.random() * 8)
      });
    }

    let progress = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      progress += 0.03;

      slats.forEach(s => {
        s.y += s.speedY;

        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress);
        try {
          ctx.drawImage(
            sourceElement,
            s.sx, s.sy, s.sWidth, s.sHeight,
            s.x, s.y, bw, canvas.height
          );
        } catch (e) {}
        ctx.restore();
      });

      if (progress < 1) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isAnimating = false;
      }
    }
    render();
  }

  function playTransitionEffect(targetIndex, currentSlide) {
    if (isAnimating) return;

    const sourceEl = getSlideSource(currentSlide);
    if (!sourceEl) return; // Si el vídeo previo no está listo, se salta la animación canvas

    isAnimating = true;

    if (targetIndex % 2 === 0) {
      explosiveImageBlocks(sourceEl);
    } else {
      curtainImageSlats(sourceEl);
    }
  }

  // --- CONTROL DE REPRODUCCIÓN SEGURO ---
  function playVideoSafely(video) {
    if (!video) return;

    video.muted = true;
    
    // Si el vídeo no ha cargado lo suficiente, forzar carga
    if (video.readyState < 2) {
      video.load();
    }

    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // En caso de bloqueo por el navegador, reintentar al interactuar
        document.addEventListener('click', () => video.play(), { once: true });
      });
    }
  }

  function goToSlide(targetIndex) {
    if (targetIndex === currentIndex) return;

    const currentSlide = slides[currentIndex];
    const nextSlide = slides[targetIndex];
    const prevVid = currentSlide.querySelector("video");
    const nextVid = nextSlide.querySelector("video");

    // Ejecutar la animación sobre el fotograma saliente
    playTransitionEffect(targetIndex, currentSlide);

    // Pausar vídeo anterior
    if (prevVid) prevVid.pause();

    // Actualizar Clases
    if (buttons[currentIndex]) buttons[currentIndex].classList.remove("active");
    currentSlide.classList.remove("active");

    currentIndex = targetIndex;

    nextSlide.classList.add("active");
    if (buttons[currentIndex]) buttons[currentIndex].classList.add("active");

    // Reproducir nuevo vídeo
    if (nextVid) {
      nextVid.currentTime = 0;
      playVideoSafely(nextVid);
    }

    resetTimer();
  }

  // Event Listeners
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.getAttribute("data-slide"));
      if (!isNaN(index)) goToSlide(index);
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

  // Iniciar primer vídeo
  const firstVid = slides[0].querySelector("video");
  if (firstVid) playVideoSafely(firstVid);

  startTimer();
});
