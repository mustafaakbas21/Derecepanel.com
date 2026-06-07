// @ts-nocheck
/* Ported from ESKİ Derecepanel21/js/pazarlama.js */
import type { BrandState, CountdownCustomState, TextState } from "../types";
import type { MergedExam } from "@/lib/exams/types";
import { getKurumAdi } from "../kurum";
import { resultsForExam, sortByNetDesc } from "../exams";
import { escapeHtml, clampInt, formatTrDate, initials, parseYmdLocal, clamp } from "../utils";
import { applyBrandToStory } from "../brand";

function $(id: string) {
  return document.getElementById(id);
}

function buildEmptyStateHtml() {
  return (
    '<div class="pm-empty" role="status" aria-live="polite">' +
    '<div class="pm-empty-ico" aria-hidden="true">⏳</div>' +
    "<h2>Sınav Sonuçları<br>Bekleniyor…</h2>" +
    "<p>Optik yüklemesi veya sonuç kaydı tamamlandığında<br>ilk 10 burada otomatik oluşur.</p>" +
    "</div>"
  );
}

export function templateMarkup(kind, style) {
    var s = clampInt(style, 1, 3, 1);
    var cls = "pm-tpl pm-kind--" + String(kind || "leaderboard") + " pm-style--" + String(s);

    function topbar(badgeText) {
      return (
        '<div class="pm-watermark" aria-hidden="true"></div>' +
        '<div class="pm-topbar">' +
        '  <div class="pm-brand">' +
        '    <div class="pm-logo" id="pm-logo">' +
        '      <img id="pm-logo-img" alt="Logo" hidden style="width:100%;height:100%;object-fit:contain;border-radius:22px" />' +
        '      <span id="pm-logo-fallback">DP</span>' +
        "    </div>" +
        '    <div class="pm-brand-text">' +
        '      <p class="pm-kurum" id="pm-kurum">Kurum</p>' +
        '      <p class="pm-exam" id="pm-exam">Deneme adı</p>' +
        "    </div>" +
        "  </div>" +
        '  <div class="pm-badge" id="pm-badge">' +
        escapeHtml(badgeText || "") +
        "</div>" +
        "</div>"
      );
    }

    if (kind === "leaderboard") {
      var head =
        '<div class="' +
        cls +
        '">' +
        topbar("TOP 10") +
        '<div class="pm-title">' +
        '  <h1 id="pm-title">İlk 10</h1>' +
        '  <p class="pm-date" id="pm-date">—</p>' +
        "</div>";

      if (s === 1) {
        return (
          head +
          '<div class="pm-board pm-board--glasslist" role="table" aria-label="İlk 10 tablosu">' +
          '  <div class="pm-board-head" role="row">' +
          '    <div class="pm-board-head-title">' +
          '      <strong id="pm-board-title">LİDERLİK TABLOSU</strong>' +
          '      <span id="pm-board-sub">İlk 10</span>' +
          "    </div>" +
          '    <div class="pm-board-head-metric" id="pm-board-metric">Toplam Net</div>' +
          "  </div>" +
          '  <div id="pm-rows" class="pm-rows pm-rows--glasslist"></div>' +
          "</div>" +
          '<div class="pm-foot">' +
          '  <span class="pm-pill" id="pm-foot-left">Veri: examResults</span>' +
          '  <span class="pm-hairline" aria-hidden="true"></span>' +
          '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
          "</div>" +
          "</div>"
        );
      }

      if (s === 2) {
        return (
          head +
          '<div class="pm-board pm-board--floatcards" role="table" aria-label="İlk 10 tablosu">' +
          '  <div class="pm-board-head" role="row">' +
          '    <div class="pm-board-head-title">' +
          '      <strong id="pm-board-title">LİDERLİK TABLOSU</strong>' +
          '      <span id="pm-board-sub">İlk 10</span>' +
          "    </div>" +
          '    <div class="pm-board-head-metric" id="pm-board-metric">Toplam Net</div>' +
          "  </div>" +
          '  <div id="pm-rows" class="pm-rows pm-rows--floatcards"></div>' +
          "</div>" +
          '<div class="pm-foot">' +
          '  <span class="pm-pill" id="pm-foot-left">Veri: examResults</span>' +
          '  <span class="pm-hairline" aria-hidden="true"></span>' +
          '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
          "</div>" +
          "</div>"
        );
      }

      // s === 3
      return (
        head +
        '<div class="pm-board pm-board--minimal" role="table" aria-label="İlk 10 tablosu">' +
        '  <div class="pm-board-head pm-board-head--minimal" role="row">' +
        '    <div class="pm-board-head-title">' +
        '      <strong id="pm-board-title">LİDERLİK TABLOSU</strong>' +
        '      <span id="pm-board-sub">İlk 10</span>' +
        "    </div>" +
        '    <div class="pm-board-head-metric" id="pm-board-metric">Toplam Net</div>' +
        "  </div>" +
        '  <div id="pm-rows" class="pm-rows pm-rows--minimal"></div>' +
        "</div>" +
        '<div class="pm-foot pm-foot--minimal">' +
        '  <span class="pm-pill" id="pm-foot-left">Veri: examResults</span>' +
        '  <span class="pm-hairline" aria-hidden="true"></span>' +
        '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
        "</div>" +
        "</div>"
      );
    }

    if (kind === "star") {
      if (s === 1) {
        return (
          '<div class="' +
          cls +
          '">' +
          topbar("SPOTLIGHT") +
          '<div class="pm-star pm-star--polaroid">' +
          '  <p class="pm-star-kicker" id="pm-star-kicker">GEÇEN SINAVA GÖRE</p>' +
          '  <h1 class="pm-star-title" id="pm-star-title">Haftanın Yıldızı</h1>' +
          '  <p class="pm-star-sub" id="pm-star-sub">Netini en çok artıran öğrencimiz!</p>' +
          '  <div class="pm-polaroid" aria-label="Polaroid çerçeve">' +
          '    <div class="pm-polaroid-photo">' +
          '      <div class="pm-polaroid-avatar" id="pm-star-avatar"><div class="pm-polaroid-avatarInner" id="pm-star-avatar-inner">AA</div></div>' +
          "    </div>" +
          '    <div class="pm-polaroid-name" id="pm-star-name">Öğrenci Adı</div>' +
          "  </div>" +
          '  <div class="pm-star-metrics" id="pm-star-metrics">' +
          '    <div class="pm-star-metric"><div class="pm-star-metric-label">Artış</div><div class="pm-star-metric-value" id="pm-star-delta">+0.00</div></div>' +
          '    <div class="pm-star-metric"><div class="pm-star-metric-label">Yeni Net</div><div class="pm-star-metric-value" id="pm-star-net">0.00</div></div>' +
          "  </div>" +
          "</div>" +
          '<div class="pm-foot">' +
          '  <span class="pm-pill" id="pm-foot-left">Veri: examResults</span>' +
          '  <span class="pm-hairline" aria-hidden="true"></span>' +
          '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
          "</div>" +
          "</div>"
        );
      }

      if (s === 2) {
        return (
          '<div class="' +
          cls +
          '">' +
          topbar("SPOTLIGHT") +
          '<div class="pm-star pm-star--bigtype">' +
          '  <div class="pm-star-watermark" aria-hidden="true">HAFTANIN YILDIZI</div>' +
          '  <p class="pm-star-kicker" id="pm-star-kicker">GEÇEN SINAVA GÖRE</p>' +
          '  <div class="pm-bigName" id="pm-star-name">Öğrenci Adı</div>' +
          '  <div class="pm-bigMeta">' +
          '    <div class="pm-bigMetaLine"><span class="pm-bigMetaK">Artış</span><span class="pm-bigMetaV" id="pm-star-delta">+0.00</span></div>' +
          '    <div class="pm-bigMetaLine"><span class="pm-bigMetaK">Yeni Net</span><span class="pm-bigMetaV" id="pm-star-net">0.00</span></div>' +
          "  </div>" +
          '  <div class="pm-bigAvatar" id="pm-star-avatar"><div class="pm-bigAvatarInner" id="pm-star-avatar-inner">AA</div></div>' +
          // Keep existing ids for text bindings (title/sub hidden in CSS for this style)
          '  <h1 class="pm-star-title" id="pm-star-title">Haftanın Yıldızı</h1>' +
          '  <p class="pm-star-sub" id="pm-star-sub">Netini en çok artıran öğrencimiz!</p>' +
          '  <div class="pm-star-metrics" id="pm-star-metrics"></div>' +
          "</div>" +
          '<div class="pm-foot">' +
          '  <span class="pm-pill" id="pm-foot-left">Veri: examResults</span>' +
          '  <span class="pm-hairline" aria-hidden="true"></span>' +
          '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
          "</div>" +
          "</div>"
        );
      }

      // s === 3
      return (
        '<div class="' +
        cls +
        '">' +
        topbar("SPOTLIGHT") +
        '<div class="pm-star pm-star--spotlight">' +
        '  <div class="pm-spotGlow" aria-hidden="true"></div>' +
        '  <p class="pm-star-kicker" id="pm-star-kicker">GEÇEN SINAVA GÖRE</p>' +
        '  <h1 class="pm-star-title" id="pm-star-title">Haftanın Yıldızı</h1>' +
        '  <div class="pm-spotAvatar" id="pm-star-avatar"><div class="pm-spotAvatarInner" id="pm-star-avatar-inner">AA</div></div>' +
        '  <div class="pm-spotName" id="pm-star-name">Öğrenci Adı</div>' +
        '  <p class="pm-star-sub" id="pm-star-sub">Netini en çok artıran öğrencimiz!</p>' +
        '  <div class="pm-spotMetrics">' +
        '    <div class="pm-spotMetric"><span>Artış</span><strong id="pm-star-delta">+0.00</strong></div>' +
        '    <div class="pm-spotMetric"><span>Yeni Net</span><strong id="pm-star-net">0.00</strong></div>' +
        "  </div>" +
        '  <div class="pm-star-metrics" id="pm-star-metrics"></div>' +
        "</div>" +
        '<div class="pm-foot">' +
        '  <span class="pm-pill" id="pm-foot-left">Veri: examResults</span>' +
        '  <span class="pm-hairline" aria-hidden="true"></span>' +
        '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
        "</div>" +
        "</div>"
      );
    }

    // countdown
    if (s === 1) {
      return (
        '<div class="' +
        cls +
        '">' +
        topbar("MOTİVASYON") +
        '<div class="pm-countdown pm-countdown--huge">' +
        '  <div class="pm-hugeDays" id="pm-countdown-days">—</div>' +
        '  <div class="pm-hugeLabel">GÜN KALDI</div>' +
        '  <div class="pm-hugeHeadline" id="pm-countdown-label">YKS\'YE</div>' +
        '  <div class="pm-hugeSub" id="pm-countdown-sub">Kaldı. Hazırsın.</div>' +
        '  <div class="pm-hugeQuote" id="pm-countdown-quote">Bugün çalış, yarın gurur duy.</div>' +
        '  <div class="pm-progress" aria-label="İlerleme çubuğu" style="margin-top: 32px">' +
        '    <div class="pm-progress-fill" id="pm-progress-fill" style="width: 50%"></div>' +
        "  </div>" +
        "</div>" +
        '<div class="pm-foot">' +
        '  <span class="pm-pill" id="pm-foot-left">Şablon: Geri Sayım</span>' +
        '  <span class="pm-hairline" aria-hidden="true"></span>' +
        '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
        "</div>" +
        "</div>"
      );
    }

    if (s === 2) {
      return (
        '<div class="' +
        cls +
        '">' +
        topbar("MOTİVASYON") +
        '<div class="pm-countdown pm-countdown--zen">' +
        '  <p class="pm-zenQuote" id="pm-countdown-quote">Bugün çalış, yarın gurur duy.</p>' +
        '  <div class="pm-zenDaysRow">' +
        '    <div class="pm-zenDays"><span id="pm-countdown-days">—</span></div>' +
        '    <div class="pm-zenMeta">' +
        '      <div class="pm-zenLabel" id="pm-countdown-label">YKS\'YE</div>' +
        '      <div class="pm-zenSub" id="pm-countdown-sub">Kaldı. Hazırsın.</div>' +
        "    </div>" +
        "  </div>" +
        '  <div class="pm-zenProgressWrap">' +
        '    <div class="pm-zenTrack" aria-hidden="true"></div>' +
        '    <div class="pm-zenFill" id="pm-progress-fill" style="width: 50%"></div>' +
        "  </div>" +
        "</div>" +
        '<div class="pm-foot">' +
        '  <span class="pm-pill" id="pm-foot-left">Şablon: Geri Sayım</span>' +
        '  <span class="pm-hairline" aria-hidden="true"></span>' +
        '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
        "</div>" +
        "</div>"
      );
    }

    // s === 3
    return (
      '<div class="' +
      cls +
      '">' +
      topbar("MOTİVASYON") +
      '<div class="pm-countdown pm-countdown--calendar">' +
      '  <div class="pm-calCard" role="group" aria-label="Takvim kartı">' +
      '    <div class="pm-calTop">' +
      '      <div class="pm-calDots" aria-hidden="true"><span></span><span></span></div>' +
      '      <div class="pm-calMonth" id="pm-countdown-label">YKS\'YE</div>' +
      "    </div>" +
      '    <div class="pm-calDay" id="pm-countdown-days">—</div>' +
      '    <div class="pm-calBottom" id="pm-countdown-sub">GÜN KALDI</div>' +
      "  </div>" +
      '  <div class="pm-calQuote" id="pm-countdown-quote">Bugün çalış, yarın gurur duy.</div>' +
      '  <div class="pm-progress" aria-label="İlerleme çubuğu" style="margin-top: 26px">' +
      '    <div class="pm-progress-fill" id="pm-progress-fill" style="width: 50%"></div>' +
      "  </div>" +
      "</div>" +
      '<div class="pm-foot">' +
      '  <span class="pm-pill" id="pm-foot-left">Şablon: Geri Sayım</span>' +
      '  <span class="pm-hairline" aria-hidden="true"></span>' +
      '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
      "</div>" +
      "</div>"
    );
  }

