/**
 * Kurucu girişi — oturum sessionStorage ile (yalnızca istemci).
 * Çıkış: super-admin-login.html?logout=1
 */
(function () {
  "use strict";

  var SESSION_KEY = "derece_sa_session";

  function expectedUser() {
    return atob("YWRtaW4x");
  }

  function expectedPass() {
    return atob("YWRtaW4xMjM=");
  }

  function applyLogoutQuery() {
    try {
      if (/[?&]logout=1(?:&|$)/.test(String(window.location.search || ""))) {
        sessionStorage.removeItem(SESSION_KEY);
        window.history.replaceState(null, "", "super-admin-login.html");
      }
    } catch (e) {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch (e2) {}
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyLogoutQuery();
    var form = document.querySelector("#sa-login-form");
    if (!form) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var uEl = document.getElementById("sa-username");
      var pEl = document.getElementById("sa-password");
      var u = String((uEl && uEl.value) || "").trim();
      var p = String((pEl && pEl.value) || "");
      if (u === expectedUser() && p === expectedPass()) {
        try {
          sessionStorage.setItem(SESSION_KEY, "ok");
        } catch (e3) {}
        window.location.href = "super-admin.html";
        return;
      }
      window.alert("Kullanıcı adı veya şifre hatalı.");
    });
  });
})();
