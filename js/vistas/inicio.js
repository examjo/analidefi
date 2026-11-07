// Pantalla "Inicio": presentación, resumen en vivo y tres explicaciones sencillas.
import { h, reemplazar } from "../dom.js?v=1";
import { leerEstado, suscribir } from "../estado.js?v=1";
import { abreviado, numero } from "../formato.js?v=1";
import { AVISO_EJEMPLO } from "../datos.js?v=1";
import { tarjeta, cargando, variacion } from "./mercado.js?v=1";

const EXPLICACIONES = [
  ["¿Qué es un pool?", "Un fondo compartido con dos monedas. La gente lo usa para cambiar una moneda por la otra, y quienes ponen su dinero en el fondo (aportan liquidez) cobran por ello."],
  ["¿Qué es una comisión?", "Cada vez que alguien cambia monedas en el pool paga un pequeño porcentaje, por ejemplo un 0,3 %. Ese dinero se reparte entre quienes aportan, según la parte del pool que tenga cada uno."],
  ["¿Qué es la pérdida por variación de precio?", "Si una de las dos monedas sube o baja mucho frente a la otra, al retirar tu dinero puedes tener menos valor que si lo hubieras guardado sin más. Las comisiones pueden compensarlo… o no."],
];

export function montarInicio(contenedor) {
  const resumen = h("div", {});

  function pintar() {
    const { mercado, cargandoMercado, origenMercado, miedo, cargandoMiedo, origenMiedo, pools, cargandoPools, origenPools } = leerEstado();
    const hoy = miedo[miedo.length - 1];
    const enEjemplo = [origenMercado, origenMiedo, origenPools].includes("ejemplo");
    // Mientras carga, cada tarjeta muestra la rueda; si falla, muestra "—".
    const esperando = cargando;
    const v = mercado ? variacion(mercado.variacion24h) : null;

    reemplazar(resumen,
      enEjemplo ? h("p", { class: "aviso", role: "status" }, AVISO_EJEMPLO) : null,
      h("div", { class: "tarjetas tres" },
        mercado ? tarjeta("Capitalización total del mercado", abreviado(mercado.capitalizacion), v.clase, v.texto + " en 24 h")
          : cargandoMercado ? esperando("Cargando mercado…") : tarjeta("Capitalización total del mercado", "—"),
        hoy ? tarjeta("Índice de miedo y codicia", `${hoy.valor} / 100`, "", hoy.clasificacion)
          : cargandoMiedo ? esperando("Cargando índice…") : tarjeta("Índice de miedo y codicia", "—"),
        cargandoPools && !pools.length ? esperando("Cargando pools…")
          : tarjeta("Pools cargados", numero(pools.length, 0), "", "de dos monedas y con al menos 100.000 $"),
      ),
    );
  }

  reemplazar(contenedor,
    h("h1", { tabindex: "-1" }, "Entiende un pool antes de entrar"),
    h("p", { class: "intro" }, "analidefi te ayuda a explorar pools de liquidez con datos públicos y a simular cuánto podrías ganar (o perder) sin arriesgar dinero."),
    h("div", { class: "acciones" },
      h("a", { class: "boton", href: "#pools" }, "Explorar pools"),
      h("a", { class: "boton secundario", href: "#simulador" }, "Simular")),
    h("p", { class: "aviso" }, h("strong", {}, "Herramienta educativa. No es asesoramiento financiero.")),
    h("h2", {}, "Resumen en vivo"),
    resumen,
    h("h2", {}, "Lo básico en un minuto"),
    h("div", { class: "tarjetas tres" },
      EXPLICACIONES.map(([titulo, texto]) => h("section", { class: "panel explicacion" }, h("h3", {}, titulo), h("p", {}, texto)))),
    h("p", {}, "¿Alguna palabra rara? Mira el ", h("a", { href: "#glosario" }, "Glosario"), "."),
  );
  pintar();
  return suscribir(pintar);
}
