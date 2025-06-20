import type {
  BondInput,
  FlowRow,
  BondConstants,
  BondMetrics,
  BondCalculationResult,
} from "@/lib/types/bond-calculations"
import { CalculationLogger } from "./calculation-logger.service"

/* ---------- helpers ---------- */

const pct = (p: number) => p / 100

function tasaPeriodica({ tipoTasa, tasaInteres, frecuenciaCupon }: BondInput) {
  const r = pct(tasaInteres)
  const result = tipoTasa === "Nominal" ? r / frecuenciaCupon : Math.pow(1 + r, 1 / frecuenciaCupon) - 1

  CalculationLogger.addStep({
    step: "Cálculo de Tasa Periódica",
    description: "Convertir la tasa anual a tasa por período según el tipo de tasa",
    formula: tipoTasa === "Nominal" ? "i = TNA / m" : "i = (1 + TEA)^(1/m) - 1",
    inputs: {
      tipoTasa,
      tasaInteres: `${tasaInteres}%`,
      frecuenciaCupon,
      tasaDecimal: r,
    },
    calculation:
      tipoTasa === "Nominal"
        ? `${r} / ${frecuenciaCupon} = ${result}`
        : `(1 + ${r})^(1/${frecuenciaCupon}) - 1 = ${result}`,
    result: `${(result * 100).toFixed(6)}% por período`,
  })

  return result
}

// Nueva función para calcular días según frecuencia
function calcularDiasPorPeriodo(frecuenciaCupon: number): number {
  // Fórmula exacta del Excel
  const dias =
    frecuenciaCupon === 12
      ? 30
      : // Mensual
        frecuenciaCupon === 6
        ? 60
        : // Bimestral
          frecuenciaCupon === 4
          ? 90
          : // Trimestral
            frecuenciaCupon === 3
            ? 120
            : // Cuatrimestral
              frecuenciaCupon === 2
              ? 180
              : // Semestral
                360 // Anual

  CalculationLogger.addStep({
    step: "Cálculo de Días por Período",
    description: "Determinar días por período según la frecuencia del cupón",
    formula:
      "SI(Frecuencia=12;30;SI(Frecuencia=6;60;SI(Frecuencia=4;90;SI(Frecuencia=3;120;SI(Frecuencia=2;180;360)))))",
    inputs: {
      frecuenciaCupon,
    },
    calculation: `Frecuencia ${frecuenciaCupon} → ${dias} días`,
    result: `${dias} días por período`,
  })

  return dias
}

// Nueva función para obtener el nombre de la tasa efectiva por período
function obtenerNombreTasaEfectiva(frecuenciaCupon: number): string {
  const nombres = {
    12: "TEM", // Tasa Efectiva Mensual
    6: "TEB", // Tasa Efectiva Bimestral
    4: "TET", // Tasa Efectiva Trimestral
    3: "TEC", // Tasa Efectiva Cuatrimestral
    2: "TES", // Tasa Efectiva Semestral
    1: "TEA", // Tasa Efectiva Anual
  }
  return nombres[frecuenciaCupon as keyof typeof nombres] || "TEP"
}

/* ---------- función principal ---------- */

