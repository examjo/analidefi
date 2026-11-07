// Pantalla "Historial": las diez últimas simulaciones guardadas en este navegador.
import { h, reemplazar } from "../dom.js?v=1";
import { dolares, numero, porcentaje } from "../formato.js?v=1";
import { leerHistorial, borrarDeHistorial, borrarHistorial } from "../historial.js?v=1";
import { almacenDisponible } from "../almacen.js?v=1";
import { cargarSimulacion } from "./simulador.js?v=1";

const nombreDe = (e) => (e.modo === "pool" && e.pool ? `${e.pool.symbol} (${e.pool.project}, ${e.pool.chain})` : "Manual");
const fechaDe = (e) => {
  const f = new Date(e.fecha);
  return Number.isNaN(f.getTime()) ? "—" : f.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
};

export function montarHistorial(contenedor) {
  // El mensaje de estado se crea una vez para que el lector de pantalla lo anuncie.
  const estado = h("p", { class: "estado-guardado", role: "status" });

  function borrarUna(e) {
    borrarDeHistorial(e.id);
    pintar();
    estado.textContent = "Simulación borrada.";
    contenedor.querySelector("h1")?.focus();
  }

  function borrarTodas() {
    if (!confirm("¿Seguro que quieres borrar todas las simulaciones guardadas?")) return;
    borrarHistorial();
    pintar();
    estado.textContent = "Historial borrado.";
    contenedor.querySelector("h1")?.focus();
  }

  function tarjeta(e) {
    const nombre = nombreDe(e);
    const fecha = fechaDe(e);
    const clase = e.neto > 0.005 ? "positivo" : e.neto < -0.005 ? "negativo" : "";
    const par = (titulo, valor) => h("div", {}, h("dt", {}, titulo), h("dd", {}, valor));
    return h("li", { class: "panel item-historial" },
      h("div", { class: "item-cabecera" }, h("strong", {}, nombre), h("span", { class: "meta" }, fecha)),
      h("dl", { class: "item-datos" },
        par("Capital", dolares(e.capital)),
        par("Días", numero(e.dias, 0)),
        par("Variación", porcentaje(e.variacion)),
        par("Resultado", h("span", { class: "dato-valor " + clase }, (e.neto > 0 ? "+" : "") + dolares(e.neto)))),
      h("div", { class: "item-botones" },
        h("button", { type: "button", class: "boton", "aria-label": `Cargar en el simulador: ${nombre}, ${fecha}`, onclick: () => cargarSimulacion(e) }, "Cargar en el simulador"),
        h("button", { type: "button", class: "boton secundario", "aria-label": `Borrar: ${nombre}, ${fecha}`, onclick: () => borrarUna(e) }, "Borrar")),
    );
  }

  function pintar() {
    const lista = leerHistorial();
    reemplazar(contenedor,
      h("h1", { tabindex: "-1" }, "Historial"),
      h("p", { class: "intro" }, "Tus diez últimas simulaciones, guardadas solo en este navegador."),
      // Si el navegador no deja guardar, lo explicamos (el resto de la app funciona igual).
      almacenDisponible() ? null : h("p", { class: "aviso", role: "status" },
        "Tu navegador no permite guardar datos (quizá estás en modo privado o lo tienes bloqueado). El historial no se puede usar, pero el resto de la app funciona igual."),
      estado,
      lista.length
        ? [h("ul", { class: "historial" }, lista.map(tarjeta)),
           h("button", { type: "button", class: "boton secundario", onclick: borrarTodas }, "Borrar todo")]
        : h("p", { class: "panel" }, "Aún no has guardado ninguna simulación. Pulsa «Guardar simulación» en el ", h("a", { href: "#simulador" }, "Simulador"), "."),
    );
  }

  pintar();
}
