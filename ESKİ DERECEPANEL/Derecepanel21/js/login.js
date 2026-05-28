/**
 * DerecePanel — login.html
 * - Yerel: koç `coaches` + öğrenci `derecepanel_students_full_v1` / `students` — katı eşleşme (büyük/küçük harf duyarlı), jenerik hata.
 * - Canlı: Appwrite `createEmailPasswordSession` (SDK sayfada yüklü olmalı).
 */
const LS_COACH = "coaches";
const LS_INST = "institutions";

function isLocalHost() {
  try {
    const h = String(location.hostname || "").toLowerCase();
    if (!String(h).trim()) return true;
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  } catch (_) {
    return true;
  }
}

function localDevCoachEmailHost() {
  return isLocalHost() ? "localhost" : "derecepanel.local";
}

const BUILTIN_COACH_EMAIL = "admin1@" + localDevCoachEmailHost();

function readJsonArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const p = JSON.parse(raw || "[]");
    return Array.isArray(p) ? p : [];
  } catch (_) {
    return [];
  }
}

function writeJsonArray(key, arr) {
  localStorage.setItem(key, JSON.stringify(arr));
}

function ensureBuiltinCoachRoster() {
  try {
    let inst = readJsonArray(LS_INST);
    let instId;
    if (inst.length === 0) {
      instId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "doc_" + Date.now().toString(36);
      inst = [{ name: "Kurum", documentId: instId }];
      writeJsonArray(LS_INST, inst);
    } else {
      instId = inst[0].documentId;
    }
    let coaches = readJsonArray(LS_COACH);
    if (isLocalHost()) {
      let dirty = false;
      coaches = coaches.map(function (c) {
        const le = String(c.loginEmail || "");
        if (/@derecepanel\.local$/i.test(le)) {
          dirty = true;
          const n = Object.assign({}, c);
          n.loginEmail = le.replace(/@derecepanel\.local$/i, "@" + localDevCoachEmailHost());
          return n;
        }
        return c;
      });
      if (dirty) writeJsonArray(LS_COACH, coaches);
    }
    const has = coaches.some(function (c) {
      const u = String(c.username || "").trim().toLowerCase();
      const le = String(c.loginEmail || "").trim().toLowerCase();
      return u === "admin1" || le === BUILTIN_COACH_EMAIL || le === "admin1@derecepanel.local";
    });
    if (!has) {
      coaches.push({
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "coach_" + Date.now().toString(36),
        username: "admin1",
        loginEmail: BUILTIN_COACH_EMAIL,
        password: "admin123",
        phone: "—",
        package: "",
        institutionBelgeId: instId,
        activeStudents: 0,
        lastLogin: "—",
        status: "Aktif",
      });
      writeJsonArray(LS_COACH, coaches);
    }
  } catch (_) {}
}

ensureBuiltinCoachRoster();

