/**
 * Öğrenci paneli ↔ Koç paneli — localStorage köprüsü (görev, odak, soru kumbarası)
 */
(function () {
  function getLsJson(key, fallback) {
    try {
      var r = localStorage.getItem(key);
      if (r == null || r === "") return fallback;
      return JSON.parse(r);
    } catch (e) {
      return fallback;
    }
  }

  function setLsJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  window.DereceOgrenciBridge = {
    completedTasksKey: function (ogrenciId) {
      return "completed_tasks_" + ogrenciId;
    },
    totalFocusKey: function (ogrenciId) {
      return "total_focus_time_" + ogrenciId;
    },
    dailyQuestionsKey: function (ogrenciId) {
      return "daily_questions_" + ogrenciId;
    },

    readCompletedTasks: function (ogrenciId) {
      return getLsJson(this.completedTasksKey(ogrenciId), {
        byTaskId: {},
        completedCount: 0,
        totalCount: 0,
        updatedAt: null,
        studentName: "",
      });
    },

    writeCompletedTasksSnapshot: function (ogrenciId, tasks, studentName) {
      var byTaskId = {};
      var n = 0;
      var done = 0;
      (tasks || []).forEach(function (t) {
        var id = t && t.id != null ? String(t.id) : "";
        if (!id) return;
        byTaskId[id] = !!t.done;
        n++;
        if (t.done) done++;
      });
      var payload = {
        byTaskId: byTaskId,
        completedCount: done,
        totalCount: n,
        updatedAt: new Date().toISOString(),
        studentName: studentName || "",
      };
      setLsJson(this.completedTasksKey(ogrenciId), payload);
    },

    readFocusRecord: function (ogrenciId) {
      var raw = getLsJson(this.totalFocusKey(ogrenciId), null);
      if (raw == null) return { totalMinutes: 0, byDay: {} };
      if (typeof raw === "number") return { totalMinutes: raw, byDay: {} };
      if (typeof raw.totalMinutes === "number") {
        return {
          totalMinutes: raw.totalMinutes,
          byDay: raw.byDay && typeof raw.byDay === "object" ? raw.byDay : {},
        };
      }
      return { totalMinutes: 0, byDay: {} };
    },

    addFocusMinutes: function (ogrenciId, minutes) {
      var m = Math.max(0, Math.round(minutes || 0));
      if (!m) return;
      var rec = this.readFocusRecord(ogrenciId);
      var iso = new Date().toISOString().slice(0, 10);
      rec.byDay[iso] = (rec.byDay[iso] || 0) + m;
      rec.totalMinutes = (rec.totalMinutes || 0) + m;
      rec.updatedAt = new Date().toISOString();
      setLsJson(this.totalFocusKey(ogrenciId), rec);
    },

    todayFocusMinutes: function (ogrenciId) {
      var rec = this.readFocusRecord(ogrenciId);
      var iso = new Date().toISOString().slice(0, 10);
      return rec.byDay[iso] || 0;
    },

    readDailyQuestions: function (ogrenciId) {
      var v = getLsJson(this.dailyQuestionsKey(ogrenciId), []);
      return Array.isArray(v) ? v : [];
    },

    addDailyQuestions: function (ogrenciId, count) {
      var n = parseInt(String(count), 10) || 0;
      if (n <= 0) return this.readDailyQuestions(ogrenciId);
      var list = this.readDailyQuestions(ogrenciId).slice();
      var iso = new Date().toISOString().slice(0, 10);
      var found = false;
      for (var i = 0; i < list.length; i++) {
        if (list[i].date === iso) {
          list[i].count = (list[i].count || 0) + n;
          found = true;
          break;
        }
      }
      if (!found) list.push({ date: iso, count: n });
      list.sort(function (a, b) {
        return String(a.date).localeCompare(String(b.date));
      });
      while (list.length > 21) list.shift();
      setLsJson(this.dailyQuestionsKey(ogrenciId), list);
      return list;
    },

    lastSevenDaysQuestionSeries: function (ogrenciId) {
      var list = this.readDailyQuestions(ogrenciId);
      var map = {};
      list.forEach(function (row) {
        if (row && row.date) map[row.date] = row.count || 0;
      });
      var labels = [];
      var values = [];
      for (var i = 6; i >= 0; i--) {
        var x = new Date();
        x.setHours(12, 0, 0, 0);
        x.setDate(x.getDate() - i);
        var ds = x.toISOString().slice(0, 10);
        labels.push(
          x.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" })
        );
        values.push(map[ds] != null ? map[ds] : 0);
      }
      return { labels: labels, values: values };
    },

    /** Koç: katalog id + varsa öğrenci kodu için tamamlanan görev özetini dener */
    /** Koç tarafı: katalog id veya öğrenci kodu altında hangi anahtarda veri varsa onu seçer */
    resolveCoachStorageStudentId: function (catalogStudentId) {
      var tries = [];
      if (catalogStudentId) tries.push(String(catalogStudentId).trim());
      var cat = (window.DereceStudentCatalog || []).find(function (s) {
        return s && s.id === catalogStudentId;
      });
      if (cat && cat.code) tries.push(String(cat.code).trim());
      for (var i = 0; i < tries.length; i++) {
        var id = tries[i];
        if (!id) continue;
        if (this.readDailyQuestions(id).length) return id;
        if ((this.readFocusRecord(id).totalMinutes || 0) > 0) return id;
        var ct = this.readCompletedTasks(id);
        if (ct && (ct.totalCount > 0 || Object.keys(ct.byTaskId || {}).length > 0)) return id;
      }
      return tries[0] || String(catalogStudentId || "").trim();
    },

    readCoachCompletedSummary: function (catalogStudentId) {
      var keys = [];
      if (catalogStudentId) keys.push(catalogStudentId);
      var cat = (window.DereceStudentCatalog || []).find(function (s) {
        return s && s.id === catalogStudentId;
      });
      if (cat && cat.code) keys.push(String(cat.code).trim());
      for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        if (!id) continue;
        var d = this.readCompletedTasks(id);
        if (!d) continue;
        if (!d.totalCount && d.byTaskId) {
          var ks = Object.keys(d.byTaskId);
          d.totalCount = ks.length;
          d.completedCount = ks.filter(function (k) {
            return d.byTaskId[k];
          }).length;
        }
        if (d.totalCount > 0 || d.completedCount > 0) return { ogrenciId: id, data: d };
      }
      return null;
    },
  };
})();
