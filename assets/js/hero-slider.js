document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("canvas");
  const slides = document.querySelectorAll(".slide");
  const buttons = document.querySelectorAll(".slider-btn");
  let currentIndex = 0;
  let autoSlideTimer = null;
  const slideDuration = 8000;

  if (!slides.length) return;

  function goToSlide(targetIndex) {
    if (targetIndex === currentIndex) return;

    const currentSlide = slides[currentIndex];
    const nextSlide = slides[targetIndex];

    currentSlide.querySelector("video").pause();
    buttons[currentIndex].classList.remove("active");

    currentSlide.classList.remove("active");
    nextSlide.classList.add("active");
    
    const nextVideo = nextSlide.querySelector("video");
    nextVideo.currentTime = 0;
    nextVideo.play().catch(() => {});

    currentIndex = targetIndex;
    buttons[currentIndex].classList.add("active");
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
    slide.querySelector("video").addEventListener("ended", () => {
      let nextIndex = (currentIndex + 1) % slides.length;
      goToSlide(nextIndex);
    });
  });

  const firstVid = slides[0].querySelector("video");
  if (firstVid) firstVid.play().catch(() => {});
  startTimer();
});