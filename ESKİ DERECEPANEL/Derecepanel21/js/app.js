/**
 * Derecepanel — ortak etkileşimler
 *
 * Öğrenci paneli (ogrenci-panel.html) iframe partial’ları: dış kapsayıcıda h-screen / min-h-screen /
 * h-full / max-h-screen ve overflow-y-* / overflow-hidden / overflow-auto kullanmayın; kaydırma
 * ana kabuk + iframe içi tek akıştadır. Yeni sayfalar için ayrıntı: ogrenci-panel.html <head> yorumu.
 */
(function () {
  try {
    if (localStorage.getItem("maintenance_mode") !== "true") return;
    var path = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
    if (path.indexOf("super-admin") !== -1) return;
    if (path.indexOf("super-admin-login") !== -1) return;
    var loginUrl = path.indexOf("/pages/") !== -1 ? "../login.html" : "login.html";
    window.location.replace(loginUrl + "?bakim=1");
  } catch (e) {
    /* yönlendirme hatası: devam */
  }
})();

(function () {
  // Oturum bilgilerini temizle ve login sayfasına yönlendir.
  // pages/*.html içinden çalışırken göreli yol "../login.html", köktekinden "login.html" olmalı.
  function getLoginUrl() {
    var path = window.location.pathname.replace(/\\/g, "/");
    return path.indexOf("/pages/") !== -1 ? "../login.html" : "login.html";
  }

  document.querySelectorAll(".btn-logout").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!confirm("Çıkış yapmak istediğinize emin misiniz?")) return;
      try {
        sessionStorage.removeItem("dp_auth_user");
        sessionStorage.removeItem("dp_auth_role");
        sessionStorage.removeItem("dp_auth_user_id");
        sessionStorage.removeItem("dp_appwrite_user_id");
        sessionStorage.removeItem("dp_local_auth");
        sessionStorage.removeItem("dp_coach_login_email_v1");
        localStorage.removeItem("currentUser");
      } catch (_) {
        /* sessionStorage erişimi kısıtlıysa sessizce geç */
      }
      window.location.href = getLoginUrl();
    });
  });
})();

/** Görünür ana sidebar: gizli (hidden) aside’ları atla; yoksa ilk .sidebar */
function dpVisibleSidebar() {
  var v = document.querySelector("aside.sidebar:not([hidden])");
  if (v) return v;
  return document.querySelector(".sidebar");
}

/** Sidebar: Pazarlama Asistanı (öğrenci paneli hariç) */
(function () {
  function isStudentNavContext(sidebar) {
    if (sidebar && sidebar.classList && sidebar.classList.contains("og-student-sidebar")) return true;
    if (document.body && document.body.classList.contains("og-student-shell-body")) return true;
    try {
      if (String(sessionStorage.getItem("dp_auth_role") || "").trim() === "student") return true;
    } catch (_) {}
    var p = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
    return p.indexOf("ogrenci-panel") !== -1 || p.indexOf("/ogrenci-") !== -1;
  }

  function isPagesPath() {
    var p = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
    return p.indexOf("/pages/") !== -1;
  }

  function marketingHref() {
    return isPagesPath() ? "pazarlama.html" : "pages/pazarlama.html";
  }

  function hasMarketingItem(nav) {
    if (!nav) return false;
    var href = marketingHref();
    return !!nav.querySelector('a.nav-item[href="' + href + '"]');
  }

  function findRandevuItem(nav) {
    if (!nav) return null;
    var items = nav.querySelectorAll("a.nav-item[href]");
    for (var i = 0; i < items.length; i++) {
      var t = (items[i].textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (t === "randevular") return items[i];
    }
    return null;
  }

  function buildMarketingItem() {
    var a = document.createElement("a");
    a.className = "nav-item nav-item--marketing-beta";
    a.href = marketingHref();
    a.innerHTML =
      '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M3 11v2a1 1 0 0 0 1 1h2l9 4V6L6 10H4a1 1 0 0 0-1 1z" stroke-linecap="round" stroke-linejoin="round" />' +
      '<path d="M15 10.5a4 4 0 0 1 0 3" stroke-linecap="round" stroke-linejoin="round" />' +
      '<path d="M18 9a7 7 0 0 1 0 6" stroke-linecap="round" stroke-linejoin="round" />' +
      '<path d="M6 14.5V19a2 2 0 0 0 2 2h1" stroke-linecap="round" stroke-linejoin="round" />' +
      "</svg>" +
      '<span class="nav-analiz-beta">' +
      '<span class="nav-analiz-beta__row1">Pazarlama</span>' +
      '<span class="nav-analiz-beta__row2">' +
      '<span class="nav-analiz-beta__suffix">Asistanı</span>' +
      '<span class="nav-analiz-beta__pill">BETA</span>' +
      "</span></span>";
    return a;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var sidebar = dpVisibleSidebar();
    if (!sidebar) return;
    if (isStudentNavContext(sidebar)) {
      var studentNav = sidebar.querySelector(".sidebar__nav");
      if (studentNav) {
        studentNav.querySelectorAll('a.nav-item[href*="pazarlama"], a.nav-item--marketing-beta').forEach(function (el) {
          el.remove();
        });
      }
      return;
    }
    var nav = sidebar.querySelector(".sidebar__nav");
    if (!nav) return;
    if (hasMarketingItem(nav)) return;
    var after = findRandevuItem(nav);
    var item = buildMarketingItem();
    if (after && after.parentNode) after.parentNode.insertBefore(item, after.nextSibling);
    else nav.insertBefore(item, nav.firstChild);
  });
})();

/** Sidebar: açılır alt menü grupları */
(function () {
  var shell = dpVisibleSidebar();
  var nav = shell ? shell.querySelector(".sidebar__nav") : document.querySelector(".sidebar__nav");
  document.querySelectorAll("[data-nav-group]").forEach(function (group) {
    var trigger = group.querySelector(".nav-group__trigger");
    if (!trigger) return;
    trigger.addEventListener("click", function () {
      var open = group.classList.toggle("nav-group--open");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && nav) {
        // Açılan grubun tamamının görünür alana gelmesi için kaydır.
        setTimeout(function () {
          try {
            var gr = group.getBoundingClientRect();
            var nr = nav.getBoundingClientRect();
            if (gr.bottom > nr.bottom) {
              nav.scrollBy({ top: gr.bottom - nr.bottom + 12, behavior: "smooth" });
            } else if (gr.top < nr.top) {
              nav.scrollBy({ top: gr.top - nr.top - 12, behavior: "smooth" });
            }
          } catch (_) {}
        }, 60);
      }
    });
  });
})();

/** Sidebar: aktif sayfa + ilgili üst menü grubunun açık kalması (pathname) */
(function () {
  function sameDocumentPath(linkHref) {
    if (!linkHref) return false;
    var t = String(linkHref).trim();
    if (!t || t.charAt(0) === "#" || t.indexOf("javascript:") === 0) return false;
    if (t.indexOf("mailto:") === 0) return false;
    try {
      var resolved = new URL(t, window.location.href);
      var a = resolved.pathname.replace(/\\/g, "/").replace(/\/+/g, "/").toLowerCase();
      var b = (window.location.pathname || "")
        .replace(/\\/g, "/")
        .replace(/\/+/g, "/")
        .toLowerCase();
      if (a === b) return true;
      /* file:// veya farklı dizin önekleri: aynı HTML dosyası adıyla eşle */
      var fa = a.split("/").filter(Boolean).pop() || "";
      var fb = b.split("/").filter(Boolean).pop() || "";
      if (fa && fb && fa === fb && /\.html?$/i.test(fa)) return true;
      return false;
    } catch (_) {
      return false;
    }
  }

  function clearNavActiveState(sidebar) {
    sidebar.querySelectorAll(".nav-item--active").forEach(function (el) {
      el.classList.remove("nav-item--active");
    });
    sidebar.querySelectorAll(".nav-sub--active").forEach(function (el) {
      el.classList.remove("nav-sub--active");
    });
    sidebar.querySelectorAll("[data-nav-group]").forEach(function (g) {
      g.classList.remove("nav-group--open");
      var tr = g.querySelector(".nav-group__trigger");
      if (tr) tr.setAttribute("aria-expanded", "false");
    });
  }

  function openParentNavGroup(anchor) {
    var group = anchor.closest("[data-nav-group]");
    if (!group) return;
    group.classList.add("nav-group--open");
    var tr = group.querySelector(".nav-group__trigger");
    if (tr) tr.setAttribute("aria-expanded", "true");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var sidebar = dpVisibleSidebar();
    if (!sidebar) return;
    /* Öğrenci kabuğu: URL her zaman ogrenci-panel.html; aktif satır + accordion ogSyncSidebarToIframe yönetir */
    if (sidebar.classList && sidebar.classList.contains("og-student-sidebar")) return;
    clearNavActiveState(sidebar);

    var candidates = sidebar.querySelectorAll(
      "a.nav-item[href], a.nav-sub[href], .nav-sub[href]"
    );
    var matched = null;
    candidates.forEach(function (a) {
      if (a.classList.contains("nav-sub--disabled")) return;
      var href = a.getAttribute("href");
      if (!sameDocumentPath(href)) return;
      matched = a;
    });

    if (!matched) return;

    if (matched.classList.contains("nav-sub")) {
      matched.classList.add("nav-sub--active");
    } else if (matched.classList.contains("nav-item")) {
      matched.classList.add("nav-item--active");
    }
    openParentNavGroup(matched);
  });
})();

/** Sidebar: premium Lucide tarzı ikon standardizasyonu */
(function () {
  var sidebar = dpVisibleSidebar();
  if (!sidebar) return;
  /* Öğrenci kabuğu: özel SVG + Tailwind; global .nav-item ile Lucide değişimi menüyü bozabiliyor */
  if (sidebar.classList && sidebar.classList.contains("og-student-sidebar")) return;

  var svgNS = "http://www.w3.org/2000/svg";

  var ICONS = {
    dashboard:
      '<rect x="3" y="3" width="7" height="7" rx="1.5"></rect>' +
      '<rect x="14" y="3" width="7" height="11" rx="1.5"></rect>' +
      '<rect x="14" y="17" width="7" height="4" rx="1.5"></rect>' +
      '<rect x="3" y="14" width="7" height="7" rx="1.5"></rect>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>' +
      '<circle cx="9" cy="7" r="3"></circle>' +
      '<path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>' +
      '<path d="M16 3.13a3 3 0 0 1 0 5.75"></path>',
    userCheck:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>' +
      '<circle cx="9" cy="7" r="3"></circle>' +
      '<path d="m16 11 2 2 4-4"></path>',
    calendarClock:
      '<path d="M8 2v4"></path>' +
      '<path d="M16 2v4"></path>' +
      '<rect x="3" y="4" width="18" height="18" rx="2"></rect>' +
      '<path d="M3 10h18"></path>' +
      '<circle cx="17" cy="17" r="3"></circle>' +
      '<path d="M17 15.5v1.8l1.2.7"></path>',
    clipboardList:
      '<rect x="8" y="2.5" width="8" height="4" rx="1.2"></rect>' +
      '<path d="M9 4h6"></path>' +
      '<path d="M9 13h8"></path>' +
      '<path d="M9 17h8"></path>' +
      '<path d="M5 13h.01"></path>' +
      '<path d="M5 17h.01"></path>' +
      '<path d="M6 6.5h12a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2z"></path>',
    calendarDays:
      '<path d="M8 2v4"></path>' +
      '<path d="M16 2v4"></path>' +
      '<rect x="3" y="4" width="18" height="18" rx="2"></rect>' +
      '<path d="M3 10h18"></path>' +
      '<path d="M8 14h.01"></path>' +
      '<path d="M12 14h.01"></path>' +
      '<path d="M16 14h.01"></path>' +
      '<path d="M8 18h.01"></path>' +
      '<path d="M12 18h.01"></path>' +
      '<path d="M16 18h.01"></path>',
    activity:
      '<path d="M22 12h-4l-3 7-4-14-3 7H2"></path>',
    library:
      '<path d="M4 4h4v16H4z"></path>' +
      '<path d="M10 4h4v16h-4z"></path>' +
      '<path d="M16 4h4v16h-4z"></path>' +
      '<path d="M3 20h18"></path>',
    penTool:
      '<path d="m12 19 7-7 3 3-7 7-5 1z"></path>' +
      '<path d="m18 6 3 3"></path>' +
      '<path d="M2 22h8"></path>',
    megaphone:
      '<path d="M3 11v2a1 1 0 0 0 1 1h2l9 4V6L6 10H4a1 1 0 0 0-1 1z"></path>' +
      '<path d="M15 10.5a4 4 0 0 1 0 3"></path>' +
      '<path d="M18 9a7 7 0 0 1 0 6"></path>' +
      '<path d="M6 14.5V19a2 2 0 0 0 2 2h1"></path>',
  };

  function resolveIconKey(label) {
    if (!label) return null;
    if (label.indexOf("dashboard") !== -1) return "dashboard";
    if (label.indexOf("öğrencilerim") !== -1) return "users";
    if (label.indexOf("koçlar") !== -1 || label.indexOf("koclar") !== -1) return "userCheck";
    if (label.indexOf("randevular") !== -1) return "calendarClock";
    if (label.indexOf("pazarlama") !== -1 || label.indexOf("sosyal medya") !== -1) return "megaphone";
    if (label.indexOf("denemeler") !== -1) return "clipboardList";
    if (label.indexOf("haftalık program") !== -1 || label.indexOf("haftalik program") !== -1) return "calendarDays";
    if (label === "mr" || label.indexOf(" mr") !== -1) return "activity";
    if (label.indexOf("kitap kütüphanesi") !== -1 || label.indexOf("kitap kutuphanesi") !== -1) return "library";
    if (label.indexOf("test maker") !== -1) return "penTool";
    return null;
  }

  function createIcon(iconKey, oldIconClass) {
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("data-lucide-sidebar-icon", "true");
    if (oldIconClass) {
      svg.setAttribute("class", oldIconClass);
    } else {
      svg.setAttribute("class", "nav-item__icon");
    }
    /* Boyut .nav-item__icon (style.css); inline px Lucide/HTML ikonlarını kaydırıyordu */
    svg.innerHTML = ICONS[iconKey] || "";
    return svg;
  }

  function firstMainIcon(container) {
    if (!container) return null;
    return container.querySelector(
      "svg.nav-item__icon, .sidebar-accordion-trigger > svg:first-of-type, a > svg:first-of-type, button > svg:first-of-type"
    );
  }

  function replaceIconForItem(el) {
    var oldIcon = firstMainIcon(el);
    if (!oldIcon) return;
    if (oldIcon.hasAttribute("data-lucide-sidebar-icon")) return;
    if (oldIcon.classList.contains("nav-item__chevron")) return;
    if (oldIcon.hasAttribute("data-sidebar-accordion-chevron")) return;

    var label = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    var iconKey = resolveIconKey(label);
    if (!iconKey) return;

    var newIcon = createIcon(iconKey, oldIcon.getAttribute("class"));
    oldIcon.replaceWith(newIcon);
  }

  sidebar.querySelectorAll(".nav-item, .nav-group__trigger, .sidebar-accordion-trigger, a, button").forEach(replaceIconForItem);
})();

