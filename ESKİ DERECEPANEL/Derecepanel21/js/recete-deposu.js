/**
 * Reçete Deposu — şimdilik statik arşiv kabuğu.
 * Ders/Konu filtreleri YKS müfredatı ile doldurulur; liste entegrasyonu sonradan bağlanabilir.
 */
(function () {
  "use strict";

  var elDers = document.getElementById("td-ders");
  var elKonu = document.getElementById("td-konu");
  var elQ = document.getElementById("td-q");
  var elDate = document.getElementById("td-date");
  var elClear = document.getElementById("td-clear");

  function populateDers() {
    if (!elDers) return;
    while (elDers.options.length > 1) elDers.remove(1);
    if (!window.YksMufredat || !window.YksMufredat.subjects) return;
    var subs = window.YksMufredat.subjects || [];
    subs.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s.id;
      opt.setAttribute("data-name", s.name);
      opt.textContent = s.name + (s.sinav ? " (" + s.sinav + ")" : "");
      elDers.appendChild(opt);
    });
  }

  function populateKonu(subId) {
    if (!elKonu) return;
    elKonu.innerHTML = '<option value="">Tümü</option>';
    elKonu.disabled = !subId;
    if (!subId || !window.YksMufredatApi) return;
    var topics = window.YksMufredatApi.getTopics(subId) || [];
    topics.forEach(function (t) {
      var opt = document.createElement("option");
      opt.value = t.id;
      opt.setAttribute("data-name", t.name);
      opt.textContent = t.name;
      elKonu.appendChild(opt);
    });
    elKonu.disabled = topics.length === 0;
  }

  function clearFilters() {
    if (elQ) elQ.value = "";
    if (elDers) elDers.selectedIndex = 0;
    populateKonu("");
    if (elDate) elDate.selectedIndex = 0;
  }

  function waitForMufredat(retries) {
    if (window.YksMufredat && window.YksMufredat.subjects && window.YksMufredat.subjects.length) {
      populateDers();
      return;
    }
    if (retries <= 0) return;
    setTimeout(function () {
      waitForMufredat(retries - 1);
    }, 120);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (elDers) elDers.addEventListener("change", function () {
      populateKonu(elDers.value);
    });
    if (elClear) elClear.addEventListener("click", clearFilters);
    waitForMufredat(60);
  });
})();
