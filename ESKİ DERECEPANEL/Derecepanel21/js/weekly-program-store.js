/**
 * Haftalık program kayıtları — öğrenci bazlı localStorage
 */
(function () {
  var KEY = "derecepanel-weekly-programs-v1";

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function writeAll(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function uid() {
    return "wp-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function listByStudent(studentId) {
    if (!studentId) return [];
    var all = readAll();
    return Array.isArray(all[studentId]) ? all[studentId].slice() : [];
  }

  function getProgram(studentId, programId) {
    var list = listByStudent(studentId);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === programId) return list[i];
    }
    return null;
  }

  function saveProgram(studentId, program) {
    if (!studentId || !program) return;
    var all = readAll();
    var list = Array.isArray(all[studentId]) ? all[studentId].slice() : [];
    var now = new Date().toISOString();
    var next = Object.assign({}, program, { updatedAt: now });
    if (!next.id) next.id = uid();
    if (!next.createdAt) next.createdAt = now;
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === next.id) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) list[idx] = next;
    else list.push(next);
    all[studentId] = list;
    writeAll(all);
    return next;
  }

  function deleteProgram(studentId, programId) {
    var all = readAll();
    if (!all[studentId]) return;
    all[studentId] = all[studentId].filter(function (p) {
      return p.id !== programId;
    });
    writeAll(all);
  }

  window.WeeklyProgramStore = {
    listByStudent: listByStudent,
    getProgram: getProgram,
    saveProgram: saveProgram,
    deleteProgram: deleteProgram,
    uid: uid,
  };
})();
