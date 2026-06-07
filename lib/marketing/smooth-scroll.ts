let scrollCleanup: (() => void) | null = null;

function syncHash(hash: string) {
  if (window.location.hash !== hash) {
    history.replaceState(null, "", hash);
  }
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function waitForScrollSettle(onDone: () => void): () => void {
  let settled = false;

  const finish = () => {
    if (settled) return;
    settled = true;
    cleanup();
    onDone();
  };

  const cancel = () => {
    if (settled) return;
    settled = true;
    cleanup();
  };

  const maxWait = window.setTimeout(finish, 750);

  const onScrollEnd = () => finish();
  if ("onscrollend" in window) {
    window.addEventListener("scrollend", onScrollEnd, { once: true, passive: true });
  }

  let debounce: ReturnType<typeof setTimeout> | undefined;
  const onScroll = () => {
    clearTimeout(debounce);
    debounce = setTimeout(finish, 90);
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  function cleanup() {
    clearTimeout(maxWait);
    clearTimeout(debounce);
    window.removeEventListener("scrollend", onScrollEnd);
    window.removeEventListener("scroll", onScroll);
  }

  return cancel;
}

export function navigateToSection(hash: string) {
  if (typeof window === "undefined") return;

  scrollCleanup?.();
  scrollCleanup = null;
  document.documentElement.classList.remove("dp-nav-scrolling");

  const id = hash.replace(/^#/, "");
  const target = document.getElementById(id);
  if (!target) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("dp-nav-scrolling");

  if (reduceMotion) {
    target.scrollIntoView({ block: "start" });
    document.documentElement.classList.remove("dp-nav-scrolling");
    syncHash(hash);
    return;
  }

  window.scrollTo({ top: window.scrollY, behavior: "instant" });

  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });

    scrollCleanup = waitForScrollSettle(() => {
      document.documentElement.classList.remove("dp-nav-scrolling");
      scrollCleanup = null;
      syncHash(hash);
    });
  });
}

export function handleSectionClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  hash: string
) {
  if (!hash.startsWith("#")) return;
  event.preventDefault();
  navigateToSection(hash);
}
