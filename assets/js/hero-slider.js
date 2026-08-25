document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const buttons = document.querySelectorAll(".slider-btn");
  let currentIndex = 0;
  let autoSlideTimer = null;
  const slideDuration = 8000;

  if (!slides.length) return;

  function playCurrentVideo() {
    const currentVid = slides[currentIndex].querySelector("video");
    if (currentVid) {
      currentVid.muted = true; // Imprescindible para evitar el bloqueo del navegador
      const playPromise = currentVid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Si el navegador aún bloquea, reintenta al interactuar
        });
      }
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