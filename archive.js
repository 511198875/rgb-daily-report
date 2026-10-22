/* 日期归档：在原有日报版式上叠加，不改动任何渲染逻辑 */
(function () {
  var STORE = 'rgb-daily-report-v1';
  var ARCH = 'rgb-daily-archive-v1';
  var sel = null;

  function pad(n) { return String(n).padStart(2, '0'); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function cn(iso) { var p = iso.split('-'); return (+p[1]) + '月' + (+p[2]) + '日'; }
  function readArch() { try { return JSON.parse(localStorage.getItem(ARCH)) || {}; } catch (e) { return {}; } }
  function writeArch(a) { try { localStorage.setItem(ARCH, JSON.stringify(a)); } catch (e) {} }

  // 把当前 localStorage 里的日报按「日报日期」存一份本地快照
  function snapshot() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE) || '{}');
      if (!d || !d.reportDate) return;
      var a = readArch();
      var prev = a[d.reportDate] || {};
      a[d.reportDate] = Object.assign({}, prev, d);
      writeArch(a);
    } catch (e) {}
  }

  function render(date, data) {
    var base = {};
    try { base = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) {}
    var merged = Object.assign({}, base, data, { reportDate: date });
    localStorage.setItem(STORE, JSON.stringify(merged));
    if (typeof initReport === 'function') initReport();
    var h = location.hash.replace(/[#&]date=[^&]*/, '').replace(/^#&?/, '');
    history.replaceState(null, '', location.pathname + (h ? '#' + h : '') + (h ? '&' : '#') + 'date=' + date);
  }

  function go(date) {
    var a = readArch();
    if (a[date]) { render(date, a[date]); return; }
    fetch('data/' + date + '.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (j) {
        render(date, j || { reportDate: date, productName: 'Vidda发现X RGB', stage: '上市期' });
      });
  }

  function build(dates, current) {
    var host = document.querySelector('.hero-date');
    if (!host) return;
    var box = document.createElement('div');
    box.className = 'date-switch';
    var s = document.createElement('select');
    s.setAttribute('aria-label', '选择日报日期');
    dates.forEach(function (d) {
      var o = document.createElement('option');
      o.value = d;
      o.textContent = cn(d) + (d === today() ? '（今天）' : '');
      if (d === current) o.selected = true;
      s.appendChild(o);
    });
    s.addEventListener('change', function () { go(s.value); });
    box.appendChild(s);
    host.appendChild(box);
    sel = s;
  }

  function init() {
    snapshot();
    var arch = readArch();
    var set = {};
    Object.keys(arch).forEach(function (k) { set[k] = 1; });
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { saved = {}; }
    var hasContent = Object.keys(saved).some(function (k) {
      if (k.charAt(0) === '_') return false;
      if (['reportDate', 'productName', 'owner', 'stage'].indexOf(k) >= 0) return false;
      return saved[k] !== '' && saved[k] !== null && saved[k] !== undefined;
    });
    var m = location.hash.match(/[#&]date=(\d{4}-\d{2}-\d{2})/);
    var cur = m ? m[1] : (saved.reportDate || today());
    set[cur] = 1; set[today()] = 1;
    var list = Object.keys(set).sort().reverse();

    fetch('data/manifest.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : { dates: [] }; })
      .catch(function () { return { dates: [] }; })
      .then(function (mf) {
        (mf.dates || []).forEach(function (d) { if (list.indexOf(d) < 0) list.push(d); });
        list.sort().reverse();
        build(list, cur);
        // 本地没有任何填写内容时，自动加载该日期的归档数据（外发链接首次打开也能看到内容）
        if (m || !hasContent) go(cur);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
