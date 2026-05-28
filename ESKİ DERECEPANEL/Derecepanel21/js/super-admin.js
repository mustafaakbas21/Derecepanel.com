/**
 * Kurucu paneli — canlı localStorage istatistikleri ve destek gelen kutusu.
 */
(function (w) {
  try {
    if (String(w.sessionStorage.getItem("derece_sa_session") || "") !== "ok") {
      w.location.replace("super-admin-login.html");
      return;
    }
  } catch (e0) {
    w.location.replace("super-admin-login.html");
    return;
  }

  var LS_COACH = "coaches";
  var LS_STUDENT = "students";
  var LS_BUG = "system_bug_reports";

  function readJsonArray(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch (e) {
      return [];
    }
  }

  function writeBugReports(arr) {
    localStorage.setItem(LS_BUG, JSON.stringify(arr));
    try {
      w.dispatchEvent(new CustomEvent("system_bug_reports:updated"));
    } catch (e2) {}
  }

  function ensureBugReportIds(list) {
    var dirty = false;
    var out = list.map(function (r) {
      var x = Object.assign({}, r);
      if (!x.id) {
        dirty = true;
        x.id =
          w.crypto && typeof w.crypto.randomUUID === "function"
            ? w.crypto.randomUUID()
            : "br_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
      }
      if (x.durum == null || x.durum === "") x.durum = "Yeni";
      return x;
    });
    if (dirty) writeBugReports(out);
    return out;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtInt(n) {
    var v = Number(n);
    if (!isFinite(v)) return "0";
    return Math.floor(v).toLocaleString("tr-TR");
  }

  function calculateLiveStats() {
    var coaches = readJsonArray(LS_COACH);
    var students = readJsonArray(LS_STUDENT);
    return {
      totalCoach: coaches.length,
      totalStudent: students.length,
      todayStudent: 0,
      todayCoach: 0,
    };
  }

  function applyDashboardStats() {
    var s = calculateLiveStats();
    var map = [
      ["stat-today-student", fmtInt(s.todayStudent)],
      ["stat-today-coach", fmtInt(s.todayCoach)],
      ["stat-total-coach", fmtInt(s.totalCoach)],
      ["stat-total-student", fmtInt(s.totalStudent)],
    ];
    for (var i = 0; i < map.length; i++) {
      var el = document.getElementById(map[i][0]);
      if (el) el.textContent = map[i][1];
    }
    var cpu = document.getElementById("stat-cpu-value");
    if (cpu) cpu.textContent = "—";
  }

  function priorityBadge(pr) {
    var p = String(pr || "Normal").trim();
    if (p === "Kritik" || p === "Yüksek" || p === "Acil") {
      return (
        '<span class="inline-flex rounded-full border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-400">' +
        escapeHtml(p) +
        "</span>"
      );
    }
    if (p === "Normal") {
      return (
        '<span class="inline-flex rounded-full border border-slate-500/35 bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-slate-200">' +
        escapeHtml(p) +
        "</span>"
      );
    }
    return (
      '<span class="inline-flex rounded-full border border-slate-600/40 bg-slate-800/70 px-2 py-0.5 text-[11px] text-slate-400">' +
      escapeHtml(p) +
      "</span>"
    );
  }

  function statusBadge(d) {
    var durum = String(d || "Yeni").trim();
    var cls =
      durum === "İncelendi"
        ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
        : "border-amber-500/35 bg-amber-500/10 text-amber-200";
    return (
      '<span class="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ' + cls + '">' + escapeHtml(durum) + "</span>"
    );
  }

  function formatTrDateTime(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return escapeHtml(String(iso).slice(0, 19));
      return escapeHtml(d.toLocaleString("tr-TR"));
    } catch (e) {
      return "—";
    }
  }

  function truncatePath(url, max) {
    max = max || 48;
    var s = String(url || "");
    if (s.length <= max) return escapeHtml(s);
    return escapeHtml(s.slice(0, max - 1)) + "…";
  }

  function readBugReportsNormalized() {
    return ensureBugReportIds(readJsonArray(LS_BUG));
  }

  function renderSupportInbox() {
    var tbody = document.getElementById("sa-support-tbody");
    var empty = document.getElementById("sa-support-empty");
    if (!tbody) return;
    var rows = readBugReportsNormalized().slice();
    rows.sort(function (a, b) {
      return String(b.tarih || "").localeCompare(String(a.tarih || ""));
    });
    tbody.innerHTML = "";
    if (!rows.length) {
      if (empty) empty.classList.remove("hidden");
      return;
    }
    if (empty) empty.classList.add("hidden");
    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      tr.className = "align-top hover:bg-white/[0.03]";
      var sayfa = r.sayfa || r.pathname || "—";
      var detay = (r.aciklama || "").trim();
      tr.innerHTML =
        '<td class="whitespace-nowrap px-4 py-3 text-slate-400">' +
        formatTrDateTime(r.tarih) +
        "</td>" +
        '<td class="px-4 py-3 font-medium text-slate-100">' +
        escapeHtml(r.ad || "—") +
        "</td>" +
        '<td class="px-4 py-3 text-slate-400">' +
        escapeHtml(r.kategori || "—") +
        "</td>" +
        '<td class="px-4 py-3">' +
        priorityBadge(r.oncelik) +
        "</td>" +
        '<td class="px-4 py-3">' +
        statusBadge(r.durum) +
        "</td>" +
        '<td class="max-w-[220px] px-4 py-3 font-mono text-xs text-purple-200/90" title="' +
        escapeHtml(sayfa) +
        '">' +
        truncatePath(sayfa, 56) +
        "</td>" +
        '<td class="px-4 py-3">' +
        '<button type="button" class="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-200 hover:bg-purple-500/20" data-sa-br-detail="' +
        escapeHtml(r.id) +
        '">Metin</button></td>' +
        '<td class="whitespace-nowrap px-4 py-3 text-right">' +
        '<button type="button" class="mr-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40" data-sa-br-done="' +
        escapeHtml(r.id) +
        '"' +
        (r.durum === "İncelendi" ? " disabled" : "") +
        '>İncelendi</button>' +
        '<button type="button" class="rounded-lg border border-red-500/30 bg-red-950/40 px-2 py-1 text-xs font-semibold text-red-200 hover:bg-red-900/50" data-sa-br-del="' +
        escapeHtml(r.id) +
        '">Sil</button></td>';
      tbody.appendChild(tr);
    });
  }

  function findBugById(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return i;
    }
    return -1;
  }

  function onSupportTableClick(e) {
    var tbody = document.getElementById("sa-support-tbody");
    if (!tbody || !tbody.contains(e.target)) return;
    var det = e.target.closest("[data-sa-br-detail]");
    if (det) {
      var id = det.getAttribute("data-sa-br-detail");
      var list = readBugReportsNormalized();
      var idx = findBugById(list, id);
      if (idx < 0) return;
      var aciklama = list[idx].aciklama || "(Açıklama yok)";
      window.alert(aciklama);
      return;
    }
    var done = e.target.closest("[data-sa-br-done]");
    if (done && !done.disabled) {
      var id2 = done.getAttribute("data-sa-br-done");
      var list2 = readBugReportsNormalized();
      var j = findBugById(list2, id2);
      if (j < 0) return;
      list2[j].durum = "İncelendi";
      writeBugReports(list2);
      renderSupportInbox();
      return;
    }
    var del = e.target.closest("[data-sa-br-del]");
    if (del) {
      var id3 = del.getAttribute("data-sa-br-del");
      if (!window.confirm("Bu kaydı kalıcı olarak silmek istiyor musunuz?")) return;
      var list3 = readBugReportsNormalized().filter(function (x) {
        return x.id !== id3;
      });
      writeBugReports(list3);
      renderSupportInbox();
    }
  }

  var supportBound = false;
  function bindSupportTableOnce() {
    if (supportBound) return;
    var tbody = document.getElementById("sa-support-tbody");
    if (!tbody) return;
    tbody.addEventListener("click", onSupportTableClick);
    supportBound = true;
  }

  function refreshFromStorage(ev) {
    if (ev && ev.type === "storage" && ev.key != null) {
      if (ev.key !== LS_COACH && ev.key !== LS_STUDENT && ev.key !== LS_BUG && ev.key !== LS_PROFILE) return;
    }
    applyDashboardStats();
    syncProfileMenuUi();
    var h = (w.location.hash || "").replace(/^#/, "").trim();
    if (h === "sorunlar-destek") renderSupportInbox();
  }

  w.calculateLiveStats = calculateLiveStats;
  w.applyDashboardStats = applyDashboardStats;
  w.renderSupportInbox = renderSupportInbox;

  bindSupportTableOnce();
  applyDashboardStats();

  w.addEventListener("storage", refreshFromStorage);
  w.addEventListener("system_bug_reports:updated", refreshFromStorage);

  /* —— Kurucu profil menüsü + detay / düzenle (localStorage, şifre SHA-256) —— */
  var LS_PROFILE = "derece_kurucu_profil_v1";

  function defaultProfile() {
    return { name: "Kurucu", username: "kurucu", passwordHash: "", updatedAt: "" };
  }

  function normalizeProfile(o) {
    o = o && typeof o === "object" ? o : {};
    var name = String(o.name || "").trim() || "Kurucu";
    var username = String(o.username || "").trim() || "kurucu";
    return {
      name: name,
      username: username,
      passwordHash: String(o.passwordHash || ""),
      updatedAt: String(o.updatedAt || ""),
    };
  }

  function readProfile() {
    try {
      var raw = localStorage.getItem(LS_PROFILE);
      if (!raw) return defaultProfile();
      return normalizeProfile(JSON.parse(raw));
    } catch (e) {
      return defaultProfile();
    }
  }

  function writeProfile(p) {
    p.updatedAt = new Date().toISOString();
    localStorage.setItem(LS_PROFILE, JSON.stringify(p));
  }

  function profileInitials(name, username) {
    var n = String(name || "").trim();
    var u = String(username || "").trim();
    if (n) {
      var parts = n.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
      return n.slice(0, 2).toUpperCase();
    }
    if (u) return u.slice(0, 2).toUpperCase();
    return "KR";
  }

  function sha256Hex(str) {
    if (!w.crypto || !w.crypto.subtle) return Promise.resolve("");
    var enc = new TextEncoder();
    return w.crypto.subtle.digest("SHA-256", enc.encode(String(str))).then(function (buf) {
      return Array.from(new Uint8Array(buf))
        .map(function (b) {
          return b.toString(16).padStart(2, "0");
        })
        .join("");
    });
  }

  function formatProfileUpdated(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleString("tr-TR");
    } catch (e2) {
      return "—";
    }
  }

  function syncProfileMenuUi() {
    var p = readProfile();
    var av = document.getElementById("sa-profile-avatar");
    var nm = document.getElementById("sa-profile-menu-name");
    var un = document.getElementById("sa-profile-menu-username");
    if (av) av.textContent = profileInitials(p.name, p.username);
    if (nm) nm.textContent = p.name;
    if (un) un.textContent = p.username;
  }

  function syncProfileDetailUi() {
    var p = readProfile();
    var n = document.getElementById("sa-profile-detail-name");
    var u = document.getElementById("sa-profile-detail-username");
    var ph = document.getElementById("sa-profile-detail-pw-hint");
    var up = document.getElementById("sa-profile-detail-updated");
    if (n) n.textContent = p.name;
    if (u) u.textContent = p.username;
    if (ph) {
      ph.textContent = p.passwordHash ? "Tanımlı (yerel hash)" : "Tanımsız — düzenlemeden şifre belirleyebilirsiniz";
    }
    if (up) up.textContent = formatProfileUpdated(p.updatedAt);
  }

  function setEditMsg(text, isError) {
    var el = document.getElementById("sa-profile-edit-msg");
    if (!el) return;
    if (!text) {
      el.textContent = "";
      el.className = "mb-4 hidden rounded-xl px-3 py-2 text-xs";
      return;
    }
    el.textContent = text;
    if (isError) {
      el.className =
        "mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100";
    } else {
      el.className =
        "mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100";
    }
  }

  function positionProfileMenu() {
    var menu = document.getElementById("sa-profile-menu");
    var trig = document.getElementById("sa-profile-trigger");
    if (!menu || !trig) return;
    var r = trig.getBoundingClientRect();
    var gap = 8;
    menu.style.top = r.bottom + gap + "px";
    menu.style.right = Math.max(12, w.innerWidth - r.right) + "px";
    menu.style.left = "auto";
    menu.style.bottom = "auto";
  }

  function openProfileMenu() {
    var menu = document.getElementById("sa-profile-menu");
    var trig = document.getElementById("sa-profile-trigger");
    positionProfileMenu();
    if (menu) menu.classList.remove("hidden");
    if (trig) trig.setAttribute("aria-expanded", "true");
    syncProfileMenuUi();
  }

  function closeProfileMenu() {
    var menu = document.getElementById("sa-profile-menu");
    var trig = document.getElementById("sa-profile-trigger");
    if (menu) {
      menu.classList.add("hidden");
      menu.style.top = "";
      menu.style.right = "";
      menu.style.left = "";
      menu.style.bottom = "";
    }
    if (trig) trig.setAttribute("aria-expanded", "false");
  }

  function closeProfileModal() {
    var root = document.getElementById("sa-profile-modal-root");
    var det = document.getElementById("sa-profile-panel-detail");
    var ed = document.getElementById("sa-profile-panel-edit");
    if (root) {
      root.classList.add("hidden");
      root.classList.remove("flex");
      root.setAttribute("aria-hidden", "true");
    }
    if (det) det.classList.add("hidden");
    if (ed) ed.classList.add("hidden");
  }

  function showProfileModalRoot() {
    var root = document.getElementById("sa-profile-modal-root");
    if (!root) return;
    root.classList.remove("hidden");
    root.classList.add("flex");
    root.setAttribute("aria-hidden", "false");
  }

  function openProfileDetailModal() {
    closeProfileMenu();
    syncProfileDetailUi();
    var det = document.getElementById("sa-profile-panel-detail");
    var ed = document.getElementById("sa-profile-panel-edit");
    if (ed) ed.classList.add("hidden");
    if (det) det.classList.remove("hidden");
    showProfileModalRoot();
  }

  function openProfileEditModal() {
    closeProfileMenu();
    var p = readProfile();
    var det = document.getElementById("sa-profile-panel-detail");
    var ed = document.getElementById("sa-profile-panel-edit");
    var rowCur = document.getElementById("sa-profile-row-current-pw");
    var inName = document.getElementById("sa-profile-in-name");
    var inUser = document.getElementById("sa-profile-in-username");
    var inCur = document.getElementById("sa-profile-in-current-pw");
    var inNew = document.getElementById("sa-profile-in-new-pw");
    var inNew2 = document.getElementById("sa-profile-in-new-pw2");
    if (det) det.classList.add("hidden");
    if (ed) ed.classList.remove("hidden");
    showProfileModalRoot();
    if (inName) inName.value = p.name;
    if (inUser) inUser.value = p.username;
    if (inCur) inCur.value = "";
    if (inNew) inNew.value = "";
    if (inNew2) inNew2.value = "";
    if (rowCur) {
      if (p.passwordHash) rowCur.classList.remove("hidden");
      else rowCur.classList.add("hidden");
    }
    setEditMsg("", false);
  }

  function initSuperAdminProfile() {
    var wrap = document.getElementById("sa-profile-wrap");
    var trig = document.getElementById("sa-profile-trigger");
    var menu = document.getElementById("sa-profile-menu");
    if (!wrap || !trig || !menu) return;

    syncProfileMenuUi();

    trig.addEventListener("click", function (e) {
      e.stopPropagation();
      if (menu.classList.contains("hidden")) openProfileMenu();
      else closeProfileMenu();
    });

    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) closeProfileMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeProfileMenu();
        closeProfileModal();
      }
    });

    w.addEventListener(
      "resize",
      function () {
        if (menu && !menu.classList.contains("hidden")) positionProfileMenu();
      },
      { passive: true }
    );

    var btnDet = document.getElementById("sa-profile-open-detail");
    if (btnDet) {
      btnDet.addEventListener("click", function () {
        openProfileDetailModal();
      });
    }
    var btnEd = document.getElementById("sa-profile-open-edit");
    if (btnEd) {
      btnEd.addEventListener("click", function () {
        openProfileEditModal();
      });
    }

    var rootModal = document.getElementById("sa-profile-modal-root");
    if (rootModal) {
      rootModal.addEventListener("click", function (e) {
        if (e.target === rootModal) closeProfileModal();
      });
    }

    var c1 = document.getElementById("sa-profile-detail-close");
    if (c1) c1.addEventListener("click", closeProfileModal);
    var c2 = document.getElementById("sa-profile-edit-close");
    if (c2) c2.addEventListener("click", closeProfileModal);
    var c3 = document.getElementById("sa-profile-edit-cancel");
    if (c3) c3.addEventListener("click", closeProfileModal);

    var toEd = document.getElementById("sa-profile-detail-to-edit");
    if (toEd) {
      toEd.addEventListener("click", function () {
        openProfileEditModal();
      });
    }

    var form = document.getElementById("sa-profile-edit-form");
    if (form) {
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        setEditMsg("", false);
        var p0 = readProfile();
        var inName = document.getElementById("sa-profile-in-name");
        var inUser = document.getElementById("sa-profile-in-username");
        var inCur = document.getElementById("sa-profile-in-current-pw");
        var inNew = document.getElementById("sa-profile-in-new-pw");
        var inNew2 = document.getElementById("sa-profile-in-new-pw2");

        var name = (inName && inName.value) || "";
        var username = (inUser && inUser.value) || "";
        name = String(name).trim() || "Kurucu";
        username = String(username).trim().replace(/\s+/g, "") || "kurucu";

        var newPw = (inNew && inNew.value) || "";
        var newPw2 = (inNew2 && inNew2.value) || "";
        var curPw = (inCur && inCur.value) || "";

        if (newPw || newPw2) {
          if (newPw !== newPw2) {
            setEditMsg("Yeni şifre alanları eşleşmiyor.", true);
            return;
          }
          if (newPw.length < 6) {
            setEditMsg("Yeni şifre en az 6 karakter olmalı.", true);
            return;
          }
        }

        function finishSave(nextHash) {
          var next = {
            name: name,
            username: username,
            passwordHash: nextHash != null ? nextHash : p0.passwordHash,
          };
          writeProfile(next);
          syncProfileMenuUi();
          setEditMsg("Profil kaydedildi.", false);
          setTimeout(function () {
            closeProfileModal();
          }, 600);
        }

        if (newPw) {
          sha256Hex(newPw).then(function (newHash) {
            if (!newHash) {
              setEditMsg("Şifre özeti oluşturulamadı (tarayıcı / HTTPS).", true);
              return;
            }
            if (p0.passwordHash) {
              sha256Hex(curPw).then(function (oldH) {
                if (oldH !== p0.passwordHash) {
                  setEditMsg("Mevcut şifre hatalı.", true);
                  return;
                }
                finishSave(newHash);
              });
            } else {
              finishSave(newHash);
            }
          });
          return;
        }

        finishSave(null);
      });
    }
  }

  initSuperAdminProfile();
})(window);
