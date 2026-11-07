// Formato de números al estilo español: 1.234,56

// Número con puntos de miles y coma decimal. Si no es un número, muestra "—".
export function numero(n, decimales = 2) {
  if (!Number.isFinite(n)) return "—";
  const [entero, fraccion] = Math.abs(n).toFixed(decimales).split(".");
  const conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const signo = n < 0 && Number(Math.abs(n).toFixed(decimales)) !== 0 ? "-" : "";
  return signo + conPuntos + (fraccion ? "," + fraccion : "");
}

// Quita los ceros que sobran a la derecha de la coma: "2,50" → "2,5" y "3,00" → "3".
const sinCeros = (texto) => (texto.includes(",") ? texto.replace(/0+$/, "").replace(/,$/, "") : texto);

// Cantidad en dólares abreviada con la escala española (nunca "B", que en inglés son mil millones):
//   menos de un millón      → 250 mil $
//   de un millón a un billón → en millones: 1,2 M $ o 56.100 M $
//   un billón (10^12) o más  → 2,57 billones $
export function abreviado(n) {
  if (!Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  // Redondeamos antes de elegir la escala para que 999.999 no salga como "1.000 mil $".
  const millones = Number((a / 1e6).toFixed(a < 1e9 ? 1 : 0));
  const miles = Number((a / 1e3).toFixed(1));
  if (millones >= 1e6) {
    const texto = sinCeros(numero(n / 1e12, 2));
    return texto + (texto === "1" || texto === "-1" ? " billón $" : " billones $");
  }
  if (miles >= 1000) return sinCeros(numero(n / 1e6, a < 1e9 ? 1 : 0)) + " M $";
  if (a >= 1e3) return sinCeros(numero(n / 1e3, 1)) + " mil $";
  return numero(n, 0) + " $";
}

// Cantidad en dólares completa: 1.234,56 $
export function dolares(n) {
  return Number.isFinite(n) ? numero(n, 2) + " $" : "—";
}

// Porcentaje: 12,34 %
export function porcentaje(n, decimales = 2) {
  return Number.isFinite(n) ? numero(n, decimales) + " %" : "—";
}
