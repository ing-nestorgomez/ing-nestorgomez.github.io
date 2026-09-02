document.addEventListener("DOMContentLoaded", () => {
  const submenuTriggers = document.querySelectorAll("#mainNav .has-submenu > .nav__link");

  submenuTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      // Activa el comportamiento de acordeón solo en pantallas móviles (<= 768px)
      if (window.innerWidth <= 768) {
        e.preventDefault(); // Previene la navegación al hacer clic en el padre
        const parentLi = trigger.parentElement;

        // Cierra los demás submenús abiertos
        document.querySelectorAll("#mainNav .has-submenu").forEach((item) => {
          if (item !== parentLi) {
            item.classList.remove("is-open");
          }
        });

        // Alterna el estado del submenú actual
        parentLi.classList.toggle("is-open");
      }
    });
  });

  // Limpia las clases al redimensionar a pantalla de escritorio
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      document.querySelectorAll("#mainNav .has-submenu").forEach((item) => {
        item.classList.remove("is-open");
      });
    }
  });
});
