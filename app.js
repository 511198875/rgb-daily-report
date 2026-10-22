const STORAGE_KEY = 'rgb-daily-report-v1';
let dayChangedTo = null;
const DAY_WATCH_MS = 60000;

const FIELD_SECTIONS = [
  {
    id: 'basic', title: '基本信息', desc: '日报日期会自动推导 T-1 数据日期。',
    fields: [
      ['reportDate', '日报日期', 'date'],
      ['productName', '产品 / 项目名', 'text', 'Vidda发现X RGB'],
      ['owner', '负责人', 'text', '选填'],
      ['stage', '上市阶段', 'select', ['预热期', '上市期', '稳定期']]
    ]
  },
  {
    id: 'traffic', title: '核心流量数据', desc: '建议统一填写百分号前的数字，例如 12.5。',
    fields: [
      ['modelSearch', '型号词搜索（T-1）', 'text', '如：18,560'],
      ['modelSearchDoD', '型号词搜索日环比', 'number', '%'],
      ['modelSearchDailyRate', '型号词搜索日完成率', 'number', '%'],
      ['modelSearchMonthlyRate', '10 月累完成率', 'number', '%'],
      ['searchCtr', '搜索点击率 · 发现X RGB', 'number', '%'],
      ['searchCtrBenchmark', '搜索点击率 · 发现X 2027（同期）', 'number', '%'],
      ['detailDuration', '平均停留时长 · 发现X RGB', 'text', '秒，如：49'],
      ['detailDurationBenchmark', '平均停留时长 · 发现X 2027（同期）', 'text', '秒，如：54']
    ]
  },
  {
    id: 'actions', title: '数字营销', desc: '三个渠道分别记录计划、上线、进店与成交表现。',
    fields: [
      ['redbookTotalPlan', '红书 · 总计划', 'number', '篇'],
      ['redbookTodayPlan', '红书 · 今日计划', 'number', '篇'],
      ['redbookTotalOnline', '红书 · 总上线', 'number', '篇'],
      ['redbookTodayOnline', '红书 · 今日上线', 'number', '篇'],
      ['redbookHealth', '红书 · 健康度', 'select', ['正常', '滞后']],
      ['biliTotalPlan', 'B站 · 总计划', 'number', '条'],
      ['biliTodayPlan', 'B站 · 今日计划', 'number', '条'],
      ['biliTotalOnline', 'B站 · 总上线', 'number', '条'],
      ['biliTodayOnline', 'B站 · 今日上线', 'number', '条'],
      ['biliHealth', 'B站 · 健康度', 'select', ['正常', '滞后']],
      ['douyinTotalPlan', '抖音 · 总计划', 'number', '条'],
      ['douyinTodayPlan', '抖音 · 今日计划', 'number', '条'],
      ['douyinTotalOnline', '抖音 · 总上线', 'number', '条'],
      ['douyinTodayOnline', '抖音 · 今日上线', 'number', '条'],
      ['douyinHealth', '抖音 · 健康度', 'select', ['正常', '滞后']],
      ['geoQuestion', 'GEO · 核心问题', 'textarea', '今日重点追踪的问题'],
      ['geoArticles', 'GEO · 发文', 'number', '篇'],
      ['geoExposure', 'GEO · 露出率', 'number', '%'],
      ['contentPlan', '站内内容 · 计划', 'number', '篇'],
      ['contentOnline', '站内内容 · 已上线', 'number', '篇'],
      ['contentTraffic', '站内内容 · 内容流量', 'text', '如：126,500'],
      ['contentDailyRate', '站内内容 · 日完成率', 'number', '%'],
      ['contentMonthlyRate', '站内内容 · 10 月累完成率', 'number', '%']
    ]
  },
  {
    id: 'reputation', title: '口碑与用户原声', desc: '记录口碑进度与评论区负面声音。',
    fields: [
      ['repPositive', '今日发布正面内容数量', 'number', '条'],
      ['repComment', '今日维护评论内容数量', 'number', '条'],
      ['repTop', 'TOP 占比', 'number', '%'],
      ['repCoverage', '今日覆盖率', 'number', '%'],
      ['negNew', '负面内容新增数量', 'number', '条'],
      ['negCompetitor', '负面 · 竞品攻击', 'number', '条'],
      ['negQuality', '负面 · 产品质量', 'number', '条'],
      ['negAfterSale', '负面 · 产品售后', 'number', '条'],
      ['negSummary', '评论区负面总结', 'textarea', '一两句话概括']
    ]
  },
  {
    id: 'adjust', title: '动作调整', desc: '记录流量与口碑今日待执行的动作。',
    fields: [
      ['trafficAdjustment', '流量 · 动作调整', 'textarea', '无异常可不填'],
      ['reputationAdjustment', '口碑 · 动作调整', 'textarea', '无异常可不填']
    ]
  },
  {
    id: 'diagnosis', title: '流量诊断', desc: '记录流量异常、机会点与关键结论。',
    fields: [
      ['trafficDiagnosis', '流量 · 当日诊断', 'textarea', '异常原因、机会点或关键结论']
    ]
  }
];

