<!-- Carga de CurtainsJS para Shaders WebGL -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/curtainsjs/8.1.5/curtains.min.js"></script>

<script>
  document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".slide");
    const buttons = document.querySelectorAll(".slider-btn");
    let currentIndex = 0;
    let autoSlideTimer = null;
    const slideDuration = 8000; // 8 segundos por diapositiva

    // Iniciar primer video
    slides[0].querySelector("video").play();

    // Función para cambiar de diapositiva
    function goToSlide(targetIndex) {
      if (targetIndex === currentIndex) return;

      slides[currentIndex].classList.remove("active");
      slides[currentIndex].querySelector("video").pause();
      buttons[currentIndex].classList.remove("active");

      currentIndex = targetIndex;

      slides[currentIndex].classList.add("active");
      const currentVideo = slides[currentIndex].querySelector("video");
      currentVideo.currentTime = 0;
      currentVideo.play();
      buttons[currentIndex].classList.add("active");

      resetTimer();
    }

    // Eventos de clic en panel flotante
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-slide"));
        goToSlide(index);
      });
    });

    // Avance automático por tiempo o fin del video
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

    // Avanzar si el video termina antes del timer
    slides.forEach((slide) => {
      const vid = slide.querySelector("video");
      vid.addEventListener("ended", () => {
        let nextIndex = (currentIndex + 1) % slides.length;
        goToSlide(nextIndex);
      });
    });

    startTimer();
  });
</script>