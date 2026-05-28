/**
 * Bakım modu: maintenance_mode === 'true' iken kurucu (super-admin*) sayfaları dışında
 * oturum kabuklarına girişi engeller; login sayfasına yönlendirir.
 */
(function () {
  try {
    if (localStorage.getItem("maintenance_mode") !== "true") return;
    var path = (location.pathname || "").replace(/\\/g, "/").toLowerCase();
    if (path.indexOf("super-admin") !== -1) return;
    if (path.indexOf("super-admin-login") !== -1) return;
    if (path.endsWith("/login.html") || path.endsWith("login.html")) return;
    var login = path.indexOf("/pages/") !== -1 ? "../login.html" : "login.html";
    var sep = login.indexOf("?") === -1 ? "?" : "&";
    location.replace(login + sep + "bakim=1");
  } catch (e) {}
})();
