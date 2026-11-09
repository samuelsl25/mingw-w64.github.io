/**
 * Fuentes complementarias · funciones puras (sin servicios de Google).
 *  1. Crecimiento por CC en activo y pasivo  → vista «Productividad por zona».
 *  2. LibranzaCN (corte diario) + Base de colocaciones (histórico mensual)
 *     → vista «Centro de Negocios · Libranza».
 * Los lectores aceptan la tabla tal como sale de Excel/Sheets/CSV: buscan la fila
 * de encabezados, ignoran títulos, subtotales, totales y tablas auxiliares.
 */
const ExtrasEngine = (() => {
  const norm = v => String(v == null ? '' : v).replace(/^﻿/, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const isDate = v => Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime());
  const pad = n => String(n).padStart(2, '0');
  const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  /** Número tolerante: «-», vacío, #DIV/0! y textos → null. Admite L, HNL, %, paréntesis. */
  function num(v, decimal) {
    if (v == null || isDate(v)) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    let s = String(v).trim();
    if (!s || /^[-–—]+$/.test(s) || /^(#|n\/?a$|null$|nan$)/i.test(s)) return null;
    let negative = false;
    if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1); }
    const percent = /%\s*$/.test(s);
    s = s.replace(/%\s*$/, '').replace(/^(hnl|lps\.?|l\.)\s*/i, '').replace(/^l(?=[\d.,-])/i, '').replace(/\s/g, '');
    if (decimal === ',') s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, '');
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s)) return null;
    let n = Number(s);
    if (!Number.isFinite(n)) return null;
    if (negative) n = -n;
    return percent ? n / 100 : n;
  }
  function text(v) {
    if (v == null) return '';
    if (isDate(v)) return v.getFullYear() + '-' + pad(v.getMonth() + 1) + '-' + pad(v.getDate());
    return String(v).replace(/\s+/g, ' ').trim();
  }
  /** Código de CC / empleado: 199.0 → «199». */
  function code(v) {
    const n = num(v);
    if (n != null && Number.isInteger(n)) return String(n);
    return text(v).replace(/\.0+$/, '').replace(/^0+(?=\d)/, '');
  }
  function isoDate(v) {
    if (isDate(v)) return text(v);
    if (typeof v === 'number' && v > 30000 && v < 80000) { // serial de Excel
      const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
      return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
    }
    const s = text(v);let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/);
    if (m) return m[1] + '-' + pad(+m[2]) + '-' + pad(+m[3]);
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return m[3] + '-' + pad(+m[2]) + '-' + pad(+m[1]);
    m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m && +m[2] >= 1 && +m[2] <= 12) return m[1] + '-' + m[2] + '-' + m[3];
    return null;
  }
  const sum = values => values.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  const ratio = (a, b) => Number.isFinite(a) && Number.isFinite(b) && b > 0 ? a / b : null;

  /** Busca la fila de encabezados. spec = {clave:[alias normalizados]}. */
  function findHeader(values, spec, required, limit) {
    const max = Math.min(values.length, limit || 80);
    for (let r = 0; r < max; r++) {
      const row = values[r] || [], map = {};
      row.forEach((cell, c) => { const raw = text(cell), key = norm(raw) || raw; if (key && map[key] === undefined) map[key] = c; });
      const index = {};
      Object.keys(spec).forEach(k => { const alias = spec[k].find(a => map[a] !== undefined); if (alias !== undefined) index[k] = map[alias]; });
      if (required.every(k => index[k] !== undefined)) return { row: r, index };
    }
    return null;
  }
  function pickTable(tables, spec, required, description) {
    for (const t of tables || []) {
      const header = findHeader(t.values || [], spec, required);
      if (header) return { table: t, header };
    }
    throw new Error('No se encontró la tabla de ' + description + '. Encabezados requeridos: ' + required.join(', ') + '.');
  }

  /* ------------------------------------------------------------------ */
  /* 1. Crecimiento por CC                                               */
  /* ------------------------------------------------------------------ */
  const GROWTH_PRODUCTS = [
    { key: 'consumo', label: 'Consumo', side: 'activa', cre: 'consumocre', plan: 'consumoppto' },
    { key: 'hipotecario', label: 'C Hipotecario', side: 'activa', cre: 'chipotecariocre', plan: 'chipotecarioppto' },
    { key: 'auto', label: 'Auto', side: 'activa', cre: 'autocre', plan: 'autoppto' },
    { key: 'libranza', label: 'Libranza', side: 'activa', cre: 'libranzacre', plan: 'libranzappto' },
    { key: 'vivienda', label: 'Vivienda', side: 'activa', cre: 'viviendacre', plan: 'viviendappto' },
    { key: 'vista', label: 'Vista', side: 'pasiva', cre: 'vistacre', plan: 'vistappto' },
    { key: 'dbv', label: 'DBV', side: 'pasiva', cre: 'dbvcre', plan: 'dbvppto' },
    { key: 'cdt', label: 'CDT', side: 'pasiva', cre: 'cdtcre', plan: 'cdtppto' }
  ];
  /** Agrupación de cartera pasiva del reporte: «Vista» incluye DBV. */
  const PASSIVE_GROUPS = [{ key: 'vista', label: 'Vista', keys: ['vista', 'dbv'] }, { key: 'cdt', label: 'Cdt', keys: ['cdt'] }];
  const CATEGORIES = [
    { key: 'decrece', label: 'Decrece' }, { key: 'low', label: '0-79%' }, { key: 'mid', label: '80-99%' }, { key: 'high', label: '≥100%' }
  ];
  function category(r) { return r == null ? null : r < 0 ? 'decrece' : r < 0.8 ? 'low' : r < 1 ? 'mid' : 'high'; }

  function parseGrowth(tables, decimal) {
    const spec = { cc: ['cc', 'cng', 'centrodecosto'], name: ['agencia', 'nombreagencia'], zone: ['zona'] };
    GROWTH_PRODUCTS.forEach(p => { spec[p.key + 'Cre'] = [p.cre]; spec[p.key + 'Plan'] = [p.plan]; });
    const required = Object.keys(spec);
    const { table, header } = pickTable(tables, spec, required, 'crecimiento por CC (CC, Agencia, Zona, «… Cre» y «… ppto»)');
    const values = table.values, idx = header.index;
    let label = '';
    for (let r = 0; r < header.row && !label; r++) (values[r] || []).forEach(c => { const s = text(c); if (!label && /crecimiento/i.test(s)) label = s; });
    const cut = (label.match(/\ba\s+(.+)$/i) || [])[1] || '';
    const rows = [];
    for (let r = header.row + 1; r < values.length; r++) {
      const row = values[r] || [], name = text(row[idx.name]), zone = text(row[idx.zone]), cc = code(row[idx.cc]);
      if (!name || !cc || !zone || /^\d+(\.0+)?$/.test(zone)) continue;
      if (/^(zona|total|subtotal)\b/i.test(name)) continue;
      const cre = {}, plan = {};
      GROWTH_PRODUCTS.forEach(p => { cre[p.key] = num(row[idx[p.key + 'Cre']], decimal); plan[p.key] = num(row[idx[p.key + 'Plan']], decimal); });
      rows.push({ cc, name, zone, closed: /^cerrad/i.test(name), cre, plan });
    }
    if (!rows.length) throw new Error('La tabla de crecimiento no contiene agencias.');
    return { label, cut, sheet: table.name || '', rows };
  }
  function shortAgency(name) {
    return String(name).replace(/^agencia\s+/i, '').replace(/\s+(teg|tgu)\.?$/i, '').trim();
  }
  function sideTotals(rows, side) {
    const keys = GROWTH_PRODUCTS.filter(p => p.side === side).map(p => p.key);
    const growth = sum(rows.flatMap(r => keys.map(k => r.cre[k]))), plan = sum(rows.flatMap(r => keys.map(k => r.plan[k])));
    const value = ratio(growth, plan);
    return { growth, plan, ratio: value, cat: category(value) };
  }
  function agencyRecord(r) {
    const activos = sideTotals([r], 'activa'), pasivos = sideTotals([r], 'pasiva');
    const products = GROWTH_PRODUCTS.map(p => ({ key: p.key, label: p.label, side: p.side, growth: r.cre[p.key], plan: r.plan[p.key], ratio: ratio(r.cre[p.key], r.plan[p.key]) }));
    return { cc: r.cc, name: r.name, short: shortAgency(r.name), zone: r.zone, activos, pasivos, products,
      top: activos.cat === 'high' && (pasivos.cat === 'high' || pasivos.cat === 'mid'),
      critical: activos.cat === 'decrece' && pasivos.cat === 'decrece' };
  }
  function zoneBlock(key, name, rows) {
    const agencies = rows.filter(r => !r.closed && sideTotals([r], 'activa').plan > 0 && sideTotals([r], 'pasiva').plan > 0).map(agencyRecord);
    const productTotal = p => { const growth = sum(rows.map(r => r.cre[p.key])), plan = sum(rows.map(r => r.plan[p.key])); return { key: p.key, label: p.label, growth, plan, ratio: ratio(growth, plan) }; };
    const activa = GROWTH_PRODUCTS.filter(p => p.side === 'activa').map(productTotal);
    const pasivaDetail = GROWTH_PRODUCTS.filter(p => p.side === 'pasiva').map(productTotal);
    const pasiva = PASSIVE_GROUPS.map(g => { const items = pasivaDetail.filter(p => g.keys.includes(p.key)), growth = sum(items.map(p => p.growth)), plan = sum(items.map(p => p.plan));
      return { key: g.key, label: g.label, includes: g.keys, growth, plan, ratio: ratio(growth, plan) }; });
    const total = list => { const growth = sum(list.map(p => p.growth)), plan = sum(list.map(p => p.plan)); return { growth, plan, ratio: ratio(growth, plan) }; };
    const matrix = {};
    agencies.forEach(a => { const k = a.activos.cat + '|' + a.pasivos.cat; matrix[k] = (matrix[k] || 0) + 1; });
    return { key, name, agencies, matrix, activa, pasiva, pasivaDetail, totals: { activa: total(activa), pasiva: total(pasiva) },
      top: agencies.filter(a => a.top).sort((a, b) => b.activos.ratio - a.activos.ratio || b.pasivos.ratio - a.pasivos.ratio),
      critical: agencies.filter(a => a.critical).sort((a, b) => a.activos.ratio - b.activos.ratio) };
  }
  function zoneReport(growth) {
    const groups = {};
    growth.rows.forEach(r => (groups[r.zone] || (groups[r.zone] = [])).push(r));
    const zones = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'es')).map(z => zoneBlock(z, z, groups[z])).filter(z => z.agencies.length);
    if (zones.length > 1) zones.push(zoneBlock('*', 'Todas las zonas', zones.flatMap(z => groups[z.name])));
    return { label: growth.label, cut: growth.cut, categories: CATEGORIES, zones };
  }

  /* ------------------------------------------------------------------ */
  /* 2. Libranza · Centro de Negocios                                    */
  /* ------------------------------------------------------------------ */
  function parseLibranzaSnapshot(tables, decimal) {
    const spec = { zone: ['zona'], cc: ['cc', 'cng'], oficial: ['oficial', 'codigooficial'], name: ['nombre', 'ejecutivo', 'asesor'],
      units: ['unidades', 'cantidad', 'creditos'], amount: ['monto', 'principal'], plan: ['plan', 'meta'], ratio: ['cumplimiento', 'porcentajecumplimiento'],
      tdc: ['tdc', 'tc'], cuentaMovil: ['cuentamovil'], app: ['app'], date: ['fecha'] };
    const { table, header } = pickTable(tables, spec, ['oficial', 'name', 'amount', 'plan'], 'Libranza CN (Oficial, Nombre, Monto, Plan)');
    const values = table.values, idx = header.index;
    let date = null;
    for (let r = 0; r < header.row && !date; r++) for (const c of values[r] || []) { const d = isoDate(c); if (d) { date = d; break; } }
    const rows = [];let zone = '', cc = '';
    for (let r = header.row + 1; r < values.length; r++) {
      const row = values[r] || [];
      if (idx.zone !== undefined && text(row[idx.zone])) zone = text(row[idx.zone]);
      if (idx.cc !== undefined && code(row[idx.cc])) cc = code(row[idx.cc]);
      const name = text(row[idx.name]);
      if (!name || /^(subtotal|total)\b/i.test(name)) continue;
      const amount = num(row[idx.amount], decimal), plan = num(row[idx.plan], decimal);
      const get = k => idx[k] === undefined ? null : num(row[idx[k]], decimal);
      const rowDate = idx.date !== undefined ? isoDate(row[idx.date]) : null;
      if (rowDate && (!date || rowDate > date)) date = rowDate;
      rows.push({ zone, cc, oficial: text(row[idx.oficial]), name, vacant: /vacante/i.test(name), units: get('units'), amount, plan,
        ratio: ratio(amount, plan) != null ? ratio(amount, plan) : get('ratio'), reportedRatio: get('ratio'), tdc: get('tdc'), cuentaMovil: get('cuentaMovil'), app: get('app') });
    }
    if (!rows.length) throw new Error('El archivo de Libranza CN no contiene ejecutivos.');
    return { date, sheet: table.name || '', rows };
  }
  function monthNumber(v) {
    if (isDate(v)) return v.getMonth() + 1;
    const n = num(v);
    if (n != null && Number.isInteger(n) && n >= 1 && n <= 12) return n;
    if (n != null && n >= 190001 && n <= 299912 && n % 100 >= 1 && n % 100 <= 12) return n % 100;
    const s = norm(v);if (!s) return null;
    const i = MONTHS.findIndex(m => m === s || (s.length >= 3 && m.indexOf(s) === 0) || (s === 'set' && m === 'septiembre'));
    return i >= 0 ? i + 1 : null;
  }
  function yearOf(v) {
    if (isDate(v)) return v.getFullYear();
    const n = num(v);
    if (n != null && n >= 1900 && n <= 2999) return n;
    if (n != null && n >= 190001 && n <= 299912) return Math.floor(n / 100);
    return null;
  }
  function parseColocaciones(tables, decimal) {
    const spec = { name: ['nombre'], puesto: ['puesto', 'cargo'], cng: ['cng', 'cc'], employee: ['empleado', 'codigoempleado', 'numerodeempleado'],
      oficial: ['oficial'], meta: ['meta', 'plan'], credits: ['creditos', 'ncreditos', 'numerodecreditos'], principal: ['principal', 'monto'],
      secondary: ['secundario'], month: ['mes'], monthNumber: ['#', 'nmes', 'numeromes'], year: ['ano', 'anio', 'year'], period: ['periodo'] };
    const { table, header } = pickTable(tables, spec, ['name', 'puesto', 'meta', 'principal'], 'colocaciones (Nombre, Puesto, Meta, Principal, Mes)');
    const values = table.values, idx = header.index, rows = [];
    for (let r = header.row + 1; r < values.length; r++) {
      const row = values[r] || [], name = text(row[idx.name]);
      if (!name) continue;
      const get = k => idx[k] === undefined ? undefined : row[idx[k]];
      const month = monthNumber(get('monthNumber')) || monthNumber(get('month')) || monthNumber(get('period'));
      if (!month) continue;
      const year = yearOf(get('year')) || yearOf(get('period')) || yearOf(get('month'));
      rows.push({ name, puesto: text(get('puesto')), cng: code(get('cng')), employee: code(get('employee')), oficial: text(get('oficial')),
        meta: num(get('meta'), decimal), principal: num(get('principal'), decimal), credits: num(get('credits'), decimal), month, year: year || null });
    }
    if (!rows.length) throw new Error('La base de colocaciones no contiene registros mensuales.');
    return { sheet: table.name || '', rows };
  }

  const CN_DEFAULTS = {
    puestoPattern: 'centro de negocios',
    weights: { cumplimiento: 56, constancia: 24 },
    cap: 120,
    constancyThreshold: 80,
    bands: [
      { key: 'high', label: 'Alto Rendimiento', min: 100, range: '≥ 100' },
      { key: 'potential', label: 'Potencial', min: 80, range: '80-99' },
      { key: 'development', label: 'En desarrollo', min: 60, range: '60-79' },
      { key: 'support', label: 'Acompañamiento', min: null, range: '< 60' }
    ],
    zones: [
      { key: 'centro', label: 'Zona Centro', short: 'ZC', centers: ['199'], growthZones: ['Centro Sur'] },
      { key: 'norte', label: 'Zona Norte', short: 'ZN', centers: ['299', '399'], growthZones: ['Nor Occidente', 'Nor Oriente'] }
    ],
    vacancies: null
  };
  function cnConfig(config) {
    const c = JSON.parse(JSON.stringify(CN_DEFAULTS));
    Object.keys(config || {}).forEach(k => { if (config[k] != null) c[k] = JSON.parse(JSON.stringify(config[k])); });
    return c;
  }
  function band(score, bands) {
    if (!Number.isFinite(score)) return null;
    const b = bands.find(x => x.min == null || score + 1e-9 >= x.min);
    return b ? { key: b.key, label: b.label } : null;
  }
  const tokens = name => String(name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  function shortName(name) {
    const t = String(name).trim().split(/\s+/), cap = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    return (t.length >= 3 ? [t[0], t[2]] : t).map(cap).join(' ');
  }
  function titleName(name) { return String(name).toLowerCase().replace(/(^|\s)(\S)/g, (m, s, ch) => s + ch.toUpperCase()); }
  /** Coincidencia por nombre (sin tildes) dentro del mismo CNG: exacto o prefijo de 3+ palabras. */
  function matchPerson(exec, people) {
    const a = tokens(exec.name), pool = people.filter(p => !exec.cc || !p.cng || p.cng === exec.cc);
    const exact = pool.filter(p => tokens(p.name).join(' ') === a.join(' '));
    if (exact.length === 1) return exact[0];
    if (exact.length > 1) return null;
    const prefix = pool.filter(p => { const b = tokens(p.name), [s, l] = a.length <= b.length ? [a, b] : [b, a]; return s.length >= 3 && s.every((t, i) => l[i] === t); });
    return prefix.length === 1 ? prefix[0] : null;
  }
  function businessCenter(snapshot, history, growth, config) {
    const c = cnConfig(config), pattern = new RegExp(c.puestoPattern, 'i');
    const snapMonth = snapshot.date ? snapshot.date.slice(0, 7) : null, year = c.year || (snapshot.date ? +snapshot.date.slice(0, 4) : null);
    const monthKey = r => (r.year || year || 0) + '-' + pad(r.month);
    const hist = (history ? history.rows : []).filter(r => pattern.test(r.puesto) && (!r.year || !year || r.year === year) && (!snapMonth || monthKey(r) < snapMonth));
    const people = {};
    hist.filter(r => !/vacante/i.test(r.name)).forEach(r => {
      const k = r.cng + '|' + tokens(r.name).join(' ');
      const p = people[k] || (people[k] = { name: r.name, cng: r.cng, employee: r.employee, oficial: r.oficial, months: {} });
      if (r.employee && r.employee !== '0') p.employee = r.employee;
      const m = p.months[monthKey(r)] || (p.months[monthKey(r)] = { key: monthKey(r), month: r.month, meta: 0, principal: 0, credits: null });
      m.meta += r.meta || 0; m.principal += r.principal || 0; if (r.credits != null) m.credits = (m.credits || 0) + r.credits;
    });
    const peopleList = Object.values(people), monthKeys = [...new Set(hist.map(monthKey))].sort();
    const zoneOf = cc => c.zones.find(z => z.centers.map(String).includes(String(cc)));
    const executives = snapshot.rows.filter(r => !r.vacant).map(r => {
      const zone = zoneOf(r.cc) || { key: 'z' + norm(r.zone || r.cc), label: r.zone || 'CNG ' + r.cc, short: r.zone || r.cc, centers: [r.cc], growthZones: r.zone ? [r.zone] : [] };
      const person = matchPerson(r, peopleList);
      const months = person ? Object.values(person.months).sort((a, b) => a.key.localeCompare(b.key)).map(m => {
        const value = ratio(m.principal, m.meta);
        return { key: m.key, label: MONTH_SHORT[m.month - 1], meta: m.meta, principal: m.principal, credits: m.credits, ratio: value, met: value != null && value > c.constancyThreshold / 100 + 1e-12 };
      }) : [];
      const metaSum = sum(months.map(m => m.meta)), principalSum = sum(months.map(m => m.principal));
      const cumplimiento = months.length ? ratio(principalSum, metaSum) : null, metCount = months.filter(m => m.met).length;
      const constancia = months.length ? metCount / months.length : null;
      const score = cumplimiento == null || constancia == null ? null : c.weights.cumplimiento * Math.min(cumplimiento, c.cap / 100) + c.weights.constancia * constancia;
      return { id: person && person.employee && person.employee !== '0' ? person.employee : 'cn-' + r.cc + '-' + r.oficial, employee: person && person.employee !== '0' ? person.employee : null,
        name: titleName(r.name), short: shortName(r.name), zoneKey: zone.key, zoneLabel: zone.label, cc: r.cc, oficial: r.oficial,
        current: { units: r.units, amount: r.amount, plan: r.plan, ratio: r.ratio, tdc: r.tdc, cuentaMovil: r.cuentaMovil, app: r.app },
        history: { matched: !!person, sourceName: person ? titleName(person.name) : null, months, metaSum, principalSum, cumplimiento, constancia, metCount, monthsCount: months.length },
        score, components: score == null ? null : { cumplimiento: c.weights.cumplimiento * Math.min(cumplimiento, c.cap / 100), constancia: c.weights.constancia * constancia, capped: cumplimiento > c.cap / 100 },
        band: band(score, c.bands) };
    });
    // Vacantes: filas «Vacante» del corte; la configuración puede fijarlas por zona.
    const vacantRows = snapshot.rows.filter(r => r.vacant).map(r => ({ cc: r.cc }));
    const zoneKeys = [...new Set(c.zones.map(z => z.key).concat(executives.map(e => e.zoneKey)))];
    const zones = zoneKeys.map(key => {
      const def = c.zones.find(z => z.key === key) || { key, label: executives.find(e => e.zoneKey === key).zoneLabel, short: '', centers: [], growthZones: [] };
      const list = executives.filter(e => e.zoneKey === key);
      const snapRows = snapshot.rows.filter(r => !r.vacant && list.some(e => e.cc === r.cc && e.oficial === r.oficial));
      let libranza = null;
      if (growth && def.growthZones.length) {
        const rows = growth.rows.filter(r => def.growthZones.some(z => norm(z) === norm(r.zone)));
        if (rows.length) { const g = sum(rows.map(r => r.cre.libranza)), p = sum(rows.map(r => r.plan.libranza)); libranza = { growth: g, plan: p, ratio: ratio(g, p), zones: def.growthZones }; }
      }
      const amount = sum(snapRows.map(r => r.amount)), plan = sum(snapRows.map(r => r.plan));
      return { key, label: def.label, short: def.short, centers: def.centers, executives: list.length,
        counts: Object.fromEntries(c.bands.map(b => [b.key, list.filter(e => e.band && e.band.key === b.key).length])),
        unscored: list.filter(e => !e.band).length,
        vacancies: c.vacancies && Number.isFinite(c.vacancies[key]) ? c.vacancies[key] : vacantRows.filter(v => def.centers.map(String).includes(String(v.cc))).length,
        libranza, month: { amount, plan, ratio: ratio(amount, plan), units: sum(snapRows.map(r => r.units)) } };
    }).filter(z => z.executives || z.vacancies);
    const vacancies = zones.reduce((n, z) => n + z.vacancies, 0);
    const plans = executives.map(e => e.current.plan).filter(Number.isFinite), freq = {};
    plans.forEach(p => freq[p] = (freq[p] || 0) + 1);
    const metaMensual = plans.length ? +Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0] : null;
    return { date: snapshot.date, year, growthLabel: growth ? growth.label : null,
      months: monthKeys.map(k => ({ key: k, label: MONTH_SHORT[+k.slice(5) - 1] })),
      config: { weights: c.weights, cap: c.cap, constancyThreshold: c.constancyThreshold, bands: c.bands },
      executives, zones, metaMensual, vacancies, vacancySource: c.vacancies ? 'configuración' : 'corte' };
  }

  return { norm, num, text, code, isoDate, findHeader, parseGrowth, zoneReport, category, CATEGORIES, GROWTH_PRODUCTS, PASSIVE_GROUPS,
    parseLibranzaSnapshot, parseColocaciones, businessCenter, cnConfig, band, shortName, titleName, matchPerson, monthNumber, CN_DEFAULTS };
})();
if (typeof module !== 'undefined') module.exports = ExtrasEngine;