const MODULE_SECTIONS = [
  { id: 'basic', title: '基本信息', desc: '日报日期会自动推导 T-1 数据日期。', fields: [
    ['reportDate', '日报日期', 'date'], ['productName', '产品 / 项目名', 'text', 'Vidda发现X RGB'], ['owner', '负责人', 'text', '选填'], ['stage', '上市阶段', 'select', ['预热期', '上市期', '稳定期']]
  ]},
  { id: 'model', title: '型号词', desc: '填写型号词搜索及目标完成情况，可上传后台原生截图佐证。', fields: [
    ['modelSearch', '型号词搜索（T-1）', 'text', '如：18,560'], ['modelSearchDoD', '型号词搜索日环比', 'number', '%'], ['modelSearchDailyRate', '型号词搜索日完成率', 'number', '%'], ['modelSearchMonthlyRate', '10 月累完成率', 'number', '%'], ['modelShot', '后台原生截图', 'image']
  ]},
  { id: 'search-detail', title: '搜索与商详', desc: '搜索点击率与平均停留时长，均对比发现X 2027 同期。', fields: [
    ['searchCtr', '搜索点击率 · 发现X RGB', 'number', '%'], ['searchCtrBenchmark', '搜索点击率 · 发现X 2027（同期）', 'number', '%'], ['detailDuration', '平均停留时长 · 发现X RGB', 'text', '秒，如：49'], ['detailDurationBenchmark', '平均停留时长 · 发现X 2027（同期）', 'text', '秒，如：54']
  ]},
  { id: 'redbook', title: '红书', desc: '填写红书总计划、今日计划、总上线、今日上线与健康度。', fields: [
    ['redbookTotalPlan', '红书 · 总计划', 'number', '篇'], ['redbookTodayPlan', '红书 · 今日计划', 'number', '篇'], ['redbookTotalOnline', '红书 · 总上线', 'number', '篇'], ['redbookTodayOnline', '红书 · 今日上线', 'number', '篇'], ['redbookHealth', '红书 · 健康度', 'select', ['正常', '滞后']]
  ]},
  { id: 'bilibili', title: 'B站', desc: '填写 B 站总计划、今日计划、总上线、今日上线与健康度。', fields: [
    ['biliTotalPlan', 'B站 · 总计划', 'number', '条'], ['biliTodayPlan', 'B站 · 今日计划', 'number', '条'], ['biliTotalOnline', 'B站 · 总上线', 'number', '条'], ['biliTodayOnline', 'B站 · 今日上线', 'number', '条'], ['biliHealth', 'B站 · 健康度', 'select', ['正常', '滞后']]
  ]},
  { id: 'douyin', title: '抖音', desc: '填写抖音总计划、今日计划、总上线、今日上线与健康度。', fields: [
    ['douyinTotalPlan', '抖音 · 总计划', 'number', '条'], ['douyinTodayPlan', '抖音 · 今日计划', 'number', '条'], ['douyinTotalOnline', '抖音 · 总上线', 'number', '条'], ['douyinTodayOnline', '抖音 · 今日上线', 'number', '条'], ['douyinHealth', '抖音 · 健康度', 'select', ['正常', '滞后']]
  ]},
  { id: 'geo', title: 'GEO', desc: '填写 GEO 核心问题、发文及露出率。', fields: [
    ['geoQuestion', 'GEO · 核心问题', 'textarea', '今日重点追踪的问题'], ['geoArticles', 'GEO · 发文', 'number', '篇'], ['geoExposure', 'GEO · 露出率', 'number', '%']
  ]},
  { id: 'content', title: '站内内容', desc: '填写内容供给、流量及目标完成情况。', fields: [
    ['contentPlan', '站内内容 · 计划', 'number', '篇'], ['contentOnline', '站内内容 · 已上线', 'number', '篇'], ['contentTraffic', '站内内容 · 内容流量', 'text', '如：126,500'], ['contentDailyRate', '站内内容 · 日完成率', 'number', '%'], ['contentMonthlyRate', '站内内容 · 10 月累完成率', 'number', '%']
  ]},
  { id: 'reputation', title: '口碑与用户原声', desc: '填写口碑进度与评论区负面声音洞察。', fields: [
    ['repPositive', '今日发布正面内容数量', 'number', '条'], ['repComment', '今日维护评论内容数量', 'number', '条'], ['repTop', 'TOP 占比', 'number', '%'], ['repCoverage', '今日覆盖率', 'number', '%'], ['negNew', '负面内容新增数量', 'number', '条'], ['negCompetitor', '负面 · 竞品攻击', 'number', '条'], ['negQuality', '负面 · 产品质量', 'number', '条'], ['negAfterSale', '负面 · 产品售后', 'number', '条'], ['negSummary', '评论区负面总结', 'textarea', '一两句话概括']
  ]},
  { id: 'adjust', title: '动作调整', desc: '记录流量与口碑今日待执行的动作。', fields: [
    ['trafficAdjustment', '流量 · 动作调整', 'textarea', '无异常可不填'], ['reputationAdjustment', '口碑 · 动作调整', 'textarea', '无异常可不填']
  ]},
  { id: 'diagnosis', title: '流量诊断', desc: '记录流量异常、机会点与关键结论。', fields: [
    ['trafficDiagnosis', '流量 · 当日诊断', 'textarea', '异常原因、机会点或关键结论'], ['diagShot', '诊断原生截图', 'image']
  ]}
];

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const defaultData = () => {
  const today = localDateKey();
  return { reportDate: today, productName: 'Vidda发现X RGB', stage: '上市期', _autoDateStamp: today };
};

