document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const buttons = document.querySelectorAll(".slider-btn");
  let currentIndex = 0;
  let autoSlideTimer = null;
  const slideDuration = 8000;

  if (!slides.length) return;

  // --- CONFIGURACIÓN DE CURTAINS.JS (FRAGMENTOS SHADER) ---
  let curtains = null;
  let plane = null;

  // Vertex Shader: Crea la deformación por ondas / fragmentos
  const vs = `
    precision mediump float;
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;
    uniform float uTransition;
    varying vec2 vTextureCoord;
    
    void main() {
      vec3 pos = aVertexPosition;
      // Distorsión en bloques/cuadrados usando senos en retícula
      float wave = sin(pos.x * 10.0 + uTransition * 6.28) * cos(pos.y * 10.0 + uTransition * 6.28);
      pos.z += wave * uTransition * 0.5;
      gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
      vTextureCoord = aTextureCoord;
    }
  `;

  // Fragment Shader: Muestra la textura del video
  const fs = `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uRenderTexture;
    uniform float uOpacity;

    void main() {
      vec4 color = texture2D(uRenderTexture, vTextureCoord);
      gl_FragColor = vec4(color.rgb, color.a * uOpacity);
    }
  `;

  function initCurtains() {
    if (typeof Curtains === "undefined") return;

    curtains = new Curtains({
      container: "canvas",
      pixelRatio: Math.min(1.5, window.devicePixelRatio)
    });

    const params = {
      vertexShader: vs,
      fragmentShader: fs,
      uniforms: {
        transition: { name: "uTransition", type: "1f", value: 0 },
        opacity: { name: "uOpacity", type: "1f", value: 1.0 }
      }
    };

    const firstSlide = slides[0];
    plane = curtains.addPlane(firstSlide, params);

    if (plane) {
      plane.onRender(() => {
        if (plane.uniforms.transition.value > 0) {
          plane.uniforms.transition.value -= 0.02;
          if (plane.uniforms.transition.value < 0) plane.uniforms.transition.value = 0;
        }
      });
    }
  }

  function triggerTransition() {
    if (plane) {
      plane.uniforms.transition.value = 1.0; // Dispara el efecto de fragmentos
    }
  }

  // --- CONTROL DE VIDEOS Y SLIDER ---
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
    if (prevVid) prevVid.pause();

    buttons[currentIndex].classList.remove("active");
    currentSlide.classList.remove("active");

    currentIndex = targetIndex;

    nextSlide.classList.add("active");
    buttons[currentIndex].classList.add("active");

    playCurrentVideo();
    triggerTransition();
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

  initCurtains();
  playCurrentVideo();
  startTimer();
});