export function buildLeaderboardRowHtml(style, rank, rec) {
    var s = clampInt(style, 1, 3, 1);
    var nm = String(rec.name || rec.studentName || "").trim() || "Belirtilmedi";
    var code = String(rec.studentCode || rec.studentId || "").trim();
    var net = rec.net != null ? Number(rec.net) : 0;
    var netStr = isFinite(net) ? net.toFixed(2) : "0.00";
    var medal = "";
    if (rank === 1) medal = "🥇";
    else if (rank === 2) medal = "🥈";
    else if (rank === 3) medal = "🥉";

    if (s === 1) {
      return (
        '<div class="pm-glassLine pm-glassLine--' +
        rank +
        '">' +
        '<div class="pm-glassRank"><span class="pm-glassMedal" aria-hidden="true">' +
        escapeHtml(medal || "") +
        '</span><strong>#' +
        rank +
        "</strong></div>" +
        '<div class="pm-glassName"><div class="pm-glassNameMain">' +
        escapeHtml(nm) +
        '</div><div class="pm-glassNameSub">' +
        (code ? "No: " + escapeHtml(code) : "—") +
        "</div></div>" +
        '<div class="pm-glassNet"><span class="pm-glassNetVal">' +
        escapeHtml(netStr) +
        '</span><span class="pm-glassNetLbl">NET</span></div>' +
        "</div>"
      );
    }

    if (s === 2) {
      return (
        '<div class="pm-floatCard pm-floatCard--' +
        rank +
        '">' +
        '<div class="pm-floatLeft">' +
        '<div class="pm-floatRank"><span class="pm-floatBadge" aria-hidden="true">' +
        escapeHtml(medal || "#") +
        "</span><strong>" +
        rank +
        "</strong></div>" +
        '<div class="pm-floatName">' +
        escapeHtml(nm) +
        "</div>" +
        "</div>" +
        '<div class="pm-floatRight">' +
        '<div class="pm-floatNet">' +
        escapeHtml(netStr) +
        "</div>" +
        '<div class="pm-floatCode">' +
        (code ? "No: " + escapeHtml(code) : "—") +
        "</div>" +
        "</div>" +
        "</div>"
      );
    }

    // s === 3 minimalist
    return (
      '<div class="pm-minRow pm-minRow--' +
      rank +
      '">' +
      '<div class="pm-minLeft">' +
      '<span class="pm-minRank">' +
      rank +
      '</span><span class="pm-minName">' +
      escapeHtml(nm) +
      "</span>" +
      "</div>" +
      '<div class="pm-minRight">' +
      '<span class="pm-minNet">' +
      escapeHtml(netStr) +
      '</span><span class="pm-minUnit">NET</span>' +
      "</div>" +
      "</div>"
    );
  }

