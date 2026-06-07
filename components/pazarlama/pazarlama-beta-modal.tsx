"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/** ESKİ #betaModal — her giriş + BFCache pageshow; kalıcı dismiss yok */
export function PazarlamaBetaModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setVisible(true);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  if (!visible) return null;

  return (
    <div
      id="betaModal"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-modal-title"
    >
      <div className="max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
          📣
        </div>
        <h2 id="beta-modal-title" className="text-center text-xl font-bold text-slate-800">
          Pazarlama Asistanı Test Aşamasında
        </h2>
        <p className="mt-4 text-center text-sm leading-relaxed text-slate-600">
          Sayın Kullanıcımız, şu an platformumuzun yenilikçi modüllerinden Pazarlama Asistanı&apos;nı
          görüntülüyorsunuz. Dinamik veri ile Instagram Story (1080×1920) üretme ve PNG olarak dışa
          aktarma motorumuz kalibrasyon sürecindedir. Bu beta sürecinde tarayıcı ve ekran
          çözünürlüğünüze bağlı olarak şablonlarda ufak hizalama farklılıkları yaşanabilir.
        </p>
        <Button variant="primary" className="mt-6 w-full" onClick={() => setVisible(false)}>
          Anladım, Devam Et
        </Button>
      </div>
    </div>
  );
}
