document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const buttons = document.querySelectorAll(".slider-btn");
  const heroContainer = document.querySelector(".hero-slider");
  const canvasContainer = document.getElementById("canvas");
  
  let currentIndex = 0;
  let autoSlideTimer = null;
  const slideDuration = 8000;

  if (!slides.length || !heroContainer) return;

  // Setup Canvas para procesamiento de fragmentos de imagen
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

  // Captura el fotograma actual del video o la imagen del slide
  function getSlideSource(slide) {
    const video = slide.querySelector("video");
    if (video && video.readyState >= 2) {
      return video;
    }
    const img = slide.querySelector("img");
    return img || null;
  }

  // ==========================================
  // EFECTOS DE FRAGMENTACIÓN REAL DE IMAGEN/VIDEO
  // ==========================================

  // Efecto 1: El video se rompe en cuadros reales y explotan
  function explosiveImageBlocks(sourceElement) {
    const cols = 10, rows = 6;
    const bw = canvas.width / cols;
    const bh = canvas.height / rows;
    const blocks = [];

    // Recortar la textura del video/imagen en trozos
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        blocks.push({
          sx: c * (sourceElement.videoWidth || sourceElement.width || canvas.width) / cols,
          sy: r * (sourceElement.videoHeight || sourceElement.height || canvas.height) / rows,
          sWidth: (sourceElement.videoWidth || sourceElement.width || canvas.width) / cols,
          sHeight: (sourceElement.videoHeight || sourceElement.height || canvas.height) / rows,
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
      progress += 0.025;

      blocks.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        b.scale = Math.max(0, 1 - progress);

        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.translate(b.x + bw / 2, b.y + bh / 2);
        ctx.rotate(b.rotation * progress);
        
        // Dibuja el fragmento real extraído del video
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

  // Efecto 2: El video se divide en persianas/franjas verticales que se desplazan
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
      progress += 0.025;

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

  // Controlador de efectos reales
  function playTransitionEffect(targetIndex, currentSlide) {
    if (isAnimating) return;

    const sourceEl = getSlideSource(currentSlide);
    
    // Si no se puede extraer la textura, salta la animación limpia
    if (!sourceEl) return;

    isAnimating = true;

    // Alternar los efectos de corte según el índice
    if (targetIndex % 2 === 0) {
      explosiveImageBlocks(sourceEl);
    } else {
      curtainImageSlats(sourceEl);
    }
  }

  // --- LÓGICA DEL SLIDER ---
  function playCurrentVideo() {
  const currentSlide = slides[currentIndex];
  if (!currentSlide) return;

  const currentVid = currentSlide.querySelector("video");
  if (currentVid) {
    currentVid.muted = true;
    currentVid.currentTime = 0; // Reinicia el video desde el inicio
    
    // Forzar la carga si el navegador lo mantuvo en pausa
    if (currentVid.readyState < 2) {
      currentVid.load();
    }

    const playPromise = currentVid.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn("Autoplay bloqueado o interrumpido:", error);
      });
    }
  }
}

  function goToSlide(targetIndex) {
    if (targetIndex === currentIndex) return;

    const currentSlide = slides[currentIndex];
    const nextSlide = slides[targetIndex];
    const prevVid = currentSlide.querySelector("video");

    // Ejecuta la fragmentación sobre la imagen/video actual antes de ocultarlo
    playTransitionEffect(targetIndex, currentSlide);

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