export function buildLeaderboardEmptyStateHtml(style) {
    var s = clampInt(style, 1, 3, 1);
    if (s === 3) {
      return (
        '<div class="pm-minEmpty" role="status" aria-live="polite">' +
        "<div>Sonuç yok.</div>" +
        "<div>Optik/sonuç kaydı tamamlanınca ilk 10 oluşur.</div>" +
        "</div>"
      );
    }
    return buildEmptyStateHtml();
  }

export function renderTop10(exam, brand, style) {
    var kurum = getKurumAdi();
    var logo = $("pm-logo");
    var kurumEl = $("pm-kurum");
    var examEl = $("pm-exam");
    var dateEl = $("pm-date");
    var rowsEl = $("pm-rows");
    var boardSub = $("pm-board-sub");
    var metaCount = $("pm-meta-count");
    var metaTop = $("pm-meta-top");

    if (logo) {
      var fb = $("pm-logo-fallback");
      if (fb) fb.textContent = initials(kurum);
    }
    if (kurumEl) kurumEl.textContent = kurum;
    applyBrandToStory(brand);

    if (!exam || !exam.id) {
      if (examEl) examEl.textContent = "Deneme seçin";
      if (dateEl) dateEl.textContent = "—";
      if (rowsEl) rowsEl.innerHTML = buildLeaderboardEmptyStateHtml(style);
      if (boardSub) boardSub.textContent = "İlk 10";
      if (metaCount) metaCount.textContent = "—";
      if (metaTop) metaTop.textContent = "—";
      return;
    }

    var title = exam.name || exam.title || exam.ad || String(exam.id);
    if (examEl) examEl.textContent = title;
    if (dateEl) dateEl.textContent = formatTrDate(exam.date || exam.tarih || exam.examDate);
    if (boardSub) boardSub.textContent = "İlk 10";

    var all = resultsForExam(exam.id);
    var sorted = sortByNetDesc(all);
    var top = sorted.slice(0, 10);

    if (metaCount) metaCount.textContent = String(all.length || 0);
    if (metaTop) metaTop.textContent = String(top.length || 0);

    var html = "";
    for (var i = 0; i < top.length; i++) {
      html += buildLeaderboardRowHtml(style, i + 1, top[i]);
    }
    if (!html) {
      html = buildLeaderboardEmptyStateHtml(style);
    }
    if (rowsEl) rowsEl.innerHTML = html;
  }