export function buildBondTable(input: BondInput): FlowRow[] {
  const m = input.frecuenciaCupon
  const N = input.nAnios * m
  const Ng = input.plazoGraciaAnio * m
  const i = tasaPeriodica(input)

  // Calcular días por período según frecuencia
  const diasPorPeriodo = calcularDiasPorPeriodo(m)

  // Cupón corregido con la fórmula de días
  const cupón = input.valorNominal * i * (diasPorPeriodo / input.diasPorAnio)

  CalculationLogger.addStep({
    step: "Cálculo de Constantes Básicas",
    description: "Determinar los parámetros fundamentales del cronograma",
    formula: "N = nAnios × m, Ng = plazoGraciaAnio × m, Cupón = ValorNominal × i × (diasPorPeriodo / diasPorAnio)",
    inputs: {
      nAnios: input.nAnios,
      frecuenciaCupon: m,
      plazoGraciaAnio: input.plazoGraciaAnio,
      valorNominal: input.valorNominal,
      tasaPeriodica: i,
      diasPorPeriodo,
      diasPorAnio: input.diasPorAnio,
    },
    calculation: `N = ${input.nAnios} × ${m} = ${N}, Ng = ${input.plazoGraciaAnio} × ${m} = ${Ng}, Cupón = ${input.valorNominal} × ${i} × (${diasPorPeriodo}/${input.diasPorAnio}) = ${cupón}`,
    result: {
      totalPeriodos: N,
      periodosGracia: Ng,
      diasPorPeriodo,
      cuponPorPeriodo: cupón,
    },
    dependencies: ["Cálculo de Tasa Periódica", "Cálculo de Días por Período"],
  })

  // costes
  const cEstruct = input.valorNominal * pct(input.pctEstruct)
  const cColoc = input.valorNominal * pct(input.pctColoc)
  const cCavali = input.valorNominal * pct(input.pctCavali)
  const costEmi = cEstruct + cColoc
  const costBon = cCavali

  CalculationLogger.addStep({
    step: "Cálculo de Costes Iniciales",
    description: "Calcular los costes de estructuración, colocación y CAVALI",
    formula: "Coste = ValorNominal × (% / 100)",
    inputs: {
      valorNominal: input.valorNominal,
      pctEstruct: `${input.pctEstruct}%`,
      pctColoc: `${input.pctColoc}%`,
      pctCavali: `${input.pctCavali}%`,
    },
    calculation: `Estructuración = ${input.valorNominal} × ${pct(input.pctEstruct)} = ${cEstruct}, Colocación = ${input.valorNominal} × ${pct(input.pctColoc)} = ${cColoc}, CAVALI = ${input.valorNominal} × ${pct(input.pctCavali)} = ${cCavali}`,
    result: {
      costeEstructuracion: cEstruct,
      costeColocacion: cColoc,
      costeCavali: cCavali,
      totalCosteEmisor: costEmi,
      totalCosteBonista: costBon,
    },
  })

  // descuento
  const kdDec = input.kd !== undefined ? pct(input.kd) : 0

  CalculationLogger.addStep({
    step: "Tasa de Descuento",
    description: "Convertir la tasa de descuento kd a decimal",
    formula: "kd_decimal = kd / 100",
    inputs: {
      kd: input.kd || 0,
    },
    calculation: `${input.kd || 0} / 100 = ${kdDec}`,
    result: kdDec,
  })

  const rows: FlowRow[] = []
  let saldo = input.valorNominal

  CalculationLogger.addStep({
    step: "Inicio del Cronograma",
    description: "Comenzar la generación del cronograma período por período",
    formula: "Iteración desde n=0 hasta n=N",
    inputs: {
      periodoInicial: 0,
      periodoFinal: N,
      saldoInicial: saldo,
    },
    calculation: `Generando ${N + 1} períodos (0 a ${N})`,
    result: "Cronograma iniciado",
  })

  for (let n = 0; n <= N; n++) {
    /* --- columna: plazo de gracia --- */
    let flag: "" | "P" | "T" | "S" = ""
    if (n > 0) {
      if (n <= Ng) flag = input.tipoGracia === "Parcial" ? "P" : input.tipoGracia === "Total" ? "T" : "S"
      else flag = "S"
    }

    /* --- cupón y amortización --- */
    const amort = 0
    let cup = 0
    if (n === 0) {
      cup = 0
    } else {
      if (input.tipoGracia === "Total" && n <= Ng) {
        cup = 0
      } else {
        cup = -cupón // Usar el cupón corregido
      }
    }
    const cuota = cup + amort

    /* --- flujos --- */
    const flujoE = n === 0 ? input.valorNominal - costEmi - costBon : cuota
    const flujoB = -flujoE

    /* --- descuento y factores --- */
    const pv = flujoB / Math.pow(1 + kdDec, n)
    const faPlazo = pv * n
    const factorConv = pv * n * (n + 1)

    // Log detallado para los primeros 3 períodos y el último
    if (n <= 2 || n === N) {
      CalculationLogger.addStep({
        step: `Período ${n}`,
        description: `Cálculo completo del período ${n}`,
        formula: "Flujo Emisor, Flujo Bonista, Valor Presente, Factores",
        inputs: {
          periodo: n,
          tipoGracia: input.tipoGracia,
          periodosGracia: Ng,
          saldo,
          cuponCorregido: cupón,
          kdDecimal: kdDec,
        },
        calculation:
          n === 0
            ? `FlujoE = ${input.valorNominal} - ${costEmi} - ${costBon} = ${flujoE}, FlujoB = -${flujoE} = ${flujoB}, PV = ${flujoB} / (1 + ${kdDec})^${n} = ${pv}`
            : `Cupón = ${cup} (${cupón} con ajuste de días), FlujoE = ${cuota}, FlujoB = ${flujoB}, PV = ${flujoB} / (1 + ${kdDec})^${n} = ${pv}, FA×Plazo = ${pv} × ${n} = ${faPlazo}`,
        result: {
          plazoGracia: flag,
          cuponInteres: cup,
          flujoEmisor: flujoE,
          flujoBonista: flujoB,
          flujoActualizado: pv,
          faXPlazo: faPlazo,
          factorConvexidad: factorConv,
        },
        dependencies: ["Cálculo de Constantes Básicas", "Cálculo de Costes Iniciales", "Tasa de Descuento"],
      })
    }

    rows.push({
      n,
      plazoGracia: flag,
      bono: saldo,
      bonoIndexado: saldo,
      cuponInteres: cup,
      cuota,
      amort,
      flujoEmisor: flujoE,
      flujoBonista: flujoB,
      flujoAct: pv,
      faXPlazo: faPlazo,
      factorConv,
    })

    saldo -= amort
  }

  CalculationLogger.addStep({
    step: "Cronograma Completado",
    description: "Finalización de la generación del cronograma",
    formula: "Resumen de totales",
    inputs: {
      totalPeriodos: rows.length,
      sumaFlujosBonista: rows.reduce((s, r) => s + r.flujoBonista, 0),
      sumaFlujosActualizados: rows.reduce((s, r) => s + r.flujoAct, 0),
    },
    calculation: `${rows.length} períodos generados`,
    result: "Cronograma completo",
  })

  return rows
}

