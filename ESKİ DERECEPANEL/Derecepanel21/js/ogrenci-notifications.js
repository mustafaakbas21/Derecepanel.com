/**
 * Öğrenci paneli — bildirimler (localStorage student_notifications_<currentUser.id veya yedek anahtar>).
 */
(function () {
  function slugFromName(name) {
    var n = String(name || "")
      .trim()
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return n || "ogrenci";
  }

  function currentStudentStorageId(u) {
    if (!u || typeof u !== "object") return "";
    var oid = String(u.id || u.ogrenciId || "").trim();
    if (oid) return oid;
    var code = String(u.studentCode || u.code || "").trim();
    if (code) return code.toLowerCase().replace(/\s+/g, "-");
    return slugFromName(u.name);
  }

  /** Öncelik: currentUser.id (istenen sözleşme); yoksa mevcut oturum yedekleri */
  function notificationsStorageKeyForUser(u) {
    if (!u || typeof u !== "object") return "";
    var primary = String(u.id || "").trim();
    var sid = primary || currentStudentStorageId(u);
    if (!sid) return "";
    return "student_notifications_" + sid;
  }

  function readNotifications(key) {
    if (!key) return [];
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var p = JSON.parse(raw);
      if (Array.isArray(p)) return p;
      if (p && typeof p === "object") return [p];
    } catch (e) {}
    return [];
  }

  function writeNotifications(key, list) {
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {}
  }

  function hasAnyUnread(list) {
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      if (n && !n.read) return true;
    }
    return false;
  }

  function getParsedUser() {
    try {
      var raw = localStorage.getItem("currentUser");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function formatNotifyDate(item) {
    var d = item && item.date;
    if (!d) return "";
    try {
      var x = typeof d === "string" ? new Date(d) : d instanceof Date ? d : new Date(String(d));
      if (isNaN(x.getTime())) return "";
      return x.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (e2) {
      return "";
    }
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function renderNotifications() {
    var host = document.getElementById("og-notify-list");
    if (!host) return;
    var u = getParsedUser();
    var key = notificationsStorageKeyForUser(u);
    host.innerHTML = "";
    if (!key) {
      var p0 = document.createElement("p");
      p0.className = "og-notify-list__empty";
      p0.textContent = "Oturum bilgisi bulunamadı.";
      host.appendChild(p0);
      return;
    }
    var list = readNotifications(key);
    if (!list.length) {
      var empty = document.createElement("p");
      empty.className = "og-notify-list__empty";
      empty.textContent = "Şu an yeni bir bildiriminiz yok.";
      host.appendChild(empty);
      return;
    }
    for (var i = list.length - 1; i >= 0; i--) {
      (function (index) {
        var n = list[index];
        if (!n || typeof n !== "object") return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("role", "menuitem");
        btn.className = "og-notify-dropdown__item";
        if (!n.read) btn.classList.add("og-notify-item--unread");
        btn.setAttribute("data-og-notify-index", String(index));
        var row = document.createElement("span");
        row.className = "og-notify-item__row";
        var t = document.createElement("span");
        t.className = "og-notify-item__text";
        t.innerHTML = escapeHtml(n.text || "Bildirim");
        row.appendChild(t);
        var meta = formatNotifyDate(n);
        if (meta) {
          var m = document.createElement("span");
          m.className = "og-notify-item__meta";
          m.textContent = meta;
          row.appendChild(m);
        }
        btn.appendChild(row);
        host.appendChild(btn);
      })(i);
    }
  }

  function refreshBadgeAndDropdown() {
    var badge = document.getElementById("og-notify-badge");
    var bell = document.getElementById("og-notify-bell");
    var u = getParsedUser();
    var key = notificationsStorageKeyForUser(u);
    var list = readNotifications(key);
    var unread = hasAnyUnread(list);
    if (badge) {
      badge.hidden = !unread;
      badge.setAttribute("aria-hidden", unread ? "false" : "true");
    }
    if (bell) bell.setAttribute("data-has-unread", unread ? "true" : "false");
    var drop = document.getElementById("og-notify-dropdown");
    if (drop && !drop.hidden) renderNotifications();
  }

  function markItemReadAndPersist(index) {
    var u = getParsedUser();
    var key = notificationsStorageKeyForUser(u);
    var list = readNotifications(key);
    if (index < 0 || index >= list.length) return null;
    var item = list[index];
    if (item) item.read = true;
    writeNotifications(key, list);
    return item;
  }

  function wire() {
    var wrap = document.querySelector(".og-notify-wrap");
    var bell = document.getElementById("og-notify-bell");
    var drop = document.getElementById("og-notify-dropdown");
    var listHost = document.getElementById("og-notify-list");
    var frame = document.getElementById("og-student-frame");

    if (!bell || !drop || !listHost) return;

    bell.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var nowHidden = drop.hidden;
      drop.hidden = !nowHidden;
      bell.setAttribute("aria-expanded", drop.hidden ? "false" : "true");
      if (!drop.hidden) renderNotifications();
    });

    document.addEventListener("click", function () {
      if (!drop.hidden) {
        drop.hidden = true;
        bell.setAttribute("aria-expanded", "false");
      }
    });

    drop.addEventListener("click", function (ev) {
      ev.stopPropagation();
    });

    listHost.addEventListener("click", function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      var btn = t.closest("button[data-og-notify-index]");
      if (!btn) return;
      var idx = parseInt(btn.getAttribute("data-og-notify-index"), 10);
      if (isNaN(idx)) return;
      var item = markItemReadAndPersist(idx);
      drop.hidden = true;
      bell.setAttribute("aria-expanded", "false");
      refreshBadgeAndDropdown();
      var typ = item && String(item.type || "").toLowerCase();
      if (typ === "randevu") {
        if (frame) frame.src = "ogrenci-randevular.html";
        else window.location.href = "ogrenci-randevular.html";
        return;
      }
      if (typ === "program") {
        if (frame) frame.src = "ogrenci-aktif-program.html";
        else window.location.href = "ogrenci-aktif-program.html";
        return;
      }
      if (frame) frame.focus();
    });

    window.addEventListener("storage", function (e) {
      var u = getParsedUser();
      var key = notificationsStorageKeyForUser(u);
      if (e.key === key) refreshBadgeAndDropdown();
    });

    if (wrap) {
      wrap.addEventListener("click", function (ev) {
        ev.stopPropagation();
      });
    }

    refreshBadgeAndDropdown();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  window.refreshOgrenciNotifyBadge = refreshBadgeAndDropdown;
  window.renderNotifications = renderNotifications;
})();
