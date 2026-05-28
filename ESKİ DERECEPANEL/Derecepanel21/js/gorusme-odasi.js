/**
 * Strateji Merkezi — Görüşme Odası (gorusme-odasi.html): ferah UI, Web Speech modülü,
 * zengin not + otomatik kayıt (derece_v2_notes_*), etiket ve arşiv notesRich.
 * Strateji Merkezi (Görüşme Odası / Dijital Kampüs) — oturum, ruh hali, ajanda,
 * atlas kıyaslama, sesli not, görev aktarımı, WhatsApp özeti; Jitsi pop-up + aktif görünüm senkron mock.
 */
(function () {
  "use strict";

  var PFX = "dp_v2_session_";
  var KEY_AGENDA = PFX + "agenda_";
  var KEY_MR_FEED = PFX + "mr_feed_v1";
  var KEY_MEETING_OPEN = PFX + "current_meeting_id";
  var LEGACY_NOT_PREFIX = "gorusme_notlari_";

  var LS_STUDENTS_FULL = "derecepanel_students_full_v1";
  var LS_WEEKLY = "derecepanel-weekly-programs-v1";
  var DEBOUNCE_PARA_MS = 400;
  var TIMER_DEFAULT_MS = 40 * 60 * 1000;
  var TIMER_STEP_MS = 5 * 60 * 1000;
  var TIMER_MIN_TOTAL_MS = 5 * 60 * 1000;
  var TIMER_MAX_TOTAL_MS = 240 * 60 * 1000;
  var SESSION_HANDOFF = "aktarilanOgrenci";
  var TRANSFER_GOREV = "transfer_gorev";
  var LS_ACTIVE_VIEW_SYNC = "active_view_sync";
  /** Koç tarafından kaydedilen görüşme özetleri (Yeni Görüşme → Kaydet ve Bitir) */
  var LS_GORUSME_ARSIV = "derece_gorusme_arsivi";
  /** Arşivden görüşme odasına düzenleme köprüsü (sessionStorage) */
  var SESSION_EDIT_MEETING = "edit_meeting_id";

  var MOODS = [
    { id: "anxious", label: "Kaygılı", emoji: "😟" },
    { id: "neutral", label: "Nötr", emoji: "😐" },
    { id: "focused", label: "Odaklanmış", emoji: "🎯" },
    { id: "motivated", label: "Motive", emoji: "🔥" },
    { id: "exhausted", label: "Bitkin", emoji: "😮‍💨" },
  ];

  /** Mood pill — seçili durumda JS ile eklenen sınıflar */
  var MOOD_BTN_BASE_CLASS =
    "go-mood-btn inline-flex min-w-[4.25rem] flex-col items-center gap-1 rounded-full border border-transparent bg-transparent px-4 py-2.5 text-[10px] font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/90 sm:min-w-[5rem] sm:px-5 sm:py-3 sm:text-[11px]";
  var MOOD_BTN_SELECTED_CLASS =
    "ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-sm shadow-blue-500/15 bg-blue-50/80 dark:ring-offset-slate-900 dark:bg-blue-950/40 dark:shadow-blue-500/20";

  var AGENDA_ITEMS = [
    { id: "odev", label: "1. Ödev Kontrolü" },
    { id: "deneme", label: "2. Deneme Analizi" },
    { id: "motivasyon", label: "3. Motivasyon Görüşmesi" },
    { id: "program", label: "4. Yeni Program" },
  ];

  var elComboRoot = document.getElementById("go-ogrenci-combo");
  var elOgrenci = document.getElementById("go-inp-ogrenci");
  var elPopover = document.getElementById("go-ogrenci-popover");
  var elListbox = document.getElementById("go-ogrenci-listbox");
  var elToggle = document.getElementById("go-ogrenci-toggle");
  var elChevron = elToggle ? elToggle.querySelector("svg") : null;

  var elBtnStart = document.getElementById("go-btn-start");
  var elBtnPause = document.getElementById("go-btn-pause");
  var elBtnReset = document.getElementById("go-btn-reset");
  var elBtnEnd = document.getElementById("go-btn-end");
  var elBtnSaveArchive = document.getElementById("go-btn-save-archive");
  var elTimerRing = document.getElementById("go-timer-ring");
  var elTimerText = document.getElementById("go-timer-text");
  var elTimerLabel = document.getElementById("go-timer-label");
  var elTimerFoot = document.getElementById("go-timer-foot");
  var elBtnTimerPlus = document.getElementById("go-btn-timer-plus");
  var elBtnTimerMinus = document.getElementById("go-btn-timer-minus");

  var elNotes = document.getElementById("session_notes");
  var elNoteCategory = document.getElementById("session_note_category");
  var elSaveDot = document.getElementById("go-save-indicator");
  var elMic = document.getElementById("start_speech");
  var elSpeechCluster = document.getElementById("go-speech-mic-cluster");
  var elSpeechWaves = document.getElementById("go-speech-waves");
  var elSpeechStatus = document.getElementById("go-speech-status");
  var elParaBox = document.getElementById("go-para-actions");
  var elMoodBar = document.getElementById("go-mood-bar");

  var elCardGoal = document.getElementById("go-card-goal");
  var elCardNet = document.getElementById("go-card-net");
  var elCardAlan = document.getElementById("go-card-alan");
  var elTrialsPreview = document.getElementById("go-trials-preview");
  var elProgPreview = document.getElementById("go-program-preview");
  var elGapPanel = document.getElementById("go-gap-panel");
  var elMeetingHeadline = document.getElementById("go-meeting-headline");
  var elDmSelect = document.getElementById("go-dm-select");
  var elDmSubjectsHost = document.getElementById("go-dm-subjects-host");
  var elDmHint = document.getElementById("go-dm-hint");
  var elAgendaList = document.getElementById("go-agenda-list");
  var elAgendaBar = document.getElementById("go-agenda-bar");
  var elAgendaPct = document.getElementById("go-agenda-pct");

  var elModalTrials = document.getElementById("go-modal-trials");
  var elModalTrialsBody = document.getElementById("go-modal-trials-body");
  var elModalProg = document.getElementById("go-modal-program");
  var elModalProgBody = document.getElementById("go-modal-program-body");
  var elModalSummary = document.getElementById("go-modal-summary");
  var elSummaryText = document.getElementById("go-summary-text");
  var elSummaryClose = document.getElementById("go-modal-summary-close");
  var elSummaryCopy = document.getElementById("go-summary-copy");
  var elSummaryWa = document.getElementById("go-summary-wa");
  var elSummaryFinish = document.getElementById("go-summary-finish");

  var elBtnRecete = document.getElementById("go-btn-recete");
  var elBtnKaynak = document.getElementById("go-btn-kaynak");
  var elBtnReceteFooter = document.getElementById("go-btn-recete-footer");
  var elBtnKaynakFooter = document.getElementById("go-btn-kaynak-footer");
  var elBtnSaveFooter = document.getElementById("go-btn-save-footer");

  var elBtnVideoStart = document.getElementById("go-btn-video-start");
  var elBtnVideoStartLabel = document.getElementById("go-btn-video-start-label");
  var elBtnCopyMeetLink = document.getElementById("go-btn-copy-meet-link");

  function notesPlain() {
    if (!elNotes) return "";
    return String(elNotes.innerText || "")
      .replace(/\u00a0/g, " ")
      .trim();
  }

  function notesHtmlSnapshot() {
    if (!elNotes) return "";
    return String(elNotes.innerHTML || "");
  }

  function setNotesContent(html) {
    if (!elNotes) return;
    elNotes.innerHTML = html || "";
  }

  function v2TabSessionId() {
    try {
      var k = "derece_v2_tab_meeting_sid";
      var s = sessionStorage.getItem(k);
      if (!s) {
        s = "tab_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem(k, s);
      }
      return s;
    } catch (e) {
      return "tab_fallback";
    }
  }

  function v2NotesLsKey() {
    if (!selectedCatalogId) return "";
    var sess = String(activeMeetingId || "").trim() || v2TabSessionId();
    return "derece_v2_notes_" + String(selectedCatalogId).trim() + "_" + sess;
  }

  var v2NotesDebounceTimer = null;

  function scheduleV2NotesAutosave() {
    clearTimeout(v2NotesDebounceTimer);
    v2NotesDebounceTimer = setTimeout(persistV2NotesDraft, 300);
  }

  function persistV2NotesDraft() {
    if (!selectedCatalogId || !elNotes) return;
    try {
      var payload = {
        html: notesHtmlSnapshot(),
        category: elNoteCategory ? String(elNoteCategory.value || "") : "",
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(v2NotesLsKey(), JSON.stringify(payload));
      flashSaved();
    } catch (e) {}
  }

  function loadV2NotesFromStorage() {
    if (!elNotes || !selectedCatalogId) return;
    try {
      var raw = localStorage.getItem(v2NotesLsKey());
      if (!raw) {
        setNotesContent("");
        if (elNoteCategory) elNoteCategory.value = "";
        scheduleParaRender();
        return;
      }
      var o = JSON.parse(raw);
      if (o && typeof o.html === "string") {
        setNotesContent(o.html);
        if (elNoteCategory && o.category != null) elNoteCategory.value = String(o.category);
      } else {
        setNotesContent("");
      }
    } catch (e) {
      setNotesContent("");
    }
    scheduleParaRender();
  }

  function wireRichNotesToolbar() {
    function run(cmd) {
      try {
        elNotes.focus();
        document.execCommand(cmd, false, null);
      } catch (e) {}
      scheduleV2NotesAutosave();
      scheduleParaRender();
    }
    var bBold = document.getElementById("session_notes_bold");
    var bItalic = document.getElementById("session_notes_italic");
    var bUnder = document.getElementById("session_notes_underline");
    if (bBold) bBold.addEventListener("click", function () { run("bold"); });
    if (bItalic) bItalic.addEventListener("click", function () { run("italic"); });
    if (bUnder) bUnder.addEventListener("click", function () { run("underline"); });
  }

  function appendSpeechChunkToNotes(chunk) {
    commitSpeechFinalToNotes(chunk);
  }

  /** Mikrofon açıkken anlık tahmin metni (kesinleşmemiş) */
  function ensureSpeechLiveAnchor() {
    if (!elNotes) return;
    try {
      elNotes.focus();
      if (elNotes.querySelector('[data-go-speech-interim="1"]')) return;
      var p = elNotes.lastElementChild;
      if (!p || String(p.tagName || "").toUpperCase() !== "P") {
        p = document.createElement("p");
        elNotes.appendChild(p);
      }
      var span = document.createElement("span");
      span.setAttribute("data-go-speech-interim", "1");
      span.className = "go-speech-interim";
      span.setAttribute("aria-live", "polite");
      p.appendChild(span);
    } catch (e) {}
  }

  function updateSpeechInterimVisual(interim) {
    if (!elNotes) return;
    try {
      var span = elNotes.querySelector('[data-go-speech-interim="1"]');
      if (!span) ensureSpeechLiveAnchor();
      span = elNotes.querySelector('[data-go-speech-interim="1"]');
      if (span) span.textContent = interim == null ? "" : String(interim);
    } catch (e2) {}
  }

  /** Kesinleşen segmenti paragrafa işler; bir sonraki ara sonuç için boş span bırakır */
  function commitSpeechFinalToNotes(chunk) {
    if (!selectedCatalogId) {
      showToast("Sesli not için önce öğrenci seçin.", true);
      return;
    }
    if (!elNotes || chunk == null || chunk === "") return;
    var t = String(chunk).trim();
    if (!t) return;
    try {
      elNotes.focus();
      var span = elNotes.querySelector('[data-go-speech-interim="1"]');
      var p;
      if (span && span.parentNode) {
        p = span.parentNode;
        span.parentNode.removeChild(span);
      } else {
        p = elNotes.lastElementChild;
        if (!p || String(p.tagName || "").toUpperCase() !== "P") {
          p = document.createElement("p");
          elNotes.appendChild(p);
        }
      }
      var tail = p.lastChild;
      if (tail && tail.nodeType === 3) {
        var cur = tail.textContent || "";
        var gap = cur.length && !/\s$/.test(cur) ? " " : "";
        tail.textContent = cur + gap + t;
      } else {
        p.appendChild(document.createTextNode(t));
      }
      var nextSpan = document.createElement("span");
      nextSpan.setAttribute("data-go-speech-interim", "1");
      nextSpan.className = "go-speech-interim";
      nextSpan.setAttribute("aria-live", "polite");
      p.appendChild(nextSpan);
    } catch (e3) {}
    scheduleV2NotesAutosave();
    scheduleParaRender();
  }

  /** Diktasyon durunca ara metni ya düşür ya da düz metne çevir */
  function cleanupSpeechInterimOnStop() {
    if (!elNotes) return;
    try {
      var span = elNotes.querySelector('[data-go-speech-interim="1"]');
      if (!span || !span.parentNode) return;
      var txt = String(span.textContent || "").trim();
      var p = span.parentNode;
      span.parentNode.removeChild(span);
      if (txt) {
        var tail = p.lastChild;
        if (tail && tail.nodeType === 3) {
          var cur = tail.textContent || "";
          var gap = cur.length && !/\s$/.test(cur) ? " " : "";
          tail.textContent = cur + gap + txt;
        } else {
          p.appendChild(document.createTextNode(txt));
        }
      }
      if (
        p &&
        String(p.tagName || "").toUpperCase() === "P" &&
        !String(p.textContent || "").trim() &&
        p.children.length === 0
      ) {
        p.remove();
      }
    } catch (e4) {}
    scheduleV2NotesAutosave();
    scheduleParaRender();
  }

  if (!elOgrenci || !elNotes || !elBtnStart) return;

  var catalogRows = [];
  var selectedCatalogId = "";
  var selectedLabel = "";
  var paraDebounceTimer = null;
  var timerTotalMs = TIMER_DEFAULT_MS;
  var timerRemainingMs = TIMER_DEFAULT_MS;
  var timerInterval = null;
  var timerRunning = false;

  var activeMeetingId = "";
  var selectedMood = null;
  var atlasRows = null;
  var atlasLoadPromise = null;
  var speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  /** onstart gecikirse “Bağlanıyor…” takılmasın; zaman aşımında sıfırlanır */
  var speechAwaitingStart = false;
  var speechConnectTimer = null;

  var jitsiPopupRef = null;
  var jitsiPollTimer = null;
  var lastMeetPublicUrl = "";
  var videoSessionActive = false;
  /** examId → { name, type } katalog önbelleği; takvim verisi güncellenince sıfırlanır */
  var __goExamIdDetailsMap = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showToast(msg, isErr) {
    var el = document.getElementById("go-toast");
    if (!el || !msg) return;
    el.textContent = msg;
    el.classList.remove("go-toast--error", "go-toast--success", "go-toast--hidden");
    el.classList.add(isErr ? "go-toast--error" : "go-toast--success");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      el.classList.add("go-toast--hidden");
    }, 3200);
  }

  /** Dijital Kampüs V2.1 — öğrenci paneline taşınacak görünüm mock’u */
  function updateSyncView(moduleName) {
    try {
      var payload = {
        module: String(moduleName == null ? "" : moduleName),
        updatedAt: new Date().toISOString(),
        studentId: String(selectedCatalogId || ""),
        studentLabel: String(selectedLabel || ""),
        meetingId: String(activeMeetingId || ""),
        sourcePage: "gorusme_odasi",
        v: 1,
      };
      localStorage.setItem(LS_ACTIVE_VIEW_SYNC, JSON.stringify(payload));
      return true;
    } catch (e) {
      try {
        console.warn("[gorusme-odasi] active_view_sync", e);
      } catch (e2) {}
      return false;
    }
  }
  window.updateSyncView = updateSyncView;

  function jitsiSafeStudentToken(id) {
    var s = String(id || "").trim();
    if (!s) return "ogrenci";
    var t = s.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
    return t || "ogrenci";
  }

  function buildJitsiRoomName(studentId) {
    return "derecepanel_room_" + jitsiSafeStudentToken(studentId);
  }

  function buildMeetPublicJoinUrl(roomName) {
    return "https://meet.jit.si/" + encodeURIComponent(roomName);
  }

  function clearJitsiPoll() {
    if (jitsiPollTimer) {
      clearInterval(jitsiPollTimer);
      jitsiPollTimer = null;
    }
  }

  function setVideoButtonIdle() {
    if (!elBtnVideoStart || !elBtnVideoStartLabel) return;
    elBtnVideoStartLabel.textContent = "Görüntülü Görüşme Başlat";
    elBtnVideoStart.classList.remove("go-btn-video--live");
  }

  function setVideoButtonLive() {
    if (!elBtnVideoStart || !elBtnVideoStartLabel) return;
    elBtnVideoStartLabel.textContent = "Görüşme Devam Ediyor…";
    elBtnVideoStart.classList.add("go-btn-video--live");
  }

  function resetVideoSessionUi() {
    clearJitsiPoll();
    jitsiPopupRef = null;
    videoSessionActive = false;
    lastMeetPublicUrl = "";
    setVideoButtonIdle();
    if (elBtnCopyMeetLink) elBtnCopyMeetLink.style.display = "none";
    if (elBtnVideoStart) elBtnVideoStart.disabled = !selectedCatalogId;
  }

  function copyMeetInviteLink() {
    try {
      var text = lastMeetPublicUrl;
      if (!text && selectedCatalogId) text = buildMeetPublicJoinUrl(buildJitsiRoomName(selectedCatalogId));
      if (!text || !selectedCatalogId) {
        showToast("Önce görüntülü görüşmeyi başlatın ve öğrenci seçili olsun.", true);
        return;
      }
      var done = function () {
        showToast("Görüşme linki panoya kopyalandı.");
      };
      var fail = function () {
        showToast("Panoya yazılamadı; linki elle kopyalayın.", true);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          try {
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.left = "-9999px";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            done();
          } catch (e2) {
            fail();
          }
        });
      } else {
        try {
          var ta2 = document.createElement("textarea");
          ta2.value = text;
          ta2.setAttribute("readonly", "");
          ta2.style.position = "fixed";
          ta2.style.left = "-9999px";
          document.body.appendChild(ta2);
          ta2.select();
          document.execCommand("copy");
          document.body.removeChild(ta2);
          done();
        } catch (e3) {
          fail();
        }
      }
    } catch (err) {
      showToast("Link kopyalanamadı.", true);
    }
  }

  function openJitsiCoachPopup() {
    try {
      if (!selectedCatalogId) {
        showToast("Önce öğrenci seçin.", true);
        return;
      }
      if (jitsiPopupRef) {
        try {
          if (!jitsiPopupRef.closed) {
            jitsiPopupRef.focus();
            showToast("Görüntülü görüşme penceresi zaten açık; öne getirildi.");
            return;
          }
        } catch (eFocus) {}
      }

      var room = buildJitsiRoomName(selectedCatalogId);
      lastMeetPublicUrl = buildMeetPublicJoinUrl(room);

      var popUrl = new URL("jitsi-gorusme-popup.html", window.location.href);
      popUrl.searchParams.set("room", room);
      var coachName = "Derecepanel Koç";
      try {
        var prof = document.getElementById("headerProfileName");
        if (prof && prof.textContent && String(prof.textContent).trim()) coachName = String(prof.textContent).trim().slice(0, 80);
      } catch (eName) {}
      popUrl.searchParams.set("displayName", encodeURIComponent(coachName));

      var w = 400;
      var h = 600;
      var left = Math.max(0, window.screenX + (window.outerWidth - w) / 2);
      var top = Math.max(0, window.screenY + (window.outerHeight - h) / 2);
      var feat =
        "popup=yes,width=" +
        w +
        ",height=" +
        h +
        ",left=" +
        left +
        ",top=" +
        top +
        ",resizable=yes,scrollbars=yes";

      var win = window.open(popUrl.toString(), "dp_jitsi_" + room, feat);

      var blocked = !win;
      if (!blocked) {
        try {
          blocked = typeof win.closed === "undefined";
        } catch (eC) {
          blocked = true;
        }
      }

      if (blocked) {
        lastMeetPublicUrl = "";
        showToast(
          "Tarayıcı pop-up penceresini engelledi. Adres çubuğundaki simgeden bu site için pop-up’a izin verin ve tekrar «Görüntülü Görüşme Başlat»a basın.",
          true
        );
        return;
      }

      jitsiPopupRef = win;
      videoSessionActive = true;
      setVideoButtonLive();
      if (elBtnCopyMeetLink) elBtnCopyMeetLink.style.display = "inline-flex";
      updateSyncView("Dijital Kampüs · Görüntülü görüşme");
      showToast("Görüntülü oda açıldı. Öğrenci için bağlantıyı «Görüşme Linkini Kopyala» ile paylaşın.");

      clearJitsiPoll();
      jitsiPollTimer = setInterval(function () {
        try {
          if (!jitsiPopupRef || jitsiPopupRef.closed) {
            resetVideoSessionUi();
            showToast("Görüntülü görüşme penceresi kapandı.");
          }
        } catch (ePoll) {
          resetVideoSessionUi();
        }
      }, 900);
    } catch (err) {
      lastMeetPublicUrl = "";
      showToast("Görüntülü görüşme başlatılamadı.", true);
    }
  }

  function wireDigitalCampus() {
    if (elBtnVideoStart) elBtnVideoStart.addEventListener("click", openJitsiCoachPopup);
    if (elBtnCopyMeetLink) elBtnCopyMeetLink.addEventListener("click", copyMeetInviteLink);
    window.addEventListener("beforeunload", clearJitsiPoll);
  }

  function genMeetingId() {
    try {
      if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    } catch (e) {}
    return "mt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      showToast("Yerel kayıt yazılamadı (depolama dolu olabilir).", true);
      return false;
    }
  }

  function ensureMeetingSession() {
    if (activeMeetingId) return activeMeetingId;
    var sid = String(selectedCatalogId || "").trim();
    if (sid) {
      try {
        localStorage.removeItem(agendaDraftStorageKey(sid));
      } catch (eAd) {}
    }
    var tabDraftKey =
      selectedCatalogId && String(selectedCatalogId).trim()
        ? "derece_v2_notes_" + String(selectedCatalogId).trim() + "_" + v2TabSessionId()
        : "";
    activeMeetingId = genMeetingId();
    try {
      localStorage.setItem(KEY_MEETING_OPEN, activeMeetingId);
      writeJson(PFX + activeMeetingId + "_meta", {
        studentId: selectedCatalogId,
        studentLabel: selectedLabel,
        startedAt: new Date().toISOString(),
        v: 2,
      });
    } catch (e) {}
    if (tabDraftKey && selectedCatalogId) {
      try {
        var meetKey =
          "derece_v2_notes_" + String(selectedCatalogId).trim() + "_" + String(activeMeetingId).trim();
        var rawDraft = localStorage.getItem(tabDraftKey);
        if (rawDraft && !localStorage.getItem(meetKey)) {
          localStorage.setItem(meetKey, rawDraft);
          localStorage.removeItem(tabDraftKey);
        }
      } catch (eM) {}
    }
    return activeMeetingId;
  }

  function finishMeetingSession() {
    var sid = String(selectedCatalogId || "").trim();
    var mid = String(activeMeetingId || "").trim();
    try {
      if (mid) {
        var meta = readJson(PFX + mid + "_meta", {});
        meta.endedAt = new Date().toISOString();
        writeJson(PFX + mid + "_meta", meta);
      }
    } catch (e) {}
    try {
      if (sid && mid) {
        localStorage.removeItem(KEY_AGENDA + sid + "_" + mid);
      }
      if (sid) {
        localStorage.removeItem(agendaDraftStorageKey(sid));
        try {
          localStorage.removeItem(KEY_AGENDA + sid);
        } catch (eLeg) {}
      }
    } catch (eRm) {}
    activeMeetingId = "";
    try {
      localStorage.removeItem(KEY_MEETING_OPEN);
    } catch (e2) {}
    try {
      renderAgenda();
    } catch (eAg) {}
  }

  function moodStorageKey() {
    if (!activeMeetingId) return "";
    return PFX + activeMeetingId + "_mood";
  }

  function persistMoodChoice(m) {
    var key = moodStorageKey();
    if (!key) {
      showToast("Önce görüşme oturumu oluşturun (Başlat veya ruh hali seçin).", true);
      return;
    }
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          moodId: m.id,
          moodLabel: m.label,
          emoji: m.emoji,
          recordedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      showToast("Ruh hali kaydedilemedi.", true);
      return;
    }
    pushMrFeed(m);
  }

  function matchIdsForStudent() {
    var ids = [String(selectedCatalogId || "").trim()];
    var full = findStudentFull(selectedCatalogId);
    if (full && full.ogrenciId) {
      var oid = String(full.ogrenciId).trim();
      if (oid && ids.indexOf(oid) < 0) ids.push(oid);
    }
    return ids.filter(Boolean);
  }

  function pushMrFeed(m) {
    if (!selectedCatalogId) return;
    var arr = readJson(KEY_MR_FEED, []);
    if (!Array.isArray(arr)) arr = [];
    arr.push({
      meetingId: activeMeetingId,
      studentId: selectedCatalogId,
      matchIds: matchIdsForStudent(),
      moodId: m.id,
      moodLabel: m.label,
      emoji: m.emoji,
      recordedAt: new Date().toISOString(),
      source: "gorusme_odasi",
    });
    if (arr.length > 200) arr = arr.slice(-200);
    if (writeJson(KEY_MR_FEED, arr)) {
      try {
        window.dispatchEvent(new StorageEvent("storage", { key: KEY_MR_FEED, newValue: JSON.stringify(arr) }));
      } catch (e) {}
    }
  }

  function moodStripSelectedClasses(el) {
    if (!el) return;
    MOOD_BTN_SELECTED_CLASS.split(/\s+/).forEach(function (c) {
      if (c) el.classList.remove(c);
    });
  }

  function renderMoodBar() {
    if (!elMoodBar) return;
    elMoodBar.innerHTML = "";
    MOODS.forEach(function (m) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = MOOD_BTN_BASE_CLASS;
      b.setAttribute("data-mood-id", m.id);
      b.innerHTML =
        '<span class="text-2xl leading-none drop-shadow-sm sm:text-[1.75rem]" aria-hidden="true">' +
        esc(m.emoji) +
        '</span><span class="max-w-[5.5rem] text-center text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-[10px]">' +
        esc(m.label) +
        "</span>";
      b.addEventListener("click", function () {
        try {
          if (!selectedCatalogId) {
            showToast("Önce öğrenci seçin.", true);
            return;
          }
          ensureMeetingSession();
          selectedMood = m;
          persistMoodChoice(m);
          elMoodBar.querySelectorAll(".go-mood-btn").forEach(function (x) {
            moodStripSelectedClasses(x);
          });
          MOOD_BTN_SELECTED_CLASS.split(/\s+/).forEach(function (c) {
            if (c) b.classList.add(c);
          });
        } catch (err) {
          showToast("Ruh hali güncellenemedi.", true);
        }
      });
      elMoodBar.appendChild(b);
    });
    restoreMoodUiVisual();
  }

  function restoreMoodUiVisual() {
    if (!elMoodBar || !activeMeetingId) return;
    try {
      var raw = localStorage.getItem(PFX + activeMeetingId + "_mood");
      if (!raw) return;
      var o = JSON.parse(raw);
      var id = String(o.moodId || "").trim();
      selectedMood = null;
      for (var i = 0; i < MOODS.length; i++) {
        if (MOODS[i].id === id) selectedMood = MOODS[i];
      }
      if (!selectedMood && o.moodLabel)
        selectedMood = { id: id, label: o.moodLabel, emoji: o.emoji || "" };
      var btn = elMoodBar.querySelector('[data-mood-id="' + id + '"]');
      elMoodBar.querySelectorAll(".go-mood-btn").forEach(function (x) {
        moodStripSelectedClasses(x);
      });
      if (btn) {
        MOOD_BTN_SELECTED_CLASS.split(/\s+/).forEach(function (c) {
          if (c) btn.classList.add(c);
        });
      }
    } catch (e) {}
  }

  /** Oturum başlamadan önce taslak; başlayınca meetingId — her yeni görüşmede ajanda sıfırlanır */
  function agendaDraftStorageKey(sid) {
    return KEY_AGENDA + String(sid || "").trim() + "_draft_" + v2TabSessionId();
  }

  function agendaKey() {
    var sid = String(selectedCatalogId || "").trim() || "none";
    var mid = String(activeMeetingId || "").trim();
    if (mid) return KEY_AGENDA + sid + "_" + mid;
    return agendaDraftStorageKey(sid);
  }

  function loadAgendaState() {
    var st = readJson(agendaKey(), {});
    if (!st || typeof st !== "object") st = {};
    var out = {};
    AGENDA_ITEMS.forEach(function (it) {
      out[it.id] = !!st[it.id];
    });
    return out;
  }

  function saveAgendaState(st) {
    writeJson(agendaKey(), st);
  }

  function renderAgenda() {
    if (!elAgendaList || !elAgendaBar || !elAgendaPct) return;
    elAgendaList.innerHTML = "";
    var st = loadAgendaState();
    var done = 0;
    AGENDA_ITEMS.forEach(function (it) {
      if (st[it.id]) done++;
      var row = document.createElement("label");
      row.className =
        "flex cursor-pointer items-center gap-3 rounded-xl border border-[color:var(--header-border)] px-3 py-2.5 transition hover:bg-[color:var(--surface-muted)]/60";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500";
      cb.checked = !!st[it.id];
      cb.addEventListener("change", function () {
        try {
          if (!selectedCatalogId) {
            cb.checked = false;
            showToast("Öğrenci seçin.", true);
            return;
          }
          var next = loadAgendaState();
          next[it.id] = !!cb.checked;
          saveAgendaState(next);
          renderAgenda();
          updateSyncView(it.label + " · Görüşme ajandası");
        } catch (err) {
          showToast("Ajanda güncellenemedi.", true);
        }
      });
      var span = document.createElement("span");
      span.className = "text-sm font-semibold text-[color:var(--text-primary)]";
      span.textContent = it.label;
      row.appendChild(cb);
      row.appendChild(span);
      elAgendaList.appendChild(row);
    });
    var pct = Math.round((done / AGENDA_ITEMS.length) * 100);
    elAgendaPct.textContent = String(pct) + "%";
    elAgendaBar.style.width = pct + "%";
  }

  /** ——— Atlas / Net Sihirbazı uyumlu hedef netler ——— */
  function normPuanTip(t) {
    return String(t || "")
      .toUpperCase()
      .replace(/İ/g, "I")
      .replace(/İ/g, "I")
      .replace(/ı/g, "I")
      .replace(/Ö/g, "O")
      .replace(/ö/g, "O")
      .replace(/Ü/g, "U")
      .replace(/ü/g, "U")
      .replace(/Ş/g, "S")
      .replace(/ş/g, "S")
      .replace(/Ğ/g, "G")
      .replace(/ğ/g, "G")
      .replace(/Ç/g, "C")
      .replace(/ç/g, "C")
      .trim();
  }

  function getBranchSpec(puanTipi) {
    var t = normPuanTip(puanTipi);
    var tyt = [
      { id: "tyt_tr", label: "TYT Türkçe", max: 40 },
      { id: "tyt_mat", label: "TYT Matematik", max: 40 },
      { id: "tyt_fen", label: "TYT Fen Bilimleri", max: 20 },
      { id: "tyt_sos", label: "TYT Sosyal Bilimler", max: 20 },
    ];
    if (t === "SAY") {
      return tyt.concat([
        { id: "ayt_mat", label: "AYT Matematik", max: 40 },
        { id: "ayt_fiz", label: "AYT Fizik", max: 14 },
        { id: "ayt_kim", label: "AYT Kimya", max: 13 },
        { id: "ayt_bio", label: "AYT Biyoloji", max: 13 },
      ]);
    }
    if (t === "SOZ") {
      return tyt.concat([
        { id: "ayt_edb", label: "AYT Türk Dili ve Edebiyatı", max: 24 },
        { id: "ayt_tar1", label: "AYT Tarih-1", max: 10 },
        { id: "ayt_cog1", label: "AYT Coğrafya-1", max: 6 },
        { id: "ayt_tar2", label: "AYT Tarih-2", max: 11 },
      ]);
    }
    if (t === "EA") {
      return tyt.concat([
        { id: "ayt_mat", label: "AYT Matematik", max: 40 },
        { id: "ayt_edb", label: "AYT Türk Dili ve Edebiyatı", max: 24 },
        { id: "ayt_tar1", label: "AYT Tarih-1", max: 10 },
        { id: "ayt_cog1", label: "AYT Coğrafya-1", max: 6 },
      ]);
    }
    if (t === "DIL" || t === "DİL") {
      return tyt.concat([
        { id: "ayt_dil", label: "AYT Dil", max: 80 },
        { id: "ayt_edb", label: "AYT Edebiyat-Sosyal-1", max: 24 },
        { id: "ayt_tar1", label: "AYT Tarih-1", max: 10 },
        { id: "ayt_cog1", label: "AYT Coğrafya-1", max: 6 },
      ]);
    }
    return getBranchSpec("SAY");
  }

  function round1(x) {
    return Math.round(x * 10) / 10;
  }

  function normKey(s) {
    return normPuanTip(String(s || "")).replace(/[^A-Z0-9]/g, "");
  }

  function extractDeclaredNets(row, spec) {
    var raw = row.ortalama_netler || row.Yerlesen_Ortalama_Netleri || row.yerlesen_ortalama_netleri;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      var outObj = {};
      var keys = Object.keys(raw);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var v = raw[k];
        var n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
        if (!Number.isFinite(n)) continue;
        var nk = normKey(k);
        for (var j = 0; j < spec.length; j++) {
          var sk = normKey(spec[j].label);
          if (sk.indexOf(nk) !== -1 || nk.indexOf(sk) !== -1) {
            outObj[spec[j].id] = round1(Math.min(spec[j].max, Math.max(0, n)));
            break;
          }
        }
      }
      var ok = Object.keys(outObj).filter(function (x) {
        return outObj[x] != null;
      });
      if (ok.length) return { nets: outObj, source: "json" };
    }
    var outFlat = {};
    for (var s = 0; s < spec.length; s++) {
      var id = spec[s].id;
      var candidates = ["Net_" + id, "Ort_" + id, "Ortalama_" + id, "OrtNet_" + id, id];
      for (var c = 0; c < candidates.length; c++) {
        var ck = candidates[c];
        if (row[ck] != null && String(row[ck]).trim() !== "") {
          var num = parseFloat(String(row[ck]).replace(",", "."));
          if (Number.isFinite(num)) {
            outFlat[id] = round1(Math.min(spec[s].max, Math.max(0, num)));
            break;
          }
        }
      }
    }
    if (Object.keys(outFlat).length) return { nets: outFlat, source: "json" };
    return null;
  }

  function syntheticNets(row, strength, spec) {
    var nets = {};
    var s = Math.max(0, Math.min(1, strength));
    for (var i = 0; i < spec.length; i++) {
      var br = spec[i];
      var lo = br.max * (0.28 + i * 0.01);
      var hi = br.max * (0.88 - i * 0.008);
      var v = lo + (hi - lo) * s;
      var seed = (String(row.Program_Kodu || "") + br.id).split("").reduce(function (a, ch) {
        return a + ch.charCodeAt(0);
      }, 0);
      v += ((seed % 17) - 8) * 0.08;
      nets[br.id] = round1(Math.min(br.max, Math.max(0, v)));
    }
    return { nets: nets, source: "model" };
  }

  function resolveNetsForAtlasRow(row) {
    var spec = getBranchSpec(row.Puan_Tipi);
    var dec = extractDeclaredNets(row, spec);
    if (dec) return dec;
    return syntheticNets(row, 0.55, spec);
  }

  function normTr(s) {
    return String(s || "")
      .toLocaleLowerCase("tr-TR")
      .replace(/\s+/g, " ")
      .trim();
  }

  function matchAtlasRow(goal, rows) {
    if (!goal || !rows || !rows.length) return null;
    var parts = goal.split(/\s*[–—]\s*/);
    var u = normTr(parts[0] || "");
    var b = normTr(parts[1] || "");
    if (!u || !b) return null;
    var best = null;
    var score = 0;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var ru = normTr(r.Universite || "");
      var rb = normTr(r.Bolum || "");
      if (!ru || !rb) continue;
      var um = ru.indexOf(u) !== -1 || u.indexOf(ru) !== -1;
      var bm = rb.indexOf(b) !== -1 || b.indexOf(rb) !== -1;
      if (!um || !bm) continue;
      var s = 2;
      if (ru === u) s += 2;
      if (rb === b) s += 2;
      if (s > score) {
        score = s;
        best = r;
      }
    }
    return best;
  }

  function loadAtlas() {
    if (atlasRows) return Promise.resolve(atlasRows);
    if (atlasLoadPromise) return atlasLoadPromise;
    atlasLoadPromise = fetch("../yok-atlas-lisans.json")
      .then(function (r) {
        if (!r.ok) throw new Error("Atlas HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        atlasRows = Array.isArray(data) ? data : [];
        return atlasRows;
      })
      .catch(function (err) {
        console.warn("[Strateji Merkezi] Atlas yüklenemedi:", err);
        atlasRows = [];
        showToast("YÖK Atlas dosyası okunamadı; hedef kıyası sınırlı.", true);
        return atlasRows;
      });
    return atlasLoadPromise;
  }

  function pseudoUserFromCatalog(cat, full) {
    return {
      name: cat.name,
      studentCode: cat.code || "",
      id: (full && full.ogrenciId) || "",
      ogrenciId: (full && full.ogrenciId) || "",
    };
  }

  function renderGapPanel(cat, full, exams) {
    if (!elGapPanel) return;
    elGapPanel.innerHTML =
      '<p class="animate-pulse text-sm text-[color:var(--text-muted)]">Hedef program netleri hesaplanıyor…</p>';
    var goal = full && full.goal ? String(full.goal).trim() : "";
    if (!goal) {
      elGapPanel.innerHTML =
        '<p class="text-sm text-[color:var(--text-muted)]">Öğrencilerimde hedef üniversite/bölüm tanımlı değil.</p>';
      return;
    }
    loadAtlas().then(function (rows) {
      try {
        var row = matchAtlasRow(goal, rows);
        if (!row) {
          elGapPanel.innerHTML =
            '<p class="text-sm text-amber-700 dark:text-amber-300">Atlas içinde bu hedef satırı bulunamadı; Net Sihirbazı’ndan kontrol edin.</p>';
          return;
        }
        var resolved = resolveNetsForAtlasRow(row);
        var targetNets = resolved.nets || {};
        var Bridge = window.DereceOgrenciSimBridge;
        var studentNets = {};
        if (Bridge && typeof Bridge.getLastExamRecord === "function") {
          var u = pseudoUserFromCatalog(cat, full);
          var rec = Bridge.getLastExamRecord(u);
          if (rec && typeof Bridge.computeNsBranchNetsFromRecord === "function") {
            studentNets = Bridge.computeNsBranchNetsFromRecord(rec) || {};
          }
        }
        var spec = getBranchSpec(row.Puan_Tipi);
        var lines = [];
        var showIds = Object.keys(targetNets).filter(function (k) {
          return studentNets[k] != null || targetNets[k] != null;
        });
        if (!showIds.length) showIds = spec.slice(0, 6).map(function (s) {
          return s.id;
        });
        else if (showIds.length > 8) showIds = showIds.slice(0, 8);

        var srcHint =
          resolved.source === "json"
            ? "YÖK satırı net alanları"
            : "Taban/SAY-SÖZ modeli (Net Sihirbazı ile uyumlu tahmin)";

        lines.push(
          '<p class="mb-3 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">' +
            esc(row.Universite + " · " + row.Bolum) +
            ' · <span class="text-indigo-600">' +
            esc(srcHint) +
            "</span></p>"
        );
        lines.push('<div class="flex flex-col gap-2">');

        showIds.forEach(function (id) {
          var lab = id;
          for (var i = 0; i < spec.length; i++) {
            if (spec[i].id === id) lab = spec[i].label;
          }
          var tgt = targetNets[id];
          var stu = studentNets[id];
          var tgtS = tgt != null && Number.isFinite(tgt) ? round1(tgt) : null;
          var stuS = stu != null && Number.isFinite(stu) ? round1(stu) : null;
          var diff = tgtS != null && stuS != null ? round1(stuS - tgtS) : null;
          var diffCls = "text-slate-600";
          if (diff != null) {
            if (diff < -0.05) diffCls = "text-red-600 font-bold";
            else if (diff > 0.05) diffCls = "text-emerald-600 font-bold";
          }
          lines.push(
            '<div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[color:var(--header-border)] bg-[color:var(--surface-muted)]/30 px-3 py-2 text-sm transition">' +
              '<span class="min-w-0 font-medium text-[color:var(--text-primary)]">' +
              esc(lab) +
              "</span>" +
              '<span class="shrink-0 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">Hedef: ' +
              (tgtS != null ? esc(String(tgtS)) : "—") +
              ' · Son: ' +
              (stuS != null ? esc(String(stuS)) : "—") +
              '</span><span class="shrink-0 font-mono text-xs ' +
              diffCls +
              '">Fark: ' +
              (diff != null ? esc(String(diff > 0 ? "+" + diff : diff)) : "—") +
              "</span></div>"
          );
        });
        lines.push("</div>");
        elGapPanel.innerHTML = lines.join("");
      } catch (err) {
        console.warn("[Strateji Merkezi] Gap panel", err);
        elGapPanel.innerHTML = '<p class="text-sm text-red-600">Kıyaslama oluşturulamadı.</p>';
      }
    });
  }

  function syncCatalog() {
    if (typeof window.syncDereceStudentCatalog === "function") {
      try {
        window.syncDereceStudentCatalog();
      } catch (e) {}
    }
  }

  function slugFromCode(code) {
    return String(code || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ\-_.]/g, "");
  }

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

  function rowSlugFromFullPayload(p) {
    var code = String((p && p.studentCode) || "").trim();
    if (code) return slugFromCode(code);
    return slugFromName((p && p.name) || "");
  }

  function loadStudentsFull() {
    try {
      var raw = localStorage.getItem(LS_STUDENTS_FULL);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function findStudentFull(catalogId) {
    var id = String(catalogId || "").trim();
    if (!id) return null;
    var list = loadStudentsFull();
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (!p) continue;
      if (String(p.ogrenciId || "").trim() === id) return p;
      if (rowSlugFromFullPayload(p) === id) return p;
    }
    var cat = (window.DereceStudentCatalogById || {})[id];
    if (cat) {
      var code = String(cat.code || "").trim();
      var name = String(cat.name || "").trim();
      for (var j = 0; j < list.length; j++) {
        var q = list[j];
        if (!q) continue;
        if (code && String(q.studentCode || "").trim() === code) return q;
        if (name && String(q.name || "").trim() === name) return q;
      }
    }
    return null;
  }

  function buildCatalogComboRows() {
    catalogRows.length = 0;
    syncCatalog();
    var list =
      typeof window.getDereceStudentsWithUniqueCode === "function"
        ? window.getDereceStudentsWithUniqueCode()
        : window.DereceStudentCatalog;
    if (!Array.isArray(list) || !list.length) return;

    for (var j = 0; j < list.length; j++) {
      var st = list[j];
      if (!st || !st.id) continue;
      var name = String(st.name || "").trim();
      if (!name) continue;
      var code = String(st.code || "").trim();
      if (!code) continue;
      var receteCanonical = name + " (" + code + ")";
      var receteLabel = receteCanonical;

      var needle = (name + " " + code + " " + String(st.id || "") + " " + receteLabel).toLowerCase();
      catalogRows.push({
        id: String(st.id),
        name: name,
        code: code,
        label: receteLabel,
        receteCanonical: receteCanonical,
        receteLabel: receteLabel,
        needle: needle,
      });
    }
    catalogRows.sort(function (a, b) {
      return a.label.localeCompare(b.label, "tr");
    });
  }

  function openStudentCombo() {
    if (!elPopover || !elOgrenci) return;
    elPopover.classList.remove("hidden");
    elOgrenci.setAttribute("aria-expanded", "true");
    if (elChevron) elChevron.classList.add("rotate-180");
  }

  function closeStudentCombo() {
    if (!elPopover || !elOgrenci) return;
    elPopover.classList.add("hidden");
    elOgrenci.setAttribute("aria-expanded", "false");
    if (elChevron) elChevron.classList.remove("rotate-180");
    if (selectedCatalogId && selectedLabel) elOgrenci.value = selectedLabel;
    else elOgrenci.value = "";
  }

  function renderStudentOptions(filterText) {
    if (!elListbox) return;
    var q = String(filterText || "")
      .toLowerCase()
      .trim();
    var matched = !q
      ? catalogRows.slice()
      : catalogRows.filter(function (row) {
          return row.needle.indexOf(q) !== -1;
        });

    elListbox.innerHTML = "";
    if (!matched.length) {
      var empty = document.createElement("li");
      empty.className = "go-ogrenci-empty";
      empty.setAttribute("role", "presentation");
      empty.textContent = catalogRows.length ? "Eşleşen öğrenci yok." : "Öğrenci yok — Öğrencilerim üzerinden ekleyin.";
      elListbox.appendChild(empty);
      return;
    }

    for (var i = 0; i < matched.length; i++) {
      var row = matched[i];
      var li = document.createElement("li");
      li.className = "go-ogrenci-opt";
      li.setAttribute("role", "option");
      li.setAttribute("data-id", row.id);
      li.setAttribute("data-label", row.label);
      li.textContent = row.label;
      elListbox.appendChild(li);
    }
  }

  function pickStudent(id, label) {
    try {
      sessionStorage.removeItem(SESSION_EDIT_MEETING);
    } catch (eSe) {}
    resetMeetingPageHeadline();
    selectedCatalogId = String(id || "").trim();
    selectedLabel = String(label || "").trim();
    if (elOgrenci) elOgrenci.value = selectedLabel;
    closeStudentCombo();
    activeMeetingId = "";
    selectedMood = null;
    try {
      localStorage.removeItem(KEY_MEETING_OPEN);
    } catch (e) {}
    onStudentChanged();
  }

  /** Öğrenci değişince geçici temizlik; ardından loadV2NotesFromStorage ile taslak yüklenir. */
  function clearNotesForFreshSession() {
    if (!elNotes) return;
    setNotesContent("");
    if (elNoteCategory) elNoteCategory.value = "";
    scheduleParaRender();
  }

  function flashSaved() {
    if (!elSaveDot) return;
    elSaveDot.classList.remove("opacity-0");
    elSaveDot.classList.add("opacity-100");
    clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(function () {
      elSaveDot.classList.add("opacity-0");
      elSaveDot.classList.remove("opacity-100");
    }, 1600);
  }

  function formatDurationTr(ms) {
    var totalSec = Math.max(0, Math.floor(Number(ms) / 1000));
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    var parts = [];
    if (h) parts.push(h + " sa");
    if (m) parts.push(m + " dk");
    parts.push(s + " sn");
    return parts.join(" ");
  }

  function computeArchiveDurationMs() {
    var fromTimer = Math.max(0, timerTotalMs - timerRemainingMs);
    if (fromTimer >= 3000) return fromTimer;
    if (activeMeetingId) {
      var meta = readJson(PFX + activeMeetingId + "_meta", {});
      var st = parseTime(meta.startedAt);
      if (st) return Math.min(Math.max(0, Date.now() - st), 48 * 60 * 60 * 1000);
    }
    return fromTimer;
  }

  function readGorusmeArchiveArr() {
    var arr = readJsonArray(LS_GORUSME_ARSIV);
    return Array.isArray(arr) ? arr : [];
  }

  function findArchiveEntryById(archiveId) {
    var sid = String(archiveId || "").trim();
    if (!sid) return null;
    var arr = readGorusmeArchiveArr();
    for (var i = 0; i < arr.length; i++) {
      if (String((arr[i] && arr[i].id) || "").trim() === sid) return arr[i];
    }
    return null;
  }

  function formatArchiveHeadlineDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
    } catch (e) {
      return String(iso);
    }
  }

  function archiveNotesToEditorHtml(entry) {
    if (!entry) return "";
    var rich = entry.notesRich || entry.notesHtml;
    if (rich && String(rich).trim()) return String(rich);
    var pl = String(entry.notes || "").trim();
    if (!pl) return "";
    return pl
      .split(/\n\s*\n/)
      .filter(function (chunk) {
        return String(chunk).trim().length;
      })
      .map(function (chunk) {
        return "<p>" + esc(String(chunk).trim()).replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  function resetMeetingPageHeadline() {
    if (elMeetingHeadline) elMeetingHeadline.textContent = "Yeni görüşme";
    try {
      document.title = "Strateji Merkezi – Yeni Görüşme – Derecepanel";
    } catch (eT) {}
  }

  function setMeetingHeadlineEditMode(dateISO) {
    var d = formatArchiveHeadlineDate(dateISO);
    if (elMeetingHeadline) elMeetingHeadline.textContent = "Geçmiş Görüşmeyi Düzenle: " + d;
    try {
      document.title = "Geçmiş görüşme · " + d + " – Derecepanel";
    } catch (eT2) {}
  }

  function readCurrentMoodSnapshotForArchive() {
    var moodSnap = null;
    try {
      if (activeMeetingId) {
        var rawM = localStorage.getItem(PFX + activeMeetingId + "_mood");
        if (rawM) moodSnap = JSON.parse(rawM);
      }
    } catch (eM) {}
    if (!moodSnap && selectedMood) {
      moodSnap = {
        moodId: selectedMood.id,
        moodLabel: selectedMood.label,
        emoji: selectedMood.emoji || "",
        recordedAt: new Date().toISOString(),
      };
    }
    return moodSnap;
  }

  /**
   * Arşiv kartından görüşme odası UI’sini doldurur (taslak LS okunmaz).
   */
  function hydrateMeetingRoomFromArchive(entry) {
    if (!entry) return;
    selectedCatalogId = String(entry.studentId || "").trim();
    selectedLabel = "";
    buildCatalogComboRows();
    for (var ci = 0; ci < catalogRows.length; ci++) {
      if (catalogRows[ci].id === selectedCatalogId) {
        selectedLabel = catalogRows[ci].label;
        break;
      }
    }
    if (!selectedLabel) selectedLabel = String(entry.studentName || selectedCatalogId || "").trim();
    if (elOgrenci) elOgrenci.value = selectedLabel;

    activeMeetingId = String(entry.meetingId || "").trim() || genMeetingId();
    try {
      localStorage.setItem(KEY_MEETING_OPEN, activeMeetingId);
    } catch (eK) {}
    var metaEx = readJson(PFX + activeMeetingId + "_meta", null);
    if (!metaEx || typeof metaEx !== "object") {
      writeJson(PFX + activeMeetingId + "_meta", {
        studentId: selectedCatalogId,
        studentLabel: selectedLabel,
        startedAt: entry.dateISO || new Date().toISOString(),
        v: 2,
        fromArchiveEdit: true,
      });
    }

    if (entry.mood && typeof entry.mood === "object") {
      try {
        var mid = String(entry.mood.moodId || entry.mood.id || "").trim();
        if (mid) {
          localStorage.setItem(
            PFX + activeMeetingId + "_mood",
            JSON.stringify({
              moodId: mid,
              moodLabel: entry.mood.moodLabel || entry.mood.label || "",
              emoji: entry.mood.emoji || "",
              recordedAt: entry.mood.recordedAt || entry.dateISO || new Date().toISOString(),
            })
          );
        }
      } catch (eMo) {}
    }

    var agendaMerged = {};
    AGENDA_ITEMS.forEach(function (it) {
      agendaMerged[it.id] = !!(entry.agendaSnapshot && entry.agendaSnapshot[it.id]);
    });
    saveAgendaState(agendaMerged);

    setNotesContent(archiveNotesToEditorHtml(entry));
    if (elNoteCategory) elNoteCategory.value = String(entry.noteCategory || "").trim();
    try {
      if (selectedCatalogId && elNotes) {
        localStorage.setItem(
          v2NotesLsKey(),
          JSON.stringify({
            html: notesHtmlSnapshot(),
            category: elNoteCategory ? String(elNoteCategory.value || "") : "",
            savedAt: new Date().toISOString(),
          })
        );
      }
    } catch (eSyn) {}
    scheduleParaRender();

    if (videoSessionActive) {
      showToast("Öğrenci değişti. Görüntülü oda eski öğrenciye aitti; yeni öğrenci için görüşmeyi yeniden başlatın.", true);
    }
    resetVideoSessionUi();
    renderStudent360();
    updateToolbarState();
    if (elBtnStart) elBtnStart.disabled = !selectedCatalogId;
    refreshPauseControls();
    renderMoodBar();
    restoreMoodUiVisual();

    setMeetingHeadlineEditMode(entry.dateISO);
  }

  function saveMeetingToArchiveAndReset() {
    if (!selectedCatalogId) {
      showToast("Önce öğrenci seçin.", true);
      return;
    }
    stopSpeech();
    var durMs = computeArchiveDurationMs();
    var notesText = notesPlain();
    var notesRich = notesHtmlSnapshot();
    var noteCat = elNoteCategory ? String(elNoteCategory.value || "").trim() : "";
    var lsKeyDraft = v2NotesLsKey();
    var moodSnap = readCurrentMoodSnapshotForArchive();
    var agendaSnap = loadAgendaState();
    var cat = getCatalogStudent();

    var editArchiveId = "";
    try {
      editArchiveId = String(sessionStorage.getItem(SESSION_EDIT_MEETING) || "").trim();
    } catch (eEd) {}

    var arr = readGorusmeArchiveArr();

    if (editArchiveId) {
      var ix = -1;
      for (var j = 0; j < arr.length; j++) {
        if (String((arr[j] && arr[j].id) || "").trim() === editArchiveId) {
          ix = j;
          break;
        }
      }
      if (ix < 0) {
        showToast("Arşiv kaydı bulunamadı.", true);
        try {
          sessionStorage.removeItem(SESSION_EDIT_MEETING);
        } catch (eRm) {}
        resetMeetingPageHeadline();
        return;
      }
      arr[ix].notes = notesText;
      arr[ix].notesRich = notesRich;
      arr[ix].noteCategory = noteCat;
      arr[ix].mood = moodSnap;
      arr[ix].agendaSnapshot = agendaSnap;
      arr[ix].durationMs = durMs;
      arr[ix].durationLabel = formatDurationTr(durMs);
      arr[ix].notesUpdatedAt = new Date().toISOString();
      arr[ix].meetingId = activeMeetingId || arr[ix].meetingId || "";
      arr[ix].studentId = selectedCatalogId;
      arr[ix].studentName = selectedLabel || (cat && cat.name) || arr[ix].studentName || "";
      if (!writeJson(LS_GORUSME_ARSIV, arr)) return;
      try {
        sessionStorage.removeItem(SESSION_EDIT_MEETING);
      } catch (eS) {}
      resetMeetingPageHeadline();
      try {
        localStorage.removeItem(lsKeyDraft);
        localStorage.removeItem(LEGACY_NOT_PREFIX + selectedCatalogId);
      } catch (eR) {}
      finishMeetingSession();
      stopTimerInterval();
      timerRunning = false;
      resetTimer();
      setNotesContent("");
      if (elNoteCategory) elNoteCategory.value = "";
      scheduleParaRender();
      selectedMood = null;
      renderMoodBar();
      showToast("Görüşme güncellendi.");
      updateSyncView("Strateji Merkezi · Görüşme arşivi");
      window.location.href = "gorusme-arsivi.html";
      return;
    }

    var entry = {
      id: genMeetingId(),
      studentId: selectedCatalogId,
      studentName: selectedLabel || (cat && cat.name) || "",
      dateISO: new Date().toISOString(),
      durationMs: durMs,
      durationLabel: formatDurationTr(durMs),
      notes: notesText,
      notesRich: notesRich,
      noteCategory: noteCat,
      mood: moodSnap,
      meetingId: activeMeetingId || "",
      agendaSnapshot: agendaSnap,
      source: "gorusme_odasi_shell",
      v: 2,
    };
    arr.unshift(entry);
    if (arr.length > 500) arr = arr.slice(0, 500);
    if (!writeJson(LS_GORUSME_ARSIV, arr)) return;
    try {
      localStorage.removeItem(lsKeyDraft);
      localStorage.removeItem(LEGACY_NOT_PREFIX + selectedCatalogId);
    } catch (eR2) {}
    finishMeetingSession();
    stopTimerInterval();
    timerRunning = false;
    resetTimer();
    setNotesContent("");
    if (elNoteCategory) elNoteCategory.value = "";
    scheduleParaRender();
    selectedMood = null;
    renderMoodBar();
    showToast("Görüşme arşive kaydedildi.");
    updateSyncView("Strateji Merkezi · Görüşme arşivi");
  }

  function scheduleParaRender() {
    clearTimeout(paraDebounceTimer);
    paraDebounceTimer = setTimeout(renderParagraphActions, DEBOUNCE_PARA_MS);
  }

  function renderParagraphActions() {
    if (!elParaBox || !elNotes) return;
    elParaBox.innerHTML = "";
    var text = notesPlain();
    if (!text || !selectedCatalogId) {
      elParaBox.innerHTML = '<p class="text-[10px] text-[color:var(--text-muted)]">Paragrafları görev olarak göndermek için çift satır sonu kullanın.</p>';
      return;
    }
    var parts = text.split(/\n\s*\n/).filter(function (p) {
      return String(p).trim().length;
    });
    if (parts.length < 2 && text.indexOf("\n") === -1) {
      parts = [text];
    }
    parts.forEach(function (para, idx) {
      var line = document.createElement("div");
      line.className =
        "flex items-start justify-between gap-2 rounded-lg border border-[color:var(--header-border)] bg-[color:var(--surface-muted)]/25 px-2 py-1.5 text-xs transition hover:shadow-sm";
      var t = document.createElement("p");
      t.className = "min-w-0 flex-1 whitespace-pre-wrap text-[color:var(--text-primary)]";
      t.textContent = para.trim();
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "go-task-send shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100";
      btn.title = "Haftalık programa görev olarak aktar";
      btn.innerHTML =
        '<span class="sr-only">Görev yap</span><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>';
      btn.addEventListener("click", function () {
        try {
          var payload = {
            text: para.trim(),
            studentId: selectedCatalogId,
            studentName: selectedLabel,
            paragraphIndex: idx,
            source: "gorusme_odasi",
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(TRANSFER_GOREV, JSON.stringify(payload));
          window.location.href =
            "haftalik-program-olusturucu.html?student=" + encodeURIComponent(selectedCatalogId) + "&new=1";
        } catch (err) {
          showToast("Görev aktarımı başarısız.", true);
        }
      });
      line.appendChild(t);
      line.appendChild(btn);
      elParaBox.appendChild(line);
    });
  }

  function clearSpeechConnectWatch() {
    speechAwaitingStart = false;
    if (speechConnectTimer) {
      clearTimeout(speechConnectTimer);
      speechConnectTimer = null;
    }
  }

  function armSpeechConnectWatch() {
    clearSpeechConnectWatch();
    speechAwaitingStart = true;
    speechConnectTimer = setTimeout(function () {
      speechConnectTimer = null;
      if (!speechAwaitingStart) return;
      speechAwaitingStart = false;
      try {
        if (typeof window.stopVoiceRecognition === "function") window.stopVoiceRecognition();
      } catch (eStop) {}
      setSpeechUi(false, "");
      cleanupSpeechInterimOnStop();
      showToast(
        "Ses tanıma başlamadı. Opera GX sık sık Web Speech’i engeller — Chrome veya Edge deneyin. İnternet ve mikrofon iznini kontrol edin.",
        true
      );
    }, 14000);
  }

  function setSpeechUi(active, statusText) {
    if (elMic) {
      elMic.classList.toggle("go-v2-mic-btn--live", !!active);
      elMic.setAttribute("aria-pressed", active ? "true" : "false");
      elMic.setAttribute(
        "aria-label",
        active ? "Dinlemeyi durdur" : "Sesli notu başlat"
      );
      elMic.title = active
        ? "Dinleniyor — tekrar dokunarak durdurun."
        : "Bir kez dokunun — sesli not başlar. Tekrar dokunun — durur.";
    }
    if (elSpeechCluster) {
      elSpeechCluster.classList.toggle("go-speech-mic-cluster--live", !!active);
    }
    if (elSpeechWaves) {
      elSpeechWaves.classList.toggle("go-speech-waves--live", !!active);
    }
    if (elSpeechStatus) elSpeechStatus.textContent = statusText || "";
  }

  function wireSpeech() {
    if (!elMic) return;
    if (!speechSupported || typeof window.startVoiceRecognition !== "function") {
      elMic.disabled = true;
      elMic.title = "Tarayıcı konuşma tanımayı desteklemiyor";
      return;
    }
    elMic.addEventListener("click", function () {
      try {
        if (!selectedCatalogId) {
          showToast("Sesli not için önce öğrenci seçin.", true);
          return;
        }
        if (typeof window.isVoiceRecognitionListening === "function" && window.isVoiceRecognitionListening()) {
          clearSpeechConnectWatch();
          if (typeof window.stopVoiceRecognition === "function") window.stopVoiceRecognition();
          setSpeechUi(false, "");
          cleanupSpeechInterimOnStop();
          return;
        }
        setSpeechUi(true, "Bağlanıyor…");

        function beginRecognitionAfterMic() {
          armSpeechConnectWatch();
          window.startVoiceRecognition({
            lang: "tr-TR",
            continuous: true,
            interimResults: true,
            autoRestart: true,
            onStart: function () {
              clearSpeechConnectWatch();
              ensureSpeechLiveAnchor();
              setSpeechUi(true, "Dinleniyor — konuşabilirsiniz");
            },
            onInterim: function (interim) {
              updateSpeechInterimVisual(interim);
            },
            onFinalChunk: function (text) {
              commitSpeechFinalToNotes(text);
            },
            onError: function (msg) {
              clearSpeechConnectWatch();
              setSpeechUi(false, "");
              cleanupSpeechInterimOnStop();
              if (msg) showToast(msg, true);
            },
            onEnd: function () {
              clearSpeechConnectWatch();
              setSpeechUi(false, "");
              cleanupSpeechInterimOnStop();
            },
          });
        }

        if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
          navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then(function (stream) {
              try {
                stream.getTracks().forEach(function (t) {
                  t.stop();
                });
              } catch (eTr) {}
              beginRecognitionAfterMic();
            })
            .catch(function () {
              clearSpeechConnectWatch();
              setSpeechUi(false, "");
              showToast(
                "Mikrofon izni gerekli. Adres çubuğundaki kilit veya site ayarlarından mikrofonu bu site için açın.",
                true
              );
            });
        } else {
          beginRecognitionAfterMic();
        }
      } catch (err) {
        clearSpeechConnectWatch();
        setSpeechUi(false, "");
        showToast("Mikrofon başlatılamadı.", true);
      }
    });
  }

  function stopSpeech() {
    clearSpeechConnectWatch();
    try {
      if (typeof window.stopVoiceRecognition === "function") window.stopVoiceRecognition();
    } catch (e) {}
    setSpeechUi(false, "");
    cleanupSpeechInterimOnStop();
  }

  function buildSummaryText() {
    var cat = getCatalogStudent();
    var full = findStudentFull(selectedCatalogId);
    var moodLine = selectedMood
      ? selectedMood.emoji + " " + selectedMood.label
      : "—";
    try {
      if (activeMeetingId) {
        var raw = localStorage.getItem(PFX + activeMeetingId + "_mood");
        if (raw) {
          var o = JSON.parse(raw);
          moodLine = (o.emoji || "") + " " + (o.moodLabel || o.moodId || "");
        }
      }
    } catch (e) {}

    var agenda = loadAgendaState();
    var done = AGENDA_ITEMS.filter(function (it) {
      return agenda[it.id];
    }).map(function (it) {
      return "✅ " + it.label;
    });
    var pend = AGENDA_ITEMS.filter(function (it) {
      return !agenda[it.id];
    }).map(function (it) {
      return "⬜ " + it.label;
    });

    var goal = full && full.goal ? full.goal : "—";
    var notes = notesPlain();

    return (
      "📋 *Derecepanel · Görüşme Özeti*\n" +
      "📅 " +
      new Date().toLocaleString("tr-TR") +
      "\n\n" +
      "👤 *Öğrenci:* " +
      (cat ? cat.name : "—") +
      "\n" +
      "🎓 *Hedef:* " +
      goal +
      "\n" +
      "🧠 *Ruh hali:* " +
      moodLine +
      "\n\n" +
      "🗂️ *Görüşme planı*\n" +
      (done.concat(pend).join("\n") || "—") +
      "\n\n" +
      "📝 *Notlar*\n" +
      (notes || "—") +
      "\n\n" +
      "_Koçluk ekibi · Strateji Merkezi_"
    );
  }

  var __goModalDepth = 0;

  function openGoModal(el) {
    if (!el) return;
    el.classList.add("go-modal-open");
    el.setAttribute("aria-hidden", "false");
    __goModalDepth++;
    if (__goModalDepth === 1) {
      try {
        document.documentElement.classList.add("go-modal-scroll-lock");
      } catch (eLock) {}
    }
  }

  function closeGoModal(el) {
    if (!el) return;
    if (!el.classList.contains("go-modal-open")) return;
    el.classList.remove("go-modal-open");
    el.setAttribute("aria-hidden", "true");
    __goModalDepth = Math.max(0, __goModalDepth - 1);
    if (__goModalDepth === 0) {
      try {
        document.documentElement.classList.remove("go-modal-scroll-lock");
      } catch (eUnlock) {}
    }
  }

  function openSummaryModal() {
    if (!elModalSummary || !elSummaryText) return;
    try {
      elSummaryText.value = buildSummaryText();
    } catch (e) {
      elSummaryText.value = "Özet oluşturulamadı.";
    }
    openGoModal(elModalSummary);
  }

  function closeSummaryModal() {
    if (!elModalSummary) return;
    closeGoModal(elModalSummary);
  }

  function copySummary() {
    var t = elSummaryText ? elSummaryText.value : "";
    if (!t) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(
        function () {
          showToast("Özet panoya kopyalandı.");
        },
        function () {
          fallbackCopy(t);
        }
      );
    } else fallbackCopy(t);
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("Özet kopyalandı.");
    } catch (e) {
      showToast("Kopyalama başarısız.", true);
    }
  }

  function whatsappSummary() {
    var t = elSummaryText ? elSummaryText.value : "";
    if (!t) return;
    var url = "https://wa.me/?text=" + encodeURIComponent(t);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function parseTime(iso) {
    if (!iso) return 0;
    var t = Date.parse(String(iso));
    return isNaN(t) ? 0 : t;
  }

  function readJsonArray(key) {
    try {
      var raw = localStorage.getItem(key);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function getCatalogStudent() {
    if (!selectedCatalogId) return null;
    var m = window.DereceStudentCatalogById || {};
    return m[selectedCatalogId] || null;
  }

  function examMatchesStudent(rec, cat) {
    if (!rec || !cat) return false;
    var sid = String(rec.studentId || "").trim();
    if (sid && sid === String(cat.id || "").trim()) return true;
    var sc = String(rec.studentCode || "").trim();
    if (sc && sc === String(cat.code || "").trim()) return true;
    var nm = String(rec.studentName || rec.name || "").trim();
    if (nm && nm === String(cat.name || "").trim()) return true;
    return false;
  }

  function mergedExamResultsForStudent(cat) {
    var byExam = {};
    function ingest(rec) {
      if (!rec || rec.examId == null || rec.examId === "") return;
      if (!examMatchesStudent(rec, cat)) return;
      var k = String(rec.examId);
      var prev = byExam[k];
      if (!prev || String(rec.savedAt || "") >= String(prev.savedAt || "")) byExam[k] = rec;
    }
    readJsonArray("examResults").forEach(ingest);
    readJsonArray("examResults_" + String(cat.id || "").trim()).forEach(ingest);
    return Object.keys(byExam).map(function (k) {
      return byExam[k];
    });
  }

  function sortHistoryRows(rows) {
    return rows.slice().sort(function (a, b) {
      var ta = parseTime(a.savedAt) || parseTime(a.date) || 0;
      var tb = parseTime(b.savedAt) || parseTime(b.date) || 0;
      if (tb !== ta) return tb - ta;
      return String(b.examId || "").localeCompare(String(a.examId || ""));
    });
  }

  function formatNet(rec) {
    var n = Number(rec && rec.net);
    if (isNaN(n)) return "—";
    return String(Math.round(n * 100) / 100);
  }

  function formatWhen(rec) {
    var iso = (rec && (rec.savedAt || rec.date)) || "";
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
    } catch (e) {
      return String(iso);
    }
  }

  /** kd- / pkg- vb. teknik kimlikleri kullanıcıya gösterme */
  function looksLikeTechnicalExamToken(s) {
    var t = String(s || "").trim();
    if (!t) return true;
    if (/^kd-/i.test(t)) return true;
    if (/^pkg-/i.test(t)) return true;
    return false;
  }

  /** Takvim satırından deneme adı; öğrenci adına karışabilecek `name` en sonda. */
  function calendarExamName(ex) {
    if (!ex) return "";
    var prefer = [
      ex.denemeAdi,
      ex.deneme_adi,
      ex.ad,
      ex.label,
      ex.displayName,
      ex.denemeLabel,
      ex.shortTitle,
      ex.kisaAd,
      ex.kisa_ad,
      ex.title,
      ex.examName,
      ex.baslik,
      ex.sinavAdi,
      ex.sinav_adi,
      ex.examTitle,
      ex.name,
    ];
    for (var pi = 0; pi < prefer.length; pi++) {
      var s = String(prefer[pi] == null ? "" : prefer[pi]).trim();
      if (!s) continue;
      if (looksLikeTechnicalExamToken(s)) continue;
      return s;
    }
    return "";
  }

  /** Takvim / katalog satırından okunabilir deneme adı (global + kurum). */
  function denemeTitleFromCalendarRow(ex) {
    return calendarExamName(ex);
  }

  /**
   * examResults kayıtlarında sıkça examId (kd-…) var; isim takvimde tutulur.
   * @returns {Record<string, string>}
   */
  function buildDenemeIdToNameMap() {
    var map = {};
    function ingest(arr) {
      if (!Array.isArray(arr)) return;
      for (var i = 0; i < arr.length; i++) {
        var ex = arr[i];
        if (!ex || ex.id == null) continue;
        var id = String(ex.id).trim();
        var nm = denemeTitleFromCalendarRow(ex);
        if (id && nm && map[id] == null) map[id] = nm;
      }
    }
    ingest(readJsonArray("kurumsalExams"));
    ingest(readJsonArray("kurum_denemeler_v1"));
    ingest(readJsonArray("globalExams"));
    ingest(readJsonArray("global_denemeler_v1"));
    return map;
  }

  /** examId ile takvim havuzlarında tek satır bul (haritalama atlanmış olsa bile). */
  function goFindExamCalendarRow(examId) {
    var m = goFindExamCalendarMeta(examId);
    return m ? m.row : null;
  }

  function goInferExamSourceType(row) {
    if (!row || typeof row !== "object") return "DIGER";
    if (row.isGlobal === true) return "GLOBAL";
    if (row.isGlobal === false) return "KURUMSAL";
    return "DIGER";
  }

  /**
   * Takvim havuzlarında examId arar; satırda isGlobal yoksa hangi dizide bulunduğuna göre GLOBAL/KURUMSAL verir.
   * @returns {{ row: object, sourceType: string } | null}
   */
  function goFindExamCalendarMeta(examId) {
    var id = examId != null ? String(examId).trim() : "";
    if (!id) return null;
    var buckets = [
      { arr: readJsonArray("global_denemeler_v1"), type: "GLOBAL" },
      { arr: readJsonArray("globalExams"), type: "GLOBAL" },
      { arr: readJsonArray("kurum_denemeler_v1"), type: "KURUMSAL" },
      { arr: readJsonArray("kurumsalExams"), type: "KURUMSAL" },
    ];
    for (var b = 0; b < buckets.length; b++) {
      var arr = buckets[b].arr;
      if (!Array.isArray(arr)) continue;
      for (var i = 0; i < arr.length; i++) {
        var ex = arr[i];
        if (!ex || ex.id == null) continue;
        if (String(ex.id).trim() !== id) continue;
        var inferred = goInferExamSourceType(ex);
        var sourceType = inferred !== "DIGER" ? inferred : buckets[b].type;
        return { row: ex, sourceType: sourceType };
      }
    }
    return null;
  }

  /** kd-/pkg- veya ham examId’nin kullanıcıya başlık olarak gösterilmesini engelle. */
  function sanitizeUserExamTitle(str, rec, eid) {
    var t = String(str || "").trim();
    if (!t || t === "Bilinmeyen Kaynak") return "";
    if (looksLikeTechnicalExamToken(t)) return "";
    var e = eid != null ? String(eid).trim() : "";
    if (e && t === e) return "";
    if (rec && matchesStudentIdentity(rec, t)) return "";
    return t;
  }

  function invalidateExamCatalogCaches() {
    __goExamIdDetailsMap = null;
  }

  /**
   * Global ve kurumsal takvim dizilerinde examId arar (önce global_denemeler_v1 / globalExams, sonra kurum).
   * @returns {Record<string, { name: string, type: string }>}
   */
  function buildExamIdToDetailsMap() {
    if (__goExamIdDetailsMap) return __goExamIdDetailsMap;
    var map = {};
    function add(arr, type) {
      if (!Array.isArray(arr)) return;
      for (var i = 0; i < arr.length; i++) {
        var ex = arr[i];
        if (!ex || ex.id == null) continue;
        var id = String(ex.id).trim();
        if (!id || map[id]) continue;
        var nm = calendarExamName(ex);
        if (!nm) continue;
        map[id] = { name: nm, type: type };
      }
    }
    add(readJsonArray("global_denemeler_v1"), "GLOBAL");
    add(readJsonArray("globalExams"), "GLOBAL");
    add(readJsonArray("kurum_denemeler_v1"), "KURUMSAL");
    add(readJsonArray("kurumsalExams"), "KURUMSAL");
    __goExamIdDetailsMap = map;
    return map;
  }

  /**
   * @param {*} id examId
   * @returns {{ name: string, type: "GLOBAL"|"KURUMSAL"|"DIGER" }}
   */
  function getExamDetails(id) {
    var rawId = id != null ? String(id).trim() : "";
    if (!rawId) return { name: "", type: "DIGER" };
    var hit = buildExamIdToDetailsMap()[rawId];
    if (hit && hit.name) return { name: hit.name, type: hit.type };
    var row = goFindExamCalendarRow(rawId);
    var nm = row ? calendarExamName(row) : "";
    if (nm && !looksLikeTechnicalExamToken(nm)) {
      return { name: nm, type: goInferExamSourceType(row) };
    }
    try {
      var Api = window.DereceStudentKarneApi;
      if (Api && typeof Api.findExamById === "function") {
        var kx = Api.findExamById(rawId);
        nm = kx ? calendarExamName(kx) : "";
        if (nm && !looksLikeTechnicalExamToken(nm)) {
          return { name: nm, type: goInferExamSourceType(kx) };
        }
      }
    } catch (eK) {}
    return { name: "", type: "DIGER" };
  }

  function normTrLo(s) {
    return String(s || "")
      .trim()
      .toLocaleLowerCase("tr-TR");
  }

  /** examResults’ta name/studentName öğrenciye aittir; başlıkta kullanılmamalı */
  function matchesStudentIdentity(rec, cand) {
    var c = normTrLo(cand);
    if (!c) return false;
    var ids = [
      normTrLo(rec.studentName),
      normTrLo(rec.name),
      normTrLo(rec.studentId),
      normTrLo(rec.studentCode),
    ].filter(Boolean);
    for (var i = 0; i < ids.length; i++) {
      if (ids[i] && c === ids[i]) return true;
    }
    return false;
  }

  /**
   * Sonuç kaydı + takvim eşlemesi ile kullanıcıya gösterilecek deneme başlığı.
   * Öğrenci adı (name / studentName) asla başlık olarak kullanılmaz.
   */
  function formatExamDisplayLabel(rec, idToName) {
    if (!rec) return "Bilinmeyen Kaynak";
    var eid = rec.examId != null ? String(rec.examId).trim() : "";
    var candidates = [
      rec.examName,
      rec.examTitle,
      rec.denemeAdi,
      rec.deneme_adi,
      rec.baslik,
      rec.examLabel,
      rec.exam_label,
      rec.label,
      rec.displayName,
      rec.sinavAdi,
      rec.sinav_adi,
    ];
    var fromRec = "";
    for (var ci = 0; ci < candidates.length; ci++) {
      var cand = String(candidates[ci] == null ? "" : candidates[ci]).trim();
      if (!cand) continue;
      if (eid && cand === eid) continue;
      if (looksLikeTechnicalExamToken(cand)) continue;
      if (matchesStudentIdentity(rec, cand)) continue;
      fromRec = cand;
      break;
    }
    if (fromRec) {
      var sf = sanitizeUserExamTitle(fromRec, rec, eid);
      if (sf) return sf;
    }
    if (eid && idToName && idToName[eid]) {
      var mapped = String(idToName[eid]).trim();
      var sm = sanitizeUserExamTitle(mapped, rec, eid);
      if (sm) return sm;
    }
    return "Bilinmeyen Kaynak";
  }

  /** Geçmiş deneme listesi: katalog + kayıt alanları; başlık ve kaynak rozeti. */
  function resolveExamHistoryDisplay(rec) {
    if (!rec) return { title: "Kayıtlı deneme", sourceType: "DIGER" };
    var eid = rec.examId != null ? String(rec.examId).trim() : "";

    function pack(title, sourceType) {
      var t = sanitizeUserExamTitle(title, rec, eid);
      if (!t) return null;
      return { title: t, sourceType: sourceType || "DIGER" };
    }

    var meta = eid ? goFindExamCalendarMeta(eid) : null;
    var row = meta ? meta.row : null;
    var p = pack(row ? calendarExamName(row) : "", meta ? meta.sourceType : "DIGER");
    if (p) return p;

    try {
      var Api = window.DereceStudentKarneApi;
      if (Api && typeof Api.findExamById === "function" && eid) {
        var kEx = Api.findExamById(eid);
        var kSrc = kEx ? goInferExamSourceType(kEx) : "DIGER";
        if (kSrc === "DIGER") {
          var detK = getExamDetails(eid);
          if (detK.type && detK.type !== "DIGER") kSrc = detK.type;
        }
        p = pack(kEx ? calendarExamName(kEx) : "", kSrc);
        if (p) return p;
      }
    } catch (eKr) {}

    var det = getExamDetails(eid);
    p = pack(det.name, det.type);
    if (p) return p;

    var idToName = buildDenemeIdToNameMap();
    var lbl = formatExamDisplayLabel(rec, idToName);
    p = pack(lbl, det.type || "DIGER");
    if (p) return p;

    return { title: "Kayıtlı deneme", sourceType: "DIGER" };
  }

  /** Kaynak rozeti (Tailwind; #tw-scope important ile uyumlu) */
  function examSourceBadgeHtml(sourceType) {
    var label = sourceType === "GLOBAL" ? "GLOBAL" : sourceType === "KURUMSAL" ? "KURUMSAL" : "DİĞER";
    var cls =
      sourceType === "GLOBAL"
        ? "bg-blue-500/20 text-blue-400"
        : sourceType === "KURUMSAL"
          ? "bg-purple-500/20 text-purple-400"
          : "bg-slate-500/25 text-slate-500 dark:bg-slate-600/35 dark:text-slate-300";
    return (
      '<span class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ' +
      cls +
      '">' +
      esc(label) +
      "</span>"
    );
  }

  var SUBJECT_BADGE_ORDER = [
    { id: "tyt_tr", short: "TR", label: "Türkçe" },
    { id: "tyt_mat", short: "Mat", label: "Matematik" },
    { id: "tyt_sos", short: "Sos", label: "Sosyal" },
    { id: "tyt_fen", short: "Fen", label: "Fen" },
  ];

  function mergeBranchNetsFromRecord(rec) {
    var out = {};
    function putForce(k, v) {
      var n = Number(v);
      if (!Number.isFinite(n)) return;
      out[k] = Math.round(n * 100) / 100;
    }
    function putIfMissing(k, v) {
      if (out[k] != null) return;
      putForce(k, v);
    }
    try {
      if (rec && rec.nsBranchNets && typeof rec.nsBranchNets === "object") {
        Object.keys(rec.nsBranchNets).forEach(function (k) {
          putForce(k, rec.nsBranchNets[k]);
        });
      }
      if (rec && rec.branchNets && typeof rec.branchNets === "object") {
        Object.keys(rec.branchNets).forEach(function (k) {
          putIfMissing(k, rec.branchNets[k]);
        });
      }
      var Bridge = window.DereceOgrenciSimBridge;
      if (Bridge && typeof Bridge.computeNsBranchNetsFromRecord === "function") {
        var comp = Bridge.computeNsBranchNetsFromRecord(rec) || {};
        Object.keys(comp).forEach(function (k) {
          putIfMissing(k, comp[k]);
        });
      }
    } catch (eBr) {}
    return out;
  }

  /** TY kolonları için rozet HTML’i (#tw-scope içi Tailwind sınıfları) */
  function formatSubjectNetBadgesHtml(rec) {
    var nets = mergeBranchNetsFromRecord(rec);
    var parts = [];
    for (var i = 0; i < SUBJECT_BADGE_ORDER.length; i++) {
      var b = SUBJECT_BADGE_ORDER[i];
      var v = nets[b.id];
      if (v == null || !Number.isFinite(v)) continue;
      var s = Math.round(v * 100) / 100;
      var fs = Math.abs(s - Math.round(s)) > 1e-6 ? String(s.toFixed(2)) : String(Math.round(s));
      parts.push(
        '<span class="go-subject-badge" title="' +
          esc(b.label) +
          '">' +
          esc(b.short) +
          " " +
          esc(fs) +
          "</span>"
      );
    }
    if (!parts.length) return "";
    return '<div class="mt-1 flex flex-wrap gap-1">' + parts.join("") + "</div>";
  }

  /** Takvim kataloglarında exam id ile eşleşen okunabilir ad (bulunamazsa ""). */
  function getDenemeNameById(examId) {
    var d = getExamDetails(examId);
    if (d.name) return d.name;
    var id = examId != null ? String(examId).trim() : "";
    if (!id) return "";
    var m = buildDenemeIdToNameMap();
    return m[id] || "";
  }
  try {
    window.getDenemeNameById = getDenemeNameById;
  } catch (eExp) {}

  function weeklyProgramsForStudent(studentId) {
    try {
      var raw = localStorage.getItem(LS_WEEKLY);
      var all = raw ? JSON.parse(raw) : {};
      if (!all || typeof all !== "object") return [];
      var list = all[studentId];
      return Array.isArray(list) ? list.slice() : [];
    } catch (e) {
      return [];
    }
  }

  function countProgramTasks(days) {
    if (!Array.isArray(days)) return 0;
    var n = 0;
    for (var i = 0; i < days.length; i++) {
      var d = days[i];
      if (d && Array.isArray(d.tasks)) n += d.tasks.length;
    }
    return n;
  }

  /** --- Deneme Matrisi (konu analizi) --- */
  var dmSubjectOrder = [];
  var dmAllRows = [];
  /** Açık ders paneli indeksi; -1 = tümü kapalı */
  var dmOpenSubjectIdx = 0;
  /** Gömülü Konu MR senkronu — seçili denemenin TYT/AYT anahtarı */
  var dmExamKeyForMr = "TYT";

  function dmExamSinavKey(examRow) {
    var s = String((examRow && (examRow.sinav || examRow.tur)) || "TYT").toUpperCase();
    if (s === "AYT") return "AYT";
    if (s === "YDT") return "YDT";
    return "TYT";
  }

  /** Konu MR yalnız TYT/AYT bilir; YDT → TYT */
  function dmMrExamKeyFromRow(examRow) {
    var k = dmExamSinavKey(examRow);
    if (k === "AYT") return "AYT";
    return "TYT";
  }

  function dmLayoutCellAt(examRow, qNo) {
    if (!examRow || typeof window.getExamLayout !== "function") return null;
    try {
      var lay = window.getExamLayout(dmExamSinavKey(examRow));
      var i = qNo - 1;
      if (!lay || !lay.byIndex || i < 0 || i >= lay.byIndex.length) return null;
      return lay.byIndex[i];
    } catch (e) {
      return null;
    }
  }

  function dmNormalizeLetter(c) {
    return String(c || "")
      .toUpperCase()
      .replace(/[^A-E]/g, "")
      .charAt(0) || "";
  }

  function dmBuildKeyString(examRow, n) {
    var arr = (examRow && examRow.cevaplar) || [];
    var s = "";
    for (var i = 0; i < n; i++) {
      var L = dmNormalizeLetter(arr[i]);
      s += L || " ";
    }
    while (s.length < n) s += " ";
    return s.slice(0, n);
  }

  function dmBuildStudentAnswers(rec, n) {
    var raw = String((rec && rec.answers) || "")
      .toUpperCase()
      .replace(/[^A-E]/g, "");
    while (raw.length < n) raw += " ";
    return raw.slice(0, n);
  }

  function dmInferQuestionCount(mx, examRow, rec) {
    var n = 0;
    if (examRow && Array.isArray(examRow.cevaplar)) n = Math.max(n, examRow.cevaplar.length);
    if (rec && rec.answers != null) n = Math.max(n, String(rec.answers).length);
    try {
      if (examRow && typeof window.getExamLayout === "function") {
        var sinav = String(examRow.sinav || examRow.tur || "TYT").toUpperCase();
        var layKey = sinav === "AYT" ? "AYT" : sinav === "YDT" ? "YDT" : "TYT";
        var lay = window.getExamLayout(layKey);
        if (lay && lay.n) n = Math.max(n, lay.n);
      }
    } catch (eLay) {}
    if (mx && mx.questionCount) n = Math.max(n, +mx.questionCount);
    return n;
  }

  function dmMatrixResultByQNo(studentId, examId) {
    var EM = window.ExamMatrix;
    if (!EM || typeof EM.getResultsByStudent !== "function" || !studentId || !examId) return {};
    var rows = EM.getResultsByStudent(String(studentId));
    var hit = null;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].examId) === String(examId)) {
        hit = rows[i];
        break;
      }
    }
    var map = {};
    (hit && hit.answers ? hit.answers : []).forEach(function (a) {
      map[+a.qNo] = String(a.result || "empty");
    });
    return map;
  }

  function dmFindExamRowKarne(examId) {
    var Api = window.DereceStudentKarneApi;
    if (Api && typeof Api.findExamById === "function") return Api.findExamById(examId);
    return null;
  }

  function dmExamOptionLabel(rec) {
    var disp = resolveExamHistoryDisplay(rec);
    var det = getExamDetails(rec && rec.examId);
    var suffix = det.type === "GLOBAL" ? " [Global]" : det.type === "KURUMSAL" ? " [Kurumsal]" : "";
    return disp.title + suffix;
  }

  function dmLetterCell(ch) {
    var c = String(ch || "");
    if (!c || c === " ") return "—";
    return c;
  }

  function dmStatusFromSignals(keyCh, stCh, matrixRes) {
    var kOk = keyCh && keyCh !== " ";
    var sOk = stCh && stCh !== " ";
    if (kOk) {
      if (!sOk) return "Boş";
      if (stCh === keyCh) return "Doğru";
      return "Yanlış";
    }
    if (matrixRes === "correct") return "Doğru";
    if (matrixRes === "wrong") return "Yanlış";
    if (matrixRes === "empty") return "Boş";
    if (!sOk) return "Boş";
    return "—";
  }

  function dmStatusClass(st) {
    if (st === "Doğru") return "text-green-500 font-semibold";
    if (st === "Yanlış") return "text-red-500 font-semibold";
    return "text-gray-400";
  }

  /**
   * Matris soru objesinden yalnızca gerçek konu metni (ders adı / blok başlığı değil).
   * Kayıtlı alan adları farklı varyantlarda olabilir.
   */
  function dmPickTopicFromQuestion(q) {
    if (!q || typeof q !== "object") return "Genel";
    var keys = [
      "topicName",
      "topic",
      "konu",
      "konuAdi",
      "konu_adi",
      "kavram",
      "conceptName",
      "concept",
      "topic_label",
      "topicLabel",
      "mufredatKonu",
      "mufredat_konu",
    ];
    for (var i = 0; i < keys.length; i++) {
      var v = q[keys[i]];
      if (v == null) continue;
      var s = String(v).trim();
      if (!s) continue;
      return s;
    }
    var sidQ = String(q.subjectId || "").trim();
    var tidQ = String(q.topicId || "").trim();
    if (sidQ && tidQ && window.YksMufredatApi && typeof window.YksMufredatApi.getTopics === "function") {
      var topics = window.YksMufredatApi.getTopics(sidQ) || [];
      for (var j = 0; j < topics.length; j++) {
        if (topics[j].id === tidQ) {
          var nm = String(topics[j].name || "").trim();
          if (nm) return nm;
          break;
        }
      }
    }
    return "Genel";
  }

  /**
   * Kurumsal / global deneme takvimindeki soru bazlı matris (konu[], konuYazi[]).
   * konu hücresi: "subjectId|topicId|conceptId" (kurum-deneme-takvimi kaydı).
   */
  function dmResolveTopicFromTakvimExam(examRow, qNo, layoutSubjectId) {
    if (!examRow || !qNo || qNo < 1) return "";
    var idx = qNo - 1;
    var yazi = examRow.konuYazi;
    if (Array.isArray(yazi) && idx >= 0 && idx < yazi.length) {
      var yz = String(yazi[idx] || "").trim();
      if (yz) return yz;
    }
    var kArr = examRow.konu;
    if (!Array.isArray(kArr) || idx < 0 || idx >= kArr.length) return "";
    var raw = String(kArr[idx] || "").trim();
    if (!raw) return "";

    var Api = window.YksMufredatApi;
    var parts = raw.split("|");
    var sid = String((parts[0] || "").trim() || String(layoutSubjectId || "").trim());
    var tid = String((parts[1] || "").trim());
    var cid = String((parts[2] || "").trim());

    if (Api && sid && tid && typeof Api.getTopics === "function") {
      var topics = Api.getTopics(sid) || [];
      var topicName = "";
      for (var ti = 0; ti < topics.length; ti++) {
        if (topics[ti].id === tid) {
          topicName = String(topics[ti].name || "").trim();
          break;
        }
      }
      if (cid && typeof Api.getConcepts === "function") {
        var conc = Api.getConcepts(sid, tid) || [];
        var kavram = "";
        for (var ci = 0; ci < conc.length; ci++) {
          if (conc[ci].id === cid) {
            kavram = String(conc[ci].name || "").trim();
            break;
          }
        }
        if (topicName && kavram) return topicName + " — " + kavram;
        if (kavram) return kavram;
      }
      if (topicName) return topicName;
    }
    if (sid && Api && typeof Api.getSubject === "function" && !tid) {
      var sub = Api.getSubject(sid);
      if (sub && String(sub.name || "").trim()) return String(sub.name).trim();
    }
    return raw;
  }

  function dmMergeTopicFromTakvim(topicFromMatrix, examRow, qNo, layoutSubjectId) {
    var t = String(topicFromMatrix || "").trim();
    if (t && t !== "Genel") return t;
    var tv = dmResolveTopicFromTakvimExam(examRow, qNo, layoutSubjectId);
    return tv ? tv : t || "Genel";
  }

  /** Müfredat subjectId / topicId — takvim konu[] pipe veya ExamMatrix sorusu */
  function dmParseMufIds(examRow, qNo, cell, q) {
    var idx = qNo - 1;
    var subj = "";
    var topicId = "";
    if (q && typeof q === "object") {
      if (q.subjectId) subj = String(q.subjectId).trim();
      if (q.topicId) topicId = String(q.topicId).trim();
    }
    var kArr = examRow && examRow.konu;
    if (Array.isArray(kArr) && idx >= 0 && idx < kArr.length) {
      var raw = String(kArr[idx] || "").trim();
      var p = raw.split("|");
      var ps = (p[0] || "").trim();
      var pt = (p[1] || "").trim();
      if (ps) subj = ps;
      if (pt) topicId = pt;
    }
    if (!subj && cell && cell.subjectId) subj = String(cell.subjectId).trim();
    return { mufSubjectId: subj, mufTopicId: topicId };
  }

  function syncMrEmbedExamKey(examKey) {
    var k = String(examKey || "TYT").toUpperCase() === "AYT" ? "AYT" : "TYT";
    try {
      document.querySelectorAll("#tw-scope [data-mr-mount]").forEach(function (root) {
        if (typeof root.__mrSetExam === "function") root.__mrSetExam(k);
      });
    } catch (eMr) {}
  }

  function syncMrEmbedStudent() {
    try {
      document.querySelectorAll("#tw-scope [data-mr-mount]").forEach(function (root) {
        if (typeof root.__mrSelectStudent !== "function") return;
        if (selectedCatalogId) root.__mrSelectStudent(selectedCatalogId, true);
        else root.__mrSelectStudent("", true);
      });
    } catch (e2) {}
  }

  function dmBuildRowBundle(rec, examId, studentId) {
    var mx = window.ExamMatrix && window.ExamMatrix.getMatrix ? window.ExamMatrix.getMatrix(examId) : null;
    var examRow = dmFindExamRowKarne(examId);
    var n = 0;
    var rows = [];
    var matrixMap = dmMatrixResultByQNo(studentId, examId);

    if (mx && mx.questions && mx.questions.length) {
      var maxQ = 0;
      for (var qi = 0; qi < mx.questions.length; qi++) {
        var qq = +mx.questions[qi].qNo;
        if (qq > maxQ) maxQ = qq;
      }
      n = maxQ || mx.questions.length;
    } else {
      n = dmInferQuestionCount(mx, examRow, rec);
    }
    if (!n || n < 1) n = 1;

    var keyStr = dmBuildKeyString(examRow, n);
    var stStr = dmBuildStudentAnswers(rec, n);

    if (mx && mx.questions && mx.questions.length) {
      var sorted = mx.questions.slice().sort(function (a, b) {
        return (+a.qNo || 0) - (+b.qNo || 0);
      });
      sorted.forEach(function (q) {
        var qNo = +q.qNo;
        if (!qNo || qNo < 1) return;
        var i = qNo - 1;
        var keyCh = i >= 0 && i < keyStr.length ? keyStr.charAt(i) : " ";
        var stCh = i >= 0 && i < stStr.length ? stStr.charAt(i) : " ";
        var cell = dmLayoutCellAt(examRow, qNo);
        var secTitle = cell && String(cell.sectionTitle || "").trim();
        var subj = String(q.subjectName || "").trim();
        if (!subj && secTitle) subj = secTitle;
        if (!subj) subj = "Genel";
        var layoutSid = (cell && cell.subjectId) || (q && q.subjectId) || "";
        var topic = dmMergeTopicFromTakvim(dmPickTopicFromQuestion(q), examRow, qNo, layoutSid);
        var status = dmStatusFromSignals(keyCh, stCh, matrixMap[qNo]);
        var mufIds = dmParseMufIds(examRow, qNo, cell, q);
        rows.push({
          qNo: qNo,
          subject: subj,
          topic: topic,
          mufSubjectId: mufIds.mufSubjectId,
          mufTopicId: mufIds.mufTopicId,
          keyDisp: dmLetterCell(keyCh),
          studentDisp: dmLetterCell(stCh),
          status: status,
        });
      });
    } else {
      for (var qn = 1; qn <= n; qn++) {
        var j = qn - 1;
        var kch = j < keyStr.length ? keyStr.charAt(j) : " ";
        var sch = j < stStr.length ? stStr.charAt(j) : " ";
        var st = dmStatusFromSignals(kch, sch, matrixMap[qn]);
        var cell2 = dmLayoutCellAt(examRow, qn);
        var sec2 = cell2 && String(cell2.sectionTitle || "").trim();
        var subj2 = sec2 || "Tümü";
        var layoutSid2 = cell2 && cell2.subjectId ? cell2.subjectId : "";
        var topic2 = dmMergeTopicFromTakvim("Genel", examRow, qn, layoutSid2);
        var muf2 = dmParseMufIds(examRow, qn, cell2, null);
        rows.push({
          qNo: qn,
          subject: subj2,
          topic: topic2,
          mufSubjectId: muf2.mufSubjectId,
          mufTopicId: muf2.mufTopicId,
          keyDisp: dmLetterCell(kch),
          studentDisp: dmLetterCell(sch),
          status: st,
        });
      }
    }

    var order = [];
    var seen = {};
    rows.forEach(function (r) {
      var s = r.subject;
      if (!seen[s]) {
        seen[s] = true;
        order.push(s);
      }
    });

    return { subjectOrder: order, rows: rows, examKey: dmMrExamKeyFromRow(examRow) };
  }

  function dmTableHtml(list) {
    var tbl =
      '<div class="overflow-x-auto rounded-lg border border-[color:var(--header-border)] bg-[color:var(--surface)]">' +
      '<table class="min-w-full border-collapse text-left text-sm">' +
      '<thead><tr class="border-b border-[color:var(--header-border)] text-[11px] uppercase tracking-wide text-[color:var(--text-muted)]">' +
      '<th class="whitespace-nowrap px-2 py-2 font-bold">Soru</th>' +
      '<th class="min-w-[140px] px-2 py-2 font-bold">Konu</th>' +
      '<th class="whitespace-nowrap px-2 py-2 font-bold">Doğru</th>' +
      '<th class="whitespace-nowrap px-2 py-2 font-bold">Öğrenci</th>' +
      '<th class="whitespace-nowrap px-2 py-2 font-bold">Durum</th>' +
      "</tr></thead><tbody>";
    list.forEach(function (r) {
      tbl +=
        '<tr class="border-t border-[color:var(--header-border)]/80">' +
        '<td class="whitespace-nowrap px-2 py-2 font-mono text-[color:var(--text-primary)]">' +
        esc(String(r.qNo)) +
        "</td>" +
        '<td class="max-w-[min(100%,280px)] px-2 py-2 leading-snug text-[color:var(--text-primary)]">' +
        esc(r.topic) +
        "</td>" +
        '<td class="whitespace-nowrap px-2 py-2 font-mono text-[color:var(--text-primary)]">' +
        esc(r.keyDisp) +
        "</td>" +
        '<td class="whitespace-nowrap px-2 py-2 font-mono text-[color:var(--text-primary)]">' +
        esc(r.studentDisp) +
        "</td>" +
        '<td class="whitespace-nowrap px-2 py-2 ' +
        dmStatusClass(r.status) +
        '">' +
        esc(r.status) +
        "</td>" +
        "</tr>";
    });
    tbl += "</tbody></table></div>";
    return tbl;
  }

  function renderDmSubjectAccordions() {
    if (!elDmSubjectsHost) return;
    elDmSubjectsHost.innerHTML = "";
    if (!dmSubjectOrder.length) {
      elDmSubjectsHost.innerHTML =
        '<p class="rounded-lg border border-dashed border-[color:var(--header-border)] px-4 py-6 text-sm text-[color:var(--text-muted)]">Bu deneme için satır üretilemedi.</p>';
      return;
    }
    dmSubjectOrder.forEach(function (subj, idx) {
      var list = dmAllRows.filter(function (r) {
        return r.subject === subj;
      });
      var open = idx === dmOpenSubjectIdx;
      var block = document.createElement("div");
      block.className =
        "overflow-hidden rounded-xl border border-[color:var(--header-border)] bg-[color:var(--surface)] shadow-sm";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-bold text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-muted)]/55";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.dataset.goDmSubjectToggle = String(idx);
      var chev = document.createElement("span");
      chev.className = "shrink-0 text-xs font-normal text-[color:var(--text-muted)]";
      chev.textContent = open ? "Gizle ▲" : "Aç ▼";
      var lab = document.createElement("span");
      lab.className = "min-w-0 flex-1";
      lab.textContent = subj + (list.length ? " · " + list.length + " soru" : "");
      btn.appendChild(lab);
      btn.appendChild(chev);
      var panel = document.createElement("div");
      if (open) {
        panel.className = "border-t border-[color:var(--header-border)] bg-[color:var(--surface-muted)]/25 px-2 py-3";
        panel.innerHTML = list.length ? dmTableHtml(list) : '<p class="px-2 py-3 text-sm text-gray-400">Bu ders için soru yok.</p>';
      } else {
        panel.className = "hidden";
      }
      block.appendChild(btn);
      block.appendChild(panel);
      elDmSubjectsHost.appendChild(block);
    });
  }

  function dmApplyExam(examId) {
    var exams = window.__goLastExams || [];
    var rec = null;
    for (var i = 0; i < exams.length; i++) {
      if (String(exams[i].examId) === String(examId)) {
        rec = exams[i];
        break;
      }
    }
    if (!rec || !selectedCatalogId) {
      dmSubjectOrder = [];
      dmAllRows = [];
      dmOpenSubjectIdx = -1;
      renderDmSubjectAccordions();
      return;
    }
    var bundle = dmBuildRowBundle(rec, examId, selectedCatalogId);
    dmSubjectOrder = bundle.subjectOrder;
    dmAllRows = bundle.rows;
    dmExamKeyForMr = bundle.examKey || "TYT";
    syncMrEmbedExamKey(dmExamKeyForMr);
    dmOpenSubjectIdx = dmSubjectOrder.length ? 0 : -1;
    renderDmSubjectAccordions();
  }

  function resetDmPanel(message) {
    if (elDmSelect) {
      elDmSelect.innerHTML = "";
      elDmSelect.disabled = true;
    }
    dmSubjectOrder = [];
    dmAllRows = [];
    dmOpenSubjectIdx = -1;
    if (elDmSubjectsHost) elDmSubjectsHost.innerHTML = "";
    if (elDmHint) elDmHint.textContent = message || "Öğrenci seçildiğinde denemeler listelenir.";
  }

  function renderDmPanel() {
    if (!elDmSelect) return;
    var exams = window.__goLastExams || [];
    var prev = elDmSelect.value;
    elDmSelect.innerHTML = "";
    if (!exams.length) {
      elDmSelect.disabled = true;
      resetDmPanel("Bu öğrenci için yerel deneme sonucu bulunamadı.");
      return;
    }
    if (elDmHint)
      elDmHint.textContent =
        "Deneme seçin; her ders için üstteki düğmeye tıklayınca ilgili sorular tabloda açılır. Konu sütunu: önce ExamMatrix / sınav oluştur matrisi; yoksa kurumsal veya global deneme takvimindeki soru–konu matrisi (konu / konuYazi); o da yoksa blok başlığı.";
    exams.forEach(function (ex) {
      var opt = document.createElement("option");
      opt.value = String(ex.examId);
      opt.textContent = dmExamOptionLabel(ex);
      elDmSelect.appendChild(opt);
    });
    elDmSelect.disabled = false;
    var pick = "";
    for (var j = 0; j < exams.length; j++) {
      if (String(exams[j].examId) === String(prev)) {
        pick = String(prev);
        break;
      }
    }
    if (!pick) pick = String(exams[0].examId);
    elDmSelect.value = pick;
    dmApplyExam(pick);
  }

  function wireDmExamMatrix() {
    if (elDmSelect && !elDmSelect.dataset.goDmWired) {
      elDmSelect.dataset.goDmWired = "1";
      elDmSelect.addEventListener("change", function () {
        dmApplyExam(elDmSelect.value);
      });
    }
    if (elDmSubjectsHost && !elDmSubjectsHost.dataset.goDmWired) {
      elDmSubjectsHost.dataset.goDmWired = "1";
      elDmSubjectsHost.addEventListener("click", function (e) {
        var t = e.target && e.target.closest ? e.target.closest("[data-go-dm-subject-toggle]") : null;
        if (!t || !elDmSubjectsHost.contains(t)) return;
        var ix = parseInt(t.getAttribute("data-go-dm-subject-toggle"), 10);
        if (isNaN(ix) || ix < 0 || ix >= dmSubjectOrder.length) return;
        dmOpenSubjectIdx = dmOpenSubjectIdx === ix ? -1 : ix;
        renderDmSubjectAccordions();
      });
    }
  }

  function renderStudent360() {
    invalidateExamCatalogCaches();
    var cat = getCatalogStudent();
    var full = findStudentFull(selectedCatalogId);

    if (!selectedCatalogId || !cat) {
      if (elCardGoal) elCardGoal.textContent = "Öğrenci seçin";
      if (elCardNet) elCardNet.textContent = "—";
      if (elCardAlan) elCardAlan.textContent = "—";
      if (elTrialsPreview) elTrialsPreview.innerHTML = '<p class="text-sm text-[color:var(--text-muted)]">Öğrenci seçildiğinde özet görünür.</p>';
      if (elProgPreview) elProgPreview.innerHTML = '<p class="text-sm text-[color:var(--text-muted)]">Kayıtlı programlar burada listelenir.</p>';
      if (elGapPanel) elGapPanel.innerHTML = "";
      resetDmPanel("Öğrenci seçildiğinde denemeler listelenir.");
      syncMrEmbedStudent();
      return;
    }

    var goal = full && full.goal ? String(full.goal).trim() : "";
    if (elCardGoal) elCardGoal.textContent = goal || "Henüz hedef girilmemiş";

    var alan = String((full && full.alan) || cat.alan || "—").toUpperCase();
    if (elCardAlan) elCardAlan.textContent = alan;

    var exams = sortHistoryRows(mergedExamResultsForStudent(cat));
    var lastNet = exams.length ? formatNet(exams[0]) : "—";
    if (elCardNet) elCardNet.textContent = lastNet;

    if (elTrialsPreview) {
      elTrialsPreview.innerHTML = "";
      var top = exams.slice(0, 3);
      if (!top.length) {
        elTrialsPreview.innerHTML = '<p class="text-sm text-[color:var(--text-muted)]">Bu öğrenci için yerel deneme sonucu bulunamadı.</p>';
      } else {
        top.forEach(function (ex) {
          var disp = resolveExamHistoryDisplay(ex);
          var row = document.createElement("div");
          row.className =
            "flex flex-col gap-2 rounded-lg border border-[color:var(--header-border)] bg-[color:var(--surface-muted)]/40 px-3 py-2 text-sm sm:flex-row sm:items-start sm:justify-between";
          row.innerHTML =
            '<div class="min-w-0 flex-1">' +
            '<div class="flex min-w-0 flex-wrap items-center gap-2">' +
            examSourceBadgeHtml(disp.sourceType) +
            '<span class="min-w-0 flex-1 truncate font-bold text-[color:var(--text-primary)]">' +
            esc(disp.title) +
            "</span></div>" +
            formatSubjectNetBadgesHtml(ex) +
            '</div><div class="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">' +
            '<span class="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">Toplam</span>' +
            '<span class="go-trial-total-net">' +
            esc(formatNet(ex)) +
            "</span></div>";
          elTrialsPreview.appendChild(row);
        });
      }
    }

    var progs = weeklyProgramsForStudent(cat.id).sort(function (a, b) {
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });
    if (elProgPreview) {
      elProgPreview.innerHTML = "";
      var pt = progs.slice(0, 2);
      if (!pt.length) {
        elProgPreview.innerHTML =
          '<p class="text-sm text-[color:var(--text-muted)]">Kayıtlı haftalık program yok. <a href="haftalik-program-olusturucu.html?student=' +
          encodeURIComponent(cat.id) +
          '" class="font-semibold text-indigo-600 underline underline-offset-2">Oluşturucuya git</a></p>';
      } else {
        pt.forEach(function (p) {
          var div = document.createElement("div");
          div.className = "rounded-lg border border-[color:var(--header-border)] px-3 py-2 text-sm";
          var tasks = countProgramTasks(p.days);
          div.innerHTML =
            '<p class="font-semibold text-[color:var(--text-primary)]">' +
            esc(p.title || "Program") +
            '</p><p class="mt-1 text-xs text-[color:var(--text-muted)]">' +
            esc(tasks + " görev · " + (p.weekStartISO ? p.weekStartISO : "tarih —")) +
            "</p>";
          elProgPreview.appendChild(div);
        });
      }
    }

    window.__goLastExams = exams;
    window.__goLastPrograms = progs;

    renderGapPanel(cat, full, exams);
    renderAgenda();
    renderDmPanel();
    syncMrEmbedStudent();
  }

  function openModalTrials() {
    if (!elModalTrials || !elModalTrialsBody) return;
    invalidateExamCatalogCaches();
    var exams = window.__goLastExams || [];
    elModalTrialsBody.innerHTML = "";
    if (!exams.length) {
      elModalTrialsBody.innerHTML = '<p class="text-sm text-slate-400">Kayıt yok.</p>';
    } else {
      var tbl =
        '<div class="overflow-x-auto rounded-xl border border-slate-600/80 bg-slate-800/40"><table class="min-w-full text-left text-sm"><thead class="bg-slate-800/90 text-[11px] uppercase tracking-wide text-slate-400"><tr><th class="px-3 py-2.5">Deneme</th><th class="px-3 py-2.5">Toplam net</th><th class="px-3 py-2.5">Tarih</th></tr></thead><tbody>';
      exams.forEach(function (ex) {
        var disp = resolveExamHistoryDisplay(ex);
        tbl +=
          "<tr class=\"border-t border-slate-700/90\"><td class=\"max-w-[min(100%,280px)] px-3 py-2 align-top text-slate-100\"><div class=\"flex flex-wrap items-center gap-2\">" +
          examSourceBadgeHtml(disp.sourceType) +
          "<span class=\"min-w-0 font-bold text-slate-50\">" +
          esc(disp.title) +
          "</span></div>" +
          formatSubjectNetBadgesHtml(ex) +
          "</td><td class=\"go-modal-trials-net whitespace-nowrap px-3 py-2 align-top\">" +
          esc(formatNet(ex)) +
          "</td><td class=\"whitespace-nowrap px-3 py-2 align-top text-slate-400\">" +
          esc(formatWhen(ex)) +
          "</td></tr>";
      });
      tbl += "</tbody></table></div>";
      elModalTrialsBody.innerHTML = tbl;
    }
    openGoModal(elModalTrials);
    updateSyncView("Deneme Analizi · Özet paneli");
  }

  function closeModalTrials() {
    if (!elModalTrials) return;
    closeGoModal(elModalTrials);
  }

  function openModalPrograms() {
    if (!elModalProg || !elModalProgBody) return;
    var progs = window.__goLastPrograms || [];
    elModalProgBody.innerHTML = "";
    if (!progs.length) {
      elModalProgBody.innerHTML = '<p class="text-sm text-slate-400">Program kaydı yok.</p>';
    } else {
      progs.forEach(function (p) {
        var art = document.createElement("article");
        art.className =
          "mb-4 rounded-xl border border-slate-600/80 bg-slate-800/50 p-4 shadow-inner last:mb-0";
        var meta =
          '<p class="text-base font-bold text-slate-50">' +
          esc(p.title || "Program") +
          "</p>" +
          '<p class="mt-1 text-xs text-slate-400">' +
          esc("Hafta: " + (p.weekStartISO || "—") + " · Görev: " + countProgramTasks(p.days)) +
          "</p>";
        var extras = "";
        if (p.targetExam) extras += "<p class=\"mt-2 text-sm text-slate-200\"><span class=\"font-semibold text-slate-300\">Hedef sınav:</span> " + esc(p.targetExam) + "</p>";
        if (p.motto) extras += "<p class=\"mt-1 text-sm italic text-slate-400\">" + esc(p.motto) + "</p>";
        art.innerHTML = meta + extras;
        elModalProgBody.appendChild(art);
      });
    }
    openGoModal(elModalProg);
    updateSyncView("Haftalık Program · Özet paneli");
  }

  function closeModalPrograms() {
    if (!elModalProg) return;
    closeGoModal(elModalProg);
  }

  function pauseButtonIdleFresh() {
    return !timerRunning && timerRemainingMs >= timerTotalMs - 50;
  }

  function refreshTimerAdjustButtons() {
    if (elBtnTimerMinus) elBtnTimerMinus.disabled = timerTotalMs <= TIMER_MIN_TOTAL_MS + 50;
    if (elBtnTimerPlus) elBtnTimerPlus.disabled = timerTotalMs >= TIMER_MAX_TOTAL_MS - 50;
  }

  function refreshPauseControls() {
    if (!elBtnPause) return;
    elBtnPause.disabled = !selectedCatalogId || timerRemainingMs <= 0 || pauseButtonIdleFresh();
  }

  function onStudentChanged() {
    if (videoSessionActive) {
      showToast("Öğrenci değişti. Görüntülü oda eski öğrenciye aitti; yeni öğrenci için görüşmeyi yeniden başlatın.", true);
    }
    resetVideoSessionUi();
    clearNotesForFreshSession();
    renderStudent360();
    loadV2NotesFromStorage();
    updateToolbarState();
    if (elBtnStart) elBtnStart.disabled = !selectedCatalogId;
    refreshPauseControls();
    renderMoodBar();
  }

  function updateToolbarState() {
    var ok = !!selectedCatalogId;
    if (elBtnRecete) elBtnRecete.disabled = !ok;
    if (elBtnKaynak) elBtnKaynak.disabled = !ok;
    if (elBtnReceteFooter) elBtnReceteFooter.disabled = !ok;
    if (elBtnKaynakFooter) elBtnKaynakFooter.disabled = !ok;
    if (elBtnSaveFooter) elBtnSaveFooter.disabled = !ok;
    if (elBtnEnd) elBtnEnd.disabled = !ok;
    if (elBtnSaveArchive) elBtnSaveArchive.disabled = !ok;
    if (elBtnVideoStart && !videoSessionActive) elBtnVideoStart.disabled = !ok;
  }

  function writeHandoffPayload() {
    var cat = getCatalogStudent();
    if (!cat) return null;
    return {
      id: cat.id,
      name: cat.name,
      code: cat.code || "",
      receteCanonical: (function () {
        var row = catalogRows.find(function (r) {
          return r.id === cat.id;
        });
        return row ? row.receteCanonical : cat.name;
      })(),
      receteLabel: (function () {
        var row = catalogRows.find(function (r) {
          return r.id === cat.id;
        });
        return row ? row.receteLabel : cat.name;
      })(),
      source: "gorusme-odasi",
      at: new Date().toISOString(),
    };
  }

  function navigateWithHandoff(url, syncModuleName) {
    var payload = writeHandoffPayload();
    if (!payload) return;
    try {
      if (syncModuleName) updateSyncView(syncModuleName);
      sessionStorage.setItem(SESSION_HANDOFF, JSON.stringify(payload));
    } catch (e) {
      window.alert("Oturum köprüsü yazılamadı.");
      return;
    }
    window.location.href = url;
  }

  function stopTimerInterval() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function applyTimerVisual() {
    if (!elTimerText) return;
    var sec = Math.max(0, Math.ceil(timerRemainingMs / 1000));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    elTimerText.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    var denom = timerTotalMs > 0 ? timerTotalMs : TIMER_DEFAULT_MS;
    var pct = Math.max(0, Math.min(1, timerRemainingMs / denom));
    if (elTimerRing) {
      var deg = Math.round(pct * 360);
      elTimerRing.style.setProperty("--go-deg", deg + "deg");
      elTimerRing.classList.toggle("go-timer--warn", pct < 0.12 && pct > 0);
      elTimerRing.classList.toggle("go-timer--done", pct <= 0);
    }
    if (elTimerLabel) {
      var lbl = "Hazır";
      if (timerRemainingMs <= 0) lbl = "Süre doldu";
      else if (timerRunning) lbl = "Görüşme sürüyor";
      else if (timerRemainingMs < timerTotalMs - 50) lbl = "Duraklatıldı";
      elTimerLabel.textContent = lbl;
    }
    if (elTimerFoot) {
      var dm = Math.max(1, Math.round(timerTotalMs / 60000));
      elTimerFoot.textContent =
        dm + " dk hedef · ±5 dk ile süre ayarı · geri sayım";
    }
    refreshTimerAdjustButtons();
  }

  function adjustTimerBySteps(stepSign) {
    var sig = stepSign > 0 ? 1 : stepSign < 0 ? -1 : 0;
    if (!sig) return;
    var step = TIMER_STEP_MS * sig;
    if (step > 0) {
      var add = Math.min(step, TIMER_MAX_TOTAL_MS - timerTotalMs);
      if (add <= 0) return;
      timerTotalMs += add;
      timerRemainingMs += add;
    } else {
      var sub = Math.min(-step, timerTotalMs - TIMER_MIN_TOTAL_MS);
      if (sub <= 0) return;
      timerTotalMs -= sub;
      timerRemainingMs = Math.max(0, timerRemainingMs - sub);
    }
    window.__goAlertedDone = 0;
    applyTimerVisual();
    refreshPauseControls();
  }

  function tickTimer() {
    if (!timerRunning) return;
    timerRemainingMs -= 1000;
    if (timerRemainingMs <= 0) {
      timerRemainingMs = 0;
      timerRunning = false;
      stopTimerInterval();
      if (elBtnPause) {
        elBtnPause.textContent = "Devam";
        elBtnPause.setAttribute("data-state", "paused");
      }
      try {
        if (window.__goAlertedDone !== 1) {
          window.__goAlertedDone = 1;
          if (typeof window.Notification !== "undefined" && Notification.permission === "granted") {
            var dmDone = Math.max(1, Math.round(timerTotalMs / 60000));
            new Notification("Strateji Merkezi", {
              body: dmDone + " dakikalık görüşme süresi doldu.",
            });
          }
        }
      } catch (e) {}
    }
    applyTimerVisual();
    refreshPauseControls();
  }

  function startMeeting() {
    if (!selectedCatalogId) return;
    ensureMeetingSession();
    stopTimerInterval();
    timerRemainingMs = timerTotalMs;
    timerRunning = true;
    window.__goAlertedDone = 0;
    timerInterval = setInterval(tickTimer, 1000);
    if (elBtnPause) {
      elBtnPause.textContent = "Duraklat";
      elBtnPause.setAttribute("data-state", "running");
      elBtnPause.disabled = false;
    }
    applyTimerVisual();
    refreshPauseControls();
    updateSyncView("Görüşme Oturumu · Zamanlayıcı");
    showToast("Görüşme oturumu ve zamanlayıcı başladı.");
  }

  function pauseOrResume() {
    if (!selectedCatalogId || timerRemainingMs <= 0) return;
    if (timerRunning) {
      timerRunning = false;
      stopTimerInterval();
      if (elBtnPause) {
        elBtnPause.textContent = "Devam";
        elBtnPause.setAttribute("data-state", "paused");
      }
    } else {
      timerRunning = true;
      stopTimerInterval();
      timerInterval = setInterval(tickTimer, 1000);
      if (elBtnPause) {
        elBtnPause.textContent = "Duraklat";
        elBtnPause.setAttribute("data-state", "running");
      }
    }
    applyTimerVisual();
    refreshPauseControls();
  }

  function resetTimer() {
    stopTimerInterval();
    timerRunning = false;
    timerTotalMs = TIMER_DEFAULT_MS;
    timerRemainingMs = TIMER_DEFAULT_MS;
    window.__goAlertedDone = 0;
    if (elBtnPause) {
      elBtnPause.textContent = "Duraklat";
      elBtnPause.setAttribute("data-state", "paused");
    }
    applyTimerVisual();
    refreshPauseControls();
  }

  function wireStudentCombo() {
    if (!elComboRoot || !elOgrenci) return;

    if (elListbox) {
      elListbox.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });
      elListbox.addEventListener("click", function (e) {
        var li = e.target.closest(".go-ogrenci-opt");
        if (!li || !elListbox.contains(li)) return;
        pickStudent(li.getAttribute("data-id"), li.getAttribute("data-label"));
      });
    }

    elComboRoot.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    elOgrenci.addEventListener("focus", function () {
      openStudentCombo();
      renderStudentOptions(elOgrenci.value || "");
    });
    elOgrenci.addEventListener("input", function () {
      if (selectedCatalogId && elOgrenci.value !== selectedLabel) selectedCatalogId = "";
      openStudentCombo();
      renderStudentOptions(elOgrenci.value || "");
      updateToolbarState();
    });
    elOgrenci.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeStudentCombo();
        elOgrenci.blur();
      }
    });
    elOgrenci.addEventListener("blur", function () {
      setTimeout(function () {
        if (elComboRoot && !elComboRoot.contains(document.activeElement)) closeStudentCombo();
      }, 160);
    });

    if (elToggle) {
      elToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!elPopover) return;
        if (elPopover.classList.contains("hidden")) {
          openStudentCombo();
          renderStudentOptions(elOgrenci.value || "");
        } else closeStudentCombo();
      });
    }

    document.addEventListener("click", function () {
      closeStudentCombo();
    });
  }

  function wireNotes() {
    if (!elNotes) return;
    elNotes.addEventListener("input", function () {
      if (!selectedCatalogId) return;
      scheduleV2NotesAutosave();
      scheduleParaRender();
    });
    elNotes.addEventListener("blur", function () {
      persistV2NotesDraft();
    });
    if (elNoteCategory) {
      elNoteCategory.addEventListener("change", function () {
        scheduleV2NotesAutosave();
        persistV2NotesDraft();
      });
    }
  }

  function wireTimer() {
    if (elBtnStart) elBtnStart.addEventListener("click", startMeeting);
    if (elBtnPause) elBtnPause.addEventListener("click", pauseOrResume);
    if (elBtnReset) elBtnReset.addEventListener("click", resetTimer);
    if (elBtnTimerPlus) elBtnTimerPlus.addEventListener("click", function () { adjustTimerBySteps(1); });
    if (elBtnTimerMinus) elBtnTimerMinus.addEventListener("click", function () { adjustTimerBySteps(-1); });
    if (elBtnEnd)
      elBtnEnd.addEventListener("click", function () {
        try {
          if (!selectedCatalogId) return;
          openSummaryModal();
        } catch (e) {
          showToast("Özet açılamadı.", true);
        }
      });
    if (elBtnSaveArchive)
      elBtnSaveArchive.addEventListener("click", function () {
        try {
          saveMeetingToArchiveAndReset();
        } catch (e2) {
          showToast("Arşive yazılamadı.", true);
        }
      });
  }

  function wireSummaryModal() {
    if (elSummaryClose)
      elSummaryClose.addEventListener("click", function () {
        closeSummaryModal();
      });
    if (elSummaryCopy)
      elSummaryCopy.addEventListener("click", function () {
        try {
          copySummary();
        } catch (e) {
          showToast("Kopyalanamadı.", true);
        }
      });
    if (elSummaryWa)
      elSummaryWa.addEventListener("click", function () {
        try {
          whatsappSummary();
        } catch (e) {
          showToast("WhatsApp açılamadı.", true);
        }
      });
    if (elSummaryFinish)
      elSummaryFinish.addEventListener("click", function () {
        try {
          stopSpeech();
          stopTimerInterval();
          timerRunning = false;
          finishMeetingSession();
          resetTimer();
          closeSummaryModal();
          updateSyncView("Strateji Merkezi · Görüşme Odası");
          showToast("Oturum kapatıldı. İsterseniz yeniden başlatın.");
        } catch (e) {
          showToast("Oturum kapatılamadı.", true);
        }
      });
    if (elModalSummary)
      elModalSummary.addEventListener("click", function (e) {
        if (e.target === elModalSummary) closeSummaryModal();
      });
  }

  function wireModals() {
    var bTri = document.getElementById("go-btn-modal-trials");
    var bPr = document.getElementById("go-btn-modal-program");
    if (bTri) bTri.addEventListener("click", openModalTrials);
    if (bPr) bPr.addEventListener("click", openModalPrograms);

    var c1 = document.getElementById("go-modal-trials-close");
    var c2 = document.getElementById("go-modal-program-close");
    if (c1) c1.addEventListener("click", closeModalTrials);
    if (c2) c2.addEventListener("click", closeModalPrograms);
    if (elModalTrials)
      elModalTrials.addEventListener("click", function (e) {
        if (e.target === elModalTrials) closeModalTrials();
      });
    if (elModalProg)
      elModalProg.addEventListener("click", function (e) {
        if (e.target === elModalProg) closeModalPrograms();
      });
    wireSummaryModal();
  }

  function wireQuickActions() {
    function recete() {
      navigateWithHandoff("recete-yaz.html", "Reçete Yaz");
    }
    function kaynak() {
      navigateWithHandoff("kaynak-atama.html", "Kaynak Atama");
    }
    if (elBtnRecete) elBtnRecete.addEventListener("click", recete);
    if (elBtnKaynak) elBtnKaynak.addEventListener("click", kaynak);
    if (elBtnReceteFooter) elBtnReceteFooter.addEventListener("click", recete);
    if (elBtnKaynakFooter) elBtnKaynakFooter.addEventListener("click", kaynak);
    if (elBtnSaveFooter)
      elBtnSaveFooter.addEventListener("click", function () {
        try {
          saveMeetingToArchiveAndReset();
        } catch (eSv) {
          showToast("Arşive yazılamadı.", true);
        }
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var pendingArchiveEditId = "";
    try {
      pendingArchiveEditId = String(sessionStorage.getItem(SESSION_EDIT_MEETING) || "").trim();
    } catch (ePe) {}

    try {
      if (!pendingArchiveEditId) localStorage.removeItem(KEY_MEETING_OPEN);
    } catch (eOpen) {}
    if (!pendingArchiveEditId) activeMeetingId = "";

    buildCatalogComboRows();
    renderMoodBar();
    wireStudentCombo();
    wireNotes();
    wireRichNotesToolbar();
    wireSpeech();
    wireTimer();
    wireModals();
    wireDmExamMatrix();
    wireQuickActions();
    wireDigitalCampus();
    resetTimer();

    if (pendingArchiveEditId) {
      var arcEntry = findArchiveEntryById(pendingArchiveEditId);
      if (!arcEntry) {
        try {
          sessionStorage.removeItem(SESSION_EDIT_MEETING);
        } catch (eBad) {}
        resetMeetingPageHeadline();
        showToast("Arşiv kaydı bulunamadı veya silindi.", true);
        onStudentChanged();
      } else {
        hydrateMeetingRoomFromArchive(arcEntry);
      }
    } else {
      onStudentChanged();
    }

    updateSyncView("Strateji Merkezi · Görüşme Odası");

    loadAtlas().catch(function () {});

    window.addEventListener("storage", function (e) {
      if (!e.key) return;
      if (
        e.key === "examResults" ||
        e.key.indexOf("examResults_") === 0 ||
        e.key === LS_WEEKLY ||
        e.key === LS_STUDENTS_FULL ||
        e.key === LS_GORUSME_ARSIV ||
        e.key === "derece_exam_matrix_v1" ||
        e.key === "derece_exam_results_matrix_v1" ||
        e.key === "kurum_denemeler_v1" ||
        e.key === "global_denemeler_v1" ||
        e.key === "kurumsalExams" ||
        e.key === "globalExams"
      ) {
        renderStudent360();
      }
    });
  });
})();