export function prevExamOf(exams, exam) {
    if (!exam || !exam.id) return null;
    var sorted = exams.slice().sort(function (a, b) { return examSortKey(a) - examSortKey(b); });
    var idx = -1;
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i] && String(sorted[i].id) === String(exam.id)) { idx = i; break; }
    }
    if (idx <= 0) return null;
    for (var j = idx - 1; j >= 0; j--) {
      if (sorted[j] && sorted[j].id) return sorted[j];
    }
    return null;
  }

export function bestImprover(currentExam, previousExam) {
    var cur = currentExam ? resultsForExam(currentExam.id) : [];
    if (!cur.length) return null;
    var prev = previousExam ? resultsForExam(previousExam.id) : [];
    var prevMap = {};
    for (var i = 0; i < prev.length; i++) {
      var p = prev[i];
      var key = String(p.studentCode || p.studentId || "");
      if (!key) continue;
      prevMap[key] = Number(p.net) || 0;
    }
    var best = null;
    for (var j = 0; j < cur.length; j++) {
      var r = cur[j];
      var k = String(r.studentCode || r.studentId || "");
      var curNet = Number(r.net) || 0;
      var prevNet = prevMap.hasOwnProperty(k) ? prevMap[k] : null;
      var delta = prevNet == null ? null : curNet - prevNet;
      if (delta == null) continue;
      if (!best || delta > best.delta) {
        best = { rec: r, delta: delta, net: curNet, code: k };
      }
    }
    if (best) return best;
    // fallback: en yüksek net
    var top = sortByNetDesc(cur)[0];
    if (!top) return null;
    return { rec: top, delta: null, net: Number(top.net) || 0, code: String(top.studentCode || top.studentId || "") };
  }

