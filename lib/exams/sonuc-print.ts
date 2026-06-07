/** ESKİ basit-deneme-sonuclari — açık modal üzerinden sayfa içi yazdır (yeni sekme yok) */
export function printSonucReportInPage(): void {
  document.body.classList.add("bds-print-active");

  const cleanup = () => {
    document.body.classList.remove("bds-print-active");
  };

  window.addEventListener("afterprint", cleanup, { once: true });

  // Bazı tarayıcılarda sınıf uygulanmadan önce print tetiklenmesin
  requestAnimationFrame(() => {
    window.print();
  });
}
