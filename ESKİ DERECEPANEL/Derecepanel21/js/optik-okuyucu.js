/**
 * Optik Okuyucu — Canlı Komuta Merkezi (HUD)
 *
 * Sorumluluklar:
 *  • Kamera cihazlarını enumerate eder, kullanıcıya seçtirir.
 *  • Seçilen kamerayı başlatır / durdurur (navigator.mediaDevices.getUserMedia).
 *  • FMT şablonlarını FmtStore üzerinden listeler.
 *  • "Fiziksel Cihaz (Web Serial)" ↔ "Canlı Kamera" modları arasında geçiş.
 *  • Web Serial üzerinden COM/USB cihazdan satır satır veri okur (chunk + line buffer).
 *  • Her okunan kağıt için sol panele paper-card ekler (Öğrenci, Kitapçık, Cevap özeti).
 *  • "Sisteme Kaydet" → localStorage.okutulan_deneme_gecici → okutulan-denemeler.html
 *
 * Not: Bu modülde mock/simülasyon veri yoktur. Fiziksel cihaz verisi satır satır
 * parseOpticalData() üzerinden live feed'e akar.
 */
(function () {
  "use strict";

  var STORAGE_TRANSFER = "okutulan_deneme_gecici";

  // ---------- DOM ----------
  var els = {};
  function $(id) { return document.getElementById(id); }

  function collect() {
    els.segSerial = $("omr-seg-serial");
    els.segCamera = $("omr-seg-camera");
    els.serialStage = $("omr-stage-serial");
    els.stageCamera = $("omr-stage-camera");
    els.cameraControls = $("cameraControls");
    els.video = $("omr-video-feed");
    els.placeholder = $("omr-stage-placeholder");
    els.recBadge = $("omr-rec-badge");
    els.camSelect = $("camera-selector");
    els.guide = $("omr-guide");
    els.flash = $("omr-flash");
    els.btnStart = $("omr-btn-start");
    els.btnStop = $("omr-btn-stop");
    els.serialConnectBtn = $("serialConnectBtn");
    els.serialStatusBadge = $("serialStatusBadge");
    els.serialLog = $("serialLog");
    els.fmtSelect = $("omr-fmt-select");
    els.threshold = $("omr-threshold");
    els.thresholdOut = $("omr-threshold-out");
    els.sensitivity = $("omr-sensitivity");
    els.sensitivityOut = $("omr-sensitivity-out");
    els.feedCount = $("omr-feed-count");
    els.feedEmpty = $("omr-feed-empty");
    els.feedList = $("omr-feed-list");
    els.btnSaveAll = $("omr-btn-save-all");
    els.btnClear = $("omr-btn-clear");
    els.lastTime = $("omr-last-time");
    els.stageStatus = $("omr-stage-status");
    els.toast = $("omr-toast");
  }

  // ---------- State ----------
  var state = {
    mode: "serial",          // "serial" | "camera"
    stream: null,
    devices: [],
    activeDeviceId: null,
    papers: [],              // okunan kağıtlar listesi
    threshold: 140,
    sensitivity: 45,
    fmt: null,
    fmts: [],
    serial: {
      port: null,
      reader: null,
      readableStreamClosed: null,
      isConnected: false,
      lineBuffer: "",
    },
  };

  // ---------- Yardımcılar ----------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function uid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      try { return crypto.randomUUID(); } catch (e) {}
    }
    return Date.now().toString(36) + "-" + Math.random().toString(36).substr(2, 8);
  }
  function setStageStatus(text, tone) {
    if (!els.stageStatus) return;
    els.stageStatus.innerHTML =
      '<span class="h-1.5 w-1.5 rounded-full ' +
      (tone === "ok" ? "bg-emerald-500" : tone === "warn" ? "bg-amber-500" : tone === "bad" ? "bg-rose-500" : "bg-slate-400") +
      '"></span>' + esc(text);
  }
  var toastTimer;
  function toast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.add("hidden"); }, 2400);
  }

  // ---------- Mod geçişi ----------
  function setMode(mode) {
    state.mode = mode;
    var serialActive = mode === "serial";

    if (els.segSerial) {
      els.segSerial.classList.toggle("is-active", serialActive);
      els.segSerial.setAttribute("aria-selected", serialActive ? "true" : "false");
    }
    els.segCamera.classList.toggle("is-active", !serialActive);
    els.segCamera.setAttribute("aria-selected", !serialActive ? "true" : "false");

    if (els.serialStage) els.serialStage.classList.toggle("hidden", !serialActive);
    els.stageCamera.classList.toggle("hidden", serialActive);
    if (els.cameraControls) {
      // Kritik izolasyon: Kamera kontrolleri yalnızca Canlı Kamera sekmesinde görünür.
      els.cameraControls.style.display = serialActive ? "none" : "";
    }

    if (serialActive) {
      stopCamera();
      setStageStatus(state.serial.isConnected ? "Cihaz bağlı · dinleniyor" : "Cihaz bekleniyor", state.serial.isConnected ? "ok" : "");
    } else {
      setStageStatus(state.stream ? "Canlı yayın · hazır" : "Kamera hazır", state.stream ? "ok" : "");
    }
  }

  // ---------- Web Serial ----------
  function setSerialBadge(connected) {
    if (!els.serialStatusBadge) return;
    if (connected) {
      els.serialStatusBadge.className =
        "inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700";
      els.serialStatusBadge.innerHTML = '<span class="h-2 w-2 rounded-full bg-emerald-500"></span>Bağlı ve Dinleniyor';
    } else {
      els.serialStatusBadge.className =
        "inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-extrabold text-rose-700";
      els.serialStatusBadge.innerHTML = '<span class="h-2 w-2 rounded-full bg-rose-500"></span>Bağlı Değil';
    }
  }

  function appendSerialLog(line) {
    if (!els.serialLog) return;
    els.serialLog.value += line + "\n";
    els.serialLog.scrollTop = els.serialLog.scrollHeight;
  }

  async function disconnectSerialDevice(silent) {
    try {
      if (state.serial.reader) {
        try { await state.serial.reader.cancel(); } catch (e) {}
        try { state.serial.reader.releaseLock(); } catch (e) {}
      }
    } finally {
      state.serial.reader = null;
    }

    try { await state.serial.readableStreamClosed; } catch (e) {}
    state.serial.readableStreamClosed = null;

    if (state.serial.port) {
      try { await state.serial.port.close(); } catch (e) {}
    }
    state.serial.port = null;
    state.serial.isConnected = false;
    state.serial.lineBuffer = "";
    setSerialBadge(false);
    if (!silent) toast("Cihaz bağlantısı kapatıldı.");
  }

  async function connectSerialDevice() {
    if (!("serial" in navigator)) {
      toast("Bu tarayıcı Web Serial API'yi desteklemiyor (Chrome/Edge gerekir).");
      setStageStatus("Web Serial desteklenmiyor", "bad");
      return;
    }
    if (state.serial.isConnected) return;

    try {
      setStageStatus("Cihaz seçiliyor...", "warn");
      var port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      state.serial.port = port;
      state.serial.isConnected = true;
      setSerialBadge(true);
      setStageStatus("Cihaz bağlı · dinleniyor", "ok");
      appendSerialLog("[CONNECTED] Port açıldı (9600).");

      var textDecoder = new TextDecoderStream();
      state.serial.readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      var reader = textDecoder.readable.getReader();
      state.serial.reader = reader;

      while (true) {
        var res = await reader.read();
        var value = res.value;
        var done = res.done;
        if (done) break;
        if (value) {
          state.serial.lineBuffer += value;
          var lines = state.serial.lineBuffer.split("\n");
          state.serial.lineBuffer = lines.pop(); // tamamlanmamış satır

          for (var i = 0; i < lines.length; i++) {
            var cleanLine = String(lines[i]).replace("\r", "").trim();
            if (cleanLine.length > 50) {
              appendSerialLog(cleanLine);
              parseOpticalData(cleanLine);
            }
          }
        }
      }
    } catch (err) {
      console.warn("[Serial] bağlantı hatası:", err);
      if (err && err.name === "NotFoundError") {
        toast("Cihaz seçilmedi.");
      } else {
        toast("Seri port hatası: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
      await disconnectSerialDevice(true);
      setStageStatus("Cihaz bağlantısı başarısız", "bad");
    }
  }

  // ---------- Veri ayrıştırma ----------
  function parseOpticalData(rawData) {
    // Sekonic/OMR cihazları farklı formatlar gönderebilir:
    //  - delimiter tabanlı: NO|NAME|BK|ANS   veya NO;NAME;BK;ANS
    //  - key=value: NO=... NAME=... BK=... ANS=...
    //  - fixed-width: [0..9]=no, [10..29]=name, [30]=booklet, [31..]=answers
    // Bu fonksiyon "mock" üretmez; satırdan çıkarabildiğini çıkarır.
    var line = String(rawData == null ? "" : rawData).replace(/\r/g, "").trim();
    if (!line) return;

    function pickAnswers(s) {
      // En uzun cevap bloğunu yakala (A-E / boş / yıldız vb.)
      // Örn: ABCD... veya A B C D ... ya da * işaretleri
      var m1 = s.match(/([ABCDEabcde0-5\*\-\?\. ]{20,})/);
      if (!m1) return "";
      return m1[1].replace(/\s+/g, "").toUpperCase();
    }

    function pickBooklet(s) {
      var mKey = s.match(/\b(?:BK|BOOKLET|KITAPCIK|KTP)\b\s*[:=]\s*([A-Da-d])\b/);
      if (mKey && mKey[1]) return mKey[1].toUpperCase();
      var mSolo = s.match(/\b([A-Da-d])\b/);
      if (mSolo && mSolo[1]) return mSolo[1].toUpperCase();
      return "";
    }

    function cleanName(s) {
      return String(s || "")
        .replace(/\s+/g, " ")
        .trim();
    }

    var studentNo = "";
    var fullName = "";
    var bookType = "";
    var answers = "";

    // (1) KEY=VALUE formatı
    if (/\b(?:NO|NUM|NUMBER)\b\s*[:=]/i.test(line) || /\bNAME\b\s*[:=]/i.test(line)) {
      var noM = line.match(/\b(?:NO|NUM|NUMBER)\b\s*[:=]\s*([0-9]{4,})\b/i);
      if (noM && noM[1]) studentNo = noM[1];

      var nameM = line.match(/\bNAME\b\s*[:=]\s*([^;|]+?)(?=\s+\b(?:BK|BOOKLET|KITAPCIK|KTP|ANS|ANSWER|CEVAP)\b\s*[:=]|$)/i);
      if (nameM && nameM[1]) fullName = cleanName(nameM[1]);

      var bkM = line.match(/\b(?:BK|BOOKLET|KITAPCIK|KTP)\b\s*[:=]\s*([A-Da-d])\b/i);
      if (bkM && bkM[1]) bookType = bkM[1].toUpperCase();

      var ansM = line.match(/\b(?:ANS|ANSWER|CEVAP)\b\s*[:=]\s*([A-Za-z0-9\*\-\?\. ]{10,})\b/i);
      if (ansM && ansM[1]) answers = ansM[1].replace(/\s+/g, "").toUpperCase();
      if (!answers) answers = pickAnswers(line);
    }

    // (2) delimiter tabanlı (| veya ;)
    if ((!studentNo && !fullName) && (line.indexOf("|") !== -1 || line.indexOf(";") !== -1)) {
      var delim = line.indexOf("|") !== -1 ? "|" : ";";
      var parts = line.split(delim).map(function (p) { return p.trim(); }).filter(Boolean);
      // Beklenen: [no, name, bk, answers] ama cihazlar ekstra kolon da ekleyebilir.
      if (parts.length >= 2) {
        // No: ilk sayısal kolon
        for (var i = 0; i < parts.length; i++) {
          if (/^[0-9]{4,}$/.test(parts[i])) { studentNo = parts[i]; break; }
        }
        // Name: ilk uzun metin kolon
        for (var j = 0; j < parts.length; j++) {
          if (parts[j] && !/^[0-9]{4,}$/.test(parts[j]) && parts[j].length >= 3) { fullName = cleanName(parts[j]); break; }
        }
        // Booklet: A-D tek harf kolon
        for (var k = 0; k < parts.length; k++) {
          if (/^[A-Da-d]$/.test(parts[k])) { bookType = parts[k].toUpperCase(); break; }
        }
        // Answers: en uzun cevap benzeri kolon
        var best = "";
        for (var t = 0; t < parts.length; t++) {
          var cand = pickAnswers(parts[t]);
          if (cand.length > best.length) best = cand;
        }
        answers = best || answers;
      }
    }

    // (3) fixed-width fallback (Sekonic benzeri)
    if (!studentNo && !fullName) {
      // Sabit kolon mantığı:
      //  - İlk 10 karakter: numara
      //  - Sonraki 20 karakter: isim
      //  - 30. karakter: kitapçık (A-D) olabilir
      //  - Kalan: cevaplar / ek alanlar
      studentNo = line.slice(0, 10).trim();
      fullName = cleanName(line.slice(10, 30));
      var bkChar = line.slice(30, 31).trim();
      if (/^[A-Da-d]$/.test(bkChar)) bookType = bkChar.toUpperCase();
      answers = pickAnswers(line.slice(31)) || pickAnswers(line);
    }

    // Son dokunuş: booklet/answers hâlâ boşsa satırdan yakala
    if (!bookType) bookType = pickBooklet(line) || "A";
    if (!answers) answers = pickAnswers(line);

    // Mantık: en azından numara veya isimden biri gelmeli
    if (!studentNo && !fullName) return;

    addPaper({
      fullName: fullName || "İsimsiz Aday",
      studentNo: studentNo || "",
      bookType: bookType || "A",
      answers: answers || "",
    });
  }

  // ---------- Kamera cihazları ----------
  async function getCameras() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
    try {
      var devices = await navigator.mediaDevices.enumerateDevices();
      var videoDevices = devices.filter(function (d) { return d.kind === "videoinput"; });
      state.devices = videoDevices;

      if (!els.camSelect) return videoDevices;
      els.camSelect.innerHTML = "";
      if (!videoDevices.length) {
        var opt = document.createElement("option");
        opt.textContent = "Kamera bulunamadı";
        opt.disabled = true;
        els.camSelect.appendChild(opt);
        els.camSelect.classList.remove("hidden");
        return videoDevices;
      }
      videoDevices.forEach(function (cam, i) {
        var o = document.createElement("option");
        o.value = cam.deviceId;
        o.text = cam.label || ("Kamera " + (i + 1));
        els.camSelect.appendChild(o);
      });
      els.camSelect.classList.remove("hidden");
      return videoDevices;
    } catch (err) {
      console.warn("enumerateDevices hata:", err);
      return [];
    }
  }

  // ---------- Kamerayı başlat/durdur ----------
  async function startCamera(deviceId) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast("Bu tarayıcı kamera erişimini desteklemiyor.");
      setStageStatus("Kamera desteklenmiyor", "bad");
      return;
    }
    // Eğer farklı bir akış varsa önce kapat
    stopCamera(true);

    var constraints = {
      audio: false,
      video: deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
    };
    try {
      setStageStatus("Kamera açılıyor...", "warn");
      var stream = await navigator.mediaDevices.getUserMedia(constraints);
      state.stream = stream;
      state.activeDeviceId = deviceId || null;
      els.video.srcObject = stream;
      try { await els.video.play(); } catch (e) {}

      els.placeholder.classList.add("hidden");
      els.recBadge.classList.remove("hidden");
      els.guide.classList.remove("hidden");
      els.btnStop.disabled = false;
      els.btnStart.textContent = "Yeniden Başlat";
      setStageStatus("Canlı yayın · hazır", "ok");

      // İlk izin alındıktan sonra cihaz adları dolar — tekrar doldur
      if (!state.devices.length || !state.devices[0].label) {
        await getCameras();
        if (state.activeDeviceId && els.camSelect) {
          els.camSelect.value = state.activeDeviceId;
        }
      }
    } catch (err) {
      console.warn("getUserMedia hata:", err);
      setStageStatus("Kamera açılamadı", "bad");
      if (err && err.name === "NotAllowedError") {
        toast("Kamera izni reddedildi. Tarayıcı adres çubuğundan izni açın.");
      } else if (err && err.name === "NotFoundError") {
        toast("Bu cihazda kamera bulunamadı.");
      } else {
        toast("Kamera açılamadı: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
    }
  }

  function stopCamera(silent) {
    if (state.stream) {
      try {
        state.stream.getTracks().forEach(function (t) { t.stop(); });
      } catch (e) {}
      state.stream = null;
    }
    if (els.video) {
      try { els.video.pause(); } catch (e) {}
      els.video.srcObject = null;
    }
    if (!silent) {
      if (els.placeholder) els.placeholder.classList.remove("hidden");
      if (els.recBadge) els.recBadge.classList.add("hidden");
      if (els.guide) els.guide.classList.add("hidden");
      if (els.btnStop) els.btnStop.disabled = true;
      if (els.btnStart) els.btnStart.textContent = "Kamerayı Başlat";
      setStageStatus("Hazırlanıyor", "");
    }
  }

  // ---------- Okunan kağıtlar (live feed) ----------
  /**
   * Yeni bir kağıt (öğrenci okuma sonucu) ekler.
   * @param {{id?:string, fullName:string, studentNo?:string, bookType?:string, answers?:string, imageDataUrl?:string}} paper
   */
  function addPaper(paper) {
    var now = new Date();
    var p = {
      id: paper.id || uid(),
      fullName: paper.fullName || "İsimsiz Aday",
      studentNo: paper.studentNo || "",
      bookType: paper.bookType || "A",
      answers: paper.answers || "",
      imageDataUrl: paper.imageDataUrl || "",
      readAt: now.toISOString(),
    };
    state.papers.unshift(p);
    renderFeed();
    els.lastTime.textContent = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    flashCamera();
  }

  function flashCamera() {
    if (!els.flash) return;
    els.flash.classList.remove("is-active");
    // reflow
    void els.flash.offsetWidth;
    els.flash.classList.add("is-active");
  }

  function renderFeed() {
    var n = state.papers.length;
    els.feedCount.textContent = String(n);
    els.btnSaveAll.disabled = n === 0;
    els.btnClear.disabled = n === 0;
    if (n === 0) {
      els.feedEmpty.classList.remove("hidden");
      els.feedList.innerHTML = "";
      return;
    }
    els.feedEmpty.classList.add("hidden");

    var html = state.papers.map(function (p) {
      var shortAns = (p.answers || "").substr(0, 20).split("");
      var ansHtml = shortAns.length
        ? shortAns.map(function (ch) { return '<span class="paper-card__ans">' + esc(ch) + "</span>"; }).join("") +
          (p.answers.length > shortAns.length ? '<span class="paper-card__ans">…</span>' : "")
        : '<span class="text-[11px] italic text-slate-400">Cevap verisi yok</span>';

      var readTime = "";
      try { readTime = new Date(p.readAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }); } catch (e) {}

      return (
        '<div class="paper-card" data-id="' + esc(p.id) + '">' +
          '<button class="paper-card__del" data-role="del" aria-label="Kaldır" title="Listeden kaldır">' +
            '<svg class="h-3.5 w-3.5 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>' +
          "</button>" +
          '<div class="flex items-center justify-between gap-2 pr-6">' +
            '<div class="flex items-center gap-2">' +
              '<span class="paper-card__ok"><svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12l5 5L20 7"/></svg> Başarılı</span>' +
              '<span class="paper-card__book">' + esc(p.bookType || "?") + "</span>" +
            "</div>" +
            '<span class="text-[10px] font-semibold text-slate-400">' + esc(readTime) + "</span>" +
          "</div>" +
          '<div class="flex flex-col">' +
            '<span class="text-sm font-bold leading-tight">' + esc(p.fullName) + "</span>" +
            (p.studentNo
              ? '<span class="text-[11px] font-semibold text-slate-500">No: ' + esc(p.studentNo) + "</span>"
              : "") +
          "</div>" +
          '<div class="paper-card__answers">' + ansHtml + "</div>" +
        "</div>"
      );
    }).join("");

    els.feedList.innerHTML = html;
  }

  // ---------- Kaydet ve yönlendir ----------
  function saveAndGo() {
    if (!state.papers.length) return;
    var payload = {
      savedAt: new Date().toISOString(),
      fmt: state.fmt ? { id: state.fmt.id, label: state.fmt.label } : null,
      papers: state.papers.map(function (p) {
        return {
          id: p.id,
          fullName: p.fullName,
          studentNo: p.studentNo,
          bookType: p.bookType,
          answers: p.answers,
          readAt: p.readAt,
        };
      }),
    };
    try {
      localStorage.setItem(STORAGE_TRANSFER, JSON.stringify(payload));
    } catch (err) {
      toast("Aktarım başarısız — depolama dolu olabilir.");
      return;
    }
    window.location.href = "okutulan-denemeler.html";
  }

  // ---------- FMT Store ----------
  // Tek Hakikat Kaynağı: Yalnızca merkezi FmtStore (IndexedDB) üzerinden
  // listeler. Hiçbir hardcoded / mock şablon yoktur.
  async function populateFmts() {
    if (!els.fmtSelect) return;
    els.fmtSelect.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = ""; ph.disabled = true; ph.selected = true;

    if (!window.FmtStore) {
      ph.textContent = "(FmtStore yüklenemedi)";
      els.fmtSelect.appendChild(ph);
      els.fmtSelect.disabled = true;
      return;
    }
    try {
      var list = await window.FmtStore.listAll();
      state.fmts = Array.isArray(list) ? list : [];
      if (!state.fmts.length) {
        ph.textContent = "— Şablon seçin —";
        els.fmtSelect.appendChild(ph);
        var info = document.createElement("option");
        info.value = ""; info.disabled = true;
        info.textContent = "Sistemde kayıtlı FMT şablonu bulunamadı";
        els.fmtSelect.appendChild(info);
        els.fmtSelect.disabled = false;
        return;
      }
      ph.textContent = "— Şablon seçin —";
      els.fmtSelect.appendChild(ph);
      state.fmts.forEach(function (f) {
        var o = document.createElement("option");
        o.value = f.id;
        o.textContent = f.label || f.id;
        els.fmtSelect.appendChild(o);
      });
      els.fmtSelect.disabled = false;
    } catch (err) {
      console.warn("[Optik Okuyucu] FMT liste hatası:", err);
      ph.textContent = "— Şablon seçin —";
      els.fmtSelect.appendChild(ph);
    }
  }

  // ---------- Wire ----------
  function wire() {
    if (els.segSerial) els.segSerial.addEventListener("click", function () { setMode("serial"); });
    els.segCamera.addEventListener("click", function () { setMode("camera"); });

    els.btnStart.addEventListener("click", function () {
      startCamera(state.activeDeviceId || (els.camSelect && els.camSelect.value) || null);
    });
    els.btnStop.addEventListener("click", function () { stopCamera(); });
    els.camSelect.addEventListener("change", function (e) {
      var id = e.target.value;
      state.activeDeviceId = id;
      if (state.stream) startCamera(id); // aktifse değiştir
    });

    if (els.serialConnectBtn) {
      els.serialConnectBtn.addEventListener("click", function () {
        setMode("serial");
        connectSerialDevice();
      });
    }

    els.feedList.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest('[data-role="del"]');
      if (!btn) return;
      var card = btn.closest(".paper-card");
      if (!card) return;
      var id = card.getAttribute("data-id");
      state.papers = state.papers.filter(function (p) { return p.id !== id; });
      renderFeed();
    });

    els.btnSaveAll.addEventListener("click", saveAndGo);
    els.btnClear.addEventListener("click", function () {
      if (!state.papers.length) return;
      if (!window.confirm("Listeyi temizlemek istediğinize emin misiniz?")) return;
      state.papers = [];
      renderFeed();
    });

    els.threshold.addEventListener("input", function () {
      state.threshold = parseInt(els.threshold.value, 10) || 140;
      els.thresholdOut.textContent = String(state.threshold);
    });
    els.sensitivity.addEventListener("input", function () {
      state.sensitivity = parseInt(els.sensitivity.value, 10) || 45;
      els.sensitivityOut.textContent = String(state.sensitivity);
    });

    els.fmtSelect.addEventListener("change", async function () {
      var id = els.fmtSelect.value;
      if (!id || !window.FmtStore) { state.fmt = null; return; }
      try { state.fmt = await window.FmtStore.get(id); }
      catch (e) { state.fmt = null; }
    });

    // FMT store değişirse listeyi tazele
    window.addEventListener("fmt-store:change", function () { populateFmts(); });

    // Sayfadan ayrılırken kamerayı kapat
    window.addEventListener("beforeunload", function () {
      stopCamera(true);
      disconnectSerialDevice(true);
    });
  }

  // ---------- Boot ----------
  function boot() {
    collect();
    wire();
    setStageStatus("Hazırlanıyor", "");
    setSerialBadge(false);
    // Kamera cihazlarını ilk enum (label olmayabilir; izin verilince tekrar dolar)
    getCameras();
    populateFmts();
    setMode("serial");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