export function renderStar(exams, exam, brand, textState) {
    var kurum = getKurumAdi();
    var kurumEl = $("pm-kurum");
    var examEl = $("pm-exam");
    var footL = $("pm-foot-left");
    var badge = $("pm-badge");
    if (kurumEl) kurumEl.textContent = kurum;
    if (examEl) examEl.textContent = exam && exam.id ? (exam.name || exam.title || exam.ad || String(exam.id)) : "Deneme seçin";
    if (footL) footL.textContent = "Veri: examResults";
    applyBrandToStory(brand);

    var fb = $("pm-logo-fallback");
    if (fb) fb.textContent = initials(kurum);

    var kicker = $("pm-star-kicker");
    var title = $("pm-star-title");
    var sub = $("pm-star-sub");
    var avatarInner = $("pm-star-avatar-inner");
    var nameEl = $("pm-star-name");
    var deltaEl = $("pm-star-delta");
    var netEl = $("pm-star-net");

    var st = textState && textState.star ? textState.star : null;
    if (badge && st && st.badge) badge.textContent = String(st.badge);
    if (title && st && st.title) title.textContent = String(st.title);
    if (sub && st && st.sub) sub.textContent = String(st.sub);

    if (!exam || !exam.id) {
      if (kicker) kicker.textContent = "DENEME SEÇİN";
      if (sub) sub.textContent = "Bir deneme seçince otomatik oluşturulur.";
      if (avatarInner) avatarInner.textContent = "—";
      if (nameEl) nameEl.textContent = "—";
      if (deltaEl) deltaEl.textContent = "—";
      if (netEl) netEl.textContent = "—";
      return;
    }

    var prev = prevExamOf(exams, exam);
    var best = bestImprover(exam, prev);
    var prevName = prev ? (prev.name || prev.title || prev.ad || String(prev.id)) : "";
    if (kicker) {
      if (prev) kicker.textContent = (st && st.kickerBase ? st.kickerBase : "GEÇEN SINAV") + ": " + prevName;
      else kicker.textContent = (st && st.kickerEmpty ? st.kickerEmpty : "GEÇEN SINAV VERİSİ YOK");
    }

    if (!best) {
      if (avatarInner) avatarInner.textContent = "—";
      if (nameEl) nameEl.textContent = "Veri yok";
      if (deltaEl) deltaEl.textContent = "—";
      if (netEl) netEl.textContent = "—";
      return;
    }

    var nm = String(best.rec.name || best.rec.studentName || "").trim() || "Belirtilmedi";
    if (avatarInner) avatarInner.textContent = initials(nm);
    if (nameEl) nameEl.textContent = nm;
    if (netEl) netEl.textContent = (isFinite(best.net) ? best.net.toFixed(2) : "0.00");
    if (best.delta == null) deltaEl.textContent = "—";
    else deltaEl.textContent = (best.delta >= 0 ? "+" : "") + best.delta.toFixed(2);
  }

