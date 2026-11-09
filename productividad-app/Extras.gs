/**
 * Fuentes complementarias (backend). Se leen de la misma carpeta SOURCE_FOLDER_ID.
 * Formatos aceptados: .xlsx / .xls (requiere el servicio avanzado «Drive API»),
 * Google Sheets o .csv. Se elige la versión modificada más recientemente de cada tipo.
 *
 *   Crecimiento por CC …  nombre contiene «Crecimiento»     → Productividad por zona
 *   LibranzaCN …          nombre contiene «LibranzaCN»      → Centro de Negocios (corte del mes)
 *   … Colocaciones …      nombre contiene «Colocaciones»    → Centro de Negocios (histórico mensual)
 */
const EXTRAS_CONFIG = {
  // Ajustes del score de Libranza CN. Por defecto reproducen la hoja «libranza»:
  // Score = 56 × min(Cumplimiento, 120%) + 24 × Constancia  (70/30 sobre el 80% del score).
  CN_LIBRANZA: {
    puestoPattern: 'centro de negocios',          // filtro de la columna Puesto del histórico
    weights: { cumplimiento: 56, constancia: 24 },
    cap: 120,                                      // tope de cumplimiento acumulado (%)
    constancyThreshold: 80,                        // un mes cuenta si su cumplimiento es > 80%
    zones: [
      { key: 'centro', label: 'Zona Centro', short: 'ZC', centers: ['199'], growthZones: ['Centro Sur'] },
      { key: 'norte', label: 'Zona Norte', short: 'ZN', centers: ['299', '399'], growthZones: ['Nor Occidente', 'Nor Oriente'] }
    ],
    vacancies: null                                // p. ej. { centro: 1, norte: 1 } si el corte no lista «Vacante»
  }
};
const EXTRA_TYPES = {
  growth: { label: 'Crecimiento por CC · activo y pasivo', test: n => n.includes('crecimiento') },
  libranza: { label: 'Libranza CN · corte del mes', test: n => n.includes('libranzacn') || n.includes('libranzacentro') },
  colocaciones: { label: 'Base de colocaciones · histórico mensual', test: n => n.includes('colocaciones') }
};
const EXTRA_MIME = {
  csv: ['text/csv', 'text/plain', 'application/vnd.ms-excel.csv'],
  sheet: ['application/vnd.google-apps.spreadsheet'],
  excel: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
};
function extraType_(name) {
  const n = Engine.norm(name);
  return Object.keys(EXTRA_TYPES).find(t => EXTRA_TYPES[t].test(n)) || null;
}
function extraFormat_(file) {
  const mime = file.getMimeType(), name = file.getName();
  if (EXTRA_MIME.sheet.includes(mime)) return 'sheet';
  if (/\.csv$/i.test(name)) return 'csv';
  if (/\.xlsx?$/i.test(name) || EXTRA_MIME.excel.includes(mime)) return 'excel';
  return null;
}
function scanExtras_() {
  const folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('PA_SOURCE')), it = folder.getFiles(), found = {};
  while (it.hasNext()) {
    const f = it.next(), name = f.getName(), type = extraType_(name), format = type && extraFormat_(f);
    if (!type || !format || /^_tmp_/i.test(name)) continue;
    const item = { id: f.getId(), name, format, modified: f.getLastUpdated().toISOString(), size: f.getSize() };
    item.fingerprint = hash_([item.id, item.modified, item.size].join('|'));
    if (!found[type] || item.modified > found[type].modified) found[type] = item;
  }
  return found;
}
/** Devuelve [{name, values}] por hoja. Los Excel se convierten temporalmente a Sheets. */
function readExtraTables_(source) {
  const file = DriveApp.getFileById(source.id);
  if (source.format === 'csv') {
    const text = file.getBlob().getDataAsString(APP_CONFIG.CSV_ENCODING).replace(/^﻿/, '');
    return [{ name: source.name, values: Utilities.parseCsv(Engine.csvText(text), Engine.delimiter(text)) }];
  }
  const readSheets = id => SpreadsheetApp.openById(id).getSheets().map(s => ({ name: s.getName(), values: s.getDataRange().getValues() }));
  if (source.format === 'sheet') return readSheets(source.id);
  if (typeof Drive === 'undefined' || !Drive.Files) throw new Error('Para leer Excel active el servicio avanzado «Drive API» (Servicios → Drive API v3) o guarde el archivo como Google Sheets.');
  const copy = Drive.Files.create({ name: '_tmp_' + source.name, mimeType: MimeType.GOOGLE_SHEETS, parents: [PropertiesService.getScriptProperties().getProperty('PA_OUTPUT')] }, file.getBlob());
  try { return readSheets(copy.id); } finally { try { DriveApp.getFileById(copy.id).setTrashed(true); } catch (e) { console.error(e); } }
}
function extrasManifest_() {
  const id = PropertiesService.getScriptProperties().getProperty('PA_EXTRAS');
  return id ? jsonRead_(id) : null;
}
function syncExtras() { assertOwner_(); return syncExtras_(false); }
function syncExtrasForzado() { assertOwner_(); return syncExtras_(true); }
function syncExtras_(force) {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('PA_SOURCE') || !p.getProperty('PA_OUTPUT')) throw new Error('Primero ejecute configurar().');
  const scan = scanExtras_(), old = extrasManifest_();
  const same = old && Object.keys(EXTRA_TYPES).every(t => (scan[t] && scan[t].fingerprint) === (old.sources[t] && old.sources[t].fingerprint));
  if (!force && same) return { unchanged: true, message: 'Las fuentes complementarias no han cambiado.', status: extrasPublic_(old) };
  const decimal = APP_CONFIG.DECIMAL_SEPARATOR, parsers = {
    growth: t => ExtrasEngine.parseGrowth(t, decimal), libranza: t => ExtrasEngine.parseLibranzaSnapshot(t, decimal), colocaciones: t => ExtrasEngine.parseColocaciones(t, decimal)
  };
  const manifest = { version: 1, updated: new Date().toISOString(), sources: {}, data: {}, errors: {} };
  Object.keys(EXTRA_TYPES).forEach(type => {
    const source = scan[type];
    if (!source) return;
    if (!force && old && old.sources[type] && old.sources[type].fingerprint === source.fingerprint && old.data[type]) {
      manifest.sources[type] = old.sources[type]; manifest.data[type] = old.data[type]; return;
    }
    try { manifest.data[type] = parsers[type](readExtraTables_(source)); manifest.sources[type] = source; }
    catch (e) {
      // Un error conserva la versión publicada anterior de esa fuente.
      manifest.errors[type] = source.name + ': ' + e.message;
      if (old && old.data[type]) { manifest.data[type] = old.data[type]; manifest.sources[type] = old.sources[type]; }
    }
  });
  const id = jsonWrite_('complementarias_' + Utilities.getUuid() + '.json', manifest), previous = p.getProperty('PA_EXTRAS');
  p.setProperty('PA_EXTRAS', id);
  if (previous) try { DriveApp.getFileById(previous).setTrashed(true); } catch (e) { console.error(e); }
  return { done: true, status: extrasPublic_(manifest) };
}
function extrasPublic_(m) {
  const out = { updated: m ? m.updated : null, errors: m ? m.errors : {}, sources: {} };
  Object.keys(EXTRA_TYPES).forEach(t => {
    const s = m && m.sources[t], d = m && m.data[t];
    out.sources[t] = { label: EXTRA_TYPES[t].label, available: !!d, name: s ? s.name : null, modified: s ? s.modified : null, format: s ? s.format : null,
      rows: d && d.rows ? d.rows.length : null, detail: t === 'growth' && d ? d.label : t === 'libranza' && d ? 'Corte ' + (d.date || 'sin fecha') : null };
  });
  return out;
}
function getExtrasStatus() { assertAccess_(); return extrasPublic_(extrasManifest_()); }
function getZoneProductivity() {
  assertAccess_();
  const m = extrasManifest_();
  if (!m || !m.data.growth) return { available: false, status: extrasPublic_(m) };
  return Object.assign({ available: true, updated: m.updated, source: m.sources.growth }, ExtrasEngine.zoneReport(m.data.growth));
}
function getBusinessCenter() {
  assertAccess_();
  const m = extrasManifest_();
  if (!m || !m.data.libranza) return { available: false, status: extrasPublic_(m) };
  const result = ExtrasEngine.businessCenter(m.data.libranza, m.data.colocaciones || null, m.data.growth || null, EXTRAS_CONFIG.CN_LIBRANZA);
  return Object.assign({ available: true, updated: m.updated, hasHistory: !!m.data.colocaciones, hasGrowth: !!m.data.growth,
    sources: { libranza: m.sources.libranza, colocaciones: m.sources.colocaciones || null, growth: m.sources.growth || null } }, result);
}
/** Activador horario propio para las fuentes complementarias (no toca el de la importación principal). */
function instalarActualizacionComplementaria() {
  assertOwner_();
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'actualizarComplementarias_').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('actualizarComplementarias_').timeBased().everyHours(1).create();
  return 'Actualización de fuentes complementarias instalada cada hora.';
}
function actualizarComplementarias_() {
  const owner = PropertiesService.getScriptProperties().getProperty('PA_OWNER');
  const effective = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
  if (!owner || effective !== String(owner).trim().toLowerCase()) throw new Error('El activador debe ejecutarse bajo la cuenta administradora.');
  return syncExtras_(false);
}