/** Öğrencilerim: filtre sekmeleri, arama, kadro/durum, sayfalama, dışa aktarma, işlem butonları */
(function () {
  const table = document.getElementById("students-table");
  if (!table) return;

  const tbody = table.querySelector("tbody");
  const searchInput = document.getElementById("student-search");
  const kadroFilter = document.getElementById("kadro-filter");
  const statusFilter = document.getElementById("status-filter");
  const statusSummary = document.getElementById("status-summary");
  const pageSizeEl = document.getElementById("page-size");
  const prevBtn = document.getElementById("page-prev");
  const nextBtn = document.getElementById("page-next");
  const pageLabel = document.getElementById("page-label");
  const tabButtons = document.querySelectorAll(".student-tab[data-alan-filter]");
  const exportBtn = document.getElementById("btn-export-students");
  const btnBulkPrimary = document.getElementById("btn-student-bulk-primary");
  const btnBulkCancel = document.getElementById("btn-student-bulk-cancel");
  const btnBulkImport = document.getElementById("btn-bulk-import-students");
  const modalImportOverlay = document.getElementById("modal-import-students");
  const btnCloseImport = document.getElementById("btn-close-import");
  const btnDownloadExcelTemplate = document.getElementById("btn-download-excel-template");
  const importDropZone = document.getElementById("import-drop-zone");
  const importFileInput = document.getElementById("import-file-input");
  const ogToastHost = document.getElementById("og-toast-host");
  const studentsPristineEmpty = document.getElementById("students-pristine-empty");
  const studentsFilterEmpty = document.getElementById("students-filter-empty");
  const wizBtnBack = document.getElementById("wiz-btn-back");
  const wizBtnNext = document.getElementById("wiz-btn-next");
  const wizTabs = document.querySelectorAll("[data-wiz-step-indicator]");
  const modalFormOverlay = document.getElementById("modal-student-form");
  const modalViewOverlay = document.getElementById("modal-student-view");
  const formStudent = document.getElementById("form-student");
  const viewBody = document.getElementById("modal-student-view-body");
  const formTitle = document.getElementById("modal-student-form-title");
  const formLead = document.getElementById("modal-student-form-lead");
  const formSubmit = document.getElementById("form-student-submit");
  const btnAddStudent = document.getElementById("btn-add-student");
  const btnViewEdit = document.getElementById("btn-student-view-edit");
  const statusEditOnlyEl = document.getElementById("form-status-edit-only");
  const btnFormStatusAktif = document.getElementById("btn-form-status-aktif");
  const btnFormStatusDondur = document.getElementById("btn-form-status-dondur");

  let alanTab = "all";
  let pageSize = 10;
  let filtered = [];
  let page = 1;
  let studentFormMode = "add";
  let editingRow = null;
  let viewRowRef = null;
  let wizardStep = 1;
  let isBulkSelectionMode = false;
  const WIZ_MAX = 4;
  const STUDENTS_LEGACY_KEY = "students";

  const CANON_SINIF_OPTIONS = {
    "9. Sınıf": { sinifNum: "9", sinif: "9. Sınıf" },
    "10. Sınıf": { sinifNum: "10", sinif: "10. Sınıf" },
    "11. Sınıf": { sinifNum: "11", sinif: "11. Sınıf" },
    "12. Sınıf": { sinifNum: "12", sinif: "12. Sınıf" },
    Mezun: { sinifNum: "mezun", sinif: "Mezun" },
  };

  /** Excel şablonu — optik eşleşme için Öğrenci No ilk sütun olmalı */
  const STUDENT_IMPORT_TEMPLATE_HEADERS = [
    "Öğrenci No",
    "Ad",
    "Soyad",
    "TC Kimlik",
    "Cinsiyet",
    "Doğum Tarihi",
    "Sınıf/Şube",
    "Alan",
    "Öğrenci Telefon",
    "Veli Ad Soyad",
    "Veli Telefon",
    "Veli Yakınlık",
    "Kayıt Paketi",
    "Hedef Üniversite/Bölüm",
  ];
  const STUDENT_IMPORT_TEMPLATE_COLS = [
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 30 },
  ];

  const alanLabels = { tyt: "TYT", sayisal: "Sayısal", esit: "Eşit ağırlık", sozel: "Sözel", dil: "Dil" };
  const validSinifNum = { "9": true, "10": true, "11": true, "12": true, mezun: true };

  const programLabels = {
    "tyt-prep": "TYT hazırlık",
    "tyt-ayt": "TYT + AYT (tam program)",
    deneme: "Deneme ve eksik kapatma ağırlıklı",
    ozel: "Özel ders / birebir",
    digeregitim: "Diğer",
  };
  const genderLabels = {
    kadin: "Kadın",
    erkek: "Erkek",
    belirtmekistemiyorum: "Belirtmek istemiyorum",
  };
  const parentRelLabels = {
    anne: "Anne",
    baba: "Baba",
    vasi: "Vasi / veli vekili",
    diger: "Diğer",
  };
  const validProgramType = {
    "tyt-prep": true,
    "tyt-ayt": true,
    deneme: true,
    ozel: true,
    digeregitim: true,
  };
  const validParentRelation = { anne: true, baba: true, vasi: true, diger: true };
  const validGender = { kadin: true, erkek: true, belirtmekistemiyorum: true };

  function showOgToast(message, kind) {
    if (!ogToastHost) return;
    const el = document.createElement("div");
    el.className = "og-toast" + (kind === "ok" ? " og-toast--ok" : "");
    el.setAttribute("role", "status");
    el.textContent = message;
    ogToastHost.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.25s ease";
      setTimeout(function () {
        el.remove();
      }, 280);
    }, 4200);
  }

  /** Yeni kayıt / toplu içe aktarma sonrası (#og-toast-host) */
  function showOgrenciKayitSuccessToast(count) {
    const n = Math.floor(Number(count) || 0);
    if (n < 1) return;
    showOgToast("Başarılı. " + n + " öğrenci kaydedildi.", "ok");
  }

  function parseSinifBranch(branchStr) {
    const t = String(branchStr || "").trim();
    if (!t) return { sinifNum: "", sinif: "" };
    if (Object.prototype.hasOwnProperty.call(CANON_SINIF_OPTIONS, t)) {
      const o = CANON_SINIF_OPTIONS[t];
      return { sinifNum: o.sinifNum, sinif: o.sinif };
    }
    if (/mezun/i.test(t)) return { sinifNum: "mezun", sinif: "Mezun" };
    const m = t.match(/^(\d{1,2})/);
    if (m && validSinifNum[m[1]]) return { sinifNum: m[1], sinif: t };
    return { sinifNum: "", sinif: t };
  }

  function mapDatasetToSinifSelectValue(d) {
    const raw = String((d && d.sinifBranch) || "").trim();
    const canonKeys = Object.keys(CANON_SINIF_OPTIONS);
    if (canonKeys.indexOf(raw) !== -1) return raw;
    if (/mezun/i.test(raw) || (d && d.sinifNum === "mezun")) return "Mezun";
    const num = d && d.sinifNum && validSinifNum[d.sinifNum] ? d.sinifNum : "";
    if (num) return num + ". Sınıf";
    const m = raw.match(/^(\d{1,2})\b/);
    if (m && validSinifNum[m[1]]) return m[1] + ". Sınıf";
    const sinifStr = String((d && d.sinif) || "").trim();
    if (/mezun/i.test(sinifStr)) return "Mezun";
    const mS = sinifStr.match(/^(\d{1,2})\s*\./);
    if (mS && validSinifNum[mS[1]]) return mS[1] + ". Sınıf";
    return "";
  }

  function suggestUsernameFromFullName(fullName) {
    const parts = String(fullName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "";
    const joined = parts
      .map(function (p) {
        return p.toLocaleLowerCase("tr-TR");
      })
      .join("");
    const ascii = joined
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/i̇/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c");
    return ascii.replace(/[^a-z0-9]/g, "");
  }

  function randomPanelPassword6() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz";
    let s = "";
    for (let i = 0; i < 6; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  }

  function maybeAutofillPanelCredentials() {
    const u = document.getElementById("kullaniciAdi");
    const pw = document.getElementById("panelSifre");
    if (!u || !pw || !formStudent) return;
    if (String(u.value || "").trim() !== "" || String(pw.value || "").trim() !== "") return;
    const nameEl = formStudent.elements.name;
    const fullName = nameEl ? String(nameEl.value || "").trim() : "";
    u.value = suggestUsernameFromFullName(fullName);
    pw.value = randomPanelPassword6();
  }

  function mapAlanFromText(s) {
    const x = String(s || "")
      .toLowerCase()
      .trim();
    if (!x) return "tyt";
    if (x.indexOf("say") !== -1) return "sayisal";
    if (x.indexOf("eşit") !== -1 || x.indexOf("esit") !== -1) return "esit";
    if (x.indexOf("söz") !== -1 || x.indexOf("sozel") !== -1) return "sozel";
    if (x.indexOf("dil") !== -1) return "dil";
    if (x.indexOf("tyt") !== -1) return "tyt";
    return "tyt";
  }

  function showWizardStep(step) {
    wizardStep = Math.min(WIZ_MAX, Math.max(1, step));
    document.querySelectorAll("[data-wiz-panel]").forEach(function (el) {
      const n = parseInt(el.getAttribute("data-wiz-panel"), 10);
      el.classList.toggle("is-active", n === wizardStep);
    });
    wizTabs.forEach(function (btn) {
      const n = parseInt(btn.getAttribute("data-wiz-step-indicator"), 10);
      btn.classList.toggle("is-active", n === wizardStep);
      btn.disabled = n > wizardStep;
      btn.setAttribute("aria-selected", n === wizardStep ? "true" : "false");
    });
    if (wizBtnBack) wizBtnBack.hidden = wizardStep <= 1;
    if (wizBtnNext) wizBtnNext.hidden = wizardStep >= WIZ_MAX;
    if (formSubmit) formSubmit.hidden = wizardStep < WIZ_MAX;
    if (wizardStep === WIZ_MAX) maybeAutofillPanelCredentials();
  }

  function validateWizardStep(step) {
    if (!formStudent) return true;
    const f = formStudent.elements;
    if (step === 1) {
      if (!f.name || !String(f.name.value || "").trim()) {
        showOgToast("Ad soyad zorunludur.", "");
        if (f.name) f.name.focus();
        return false;
      }
    }
    return true;
  }

  function getKurumAdiForPdf() {
    try {
      const keys = ["derecepanel_kurum_adi", "kurumAdi", "tm-brief-kurum", "kurum_adi"];
      for (let i = 0; i < keys.length; i++) {
        const v = localStorage.getItem(keys[i]);
        if (v && String(v).trim()) return String(v).trim();
      }
    } catch (e) {}
    const t = document.querySelector(".sidebar__title");
    return t && t.textContent ? t.textContent.trim() : "Kurum";
  }

  function printStudentListPdf() {
    const list = allRows();
    const kurum = escapeHtml(getKurumAdiForPdf());
    const rowsHtml = list
      .map(function (tr) {
        const d = tr.dataset;
        const alanTxt = escapeHtml(alanLabels[d.alan] || d.alan || "—");
        const sinifAlan = escapeHtml((d.sinif || "—") + " · " + alanTxt);
        return (
          "<tr><td>" +
          escapeHtml(d.studentCode || "—") +
          "</td><td>" +
          escapeHtml(d.name || "—") +
          "</td><td>" +
          sinifAlan +
          "</td><td>" +
          escapeHtml(d.phone || "—") +
          "</td><td>" +
          escapeHtml(d.parent || "—") +
          "</td></tr>"
        );
      })
      .join("");
    const html =
      "<!DOCTYPE html><html lang=\"tr\"><head><meta charset=\"utf-8\"/><title>Öğrenci Listesi</title>" +
      "<style>@page{size:A4;margin:14mm}body{font-family:system-ui,-apple-system,sans-serif;color:#111;padding:0;margin:0}" +
      "h1{font-size:18pt;margin:0 0 4mm}h2{font-size:11pt;color:#444;margin:0 0 10mm;font-weight:600}.sub{font-size:9pt;color:#666;margin-bottom:8mm}" +
      "table{width:100%;border-collapse:collapse;font-size:9pt}th{text-align:left;padding:6px 8px;border-bottom:2px solid #111;font-weight:700}" +
      "td{padding:6px 8px;border-bottom:1px solid #ddd}</style></head><body>" +
      "<h1>Öğrenci Listesi</h1><h2>" +
      kurum +
      "</h2>" +
      "<p class=\"sub\">Oluşturulma: " +
      new Date().toLocaleString("tr-TR") +
      " · Toplam: " +
      list.length +
      "</p>" +
      "<table><thead><tr><th>Öğrenci No</th><th>Ad Soyad</th><th>Sınıf / Alan</th><th>Telefon</th><th>Veli Adı</th></tr></thead><tbody>" +
      (rowsHtml ||
        "<tr><td colspan=\"5\" style=\"text-align:center;padding:16px;color:#666\">Kayıt yok</td></tr>") +
      "</tbody></table><script>window.onload=function(){window.print();setTimeout(function(){window.close()},250)}<\/script></body></html>";
    const w = window.open("", "_blank");
    if (!w) {
      showOgToast("Açılır pencere engellendi; PDF için izin verin.", "");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  function splitCsvLine(line) {
    const out = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQ = !inQ;
      } else if (c === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    out.push(cur);
    return out.map(function (s) {
      return s.replace(/^"|"$/g, "").trim();
    });
  }

  function parseCsvToObjects(text) {
    const raw = String(text || "").replace(/^\uFEFF/, "");
    const lines = raw.split(/\r?\n/).filter(function (l) {
      return l.trim();
    });
    if (!lines.length) return [];
    const sep = lines[0].indexOf(";") !== -1 && lines[0].indexOf(",") === -1 ? ";" : ",";
    const headers =
      sep === ","
        ? splitCsvLine(lines[0]).map(function (h) {
            return h.trim().toLowerCase();
          })
        : lines[0].split(";").map(function (h) {
            return h.replace(/^"|"$/g, "").trim().toLowerCase();
          });
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      let cells;
      if (sep === ";") {
        cells = lines[i].split(";").map(function (c) {
          return c.replace(/^"|"$/g, "").trim();
        });
      } else {
        cells = splitCsvLine(lines[i]);
      }
      const row = {};
      headers.forEach(function (h, idx) {
        row[h] = cells[idx] != null ? cells[idx] : "";
      });
      rows.push(row);
    }
    return rows;
  }

  function normalizeImportRow(obj) {
    const out = {};
    Object.keys(obj || {}).forEach(function (k) {
      const nk = String(k)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
      out[nk] = obj[k];
    });
    return out;
  }

  function normImportHeaderKey(k) {
    return String(k || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/\u00a0/g, "");
  }

  function readImportHeaderCell(raw, canonicalLabel) {
    if (!raw || typeof raw !== "object") return "";
    const want = normImportHeaderKey(canonicalLabel);
    const keys = Object.keys(raw);
    for (let i = 0; i < keys.length; i++) {
      if (normImportHeaderKey(keys[i]) === want) {
        const v = raw[keys[i]];
        if (v == null || v === undefined) return "";
        return String(v).trim();
      }
    }
    return "";
  }

  function dashOrEmpty(v) {
    if (v == null || v === undefined) return "-";
    const s = String(v).trim();
    return s === "" ? "-" : s;
  }

  function generateStudentImportId() {
    try {
      if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    } catch (e) {}
    return "og-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function looksLikeNewCrmTemplate(sample) {
    if (!sample || typeof sample !== "object") return false;
    const nks = Object.keys(sample).map(normImportHeaderKey);
    if (nks.indexOf("tckimlik") !== -1 && nks.indexOf("ad") !== -1 && nks.indexOf("soyad") !== -1) return true;
    if (nks.indexOf("öğrencino") !== -1) return true;
    if (nks.indexOf("veliadsoyad") !== -1 || nks.indexOf("veliyakınlık") !== -1) return true;
    if (nks.indexOf("hedefüniversite/bölüm") !== -1) return true;
    return false;
  }

  function excelJsonRowToCrmStudent(raw) {
    const studentNo = dashOrEmpty(readImportHeaderCell(raw, "Öğrenci No"));
    const firstName = dashOrEmpty(readImportHeaderCell(raw, "Ad"));
    const lastName = dashOrEmpty(readImportHeaderCell(raw, "Soyad"));
    if (studentNo === "-" && firstName === "-" && lastName === "-") return null;
    const regDate = new Date().toLocaleDateString("tr-TR");
    var displayName = [firstName, lastName]
      .filter(function (x) {
        return x && x !== "-";
      })
      .join(" ")
      .trim();
    if (!displayName && studentNo !== "-") displayName = String(studentNo).trim();
    if (!displayName) displayName = "-";
    return {
      id: generateStudentImportId(),
      name: displayName,
      studentNo: studentNo,
      firstName: firstName,
      lastName: lastName,
      tc: dashOrEmpty(readImportHeaderCell(raw, "TC Kimlik")),
      gender: dashOrEmpty(readImportHeaderCell(raw, "Cinsiyet")),
      birthDate: dashOrEmpty(readImportHeaderCell(raw, "Doğum Tarihi")),
      classRoom: dashOrEmpty(readImportHeaderCell(raw, "Sınıf/Şube")),
      branch: dashOrEmpty(readImportHeaderCell(raw, "Alan")),
      phone: dashOrEmpty(readImportHeaderCell(raw, "Öğrenci Telefon")),
      parentName: dashOrEmpty(readImportHeaderCell(raw, "Veli Ad Soyad")),
      parentPhone: dashOrEmpty(readImportHeaderCell(raw, "Veli Telefon")),
      parentRelation: dashOrEmpty(readImportHeaderCell(raw, "Veli Yakınlık")),
      package: dashOrEmpty(readImportHeaderCell(raw, "Kayıt Paketi")),
      target: dashOrEmpty(readImportHeaderCell(raw, "Hedef Üniversite/Bölüm")),
      registrationDate: regDate,
    };
  }

  function mapGenderFromImportText(g) {
    const x = String(g || "")
      .toLowerCase()
      .trim();
    if (!x || x === "-") return "";
    if (x.indexOf("kad") !== -1 || x === "k") return "kadin";
    if (x.indexOf("erkek") !== -1 || x === "e") return "erkek";
    if (x.indexOf("belirt") !== -1) return "belirtmekistemiyorum";
    return "";
  }

  function mapParentRelationFromImportText(p) {
    const x = String(p || "")
      .toLowerCase()
      .trim();
    if (!x || x === "-") return "anne";
    if (x.indexOf("baba") !== -1) return "baba";
    if (x.indexOf("vasi") !== -1 || x.indexOf("vek") !== -1) return "vasi";
    return "diger";
  }

  function crmStudentToTablePayload(crm) {
    if (!crm) return null;
    const fname = crm.firstName === "-" ? "" : crm.firstName;
    const lname = crm.lastName === "-" ? "" : crm.lastName;
    const fromParts = (fname + " " + lname).trim();
    const displayName =
      crm.name && crm.name !== "-"
        ? String(crm.name).trim()
        : fromParts || (crm.studentNo !== "-" ? "Öğrenci " + crm.studentNo : "");
    if (!displayName) return null;
    const sn = parseSinifBranch(crm.classRoom === "-" ? "" : crm.classRoom);
    const alan = mapAlanFromText(crm.branch === "-" ? "" : crm.branch);
    const tc = String(crm.tc === "-" ? "" : crm.tc).replace(/\D/g, "").slice(0, 11);
    return {
      id: crm.id,
      name: displayName,
      studentCode: crm.studentNo !== "-" ? String(crm.studentNo).trim() : crm.id,
      tcNo: tc,
      birthDate: crm.birthDate === "-" ? "" : crm.birthDate,
      gender: mapGenderFromImportText(crm.gender),
      email: "",
      phone: crm.phone === "-" ? "" : crm.phone,
      city: "",
      ilce: "",
      kullaniciAdi: "",
      panelSifre: "",
      sinifBranch: crm.classRoom === "-" ? "" : crm.classRoom,
      address: "",
      goal: crm.target === "-" ? "" : crm.target,
      notes: "",
      counselorNote: "",
      counselorName: "",
      kayitPaketi: crm.package === "-" ? "" : crm.package,
      bursPercent: "",
      emergencyNotes: "",
      sinif: sn.sinif,
      sinifNum: sn.sinifNum,
      alan: alan,
      programType: "tyt-prep",
      kayit: crm.registrationDate || new Date().toLocaleDateString("tr-TR"),
      status: "aktif",
      parentRelation: mapParentRelationFromImportText(crm.parentRelation),
      parent: crm.parentName === "-" ? "" : crm.parentName,
      parentPhone: crm.parentPhone === "-" ? "" : crm.parentPhone,
      parentEmail: "",
      emergencyName: "",
      emergencyPhone: "",
      coachId: dpActiveCoachIdFromSession(),
    };
  }

  function mergeStudentsCrmStore(crmList) {
    let cur = [];
    try {
      cur = JSON.parse(localStorage.getItem(STUDENTS_LEGACY_KEY) || "[]");
    } catch (e) {
      cur = [];
    }
    if (!Array.isArray(cur)) cur = [];
    crmList.forEach(function (c) {
      if (c) cur.push(c);
    });
    try {
      localStorage.setItem(STUDENTS_LEGACY_KEY, JSON.stringify(cur));
    } catch (e2) {}
  }

  function csvRowToPayload(row, rowIndex) {
    const ad = row.ad || row["ad"] || "";
    const soyad = row.soyad || row["soyad"] || "";
    const name = (String(ad).trim() + " " + String(soyad).trim()).trim();
    if (!name) return null;
    const tc = String(row.tc || row["tc"] || "").replace(/\D/g, "").slice(0, 11);
    const sinifRaw = row.sinif || row["sinif"] || "";
    const sn = parseSinifBranch(sinifRaw);
    const alan = mapAlanFromText(row.alan || row["alan"] || "");
    const phone = String(row.telefon || row["telefon"] || "").trim();
    const veliTel = String(
      row.velitelefon || row["velitelefon"] || row["veli telefon"] || row["velitelefonu"] || ""
    ).trim();
    const goal = String(row.hedef || row["hedef"] || row.goal || row["goal"] || "").trim();
    const idx = rowIndex != null ? String(rowIndex) : "0";
    const code =
      "IMP-" +
      idx +
      "-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 9);
    return {
      id: code,
      name: name,
      studentCode: code,
      tcNo: tc,
      birthDate: "",
      gender: "",
      email: "",
      phone: phone,
      city: "",
      ilce: "",
      kullaniciAdi: "",
      panelSifre: "",
      sinifBranch: String(sinifRaw).trim(),
      address: "",
      goal: goal,
      notes: "",
      counselorNote: "",
      counselorName: "",
      kayitPaketi: "",
      bursPercent: "",
      emergencyNotes: "",
      sinif: sn.sinif,
      sinifNum: sn.sinifNum,
      alan: alan,
      programType: "tyt-prep",
      kayit: new Date().toISOString().slice(0, 10),
      status: "aktif",
      parentRelation: "anne",
      parent: "",
      parentPhone: veliTel,
      parentEmail: "",
      emergencyName: "",
      emergencyPhone: "",
      coachId: dpActiveCoachIdFromSession(),
    };
  }

  function mergeLegacyStudentsStore(payloads) {
    let cur = [];
    try {
      cur = JSON.parse(localStorage.getItem(STUDENTS_LEGACY_KEY) || "[]");
    } catch (e) {
      cur = [];
    }
    if (!Array.isArray(cur)) cur = [];
    payloads.forEach(function (p) {
      cur.push(p);
    });
    try {
      localStorage.setItem(STUDENTS_LEGACY_KEY, JSON.stringify(cur));
    } catch (e2) {}
  }

  function openImportModal() {
    if (!modalImportOverlay) return;
    modalImportOverlay.classList.add("is-open");
  }

  function closeImportModal() {
    if (!modalImportOverlay) return;
    modalImportOverlay.classList.remove("is-open");
    if (importFileInput) importFileInput.value = "";
  }

  function downloadExcelTemplate() {
    if (typeof XLSX === "undefined" || !XLSX.utils || !XLSX.writeFile) {
      showOgToast("Excel kütüphanesi yüklenemedi; sayfayı yenileyin.", "");
      return;
    }
    const wsData = [STUDENT_IMPORT_TEMPLATE_HEADERS.slice()];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = STUDENT_IMPORT_TEMPLATE_COLS.slice();
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ogrenciler");
    XLSX.writeFile(wb, "Derecepanel_Detayli_Ogrenci_Sablonu.xlsx");
  }

  function processImportedRows(jsonData) {
    if (!Array.isArray(jsonData) || !jsonData.length) {
      showOgToast("Dosyada satır bulunamadı.", "");
      return;
    }
    const sample = jsonData[0];
    let savedCount = 0;
    if (looksLikeNewCrmTemplate(sample)) {
      const crmList = [];
      jsonData.forEach(function (raw) {
        if (readImportHeaderCell(raw, "Ad") === "Örnek" && readImportHeaderCell(raw, "Soyad") === "Öğrenci") return;
        const crm = excelJsonRowToCrmStudent(raw);
        if (!crm) return;
        crmList.push(crm);
        const p = crmStudentToTablePayload(crm);
        if (p) tbody.appendChild(buildStudentRow(p));
      });
      if (!crmList.length) {
        showOgToast("Dosyada geçerli satır bulunamadı.", "");
        return;
      }
      savedCount = crmList.length;
      mergeStudentsCrmStore(crmList);
    } else {
      const payloads = [];
      jsonData.forEach(function (raw, i) {
        const row = normalizeImportRow(raw);
        if (String(row.ad || "").trim() === "Örnek" && String(row.soyad || "").trim() === "Öğrenci") return;
        const p = csvRowToPayload(row, i);
        if (p) payloads.push(p);
      });
      if (!payloads.length) {
        showOgToast("Dosyada geçerli satır bulunamadı.", "");
        return;
      }
      savedCount = payloads.length;
      payloads.forEach(function (p) {
        tbody.appendChild(buildStudentRow(p));
      });
      mergeLegacyStudentsStore(payloads);
    }
    updateTabCounts();
    applyFilters();
    if (typeof window.syncDereceStudentCatalog === "function") window.syncDereceStudentCatalog();
    showOgrenciKayitSuccessToast(savedCount);
    closeImportModal();
  }

  function processImportedCsvText(text) {
    const objs = parseCsvToObjects(text);
    processImportedRows(objs);
  }

  const badgeClass = {
    tyt: "field-badge--tyt",
    sayisal: "field-badge--sayisal",
    esit: "field-badge--esit",
    sozel: "field-badge--sozel",
    dil: "field-badge--dil",
  };

  function allRows() {
    return Array.from(tbody.querySelectorAll("tr[data-student]"));
  }

  function updateTabCounts() {
    const rows = allRows();
    const c = { all: rows.length, tyt: 0, sayisal: 0, esit: 0, sozel: 0, dil: 0 };
    rows.forEach(function (tr) {
      const a = tr.dataset.alan;
      if (Object.prototype.hasOwnProperty.call(c, a)) c[a]++;
    });
    document.querySelectorAll("[data-tab-count]").forEach(function (el) {
      const k = el.getAttribute("data-tab-count");
      el.textContent = String(c[k] != null ? c[k] : 0);
    });
  }

  function rowMatchesFilters(tr) {
    const q = (searchInput && searchInput.value ? searchInput.value : "").trim().toLowerCase();
    const kadro = kadroFilter && kadroFilter.value ? kadroFilter.value : "all";
    const st = statusFilter && statusFilter.value ? statusFilter.value : "all";
    const alan = tr.dataset.alan || "";
    const name = (tr.dataset.name || "").toLowerCase();
    const goal = (tr.dataset.goal || "").toLowerCase();
    const parent = (tr.dataset.parent || "").toLowerCase();
    const phone = (tr.dataset.parentPhone || "").replace(/\s/g, "");
    const email = (tr.dataset.email || "").toLowerCase();
    const notes = (tr.dataset.notes || "").toLowerCase();
    const parentEmail = (tr.dataset.parentEmail || "").toLowerCase();
    const stuPhone = (tr.dataset.phone || "").replace(/\s/g, "");
    const sinifNum = tr.dataset.sinifNum || "";
    const studentCode = (tr.dataset.studentCode || "").toLowerCase();
    const tcNo = (tr.dataset.tcNo || "").replace(/\s/g, "");
    const city = (tr.dataset.city || "").toLowerCase();
    const address = (tr.dataset.address || "").toLowerCase();
    const emergencyName = (tr.dataset.emergencyName || "").toLowerCase();
    const emergencyPhone = (tr.dataset.emergencyPhone || "").replace(/\s/g, "");
    const programLabel = (
      programLabels[tr.dataset.programType] ||
      tr.dataset.programType ||
      ""
    ).toLowerCase();
    const counselorNote = (tr.dataset.counselorNote || "").toLowerCase();
    const counselorName = (tr.dataset.counselorName || "").toLowerCase();
    const kayitPaketi = (tr.dataset.kayitPaketi || "").toLowerCase();
    const ilce = (tr.dataset.ilce || "").toLowerCase();
    const parentRelation = (parentRelLabels[tr.dataset.parentRelation] || "").toLowerCase();
    const genderQ = (genderLabels[tr.dataset.gender] || "").toLowerCase();

    if (alanTab !== "all" && alan !== alanTab) return false;
    if (st === "aktif" && tr.dataset.status !== "aktif") return false;
    if (st === "donduruldu" && tr.dataset.status !== "donduruldu") return false;
    if (kadro !== "all" && sinifNum !== kadro) return false;
    if (q) {
      const qq = q.replace(/\s/g, "");
      if (
        !name.includes(q) &&
        !goal.includes(q) &&
        !parent.includes(q) &&
        !phone.includes(qq) &&
        !email.includes(q) &&
        !notes.includes(q) &&
        !parentEmail.includes(q) &&
        !stuPhone.includes(qq) &&
        !studentCode.includes(q) &&
        !tcNo.includes(qq) &&
        !city.includes(q) &&
        !address.includes(q) &&
        !emergencyName.includes(q) &&
        !emergencyPhone.includes(qq) &&
        !programLabel.includes(q) &&
        !counselorNote.includes(q) &&
        !counselorName.includes(q) &&
        !kayitPaketi.includes(q) &&
        !ilce.includes(q) &&
        !parentRelation.includes(q) &&
        !genderQ.includes(q)
      ) {
        return false;
      }
    }
    return true;
  }

  function clearStudentSelection() {
    const sa = document.getElementById("students-select-all");
    if (sa) {
      sa.checked = false;
      sa.indeterminate = false;
    }
    tbody.querySelectorAll(".js-student-select").forEach(function (cb) {
      cb.checked = false;
    });
    updateBulkModeUi();
  }

  function setBulkSelectionMode(on) {
    isBulkSelectionMode = !!on;
    if (!isBulkSelectionMode) {
      const sa = document.getElementById("students-select-all");
      if (sa) {
        sa.checked = false;
        sa.indeterminate = false;
      }
      tbody.querySelectorAll(".js-student-select").forEach(function (cb) {
        cb.checked = false;
      });
    }
    table.classList.toggle("students-table--bulk-mode", isBulkSelectionMode);
    updateBulkModeUi();
  }

  function syncSelectAllCheckbox() {
    const sa = document.getElementById("students-select-all");
    if (!sa) return;
    const vis = allRows().filter(function (tr) {
      return !tr.hidden;
    });
    if (!vis.length) {
      sa.checked = false;
      sa.indeterminate = false;
      return;
    }
    let c = 0;
    vis.forEach(function (tr) {
      const cb = tr.querySelector(".js-student-select");
      if (cb && cb.checked) c++;
    });
    sa.checked = c === vis.length;
    sa.indeterminate = c > 0 && c < vis.length;
  }

  function updateBulkModeUi() {
    if (!btnBulkPrimary) return;
    if (btnBulkCancel) btnBulkCancel.hidden = !isBulkSelectionMode;
    btnBulkPrimary.setAttribute("aria-pressed", isBulkSelectionMode ? "true" : "false");
    if (isBulkSelectionMode) {
      btnBulkPrimary.classList.add("btn-bulk-select--danger");
      btnBulkPrimary.innerHTML = '<span aria-hidden="true">🗑</span> Seçilenleri Sil';
      btnBulkPrimary.disabled = !tbody.querySelector(".js-student-select:checked");
    } else {
      btnBulkPrimary.classList.remove("btn-bulk-select--danger");
      btnBulkPrimary.innerHTML = '<span aria-hidden="true">☑</span> Çoklu Seçim Yap';
      btnBulkPrimary.disabled = false;
    }
  }

  function applyFilters() {
    clearStudentSelection();
    filtered = allRows().filter(rowMatchesFilters);
    pageSize = parseInt(pageSizeEl && pageSizeEl.value ? pageSizeEl.value : "10", 10) || 10;
    page = 1;
    if (statusSummary && statusFilter) {
      const labels = {
        all: "tüm kayıtlar",
        aktif: "yalnızca aktif olanlar",
        donduruldu: "kaydı dondurulanlar",
      };
      statusSummary.textContent = "Durum: " + (labels[statusFilter.value] || "tüm kayıtlar");
    }
    renderPage();
  }

  function syncStudentsListChrome() {
    if (!studentsPristineEmpty && !studentsFilterEmpty) return;
    const tableCard = table.closest(".table-card");
    const scroll = table.closest(".table-scroll");
    const pag = tableCard ? tableCard.querySelector(".pagination") : null;
    const totalAll = allRows().length;
    const filN = filtered.length;
    const pristine = totalAll === 0;
    const filterDead = totalAll > 0 && filN === 0;
    if (studentsPristineEmpty) studentsPristineEmpty.hidden = !pristine;
    if (studentsFilterEmpty) studentsFilterEmpty.hidden = !filterDead;
    if (scroll) scroll.hidden = pristine;
    if (pag) pag.hidden = pristine;
  }

  function renderPage() {
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (page > pages) page = pages;

    allRows().forEach(function (tr) {
      tr.hidden = true;
    });

    const start = (page - 1) * pageSize;
    filtered.slice(start, start + pageSize).forEach(function (tr) {
      tr.hidden = false;
    });

    if (pageLabel) {
      const totalAll = allRows().length;
      if (totalAll === 0) {
        pageLabel.textContent = "Kayıt yok";
      } else if (total === 0) {
        pageLabel.textContent = "Bu filtreye uyan kayıt yok";
      } else {
        pageLabel.textContent = "Sayfa " + page + " / " + pages + " (" + total + " öğrenci)";
      }
    }
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= pages || total === 0;
    syncAllRowTooltips();
    syncStudentsListChrome();
    updateBulkModeUi();
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      alanTab = btn.getAttribute("data-alan-filter") || "all";
      tabButtons.forEach(function (b) {
        b.classList.toggle("student-tab--active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      applyFilters();
    });
  });

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (kadroFilter) kadroFilter.addEventListener("change", applyFilters);
  if (statusFilter) statusFilter.addEventListener("change", applyFilters);
  if (pageSizeEl) pageSizeEl.addEventListener("change", applyFilters);

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      if (page > 1) {
        page--;
        renderPage();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (page < pages) {
        page++;
        renderPage();
      }
    });
  }

  function escapeHtml(s) {
    if (!s) return "";
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function syncRowTooltips(tr) {
    const d = tr.dataset;
    const goalEl = tr.querySelector(".student-goal");
    if (goalEl) goalEl.setAttribute("title", (d.goal || goalEl.textContent || "").trim());
    const nameEl = tr.querySelector(".student-name");
    if (nameEl) nameEl.setAttribute("title", (d.name || nameEl.textContent || "").trim());
    const veliName = tr.querySelector(".veli-name");
    if (veliName) veliName.setAttribute("title", (d.parent || veliName.textContent || "").trim());
    const veliTel = tr.querySelector(".veli-tel");
    if (veliTel) veliTel.setAttribute("title", (d.parentPhone || veliTel.textContent || "").trim());
  }

  function syncAllRowTooltips() {
    tbody.querySelectorAll("tr[data-student]").forEach(syncRowTooltips);
  }

  function initialsFromName(name) {
    const parts = String(name || "")
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0] ? parts[0][0] : "?").toUpperCase();
  }

  function detailLine(label, value) {
    const v = value && String(value).trim();
    const inner = v
      ? escapeHtml(v)
      : '<span class="student-detail-empty">Belirtilmedi</span>';
    return "<dt>" + escapeHtml(label) + "</dt><dd>" + inner + "</dd>";
  }

  function refreshRowFromDataset(tr) {
    const d = tr.dataset;
    const nameEl = tr.querySelector(".student-name");
    const goalEl = tr.querySelector(".student-goal");
    if (nameEl) nameEl.textContent = d.name || "";
    if (goalEl) goalEl.textContent = d.goal || "";
    const veliName = tr.querySelector(".veli-name");
    const veliTel = tr.querySelector(".veli-tel");
    if (veliName) veliName.textContent = d.parent || "";
    if (veliTel) veliTel.textContent = d.parentPhone || "";
    const sinifCell = tr.querySelector(".student-sinif-cell");
    if (sinifCell) sinifCell.textContent = d.sinif || "";
    const cells = tr.querySelectorAll("td");
    if (cells[5]) cells[5].textContent = d.kayit || "";

    const badge = tr.querySelector(".field-badge");
    if (badge && d.alan) {
      badge.className = "field-badge " + (badgeClass[d.alan] || "");
      badge.textContent = alanLabels[d.alan] || d.alan;
    }

    const pill = tr.querySelector(".status-pill");
    if (pill && d.status) {
      pill.className =
        "status-pill " + (d.status === "aktif" ? "status-pill--aktif" : "status-pill--donduruldu");
      pill.textContent = d.status === "aktif" ? "Aktif" : "Kayıt donduruldu";
    }

    const initials = tr.querySelector(".student-avatar--initials");
    if (initials && d.name) {
      initials.textContent = initialsFromName(d.name);
    }
    syncRowTooltips(tr);
  }

  function openStudentView(tr) {
    if (!viewBody || !modalViewOverlay) return;
    viewRowRef = tr;
    const d = tr.dataset;
    const alan = alanLabels[d.alan] || d.alan || "—";
    const statusLabel = d.status === "aktif" ? "Aktif" : "Kayıt donduruldu";
    const badgeCls = "field-badge " + (badgeClass[d.alan] || "");
    const pillCls =
      "status-pill " + (d.status === "aktif" ? "status-pill--aktif" : "status-pill--donduruldu");
    const ini = initialsFromName(d.name);

    viewBody.innerHTML =
      '<header class="student-detail-head">' +
      '<span class="student-detail-avatar" aria-hidden="true">' +
      escapeHtml(ini) +
      "</span>" +
      '<div><h2 class="student-detail-name">' +
      escapeHtml(d.name || "Öğrenci") +
      '</h2><div class="student-detail-badges">' +
      '<span class="' +
      escapeHtml(badgeCls) +
      '">' +
      escapeHtml(alan) +
      "</span>" +
      '<span class="' +
      escapeHtml(pillCls) +
      '">' +
      escapeHtml(statusLabel) +
      "</span></div></div></header>" +
      '<section class="student-detail-section"><h3>Kimlik</h3>' +
      '<dl class="student-detail-dl">' +
      detailLine("Öğrenci / kayıt no", d.studentCode) +
      detailLine("T.C. kimlik no", d.tcNo) +
      detailLine("Doğum tarihi", d.birthDate) +
      detailLine("Cinsiyet", genderLabels[d.gender] || d.gender) +
      "</dl></section>" +
      '<section class="student-detail-section"><h3>İletişim ve adres</h3>' +
      '<dl class="student-detail-dl">' +
      detailLine("E-posta", d.email) +
      detailLine("Cep telefonu", d.phone) +
      detailLine("İl", d.city) +
      detailLine("İlçe", d.ilce) +
      detailLine("Açık adres", d.address) +
      "</dl></section>" +
      '<section class="student-detail-section"><h3>Eğitim ve hedef</h3>' +
      '<dl class="student-detail-dl">' +
      detailLine("Sınıf / şube", d.sinifBranch || d.sinif) +
      detailLine("Sınav alanı", alanLabels[d.alan] || d.alan) +
      detailLine("Program türü", programLabels[d.programType] || d.programType) +
      detailLine("Kayıt paketi", d.kayitPaketi) +
      detailLine("Danışman öğretmen", d.counselorName) +
      detailLine("Burs oranı (%)", d.bursPercent) +
      detailLine("Hedef üniversite veya bölüm", d.goal) +
      detailLine("Kayıt tarihi", d.kayit) +
      detailLine("Kayıt durumu", d.status === "aktif" ? "Aktif" : "Kayıt donduruldu") +
      "</dl></section>" +
      '<section class="student-detail-section"><h3>Veli veya yasal temsilci</h3>' +
      '<dl class="student-detail-dl">' +
      detailLine("Yakınlık", parentRelLabels[d.parentRelation] || d.parentRelation) +
      detailLine("Ad soyad", d.parent) +
      detailLine("Cep telefonu", d.parentPhone) +
      detailLine("E-posta", d.parentEmail) +
      "</dl></section>" +
      '<section class="student-detail-section"><h3>Acil durum</h3>' +
      '<dl class="student-detail-dl">' +
      detailLine("Acil durum notu", d.emergencyNotes) +
      detailLine("İletişim adı (yedek)", d.emergencyName) +
      detailLine("İletişim telefonu (yedek)", d.emergencyPhone) +
      "</dl></section>" +
      '<section class="student-detail-section"><h3>Notlar</h3>' +
      '<dl class="student-detail-dl">' +
      detailLine("Öğrenci notları", d.notes) +
      detailLine("Danışman / koordinatör notu", d.counselorNote) +
      "</dl></section>";

    modalViewOverlay.classList.add("is-open");
    viewBody.focus();
  }

  function closeStudentView() {
    if (modalViewOverlay) modalViewOverlay.classList.remove("is-open");
    viewRowRef = null;
  }

  function updateStatusSegmentUI() {
    if (!formStudent || !btnFormStatusAktif || !btnFormStatusDondur) return;
    const st = formStudent.elements.status.value;
    btnFormStatusAktif.setAttribute("aria-pressed", st === "aktif" ? "true" : "false");
    btnFormStatusDondur.setAttribute("aria-pressed", st === "donduruldu" ? "true" : "false");
  }

  function setFormStatus(newStatus) {
    if (!formStudent) return;
    formStudent.elements.status.value = newStatus;
    if (studentFormMode === "edit" && editingRow) {
      editingRow.dataset.status = newStatus;
      refreshRowFromDataset(editingRow);
      applyFilters();
      if (
        viewRowRef &&
        viewRowRef === editingRow &&
        modalViewOverlay &&
        modalViewOverlay.classList.contains("is-open")
      ) {
        openStudentView(editingRow);
      }
    }
    updateStatusSegmentUI();
  }

  function openStudentForm(mode, tr) {
    if (!modalFormOverlay || !formStudent) return;
    studentFormMode = mode;
    editingRow = mode === "edit" && tr ? tr : null;

    if (mode === "add") {
      formTitle.textContent = "Öğrenci ekle";
      if (formLead) formLead.hidden = false;
      formSubmit.textContent = "Kaydı tamamla";
      formStudent.reset();
      formStudent.elements.alan.value = "tyt";
      formStudent.elements.status.value = "aktif";
      formStudent.elements.programType.value = "tyt-prep";
      formStudent.elements.parentRelation.value = "anne";
      formStudent.elements.kayit.value = new Date().toISOString().slice(0, 10);
      if (formStudent.elements.ilce) formStudent.elements.ilce.value = "";
      if (formStudent.elements.sinifBranch) formStudent.elements.sinifBranch.value = "";
      const kuAdd = document.getElementById("kullaniciAdi");
      const pwAdd = document.getElementById("panelSifre");
      const toggleAdd = document.getElementById("toggle-panel-sifre");
      if (kuAdd) kuAdd.value = "";
      if (pwAdd) {
        pwAdd.value = "";
        pwAdd.type = "password";
      }
      if (toggleAdd) toggleAdd.setAttribute("aria-pressed", "false");
      if (formStudent.elements.counselorName) formStudent.elements.counselorName.value = "";
      if (formStudent.elements.kayitPaketi) formStudent.elements.kayitPaketi.value = "";
      if (formStudent.elements.bursPercent) formStudent.elements.bursPercent.value = "";
      if (formStudent.elements.emergencyNotes) formStudent.elements.emergencyNotes.value = "";
      if (statusEditOnlyEl) statusEditOnlyEl.hidden = true;
      if (window.dpStudentHedefAfterFormReset) window.dpStudentHedefAfterFormReset();
    } else {
      formTitle.textContent = "Öğrenciyi düzenle";
      if (formLead) formLead.hidden = true;
      formSubmit.textContent = "Değişiklikleri kaydet";
      const d = tr.dataset;
      const f = formStudent.elements;
      f.name.value = d.name || "";
      f.studentCode.value = d.studentCode || "";
      f.tcNo.value = d.tcNo || "";
      f.birthDate.value = d.birthDate || "";
      f.gender.value = d.gender && validGender[d.gender] ? d.gender : "";
      f.email.value = d.email || "";
      f.phone.value = d.phone || "";
      f.city.value = d.city || "";
      if (f.ilce) f.ilce.value = d.ilce || "";
      f.address.value = d.address || "";
      if (window.dpStudentHedefApplyGoal) {
        window.dpStudentHedefApplyGoal(d.goal || "");
      } else if (f.goal) {
        f.goal.value = d.goal || "";
      }
      f.notes.value = d.notes || "";
      f.counselorNote.value = d.counselorNote || "";
      if (f.sinifBranch) f.sinifBranch.value = mapDatasetToSinifSelectValue(d);
      const kuEd = document.getElementById("kullaniciAdi");
      const pwEd = document.getElementById("panelSifre");
      const toggleEd = document.getElementById("toggle-panel-sifre");
      if (kuEd) kuEd.value = d.kullaniciAdi || "";
      if (pwEd) {
        pwEd.value = d.panelSifre || "";
        pwEd.type = "password";
      }
      if (toggleEd) toggleEd.setAttribute("aria-pressed", "false");
      f.alan.value = d.alan && alanLabels[d.alan] ? d.alan : "tyt";
      if (f.counselorName) f.counselorName.value = d.counselorName || "";
      if (f.kayitPaketi) f.kayitPaketi.value = d.kayitPaketi || "";
      if (f.bursPercent) f.bursPercent.value = d.bursPercent != null ? String(d.bursPercent) : "";
      f.programType.value =
        d.programType && validProgramType[d.programType] ? d.programType : "tyt-prep";
      f.kayit.value = d.kayit || "";
      f.status.value = d.status === "donduruldu" ? "donduruldu" : "aktif";
      f.parentRelation.value =
        d.parentRelation && validParentRelation[d.parentRelation] ? d.parentRelation : "anne";
      f.parent.value = d.parent || "";
      f.parentPhone.value = d.parentPhone || "";
      f.parentEmail.value = d.parentEmail || "";
      f.emergencyName.value = d.emergencyName || "";
      f.emergencyPhone.value = d.emergencyPhone || "";
      if (f.emergencyNotes) f.emergencyNotes.value = d.emergencyNotes || "";
      if (statusEditOnlyEl) statusEditOnlyEl.hidden = false;
    }

    updateStatusSegmentUI();
    showWizardStep(1);
    modalFormOverlay.classList.add("is-open");
    formStudent.elements.name.focus();
  }

  function closeStudentForm() {
    if (modalFormOverlay) modalFormOverlay.classList.remove("is-open");
    studentFormMode = "add";
    editingRow = null;
    if (formLead) formLead.hidden = false;
    if (statusEditOnlyEl) statusEditOnlyEl.hidden = true;
    showWizardStep(1);
  }

  function collectFormPayload() {
    const f = formStudent.elements;
    const branchRaw = f.sinifBranch ? String(f.sinifBranch.value || "").trim() : "";
    const sn = parseSinifBranch(branchRaw);
    const tcDigits = f.tcNo.value.replace(/\D/g, "").slice(0, 11);
    let code = f.studentCode.value.trim();
    if (!code) {
      code = "ÖĞ-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 5).toUpperCase();
    }
    const bursRaw = f.bursPercent ? String(f.bursPercent.value || "").trim() : "";
    const bursNum = bursRaw === "" ? "" : String(Math.min(100, Math.max(0, parseInt(bursRaw, 10) || 0)));
    return {
      name: f.name.value.trim(),
      studentCode: code,
      tcNo: tcDigits,
      birthDate: f.birthDate.value,
      gender: f.gender.value,
      email: f.email.value.trim(),
      phone: f.phone.value.trim(),
      city: f.city.value.trim(),
      ilce: f.ilce ? f.ilce.value.trim() : "",
      sinifBranch: branchRaw,
      address: f.address.value.trim(),
      goal: f.goal.value.trim(),
      notes: f.notes.value.trim(),
      counselorNote: f.counselorNote.value.trim(),
      counselorName: f.counselorName ? f.counselorName.value.trim() : "",
      kayitPaketi: f.kayitPaketi ? f.kayitPaketi.value.trim() : "",
      bursPercent: bursNum,
      emergencyNotes: f.emergencyNotes ? f.emergencyNotes.value.trim() : "",
      sinif: sn.sinif,
      sinifNum: sn.sinifNum,
      alan: f.alan.value,
      programType: f.programType.value,
      kayit: f.kayit.value,
      status: f.status.value,
      parentRelation: f.parentRelation.value,
      parent: f.parent.value.trim(),
      parentPhone: f.parentPhone.value.trim(),
      parentEmail: f.parentEmail.value.trim(),
      emergencyName: f.emergencyName.value.trim(),
      emergencyPhone: f.emergencyPhone.value.trim(),
      kullaniciAdi: f.kullaniciAdi ? String(f.kullaniciAdi.value || "").trim() : "",
      panelSifre: f.panelSifre ? String(f.panelSifre.value || "") : "",
    };
  }

  function makeOgrenciRowId(p) {
    const code = String(p.studentCode || "").trim();
    if (code) return code;
    const name = String(p.name || "").trim();
    if (!name) return "ogrenci-" + Date.now().toString(36);
    return name
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "ogrenci";
  }

  function applyPayloadToDataset(tr, p) {
    tr.dataset.ogrenciId = p.ogrenciId || makeOgrenciRowId(p);
    tr.dataset.name = p.name;
    tr.dataset.studentCode = p.studentCode;
    tr.dataset.tcNo = p.tcNo;
    tr.dataset.birthDate = p.birthDate;
    tr.dataset.gender = p.gender;
    tr.dataset.email = p.email;
    tr.dataset.phone = p.phone;
    tr.dataset.city = p.city;
    tr.dataset.ilce = p.ilce != null ? p.ilce : "";
    tr.dataset.sinifBranch = p.sinifBranch != null ? p.sinifBranch : "";
    tr.dataset.address = p.address;
    tr.dataset.goal = p.goal;
    tr.dataset.notes = p.notes;
    tr.dataset.counselorNote = p.counselorNote;
    tr.dataset.counselorName = p.counselorName != null ? p.counselorName : "";
    tr.dataset.kayitPaketi = p.kayitPaketi != null ? p.kayitPaketi : "";
    tr.dataset.bursPercent = p.bursPercent != null ? p.bursPercent : "";
    tr.dataset.emergencyNotes = p.emergencyNotes != null ? p.emergencyNotes : "";
    tr.dataset.sinif = p.sinif;
    tr.dataset.sinifNum = p.sinifNum;
    tr.dataset.alan = p.alan;
    tr.dataset.programType = p.programType;
    tr.dataset.kayit = p.kayit;
    tr.dataset.status = p.status;
    tr.dataset.parentRelation = p.parentRelation;
    tr.dataset.parent = p.parent;
    tr.dataset.parentPhone = p.parentPhone;
    tr.dataset.parentEmail = p.parentEmail;
    tr.dataset.emergencyName = p.emergencyName;
    tr.dataset.emergencyPhone = p.emergencyPhone;
    tr.dataset.kullaniciAdi = p.kullaniciAdi != null ? p.kullaniciAdi : "";
    tr.dataset.panelSifre = p.panelSifre != null ? p.panelSifre : "";
    tr.dataset.coachId =
      p.coachId != null && String(p.coachId).trim() !== ""
        ? String(p.coachId).trim()
        : String(dpActiveCoachIdFromSession() || "").trim();
  }

  function studentActionsSvg() {
    return (
      '<button type="button" class="js-student-action" data-action="edit" aria-label="Düzenle">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>' +
      '<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
      "</svg></button>" +
      '<button type="button" class="js-student-action" data-action="delete" aria-label="Sil">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>' +
      "</svg></button>" +
      '<button type="button" class="js-student-action" data-action="view" aria-label="Görüntüle">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>' +
      '<circle cx="12" cy="12" r="3"/>' +
      "</svg></button>"
    );
  }

  function buildStudentRow(p) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-student", "");
    applyPayloadToDataset(tr, p);

    const alanLabel = alanLabels[p.alan] || p.alan;
    const badgeCls = badgeClass[p.alan] || "";
    const statusText = p.status === "aktif" ? "Aktif" : "Kayıt donduruldu";
    const statusCls = p.status === "aktif" ? "status-pill--aktif" : "status-pill--donduruldu";
    const ini = initialsFromName(p.name);

    tr.innerHTML =
      '<td class="data-table__td--check"><input type="checkbox" class="js-student-select" aria-label="Satır seç" /></td>' +
      '<td><div class="student-cell student-cell--rich">' +
      '<span class="student-avatar student-avatar--initials" aria-hidden="true">' +
      escapeHtml(ini) +
      "</span>" +
      '<div class="student-text">' +
      '<span class="student-name">' +
      escapeHtml(p.name) +
      "</span>" +
      '<span class="student-goal">' +
      escapeHtml(p.goal) +
      "</span></div></div></td>" +
      '<td><div class="veli-cell">' +
      '<span class="veli-name">' +
      escapeHtml(p.parent) +
      "</span>" +
      '<span class="veli-tel">' +
      escapeHtml(p.parentPhone) +
      "</span></div></td>" +
      '<td><span class="field-badge ' +
      escapeHtml(badgeCls) +
      '">' +
      escapeHtml(alanLabel) +
      "</span></td>" +
      '<td><span class="student-sinif-cell">' +
      escapeHtml(p.sinif) +
      "</span></td>" +
      "<td>" +
      escapeHtml(p.kayit) +
      "</td>" +
      '<td><span class="status-pill ' +
      escapeHtml(statusCls) +
      '">' +
      escapeHtml(statusText) +
      "</span></td>" +
      '<td><div class="table-actions">' +
      studentActionsSvg() +
      "</div></td>";

    return tr;
  }

  tbody.addEventListener("click", function (e) {
    const btn = e.target.closest(".js-student-action");
    if (!btn) return;
    const tr = btn.closest("tr[data-student]");
    if (!tr) return;
    const action = btn.getAttribute("data-action");
    if (action === "view") {
      if (typeof window.showDetayModal === "function") {
        let oid = (tr.dataset.ogrenciId || "").trim();
        if (!oid) {
          tr.dataset.ogrenciId = makeOgrenciRowId({
            name: tr.dataset.name,
            studentCode: tr.dataset.studentCode,
          });
          oid = tr.dataset.ogrenciId;
        }
        window.showDetayModal(oid);
      } else openStudentView(tr);
    }
    else if (action === "edit") openStudentForm("edit", tr);
    else if (action === "delete") {
      if (confirm('"' + tr.dataset.name + '" kaydını silmek istiyor musunuz?')) {
        tr.remove();
        updateTabCounts();
        applyFilters();
        if (typeof window.syncDereceStudentCatalog === "function") window.syncDereceStudentCatalog();
      }
    }
  });

  tbody.addEventListener("change", function (e) {
    const t = e.target;
    if (t && t.classList && t.classList.contains("js-student-select")) {
      syncSelectAllCheckbox();
      updateBulkModeUi();
    }
  });

  if (btnAddStudent) {
    btnAddStudent.addEventListener("click", function () {
      openStudentForm("add");
    });
  }

  const studentsSelectAll = document.getElementById("students-select-all");
  if (studentsSelectAll) {
    studentsSelectAll.addEventListener("change", function () {
      const on = studentsSelectAll.checked;
      allRows().forEach(function (tr) {
        const cb = tr.querySelector(".js-student-select");
        if (!cb) return;
        cb.checked = on && !tr.hidden;
      });
      studentsSelectAll.indeterminate = false;
      updateBulkModeUi();
    });
  }

  if (btnBulkCancel) {
    btnBulkCancel.addEventListener("click", function () {
      setBulkSelectionMode(false);
    });
  }

  if (btnBulkPrimary) {
    btnBulkPrimary.addEventListener("click", function () {
      if (!isBulkSelectionMode) {
        setBulkSelectionMode(true);
        return;
      }
      const selected = Array.from(tbody.querySelectorAll("tr[data-student] .js-student-select:checked"))
        .map(function (inp) {
          return inp.closest("tr[data-student]");
        })
        .filter(Boolean);
      if (!selected.length) {
        showOgToast("Silinecek satır seçin.", "");
        return;
      }
      const n = selected.length;
      const names = selected.slice(0, 5).map(function (tr) {
        return tr.dataset.name || "—";
      });
      const more = n > 5 ? "\n… ve " + (n - 5) + " kayıt daha" : "";
      const msg = n + " öğrenci kaydını kalıcı olarak silmek istiyor musunuz?\n\n" + names.join(", ") + more;
      if (!confirm(msg)) return;
      selected.forEach(function (tr) {
        tr.remove();
      });
      setBulkSelectionMode(false);
      updateTabCounts();
      applyFilters();
      if (typeof window.syncDereceStudentCatalog === "function") window.syncDereceStudentCatalog();
      showOgToast(n + " öğrenci silindi.", "ok");
    });
  }

  if (btnViewEdit) {
    btnViewEdit.addEventListener("click", function () {
      const tr = viewRowRef;
      if (!tr) return;
      closeStudentView();
      openStudentForm("edit", tr);
    });
  }

  document.querySelectorAll("[data-close-student-view]").forEach(function (b) {
    b.addEventListener("click", closeStudentView);
  });
  if (modalViewOverlay) {
    modalViewOverlay.addEventListener("click", function (e) {
      if (e.target === modalViewOverlay) closeStudentView();
    });
  }

  document.querySelectorAll("[data-close-student-form]").forEach(function (b) {
    b.addEventListener("click", closeStudentForm);
  });
  if (modalFormOverlay) {
    modalFormOverlay.addEventListener("click", function (e) {
      if (e.target === modalFormOverlay) closeStudentForm();
    });
  }

  if (btnFormStatusAktif) {
    btnFormStatusAktif.addEventListener("click", function () {
      setFormStatus("aktif");
    });
  }
  if (btnFormStatusDondur) {
    btnFormStatusDondur.addEventListener("click", function () {
      setFormStatus("donduruldu");
    });
  }

  if (formStudent) {
    formStudent.addEventListener("submit", function (e) {
      e.preventDefault();
      if (wizardStep < WIZ_MAX) {
        showOgToast("Kaydı tamamlamak için son adıma ilerleyin.", "");
        return;
      }
      const p = collectFormPayload();
      if (!p.name) return;
      if (studentFormMode === "edit" && editingRow) {
        Object.assign(p, {
          ogrenciId: String(editingRow.dataset.ogrenciId || "").trim(),
          coachId: String(editingRow.dataset.coachId || "").trim() || dpActiveCoachIdFromSession(),
        });
        applyPayloadToDataset(editingRow, p);
        refreshRowFromDataset(editingRow);
      } else {
        p.coachId = dpActiveCoachIdFromSession();
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
          p.ogrenciId = crypto.randomUUID();
        }
        tbody.appendChild(buildStudentRow(p));
        updateTabCounts();
        applyFilters();
        showOgrenciKayitSuccessToast(1);
      }
      if (typeof window.syncDereceStudentCatalog === "function") window.syncDereceStudentCatalog();
      closeStudentForm();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      printStudentListPdf();
    });
  }

  if (wizBtnNext) {
    wizBtnNext.addEventListener("click", function () {
      if (!validateWizardStep(wizardStep)) return;
      if (wizardStep < WIZ_MAX) showWizardStep(wizardStep + 1);
    });
  }
  if (wizBtnBack) {
    wizBtnBack.addEventListener("click", function () {
      if (wizardStep > 1) showWizardStep(wizardStep - 1);
    });
  }
  wizTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const n = parseInt(tab.getAttribute("data-wiz-step-indicator"), 10);
      if (tab.disabled || Number.isNaN(n)) return;
      showWizardStep(n);
    });
  });

  const togglePanelSifreBtn = document.getElementById("toggle-panel-sifre");
  if (togglePanelSifreBtn) {
    togglePanelSifreBtn.addEventListener("click", function () {
      const inp = document.getElementById("panelSifre");
      if (!inp) return;
      const show = inp.type === "password";
      inp.type = show ? "text" : "password";
      togglePanelSifreBtn.setAttribute("aria-pressed", show ? "true" : "false");
    });
  }

  function handleImportFile(file) {
    if (!file) return;
    const fname = file.name || "";
    const isCsv = /\.csv$/i.test(fname) || (file.type && file.type.indexOf("csv") !== -1);
    const isExcel =
      /\.xlsx?$/i.test(fname) ||
      (file.type &&
        (file.type.indexOf("spreadsheet") !== -1 ||
          file.type.indexOf("excel") !== -1 ||
          file.type.indexOf("officedocument") !== -1));
    if (!isCsv && !isExcel) {
      showOgToast("Lütfen Excel (.xlsx) veya CSV dosyası seçin.", "");
      return;
    }
    if (isCsv && !isExcel) {
      const readerCsv = new FileReader();
      readerCsv.onload = function () {
        processImportedCsvText(String(readerCsv.result || ""));
      };
      readerCsv.onerror = function () {
        showOgToast("Dosya okunamadı.", "");
      };
      readerCsv.readAsText(file, "UTF-8");
      return;
    }
    if (typeof XLSX === "undefined") {
      showOgToast("Excel kütüphanesi yüklenemedi; sayfayı yenileyin.", "");
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const buf = e.target && e.target.result;
        if (!buf) {
          showOgToast("Dosya okunamadı.", "");
          return;
        }
        const data = new Uint8Array(buf);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          showOgToast("Çalışma sayfası bulunamadı.", "");
          return;
        }
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: "" });
        processImportedRows(jsonData);
      } catch (err) {
        showOgToast("Excel okunamadı.", "");
      }
    };
    reader.onerror = function () {
      showOgToast("Dosya okunamadı.", "");
    };
    reader.readAsArrayBuffer(file);
  }

  if (btnBulkImport) {
    btnBulkImport.addEventListener("click", openImportModal);
  }
  if (btnCloseImport) {
    btnCloseImport.addEventListener("click", closeImportModal);
  }
  if (modalImportOverlay) {
    modalImportOverlay.addEventListener("click", function (e) {
      if (e.target === modalImportOverlay) closeImportModal();
    });
  }
  if (btnDownloadExcelTemplate) {
    btnDownloadExcelTemplate.addEventListener("click", downloadExcelTemplate);
  }
  if (importFileInput) {
    importFileInput.addEventListener("change", function () {
      const f = importFileInput.files && importFileInput.files[0];
      if (f) handleImportFile(f);
    });
  }
  if (importDropZone) {
    ["dragenter", "dragover"].forEach(function (ev) {
      importDropZone.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        importDropZone.classList.add("is-drag");
      });
    });
    importDropZone.addEventListener("dragleave", function (e) {
      e.preventDefault();
      e.stopPropagation();
      importDropZone.classList.remove("is-drag");
    });
    importDropZone.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      importDropZone.classList.remove("is-drag");
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleImportFile(f);
    });
  }

  // --- Tam öğrenci kayıtlarının kalıcılığı (localStorage) ---
  const STUDENTS_FULL_KEY = "derecepanel_students_full_v1";

  function dpActiveCoachIdFromSession() {
    try {
      return String(sessionStorage.getItem("dp_auth_user_id") || sessionStorage.getItem("dp_appwrite_user_id") || "").trim();
    } catch (e) {
      return "";
    }
  }

  function migrateStudentsAssignCoachIdIfMissing() {
    const coachId = dpActiveCoachIdFromSession();
    if (!coachId) return;
    try {
      const raw = localStorage.getItem(STUDENTS_FULL_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || !arr.length) return;
      let dirty = false;
      const next = arr.map(function (row) {
        if (!row || typeof row !== "object") return row;
        if (String(row.coachId || "").trim()) return row;
        dirty = true;
        return Object.assign({}, row, { coachId: coachId });
      });
      if (dirty) localStorage.setItem(STUDENTS_FULL_KEY, JSON.stringify(next));
    } catch (e2) {}
  }

  function collectPayloadFromRow(tr) {
    const d = tr.dataset;
    return {
      ogrenciId: d.ogrenciId || "",
      name: d.name || "",
      studentCode: d.studentCode || "",
      tcNo: d.tcNo || "",
      birthDate: d.birthDate || "",
      gender: d.gender || "",
      email: d.email || "",
      phone: d.phone || "",
      city: d.city || "",
      ilce: d.ilce || "",
      sinifBranch: d.sinifBranch || "",
      address: d.address || "",
      goal: d.goal || "",
      notes: d.notes || "",
      counselorNote: d.counselorNote || "",
      counselorName: d.counselorName || "",
      kayitPaketi: d.kayitPaketi || "",
      bursPercent: d.bursPercent || "",
      emergencyNotes: d.emergencyNotes || "",
      sinif: d.sinif || "",
      sinifNum: d.sinifNum || "",
      alan: d.alan || "",
      programType: d.programType || "",
      kayit: d.kayit || "",
      status: d.status || "aktif",
      parentRelation: d.parentRelation || "",
      parent: d.parent || "",
      parentPhone: d.parentPhone || "",
      parentEmail: d.parentEmail || "",
      emergencyName: d.emergencyName || "",
      emergencyPhone: d.emergencyPhone || "",
      kullaniciAdi: d.kullaniciAdi || "",
      panelSifre: d.panelSifre || "",
      coachId: d.coachId || "",
    };
  }

  function persistStudentsFull() {
    try {
      const rows = Array.from(tbody.querySelectorAll("tr[data-student]"));
      if (!rows.length) {
        localStorage.setItem(STUDENTS_FULL_KEY, JSON.stringify([]));
        try {
          localStorage.setItem(STUDENTS_LEGACY_KEY, JSON.stringify([]));
        } catch (e0) {}
        return;
      }
      const list = rows.map(collectPayloadFromRow);
      localStorage.setItem(STUDENTS_FULL_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  /** `students` (süper admin / eski sürüm) ile tam kayıt şemasını tablo satırına çevirir. */
  function legacyStudentRecordToPayload(raw) {
    if (!raw || typeof raw !== "object") return null;
    const name = String(raw.name || "").trim();
    if (!name) return null;
    const branchRaw = String(
      raw.sinifBranch != null && String(raw.sinifBranch).trim() !== ""
        ? raw.sinifBranch
        : raw.sinif || raw.sube || raw.class || ""
    ).trim();
    const sn = parseSinifBranch(branchRaw);
    let alan = String(raw.alan || "tyt")
      .toLowerCase()
      .trim() || "tyt";
    if (!Object.prototype.hasOwnProperty.call(alanLabels, alan)) alan = "tyt";
    let status = String(raw.status || "aktif").toLowerCase();
    if (status.indexOf("dondur") !== -1) status = "donduruldu";
    else status = "aktif";
    const idOrCode = String(raw.studentCode || raw.id || raw.ogrenciId || "").trim();
    let programType = String(raw.programType || "tyt-prep").trim() || "tyt-prep";
    if (!Object.prototype.hasOwnProperty.call(validProgramType, programType)) programType = "tyt-prep";
    let parentRelation = String(raw.parentRelation || "anne").trim() || "anne";
    if (!Object.prototype.hasOwnProperty.call(validParentRelation, parentRelation)) parentRelation = "anne";
    const goal = String(raw.goal != null && raw.goal !== "" ? raw.goal : raw.meta || "").trim();
    return {
      ogrenciId: String(raw.ogrenciId || raw.id || "").trim(),
      name,
      studentCode: idOrCode,
      tcNo: String(raw.tcNo || "").trim(),
      birthDate: String(raw.birthDate || "").trim(),
      gender: String(raw.gender || "").trim(),
      email: String(raw.email || "").trim(),
      phone: String(raw.phone || "").trim(),
      city: String(raw.city || "").trim(),
      ilce: String(raw.ilce || "").trim(),
      sinifBranch: branchRaw,
      address: String(raw.address || "").trim(),
      goal,
      notes: String(raw.notes || "").trim(),
      counselorNote: String(raw.counselorNote || "").trim(),
      counselorName: String(raw.counselorName || "").trim(),
      kayitPaketi: String(raw.kayitPaketi || "").trim(),
      bursPercent: String(raw.bursPercent != null ? raw.bursPercent : "").trim(),
      emergencyNotes: String(raw.emergencyNotes || "").trim(),
      sinif: String(raw.sinif || sn.sinif || "").trim() || sn.sinif,
      sinifNum: String(raw.sinifNum || sn.sinifNum || "").trim() || sn.sinifNum,
      alan,
      programType,
      kayit: String(raw.kayit || "").trim() || new Date().toLocaleDateString("tr-TR"),
      status,
      parentRelation,
      parent: String(raw.parent || "").trim(),
      parentPhone: String(raw.parentPhone || "").trim(),
      parentEmail: String(raw.parentEmail || "").trim(),
      emergencyName: String(raw.emergencyName || "").trim(),
      emergencyPhone: String(raw.emergencyPhone || "").trim(),
      kullaniciAdi: String(raw.kullaniciAdi || "").trim(),
      panelSifre: String(raw.panelSifre || "").trim(),
      coachId: String(raw.coachId != null ? raw.coachId : raw.koc_id || "").trim(),
    };
  }

  function payloadDedupeKey(p) {
    const c = String(p.studentCode || "").trim().toLowerCase();
    if (c) return "c:" + c;
    const o = String(p.ogrenciId || "").trim().toLowerCase();
    if (o) return "o:" + o;
    return "n:" + String(p.name || "").trim().toLowerCase();
  }

  function hydrateStudentsFromStorage() {
    try {
      if (tbody.querySelector("tr[data-student]")) return; // tabloda kayıt varsa hidrate etme
      migrateStudentsAssignCoachIdIfMissing();
      const coachScope = dpActiveCoachIdFromSession();
      const fromFull = [];
      const fromLegacy = [];
      try {
        const raw = localStorage.getItem(STUDENTS_FULL_KEY);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) fromFull.push.apply(fromFull, list);
        }
      } catch (_e1) {}
      try {
        const rawL = localStorage.getItem(STUDENTS_LEGACY_KEY);
        if (rawL) {
          const listL = JSON.parse(rawL);
          if (Array.isArray(listL)) fromLegacy.push.apply(fromLegacy, listL);
        }
      } catch (_e2) {}
      const seen = {};
      const payloads = [];
      fromFull.forEach(function (raw) {
        const p = legacyStudentRecordToPayload(raw);
        if (!p) return;
        if (coachScope && String(p.coachId || "").trim() !== coachScope) return;
        const k = payloadDedupeKey(p);
        if (seen[k]) return;
        seen[k] = true;
        payloads.push(p);
      });
      fromLegacy.forEach(function (raw) {
        const p = legacyStudentRecordToPayload(raw);
        if (!p) return;
        if (coachScope && String(p.coachId || "").trim() !== coachScope) return;
        const k = payloadDedupeKey(p);
        if (seen[k]) return;
        seen[k] = true;
        payloads.push(p);
      });
      if (!payloads.length) return;
      payloads.forEach(function (p) {
        tbody.appendChild(buildStudentRow(p));
      });
      try {
        persistStudentsFull();
      } catch (_pe) {}
    } catch (e) {}
  }

  hydrateStudentsFromStorage();

  // Form submit / silme sonrasında çağrılan sync'i de yakala
  const _origSync = window.syncDereceStudentCatalog;
  window.syncDereceStudentCatalog = function () {
    persistStudentsFull();
    if (typeof _origSync === "function") _origSync();
  };

  function syncStudentGoalsFromFullStorage() {
    try {
      const raw = localStorage.getItem(STUDENTS_FULL_KEY);
      if (!raw || !tbody) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      tbody.querySelectorAll("tr[data-student]").forEach(function (tr) {
        const name = String(tr.dataset.name || "").trim();
        const code = String(tr.dataset.studentCode || "").trim().toLowerCase();
        for (let i = 0; i < list.length; i++) {
          const rec = list[i];
          if (!rec) continue;
          const rname = String(rec.name || "").trim();
          const rcode = String(rec.studentCode || "").trim().toLowerCase();
          const match =
            (name && rname && name === rname) || (code && rcode && code === rcode);
          if (!match) continue;
          const g = String(rec.goal || "").trim();
          if (g && tr.dataset.goal !== g) {
            tr.dataset.goal = g;
            refreshRowFromDataset(tr);
          }
          break;
        }
      });
    } catch (_eG) {}
  }

  window.addEventListener("storage", function (e) {
    if (!e || !e.key) return;
    if (
      e.key === STUDENTS_FULL_KEY ||
      e.key === "students" ||
      (e.key && e.key.indexOf("student_target_") === 0)
    ) {
      syncStudentGoalsFromFullStorage();
    }
  });

  window.addEventListener("derece:student-target-changed", syncStudentGoalsFromFullStorage);
  window.addEventListener("derece:students-full-goal-sync", syncStudentGoalsFromFullStorage);

  updateTabCounts();
  applyFilters();
  if (typeof window.syncDereceStudentCatalog === "function") window.syncDereceStudentCatalog();
})();

