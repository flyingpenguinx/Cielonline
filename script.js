document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;

    const updateScrollState = () => {
        if (window.scrollY > 24) {
            body.setAttribute("data-scrolled", "true");
        } else {
            body.removeAttribute("data-scrolled");
        }
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
});
