// Historial de simulaciones guardadas en el navegador (máximo diez).
import { leer, guardar, borrar, CLAVES } from "./almacen.js?v=1";

const MAXIMO = 10;

// Devuelve la lista guardada (la más reciente primero). Si hay algo raro, lo ignora.
export function leerHistorial() {
  const lista = leer(CLAVES.historial, []);
  return Array.isArray(lista) ? lista.filter((e) => e && typeof e === "object" && Number.isFinite(e.neto)) : [];
}

// Añade una simulación al principio y deja solo las diez últimas. Devuelve false si no se pudo guardar.
export function guardarEnHistorial(entrada) {
  return guardar(CLAVES.historial, [entrada, ...leerHistorial()].slice(0, MAXIMO));
}

export function borrarDeHistorial(id) {
  return guardar(CLAVES.historial, leerHistorial().filter((e) => e.id !== id));
}

export function borrarHistorial() {
  borrar(CLAVES.historial);
}
