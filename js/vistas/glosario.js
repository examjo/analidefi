// Pantalla "Glosario": las palabras clave explicadas con sencillez.
import { h, reemplazar } from "../dom.js?v=1";

const TERMINOS = [
  ["Pool", "Fondo compartido con dos monedas donde la gente cambia una por otra. Quienes ponen dinero en él cobran parte de las comisiones."],
  ["Liquidez", "El dinero que hay disponible en un pool para hacer intercambios. Aportar liquidez es poner tu dinero en el pool."],
  ["TVL", "Valor total bloqueado (del inglés Total Value Locked): todo el dinero depositado en un pool, en dólares."],
  ["APY", "Rentabilidad anual estimada en porcentaje, contando que lo ganado se vuelve a sumar. Es una foto de hoy: cambia cada día."],
  ["APY base", "La parte del APY que sale de las comisiones que pagan quienes hacen intercambios en el pool."],
  ["Recompensas", "Monedas extra que algunos protocolos regalan para atraer dinero a sus pools. Suelen ser temporales y su precio puede bajar."],
  ["Comisión", "Pequeño porcentaje (por ejemplo, 0,3 %) que se paga en cada intercambio y se reparte entre quienes aportan liquidez."],
  ["Pérdida por variación de precio (pérdida impermanente)", "Lo que dejas de ganar frente a guardar las dos monedas sin más, cuando el precio de una cambia respecto a la otra. Se llama «impermanente» porque desaparece si los precios vuelven a como estaban."],
  ["Stablecoin", "Moneda digital pensada para valer siempre lo mismo, normalmente 1 dólar. Los pools de dos stablecoins casi no sufren pérdida por variación de precio."],
  ["Red (blockchain)", "El sistema donde viven las monedas y se apuntan todas las operaciones. Hay muchas redes distintas y cada pool está en una."],
  ["Protocolo", "La aplicación o servicio que gestiona el pool: define sus reglas, sus comisiones y sus recompensas."],
  ["Miedo y codicia", "Índice de 0 a 100 que resume el ánimo del mercado. Cerca de 0, la gente tiene miedo y vende; cerca de 100, hay euforia y compra."],
];

export function montarGlosario(contenedor) {
  reemplazar(contenedor,
    h("h1", { tabindex: "-1" }, "Glosario"),
    h("p", { class: "intro" }, "Las palabras que vas a ver en la app, explicadas sin tecnicismos."),
    h("dl", { class: "glosario" },
      TERMINOS.map(([termino, definicion]) => h("div", { class: "panel" }, h("dt", {}, termino), h("dd", {}, definicion)))),
  );
}