/** Dashboard: YKS geri sayım + TYT alan dağılımı (Chart.js) */
document.addEventListener("DOMContentLoaded", function () {
  var yksRoot = document.getElementById("yks-countdown");
  if (yksRoot) {
    var tytStr = yksRoot.getAttribute("data-tyt") || yksRoot.getAttribute("data-target") || "2026-06-20T10:15:00+03:00";
    var aytStr = yksRoot.getAttribute("data-ayt") || "2026-06-21T10:15:00+03:00";
    var progressStart = new Date("2025-09-01T00:00:00+03:00");
    var tytDate = new Date(tytStr);
    var aytDate = new Date(aytStr);
    var unitsWrap = yksRoot.querySelector(".yks-countdown__units");
    var sessionsWrap = yksRoot.querySelector(".yks-countdown__sessions");
    var doneEl = yksRoot.querySelector(".yks-countdown__done");
    var phaseEl = document.getElementById("yks-phase-label");
    var progressFill = document.getElementById("yks-progress-fill");
    var elDays = yksRoot.querySelector('[data-yks="days"]');
    var elHours = yksRoot.querySelector('[data-yks="hours"]');
    var elMinutes = yksRoot.querySelector('[data-yks="minutes"]');
    var elSeconds = yksRoot.querySelector('[data-yks="seconds"]');
    var sessionEls = {
      tyt: document.getElementById("yks-session-tyt"),
      ayt: document.getElementById("yks-session-ayt"),
    };

    function pad2(n) {
      return String(n).padStart(2, "0");
    }

    function setAnimated(el, value) {
      if (!el) return;
      var next = String(value);
      if (el.textContent === next) return;
      el.textContent = next;
      el.classList.remove("yks-flip");
      void el.offsetWidth;
      el.classList.add("yks-flip");
    }

    function formatRemain(ms) {
      if (ms <= 0) return "Tamamlandı";
      var s = Math.floor(ms / 1000);
      var d = Math.floor(s / 86400);
      s -= d * 86400;
      var h = Math.floor(s / 3600);
      if (d > 0) return d + " gün " + h + " saat kaldı";
      if (h > 0) {
        var m = Math.floor((s - h * 3600) / 60);
        return h + " saat " + m + " dk kaldı";
      }
      var m = Math.floor(s / 60);
      return m > 0 ? m + " dakika kaldı" : s + " saniye kaldı";
    }

    function sessionStatus(ms) {
      if (ms <= 0) return { key: "past", label: "Tamamlandı" };
      if (ms < 86400000) return { key: "soon", label: "Yarın" };
      return { key: "upcoming", label: "Yaklaşıyor" };
    }

    function pickNextTarget(now) {
      if (now < tytDate) return { date: tytDate, label: "TYT oturumuna kalan süre", key: "tyt" };
      if (now < aytDate) return { date: aytDate, label: "AYT oturumuna kalan süre", key: "ayt" };
      return null;
    }

    function tick() {
      var now = Date.now();
      var next = pickNextTarget(now);

      if (!next) {
        if (unitsWrap) unitsWrap.hidden = true;
        if (sessionsWrap) sessionsWrap.hidden = true;
        if (doneEl) doneEl.hidden = false;
        if (phaseEl) phaseEl.textContent = "YKS oturumları tamamlandı";
        if (progressFill) progressFill.style.width = "100%";
        return;
      }

      if (unitsWrap) unitsWrap.hidden = false;
      if (sessionsWrap) sessionsWrap.hidden = false;
      if (doneEl) doneEl.hidden = true;
      if (phaseEl) phaseEl.textContent = next.label;

      var ms = next.date.getTime() - now;
      var s = Math.floor(ms / 1000);
      var d = Math.floor(s / 86400);
      s -= d * 86400;
      var h = Math.floor(s / 3600);
      s -= h * 3600;
      var m = Math.floor(s / 60);
      s -= m * 60;

      setAnimated(elDays, String(d));
      setAnimated(elHours, pad2(h));
      setAnimated(elMinutes, pad2(m));
      setAnimated(elSeconds, pad2(s));

      if (progressFill) {
        var span = tytDate.getTime() - progressStart.getTime();
        var pct = span > 0 ? ((now - progressStart.getTime()) / span) * 100 : 0;
        progressFill.style.width = Math.min(100, Math.max(0, pct)).toFixed(1) + "%";
      }

      ["tyt", "ayt"].forEach(function (key) {
        var card = sessionEls[key];
        var date = key === "tyt" ? tytDate : aytDate;
        var remainEl = yksRoot.querySelector('[data-yks-remain="' + key + '"]');
        var statusEl = yksRoot.querySelector('[data-yks-session-status="' + key + '"]');
        var remainMs = date.getTime() - now;
        var st = sessionStatus(remainMs);

        if (card) {
          card.classList.toggle("yks-session--active", next.key === key);
          card.classList.toggle("yks-session--past", remainMs <= 0);
        }
        if (remainEl) remainEl.textContent = formatRemain(remainMs);
        if (statusEl) {
          if (next.key === key && remainMs > 0) statusEl.textContent = "Sıradaki oturum";
          else statusEl.textContent = st.label;
        }
      });
    }

    tick();
    setInterval(tick, 1000);
  }

  if (typeof Chart === "undefined") return;

  var tytBundled = document.getElementById("chart-tyt-bundled");
  var breakdownEl = document.getElementById("distribution-breakdown");
  if (tytBundled && breakdownEl) {
    var LABELS = {
      sayisal: "Sayısal",
      esit: "Eşit ağırlık",
      sozel: "Sözel",
      dil: "Dil",
      tyt: "TYT / diğer",
    };
    var COLORS = {
      sayisal: "#6366f1",
      esit: "#8b5cf6",
      sozel: "#d97706",
      dil: "#0ea5e9",
      tyt: "#64748b",
    };
    var ORDER = ["sayisal", "esit", "sozel", "dil", "tyt"];

    function buildTytSegments() {
      var cat = window.DereceStudentCatalog;
      if (!Array.isArray(cat) || !cat.length) return [];
      var counts = { sayisal: 0, esit: 0, sozel: 0, dil: 0, tyt: 0 };
      cat.forEach(function (s) {
        var a = (s && s.alan ? String(s.alan) : "tyt").toLowerCase();
        if (Object.prototype.hasOwnProperty.call(counts, a)) counts[a]++;
        else counts.tyt++;
      });
      var total = cat.length;
      var out = [];
      ORDER.forEach(function (k) {
        var c = counts[k];
        if (c > 0) {
          out.push({
            key: k,
            label: LABELS[k] || k,
            pct: total ? Math.round((c / total) * 1000) / 10 : 0,
            count: c,
            color: COLORS[k] || "#94a3b8",
          });
        }
      });
      return out;
    }

    var TYT_SEGMENTS = buildTytSegments();

    if (!TYT_SEGMENTS.length) {
      breakdownEl.innerHTML =
        '<li class="distribution-breakdown__item distribution-breakdown__item--empty">' +
        "Henüz kayıtlı öğrenci yok. Dağılımı görmek için Öğrencilerim üzerinden kayıt ekleyin." +
        "</li>";
      return;
    }

    breakdownEl.innerHTML = TYT_SEGMENTS.map(function (s) {
      return (
        "<li class=\"distribution-breakdown__item\">" +
        '<span class="distribution-breakdown__dot" style="background:' +
        s.color +
        '"></span>' +
        '<span class="distribution-breakdown__name">' +
        s.label +
        "</span>" +
        '<span class="distribution-breakdown__pct">' +
        s.pct +
        "%</span>" +
        '<span class="distribution-breakdown__count">' +
        s.count.toLocaleString("tr-TR") +
        " öğrenci</span>" +
        "</li>"
      );
    }).join("");

    new Chart(tytBundled, {
      type: "doughnut",
      data: {
        labels: TYT_SEGMENTS.map(function (s) {
          return s.label;
        }),
        datasets: [
          {
            data: TYT_SEGMENTS.map(function (s) {
              return s.count;
            }),
            backgroundColor: TYT_SEGMENTS.map(function (s) {
              return s.color;
            }),
            borderColor: "#ffffff",
            borderWidth: 3,
            borderRadius: 6,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        cutout: "70%",
        rotation: -90,
        circumference: 360,
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var i = ctx.dataIndex;
                var seg = TYT_SEGMENTS[i];
                if (!seg) return "";
                return " " + seg.pct + "% · " + seg.count.toLocaleString("tr-TR") + " öğrenci";
              },
            },
          },
        },
      },
    });
  }
});

