document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const buttons = document.querySelectorAll(".slider-btn");
  const container = document.getElementById("canvas");
  let currentIndex = 0;
  let autoSlideTimer = null;
  const slideDuration = 8000;

  if (!slides.length) return;

  // --- CONFIGURACIÓN THREE.JS (EFECTO DE FRAGMENTOS CUADRADOS) ---
  let scene, camera, renderer, mesh;
  const gridRows = 8;
  const gridCols = 14;

  function initThree() {
    if (!container || typeof THREE === "undefined") return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Crear la malla de fragmentos planos
    const geometry = new THREE.PlaneGeometry(0.8, 0.8);
    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, wireframe: true }),
      gridRows * gridCols
    );

    const dummy = new THREE.Object3D();
    let count = 0;

    for (let i = 0; i < gridRows; i++) {
      for (let j = 0; j < gridCols; j++) {
        dummy.position.set((j - gridCols / 2) * 0.9, (i - gridRows / 2) * 0.9, 0);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(count++, dummy.matrix);
      }
    }

    mesh = instancedMesh;
    scene.add(mesh);

    function animate() {
      requestAnimationFrame(animate);
      if (mesh) {
        mesh.rotation.z += 0.001;
        mesh.rotation.y += 0.001;
      }
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  function triggerSquareTransition() {
    if (!mesh) return;
    let opacityProgress = 0;
    const interval = setInterval(() => {
      opacityProgress += 0.05;
      mesh.material.opacity = 0.15 + Math.sin(opacityProgress * Math.PI) * 0.5;
      mesh.rotation.z += 0.05;
      if (opacityProgress >= 1) {
        clearInterval(interval);
        mesh.material.opacity = 0.15;
      }
    }, 30);
  }

  // --- REPRODUCCIÓN DE VIDEO Y CAMBIO DE SLIDE ---
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
    triggerSquareTransition(); // Dispara la animación de fragmentos
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

  initThree();
  playCurrentVideo();
  startTimer();
});
