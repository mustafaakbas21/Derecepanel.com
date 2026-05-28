/**
 * Hazır şablon: projeye Tailwind CSS eklendiğinde bu dosyayı kullanın.
 * Gerçek palet `css/style.css` içinde html[data-theme] değişkenlerindedir.
 * Yardımcı sınıflarda sabit hex yerine aşağıdaki anahtarları kullanın.
 */
module.exports = {
  content: ["./*.html", "./pages/**/*.html", "./components/**/*.html", "./js/**/*.js"],
  safelist: [
    "max-h-0",
    "max-h-[500px]",
    "opacity-0",
    "opacity-100",
    "rotate-180",
  ],
  theme: {
    extend: {
      colors: {
        page: "var(--bg-page)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        "surface-panel": "var(--surface-panel)",
        primary: "var(--btn-primary-bg)",
        "primary-hover": "var(--btn-primary-hover)",
        "primary-fg": "var(--btn-primary-fg)",
        sidebar: "var(--sidebar-bg)",
        "sidebar-text": "var(--sidebar-text)",
        "sidebar-link": "var(--sidebar-link)",
        "sidebar-muted": "var(--sidebar-link-muted)",
        "sidebar-hover": "var(--sidebar-hover-bg)",
        "nav-active": "var(--nav-active-bg)",
        "nav-active-text": "var(--nav-active-text)",
        muted: "var(--text-muted)",
        foreground: "var(--text-primary)",
        border: "var(--header-border)",
        "card-border": "var(--card-border)",
      },
      boxShadow: {
        sidebar: "var(--sidebar-shadow)",
        soft: "var(--shadow-soft)",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sidebar: "var(--radius-sidebar)",
      },
      fontFamily: {
        sans: ["var(--font)"],
      },
      transitionDuration: {
        theme: "300ms",
      },
    },
  },
  plugins: [],
};
