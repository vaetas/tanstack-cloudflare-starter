/** Inline script for `<head>` — runs before paint to avoid theme flash. */
export const SYSTEM_THEME_SCRIPT = `document.documentElement.classList.toggle("dark",window.matchMedia("(prefers-color-scheme: dark)").matches);`;

/** Apply system color scheme before React mounts. */
export function initSystemTheme() {
  document.documentElement.classList.toggle(
    "dark",
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
}
