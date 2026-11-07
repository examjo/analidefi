# analidefi

**Entiende un pool antes de entrar.**

analidefi es una herramienta educativa para explorar pools de liquidez (fondos compartidos donde se intercambian dos monedas y quienes aportan dinero cobran parte de las comisiones) y simular cuánto se podría ganar o perder. Usa datos públicos y gratuitos de internet. No se conecta a ninguna cartera, no mueve dinero y no pide registro.

Inspirada en Metrix Finance. Es una app original creada con ClonaKit: no es oficial ni contiene código, textos, imágenes ni marcas de otras apps. Más detalle en [LEGAL.md](LEGAL.md).

> **Herramienta educativa. No es asesoramiento financiero.** Las cifras son estimaciones: las rentabilidades pasadas no garantizan las futuras y el APY cambia cada día.

## Qué hace

- **Inicio**: resumen en vivo (capitalización del mercado, índice de miedo y codicia y número de pools cargados) y tres explicaciones sencillas.
- **Mercado**: capitalización total, volumen de 24 h, dominancia de BTC y ETH, variación de 24 h e índice de miedo y codicia con su gráfica de 30 días.
- **Explorar pools**: tabla (tarjetas en el móvil) con filtros por red, protocolo, TVL mínimo, solo stablecoins y búsqueda. Al empezar se ocultan los pools sin comisiones y se ordenan por APY por comisiones, de mayor a menor. Se puede ordenar por cualquier columna numérica y cargar de 25 en 25.
- **Simulador**: con los datos de un pool real o escritos a mano. Calcula comisiones, recompensas y pérdida por variación de precio, y dibuja la evolución día a día.
- **Historial**: las diez últimas simulaciones guardadas en tu navegador.
- **Glosario**: las palabras clave explicadas sin tecnicismos.
- Modo claro y oscuro, y se adapta al móvil (desde 320 px de ancho).

Las cantidades grandes usan la escala española: "250 mil $", "1,2 M $", "56.100 M $" (millones) y "2,57 billones $" (un billón es un millón de millones).

## Probarla en tu ordenador

Desde la carpeta raíz de ClonaKit:

```bash
npm run probar -- analidefi
```

Se abrirá en http://localhost:3000. Para pararla, pulsa `Ctrl + C` en la terminal.

## Publicarla en Vercel

Es una web estática (HTML, CSS y JavaScript, sin build ni dependencias):

1. Sube la carpeta `app/` a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com), pulsa **Add New → Project** e importa ese repositorio.
3. En **Framework Preset** elige **Other**. Deja vacíos el comando de build y la carpeta de salida.
4. Pulsa **Deploy**. Cada `git push` publicará una nueva versión.

### Al actualizar

Para que nadie vea archivos viejos guardados en su navegador, cada vez que publiques cambios sube el número de versión `?v=1` (a `?v=2`, `?v=3`…) **en todos los archivos a la vez**: `index.html`, `app.js` y los de `js/`. Lo más fácil es usar "Buscar y reemplazar en todos los archivos" de tu editor.

## Fuentes de datos

Todas son públicas, gratuitas y sin clave:

| Dato | Fuente | Dirección que usa la app |
| --- | --- | --- |
| Pools de liquidez | [DefiLlama](https://defillama.com/yields) | https://yields.llama.fi/pools |
| Mercado global | [CoinGecko](https://www.coingecko.com) | https://api.coingecko.com/api/v3/global |
| Miedo y codicia | [alternative.me](https://alternative.me/crypto/fear-and-greed-index/) | https://api.alternative.me/fng/?limit=30 |

Los datos se guardan un rato en el navegador (pools 30 minutos, mercado 10 minutos, miedo y codicia 1 hora). Si una fuente falla o no hay conexión, la app muestra datos de ejemplo inventados y lo avisa.

## Qué guarda en tu navegador

Solo en tu navegador (`localStorage`) y nunca se envía a ningún sitio: el tema elegido, los filtros de Explorar, los últimos valores del simulador, el pool elegido, el historial y la copia temporal de los datos. Si tu navegador no deja guardar (por ejemplo, en algunos modos privados), la app funciona igual, pero sin recordar nada.
