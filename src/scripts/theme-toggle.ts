const STORAGE_KEY = "theme";

function applyTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore quota / disabled storage
  }
}

function bind(button: HTMLButtonElement) {
  const update = () => {
    const current = document.documentElement.getAttribute("data-theme");
    button.setAttribute("aria-checked", current === "dark" ? "true" : "false");
  };
  update();
  button.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
    update();
  });
}

document
  .querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")
  .forEach(bind);
