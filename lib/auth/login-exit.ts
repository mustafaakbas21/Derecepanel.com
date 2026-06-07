export const LOGIN_EXIT_MS_DEFAULT = 920;
export const LOGIN_EXIT_MS_REDUCED = 160;

export function getLoginExitDelayMs(): number {
  if (typeof window === "undefined") return LOGIN_EXIT_MS_DEFAULT;
  const reduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduced ? LOGIN_EXIT_MS_REDUCED : LOGIN_EXIT_MS_DEFAULT;
}

export type LoginExitOptions = {
  /** Canlıda panel verisi ön-yüklemesi için (gelecek). */
  onTransitionStart?: () => void;
};

/**
 * Giriş sonrası tam sayfa geçişi — scroll kilidi, overlay, progress, ardından href.
 */
export function runLoginExitTransition(url: string, options?: LoginExitOptions) {
  if (typeof window === "undefined") return;

  options?.onTransitionStart?.();

  const exitLayer = document.getElementById("dpLoginExit");
  const delayMs = getLoginExitDelayMs();

  if (!exitLayer) {
    window.location.href = url;
    return;
  }

  document.documentElement.classList.add("dp-login-exit-lock");
  exitLayer.setAttribute("aria-hidden", "false");
  exitLayer.removeAttribute("inert");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      exitLayer.classList.add("is-active");
    });
  });

  window.setTimeout(() => {
    window.location.href = url;
  }, delayMs);
}