function safeParse(raw) { try { return JSON.parse(raw) || {}; } catch { return {}; } }
function readData({ autoAdvance = false } = {}) {
  const shared = new URLSearchParams(location.search).get('d');
  if (shared) {
    try { return { ...defaultData(), ...JSON.parse(decodeURIComponent(escape(atob(shared.replace(/-/g, '+').replace(/_/g, '/'))))) }; } catch {}
  }
  const saved = safeParse(localStorage.getItem(STORAGE_KEY));
  const today = localDateKey();
  const data = { ...defaultData(), ...saved };
  if (!saved.productName || saved.productName === 'RGB 新品') data.productName = 'Vidda发现X RGB';
  if (autoAdvance && saved._autoDateStamp !== today) {
    const baseFields = ['reportDate', 'productName', 'owner', 'stage'];
    const hadContent = Object.keys(saved).some(key => !key.startsWith('_') && !baseFields.includes(key) && has(saved[key]));
    data.reportDate = today;
    data._autoDateStamp = today;
    if (hadContent && saved._autoDateStamp) dayChangedTo = today;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  return data;
}
function parseMetricNumber(value) {
  if (!has(value)) return null;
  const number = Number(String(value).replace(/[,，\s]/g, ''));
  return Number.isFinite(number) ? number : null;
}
function parseDuration(value) {
  if (!has(value)) return null;
  const s = String(value).trim();
  const mm = s.match(/(\d+(?:\.\d+)?)\s*(?:m|M|分|分钟)/);
  const ss = s.match(/(\d+(?:\.\d+)?)\s*(?:s|S|秒)/);
  if (mm || ss) return Math.round((mm ? Number(mm[1]) * 60 : 0) + (ss ? Number(ss[1]) : 0));
  const colon = s.match(/^(\d+)\s*[:：]\s*(\d{1,2})$/);
  if (colon) return Number(colon[1]) * 60 + Number(colon[2]);
  const num = Number(s.replace(/[^\d.]/g, ''));
  return Number.isFinite(num) && String(s).match(/\d/) ? Math.round(num) : null;
}
function formatDuration(sec) {
  if (!Number.isFinite(sec)) return '';
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}
const TREND_METRICS = {
  modelSearch: { label: '型号词搜索', unit: '', parse: v => parseMetricNumber(v), fmt: v => Math.round(v).toLocaleString('zh-CN') },
  searchCtr: { label: '搜索点击率', unit: '%', parse: v => parseMetricNumber(v), fmt: v => `${Number(v.toFixed(1))}%` },
  detailDuration: { label: '平均停留时长', unit: '秒', parse: v => parseMetricNumber(v), fmt: v => `${v}秒` }
};
function withTrendHistory(data, previous = {}, capture = false) {
  const legacy = Array.isArray(previous._modelSearchHistory) ? { modelSearch: previous._modelSearchHistory } : {};
  const trends = { ...legacy, ...(previous._trends || {}) };
  const date = tMinusOne(data.reportDate);
  if (capture && date) {
    Object.keys(TREND_METRICS).forEach(key => {
      const value = TREND_METRICS[key].parse(data[key]);
      if (value === null) return;
      const list = Array.isArray(trends[key]) ? [...trends[key]] : [];
      const index = list.findIndex(point => point.date === date);
      if (index >= 0) list[index] = { date, value };
      else list.push({ date, value });
      trends[key] = list.sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
    });
  }
  return { ...data, _trends: trends };
}
function writeData(data, captureTrends = false) {
  const previous = safeParse(localStorage.getItem(STORAGE_KEY));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...withTrendHistory(data, previous, captureTrends), _autoDateStamp: localDateKey() }));
  } catch {
    showToast('本地空间不足，请移除部分截图后再保存');
  }
}
const CAMPAIGN = { label: '双十一', start: '2026-10-07', end: '2026-11-11' };
function campaignProgress(dateStr) {
  const base = dateStr || localDateKey();
  const start = new Date(`${CAMPAIGN.start}T00:00:00`);
  const end = new Date(`${CAMPAIGN.end}T00:00:00`);
  const now = new Date(`${base}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(now.getTime())) return null;
  const DAY = 86400000;
  const totalDays = Math.round((end - start) / DAY) + 1;
  const passedDays = Math.round((now - start) / DAY) + 1;
  const clamped = Math.min(Math.max(passedDays, 0), totalDays);
  return {
    percent: Math.round(clamped / totalDays * 1000) / 10,
    passedDays: clamped,
    totalDays,
    before: passedDays < 1,
    ended: passedDays > totalDays
  };
}
function has(v) { return v !== undefined && v !== null && String(v).trim() !== ''; }
function val(data, key, suffix = '') { return has(data[key]) ? `${data[key]}${suffix}` : '待补充'; }
function esc(s) { return String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function formatDate(dateStr, short = false) {
  if (!dateStr) return '日期待定';
  const [y,m,d] = dateStr.split('-').map(Number);
  return short ? `${m}月${d}日` : `${y}年${m}月${d}日`;
}
function tMinusOne(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0,10);
}
function trend(v) { return has(v) && Number(v) > 0 ? `+${v}%` : has(v) ? `${v}%` : '待补充'; }
function metric(label, value) { return `<div class="metric"><label>${esc(label)}</label><strong class="${value === '待补充' ? 'empty' : ''}">${esc(value)}</strong></div>`; }
function metricWithBenchmark(label, value, benchmarkLabel, benchmarkValue) {
  return `<div class="metric with-benchmark"><label>${esc(label)}</label><strong class="${value === '待补充' ? 'empty' : ''}">${esc(value)}</strong><div class="benchmark"><span>${esc(benchmarkLabel)}</span><b>${esc(benchmarkValue)}</b></div></div>`;
}
function textOrEmpty(v) { return has(v) ? esc(v) : '<span class="empty-state">待补充</span>'; }

function trendPoints(data, key) {
  const list = Array.isArray(data._trends?.[key]) ? [...data._trends[key]] : [];
  const value = TREND_METRICS[key].parse(data[key]);
  const date = tMinusOne(data.reportDate);
  if (date && value !== null) {
    const index = list.findIndex(point => point.date === date);
    const currentPoint = { date, value };
    if (index >= 0) list[index] = currentPoint;
    else list.push(currentPoint);
  }
  return list
    .filter(point => point && point.date && Number.isFinite(Number(point.value)))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map(point => ({ date: point.date, value: Number(point.value) }));
}
function trendPanel(key, data, opts = {}) {
  const cfg = TREND_METRICS[key];
  const points = trendPoints(data, key);
  const width = opts.width || 760;

  if (!points.length) {
    return `<details class="trend-panel"${opts.open ? ' open' : ''}><summary><span><b>日趋势图</b><small>最近 7 天${cfg.label}</small></span><i aria-hidden="true"></i></summary><div class="trend-empty">填写${cfg.label}数据后，将自动生成每日趋势折线图</div></details>`;
  }

  const height = opts.height || 230, left = 56, right = 18, top = 24, bottom = 44;
  const values = points.map(point => point.value);
  let min = Math.min(...values), max = Math.max(...values);
  const padding = Math.max((max - min) * .18, max * .08, 1);
  min = Math.max(0, min - padding);
  max += padding;
  if (max === min) max = min + 1;
  const x = index => points.length === 1 ? (left + width - right) / 2 : left + index * (width - left - right) / (points.length - 1);
  const y = value => top + (max - value) * (height - top - bottom) / (max - min);
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${x(index).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' ');
  const grid = [0, .5, 1].map(ratio => {
    const gy = top + ratio * (height - top - bottom);
    const label = cfg.fmt(max - ratio * (max - min));
    return `<line x1="${left}" y1="${gy}" x2="${width-right}" y2="${gy}"/><text x="${left-10}" y="${gy+4}" text-anchor="end">${label}</text>`;
  }).join('');
  const marks = points.map((point, index) => {
    const px = x(index), py = y(point.value);
    const dateLabel = point.date.slice(5).replace('-', '/');
    const shown = cfg.fmt(point.value);
    return `<g class="trend-point"><circle cx="${px}" cy="${py}" r="5"><title>${dateLabel} · ${shown}</title></circle><text class="trend-value" x="${px}" y="${py-12}" text-anchor="middle">${shown}</text><text class="trend-date" x="${px}" y="${height-16}" text-anchor="middle">${dateLabel}</text></g>`;
  }).join('');
  const latest = points[points.length - 1];
  return `<details class="trend-panel${opts.large ? ' trend-panel-lg' : ''}"${opts.open ? ' open' : ''}><summary><span><b>日趋势图</b><small>最近 ${points.length} 天${cfg.label}</small></span><i aria-hidden="true"></i></summary><div class="trend-chart-head"><span>${cfg.label}</span><b>最新 ${cfg.fmt(latest.value)}</b></div><div class="trend-chart-scroll"><svg class="trend-chart${opts.large ? ' trend-chart-lg' : ''}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${cfg.label}最近 ${points.length} 天趋势折线图"><g class="trend-grid">${grid}</g><path class="trend-area" d="${path} L ${x(points.length-1).toFixed(1)} ${height-bottom} L ${x(0).toFixed(1)} ${height-bottom} Z"/><path class="trend-line" d="${path}"/>${marks}</svg></div></details>`;
}

function initEditor() {
  const form = document.querySelector('#report-form');
  if (!form) return;
  const data = readData({ autoAdvance: true });
  const nav = document.querySelector('#section-nav');
  nav.innerHTML = `<a href="#all" data-module="all" class="active">全部模块</a>${MODULE_SECTIONS.map(s => `<a href="#${s.id}" data-module="${s.id}">${s.title}</a>`).join('')}`;
  form.innerHTML = `
    ${dayChangedTo ? `<div class="day-banner"><p><b>已自动切换到 ${formatDate(dayChangedTo)}</b>（数据周期 ${formatDate(tMinusOne(dayChangedTo))}）。表单里仍是上一次填写的数据，更新后保存即可；要重新填写就点右侧按钮。</p><button class="btn secondary small" type="button" id="day-reset">清空重填</button></div>` : ''}
    <div class="module-picker">
      <div><span>选择填写模块</span><small>一次只看一组，填写更轻松</small></div>
      <select id="module-picker" aria-label="选择填写模块"><option value="all">全部模块</option>${MODULE_SECTIONS.map(s => `<option value="${s.id}">${s.title}</option>`).join('')}</select>
    </div>
  ` + MODULE_SECTIONS.map(section => `
    <section class="form-card" id="${section.id}">
      <h2>${section.title}</h2><div class="form-desc">${section.desc}</div>
      <div class="form-grid">${section.fields.map(field => fieldHtml(field, data)).join('')}</div>
    </section>`).join('');

  const picker = document.querySelector('#module-picker');
  const showModule = id => {
    document.querySelectorAll('.form-card').forEach(card => card.classList.toggle('module-hidden', id !== 'all' && card.id !== id));
    nav.querySelectorAll('a').forEach(link => link.classList.toggle('active', link.dataset.module === id));
    picker.value = id;
  };
  picker.addEventListener('change', e => showModule(e.target.value));
  bindShotFields(form, () => saveForm(false, true));
  const dayResetBtn = document.querySelector('#day-reset');
  if (dayResetBtn) dayResetBtn.addEventListener('click', () => {
    if (!confirm('清空上一次填写的数据？历史趋势记录会保留。')) return;
    const raw = safeParse(localStorage.getItem(STORAGE_KEY)) || {};
    const keep = {
      reportDate: raw.reportDate || localDateKey(),
      productName: raw.productName, owner: raw.owner, stage: raw.stage,
      _autoDateStamp: raw._autoDateStamp,
      _trends: raw._trends, _modelSearchHistory: raw._modelSearchHistory
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keep));
    location.reload();
  });
  nav.addEventListener('click', e => {
    const link = e.target.closest('[data-module]');
    if (!link) return;
    e.preventDefault();
    showModule(link.dataset.module);
    document.querySelector('.module-picker').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('input', event => { saveForm(false, Object.keys(TREND_METRICS).includes(event.target.name)); });
  document.querySelector('#save-btn').addEventListener('click', () => saveForm(true, true));
  document.querySelector('#reset-btn').addEventListener('click', () => {
    if (!confirm('确定清空当前日报数据吗？')) return;
    localStorage.removeItem(STORAGE_KEY); location.reload();
  });
  document.querySelector('#preview-btn').addEventListener('click', () => { saveForm(false, true); location.href = 'index.html'; });
  document.querySelector('#shareback-btn').addEventListener('click', () => {
    saveForm(false, true);
    const merged = { ...readData(), ...Object.fromEntries(new FormData(form).entries()) };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(merged)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = `${location.origin}${location.pathname.replace(/edit\.html$/, 'index.html')}?d=${encoded}`;
    if (copySync(url)) showToast('链接已复制，发给日报负责人即可');
    else showLinkPanel(url);
  });
  updateT1(data.reportDate);
  document.querySelector('[name="reportDate"]').addEventListener('input', e => updateT1(e.target.value));

  function saveForm(withToast, captureModelSearch = false) {
    const next = Object.fromEntries(new FormData(form).entries());
    writeData(next, captureModelSearch);
    document.querySelector('#save-state').textContent = `已自动保存 · ${new Date().toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'})}`;
    if (withToast) showToast('日报已保存');
  }
}

function fieldHtml([name, label, type, meta], data) {
  const full = type === 'textarea';
  if (type === 'image') return `<div class="field full shot-field" data-shot="${name}"><label>${label}</label><input type="hidden" id="${name}" name="${name}" value="${esc(data[name] || '')}"><div class="shot-preview"></div><label class="shot-btn">上传截图<input type="file" accept="image/*" hidden></label></div>`;
  if (type === 'select') return `<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${meta.map(x => `<option ${data[name]===x?'selected':''}>${x}</option>`).join('')}</select></div>`;
  if (type === 'textarea') return `<div class="field full"><label for="${name}">${label}</label><textarea id="${name}" name="${name}" placeholder="${esc(meta || '')}">${esc(data[name] || '')}</textarea></div>`;
  if (type === 'number' && meta) return `<div class="field"><label for="${name}">${label}</label><div class="unit-input"><input id="${name}" name="${name}" type="number" step="any" value="${esc(data[name] || '')}" placeholder="0"><span>${esc(meta)}</span></div></div>`;
  return `<div class="field ${full?'full':''}"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${esc(data[name] || '')}" placeholder="${esc(meta || '')}"></div>`;
}

function updateT1(date) { const el = document.querySelector('#t1-hint'); if (el) el.textContent = `本日报采集 ${formatDate(tMinusOne(date), true)}（T-1）数据`; }

function shrinkImage(file, maxWidth = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function bindShotFields(form, persist) {
  form.querySelectorAll('.shot-field').forEach(field => {
    const hidden = field.querySelector('input[type=hidden]');
    const fileInput = field.querySelector('input[type=file]');
    const preview = field.querySelector('.shot-preview');
    const paint = () => {
      preview.innerHTML = hidden.value
        ? `<img src="${esc(hidden.value)}" alt="截图预览"><button type="button" class="shot-remove">移除</button>`
        : '';
      const remove = preview.querySelector('.shot-remove');
      if (remove) remove.addEventListener('click', () => { hidden.value = ''; paint(); persist(); showToast('截图已移除'); });
    };
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        hidden.value = await shrinkImage(file);
        paint();
        persist();
        showToast('截图已添加');
      } catch {
        showToast('图片处理失败，换一张试试');
      }
      fileInput.value = '';
    });
    paint();
  });
}

