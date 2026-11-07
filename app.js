// Arranque de analidefi: tema claro/oscuro, menú, navegación por hash y carga de datos.
import { guardar, CLAVES } from "./js/almacen.js?v=1";
import { cambiarEstado } from "./js/estado.js?v=1";
import { cargarPools, cargarMercado, cargarMiedo } from "./js/datos.js?v=1";
import { montarPools } from "./js/vistas/pools.js?v=1";
import { montarSimulador } from "./js/vistas/simulador.js?v=1";
import { montarHistorial } from "./js/vistas/historial.js?v=1";
import { montarInicio } from "./js/vistas/inicio.js?v=1";
import { montarMercado } from "./js/vistas/mercado.js?v=1";
import { montarGlosario } from "./js/vistas/glosario.js?v=1";

const $ = (id) => document.getElementById(id);

// Tabla de rutas: cada hash (#pools…) tiene un título y una función que pinta la pantalla.
const RUTAS = {
  inicio: { titulo: "Inicio", montar: montarInicio },
  mercado: { titulo: "Mercado", montar: montarMercado },
  pools: { titulo: "Explorar pools", montar: montarPools },
  simulador: { titulo: "Simulador", montar: montarSimulador },
  historial: { titulo: "Historial", montar: montarHistorial },
  glosario: { titulo: "Glosario", montar: montarGlosario },
};
// Si la dirección no trae hash (o trae uno desconocido), se abre Inicio.
const RUTA_POR_DEFECTO = "inicio";

// --- Menú ---
const menu = $("menu");
const botonMenu = $("boton-menu");

function abrirMenu(abrir) {
  menu.classList.toggle("abierto", abrir);
  botonMenu.setAttribute("aria-expanded", String(abrir));
}
botonMenu.addEventListener("click", () => abrirMenu(!menu.classList.contains("abierto")));
// Al elegir una sección (aunque sea la actual), se cierra el menú.
menu.addEventListener("click", (e) => {
  if (e.target.closest("a")) abrirMenu(false);
});
// Clic fuera: cierra el menú sin bloquear ese clic (no usamos preventDefault).
document.addEventListener("click", (e) => {
  if (menu.classList.contains("abierto") && !menu.contains(e.target) && !botonMenu.contains(e.target)) abrirMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu.classList.contains("abierto")) {
    abrirMenu(false);
    botonMenu.focus();
  }
});

// --- Navegación por hash ---
let desmontar = null; // función para "limpiar" la pantalla anterior
let primeraVez = true;

function irARuta() {
  let nombre = location.hash.slice(1);
  if (!RUTAS[nombre]) {
    nombre = RUTA_POR_DEFECTO;
    history.replaceState(null, "", "#" + nombre);
  }
  if (typeof desmontar === "function") desmontar();
  const contenido = $("contenido");
  desmontar = RUTAS[nombre].montar(contenido);

  menu.querySelectorAll("a").forEach((a) => {
    if (a.dataset.ruta === nombre) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.title = `${RUTAS[nombre].titulo} · analidefi`;
  abrirMenu(false);

  // Al cambiar de pantalla, subimos arriba y llevamos el foco al título (ayuda a lectores de pantalla).
  if (!primeraVez) {
    window.scrollTo(0, 0);
    contenido.querySelector("h1")?.focus();
  }
  primeraVez = false;
}
window.addEventListener("hashchange", irARuta);

// --- Tema claro / oscuro ---
const botonTema = $("boton-tema");
const sistemaOscuro = matchMedia("(prefers-color-scheme: dark)");
const temaActual = () => document.documentElement.dataset.theme || (sistemaOscuro.matches ? "dark" : "light");

function pintarBotonTema() {
  const texto = temaActual() === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  botonTema.setAttribute("aria-label", texto);
  botonTema.title = texto;
}
botonTema.addEventListener("click", () => {
  const nuevo = temaActual() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nuevo;
  guardar(CLAVES.tema, nuevo);
  pintarBotonTema();
});
sistemaOscuro.addEventListener("change", pintarBotonTema);

// --- Datos ---
// Las tres descargas van a la vez; cada una avisa al terminar (las pantallas se repintan solas).
async function iniciarPools() {
  cambiarEstado({ cargandoPools: true });
  const { pools, origen } = await cargarPools();
  cambiarEstado({ cargandoPools: false, pools, origenPools: origen });
}
async function iniciarMercado() {
  cambiarEstado({ cargandoMercado: true });
  const { datos, origen } = await cargarMercado();
  cambiarEstado({ cargandoMercado: false, mercado: datos, origenMercado: origen });
}
async function iniciarMiedo() {
  cambiarEstado({ cargandoMiedo: true });
  const { datos, origen } = await cargarMiedo();
  cambiarEstado({ cargandoMiedo: false, miedo: datos, origenMiedo: origen });
}
function iniciarDatos() {
  iniciarPools();
  iniciarMercado();
  iniciarMiedo();
}

pintarBotonTema();
irARuta();
iniciarDatos();
