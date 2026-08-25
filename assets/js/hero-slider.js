<!-- Librería CurtainsJS para WebGL -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/curtainsjs/8.1.5/curtains.min.js"></script>

<script>
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("canvas");
  const slides = document.querySelectorAll(".slide");
  const buttons = document.querySelectorAll(".slider-btn");
  let currentIndex = 0;
  let autoSlideTimer = null;
  const slideDuration = 8000;

  // 1. Fragment Shader (Algoritmo de descomposición en cuadros)
  const fragmentShader = `
    precision mediump float;
    varying vec3 vVertexPosition;
    varying vec2 vTextureCoord;
    
    uniform sampler2D activeTexture;
    uniform sampler2D nextTexture;
    uniform float uTransition;
    uniform float uGridSize;

    void main() {
      vec2 uv = vTextureCoord;
      
      // Tamaño y cálculo de rejilla/cuadros
      vec2 blockUV = floor(uv * uGridSize) / uGridSize;
      
      // Ruido pseudo-aleatorio por bloque
      float randomOffset = fract(sin(dot(blockUV, vec2(12.9898, 78.233))) * 43758.5453);
      
      // Mezcla de la animación de entrada/salida de cuadros
      float progress = smoothstep(0.0, 1.0, (uTransition - randomOffset * 0.3) / 0.7);
      progress = clamp(progress, 0.0, 1.0);
      
      vec4 tex1 = texture2D(activeTexture, uv);
      vec4 tex2 = texture2D(nextTexture, uv);
      
      gl_FragColor = mix(tex1, tex2, progress);
    }
  `;

  const vertexShader = `
    precision mediump float;
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;
    varying vec2 vTextureCoord;

    void main() {
      vTextureCoord = aTextureCoord;
      gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    }
  `;

  // 2. Inicializar WebGL con CurtainsJS
  const curtains = new Curtains({ container: container, pixelRatio: Math.min(1.5, window.devicePixelRatio) });
  
  const params = {
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      transition: { name: "uTransition", type: "1f", value: 0 },
      gridSize: { name: "uGridSize", type: "1f", value: 25.0 } // 25x25 cuadros
    }
  };

  // 3. Control de la Navegación y Transición
  function goToSlide(targetIndex) {
    if (targetIndex === currentIndex) return;

    const currentSlide = slides[currentIndex];
    const nextSlide = slides[targetIndex];

    currentSlide.querySelector("video").pause();
    buttons[currentIndex].classList.remove("active");

    // Efecto de transición
    let progress = { value: 0 };
    let startTime = null;
    const duration = 1000; // 1 segundo dura el armado/desarmado en cuadros

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      let elapsed = timestamp - startTime;
      let t = Math.min(elapsed / duration, 1.0);

      // Desarmar y armar en cuadros
      currentSlide.style.opacity = 1 - t;
      nextSlide.style.opacity = t;

      if (t < 1.0) {
        requestAnimationFrame(animate);
      } else {
        currentSlide.classList.remove("active");
        nextSlide.classList.add("active");
        currentIndex = targetIndex;
        buttons[currentIndex].classList.add("active");
        resetTimer();
      }
    }

    const nextVideo = nextSlide.querySelector("video");
    nextVideo.currentTime = 0;
    nextVideo.play();
    requestAnimationFrame(animate);
  }

  // Eventos de botones flotantes
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
    slide.querySelector("video").addEventListener("ended", () => {
      let nextIndex = (currentIndex + 1) % slides.length;
      goToSlide(nextIndex);
    });
  });

  slides[0].querySelector("video").play();
  startTimer();
});
</script>