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
  // 剔除空字符串字段：空 = 没填过，不应覆盖归档里的真值
  function nonEmpty(o) {
    var out = {};
    Object.keys(o || {}).forEach(function (k) {
      var v = o[k];
      if (k.charAt(0) === '_' || Array.isArray(v) || typeof v !== 'string' || v.trim() !== '') out[k] = v;
    });
    return out;
  }
  function mergeData(a, b) {
    var merged = Object.assign({}, nonEmpty(a), nonEmpty(b));
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
    // 同一日期才继承本地未保存的编辑；跨日期以归档为准，避免旧日期的数值串到新日期
    var merged = base.reportDate === date
      ? Object.assign({}, base, data, { reportDate: date })
      : Object.assign({}, data, { reportDate: date });
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
        // 本地保存的是别的日期 → 不混用，直接按归档渲染
        if (saved.reportDate !== date) { render(date, j); return; }
        // 归档比本地保存时间新 → 归档字段优先；否则本地编辑优先（趋势历史始终合并）
        var archiveNewer = false;
        if (j._archiveStamp) {
          var at = Date.parse(j._archiveStamp);
          var st = saved._savedAt ? Date.parse(saved._savedAt) : 0;
          if (isFinite(at)) archiveNewer = at > (isFinite(st) ? st : 0);
        }
        // 用户手动填过的非空值永远优先，归档只补空缺（避免归档里的空字段清掉本地填写内容）
        var merged = Object.assign({}, j, nonEmpty(saved), { reportDate: saved.reportDate || date });
        merged._trends = mergeTrends(j && j._trends, saved && saved._trends);
        merged._archiveStamp = j._archiveStamp;
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
    // 默认打开最新一期（不看本地残留的旧日期）
    var cur = m ? m[1] : null;
    set[today()] = 1;
    var list = Object.keys(set).sort().reverse();

    fetch('data/manifest.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : { dates: [] }; })
      .catch(function () { return { dates: [] }; })
      .then(function (mf) {
        (mf.dates || []).forEach(function (d) { if (list.indexOf(d) < 0) list.push(d); });
        list.sort().reverse();
        if (!cur || list.indexOf(cur) < 0) cur = list[0] || today();
        var sameDate = saved.reportDate === cur;
        build(list, cur);
        // 本地没有填写内容、或本地记的是别的日期 → 按归档渲染；同日才合并本地编辑
        if (m || !local || !sameDate) go(cur);
        else fetchMerge(cur);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
