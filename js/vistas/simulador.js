// Pantalla "Simulador": comisiones, recompensas y pérdida por variación de precio.
import { h, s, reemplazar } from "../dom.js?v=1";
import { leerEstado } from "../estado.js?v=1";
import { abreviado, dolares, numero, porcentaje } from "../formato.js?v=1";
import { calcular } from "../calculos.js?v=1";
import { guardarEnHistorial } from "../historial.js?v=1";
import { leer, guardar, CLAVES } from "../almacen.js?v=1";

// Valores del simulador. Viven fuera de la pantalla para conservarse al cambiar de sección.
const sim = {
  modo: "manual", // "pool" (datos de un pool real) o "manual"
  pool: null, // pool en uso en modo pool real
  capital: 1000, dias: 30, variacion: 0,
  tvl: 1000000, volumen: 250000, comision: 0.3, // modo manual
  apyBase: 0, apyReward: 0, // modo pool real
};
let eleccionVista = 0; // última vez que se pulsó "Simular" en Explorar y ya la hemos atendido

// Reglas de cada campo: etiqueta, límites y una ayuda opcional.
const CAMPOS = {
  capital: { etiqueta: "Capital a aportar ($)", min: 0, minExcluido: true, max: 1e12 },
  dias: { etiqueta: "Días de permanencia", min: 1, max: 3650, entero: true, ayuda: "De 1 a 3.650 días (10 años)." },
  variacion: { etiqueta: "Variación del precio (%)", min: -90, max: 500, ayuda: "De −90 % a +500 %: cuánto cambia el precio de una moneda frente a la otra. 100 = la dobla." },
  tvl: { etiqueta: "TVL del pool ($)", min: 0, max: 1e13, ayuda: "Dinero total depositado en el pool." },
  volumen: { etiqueta: "Volumen diario ($)", min: 0, max: 1e13, ayuda: "Dinero que se intercambia en el pool cada día." },
  comision: { etiqueta: "Comisión del pool (%)", min: 0, max: 100, ayuda: "Lo que paga cada intercambio. Ej.: 0,3." },
  apyBase: { etiqueta: "APY por comisiones (%)", min: 0, max: 100000 },
  apyReward: { etiqueta: "APY por recompensas (%)", min: 0, max: 100000, ayuda: "Si el pool no da recompensas, déjalo en 0." },
};

// Comprueba si un número cumple las reglas de un campo (se usa al recuperar lo guardado).
const dentroDeLimites = (regla, n) =>
  Number.isFinite(n) && (regla.minExcluido ? n > regla.min : n >= regla.min) && n <= regla.max &&
  (!regla.entero || Number.isInteger(n));

// Recupera los últimos valores del simulador para que sigan ahí al recargar la página.
// Devuelve true si había algo guardado.
function recuperarSim() {
  const g = leer(CLAVES.simulador);
  if (!g || typeof g !== "object") return false;
  for (const [nombre, regla] of Object.entries(CAMPOS)) {
    if (dentroDeLimites(regla, g[nombre])) sim[nombre] = g[nombre];
  }
  if (g.pool && typeof g.pool === "object" && typeof g.pool.symbol === "string") sim.pool = g.pool;
  sim.modo = g.modo === "pool" && sim.pool ? "pool" : "manual";
  return true;
}
const guardarSimActual = () => guardar(CLAVES.simulador, sim);

// Si había valores guardados, el pool elegido antes de recargar ya está atendido (no pisamos lo guardado).
if (recuperarSim()) eleccionVista = leerEstado().eleccion;

const redondear = (n) => Math.round((Number(n) || 0) * 100) / 100;
const fmtLimite = (n) => numero(n, Number.isInteger(n) ? 0 : 2);
const conSigno = (texto, n) => (n > 0 ? "+" : "") + texto;
const claseSigno = (n) => (n > 0.005 ? "positivo" : n < -0.005 ? "negativo" : "");

// Pasa al modo pool real con los datos de un pool.
function usarPool(p) {
  Object.assign(sim, {
    modo: "pool",
    pool: { pool: p.pool, symbol: p.symbol, project: p.project, chain: p.chain, tvlUsd: p.tvlUsd },
    apyBase: redondear(p.apyBase),
    apyReward: redondear(p.apyReward), // si no hay dato, 0
  });
}

// Vuelve a cargar una simulación del historial y abre el simulador.
export function cargarSimulacion(e) {
  for (const nombre of Object.keys(CAMPOS)) {
    if (Number.isFinite(e[nombre])) sim[nombre] = e[nombre];
  }
  if (e.modo === "pool" && e.pool) Object.assign(sim, { modo: "pool", pool: e.pool });
  else sim.modo = "manual";
  eleccionVista = leerEstado().eleccion; // que no lo pise el pool elegido en Explorar
  location.hash = "#simulador";
}

