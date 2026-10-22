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

  // 判断一份数据里有没有实际填写内容（不含日期/产品名等基础字段和内部字段）
  function hasContent(d) {
    if (!d) return false;
    var base = ['reportDate', 'productName', 'owner', 'stage'];
    return Object.keys(d).some(function (k) {
      return k.charAt(0) !== '_' && base.indexOf(k) < 0 && String(d[k]).trim() !== '';
    });
  }

  // 趋势数据按日期合并：b 的同日期点优先，a 独有的日期保留（防止本地打点覆盖归档历史）
  function mergeTrends(a, b) {
    var keys = {};
    [a, b].forEach(function (t) { Object.keys(t || {}).forEach(function (k) { keys[k] = 1; }); });
    var out = {};
    Object.keys(keys).forEach(function (k) {
      var map = {};
      [a, b].forEach(function (t) {
        (t && t[k] || []).forEach(function (p) {
          if (p && p.date && isFinite(Number(p.value))) map[p.date] = Number(p.value);
        });
      });
      var list = Object.keys(map).sort().map(function (d) { return { date: d, value: map[d] }; });
      if (list.length) out[k] = list.slice(-30);
    });
    return out;
  }
  function mergeData(a, b) {
    var merged = Object.assign({}, a || {}, b || {});
    merged._trends = mergeTrends(a && a._trends, b && b._trends);
    return merged;
  }

  // 把当前 localStorage 里的日报按「日报日期」存一份本地快照（空数据不存）
  function snapshot() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE) || '{}');
      if (!d || !d.reportDate || !hasContent(d)) return;
      var a = readArch();
      var prev = a[d.reportDate] || {};
      a[d.reportDate] = mergeData(prev, d);
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
    var snap = a[date];
    if (snap && hasContent(snap)) { render(date, snap); return; }
    // 本地快照为空时仍去拉归档数据，避免被空快照挡住
    fetch('data/' + date + '.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (j) {
        if (j) render(date, mergeData(snap || {}, j));
        else render(date, snap || { reportDate: date, productName: 'Vidda发现X RGB', stage: '上市期' });
      });
  }

  // 本地已有内容时，仍要把归档里的趋势历史并进来（本地字段值优先，趋势按日期合并）
  function fetchMerge(date) {
    fetch('data/' + date + '.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (j) {
        if (!j) return;
        var saved = {};
        try { saved = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { saved = {}; }
        var merged = Object.assign({}, j, saved, { reportDate: saved.reportDate || date });
        merged._trends = mergeTrends(j && j._trends, saved && saved._trends);
        localStorage.setItem(STORE, JSON.stringify(merged));
        if (typeof initReport === 'function') initReport();
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
    var local = hasContent(saved);
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
        // 本地没有填写内容 → 拉归档渲染；有内容 → 也把归档里的趋势历史并进来
        if (m || !local) go(cur);
        else fetchMerge(cur);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
