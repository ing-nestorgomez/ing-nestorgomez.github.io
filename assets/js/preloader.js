window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");

  if (preloader) {
    // Da un pequeño margen visual para prevenir parpadeos rápidos
    setTimeout(() => {
      preloader.classList.add("is-hidden");
    }, 1000);
  }
});
