// Guardar y leer datos en el navegador (localStorage).
// Todo va dentro de try/catch: si el almacenamiento está bloqueado o lleno,
// la app sigue funcionando, solo que sin recordar nada.

// Nombres de las "cajitas" donde guardamos cada cosa.
export const CLAVES = {
  tema: "analidefi:tema",
  pools: "analidefi:pools",
  poolElegido: "analidefi:pool-elegido",
  historial: "analidefi:historial",
  mercado: "analidefi:mercado",
  miedo: "analidefi:miedo",
  filtros: "analidefi:filtros", // filtros y orden de Explorar pools
  simulador: "analidefi:simulador", // últimos valores del simulador
};

export function leer(clave, porDefecto = null) {
  try {
    const texto = localStorage.getItem(clave);
    return texto === null ? porDefecto : JSON.parse(texto);
  } catch {
    return porDefecto;
  }
}

export function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function borrar(clave) {
  try {
    localStorage.removeItem(clave);
  } catch {
    // Nada que hacer: si no se puede borrar, no pasa nada.
  }
}

// ¿Se puede guardar en este navegador? (Algunos modos privados o ajustes lo bloquean.)
export function almacenDisponible() {
  try {
    const prueba = "analidefi:prueba";
    localStorage.setItem(prueba, "1");
    localStorage.removeItem(prueba);
    return true;
  } catch {
    return false;
  }
}

// Caché con fecha: guarda { fecha, datos } y solo lo devuelve si no ha caducado.
export function leerCache(clave, minutos) {
  const caja = leer(clave);
  if (!caja || typeof caja.fecha !== "number") return null;
  if (Date.now() - caja.fecha > minutos * 60 * 1000) return null;
  return caja;
}

export function guardarCache(clave, datos) {
  return guardar(clave, { fecha: Date.now(), datos });
}