function initReport() {
  const root = document.querySelector('#report-root');
  if (!root) return;
  const d = readData();
  document.querySelector('#report-title').textContent = `${d.productName || 'Vidda发现X RGB'} 流量日报`;
  document.querySelector('#report-date').textContent = formatDate(d.reportDate, true);
  document.querySelector('#t1-date').textContent = `数据周期：${formatDate(tMinusOne(d.reportDate))}（T-1）`;
  document.querySelector('#report-stage').textContent = `${d.stage || '阶段待定'}${has(d.owner) ? ` · ${d.owner}` : ''}`;

  const campaign = campaignProgress(d.reportDate);
  root.innerHTML = `
    <section class="card" aria-label="核心指标">
      <div class="card-head"><div><div class="card-kicker">01 / TRAFFIC</div><h2>核心流量</h2></div><div class="accent-line"></div></div>
      <div class="metric-groups">
        <div class="metric-group">
          <div class="metric-group-label">型号词表现</div>
          <div class="metrics">
            ${metric('型号词搜索（T-1）', val(d, 'modelSearch'))}
            ${metric('日环比', trend(d.modelSearchDoD))}
            ${metric('日完成率', val(d, 'modelSearchDailyRate', '%'))}
            ${metric('10 月累完成率', val(d, 'modelSearchMonthlyRate', '%'))}
          </div>
          ${trendPanel('modelSearch', d, { width: 900, height: 300, large: true, open: true })}
          ${shotBlock(d.modelShot)}
        </div>
        <div class="metric-group secondary">
          <div class="metric-group-label">搜索与商详表现</div>
          <div class="metrics comparison-grid">
            <div class="benchmark-col">
              ${metricWithBenchmark('搜索点击率', val(d, 'searchCtr', '%'), '控比 · 发现X 2027（同期）', val(d, 'searchCtrBenchmark', '%'))}
              ${trendPanel('searchCtr', d, { width: 540 })}
            </div>
            <div class="benchmark-col">
              ${metricWithBenchmark('平均停留时长', val(d, 'detailDuration'), '控比 · 发现X 2027（同期）', val(d, 'detailDurationBenchmark'))}
              ${trendPanel('detailDuration', d, { width: 540 })}
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="card">
      <div class="card-head"><div><div class="card-kicker">02 / DIGITAL MARKETING</div><div class="card-title-row"><h2>数字营销</h2>${campaign ? `<span class="time-chip" title="${CAMPAIGN.start} 至 ${CAMPAIGN.end} · 第 ${campaign.passedDays} 天 / 共 ${campaign.totalDays} 天">时间进度 ${campaign.percent}%</span>` : ''}</div></div><div class="accent-line red"></div></div>
      <div class="channel-grid">
        ${channel('红书', d, 'redbook', { unit: ' 篇' })}
        ${channel('B站', d, 'bili', { unit: ' 条' })}
        ${channel('抖音', d, 'douyin', { unit: ' 条' })}
        ${geoChannel(d)}
      </div>
      <div class="subsection">
        <div class="subsection-title"><span>站内内容</span><small>ON-SITE CONTENT</small></div>
        <div class="metrics content-metrics">
          ${metric('计划 / 已上线', `${val(d,'contentPlan')} / ${val(d,'contentOnline')}`)}
          ${metric('内容流量', val(d,'contentTraffic'))}
          ${metric('日完成率', val(d,'contentDailyRate','%'))}
          ${metric('10 月累完成率', val(d,'contentMonthlyRate','%'))}
        </div>
      </div>
    </section>
    <section class="card">
      <div class="card-head"><div><div class="card-kicker">03 / REPUTATION & VOICE</div><h2>口碑与用户原声</h2></div><div class="accent-line amber"></div></div>
      <div class="subsection is-first">
        <div class="subsection-title"><span>口碑进度</span><small>REPUTATION PROGRESS</small></div>
        <div class="metrics rep-metrics">
          ${metric('今日发布正面内容', val(d,'repPositive',' 条'))}
          ${metric('今日维护评论内容', val(d,'repComment',' 条'))}
          ${metric('TOP 占比', val(d,'repTop','%'))}
          ${metric('今日覆盖率', val(d,'repCoverage','%'))}
        </div>
      </div>
      <div class="subsection">
        <div class="subsection-title"><span>评论区用户声音洞察</span><small>NEGATIVE INSIGHTS</small></div>
        ${negativePie(d)}
        <div class="note negative" style="margin-top:14px"><span class="note-label">评论区负面总结</span>${textOrEmpty(d.negSummary)}</div>
      </div>
    </section>
    ${actionCard(d)}
    <section class="card">
      <div class="card-head"><div><div class="card-kicker">05 / DIAGNOSIS</div><h2>流量诊断</h2></div><div class="accent-line"></div></div>
      ${noteBlock('当日诊断', d.trafficDiagnosis, 'note')}
      ${shotBlock(d.diagShot)}
    </section>
  `;

  root.querySelectorAll('.shot-view img').forEach(img => {
    img.addEventListener('click', () => openLightbox(img.src));
  });

  document.querySelector('#copy-btn').addEventListener('click', () => copyText(toPlainText(d), '日报文案已复制'));
  document.querySelector('#share-btn').addEventListener('click', () => {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(d)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    copyText(`${location.origin}${location.pathname}?d=${encoded}`, '分享链接已复制');
  });
  document.querySelector('#image-btn').addEventListener('click', () => exportReportImage(d));
  document.querySelector('#print-btn').addEventListener('click', () => window.print());
}

