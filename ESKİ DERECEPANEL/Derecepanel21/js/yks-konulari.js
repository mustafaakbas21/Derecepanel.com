/**
 * YKS Konuları — müfredat referans listesi (pages/yks-konulari.html)
 */
(function () {
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function mufredatJsonHref() {
    try {
      return new URL('../yks-mufredat.json', window.location.href).href;
    } catch (_) {
      return '../yks-mufredat.json';
    }
  }

  function buildPlainUI(root, data) {
    root.textContent = '';
    root.removeAttribute('aria-busy');

    ['TYT', 'AYT'].forEach(function (examKey) {
      var list = data[examKey];
      if (!Array.isArray(list)) return;

      var block = document.createElement('div');
      block.className = 'yks-acc-block';
      var head = document.createElement('button');
      head.type = 'button';
      head.className = 'yks-acc-block__head';
      head.innerHTML =
        '<span>' +
        (examKey === 'TYT' ? 'TYT — Temel Yeterlilik Testi' : 'AYT — Alan Yeterlilik Testi') +
        '</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
      var body = document.createElement('div');
      body.className = 'yks-acc-block__body';

      list.forEach(function (ders) {
        var course = document.createElement('div');
        course.className = 'yks-course';
        var cHead = document.createElement('button');
        cHead.type = 'button';
        cHead.className = 'yks-course__head';
        cHead.innerHTML =
          '<div class="yks-course__head-row"><span class="yks-course__title">' +
          escapeHtml(ders.dersAdi || ders.id) +
          '</span><svg class="yks-course__chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div>';
        var cBody = document.createElement('div');
        cBody.className = 'yks-course__body';
        var ul = document.createElement('ul');
        ul.className = 'yks-konu-list';
        (ders.konular || []).forEach(function (konu) {
          var li = document.createElement('li');
          li.className = 'yks-konu-list__item yks-konu-list__item--row';
          var title = String(konu.ad || konu.id || '').trim();
          var span = document.createElement('span');
          span.className = 'yks-konu-list__txt';
          span.textContent = title;
          li.appendChild(span);
          var bridge = window.DereceOgrenciSimBridge;
          if (bridge && title) {
            var user = bridge.getCurrentUser();
            var pid = bridge.primaryWriteId(user);
            if (pid) {
              var wrap = document.createElement('label');
              wrap.className = 'yks-konu-done';
              var cb = document.createElement('input');
              cb.type = 'checkbox';
              var map = bridge.readCompletedTopicsMap(pid);
              cb.checked = !!map[title];
              cb.addEventListener('change', function () {
                var br2 = window.DereceOgrenciSimBridge;
                if (!br2) return;
                var u2 = br2.getCurrentUser();
                var id2 = br2.primaryWriteId(u2);
                if (!id2) return;
                br2.setTopicCompleted(id2, title, cb.checked);
              });
              var lab = document.createElement('span');
              lab.className = 'yks-konu-done-lbl';
              lab.textContent = 'Tamamlandı';
              wrap.appendChild(cb);
              wrap.appendChild(lab);
              li.appendChild(wrap);
            }
          }
          ul.appendChild(li);
        });
        cBody.appendChild(ul);
        cHead.addEventListener('click', function () {
          course.classList.toggle('is-open');
        });
        course.appendChild(cHead);
        course.appendChild(cBody);
        body.appendChild(course);
      });

      head.addEventListener('click', function () {
        block.classList.toggle('is-open');
      });
      block.appendChild(head);
      block.appendChild(body);
      if (examKey === 'TYT') block.classList.add('is-open');
      root.appendChild(block);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('mufredat-root');
    var errEl = document.getElementById('yks-konu-error');
    var errText = document.getElementById('yks-konu-error-text');
    if (!root) return;

    (async function () {
      try {
        var url = mufredatJsonHref();
        var response = await fetch(url);
        if (!response.ok) throw new Error('HTTP ' + response.status + ' — ' + url);
        var mufredatData = await response.json();
        var ph = document.getElementById('mufredat-placeholder');
        if (ph) ph.remove();
        buildPlainUI(root, mufredatData);
      } catch (err) {
        console.error('[YKS Konuları] Müfredat yüklenemedi:', err);
        root.textContent = '';
        if (errText) errText.textContent = 'Veriler yüklenemedi.';
        if (errEl) {
          errEl.hidden = false;
          errEl.style.display = '';
        }
      }
    })();
  });
})();