// Comprueba un campo. Devuelve { valor } si está bien o { error } con un mensaje claro.
function validar(regla, input) {
  if (input.value.trim() === "") {
    return { error: input.validity && input.validity.badInput ? "Escribe un número válido." : "Este campo no puede estar vacío." };
  }
  const n = Number(input.value);
  if (!Number.isFinite(n)) return { error: "Escribe un número válido." };
  if (regla.entero && !Number.isInteger(n)) return { error: "Escribe un número entero de días." };
  const bajo = regla.minExcluido ? n <= regla.min : n < regla.min;
  if (bajo || n > regla.max) {
    return { error: regla.minExcluido
      ? `Debe ser mayor que ${fmtLimite(regla.min)} y como máximo ${fmtLimite(regla.max)}.`
      : `Debe estar entre ${fmtLimite(regla.min)} y ${fmtLimite(regla.max)}.` };
  }
  return { valor: n };
}

// --- Gráfica SVG (s() viene de dom.js) ---
function grafica(serie, dias) {
  const W = 640, H = 240, izq = 78, der = 16, arr = 14, aba = 30;
  const min = Math.min(0, ...serie), max = Math.max(0, ...serie);
  const rango = max - min || 1;
  const x = (d) => izq + (d / dias) * (W - izq - der);
  const y = (v) => arr + ((max - v) / rango) * (H - arr - aba);
  const eje = (v) => (Math.abs(v) < 1000 ? dolares(v) : abreviado(v));
  const final = serie[serie.length - 1];

  // Valores del eje vertical: máximo, cero y mínimo (sin repetir).
  const marcas = [...new Set([max, 0, min])];
  // Días del eje horizontal: inicio, mitad y final.
  const diasEje = [...new Set([0, Math.round(dias / 2), dias])];

  return s("svg", {
    class: "grafica", viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label": `Evolución del resultado neto: de 0 $ el día 0 a ${dolares(final)} el día ${numero(dias, 0)}.`,
  },
    ...marcas.map((v) => s("line", { class: v === 0 ? "linea-cero" : "linea-guia", x1: izq, x2: W - der, y1: y(v), y2: y(v) })),
    ...marcas.map((v) => s("text", { x: izq - 8, y: y(v) + 4, "text-anchor": "end" }, eje(v))),
    ...diasEje.map((d) => s("text", { x: x(d), y: H - 8, "text-anchor": d === 0 ? "start" : d === dias ? "end" : "middle" }, `Día ${numero(d, 0)}`)),
    s("polyline", { class: "linea-dato " + (final < 0 ? "negativo" : "positivo"), points: serie.map((v, d) => `${x(d).toFixed(1)},${y(v).toFixed(1)}`).join(" ") }),
    s("circle", { class: "punto-final " + (final < 0 ? "negativo" : "positivo"), cx: x(dias), cy: y(final), r: 4 }),
  );
}

