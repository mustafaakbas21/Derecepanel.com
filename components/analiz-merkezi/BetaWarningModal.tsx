"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/** Her ziyarette gösterilir — sessionStorage dismiss YOK. #am-scope içinde render edilmeli. */
export function BetaWarningModal() {
  const [visible, setVisible] = useState(false);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  useEffect(() => {
    show();
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) show();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  if (!visible) return null;

  return (
    <div
      id="betaWarningModal"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-warning-title"
    >
      <div className="max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
          🧪
        </div>
        <h2 id="beta-warning-title" className="text-center text-xl font-bold text-slate-900">
          Analiz Motoru Test Aşamasında
        </h2>
        <p className="mt-4 text-center text-sm leading-relaxed text-slate-600">
          Sayın Kullanıcımız, şu an platformumuzun en gelişmiş modülü olan Analiz ve Raporlama
          Merkezi&apos;ni görüntülüyorsunuz. Otonom teşhis algoritmalarımız şu an gerçek veriler
          üzerinde kalibrasyon sürecindedir. Bu süreçte sayfa tamamen kullanıma açıktır ancak bazı
          istatistiklerde anlık gecikmeler yaşanabilir.
        </p>
        <Button variant="primary" className="mt-6 w-full" onClick={hide}>
          Anladım, Analizi İncele
        </Button>
      </div>
    </div>
  );
}
