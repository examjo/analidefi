// Ayudantes para crear y cambiar elementos del HTML desde JavaScript.

// Convierte una lista de "hijos" en nodos: aplana listas dentro de listas,
// descarta null/false/undefined y convierte textos y números en nodos de texto.
function aNodos(hijos) {
  return hijos
    .flat(Infinity)
    .filter((x) => x !== null && x !== undefined && x !== false && x !== true)
    .map((x) => (x instanceof Node ? x : document.createTextNode(String(x))));
}

// h("button", { class: "boton", onclick: fn }, "Texto") crea <button class="boton">Texto</button>.
export function h(etiqueta, atributos = {}, ...hijos) {
  const el = document.createElement(etiqueta);
  for (const [nombre, valor] of Object.entries(atributos || {})) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (nombre.startsWith("on")) el.addEventListener(nombre.slice(2), valor);
    else el.setAttribute(nombre, valor === true ? "" : valor);
  }
  el.append(...aNodos(hijos));
  return el;
}

// Igual que h() pero para dibujos SVG (necesitan createElementNS).
export function s(etiqueta, atributos = {}, ...hijos) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", etiqueta);
  for (const [nombre, valor] of Object.entries(atributos)) el.setAttribute(nombre, valor);
  el.append(...aNodos(hijos));
  return el;
}

// Sustituye todo el contenido de un elemento (versión segura de replaceChildren).
export function reemplazar(el, ...hijos) {
  el.replaceChildren(...aNodos(hijos));
}
