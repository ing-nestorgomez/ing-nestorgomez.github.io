document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const buttons = document.querySelectorAll(".slider-btn");
  let currentIndex = 0;
  let autoSlideTimer = null;
  const slideDuration = 8000;

  if (!slides.length) return;

  // --- CONFIGURACIÓN DE CURTAINS.JS ---
  let curtains = null;
  let plane = null;

  // Vertex Shader: Deformación en retícula cuadriculada
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
      
      // Deformación geométrica cuadrilar basada en posiciones de vértices
      float gridX = floor(aTextureCoord.x * 12.0);
      float gridY = floor(aTextureCoord.y * 12.0);
      float factor = sin(gridX + gridY + uTransition * 3.14159);
      
      pos.z += factor * uTransition * 0.4;

      gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
      vTextureCoord = aTextureCoord;
    }
  `;

  // Fragment Shader: Render de la textura del video/imagen
  const fs = `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uRenderTexture;

    void main() {
      vec4 color = texture2D(uRenderTexture, vTextureCoord);
      gl_FragColor = color;
    }
  `;

  function initCurtains() {
    if (typeof Curtains === "undefined") return;

    curtains = new Curtains({
      container: "canvas",
      pixelRatio: Math.min(1.5, window.devicePixelRatio),
      watchScroll: false
    });

    curtains.onError(() => {
      console.warn("WebGL no soportado o error en CurtainsJS");
    });

    const params = {
      vertexShader: vs,
      fragmentShader: fs,
      widthSegments: 20,  // Permite que la retícula se divida en cuadros
      heightSegments: 20,
      uniforms: {
        transition: { name: "uTransition", type: "1f", value: 0.0 }
      }
    };

    const firstSlide = slides[0];
    plane = curtains.addPlane(firstSlide, params);

    if (plane) {
      plane.onRender(() => {
        // Reducción suave del valor de transición
        if (plane.uniforms.transition.value > 0.001) {
          plane.uniforms.transition.value *= 0.92;
        } else {
          plane.uniforms.transition.value = 0.0;
        }
      });
    }
  }

  function triggerTransition() {
    if (plane) {
      plane.uniforms.transition.value = 1.0; // Fuerza la distorsión cuadrangular
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

  // Inicialización
  setTimeout(() => {
    initCurtains();
    playCurrentVideo();
    startTimer();
  }, 100);
});
