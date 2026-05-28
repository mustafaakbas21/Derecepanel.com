/**
 * Web Speech API — canlı transkripsiyon (ara + kesin metin), görüşme odası vb.
 * @param {object} opts
 * @param {string} [opts.lang="tr-TR"]
 * @param {boolean} [opts.continuous=true]
 * @param {boolean} [opts.interimResults=true]
 * @param {boolean} [opts.autoRestart=true] sessizlikte oturum bitince yeniden başlat (Chrome — sürekli dikte)
 * @param {function():void} [opts.onStart]
 * @param {function(string):void} [opts.onInterim] anlık tahmin (Google klavye benzeri)
 * @param {function(string):void} [opts.onFinalChunk] kesinleşen segment
 * @param {function(string):void} [opts.onError]
 * @param {function():void} [opts.onEnd] kullanıcı durdurunca veya hata sonrası (otomatik yeniden başlatma yoksa)
 */
(function () {
  "use strict";

  var recognition = null;
  var listening = false;
  /** Kullanıcı mikrofonu kapayana kadar true — sessizlikte onend ile yeniden start */
  var listeningDesired = false;
  var activeOpts = null;

  function getSR() {
    return window.SpeechRecognition || window.webkitSpeechRecognition;
  }

  function stopVoiceRecognition() {
    listeningDesired = false;
    try {
      if (recognition) recognition.stop();
    } catch (e) {}
    recognition = null;
    listening = false;
    activeOpts = null;
  }

  function isVoiceRecognitionListening() {
    return listening || listeningDesired;
  }

  function attachHandlers(rec, opts) {
    /** Bazı tarayıcılarda yalnızca audiostart gelir; UI takılı kalmasın */
    var didNotifyStart = false;
    function fireStart() {
      if (didNotifyStart || recognition !== rec) return;
      didNotifyStart = true;
      listening = true;
      if (typeof opts.onStart === "function") opts.onStart();
    }

    rec.onstart = function () {
      if (recognition !== rec) return;
      fireStart();
    };

    try {
      rec.onaudiostart = function () {
        if (recognition !== rec) return;
        fireStart();
      };
    } catch (eAud) {}

    rec.onerror = function (ev) {
      if (recognition !== rec) return;
      var code = ev && ev.error ? String(ev.error) : "bilinmiyor";
      var silent = code === "no-speech" || code === "aborted";
      var human =
        code === "not-allowed" || code === "service-not-allowed"
          ? "Mikrofon izni reddedildi veya güvenli bağlam (HTTPS / localhost) gerekli."
          : code === "network"
            ? "Ses tanıma sunucusuna ulaşılamıyor (ağ, VPN veya tarayıcı engeli). Chrome/Edge deneyin."
            : code === "audio-capture"
              ? "Mikrofon açılamadı (başka uygulama kullanıyor olabilir veya cihazta mikrofon yok)."
              : silent
                ? ""
                : "Ses tanıma: " + code;
      listening = false;
      var fatal =
        code === "not-allowed" ||
        code === "service-not-allowed" ||
        code === "network" ||
        code === "audio-capture";
      if (fatal) listeningDesired = false;
      if (human && typeof opts.onError === "function") opts.onError(human);
    };

    rec.onend = function () {
      if (recognition !== rec) return;
      listening = false;
      if (listeningDesired && opts.continuous !== false && opts.autoRestart !== false) {
        window.setTimeout(function () {
          if (recognition !== rec || !listeningDesired) return;
          try {
            rec.start();
          } catch (eRestart) {
            listeningDesired = false;
            if (typeof opts.onEnd === "function") opts.onEnd();
          }
        }, 0);
        return;
      }
      if (typeof opts.onEnd === "function") opts.onEnd();
    };

    rec.onresult = function (ev) {
      if (recognition !== rec) return;
      try {
        var interimAll = "";
        var i;
        for (i = 0; i < ev.results.length; i++) {
          if (!ev.results[i].isFinal) interimAll += ev.results[i][0].transcript;
        }
        interimAll = String(interimAll || "");
        if (typeof opts.onInterim === "function") opts.onInterim(interimAll);

        var chunk = "";
        for (i = ev.resultIndex; i < ev.results.length; i++) {
          if (ev.results[i].isFinal) chunk += ev.results[i][0].transcript;
        }
        chunk = String(chunk || "").trim();
        if (chunk && typeof opts.onFinalChunk === "function") opts.onFinalChunk(chunk);
      } catch (err) {
        if (typeof opts.onError === "function") opts.onError("Sonuç işlenemedi.");
      }
    };
  }

  function startVoiceRecognition(opts) {
    opts = opts || {};
    var SR = getSR();
    if (!SR) {
      if (typeof opts.onError === "function") opts.onError("Tarayıcı konuşma tanımayı desteklemiyor.");
      return;
    }
    stopVoiceRecognition();

    try {
      recognition = new SR();
    } catch (e) {
      if (typeof opts.onError === "function") opts.onError("Tanıyıcı oluşturulamadı.");
      return;
    }

    activeOpts = opts;
    recognition.lang = opts.lang || "tr-TR";
    recognition.continuous = opts.continuous !== false;
    recognition.interimResults = opts.interimResults !== false;

    attachHandlers(recognition, opts);

    listeningDesired = true;

    try {
      recognition.start();
    } catch (err2) {
      listeningDesired = false;
      listening = false;
      recognition = null;
      activeOpts = null;
      if (typeof opts.onError === "function") opts.onError("Mikrofon başlatılamadı.");
    }
  }

  window.startVoiceRecognition = startVoiceRecognition;
  window.stopVoiceRecognition = stopVoiceRecognition;
  window.isVoiceRecognitionListening = isVoiceRecognitionListening;
})();
