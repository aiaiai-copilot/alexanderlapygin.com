(() => {
  const STORAGE_KEY = "theme";
  const root = document.documentElement;

  let theme: "light" | "dark";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      theme = saved;
    } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    } else {
      theme = "light";
    }
  } catch {
    theme = "light";
  }

  root.setAttribute("data-theme", theme);

  // Mark ready on next frame so initial paint has no transitions.
  requestAnimationFrame(() => {
    root.classList.add("theme-ready");
  });
})();
