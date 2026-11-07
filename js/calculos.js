// Cálculos del simulador (sin nada de pantalla, para que se entiendan y se puedan comprobar).

// Pérdida por variación de precio (pérdida impermanente).
// variacion en % (100 = una moneda dobla su precio frente a la otra).
// Devuelve una fracción negativa o 0 (por ejemplo -0,0572 = -5,72 %).
export function perdidaPorVariacion(variacion) {
  const r = 1 + variacion / 100;
  return Math.min(0, (2 * Math.sqrt(r)) / (1 + r) - 1);
}

// d = { modo, capital, dias, variacion, tvl, volumen, comision, apyBase, apyReward }
export function calcular(d) {
  let parte = null; // tu parte del pool (solo en modo manual)
  let comDiarias, recDiarias;

  if (d.modo === "manual") {
    parte = d.capital / (d.tvl + d.capital);
    comDiarias = d.volumen * (d.comision / 100) * parte;
    recDiarias = 0;
  } else {
    comDiarias = (d.capital * d.apyBase) / 100 / 365;
    recDiarias = (d.capital * (d.apyReward || 0)) / 100 / 365;
  }

  const apyCom = ((comDiarias * 365) / d.capital) * 100;
  const apyRec = ((recDiarias * 365) / d.capital) * 100;
  const ganCom = comDiarias * d.dias;
  const ganRec = recDiarias * d.dias;
  const perdida = perdidaPorVariacion(d.variacion);
  const perdidaUsd = d.capital * perdida;
  const neto = ganCom + ganRec + perdidaUsd;

  // Evolución día a día: la variación de precio se reparte en línea recta entre los días.
  const serie = [];
  for (let dia = 0; dia <= d.dias; dia++) {
    const variacionDia = (d.variacion * dia) / d.dias;
    serie.push((comDiarias + recDiarias) * dia + d.capital * perdidaPorVariacion(variacionDia));
  }

  return { parte, comDiarias, recDiarias, apyCom, apyRec, ganCom, ganRec, perdida, perdidaUsd, neto, netoPct: (neto / d.capital) * 100, serie };
}