(function initYear() {
  "use strict";
  const yearEl = document.getElementById("loginYear");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();

(function initLoginUi() {
  "use strict";

  let activeRole = "coach";
  const targets = { coach: "pages/koc-paneli.html", student: "pages/ogrenci-panel.html" };

  const cards = document.querySelectorAll(".dp-login-role");
  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      const role = card.dataset.role;
      if (role !== "coach" && role !== "student") return;
      activeRole = role;
      cards.forEach(function (c) {
        c.setAttribute("aria-selected", c.dataset.role === role ? "true" : "false");
      });
    });
  });

  const pwd = document.getElementById("password");
  const togglePwd = document.getElementById("toggle-pwd");
  const eyeShow = document.getElementById("eye-show");
  const eyeHide = document.getElementById("eye-hide");
  if (togglePwd && pwd && eyeShow && eyeHide) {
    togglePwd.addEventListener("click", function () {
      const isPwd = pwd.type === "password";
      pwd.type = isPwd ? "text" : "password";
      eyeShow.classList.toggle("dp-hidden", isPwd);
      eyeHide.classList.toggle("dp-hidden", !isPwd);
    });
  }

  const capsHint = document.getElementById("caps-hint");
  function syncCapsLockFromEvent(e) {
    if (!capsHint) return;
    let on = false;
    try {
      on = !!(e && e.getModifierState && e.getModifierState("CapsLock"));
    } catch (_) {}
    capsHint.classList.toggle("is-on", on);
    capsHint.setAttribute("aria-hidden", on ? "false" : "true");
  }
  function syncCapsLockIfPasswordFocused(e) {
    if (!pwd || document.activeElement !== pwd) return;
    syncCapsLockFromEvent(e || { getModifierState: function () { return false; } });
  }
  if (pwd && capsHint) {
    pwd.addEventListener("keydown", syncCapsLockFromEvent);
    pwd.addEventListener("keyup", syncCapsLockFromEvent);
    pwd.addEventListener("pointerdown", function (e) {
      syncCapsLockFromEvent(e);
    });
    pwd.addEventListener("focus", function () {
      window.addEventListener("keydown", syncCapsLockIfPasswordFocused, true);
      window.addEventListener("keyup", syncCapsLockIfPasswordFocused, true);
    });
    pwd.addEventListener("blur", function () {
      window.removeEventListener("keydown", syncCapsLockIfPasswordFocused, true);
      window.removeEventListener("keyup", syncCapsLockIfPasswordFocused, true);
      capsHint.classList.remove("is-on");
      capsHint.setAttribute("aria-hidden", "true");
    });
  }

  const emailEl = document.getElementById("email");
  const errBox = document.getElementById("login-error");
  const errText = document.getElementById("login-error-text");
  function showError(msg) {
    if (errText) errText.textContent = msg;
    if (errBox) errBox.classList.add("is-visible");
  }
  function hideError() {
    if (errBox) errBox.classList.remove("is-visible");
  }
  if (emailEl) emailEl.addEventListener("input", hideError);
  if (pwd) pwd.addEventListener("input", hideError);

  const form = document.getElementById("login-form");
  const submitBtn = document.getElementById("submit-btn");

  function isMaintenanceOn() {
    try {
      return localStorage.getItem("maintenance_mode") === "true";
    } catch (_) {
      return false;
    }
  }

  try {
    const sp = new URLSearchParams(window.location.search || "");
    if (sp.get("bakim") === "1") {
      showError("Bakım modu açık. Lütfen daha sonra tekrar deneyin.");
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  } catch (_) {}

  const exitLayer = document.getElementById("dpLoginExit");
  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EXIT_NAV_MS = prefersReducedMotion ? 160 : 920;

  function runExitTransitionThen(url) {
    if (!exitLayer) {
      window.location.href = url;
      return;
    }
    document.documentElement.classList.add("dp-login-exit-lock");
    exitLayer.setAttribute("aria-hidden", "false");
    exitLayer.removeAttribute("inert");
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        exitLayer.classList.add("is-active");
      });
    });
    window.setTimeout(function () {
      window.location.href = url;
    }, EXIT_NAV_MS);
  }

  function looksLikeEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
  }

  function readCoachRoster() {
    return readJsonArray(LS_COACH);
  }

  const LS_STUDENTS_FULL = "derecepanel_students_full_v1";
  const LS_STUDENTS_LEGACY = "students";

  function readAllStudentRecordsForLogin() {
    const out = [];
    [LS_STUDENTS_FULL, LS_STUDENTS_LEGACY].forEach(function (key) {
      try {
        const arr = readJsonArray(key);
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] && typeof arr[i] === "object") out.push(arr[i]);
        }
      } catch (_) {}
    });
    return out;
  }

  /**
   * Yerel öğrenci: panel kullanıcı adı veya e-posta + panel şifresi — birebir (büyük/küçük harf duyarlı).
   */
  function findLocalStudentAccount(rawInput, password) {
    const clue = String(rawInput || "").trim();
    const pw = String(password);
    const roster = readAllStudentRecordsForLogin();
    for (let i = 0; i < roster.length; i++) {
      const s = roster[i];
      const ka = String(s.kullaniciAdi || "").trim();
      const em = String(s.email || "").trim();
      const identity = (ka && ka === clue) || (em && em === clue);
      if (!identity) continue;
      if (String(s.panelSifre || "") !== pw) continue;
      return s;
    }
    return null;
  }

  function resolveSessionEmail(rawInput) {
    const raw = String(rawInput || "").trim();
    if (!raw) return "";
    if (looksLikeEmail(raw)) return raw.toLowerCase();
    const roster = readCoachRoster();
    for (let i = 0; i < roster.length; i++) {
      const c = roster[i];
      const u = String(c.username || "").trim();
      if (u === raw) {
        const le = String(c.loginEmail || "").trim();
        if (le) return le.toLowerCase();
        return raw.toLowerCase() + "@" + localDevCoachEmailHost();
      }
    }
    return raw.toLowerCase() + "@" + localDevCoachEmailHost();
  }

  /** Yerel koç: yalnızca kayıtlı kullanıcı adı veya e-posta ile birebir (büyük/küçük harf duyarlı) + şifre birebir. */
  function findLocalCoachAccount(rawInput, password) {
    const roster = readCoachRoster();
    const clue = String(rawInput || "").trim();
    const pw = String(password);
    for (let i = 0; i < roster.length; i++) {
      const c = roster[i];
      const u = String(c.username || "");
      const le = String(c.loginEmail || "");
      let identity = false;
      if (looksLikeEmail(clue)) {
        identity = le === clue;
      } else {
        identity = u === clue;
      }
      if (!identity) continue;
      if (String(c.password || "") !== pw) continue;
      return c;
    }
    return null;
  }

  function readCoachRosterForCloud() {
    return readJsonArray(LS_COACH);
  }

  function rosterKnowsCoachIdentity(rawInput, attemptedEmail) {
    const roster = readCoachRosterForCloud();
    const clue = String(rawInput || "").trim();
    const em = String(attemptedEmail || "").trim();
    for (let i = 0; i < roster.length; i++) {
      const c = roster[i];
      const u = String(c.username || "").trim();
      const le = String(c.loginEmail || "").trim();
      if (clue.indexOf("@") !== -1) {
        if (le && (le === clue || le === em)) return true;
        if (!le && u && em === u + "@" + localDevCoachEmailHost()) return true;
        if (!le && u && em === u + "@derecepanel.local") return true;
      } else {
        if (u === clue) return true;
        if (le && em === le) return true;
      }
    }
    return false;
  }

  function rosterIdentityAndPasswordMatch(rawInput, sessionEmail, password) {
    const roster = readCoachRosterForCloud();
    const clue = String(rawInput || "").trim();
    const em = String(sessionEmail || "").trim();
    const pw = String(password);
    for (let i = 0; i < roster.length; i++) {
      const c = roster[i];
      const u = String(c.username || "").trim();
      const le = String(c.loginEmail || "").trim();
      let identity = false;
      if (clue.indexOf("@") !== -1) {
        identity = le === clue || em === le || clue === em;
      } else {
        identity = u === clue || (le && em === le);
      }
      if (identity && String(c.password || "") === pw) return true;
    }
    return false;
  }

  function appwriteUserAlreadyExists(err) {
    const msg = String((err && err.message) || err || "").toLowerCase();
    const code = err && err.code;
    const typ = String((err && err.type) || "").toLowerCase();
    return (
      code === 409 ||
      typ.indexOf("user_already") !== -1 ||
      /already exists|duplicate|email.*already|already been registered|user_with_the_same_email/i.test(msg)
    );
  }

  async function ensureSessionOrProvisionCoach(account, ID, rawInput, sessionEmail, password) {
    try {
      await account.createEmailPasswordSession(sessionEmail, password);
      return await account.get();
    } catch (e1) {
      if (activeRole !== "coach" || !rosterIdentityAndPasswordMatch(rawInput, sessionEmail, password)) {
        throw e1;
      }
      try {
        await account.create(ID.unique(), sessionEmail, password);
      } catch (e2) {
        if (!appwriteUserAlreadyExists(e2)) {
          console.warn("[DerecePanel login] Appwrite account.create:", e2);
          const hint = new Error("APPWRITE_PROVISION");
          hint.cause = e1;
          hint.detail = e2;
          throw hint;
        }
      }
      try {
        await account.createEmailPasswordSession(sessionEmail, password);
      } catch (e3) {
        try {
          const u = await account.get();
          if (u && u.$id) return u;
        } catch (_e4) {}
        throw e3;
      }
      return await account.get();
    }
  }

  function formatCloudLoginFailure(rawInput, attemptedEmail, err) {
    const generic = (typeof window !== "undefined" && window.DP_AUTH_GENERIC_LOGIN_ERROR) || "Geçersiz kullanıcı adı veya şifre";
    if (activeRole !== "coach") {
      return generic;
    }
    if (err && err.message === "APPWRITE_PROVISION") {
      return (
        "Paneldeki koç bilgileri doğru; ancak Appwrite hesabı oluşturulamadı. " +
        "Appwrite Console → Auth → Users: " +
        attemptedEmail +
        " oluşturun veya kayıt iznini açın."
      );
    }
    if (rosterKnowsCoachIdentity(rawInput, attemptedEmail)) {
      const pw = err && err.__submittedPassword != null ? String(err.__submittedPassword) : "";
      if (!rosterIdentityAndPasswordMatch(rawInput, attemptedEmail, pw)) {
        return generic;
      }
      return (
        "Koç listesindeki şifre doğru; Appwrite oturumu açılamadı. " +
        "Kullanıcı: " +
        attemptedEmail +
        "."
      );
    }
    return generic;
  }

  async function performCloudLogin(rawInput, sessionEmail, password) {
    const [{ Account, ID }, { client }] = await Promise.all([
      import("./appwrite-browser.js"),
      import("./appwrite-config.js"),
    ]);
    const account = new Account(client);
    return ensureSessionOrProvisionCoach(account, ID, rawInput, sessionEmail, password);
  }

  function writeSessionAfterSuccess(userLike, sessionEmail, opts) {
    opts = opts || {};
    let uid = String(opts.canonicalUserId || "").trim();
    if (!uid && userLike && userLike.$id) uid = String(userLike.$id).trim();
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uid && uid.indexOf("@") > 0 && !uuidRe.test(uid)) {
      const local = uid.split("@")[0].trim();
      if (local) uid = local.toLowerCase();
    }
    const mail = (userLike && userLike.email) || sessionEmail;
    sessionStorage.setItem("dp_auth_role", activeRole);
    sessionStorage.setItem("dp_auth_user", mail);
    if (uid) {
      sessionStorage.setItem("dp_auth_user_id", uid);
      sessionStorage.setItem("dp_appwrite_user_id", uid);
    }
    if (activeRole === "coach") {
      try {
        localStorage.setItem("derecepanel_coach_messaging_id_v1", "coach:" + uid);
      } catch (_) {}
    }
  }

  if (form && submitBtn) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      hideError();

      if (isMaintenanceOn()) {
        showError("Bakım modu açık. Lütfen daha sonra tekrar deneyin.");
        return;
      }

      const rawInput = emailEl && emailEl.value ? String(emailEl.value).trim() : "";
      const password = pwd && pwd.value != null ? String(pwd.value) : "";

      if (!rawInput) {
        showError(activeRole === "coach" ? "Kullanıcı adı veya e-posta gerekli." : "E-posta gerekli.");
        return;
      }
      if (activeRole === "student" && !isLocalHost() && !looksLikeEmail(rawInput)) {
        showError("Lütfen geçerli bir e-posta adresi girin.");
        return;
      }
      if (!password) {
        showError("Şifre gerekli.");
        return;
      }

      const sessionEmail = activeRole === "coach" ? resolveSessionEmail(rawInput) : String(rawInput).trim().toLowerCase();

      let startedExit = false;
      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");

      (async function () {
        try {
          if (isLocalHost()) {
            const genericErr =
              (typeof window !== "undefined" && window.DP_AUTH_GENERIC_LOGIN_ERROR) || "Geçersiz kullanıcı adı veya şifre";
            if (activeRole === "student") {
              const st = findLocalStudentAccount(rawInput, password);
              if (!st) {
                showError(genericErr);
                return;
              }
              sessionStorage.setItem("dp_local_auth", "1");
              const canonId =
                String(st.ogrenciId || st.id || "").trim() ||
                (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "stu_" + Date.now().toString(36));
              const disp = String(st.kullaniciAdi || st.email || st.name || "").trim() || canonId;
              writeSessionAfterSuccess({ $id: canonId, email: String(st.email || "").trim() || disp }, disp, {
                canonicalUserId: canonId,
              });
              try {
                localStorage.setItem(
                  "currentUser",
                  JSON.stringify({
                    id: canonId,
                    ogrenciId: canonId,
                    name: String(st.name || "").trim(),
                    studentCode: String(st.studentCode || "").trim(),
                    email: String(st.email || "").trim(),
                    coachId: String(st.coachId || "").trim(),
                  })
                );
              } catch (_cu) {}
              const dest = targets.student;
              startedExit = true;
              runExitTransitionThen(dest);
              return;
            }

            const coach = findLocalCoachAccount(rawInput, password);
            if (!coach) {
              showError(genericErr);
              return;
            }
            sessionStorage.setItem("dp_local_auth", "1");
            const coachPk = String(coach.id || "").trim();
            if (!coachPk) {
              showError(genericErr);
              return;
            }
            if (typeof console !== "undefined" && console.debug) {
              console.debug("[DerecePanel login] Yerel koç oturum kimliği (UUID / koc_id):", coachPk);
            }
            const displayName = String(coach.username || coach.loginEmail || coachPk).trim() || coachPk;
            writeSessionAfterSuccess({ $id: coachPk, email: displayName }, displayName, { canonicalUserId: coachPk });
            try {
              var lem = String(coach.loginEmail || "").trim();
              if (lem) {
                sessionStorage.setItem("dp_coach_login_email_v1", lem);
              } else {
                sessionStorage.removeItem("dp_coach_login_email_v1");
              }
            } catch (_em) {}
            const dest = targets.coach;
            startedExit = true;
            runExitTransitionThen(dest);
            return;
          }

          const user = await performCloudLogin(rawInput, sessionEmail, password);
          sessionStorage.removeItem("dp_local_auth");
          const cloudId = user && user.$id ? String(user.$id).trim() : "";
          writeSessionAfterSuccess(user, sessionEmail, { canonicalUserId: cloudId });
          const dest = activeRole === "student" ? targets.student : targets.coach;
          startedExit = true;
          runExitTransitionThen(dest);
        } catch (err) {
          const wrapped = err && typeof err === "object" ? err : { message: String(err) };
          wrapped.__submittedPassword = password;
          showError(formatCloudLoginFailure(rawInput, sessionEmail, wrapped));
        } finally {
          if (!startedExit) {
            submitBtn.disabled = false;
            submitBtn.removeAttribute("aria-busy");
          }
        }
      })();
    });
  }
})();