async function exportReportImage(data) {
  const button = document.querySelector('#image-btn');
  if (typeof window.html2canvas !== 'function') {
    showToast('原图组件加载失败，请刷新后重试');
    return;
  }
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = '正在生成…';
  document.body.classList.add('exporting-image');
  try {
    const target = document.querySelector('main.shell');
    const canvas = await window.html2canvas(target, {
      scale: Math.max(2, Math.min(3, window.devicePixelRatio || 2)),
      backgroundColor: '#f6f5f1',
      useCORS: true,
      logging: false,
      windowWidth: 1240,
      scrollX: 0,
      scrollY: 0
    });
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1));
    if (!blob) throw new Error('PNG generation failed');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.productName || 'Vidda发现X RGB'}流量日报-${data.reportDate || localDateKey()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast('高清原图已导出');
  } catch {
    showToast('生成失败，请刷新后重试');
  } finally {
    document.body.classList.remove('exporting-image');
    button.disabled = false;
    button.textContent = originalText;
  }
}

function healthChip(v) {
  if (!has(v)) return '';
  return `<span class="health-chip ${v === '滞后' ? 'lag' : 'ok'}">${esc(v)}</span>`;
}
function channel(name, d, key, opts = {}) {
  const unit = opts.unit || ' 条';
  const stat = (label, field) => `<div class="channel-stat"><span>${label}</span><b>${val(d, `${key}${field}`, unit)}</b></div>`;
  return `<div class="channel-card">
    <div class="channel-name"><i class="dot"></i>${name}${healthChip(d[`${key}Health`])}</div>
    <div class="channel-stats">
      ${stat('总计划', 'TotalPlan')}
      ${stat('今日计划', 'TodayPlan')}
      ${stat('总上线', 'TotalOnline')}
      ${stat('今日上线', 'TodayOnline')}
    </div>
  </div>`;
}
function geoChannel(d) {
  return `<div class="channel-card">
    <div class="channel-name"><i class="dot"></i>GEO</div>
    <div class="channel-stats geo-stats">
      <div class="channel-stat wide"><span>核心问题</span><b>${textOrEmpty(d.geoQuestion)}</b></div>
      <div class="channel-stat"><span>发文</span><b>${val(d,'geoArticles',' 篇')}</b></div>
      <div class="channel-stat"><span>露出率</span><b>${val(d,'geoExposure','%')}</b></div>
    </div>
  </div>`;
}
function shotBlock(raw) {
  if (!has(raw) || !String(raw).startsWith('data:image')) return '';
  return `<div class="shot-view"><img src="${esc(raw)}" alt="原生截图"></div>`;
}
function openLightbox(src) {
  const old = document.getElementById('shot-lightbox');
  if (old) old.remove();
  const wrap = document.createElement('div');
  wrap.id = 'shot-lightbox';
  wrap.style.cssText = 'position:fixed;inset:0;z-index:300;background:rgba(16,15,14,.82);display:flex;align-items:center;justify-content:center;padding:32px;cursor:zoom-out';
  wrap.innerHTML = `<img src="${esc(src)}" style="max-width:100%;max-height:100%;border-radius:8px;box-shadow:0 24px 60px rgba(0,0,0,.4)">`;
  wrap.addEventListener('click', () => wrap.remove());
  document.body.appendChild(wrap);
}
function actionCard(d) {
  const items = [
    has(d.trafficAdjustment) && { tag: '流量', en: 'TRAFFIC', value: d.trafficAdjustment },
    has(d.reputationAdjustment) && { tag: '口碑', en: 'REPUTATION', value: d.reputationAdjustment }
  ].filter(Boolean);
  if (!items.length) return '';
  return `<section class="card">
      <div class="card-head"><div><div class="card-kicker">04 / ACTION ITEMS</div><h2>动作调整</h2></div><div class="accent-line red"></div></div>
      ${items.map((item, index) => `<div class="subsection${index === 0 ? ' is-first' : ''}"><div class="subsection-title"><span>${item.tag}</span><small>${item.en}</small></div>${noteBlock('动作调整', item.value, 'note negative')}</div>`).join('')}
    </section>`;
}
function pieSlice(cx, cy, r, startAngle, endAngle) {
  const rad = a => (a - 90) * Math.PI / 180;
  const x1 = cx + r * Math.cos(rad(startAngle)), y1 = cy + r * Math.sin(rad(startAngle));
  const x2 = cx + r * Math.cos(rad(endAngle)), y2 = cy + r * Math.sin(rad(endAngle));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}