/** Dashboard: etkileşimli takvim (Pzt başlangıçlı) */
(function () {
  var MONTHS_TR = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];
  var WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  function daysInMonth(y, m) {
    return new Date(y, m + 1, 0).getDate();
  }

  /** Pazartesi = 0 … Pazar = 6 */
  function mondayIndex(d) {
    return (d.getDay() + 6) % 7;
  }

  var gridEl;
  var labelEl;
  var btnPrev;
  var btnNext;
  var viewY;
  var viewM;
  var selY;
  var selM;
  var selD;

  function render() {
    if (!gridEl || !labelEl) return;

    labelEl.textContent = MONTHS_TR[viewM] + " " + viewY;

    var frag = document.createDocumentFragment();
    var i;
    for (i = 0; i < 7; i++) {
      var w = document.createElement("span");
      w.textContent = WEEKDAYS[i];
      w.setAttribute("role", "columnheader");
      frag.appendChild(w);
    }

    var first = new Date(viewY, viewM, 1);
    var lead = mondayIndex(first);
    var dim = daysInMonth(viewY, viewM);
    var prevMonth = viewM === 0 ? 11 : viewM - 1;
    var prevYear = viewM === 0 ? viewY - 1 : viewY;
    var prevDim = daysInMonth(prevYear, prevMonth);

    var cells = [];

    for (i = 0; i < lead; i++) {
      var pd = prevDim - lead + 1 + i;
      cells.push({ y: prevYear, m: prevMonth, d: pd, muted: true });
    }
    for (i = 1; i <= dim; i++) {
      cells.push({ y: viewY, m: viewM, d: i, muted: false });
    }
    var nextMonth = viewM === 11 ? 0 : viewM + 1;
    var nextYear = viewM === 11 ? viewY + 1 : viewY;
    var nd = 1;
    while (cells.length % 7 !== 0 || cells.length < 42) {
      cells.push({ y: nextYear, m: nextMonth, d: nd, muted: true });
      nd += 1;
      if (cells.length > 48) break;
    }

    cells.forEach(function (cell) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day-num";
      if (cell.muted) btn.classList.add("day-num--muted");
      if (!cell.muted && cell.y === selY && cell.m === selM && cell.d === selD) {
        btn.classList.add("day-num--active");
      }
      btn.textContent = String(cell.d);
      btn.setAttribute(
        "aria-label",
        cell.d + " " + MONTHS_TR[cell.m] + " " + cell.y + (cell.muted ? " (diğer ay)" : "")
      );
      btn.addEventListener("click", function () {
        selY = cell.y;
        selM = cell.m;
        selD = cell.d;
        viewY = cell.y;
        viewM = cell.m;
        render();
      });
      frag.appendChild(btn);
    });

    gridEl.innerHTML = "";
    gridEl.appendChild(frag);
  }

  function init() {
    gridEl = document.getElementById("dash-cal-grid");
    labelEl = document.getElementById("dash-cal-label");
    btnPrev = document.getElementById("dash-cal-prev");
    btnNext = document.getElementById("dash-cal-next");
    if (!gridEl || !labelEl) return;

    var now = new Date();
    viewY = now.getFullYear();
    viewM = now.getMonth();
    selY = viewY;
    selM = viewM;
    selD = now.getDate();

    if (btnPrev) {
      btnPrev.addEventListener("click", function () {
        if (viewM === 0) {
          viewM = 11;
          viewY -= 1;
        } else {
          viewM -= 1;
        }
        render();
      });
    }
    if (btnNext) {
      btnNext.addEventListener("click", function () {
        if (viewM === 11) {
          viewM = 0;
          viewY += 1;
        } else {
          viewM += 1;
        }
        render();
      });
    }

    var manageBtn = document.getElementById("dash-cal-manage");
    if (manageBtn) {
      manageBtn.addEventListener("click", function () {
        alert("Takvim yönetimi yakında bağlanacak.");
      });
    }

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/**
 * Fabrika ayarları — yalnızca tarayıcı konsolundan: `factoryReset()`
 * Tüm iş verisini localStorage'dan siler; IndexedDB şablon veritabanını da temizler.
 * Tema (derecepanel-theme) ve oturum (sessionStorage) bilinçli olarak dokunulmaz.
 */
window.factoryReset = function () {
  if (
    !confirm(
      "DİKKAT! Tüm iş verisi (öğrenciler, koçlar, kurum kaydı, sınavlar, sonuçlar, şablonlar vb.) kalıcı olarak silinecek. Emin misiniz?"
    )
  ) {
    return;
  }
  var keysToWipe = [
    "coaches",
    "institutions",
    "students",
    "exams",
    "kurumsalExams",
    "globalExams",
    "examResults",
    "savedFmtTemplates",
    "appointments",
    "tasks",
    "derecepanel_student_catalog_v1",
    "derecepanel_students_full_v1",
    "kurum_denemeler_v1",
    "global_denemeler_v1",
    "derece_exam_results_v1",
    "derecepanel_optik_templates_v1",
    "derecepanel_active_template_v1",
    "derecepanel_randevular_v2",
    "derece_soru_havuzu",
    "derece_hatali_soru_havuzu",
    "transfer_tarama_sorulari",
    "transfer_hata_recete_ogrenci",
    "transfer_hata_recete_meta",
    "aktarilanReceteSorulari",
    "receteOgrenciAdi",
    "transfer_tarama_edit",
    "transfer_tarama_autoprint",
    "okutulan_deneme_gecici",
    "okutulan_denemeler",
    "derece_exam_matrix_v1",
    "derece_exam_results_matrix_v1",
    "derece_optik_fmt_repo",
    "derecepanel-weekly-programs-v1",
    "derecepanel.library.books.v1",
    "derecepanel.library.assignments.v1",
    "derecepanel_fmt_mock_purged_v2",
    "derece_exam_matrix_purge_mock_v2",
    "derecepanel_kurum_adi",
    "kurumAdi",
    "tm-brief-kurum",
    "kurum_adi",
    "teklif_talepleri_v1",
  ];
  keysToWipe.forEach(function (key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      /* yoksay */
    }
  });
  try {
    if (window.indexedDB && typeof indexedDB.deleteDatabase === "function") {
      indexedDB.deleteDatabase("derecepanel_db");
    }
  } catch (e2) {
    /* yoksay */
  }
  console.log("Sistem başarıyla fabrika ayarlarına döndürüldü. Sıfır kilometre!");
  window.location.reload();
};
