// Pantalla "Explorar pools": filtros, tabla (tarjetas en móvil), orden y "cargar más".
import { h, reemplazar } from "../dom.js?v=1";
import { leerEstado, suscribir, elegirPool } from "../estado.js?v=1";
import { leer, guardar, CLAVES } from "../almacen.js?v=1";
import { abreviado, numero, porcentaje } from "../formato.js?v=1";
import { AVISO_EJEMPLO } from "../datos.js?v=1";

// Columnas numéricas: son las que se pueden ordenar.
const COLUMNAS = [
  { campo: "tvlUsd", titulo: "TVL", formato: abreviado },
  { campo: "apyBase", titulo: "APY comisiones", formato: porcentaje },
  { campo: "apyReward", titulo: "APY recompensas", formato: porcentaje },
  { campo: "apy", titulo: "APY total", formato: porcentaje },
  { campo: "apyMean30d", titulo: "Media 30 días", formato: porcentaje },
];
const TVL_MINIMOS = [100000, 1e6, 1e7, 1e8];
const POR_PAGINA = 25;

// Los filtros viven fuera de la pantalla para conservarse al volver a ella,
// y se guardan en el navegador para que sigan igual al recargar la página.
// Por defecto: se ocultan los pools sin comisiones y se ordena por APY por comisiones, de mayor a menor.
const filtros = { red: "", protocolo: "", tvlMin: 100000, soloEstables: false, conComisiones: true, texto: "", orden: "apyBase", dir: "desc" };
recuperarFiltros();
let visibles = POR_PAGINA;

// Lee los filtros guardados y solo acepta valores que tengan sentido.
function recuperarFiltros() {
  const g = leer(CLAVES.filtros);
  if (!g || typeof g !== "object") return;
  if (typeof g.red === "string") filtros.red = g.red;
  if (typeof g.protocolo === "string") filtros.protocolo = g.protocolo;
  if (TVL_MINIMOS.includes(g.tvlMin)) filtros.tvlMin = g.tvlMin;
  if (typeof g.soloEstables === "boolean") filtros.soloEstables = g.soloEstables;
  if (typeof g.conComisiones === "boolean") filtros.conComisiones = g.conComisiones;
  if (typeof g.texto === "string") filtros.texto = g.texto;
  if (COLUMNAS.some((c) => c.campo === g.orden)) filtros.orden = g.orden;
  if (g.dir === "asc" || g.dir === "desc") filtros.dir = g.dir;
}
const guardarFiltros = () => guardar(CLAVES.filtros, filtros);

// "Sin comisiones": APY por comisiones sin dato o que se vería como 0,00 %.
const tieneComisiones = (p) => typeof p.apyBase === "number" && Math.abs(p.apyBase) >= 0.005;

// Aplica filtros y orden. Los valores que faltan van siempre al final.
function filtrarYOrdenar(pools) {
  const texto = filtros.texto.trim().toLowerCase();
  const signo = filtros.dir === "asc" ? 1 : -1;
  return pools
    .filter((p) =>
      (!filtros.red || p.chain === filtros.red) &&
      (!filtros.protocolo || p.project === filtros.protocolo) &&
      (p.tvlUsd ?? 0) >= filtros.tvlMin &&
      (!filtros.soloEstables || p.stablecoin) &&
      (!filtros.conComisiones || tieneComisiones(p)) &&
      (!texto || p.symbol.toLowerCase().includes(texto)))
    .sort((a, b) => {
      const x = a[filtros.orden], y = b[filtros.orden];
      if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
      return (x - y) * signo;
    });
}

// Lista sin repetidos y en orden alfabético (para los desplegables).
const unicos = (pools, campo) => [...new Set(pools.map((p) => p[campo]))].sort((a, b) => a.localeCompare(b, "es"));

// Un campo del formulario con su etiqueta.
const campo = (texto, control, clase = "campo") => h("label", { class: clase }, h("span", {}, texto), control);

