# Pulso · Productividad de asesores: vistas nuevas

Este paquete agrega dos vistas a la web app de Apps Script:

| Vista | Menú | Fuente |
|---|---|---|
| **Productividad por zona**, con lupa: zona → cuadro de la matriz → agencia → asesor | ▣ Productividad por zona | `Crecimiento por CC … activo y pasivo` + scores del Panel de asesores |
| **Centro de Negocios · Libranza** | ◈ Centro de Negocios | `LibranzaCN` (corte del mes) + `Base de Colocaciones` (histórico mensual) + crecimiento de libranza por zona |

## Archivos

| Archivo | Acción |
|---|---|
| `ExtrasCore.gs` | **Nuevo.** Lectura de tablas y cálculos (funciones puras). |
| `Extras.gs` | **Nuevo.** Lectura desde Drive, publicación y endpoints. Los ajustes están en `EXTRAS_CONFIG`. |
| `Views.html` | **Nuevo.** Interfaz y estilos de las dos vistas. Se insertan en el menú y en *Fuentes y actualización*. |
| `appsscript.json` | **Reemplazar.** Solo agrega el servicio avanzado **Drive API v3**, que convierte los .xlsx. |
| `Index.html` | **Editar 1 línea** (ver abajo). |
| `Client.html` | **Editar 1 línea** (ver abajo). |

`Code.gs`, `Config.gs`, `Core.gs`, `Styles.html` y `Photos.gs` no cambian.

### Index.html

Agregue la inclusión de las vistas **después** de la de `Client`:

```html
  <?!= include_('Client'); ?>
  <?!= include_('Views'); ?>
```

### Client.html

Agregue esta línea justo antes de la última, `loadBrandLogo();boot();`. Sirve para que las vistas puedan abrir el perfil del asesor y el panel lateral:

```js
  window.PulsoApp={rpc,showDetail,closeDetail,portrait,hydratePhotos,notice,toggleMenu,canManage,monthLabel,dateLabel,data:()=>S.data,boot:()=>S.boot,openDrawer(html){closeChart(false);++detailToken;detailId=null;digitalPayload=null;$('detail').innerHTML=html;hydratePhotos($('detail'));$('drawer').scrollTop=0;$('overlay').classList.remove('hidden');$('drawer').classList.remove('hidden');S.detailOpen=true;updateScrollLock();$('closeDrawer').focus();}};
```

### Opcional: Code.gs

Si sube las fuentes nuevas como **.csv**, el aviso «CSV no reconocidos por nombre» las mostrará. Para ocultarlas, en `scanSources_` cambie
`if(!type){ignored.push(name);continue;}` por `if(!type){if(!extraType_(name))ignored.push(name);continue;}`.

## Puesta en marcha

1. Copie los archivos y agregue las dos líneas anteriores.
2. En el editor, abra **Servicios → + → Drive API (v3)**. El `appsscript.json` ya lo declara. Si no lo activa, guarde los Excel como Google Sheets o CSV.
3. Ponga en la carpeta `SOURCE_FOLDER_ID` los archivos cuyo nombre contenga:
   - `Crecimiento` (crecimiento por CC)
   - `LibranzaCN` (corte diario)
   - `Colocaciones` (Base de colocaciones)

   Si hay varias copias, se usa la modificada más recientemente. La fila de encabezados se busca en cualquier hoja. Se ignoran títulos, subtotales, totales y tablas auxiliares.
4. Pulse **Actualizar datos**, que también revisa estas fuentes. También puede usar **Actualizar complementarias** en *Fuentes y actualización*. Si la lectura de una fuente falla, se conserva su versión publicada anterior.
5. Opcional: ejecute `instalarActualizacionComplementaria()` para revisarlas cada hora.

## Reglas de cálculo

### Productividad por zona
- **Cartera activa:** Consumo, C. Hipotecario, Auto, Libranza y Vivienda. **Cartera pasiva:** Vista (incluye DBV, como en el reporte) y CDT. Las cifras están en millones; % = crecimiento ÷ plan.
- Los totales de zona suman todas las filas de la zona, incluidas las CNG y las agencias cerradas, igual que la fila «Zona …» del Excel.
- **Matriz:** incluye las agencias abiertas que tienen plan de activos y de pasivos. Categorías: Decrece (< 0), 0-79 %, 80-99 % y ≥ 100 %.
- **Top:** activos ≥ 100 % y pasivos ≥ 80 %. **Crítico:** decrece en activos y en pasivos.
- **Lupa:** un clic en un cuadro muestra sus agencias. Un clic en una agencia muestra sus productos y sus asesores por banda (Alto Rendimiento ≥ 100, Potencial 80-99, En desarrollo 60-79, Acompañamiento < 60). Las bandas usan el score del Panel de asesores **en el período elegido en ese panel**. Un clic en un asesor abre su perfil.

### Centro de Negocios · Libranza (igual que la hoja «libranza»)
- **Ejecutivos:** las filas del corte `LibranzaCN`, sin subtotales. El historial se vincula por nombre (sin tildes) dentro del mismo CNG. No se usa el código de oficial porque se reasigna.
- **Cumplimiento acumulado** = Σ Principal ÷ Σ Meta de los meses del histórico. Solo cuenta el puesto *Asesor de Centro de Negocios* y los meses anteriores al corte.
- **Constancia** = meses con cumplimiento > 80 % ÷ meses evaluados.
- **Score** = 56 × min(Cumplimiento, 120 %) + 24 × Constancia, que equivale a 70/30 sobre el 80 % del score. **Con estos pesos el máximo es 91.2, así que nadie puede llegar a Alto Rendimiento.** Para cambiar el reparto, edite `EXTRAS_CONFIG.CN_LIBRANZA.weights`.
- **Crecimiento Libranza** por zona sale del archivo de crecimiento. Zona Centro = Centro Sur; Zona Norte = Nor Occidente + Nor Oriente. Se configura en `zones`.
- El mes en curso se muestra como avance y no cuenta para el score.
- **Vacantes:** salen de las filas «Vacante» del corte, o se fijan con `EXTRAS_CONFIG.CN_LIBRANZA.vacancies = { centro: 1, norte: 1 }`.