export function montarSimulador(contenedor) {
  // Si se acaba de pulsar "Simular" en Explorar, empezamos en modo pool real con ese pool.
  const { poolElegido, eleccion } = leerEstado();
  if (poolElegido && eleccion !== eleccionVista) usarPool(poolElegido);
  eleccionVista = eleccion;

  let entradas = {}; // nombre del campo → { input, error, regla }
  const resultados = h("div", { class: "sim-resultados" });
  const resumen = h("p", { class: "oculto", "aria-live": "polite" }); // lo lee el lector de pantalla
  const estadoGuardado = h("p", { class: "estado-guardado", role: "status" });
  const botonGuardar = h("button", { type: "button", class: "boton", onclick: guardarSim }, "Guardar simulación");

  function crearCampo(nombre) {
    const regla = CAMPOS[nombre];
    const id = "sim-" + nombre;
    const ayuda = regla.ayuda ? h("p", { id: id + "-ayuda", class: "ayuda" }, regla.ayuda) : null;
    const error = h("p", { id: id + "-error", class: "error-campo" });
    const input = h("input", {
      id, type: "number", inputmode: "decimal", step: regla.entero ? "1" : "any",
      min: regla.min, max: regla.max, value: String(sim[nombre]),
      "aria-describedby": [ayuda ? id + "-ayuda" : "", id + "-error"].join(" ").trim(),
    });
    entradas[nombre] = { input, error, regla };
    return h("div", { class: "campo" }, h("label", { for: id }, regla.etiqueta), input, ayuda, error);
  }

  function cambiarModo(modo) {
    if (modo === sim.modo) return;
    sim.modo = modo;
    estadoGuardado.textContent = "";
    pintarTodo();
    contenedor.querySelector(`[data-modo="${modo}"]`)?.focus();
  }

  // Lee y valida los campos; si todo está bien, recalcula y pinta los resultados.
  function recalcular() {
    let hayErrores = false;
    for (const [nombre, { input, error, regla }] of Object.entries(entradas)) {
      const r = validar(regla, input);
      error.textContent = r.error || "";
      if (r.error) {
        hayErrores = true;
        input.setAttribute("aria-invalid", "true");
      } else {
        input.removeAttribute("aria-invalid");
        sim[nombre] = r.valor;
      }
    }
    guardarSimActual(); // "sim" solo tiene valores válidos: se guardan para la próxima visita
    botonGuardar.disabled = hayErrores;
    if (hayErrores) {
      resumen.textContent = "";
      reemplazar(resultados, h("p", { class: "aviso" }, "Corrige los campos marcados en rojo para ver los resultados."));
      return;
    }
    pintarResultados(calcular(sim));
  }

  function dato(titulo, valor, clase = "", detalle = null) {
    return h("div", { class: "dato" },
      h("span", { class: "dato-titulo" }, titulo),
      h("strong", { class: "dato-valor " + clase }, valor),
      detalle ? h("span", { class: "dato-detalle" }, detalle) : null);
  }

  function pintarResultados(r) {
    const manual = sim.modo === "manual";
    const dias = `${numero(sim.dias, 0)} ${sim.dias === 1 ? "día" : "días"}`;
    resumen.textContent = `Resultado neto en ${dias}: ${dolares(r.neto)}.`;
    reemplazar(resultados,
      h("div", { class: "datos" },
        dato("Resultado neto en " + dias, conSigno(dolares(r.neto), r.neto), "grande " + claseSigno(r.neto),
          conSigno(porcentaje(r.netoPct), r.netoPct) + " sobre el capital"),
        manual ? dato("Tu parte del pool", porcentaje(r.parte * 100, 3)) : null,
        dato("Comisiones al día", dolares(r.comDiarias)),
        dato("APY por comisiones", porcentaje(r.apyCom)),
        manual ? null : dato("Recompensas al día", dolares(r.recDiarias)),
        dato("Ganado en comisiones", conSigno(dolares(r.ganCom), r.ganCom), claseSigno(r.ganCom)),
        manual ? null : dato("Ganado en recompensas", conSigno(dolares(r.ganRec), r.ganRec), claseSigno(r.ganRec)),
        dato("Pérdida por variación de precio", porcentaje(r.perdida * 100), claseSigno(r.perdidaUsd), dolares(r.perdidaUsd) + " sobre el capital"),
      ),
      h("figure", { class: "panel figura" },
        h("figcaption", {}, "Evolución del resultado día a día"),
        grafica(r.serie, sim.dias),
        h("p", { class: "ayuda" }, "Supone que el cambio de precio se reparte por igual entre los días.")),
      h("p", { class: "nota" }, "Las rentabilidades pasadas no garantizan las futuras. El APY cambia cada día."),
    );
  }

  function guardarSim() {
    const r = calcular(sim);
    const entrada = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      fecha: Date.now(),
      modo: sim.modo,
      pool: sim.modo === "pool" ? sim.pool : null,
      ...Object.fromEntries(Object.keys(CAMPOS).map((n) => [n, sim[n]])),
      neto: r.neto,
    };
    if (guardarEnHistorial(entrada)) reemplazar(estadoGuardado, "Simulación guardada. ", h("a", { href: "#historial" }, "Ver historial"));
    else estadoGuardado.textContent = "No se ha podido guardar: el almacenamiento del navegador está bloqueado o lleno.";
  }

  function pintarTodo() {
    entradas = {};
    const enPool = sim.modo === "pool" && sim.pool;
    if (!enPool) sim.modo = "manual";
    const p = sim.pool;

    const modos = h("div", { class: "modos", role: "group", "aria-label": "Modo del simulador" },
      h("button", { type: "button", class: "modo", "data-modo": "pool", "aria-pressed": String(!!enPool), disabled: !p, onclick: () => cambiarModo("pool") }, "Modo pool real"),
      h("button", { type: "button", class: "modo", "data-modo": "manual", "aria-pressed": String(!enPool), onclick: () => cambiarModo("manual") }, "Modo manual"));

    const cabeceraModo = enPool
      ? h("div", { class: "sim-pool" },
          h("span", { class: "dato-titulo" }, "Pool elegido"),
          h("strong", {}, p.symbol), ` · ${p.project} · ${p.chain} · TVL ${abreviado(p.tvlUsd)}`,
          h("p", { class: "ayuda" }, "El APY viene del pool; puedes cambiarlo para probar otros escenarios."))
      : h("p", { class: "ayuda" }, p
          ? "Modo manual: escribe los datos del pool a mano."
          : ["Para usar los datos de un pool real, pulsa «Simular» en ", h("a", { href: "#pools" }, "Explorar pools"), "."]);

    const formulario = h("form", { class: "panel sim-formulario", "aria-label": "Datos de la simulación", novalidate: true,
      onsubmit: (e) => e.preventDefault(), // Intro no recarga la página
      oninput: () => { estadoGuardado.textContent = ""; recalcular(); } },
      modos,
      cabeceraModo,
      (enPool ? ["apyBase", "apyReward"] : ["tvl", "volumen", "comision"]).map(crearCampo),
      ["capital", "dias", "variacion"].map(crearCampo),
      h("div", { class: "sim-guardar" }, botonGuardar, estadoGuardado),
    );

    reemplazar(contenedor,
      h("h1", { tabindex: "-1" }, "Simulador"),
      h("p", { class: "intro" }, "Calcula cuánto podrías ganar con comisiones y recompensas, y cuánto perderías si cambia el precio de una de las monedas. Los resultados se actualizan al escribir."),
      h("div", { class: "sim" }, formulario, h("section", { "aria-label": "Resultados" }, resumen, resultados)),
    );
    recalcular();
  }

  pintarTodo();
}