export function renderCountdown(custom, brand, textState) {
    var kurum = getKurumAdi();
    var kurumEl = $("pm-kurum");
    var examEl = $("pm-exam");
    applyBrandToStory(brand);
    var fb = $("pm-logo-fallback");
    if (fb) fb.textContent = initials(kurum);
    if (kurumEl) kurumEl.textContent = kurum;
    if (examEl) examEl.textContent = "Motivasyon";

    var label = $("pm-countdown-label");
    var daysEl = $("pm-countdown-days");
    var sub = $("pm-countdown-sub");
    var quote = $("pm-countdown-quote");
    var fill = $("pm-progress-fill");
    var badge = $("pm-badge");
    var footLeft = $("pm-foot-left");

    var ct = textState && textState.countdown ? textState.countdown : null;
    if (badge && ct && ct.badge) badge.textContent = String(ct.badge);
    if (footLeft && ct && ct.footLeft) footLeft.textContent = String(ct.footLeft);

    var t = custom && custom.targetDate ? String(custom.targetDate) : "";
    var headline = (custom && custom.headline) || (ct && ct.label) || "YKS'YE";
    var q = (custom && custom.quote) || (ct && ct.quote) || "Bugün çalış, yarın gurur duy.";
    var subMsg = (custom && custom.subMsg) || (ct && ct.subMsg) || "Kaldı. Hazırsın.";
    var totalDays = custom && custom.totalDays != null ? Number(custom.totalDays) : (ct && ct.totalDays != null ? Number(ct.totalDays) : 365);
    if (!isFinite(totalDays) || totalDays <= 1) totalDays = 365;

    var days = "—";
    var daysNum = null;
    if (t) {
      var dt = parseYmdLocal(t);
      if (dt) {
        var now = new Date();
        // compare local midnights to avoid timezone drift
        var today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        var diff = dt.getTime() - today0.getTime();
        var d = Math.ceil(diff / (24 * 60 * 60 * 1000));
        daysNum = clamp(d, 0, 9999);
        days = String(daysNum);
      }
    }
    if (label) label.textContent = headline;
    if (daysEl) daysEl.textContent = days;
    if (sub) sub.textContent = subMsg;
    if (quote) quote.textContent = q;

    if (fill) {
      var pct = 0.5;
      if (daysNum != null && isFinite(daysNum)) {
        pct = 1 - daysNum / totalDays;
      }
      pct = clamp(pct, 0, 1);
      fill.style.width = Math.round(pct * 100) + "%";
    }
  }

