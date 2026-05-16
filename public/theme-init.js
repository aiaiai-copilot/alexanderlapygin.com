(function () {
  var KEY = "theme";
  var root = document.documentElement;
  var theme;
  try {
    var saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") theme = saved;
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      theme = "dark";
    else theme = "light";
  } catch (_) { theme = "light"; }
  root.setAttribute("data-theme", theme);
  requestAnimationFrame(function () {
    root.classList.add("theme-ready");
  });
})();
