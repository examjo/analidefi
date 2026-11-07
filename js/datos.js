// Capa de datos: descarga, filtra y guarda en caché la información de internet.
import { leerCache, guardarCache, CLAVES } from "./almacen.js?v=1";

const URL_POOLS = "https://yields.llama.fi/pools";
const MINUTOS_CACHE_POOLS = 30;
const TVL_MINIMO = 100000;
const MAXIMO_POOLS = 500;

export const AVISO_EJEMPLO = "No se han podido cargar datos en vivo; estás viendo datos de ejemplo.";

// Cinco pools inventados para cuando no hay conexión. Nombres ficticios a propósito.
export const POOLS_EJEMPLO = [
  { pool: "ejemplo-1", chain: "Red Alfa", project: "intercambio-demo", symbol: "MONA-USDX", tvlUsd: 48200000, apyBase: 8.4, apyReward: 3.1, apy: 11.5, apyMean30d: 10.9, volumeUsd1d: 6100000, ilRisk: "yes", stablecoin: false, poolMeta: "0,3 %" },
  { pool: "ejemplo-2", chain: "Red Alfa", project: "estables-demo", symbol: "USDX-USDY", tvlUsd: 125000000, apyBase: 3.2, apyReward: null, apy: 3.2, apyMean30d: 3.5, volumeUsd1d: 21000000, ilRisk: "no", stablecoin: true, poolMeta: null },
  { pool: "ejemplo-3", chain: "Red Beta", project: "intercambio-demo", symbol: "SOLEO-MONA", tvlUsd: 2750000, apyBase: 24.6, apyReward: 12.0, apy: 36.6, apyMean30d: 29.8, volumeUsd1d: 900000, ilRisk: "yes", stablecoin: false, poolMeta: "1 %" },
  { pool: "ejemplo-4", chain: "Red Gamma", project: "granja-demo", symbol: "LUNARA-USDX", tvlUsd: 640000, apyBase: 15.1, apyReward: 6.4, apy: 21.5, apyMean30d: 18.2, volumeUsd1d: 120000, ilRisk: "yes", stablecoin: false, poolMeta: null },
  { pool: "ejemplo-5", chain: "Red Beta", project: "estables-demo", symbol: "USDY-USDZ", tvlUsd: 9800000, apyBase: 5.7, apyReward: 1.2, apy: 6.9, apyMean30d: 6.1, volumeUsd1d: 3400000, ilRisk: "no", stablecoin: true, poolMeta: "0,05 %" },
];

// Devuelve el número si es válido o null si falta.
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Nos quedamos solo con los campos que usa la app (así la caché pesa poco).
function limpiarPool(p) {
  return {
    pool: String(p.pool),
    chain: String(p.chain ?? "—"),
    project: String(p.project ?? "—"),
    symbol: String(p.symbol ?? "?"),
    tvlUsd: num(p.tvlUsd),
    apyBase: num(p.apyBase),
    apyReward: num(p.apyReward),
    apy: num(p.apy),
    apyMean30d: num(p.apyMean30d),
    volumeUsd1d: num(p.volumeUsd1d),
    ilRisk: p.ilRisk ?? null,
    stablecoin: p.stablecoin === true,
    poolMeta: p.poolMeta ? String(p.poolMeta) : null,
  };
}

// Pools de dos monedas con TVL de al menos 100.000 $, los 500 más grandes.
function filtrarUtiles(lista) {
  return lista
    .filter((p) => p && p.exposure === "multi" && num(p.tvlUsd) !== null && p.tvlUsd >= TVL_MINIMO)
    .sort((a, b) => b.tvlUsd - a.tvlUsd)
    .slice(0, MAXIMO_POOLS)
    .map(limpiarPool);
}

// Devuelve { pools, origen } donde origen es "cache", "vivo" o "ejemplo".
export async function cargarPools() {
  const cache = leerCache(CLAVES.pools, MINUTOS_CACHE_POOLS);
  if (cache && Array.isArray(cache.datos) && cache.datos.length) {
    return { pools: cache.datos, origen: "cache" };
  }

  // Si la descarga tarda más de 45 segundos, la cancelamos.
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), 45000);
  try {
    const respuesta = await fetch(URL_POOLS, { signal: control.signal });
    if (!respuesta.ok) throw new Error("Respuesta " + respuesta.status);
    const json = await respuesta.json();
    const pools = filtrarUtiles(Array.isArray(json.data) ? json.data : []);
    if (!pools.length) throw new Error("La respuesta no trae pools");
    guardarCache(CLAVES.pools, pools);
    return { pools, origen: "vivo" };
  } catch (error) {
    console.warn("No se han podido cargar los pools:", error);
    return { pools: POOLS_EJEMPLO, origen: "ejemplo" };
  } finally {
    clearTimeout(temporizador);
  }
}