function simular(pool) {
  elegirPool(pool);
  location.hash = "#simulador";
}

function fila(p) {
  const riesgo = p.ilRisk === "yes" ? h("span", { class: "etiqueta alerta" }, "Sí")
    : p.ilRisk === "no" ? h("span", { class: "etiqueta" }, "No") : "—";
  return h("tr", {},
    h("td", { class: "celda-par" }, h("strong", {}, p.symbol), p.poolMeta ? h("span", { class: "meta" }, p.poolMeta) : null),
    h("td", { "data-etiqueta": "Protocolo" }, p.project),
    h("td", { "data-etiqueta": "Red" }, p.chain),
    COLUMNAS.map((c) => h("td", { class: "num", "data-etiqueta": c.titulo }, c.formato(p[c.campo]))),
    h("td", { "data-etiqueta": "Riesgo por variación" }, riesgo),
    h("td", { class: "celda-accion" },
      h("button", { type: "button", class: "boton", "aria-label": `Simular ${p.symbol} (${p.project}, ${p.chain})`, onclick: () => simular(p) }, "Simular")),
  );
}

export function montarPools(contenedor) {
  // --- Controles de los filtros ---
  const selRed = h("select", {});
  const selProto = h("select", {});
  const selTvl = h("select", {}, TVL_MINIMOS.map((v) => h("option", { value: v }, "Desde " + abreviado(v))));
  const chkEstables = h("input", { type: "checkbox" });
  const chkComisiones = h("input", { type: "checkbox" });
  const txtBuscar = h("input", { type: "search", placeholder: "Ej.: ETH, USDC…", autocomplete: "off" });
  const selOrden = h("select", {}, COLUMNAS.map((c) => h("option", { value: c.campo }, c.titulo)));
  const selDir = h("select", {}, h("option", { value: "desc" }, "De mayor a menor"), h("option", { value: "asc" }, "De menor a mayor"));
  const recuento = h("p", { class: "recuento", "aria-live": "polite" });
  const resultados = h("div", { class: "resultados" });

  selTvl.value = String(filtros.tvlMin);
  chkEstables.checked = filtros.soloEstables;
  chkComisiones.checked = filtros.conComisiones;
  txtBuscar.value = filtros.texto;

  // Copia los valores del formulario a "filtros" y vuelve a pintar desde el principio.
  function alCambiar() {
    Object.assign(filtros, {
      red: selRed.value, protocolo: selProto.value, tvlMin: Number(selTvl.value),
      soloEstables: chkEstables.checked, conComisiones: chkComisiones.checked,
      texto: txtBuscar.value, orden: selOrden.value, dir: selDir.value,
    });
    guardarFiltros();
    visibles = POR_PAGINA;
    pintar();
  }

  const formulario = h("form", { class: "filtros", role: "search", "aria-label": "Filtros de pools", onsubmit: (e) => e.preventDefault(), oninput: alCambiar },
    campo("Buscar par", txtBuscar),
    campo("Red", selRed),
    campo("Protocolo", selProto),
    campo("TVL mínimo", selTvl),
    campo("Ordenar por", selOrden, "campo solo-tarjetas"),
    campo("Orden", selDir, "campo solo-tarjetas"),
    h("label", { class: "campo-check" }, chkEstables, "Solo stablecoins"),
    h("label", { class: "campo-check" }, chkComisiones, "Ocultar pools sin comisiones"),
  );

  // Rellena los desplegables de red y protocolo con los datos cargados.
  function rellenarOpciones() {
    const { pools } = leerEstado();
    const poner = (select, lista, todos, actual) => {
      // Mientras aún no hay pools, conservamos la opción elegida (por ejemplo, la guardada antes de recargar).
      if (!pools.length && actual) lista = [actual];
      reemplazar(select, h("option", { value: "" }, todos), lista.map((v) => h("option", { value: v }, v)));
      select.value = lista.includes(actual) ? actual : "";
    };
    poner(selRed, unicos(pools, "chain"), "Todas las redes", filtros.red);
    poner(selProto, unicos(pools, "project"), "Todos los protocolos", filtros.protocolo);
    filtros.red = selRed.value;
    filtros.protocolo = selProto.value;
  }

  // Clic en una cabecera: ordena por esa columna (o cambia el sentido si ya lo estaba).
  function ordenarPor(campoNuevo) {
    if (filtros.orden === campoNuevo) filtros.dir = filtros.dir === "desc" ? "asc" : "desc";
    else Object.assign(filtros, { orden: campoNuevo, dir: "desc" });
    guardarFiltros();
    pintar();
    resultados.querySelector(`[data-campo="${campoNuevo}"]`)?.focus();
  }

  function cabecera() {
    const th = (texto) => h("th", { scope: "col" }, texto);
    const thNum = (c) => {
      const activa = filtros.orden === c.campo;
      const sentido = filtros.dir === "asc" ? "ascending" : "descending";
      return h("th", { scope: "col", class: "num", "aria-sort": activa ? sentido : null },
        h("button", { type: "button", class: "orden", "data-campo": c.campo, onclick: () => ordenarPor(c.campo) },
          c.titulo, activa ? (filtros.dir === "asc" ? " ↑" : " ↓") : ""));
    };
    return h("thead", {}, h("tr", {}, th("Par"), th("Protocolo"), th("Red"), COLUMNAS.map(thNum), th("Riesgo por variación"), h("th", { scope: "col" }, h("span", { class: "oculto" }, "Acciones"))));
  }

  function cargarMas() {
    const antes = visibles;
    visibles += POR_PAGINA;
    pintar();
    // Llevamos el foco al primer pool nuevo para no perder el sitio.
    resultados.querySelectorAll("tbody tr")[antes]?.querySelector("button")?.focus();
  }

  function pintar() {
    const { pools, cargandoPools, origenPools } = leerEstado();
    selOrden.value = filtros.orden;
    selDir.value = filtros.dir;

    if (cargandoPools && !pools.length) {
      recuento.textContent = "";
      reemplazar(resultados, h("div", { class: "cargando", role: "status" },
        h("span", { class: "rueda", "aria-hidden": "true" }), "Cargando pools… La primera vez puede tardar unos segundos."));
      return;
    }

    const lista = filtrarYOrdenar(pools);
    const mostrados = lista.slice(0, visibles);
    recuento.textContent = `Mostrando ${numero(mostrados.length, 0)} de ${numero(lista.length, 0)} pools`;

    reemplazar(resultados,
      origenPools === "ejemplo" ? h("p", { class: "aviso", role: "status" }, AVISO_EJEMPLO) : null,
      lista.length
        ? h("div", { class: "envoltorio-tabla" },
            h("table", { class: "tabla" },
              h("caption", { class: "oculto" }, "Pools de liquidez"),
              cabecera(),
              h("tbody", {}, mostrados.map(fila))))
        : h("p", { class: "panel" }, "Ningún pool cumple estos filtros. Prueba a quitar alguno."),
      lista.length > visibles ? h("button", { type: "button", class: "boton secundario cargar-mas", onclick: cargarMas }, "Cargar 25 más") : null,
    );
  }

  reemplazar(contenedor,
    h("h1", { tabindex: "-1" }, "Explorar pools"),
    h("p", { class: "intro" }, "Pools de dos monedas con al menos 100.000 $ depositados. Al principio salen ordenados por APY por comisiones, de mayor a menor, y sin los pools que no cobran comisiones. Filtra, ordena y pulsa «Simular» para calcular cuánto podrías ganar."),
    formulario,
    recuento,
    resultados,
  );
  rellenarOpciones();
  pintar();

  // Cuando lleguen los datos, se vuelve a pintar. Devolvemos cómo dejar de escuchar.
  return suscribir(() => {
    rellenarOpciones();
    pintar();
  });
}
