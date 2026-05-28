/**
 * Öğrenci dashboard — Kariyer Hedefim (DereceOgrenciSimBridge + student_target_*).
 * Tercih Sihirbazı kaydından sonra iframe/bfcache için rev + pageshow ile yenilenir.
 */
(function () {
  var lastTargetRev = "";

  function getTargetRev() {
    try {
      return sessionStorage.getItem("derece_student_target_rev") || "";
    } catch (e) {
      return "";
    }
  }

  function getCurrentUser() {
    if (window.OgStudentPerf && typeof window.OgStudentPerf.getCurrentUser === "function") {
      return window.OgStudentPerf.getCurrentUser();
    }
    try {
      var raw = localStorage.getItem("currentUser");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function readTargetForUser(u) {
    var bridge = window.DereceOgrenciSimBridge;
    if (bridge && typeof bridge.readStudentTargetForUser === "function") {
      var o = bridge.readStudentTargetForUser(u);
      if (o) {
        return {
          university: String(o.universite || o.university || "").trim(),
          department: String(o.bolum || o.department || "").trim(),
          city: String(o.sehir || "").trim(),
          puanTipi: String(o.puanTipi || "").trim(),
          baseScore: String(o.taban || o.tabanPuani || "").trim(),
          basari: String(o.basari || "").trim(),
          year: String(o.year || "").trim(),
        };
      }
    }
    if (!bridge || typeof bridge.storageKeyCandidates !== "function") return null;
    var tries = bridge.storageKeyCandidates(u);
    var best = null;
    var bestMs = 0;
    for (var i = 0; i < tries.length; i++) {
      if (!tries[i]) continue;
      try {
        var raw = localStorage.getItem("student_target_" + tries[i]);
        if (!raw || !String(raw).trim()) continue;
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") continue;
        var uni = String(parsed.universite || parsed.university || "").trim();
        var dep = String(parsed.bolum || parsed.department || "").trim();
        if (!uni && !dep) continue;
        var ms = Date.parse(parsed.setAt || "") || 0;
        if (!best || ms >= bestMs) {
          best = {
            university: uni,
            department: dep,
            city: String(parsed.sehir || "").trim(),
            puanTipi: String(parsed.puanTipi || "").trim(),
            baseScore: String(parsed.taban || "").trim(),
            basari: String(parsed.basari || "").trim(),
            year: String(parsed.year || "").trim(),
          };
          bestMs = ms;
        }
      } catch (e2) {}
    }
    return best;
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function renderCareerCard() {
    var mount = document.getElementById("og-career-card");
    if (!mount) return;
    var u = getCurrentUser();
    var t = readTargetForUser(u);
    if (t && (t.university || t.department)) {
      var meta = [];
      if (t.city) meta.push(escapeHtml(t.city));
      if (t.puanTipi) meta.push(escapeHtml(t.puanTipi));
      if (t.year) meta.push(escapeHtml(t.year));
      var scoreLine = "";
      if (t.baseScore) {
        scoreLine =
          '<p class="og-career__score">' +
          escapeHtml(t.baseScore) +
          ' <span class="og-career__score-label">(taban puan' +
          (t.year ? " · " + escapeHtml(t.year) : "") +
          ")</span></p>";
      }
      if (t.basari) {
        scoreLine +=
          '<p class="og-career__meta-line">Başarı sırası: <strong>' + escapeHtml(t.basari) + "</strong></p>";
      }
      mount.innerHTML =
        '<h2 class="og-career__title">Kariyer Hedefim</h2>' +
        (t.university ? '<p class="og-career__uni">' + escapeHtml(t.university) + "</p>" : "") +
        (t.department ? '<p class="og-career__dep">' + escapeHtml(t.department) + "</p>" : "") +
        (meta.length ? '<p class="og-career__meta-line">' + meta.join(" · ") + "</p>" : "") +
        scoreLine +
        '<p class="og-career__hint">Bu hedefe ulaşmak için OBP ve Net Sihirbazı\'ndaki analizlerini sık sık kontrol et; netlerini ve sıralamalarını güncel tut.</p>' +
        '<a href="tercih-sihirbazi.html" class="og-career__cta og-career__cta--muted" target="og-student-frame" rel="opener">Hedefi değiştir</a>';
      mount.classList.remove("og-career--empty");
    } else {
      mount.innerHTML =
        '<h2 class="og-career__title">Kariyer Hedefim</h2>' +
        '<p class="og-career__empty-text">Henüz bir hedef belirlemediniz. Tercih Sihirbazı\'na giderek kendinize bir rota çizin.</p>' +
        '<a href="tercih-sihirbazi.html" class="og-career__cta" target="og-student-frame" rel="opener">Tercih Sihirbazı\'na git</a>';
      mount.classList.add("og-career--empty");
    }
    lastTargetRev = getTargetRev();
  }

  function notifyParentIframeResize() {
    if (window.OgStudentPerf && typeof window.OgStudentPerf.notifyParentResize === "function") {
      window.OgStudentPerf.notifyParentResize();
      return;
    }
    try {
      if (window.parent !== window) {
        window.parent.postMessage({ type: "og-iframe-content" }, "*");
      }
    } catch (e) {}
  }

  function onTargetChanged() {
    renderCareerCard();
    notifyParentIframeResize();
  }

  function checkTargetRevision() {
    var rev = getTargetRev();
    if (rev && rev !== lastTargetRev) {
      onTargetChanged();
      return true;
    }
    return false;
  }

  function boot() {
    lastTargetRev = getTargetRev();
    renderCareerCard();
    notifyParentIframeResize();

    window.addEventListener("derece:student-target-changed", onTargetChanged);
    window.addEventListener("pageshow", function () {
      checkTargetRevision();
      onTargetChanged();
    });
    window.addEventListener("focus", checkTargetRevision);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) checkTargetRevision();
    });
    window.addEventListener("storage", function (e) {
      if (!e || !e.key) return;
      if (
        e.key.indexOf("student_target_") === 0 ||
        e.key === "derece_student_target_rev" ||
        e.key === "derecepanel_students_full_v1" ||
        e.key === "students" ||
        e.key === "currentUser"
      ) {
        onTargetChanged();
      }
    });
    window.addEventListener("message", function (ev) {
      try {
        if (ev && ev.data && ev.data.type === "derece-student-target-updated") {
          checkTargetRevision();
          onTargetChanged();
        }
      } catch (e2) {}
    });

  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
