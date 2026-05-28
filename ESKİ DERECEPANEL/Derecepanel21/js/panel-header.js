/**
 * Panel header — baş harfli avatar (#headerAvatarContainer), profil menüsü, Detay/Düzenle diyalogları.
 * Öncelik: localStorage currentUser (name / firstName+lastName); yoksa session dp_auth_user.
 */
(function () {
  /** Üst bardaki güneş butonu — theme.js ile aynı döngü (header.js uyumu) */
  var THEME_CYCLE = ["dark", "light", "blue", "orange"];

  /** dp-topbar-sheet: bildirim + tema (#dp-header-*), header.js yüklü olmayan sayfalar için */
  function initDpTopbarActions() {
    var notify = document.getElementById("dp-header-notify");
    if (notify && notify.getAttribute("data-dp-bound") !== "1") {
      notify.setAttribute("data-dp-bound", "1");
      notify.addEventListener("click", function () {
        window.alert("Bildirimler yakında kullanılabilir olacaktır.");
      });
    }
    var themeBtn = document.getElementById("dp-header-theme");
    if (themeBtn && themeBtn.getAttribute("data-dp-bound") !== "1") {
      themeBtn.setAttribute("data-dp-bound", "1");
      themeBtn.addEventListener("click", function () {
        if (typeof window.DerecepanelTheme === "undefined" || typeof window.DerecepanelTheme.applyTheme !== "function") {
          window.alert("Tema modülü yüklenemedi.");
          return;
        }
        var cur = document.documentElement.getAttribute("data-theme") || "dark";
        var idx = THEME_CYCLE.indexOf(cur);
        if (idx < 0) idx = 0;
        var next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
        window.DerecepanelTheme.applyTheme(next);
      });
    }
  }

  function initialsFromNameString(name) {
    var parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) {
      var a = parts[0][0] || "";
      var b = parts[parts.length - 1][0] || "";
      return (a + b).toUpperCase();
    }
    if (parts.length === 1) {
      var w = parts[0];
      if (w.length >= 2) return w.slice(0, 2).toUpperCase();
      if (w.length === 1) return (w[0] + "?").toUpperCase();
    }
    return "";
  }

  /** Oturumda «admin1@localhost» gibi değer kaldıysa meta satırında yalnızca kullanıcı adı göster. */
  function stripDevCoachEmailForDisplay(raw) {
    var t = String(raw || "").trim();
    var at = t.indexOf("@");
    if (at <= 0) return t;
    var host = t.slice(at + 1).toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host === "derecepanel.local" ||
      /\.local$/.test(host)
    ) {
      var local = t.slice(0, at).trim();
      return local || t;
    }
    return t;
  }

  function resolveDisplayName() {
    try {
      var raw = localStorage.getItem("currentUser");
      if (raw) {
        var u = JSON.parse(raw);
        if (u && typeof u === "object") {
          if (u.firstName && u.lastName) {
            return String(u.firstName).trim() + " " + String(u.lastName).trim();
          }
          if (u.name) return String(u.name).trim();
          if (u.displayName) return String(u.displayName).trim();
        }
      }
    } catch (e) {}
    try {
      var login = sessionStorage.getItem("dp_auth_user");
      if (login) {
        var local = String(login).split("@")[0].replace(/[._-]+/g, " ").trim();
        if (local) return local;
      }
    } catch (e2) {}
    return "";
  }

  function authRole() {
    try {
      return String(sessionStorage.getItem("dp_auth_role") || "").trim();
    } catch (e) {
      return "";
    }
  }

  function readUserObject() {
    try {
      var raw = localStorage.getItem("currentUser");
      if (raw) {
        var u = JSON.parse(raw);
        if (u && typeof u === "object") return u;
      }
    } catch (e) {}
    return null;
  }

  function resolveMetaLine() {
    var u = readUserObject();
    var role = authRole();
    if (u) {
      if (u.kullaniciAdi) return String(u.kullaniciAdi);
      if (u.email) return String(u.email);
      if (u.studentCode) return String(u.studentCode);
    }
    try {
      var login = sessionStorage.getItem("dp_auth_user");
      if (login) return stripDevCoachEmailForDisplay(login);
    } catch (e2) {}
    return role === "coach" ? "Koç hesabı" : role === "student" ? "Öğrenci hesabı" : "";
  }

  function mergeAndSaveUser(patch) {
    var base = readUserObject() || {};
    var next = Object.assign({}, base, patch);
    try {
      localStorage.setItem("currentUser", JSON.stringify(next));
    } catch (e) {
      return false;
    }
    try {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "currentUser",
          newValue: JSON.stringify(next),
          url: window.location.href,
          storageArea: localStorage,
        })
      );
    } catch (e2) {
      /* bazı ortamlar StorageEvent oluşturmayı kısıtlar */
    }
    return true;
  }

  function renderAvatar() {
    var el = document.getElementById("headerAvatarContainer");
    var lg = document.getElementById("headerProfileMenuAvatar");
    var name = resolveDisplayName();
    var ini = initialsFromNameString(name);
    var label = ini || "??";
    if (el) {
      el.textContent = label;
      el.removeAttribute("title");
    }
    if (lg) lg.textContent = label;
    var trig = document.getElementById("headerProfileTrigger");
    if (trig) {
      var t = name || "Hesap menüsü";
      trig.setAttribute("aria-label", t);
      trig.setAttribute("title", t);
    }
    var nm = document.getElementById("headerProfileName");
    var meta = document.getElementById("headerProfileMeta");
    if (nm) nm.textContent = name || "Misafir";
    if (meta) meta.textContent = resolveMetaLine() || "—";
  }

  function closeProfileMenu() {
    var menu = document.getElementById("headerProfileMenu");
    var trig = document.getElementById("headerProfileTrigger");
    if (menu) {
      menu.hidden = true;
    }
    if (trig) {
      trig.setAttribute("aria-expanded", "false");
    }
  }

  function openProfileMenu() {
    var menu = document.getElementById("headerProfileMenu");
    var trig = document.getElementById("headerProfileTrigger");
    if (!menu || !trig) return;
    renderAvatar();
    menu.hidden = false;
    trig.setAttribute("aria-expanded", "true");
  }

  function toggleProfileMenu() {
    var menu = document.getElementById("headerProfileMenu");
    if (!menu) return;
    if (menu.hidden) openProfileMenu();
    else closeProfileMenu();
  }

  function ensureDialogs() {
    if (document.getElementById("dp-profile-dialog-detay")) return;

    var detay = document.createElement("dialog");
    detay.id = "dp-profile-dialog-detay";
    detay.className = "dp-profile-dialog";
    detay.setAttribute("aria-labelledby", "dp-profile-detay-title");
    detay.innerHTML =
      '<div class="dp-profile-dialog__panel">' +
      '<div class="dp-profile-dialog__head">' +
      '<div><h2 class="dp-profile-dialog__title" id="dp-profile-detay-title">Hesap detayı</h2>' +
      '<p class="dp-profile-dialog__sub">Bilgiler yerel oturumunuzdan okunur.</p></div>' +
      '<button type="button" class="dp-profile-dialog__close" data-dp-profile-close aria-label="Kapat">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>' +
      "</button></div>" +
      '<div id="dp-profile-detay-body"></div>' +
      '<div class="dp-profile-dialog__actions">' +
      '<button type="button" class="dp-profile-dialog__btn dp-profile-dialog__btn--ghost" data-dp-profile-close>Kapat</button>' +
      "</div></div>";

    var duzenle = document.createElement("dialog");
    duzenle.id = "dp-profile-dialog-duzenle";
    duzenle.className = "dp-profile-dialog";
    duzenle.setAttribute("aria-labelledby", "dp-profile-duzenle-title");
    duzenle.innerHTML =
      '<form class="dp-profile-dialog__panel" id="dp-profile-duzenle-form">' +
      '<div class="dp-profile-dialog__head">' +
      '<div><h2 class="dp-profile-dialog__title" id="dp-profile-duzenle-title">Profili düzenle</h2>' +
      '<p class="dp-profile-dialog__sub">Görünen ad, kullanıcı bilgisi ve panel şifrenizi güncelleyebilirsiniz.</p></div>' +
      '<button type="button" class="dp-profile-dialog__close" data-dp-profile-close-duzenle aria-label="Kapat">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>' +
      "</button></div>" +
      '<div class="dp-profile-dialog__field"><label class="dp-profile-dialog__label" for="dp-profile-in-name">Ad soyad</label>' +
      '<input class="dp-profile-dialog__input" id="dp-profile-in-name" name="name" autocomplete="name" /></div>' +
      '<div class="dp-profile-dialog__field"><label class="dp-profile-dialog__label" for="dp-profile-in-login">Kullanıcı / e-posta</label>' +
      '<input class="dp-profile-dialog__input" id="dp-profile-in-login" name="login" autocomplete="username" /></div>' +
      '<p class="dp-profile-dialog__section" id="dp-profile-pwd-section">Şifre</p>' +
      '<p class="dp-profile-dialog__hint" id="dp-profile-pwd-hint">Şifre kayıtlıysa değiştirmek için önce mevcut şifreyi girin. İlk kez belirliyorsanız yalnızca yeni şifre alanlarını doldurun.</p>' +
      '<div class="dp-profile-dialog__field"><label class="dp-profile-dialog__label" for="dp-profile-in-pwd-current">Mevcut şifre</label>' +
      '<input class="dp-profile-dialog__input" id="dp-profile-in-pwd-current" type="password" name="pwd_current" autocomplete="current-password" /></div>' +
      '<div class="dp-profile-dialog__field"><label class="dp-profile-dialog__label" for="dp-profile-in-pwd-new">Yeni şifre</label>' +
      '<input class="dp-profile-dialog__input" id="dp-profile-in-pwd-new" type="password" name="pwd_new" autocomplete="new-password" /></div>' +
      '<div class="dp-profile-dialog__field"><label class="dp-profile-dialog__label" for="dp-profile-in-pwd-repeat">Yeni şifre (tekrar)</label>' +
      '<input class="dp-profile-dialog__input" id="dp-profile-in-pwd-repeat" type="password" name="pwd_repeat" autocomplete="new-password" /></div>' +
      '<div class="dp-profile-dialog__actions">' +
      '<button type="button" class="dp-profile-dialog__btn dp-profile-dialog__btn--ghost" value="cancel" data-dp-profile-cancel>İptal</button>' +
      '<button type="submit" class="dp-profile-dialog__btn dp-profile-dialog__btn--primary">Kaydet</button>' +
      "</div></form>";

    document.body.appendChild(detay);
    document.body.appendChild(duzenle);

    detay.querySelectorAll("[data-dp-profile-close]").forEach(function (b) {
      b.addEventListener("click", function () {
        detay.close();
      });
    });
    duzenle.querySelector("[data-dp-profile-close-duzenle]").addEventListener("click", function () {
      duzenle.close();
    });
    duzenle.querySelector("[data-dp-profile-cancel]").addEventListener("click", function () {
      duzenle.close();
    });
    duzenle.querySelector("#dp-profile-duzenle-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var n = document.getElementById("dp-profile-in-name");
      var l = document.getElementById("dp-profile-in-login");
      var pc = document.getElementById("dp-profile-in-pwd-current");
      var pn = document.getElementById("dp-profile-in-pwd-new");
      var pr = document.getElementById("dp-profile-in-pwd-repeat");
      var name = n ? String(n.value || "").trim() : "";
      var login = l ? String(l.value || "").trim() : "";
      var pwCur = pc ? String(pc.value || "") : "";
      var pwNew = pn ? String(pn.value || "") : "";
      var pwRep = pr ? String(pr.value || "") : "";

      var u0 = readUserObject();
      var storedPwd =
        u0 && u0.panelSifre !== undefined && u0.panelSifre !== null ? String(u0.panelSifre) : "";

      var touchedPwd = pwCur.length > 0 || pwNew.length > 0 || pwRep.length > 0;
      if (touchedPwd) {
        if (pwNew.length === 0 && pwRep.length === 0 && pwCur.length > 0) {
          window.alert("Yeni şifreyi ve tekrarını girin.");
          return;
        }
        if (pwNew.length > 0 || pwRep.length > 0) {
          if (pwNew !== pwRep) {
            window.alert("Yeni şifre ile tekrarı eşleşmiyor.");
            return;
          }
          if (pwNew.length < 4) {
            window.alert("Yeni şifre en az 4 karakter olmalıdır.");
            return;
          }
          if (storedPwd.length > 0 && pwCur !== storedPwd) {
            window.alert("Mevcut şifre hatalı.");
            return;
          }
        }
      }

      var patch = {
        name: name || resolveDisplayName(),
        kullaniciAdi: login,
      };
      if (pwNew.length > 0) {
        patch.panelSifre = pwNew;
      }

      if (!mergeAndSaveUser(patch)) {
        return;
      }
      try {
        if (login) sessionStorage.setItem("dp_auth_user", login);
      } catch (e) {}
      if (pc) pc.value = "";
      if (pn) pn.value = "";
      if (pr) pr.value = "";
      renderAvatar();
      duzenle.close();
    });
  }

  function fillDetayDialog() {
    var body = document.getElementById("dp-profile-detay-body");
    if (!body) return;
    var u = readUserObject();
    var name = resolveDisplayName();
    var role = authRole();
    var roleLabel = role === "coach" ? "Koç" : role === "student" ? "Öğrenci" : "—";
    var login = "";
    try {
      login = sessionStorage.getItem("dp_auth_user") || "";
    } catch (e) {}
    var rows = [
      ["Ad soyad", name || "—"],
      ["Rol", roleLabel],
      ["Oturum", login || "—"],
    ];
    if (u && u.studentCode) rows.push(["Öğrenci kodu", String(u.studentCode)]);
    if (u && u.email && !rows.some(function (r) { return r[1] === u.email; })) {
      rows.push(["E-posta", String(u.email)]);
    }
    var hasPanelPwd =
      u &&
      u.panelSifre !== undefined &&
      u.panelSifre !== null &&
      String(u.panelSifre).length > 0;
    rows.push(["Panel şifresi", hasPanelPwd ? "Kayıtlı" : "Belirlenmemiş"]);
    var html =
      '<dl class="dp-profile-dialog__dl">' +
      rows
        .map(function (r) {
          return (
            '<div class="dp-profile-dialog__row"><dt class="dp-profile-dialog__dt">' +
            r[0] +
            '</dt><dd class="dp-profile-dialog__dd">' +
            escapeHtml(r[1]) +
            "</dd></div>"
          );
        })
        .join("") +
      "</dl>";
    body.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openDetay() {
    ensureDialogs();
    var d = document.getElementById("dp-profile-dialog-detay");
    if (!d) return;
    fillDetayDialog();
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
  }

  function openDuzenle() {
    ensureDialogs();
    var d = document.getElementById("dp-profile-dialog-duzenle");
    if (!d) return;
    var n = document.getElementById("dp-profile-in-name");
    var l = document.getElementById("dp-profile-in-login");
    if (n) n.value = resolveDisplayName();
    if (l) {
      var u = readUserObject();
      l.value = (u && u.kullaniciAdi) || (u && u.email) || "";
      if (!l.value) {
        try {
          l.value = sessionStorage.getItem("dp_auth_user") || "";
        } catch (e) {}
      }
    }
    var pc = document.getElementById("dp-profile-in-pwd-current");
    var pn = document.getElementById("dp-profile-in-pwd-new");
    var pr = document.getElementById("dp-profile-in-pwd-repeat");
    if (pc) pc.value = "";
    if (pn) pn.value = "";
    if (pr) pr.value = "";
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
    setTimeout(function () {
      var n = document.getElementById("dp-profile-in-name");
      if (n) n.focus();
    }, 30);
  }

  function initProfileMenu() {
    var wrap = document.querySelector("[data-header-profile]");
    if (!wrap || wrap.getAttribute("data-profile-bound") === "1") return;
    wrap.setAttribute("data-profile-bound", "1");

    var trig = document.getElementById("headerProfileTrigger");
    if (trig) {
      trig.addEventListener("click", function (ev) {
        ev.stopPropagation();
        toggleProfileMenu();
      });
    }

    wrap.querySelectorAll("[data-profile-open]").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var kind = btn.getAttribute("data-profile-open");
        closeProfileMenu();
        if (kind === "detay") openDetay();
        else if (kind === "duzenle") openDuzenle();
      });
    });

    var lo = wrap.querySelector(".header-profile__row--logout");
    if (lo) {
      lo.addEventListener(
        "click",
        function () {
          closeProfileMenu();
        },
        true
      );
    }

    document.addEventListener("click", function (ev) {
      if (!wrap.contains(ev.target)) closeProfileMenu();
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      if (document.querySelector("dialog[open]")) return;
      closeProfileMenu();
    });
  }

  function boot() {
    renderAvatar();
    initProfileMenu();
    initDpTopbarActions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("storage", function (ev) {
    if (ev.key === "currentUser") renderAvatar();
  });
})();