/* ---------- Constantes derivadas ---------- */

export function calculateConstants(input: BondInput): BondConstants {
  const pctEstruct = pct(input.pctEstruct)
  const pctColoc = pct(input.pctColoc)
  const pctCavali = pct(input.pctCavali)
  const tasaDecimal = pct(input.tasaInteres)

  const m = input.frecuenciaCupon
  const nPeriodosPorAnio = m
  const N = input.nAnios * m
  const Ng = input.plazoGraciaAnio * m

  // TEA (Tasa Efectiva Anual)
  let tea: number
  if (input.tipoTasa === "Nominal") {
    const tna = tasaDecimal
    tea = Math.pow(1 + tna / m, m) - 1
  } else {
    tea = tasaDecimal
  }

  // Tasa Efectiva por Período (TEM, TET, TES, etc.)
  const tasaEfectivaPeriodo = Math.pow(1 + tea, 1 / m) - 1
  const nombreTasaPeriodo = obtenerNombreTasaEfectiva(m)

  // TEM siempre (para comparación)
  const tem = Math.pow(1 + tea, 1 / 12) - 1

  // Tasa periódica (i)
  const tasaPeriodicaCalc = tasaPeriodica(input)

  // Costes iniciales
  const costesInicialesEmisor = input.valorNominal * (pctEstruct + pctColoc)
  const costesInicialesBonista = input.valorNominal * pctCavali

  CalculationLogger.addStep({
    step: "Constantes Derivadas Finales",
    description: "Cálculo de todas las constantes derivadas del bono",
    formula: `TEA, ${nombreTasaPeriodo}, TEM, Costes, etc.`,
    inputs: {
      tipoTasa: input.tipoTasa,
      tasaInteres: input.tasaInteres,
      frecuencia: m,
      nombreTasaPeriodo,
    },
    calculation:
      input.tipoTasa === "Nominal"
        ? `TEA = (1 + ${tasaDecimal}/${m})^${m} - 1 = ${tea}, ${nombreTasaPeriodo} = (1 + ${tea})^(1/${m}) - 1 = ${tasaEfectivaPeriodo}`
        : `TEA = ${tea} (ya efectiva), ${nombreTasaPeriodo} = (1 + ${tea})^(1/${m}) - 1 = ${tasaEfectivaPeriodo}`,
    result: {
      TEA: tea,
      [nombreTasaPeriodo]: tasaEfectivaPeriodo,
      TEM: tem,
      tasaPeriodica: tasaPeriodicaCalc,
      costesEmisor: costesInicialesEmisor,
      costesBonista: costesInicialesBonista,
    },
  })

  return {
    frecuenciaCupon: m,
    nPeriodosPorAnio,
    nTotalPeriodos: N,
    nPeriodosGracia: Ng,
    tasaEfectivaAnual: tea,
    tasaEfectivaMensual: tem,
    tasaEfectivaPeriodo, // Nueva propiedad
    nombreTasaPeriodo, // Nueva propiedad
    tasaPeriodica: tasaPeriodicaCalc,
    costesInicialesEmisor,
    costesInicialesBonista,
  }
}

/* ---------- TIR ---------- */

function irr(cashFlows: number[], guess = 0.1, maxIterations = 100, tolerance = 1e-10): number {
  let rate = guess

  CalculationLogger.addStep({
    step: "Cálculo de TIR (Inicio)",
    description: "Iniciar cálculo de Tasa Interna de Retorno usando Newton-Raphson",
    formula: "NPV = Σ(CF_t / (1+r)^t) = 0",
    inputs: {
      flujosCaja: cashFlows,
      estimacionInicial: guess,
      maxIteraciones: maxIterations,
      tolerancia: tolerance,
    },
    calculation: `Iteración Newton-Raphson con ${cashFlows.length} flujos`,
    result: "TIR iniciado",
  })

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let dnpv = 0

    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t)
      npv += cashFlows[t] / factor
      if (t > 0) {
        dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1)
      }
    }

    if (Math.abs(npv) < tolerance) break
    if (Math.abs(dnpv) < 1e-15) break

    const newRate = rate - npv / dnpv
    if (Math.abs(newRate - rate) < tolerance) break

    rate = newRate
  }

  CalculationLogger.addStep({
    step: "TIR Calculada",
    description: "Resultado final del cálculo de TIR",
    formula: "Tasa que hace NPV = 0",
    inputs: {
      tasaFinal: rate,
    },
    calculation: `Convergencia alcanzada en iteraciones`,
    result: `${(rate * 100).toFixed(6)}% anual`,
    dependencies: ["Cronograma Completado"],
  })

  return rate
}

