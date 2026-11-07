// Pantalla "Mercado": cifras globales y el índice de miedo y codicia (hoy y últimos 30 días).
import { h, s, reemplazar } from "../dom.js?v=1";
import { leerEstado, suscribir } from "../estado.js?v=1";
import { abreviado, numero, porcentaje } from "../formato.js?v=1";
import { AVISO_EJEMPLO } from "../datos.js?v=1";

const claseSigno = (n) => (n > 0.005 ? "positivo" : n < -0.005 ? "negativo" : "");
const conSigno = (n) => (n > 0 ? "+" : "") + porcentaje(n);
const fechaCorta = (ms) => new Date(ms).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

// Piezas que también usa Inicio.
export function tarjeta(titulo, valor, clase = "", detalle = null) {
  return h("div", { class: "dato" },
    h("span", { class: "dato-titulo" }, titulo),
    h("strong", { class: "dato-valor " + clase }, valor),
    detalle ? h("span", { class: "dato-detalle " + clase }, detalle) : null);
}
export const cargando = (texto) =>
  h("div", { class: "cargando", role: "status" }, h("span", { class: "rueda", "aria-hidden": "true" }), texto);
export const variacion = (n) => ({ texto: conSigno(n), clase: claseSigno(n) });

// Indicador de 0 a 100: una barra con cinco tramos y una marca en el valor actual.
const TRAMOS = [[0, 25, "tramo-1"], [25, 47, "tramo-2"], [47, 55, "tramo-3"], [55, 76, "tramo-4"], [76, 100, "tramo-5"]];
function indicador(valor) {
  const W = 400, x = (v) => 10 + (v / 100) * (W - 20);
  return s("svg", { class: "indicador", viewBox: `0 0 ${W} 58`, "aria-hidden": "true" },
    TRAMOS.map(([a, b, clase]) => s("rect", { class: clase, x: x(a), y: 16, width: x(b) - x(a), height: 14 })),
    s("path", { class: "marca-valor", d: `M${x(valor)} 32 l-7 12 h14 Z` }), // triángulo bajo la barra
    s("rect", { class: "marca-valor", x: x(valor) - 2, y: 10, width: 4, height: 24, rx: 2 }),
    [0, 50, 100].map((v) => s("text", { x: x(v), y: 56, "text-anchor": v === 0 ? "start" : v === 100 ? "end" : "middle" }, String(v))),
  );
}

// Gráfica de línea de los últimos 30 días (escala fija de 0 a 100).
function graficaMiedo(lista) {
  const W = 640, H = 220, izq = 34, der = 16, arr = 12, aba = 28;
  const x = (i) => izq + (lista.length > 1 ? i / (lista.length - 1) : 0) * (W - izq - der);
  const y = (v) => arr + ((100 - v) / 100) * (H - arr - aba);
  const primero = lista[0], ultimo = lista[lista.length - 1];
  return s("svg", {
    class: "grafica", viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label": `Índice de miedo y codicia: de ${primero.valor} el ${fechaCorta(primero.fecha)} a ${ultimo.valor} el ${fechaCorta(ultimo.fecha)}.`,
  },
    [0, 25, 50, 75, 100].map((v) => s("line", { class: v === 50 ? "linea-cero" : "linea-guia", x1: izq, x2: W - der, y1: y(v), y2: y(v) })),
    [0, 50, 100].map((v) => s("text", { x: izq - 8, y: y(v) + 4, "text-anchor": "end" }, String(v))),
    s("text", { x: izq, y: H - 8, "text-anchor": "start" }, fechaCorta(primero.fecha)),
    s("text", { x: W - der, y: H - 8, "text-anchor": "end" }, fechaCorta(ultimo.fecha)),
    s("polyline", { class: "linea-dato primario", points: lista.map((d, i) => `${x(i).toFixed(1)},${y(d.valor).toFixed(1)}`).join(" ") }),
    s("circle", { class: "punto-final primario", cx: x(lista.length - 1), cy: y(ultimo.valor), r: 4 }),
  );
}

export function montarMercado(contenedor) {
  const zona = h("div", {});

  function pintar() {
    const { mercado, origenMercado, cargandoMercado, miedo, origenMiedo, cargandoMiedo } = leerEstado();
    const hoy = miedo[miedo.length - 1];
    const v = mercado ? variacion(mercado.variacion24h) : null;

    reemplazar(zona,
      origenMercado === "ejemplo" || origenMiedo === "ejemplo" ? h("p", { class: "aviso", role: "status" }, AVISO_EJEMPLO) : null,

      h("h2", {}, "Mercado global"),
      mercado
        ? h("div", { class: "tarjetas" },
            tarjeta("Capitalización total", abreviado(mercado.capitalizacion)),
            tarjeta("Volumen 24 h", abreviado(mercado.volumen)),
            tarjeta("Dominancia de BTC", porcentaje(mercado.dominanciaBtc, 1)),
            tarjeta("Dominancia de ETH", porcentaje(mercado.dominanciaEth, 1)),
            tarjeta("Variación 24 h", v.texto, v.clase, "de la capitalización total"))
        : cargandoMercado ? cargando("Cargando datos del mercado…") : null,

      h("h2", {}, "Índice de miedo y codicia"),
      hoy
        ? [h("section", { class: "panel miedo-hoy", "aria-label": "Índice de hoy" },
              h("p", { class: "miedo-valor" }, h("strong", {}, String(hoy.valor)), h("span", {}, " / 100 · "), h("strong", {}, hoy.clasificacion)),
              indicador(hoy.valor),
              h("p", { class: "ayuda" }, "0 = miedo extremo (mucha gente vende), 100 = codicia extrema (mucha gente compra). Mide el ánimo del mercado, no predice el precio.")),
           h("figure", { class: "panel figura" },
              h("figcaption", {}, `Últimos ${numero(miedo.length, 0)} días`),
              graficaMiedo(miedo))]
        : cargandoMiedo ? cargando("Cargando el índice de miedo y codicia…") : null,
    );
  }

  reemplazar(contenedor,
    h("h1", { tabindex: "-1" }, "Mercado"),
    h("p", { class: "intro" }, "Una foto del mercado de criptomonedas: cuánto vale en total, cuánto se mueve y cuál es el ánimo de la gente."),
    zona,
  );
  pintar();
  return suscribir(pintar); // se vuelve a pintar cuando llegan los datos
}