// --- Mercado global (CoinGecko) y miedo y codicia (alternative.me) ---
const URL_MERCADO = "https://api.coingecko.com/api/v3/global";
const URL_MIEDO = "https://api.alternative.me/fng/?limit=30";

// Valores de mercado inventados (aproximados) para cuando no hay conexión.
export const MERCADO_EJEMPLO = { capitalizacion: 2.4e12, volumen: 8.5e10, dominanciaBtc: 55.2, dominanciaEth: 12.8, variacion24h: 1.35 };

// 30 días de miedo y codicia inventados (del más antiguo al más reciente).
export const MIEDO_EJEMPLO = [48, 52, 55, 51, 46, 41, 38, 35, 33, 37, 42, 47, 50, 56, 61, 64, 68, 72, 70, 66, 62, 58, 54, 49, 45, 44, 47, 52, 57, 60]
  .map((valor, i) => ({ valor, fecha: Date.now() - (29 - i) * 864e5 }));

// Clasificación en español según el valor (0 a 100).
export function clasificar(valor) {
  if (valor < 25) return "Miedo extremo";
  if (valor < 47) return "Miedo";
  if (valor < 55) return "Neutral";
  if (valor < 76) return "Codicia";
  return "Codicia extrema";
}
// Traducción de la clasificación que manda la API (si llega otra cosa, se calcula por el valor).
const TRADUCCION = { "extreme fear": "Miedo extremo", fear: "Miedo", neutral: "Neutral", greed: "Codicia", "extreme greed": "Codicia extrema" };
export const traducir = (texto, valor) => TRADUCCION[String(texto).toLowerCase()] || clasificar(valor);

// Descarga un JSON con caché. "limpiar" convierte la respuesta en lo que usa la app
// (o lanza un error si viene mal). Devuelve { datos, origen }.
async function cargarConCache({ url, clave, minutos, limpiar, ejemplo, nombre }) {
  const cache = leerCache(clave, minutos);
  if (cache && cache.datos) return { datos: cache.datos, origen: "cache" };

  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), 20000); // 20 segundos como máximo
  try {
    const respuesta = await fetch(url, { signal: control.signal });
    if (!respuesta.ok) throw new Error("Respuesta " + respuesta.status);
    const datos = limpiar(await respuesta.json());
    guardarCache(clave, datos);
    return { datos, origen: "vivo" };
  } catch (error) {
    console.warn(`No se ha podido cargar ${nombre}:`, error);
    return { datos: ejemplo, origen: "ejemplo" };
  } finally {
    clearTimeout(temporizador);
  }
}

// Mercado global: caché de 10 minutos.
export function cargarMercado() {
  return cargarConCache({
    url: URL_MERCADO, clave: CLAVES.mercado, minutos: 10, ejemplo: MERCADO_EJEMPLO, nombre: "el mercado",
    limpiar: (json) => {
      const d = json && json.data;
      if (!d || num(d.total_market_cap?.usd) === null) throw new Error("La respuesta no trae el mercado");
      return {
        capitalizacion: num(d.total_market_cap.usd),
        volumen: num(d.total_volume?.usd),
        dominanciaBtc: num(d.market_cap_percentage?.btc),
        dominanciaEth: num(d.market_cap_percentage?.eth),
        variacion24h: num(d.market_cap_change_percentage_24h_usd),
      };
    },
  });
}

// Miedo y codicia de los últimos 30 días: caché de 1 hora.
// Devuelve una lista del más antiguo al más reciente: [{ valor, fecha, clasificacion }].
export function cargarMiedo() {
  return cargarConCache({
    url: URL_MIEDO, clave: CLAVES.miedo, minutos: 60, nombre: "el índice de miedo y codicia",
    ejemplo: MIEDO_EJEMPLO.map((d) => ({ ...d, clasificacion: clasificar(d.valor) })),
    limpiar: (json) => {
      const lista = (Array.isArray(json && json.data) ? json.data : [])
        .map((d) => ({ valor: Number(d.value), fecha: Number(d.timestamp) * 1000, clasificacion: d.value_classification }))
        .filter((d) => Number.isFinite(d.valor) && Number.isFinite(d.fecha))
        .map((d) => ({ ...d, clasificacion: traducir(d.clasificacion, d.valor) }))
        .sort((a, b) => a.fecha - b.fecha);
      if (!lista.length) throw new Error("La respuesta no trae el índice");
      return lista;
    },
  });
}
