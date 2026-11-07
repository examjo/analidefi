// Estado central: los datos que comparten todas las pantallas.
// Las pantallas leen con leerEstado(), cambian con cambiarEstado()
// y se enteran de los cambios con suscribir().
import { leer, guardar, CLAVES } from "./almacen.js?v=1";

const estado = {
  pools: [], // lista de pools ya filtrada (máximo 500)
  origenPools: null, // "vivo", "cache" o "ejemplo"
  cargandoPools: false,
  mercado: null, // { capitalizacion, volumen, dominanciaBtc, dominanciaEth, variacion24h }
  origenMercado: null,
  cargandoMercado: false,
  miedo: [], // miedo y codicia, del día más antiguo al más reciente: [{ valor, fecha, clasificacion }]
  origenMiedo: null,
  cargandoMiedo: false,
  poolElegido: leer(CLAVES.poolElegido), // el pool que se pasa al simulador
  eleccion: 0, // sube cada vez que se pulsa "Simular" (así el simulador sabe que hay un pool nuevo)
};
if (estado.poolElegido) estado.eleccion = 1;

const oyentes = new Set();

export function leerEstado() {
  return estado;
}

export function cambiarEstado(cambios) {
  Object.assign(estado, cambios);
  oyentes.forEach((avisar) => avisar(estado));
}

// Devuelve una función para dejar de escuchar (útil al salir de una pantalla).
export function suscribir(avisar) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

// Elige un pool para el simulador y lo recuerda aunque se recargue la página.
export function elegirPool(pool) {
  cambiarEstado({ poolElegido: pool, eleccion: estado.eleccion + 1 });
  guardar(CLAVES.poolElegido, pool);
}