export function waitForImages(rootEl, timeoutMs) {
    timeoutMs = timeoutMs == null ? 15000 : Number(timeoutMs);
    if (!isFinite(timeoutMs) || timeoutMs <= 0) timeoutMs = 15000;
    if (!rootEl) return Promise.resolve();

    var imgs = Array.prototype.slice.call(rootEl.querySelectorAll("img"));
    if (!imgs.length) return Promise.resolve();

    function waitImg(img) {
      return new Promise(function (resolve) {
        try {
          if (!img || !img.getAttribute) return resolve();
          var src = img.getAttribute("src");
          if (!src) return resolve();
          if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) return resolve();
          var done = false;
          var t = setTimeout(function () {
            if (done) return;
            done = true;
            resolve();
          }, timeoutMs);
          img.onload = function () {
            if (done) return;
            done = true;
            clearTimeout(t);
            resolve();
          };
          img.onerror = function () {
            if (done) return;
            done = true;
            clearTimeout(t);
            resolve();
          };
          if (img.decode) {
            img
              .decode()
              .then(function () {
                if (done) return;
                done = true;
                clearTimeout(t);
                resolve();
              })
              .catch(function () {});
          }
        } catch (e) {
          resolve();
        }
      });
    }

    return Promise.all(imgs.map(waitImg)).then(function () {});
  }