function negativePie(d) {
  const items = [
    { label: '竞品攻击', value: parseMetricNumber(d.negCompetitor), color: '#2357ff' },
    { label: '产品质量', value: parseMetricNumber(d.negQuality), color: '#ef4f71' },
    { label: '产品售后', value: parseMetricNumber(d.negAfterSale), color: '#f0a13a' }
  ];
  const filled = items.filter(item => item.value !== null && item.value > 0);
  const total = filled.reduce((sum, item) => sum + item.value, 0);
  const centerTotal = parseMetricNumber(d.negNew);
  const totalBlock = `<div class="neg-total"><span>负面内容新增</span><b class="${centerTotal === null ? 'empty' : ''}">${centerTotal !== null ? `${centerTotal}<small>条</small>` : '待补充'}</b></div>`;
  if (!total) return `<div class="neg-pie-wrap">${totalBlock}<div class="neg-pie-empty">填写竞品攻击、产品质量、产品售后数量后，自动生成饼图</div></div>`;
  const size = 132, cx = 66, cy = 66, r = 52;
  let angle = 0, slices = '';
  filled.forEach(item => {
    const sweep = item.value / total * 360;
    if (filled.length === 1 || sweep >= 359.99) slices += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${item.color}"/>`;
    else slices += `<path d="${pieSlice(cx, cy, r, angle, angle + sweep)}" fill="${item.color}"/>`;
    angle += sweep;
  });
  const legend = filled.map(item => {
    const pct = Math.round(item.value / total * 100);
    return `<div class="neg-legend-item"><i style="background:${item.color}"></i><span>${item.label}</span><b>${item.value} 条</b><small>${pct}%</small></div>`;
  }).join('');
  return `<div class="neg-pie-wrap">
    ${totalBlock}
    <svg class="neg-pie" viewBox="0 0 ${size} ${size}" role="img" aria-label="负面内容来源分布饼图">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#f0f0ee"/>
      ${slices}
      <circle cx="${cx}" cy="${cy}" r="34" fill="#fff"/>
    </svg>
    <div class="neg-legend">${legend}</div>
  </div>`;
}
function noteBlock(label, value, cls) { return `<div class="${cls}"><span class="note-label">${label}</span>${textOrEmpty(value)}</div>`; }

