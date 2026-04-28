window.onload = () => {
  const theme = localStorage.getItem("theme") || "light";
  const font = localStorage.getItem("fontSize") || "medium";

  document.getElementById("themeSelect").value = theme;
  document.getElementById("fontSize").value = font;

  applyTheme(theme);
  applyFontSize(font);
};

document.getElementById("themeSelect").addEventListener("change", function () {
  localStorage.setItem("theme", this.value);
  applyTheme(this.value);
});

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}

document.getElementById("fontSize").addEventListener("change", function () {
  localStorage.setItem("fontSize", this.value);
  applyFontSize(this.value);
});

function applyFontSize(size) {
  const sizes = { small: "13px", medium: "15px", large: "19px" };
  document.body.style.fontSize = sizes[size];
}

function logout() {
  window.location.href = "index.html";
}