/* ---------- Métricas ---------- */

export function calculateMetrics(input: BondInput, rows: FlowRow[]): BondMetrics {
  const kdDec = input.kd ? pct(input.kd) : 0

  const precio = rows.slice(1).reduce((s, r) => s + r.flujoAct, 0)
  CalculationLogger.addStep({
    step: "Precio Actual",
    description: "Suma de todos los flujos actualizados (excepto período 0)",
    formula: "P = Σ(PV_n) para n=1 a N",
    inputs: {
      flujosPeriodos1aN: rows.slice(1).map((r) => r.flujoAct),
    },
    calculation: `Suma de ${rows.length - 1} flujos actualizados`,
    result: precio,
    dependencies: ["Cronograma Completado"],
  })

  const utilidad = precio + rows[0].flujoBonista
  CalculationLogger.addStep({
    step: "Utilidad",
    description: "Precio actual más el flujo inicial del bonista",
    formula: "Utilidad = Precio + Flujo_Bonista_0",
    inputs: {
      precio,
      flujoInicialBonista: rows[0].flujoBonista,
    },
    calculation: `${precio} + (${rows[0].flujoBonista}) = ${utilidad}`,
    result: utilidad,
    dependencies: ["Precio Actual"],
  })

  const sumFaPlazo = rows.reduce((s, r) => s + r.faXPlazo, 0)
  const dur = sumFaPlazo / precio
  CalculationLogger.addStep({
    step: "Duración de Macaulay",
    description: "Suma de FA×Plazo dividido por el precio",
    formula: "D = Σ(PV_n × n) / P",
    inputs: {
      sumaFaXPlazo: sumFaPlazo,
      precio,
    },
    calculation: `${sumFaPlazo} / ${precio} = ${dur}`,
    result: `${dur.toFixed(4)} años`,
    dependencies: ["Precio Actual"],
  })

  const sumFactorConv = rows.reduce((s, r) => s + r.factorConv, 0)
  const conv = sumFactorConv / precio
  CalculationLogger.addStep({
    step: "Convexidad",
    description: "Suma de factores de convexidad dividido por el precio",
    formula: "CV = Σ(PV_n × n × (n+1)) / P",
    inputs: {
      sumaFactorConv: sumFactorConv,
      precio,
    },
    calculation: `${sumFactorConv} / ${precio} = ${conv}`,
    result: conv,
    dependencies: ["Precio Actual"],
  })

  const total = dur + conv
  const durMod = kdDec > 0 ? dur / (1 + kdDec) : dur

  CalculationLogger.addStep({
    step: "Duración Modificada",
    description: "Duración ajustada por la tasa de descuento",
    formula: "D_mod = D / (1 + kd)",
    inputs: {
      duracion: dur,
      kd: kdDec,
    },
    calculation: kdDec > 0 ? `${dur} / (1 + ${kdDec}) = ${durMod}` : `${dur} (kd = 0)`,
    result: durMod,
    dependencies: ["Duración de Macaulay"],
  })

  const tcea = irr(rows.map((r) => r.flujoEmisor))
  const trea = irr(rows.map((r) => r.flujoBonista))

  const finalMetrics = {
    precioActual: precio,
    utilidad,
    duracion: dur,
    convexidad: conv,
    total,
    duracionModif: durMod,
    tceaEmisor: tcea,
    treaBonista: trea,
  }

  CalculationLogger.addStep({
    step: "Métricas Finales",
    description: "Resumen de todas las métricas calculadas",
    formula: "Compilación de resultados",
    inputs: finalMetrics,
    calculation: "Todas las métricas calculadas",
    result: finalMetrics,
    dependencies: ["Precio Actual", "Utilidad", "Duración de Macaulay", "Convexidad", "TIR Calculada"],
  })

  return finalMetrics
}

// Función principal que calcula todo
export function calculateBond(input: BondInput, bondName = "Bono"): BondCalculationResult {
  CalculationLogger.startLogging(bondName, input)

  const constants = calculateConstants(input)
  const schedule = buildBondTable(input)
  const metrics = calculateMetrics(input, schedule)

  CalculationLogger.finishLogging(constants, schedule, metrics)

  return {
    input,
    constants,
    schedule,
    metrics,
  }
}