function toPlainText(d) {
  const item = (label, v, suffix = '') => has(v) ? `${label} ${v}${suffix}` : '';
  const bits = arr => arr.filter(Boolean).join('｜');
  const tr = v => { if (!has(v)) return ''; const n = Number(v); return Number.isFinite(n) ? `日环比 ${n > 0 ? '+' : ''}${n}%` : ''; };
  const trRaw = v => { if (!has(v)) return ''; const n = Number(v); return Number.isFinite(n) ? `${n > 0 ? '+' : ''}${n}%` : ''; };
  const section = (title, body) => body ? `\n\n${title}\n${body}` : '';
  const cp = campaignProgress(d.reportDate);
  const name = d.productName || 'Vidda发现X RGB';

  const chLine = (label, key, opts = {}) => {
    const unit = opts.unit || ' 条';
    const line = bits([
      item('总计划', d[`${key}TotalPlan`], unit),
      item('今日计划', d[`${key}TodayPlan`], unit),
      item('总上线', d[`${key}TotalOnline`], unit),
      item('今日上线', d[`${key}TodayOnline`], unit),
      item('健康度', d[`${key}Health`])
    ]);
    return line ? `${label}：${line}` : '';
  };

  const geoBits = bits([item('发文', d.geoArticles, ' 篇'), item('露出率', d.geoExposure, '%')]);
  const contentBits = bits([item('计划', d.contentPlan, ' 篇'), item('已上线', d.contentOnline, ' 篇'), item('内容流量', d.contentTraffic), item('日完成率', d.contentDailyRate, '%'), item('10月累完成率', d.contentMonthlyRate, '%')]);
  const repBits = bits([item('正面内容', d.repPositive, ' 条'), item('维护评论', d.repComment, ' 条'), item('TOP 占比', d.repTop, '%'), item('覆盖率', d.repCoverage, '%')]);
  const negBits = bits([item('竞品攻击', d.negCompetitor, ' 条'), item('产品质量', d.negQuality, ' 条'), item('产品售后', d.negAfterSale, ' 条')]);
  const negLine = (has(d.negNew) || negBits) ? bits([
    has(d.negNew) ? `负面新增 ${d.negNew} 条` : '',
    negBits
  ]) : '';

  return `【${name} · 流量日报】${formatDate(d.reportDate, true)}\n数据周期：${formatDate(tMinusOne(d.reportDate), true)}（T-1）${cp ? `｜时间进度 ${cp.percent}%（第 ${cp.passedDays}/${cp.totalDays} 天）` : ''}`
    + section('① 核心流量', [
        bits([item('型号词搜索', d.modelSearch), tr(d.modelSearchDoD), item('日完成率', d.modelSearchDailyRate, '%'), item('10月累完成率', d.modelSearchMonthlyRate, '%')]),
        bits([item('搜索点击率', d.searchCtr, '%'), item('搜索点击率·2027同期', d.searchCtrBenchmark, '%'), item('平均停留时长', d.detailDuration), item('平均停留时长·2027同期', d.detailDurationBenchmark)])
      ].filter(Boolean).join('\n'))
    + section('② 数字营销', [
        chLine('红书', 'redbook', { unit: ' 篇' }),
        chLine('B站', 'bili'),
        chLine('抖音', 'douyin'),
        geoBits && `GEO：${geoBits}`,
        has(d.geoQuestion) ? `GEO 核心问题：${d.geoQuestion}` : '',
        contentBits && `站内内容：${contentBits}`
      ].filter(Boolean).join('\n'))
    + section('③ 口碑与用户原声', [
        repBits,
        negLine,
        has(d.negSummary) ? `负面总结：${d.negSummary}` : ''
      ].filter(Boolean).join('\n'))
    + section('④ 动作调整', [
        has(d.trafficAdjustment) ? `流量：${d.trafficAdjustment}` : '',
        has(d.reputationAdjustment) ? `口碑：${d.reputationAdjustment}` : ''
      ].filter(Boolean).join('\n'))
    + section('⑤ 流量诊断', has(d.trafficDiagnosis) ? d.trafficDiagnosis : '');
}

