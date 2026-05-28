/**
 * Koçlar: arama, filtre, detay, düzenleme, ekleme
 */
(function () {
  const table = document.getElementById("coaches-table");
  if (!table) return;

  const tbody = table.querySelector("tbody");
  const searchInput = document.getElementById("coach-search");
  const specialtyFilter = document.getElementById("coach-specialty-filter");
  const countSummary = document.getElementById("coach-count-summary");
  const btnAdd = document.getElementById("btn-add-coach");
  const overlay = document.getElementById("modal-coach-form");
  const form = document.getElementById("form-coach");
  const formTitle = document.getElementById("modal-coach-form-title");
  const formLead = document.getElementById("modal-coach-form-lead");
  const formSubmit = document.getElementById("form-coach-submit");
  const modalViewOverlay = document.getElementById("modal-coach-view");
  const viewBody = document.getElementById("modal-coach-view-body");
  const btnViewEdit = document.getElementById("btn-coach-view-edit");

  let coachFormMode = "add";
  let editingCoachRow = null;
  let viewCoachRowRef = null;

  const specialtyLabels = {
    tyt: "TYT",
    sayisal: "Sayısal",
    esit: "Eşit ağırlık",
    sozel: "Sözel",
    dil: "Dil",
    pdr: "PDR",
  };

  const badgeClass = {
    tyt: "field-badge--tyt",
    sayisal: "field-badge--sayisal",
    esit: "field-badge--esit",
    sozel: "field-badge--sozel",
    dil: "field-badge--dil",
    pdr: "field-badge--pdr",
  };

  const genderLabels = {
    kadin: "Kadın",
    erkek: "Erkek",
    belirtmekistemiyorum: "Belirtmek istemiyorum",
  };

  const workModelLabels = {
    hibrit: "Hibrit",
    yuzyuze: "Yüz yüze ağırlıklı",
    online: "Uzaktan ağırlıklı",
  };

  const validSpecialty = Object.keys(badgeClass);
  const validWorkModel = Object.keys(workModelLabels);
  const validStatus = { aktif: true, izinli: true, pasif: true };
  const validGender = Object.keys(genderLabels);

  function escapeHtml(s) {
    if (!s) return "";
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function initialsFromName(name) {
    const parts = String(name || "")
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0] ? parts[0][0] : "?").toUpperCase();
  }

  function allRows() {
    return Array.from(tbody.querySelectorAll("tr[data-coach]"));
  }

  function syncRowTooltips(tr) {
    const d = tr.dataset;
    const goalEl = tr.querySelector(".student-goal");
    if (goalEl) goalEl.setAttribute("title", (d.title || goalEl.textContent || "").trim());
    const nameEl = tr.querySelector(".student-name");
    if (nameEl) nameEl.setAttribute("title", (d.name || nameEl.textContent || "").trim());
    const mail = tr.querySelector(".veli-name");
    if (mail) mail.setAttribute("title", (d.email || mail.textContent || "").trim());
    const tel = tr.querySelector(".veli-tel");
    if (tel) tel.setAttribute("title", (d.phone || tel.textContent || "").trim());
  }

  function syncAllRowTooltips() {
    allRows().forEach(syncRowTooltips);
  }

  function rowMatches(tr) {
    const spec = specialtyFilter && specialtyFilter.value ? specialtyFilter.value : "all";
    if (spec !== "all" && (tr.dataset.specialty || "") !== spec) return false;

    const q = (searchInput && searchInput.value ? searchInput.value : "").trim().toLowerCase();
    if (!q) return true;

    const d = tr.dataset;
    const hay = [
      d.name,
      d.title,
      d.email,
      d.phone,
      d.staffCode,
      specialtyLabels[d.specialty] || d.specialty,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  }

  function syncCoachEmptyUi() {
    const el = document.getElementById("coaches-pristine-empty");
    const scroll = table ? table.closest(".table-scroll") : null;
    const card = table ? table.closest(".table-card") : null;
    const pag = card ? card.querySelector(".pagination") : null;
    const n = allRows().length;
    if (el) el.hidden = n !== 0;
    if (scroll) scroll.hidden = n === 0;
    if (pag) pag.hidden = n === 0;
  }

  function applyFilters() {
    let visible = 0;
    allRows().forEach(function (tr) {
      const ok = rowMatches(tr);
      tr.hidden = !ok;
      if (ok) visible++;
    });
    if (countSummary) {
      countSummary.textContent = visible + " koç" + (visible !== allRows().length ? " (filtreli)" : "");
    }
    syncAllRowTooltips();
    syncCoachEmptyUi();
  }

  function detailLine(label, value) {
    const v = value && String(value).trim();
    const inner = v
      ? escapeHtml(v)
      : '<span class="student-detail-empty">Belirtilmedi</span>';
    return "<dt>" + escapeHtml(label) + "</dt><dd>" + inner + "</dd>";
  }

  function openCoachView(tr) {
    if (!viewBody || !modalViewOverlay) return;
    viewCoachRowRef = tr;
    const d = tr.dataset;
    const ini = initialsFromName(d.name);
    const spec = d.specialty || "tyt";
    const specLabel = specialtyLabels[spec] || spec || "—";
    const badgeCls = "field-badge " + (badgeClass[spec] || badgeClass.tyt);
    const st = statusUi(d.status);
    const pillCls = "status-pill " + st.cls;

    viewBody.innerHTML =
      '<header class="student-detail-head">' +
      '<span class="student-detail-avatar" aria-hidden="true">' +
      escapeHtml(ini) +
      "</span>" +
      '<div><h2 class="student-detail-name">' +
      escapeHtml(d.name || "Koç") +
      '</h2><div class="student-detail-badges">' +
      '<span class="' +
      escapeHtml(badgeCls) +
      '">' +
      escapeHtml(specLabel) +
      "</span>" +
      '<span class="' +
      escapeHtml(pillCls) +
      '">' +
      escapeHtml(st.text) +
      "</span></div></div></header>" +
      '<section class="student-detail-section"><h3>Kimlik</h3>' +
      '<dl class="student-detail-dl">' +
      detailLine("Personel kodu", d.staffCode) +
      detailLine("T.C. kimlik no", d.tcNo) +
      detailLine("Doğum tarihi", d.birthDate) +
      detailLine("Cinsiyet", genderLabels[d.gender] || d.gender) +
      "</dl></section>" +
      '<section class="student-detail-section"><h3>İletişim</h3>' +
      '<dl class="student-detail-dl">' +
      detailLine("Kurumsal e-posta", d.email) +
      detailLine("Cep telefonu", d.phone) +
      detailLine("İl", d.city) +
      "</dl></section>" +
      '<section class="student-detail-section"><h3>Uzmanlık ve deneyim</h3>' +
      '<dl class="student-detail-dl">' +
      detailLine("Unvan / rol", d.title) +
      detailLine("Sınav alanı uzmanlığı", specLabel) +
      detailLine("YKS / akademi deneyimi (yıl)", d.yearsExp) +
      detailLine("Sertifikalar ve ek eğitimler", d.certificates) +
      "</dl></section>" +
      '<section class="student-detail-section"><h3>Çalışma düzeni</h3>' +
      '<dl class="student-detail-dl">' +
      detailLine(
        "Kontenjan",
        (d.capacity || "0") + " / " + (d.capacityMax || "0") + " öğrenci"
      ) +
      detailLine("Çalışma modeli", workModelLabels[d.workModel] || d.workModel) +
      detailLine("Ofis / şube", d.office) +
      "</dl></section>" +
      '<section class="student-detail-section"><h3>Tanıtım ve notlar</h3>' +
      '<dl class="student-detail-dl">' +
      detailLine("Kısa tanıtım", d.bio) +
      detailLine("Kurum içi not", d.internalNote) +
      "</dl></section>";

    modalViewOverlay.classList.add("is-open");
    viewBody.focus();
  }

  function closeCoachView() {
    if (modalViewOverlay) modalViewOverlay.classList.remove("is-open");
    viewCoachRowRef = null;
  }

  function openCoachForm(mode, tr) {
    if (!overlay || !form) return;
    coachFormMode = mode;
    editingCoachRow = mode === "edit" && tr ? tr : null;

    if (mode === "add") {
      if (formTitle) formTitle.textContent = "Koç ekle";
      if (formLead) formLead.hidden = false;
      if (formSubmit) formSubmit.textContent = "Kaydı oluştur";
      form.reset();
      const cap = form.elements.namedItem("capacity");
      const capMax = form.elements.namedItem("capacityMax");
      if (cap) cap.value = "0";
      if (capMax) capMax.value = "12";
      const st = form.elements.namedItem("status");
      if (st) st.value = "aktif";
      const wm = form.elements.namedItem("workModel");
      if (wm) wm.value = "hibrit";
    } else {
      if (formTitle) formTitle.textContent = "Koçu düzenle";
      if (formLead) formLead.hidden = true;
      if (formSubmit) formSubmit.textContent = "Değişiklikleri kaydet";
      const d = tr.dataset;
      const f = form.elements;
      f.name.value = d.name || "";
      f.staffCode.value = d.staffCode || "";
      f.tcNo.value = d.tcNo || "";
      f.birthDate.value = d.birthDate || "";
      f.gender.value = d.gender && validGender.indexOf(d.gender) !== -1 ? d.gender : "";
      f.email.value = d.email || "";
      f.phone.value = d.phone || "";
      f.city.value = d.city || "";
      f.title.value = d.title || "";
      f.specialty.value = d.specialty && validSpecialty.indexOf(d.specialty) !== -1 ? d.specialty : "";
      f.yearsExp.value = d.yearsExp || "";
      f.certificates.value = d.certificates || "";
      f.status.value = d.status && validStatus[d.status] ? d.status : "aktif";
      f.capacity.value = d.capacity || "0";
      f.capacityMax.value = d.capacityMax || "12";
      f.workModel.value =
        d.workModel && validWorkModel.indexOf(d.workModel) !== -1 ? d.workModel : "hibrit";
      f.office.value = d.office || "";
      f.bio.value = d.bio || "";
      f.internalNote.value = d.internalNote || "";
    }

    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    form.elements.namedItem("name").focus();
  }

  function closeCoachForm() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    coachFormMode = "add";
    editingCoachRow = null;
    if (formLead) formLead.hidden = false;
    if (formTitle) formTitle.textContent = "Koç ekle";
    if (formSubmit) formSubmit.textContent = "Kaydı oluştur";
  }

  function collectPayload() {
    const f = form;
    const cap = parseInt(String(f.capacity.value || "0"), 10);
    const capMax = parseInt(String(f.capacityMax.value || "1"), 10);
    const safeCap = Math.min(Math.max(isNaN(cap) ? 0 : cap, 0), 99);
    const safeMax = Math.min(Math.max(isNaN(capMax) ? 12 : capMax, 1), 99);
    const tcDigits = f.tcNo.value.replace(/\D/g, "").slice(0, 11);
    return {
      name: f.name.value.trim(),
      staffCode: f.staffCode.value.trim(),
      tcNo: tcDigits,
      birthDate: f.birthDate.value,
      gender: f.gender.value,
      email: f.email.value.trim(),
      phone: f.phone.value.trim(),
      city: f.city.value.trim(),
      title: f.title.value.trim(),
      specialty: f.specialty.value,
      yearsExp: f.yearsExp.value.trim(),
      certificates: f.certificates.value.trim(),
      status: f.status.value,
      capacity: String(Math.min(safeCap, safeMax)),
      capacityMax: String(safeMax),
      workModel: f.workModel.value,
      office: f.office.value.trim(),
      bio: f.bio.value.trim(),
      internalNote: f.internalNote.value.trim(),
    };
  }

  function applyPayloadToDataset(tr, p) {
    tr.dataset.name = p.name;
    tr.dataset.staffCode = p.staffCode;
    tr.dataset.tcNo = p.tcNo;
    tr.dataset.birthDate = p.birthDate;
    tr.dataset.gender = p.gender;
    tr.dataset.email = p.email;
    tr.dataset.phone = p.phone;
    tr.dataset.city = p.city;
    tr.dataset.title = p.title;
    tr.dataset.specialty = p.specialty;
    tr.dataset.yearsExp = p.yearsExp;
    tr.dataset.certificates = p.certificates;
    tr.dataset.status = p.status;
    tr.dataset.capacity = p.capacity;
    tr.dataset.capacityMax = p.capacityMax;
    tr.dataset.workModel = p.workModel;
    tr.dataset.office = p.office;
    tr.dataset.bio = p.bio;
    tr.dataset.internalNote = p.internalNote;
  }

  function statusUi(status) {
    if (status === "izinli") return { text: "İzinli", cls: "status-pill--izinli" };
    if (status === "pasif") return { text: "Pasif", cls: "status-pill--pasif" };
    return { text: "Aktif", cls: "status-pill--aktif" };
  }

  function refreshRowFromDataset(tr) {
    const d = tr.dataset;
    const nameEl = tr.querySelector(".student-name");
    const titleEl = tr.querySelector(".student-goal");
    if (nameEl) nameEl.textContent = d.name || "";
    if (titleEl) titleEl.textContent = d.title || "";
    const ini = tr.querySelector(".student-avatar--initials");
    if (ini && d.name) ini.textContent = initialsFromName(d.name);
    const badge = tr.querySelector(".field-badge");
    const spec = d.specialty && badgeClass[d.specialty] ? d.specialty : "tyt";
    if (badge) {
      badge.className = "field-badge " + badgeClass[spec];
      badge.textContent = specialtyLabels[spec] || d.specialty || "";
    }
    const mail = tr.querySelector(".veli-name");
    const tel = tr.querySelector(".veli-tel");
    if (mail) mail.textContent = d.email || "";
    if (tel) tel.textContent = d.phone || "";
    const capCell = tr.querySelector(".student-sinif-cell");
    if (capCell) capCell.textContent = (d.capacity || "0") + " / " + (d.capacityMax || "0");
    const pill = tr.querySelector(".status-pill");
    if (pill && d.status) {
      const st = statusUi(d.status);
      pill.className = "status-pill " + st.cls;
      pill.textContent = st.text;
    }
    syncRowTooltips(tr);
  }

  function coachActionsSvg() {
    return (
      '<button type="button" class="js-coach-action" data-action="edit" aria-label="Düzenle">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>' +
      '<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
      "</svg></button>" +
      '<button type="button" class="js-coach-action" data-action="delete" aria-label="Sil">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>' +
      "</svg></button>" +
      '<button type="button" class="js-coach-action" data-action="view" aria-label="Görüntüle">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>' +
      '<circle cx="12" cy="12" r="3"/>' +
      "</svg></button>"
    );
  }

  function buildCoachRow(p) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-coach", "");
    applyPayloadToDataset(tr, p);

    const ini = initialsFromName(p.name);
    const specKey = p.specialty in badgeClass ? p.specialty : "tyt";
    const badge = badgeClass[specKey];
    const specLabel = specialtyLabels[specKey] || p.specialty;
    const st = statusUi(p.status);

    tr.innerHTML =
      '<td><div class="student-cell student-cell--rich">' +
      '<span class="student-avatar student-avatar--initials" aria-hidden="true">' +
      escapeHtml(ini) +
      "</span>" +
      '<div class="student-text">' +
      '<span class="student-name">' +
      escapeHtml(p.name) +
      "</span>" +
      '<span class="student-goal">' +
      escapeHtml(p.title) +
      "</span></div></div></td>" +
      '<td><span class="field-badge ' +
      escapeHtml(badge) +
      '">' +
      escapeHtml(specLabel) +
      "</span></td>" +
      '<td><div class="veli-cell">' +
      '<span class="veli-name">' +
      escapeHtml(p.email) +
      "</span>" +
      '<span class="veli-tel">' +
      escapeHtml(p.phone) +
      "</span></div></td>" +
      '<td><span class="student-sinif-cell">' +
      escapeHtml(p.capacity + " / " + p.capacityMax) +
      "</span></td>" +
      '<td><span class="status-pill ' +
      escapeHtml(st.cls) +
      '">' +
      escapeHtml(st.text) +
      "</span></td>" +
      '<td><div class="table-actions">' +
      coachActionsSvg() +
      "</div></td>";

    return tr;
  }

  if (btnAdd) {
    btnAdd.addEventListener("click", function () {
      openCoachForm("add");
    });
  }

  document.querySelectorAll("[data-close-coach-form]").forEach(function (b) {
    b.addEventListener("click", closeCoachForm);
  });

  document.querySelectorAll("[data-close-coach-view]").forEach(function (b) {
    b.addEventListener("click", closeCoachView);
  });

  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeCoachForm();
    });
  }

  if (modalViewOverlay) {
    modalViewOverlay.addEventListener("click", function (e) {
      if (e.target === modalViewOverlay) closeCoachView();
    });
  }

  if (btnViewEdit) {
    btnViewEdit.addEventListener("click", function () {
      const tr = viewCoachRowRef;
      if (!tr) return;
      closeCoachView();
      openCoachForm("edit", tr);
    });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const p = collectPayload();
      if (!p.name || !p.email || !p.phone || !p.title || !p.specialty) return;
      if (coachFormMode === "edit" && editingCoachRow) {
        applyPayloadToDataset(editingCoachRow, p);
        refreshRowFromDataset(editingCoachRow);
      } else {
        tbody.appendChild(buildCoachRow(p));
      }
      closeCoachForm();
      applyFilters();
    });
  }

  if (tbody) {
    tbody.addEventListener("click", function (e) {
      const btn = e.target.closest(".js-coach-action");
      if (!btn) return;
      const tr = btn.closest("tr[data-coach]");
      if (!tr) return;
      const action = btn.getAttribute("data-action");
      if (action === "view") openCoachView(tr);
      else if (action === "edit") openCoachForm("edit", tr);
      else if (action === "delete") {
        if (confirm('"' + (tr.dataset.name || "Koç") + '" kaydını silmek istiyor musunuz?')) {
          tr.remove();
          applyFilters();
        }
      }
    });
  }

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (specialtyFilter) specialtyFilter.addEventListener("change", applyFilters);

  applyFilters();
})();