function copySync(value) {
  const ta = document.createElement('textarea');
  ta.value = value;
  ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  ta.remove();
  return ok;
}

function showLinkPanel(url) {
  const old = document.getElementById('link-panel'); if (old) old.remove();
  const wrap = document.createElement('div');
  wrap.id = 'link-panel';
  wrap.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(20,19,17,.45);display:flex;align-items:center;justify-content:center;padding:24px';
  wrap.innerHTML =
    '<div style="background:#fff;border-radius:14px;padding:22px 24px;max-width:600px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,.22)">' +
      '<div style="font-size:16px;font-weight:800;margin-bottom:6px">复制这个链接，发给日报负责人</div>' +
      '<div style="font-size:12.5px;color:#7A766D;margin-bottom:14px;line-height:1.6">链接里已包含你填写的全部内容。已自动选中，按 ⌘C（Windows 按 Ctrl+C）即可复制。</div>' +
      '<input id="link-input" readonly style="width:100%;font-size:12px;padding:10px 12px;border:1px solid #E6E2D9;border-radius:9px;outline:none;color:#1A1917">' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">' +
        '<button id="link-retry" style="border:1px solid #E6E2D9;background:#fff;border-radius:9px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer">再试一次复制</button>' +
        '<button id="link-close" style="border:0;background:#1A1917;color:#fff;border-radius:9px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer">关闭</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(wrap);
  const input = wrap.querySelector('#link-input');
  input.value = url; input.focus(); input.select();
  wrap.querySelector('#link-close').onclick = () => wrap.remove();
  wrap.querySelector('#link-retry').onclick = () => {
    if (copySync(url)) { showToast('链接已复制，发给日报负责人即可'); wrap.remove(); }
    else { input.focus(); input.select(); showToast('请按 ⌘C 复制'); }
  };
  wrap.addEventListener('click', e => { if (e.target === wrap) wrap.remove(); });
}

async function copyText(value, message) {
  try { await navigator.clipboard.writeText(value); showToast(message); }
  catch { const t=document.createElement('textarea'); t.value=value; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); showToast(message); }
}
function showToast(message) { const t=document.querySelector('#toast'); if(!t)return; t.textContent=message; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }

function watchDayChange() {
  let current = localDateKey();
  setInterval(() => {
    const now = localDateKey();
    if (now !== current) {
      current = now;
      location.reload();
    }
  }, DAY_WATCH_MS);
}

initEditor();
initReport();
watchDayChange();
