// Corte de cifras de la vista Analítica del Rayos X (solo lectura).
// Replica app/(dashboard)/analytics/page.tsx + components/analytics/MapeoMercado.tsx
// usando los MISMOS módulos del repo. Entrada: exportes JSON de D1 (wrangler).
import { readFileSync, writeFileSync } from "node:fs";
import { getTableColumns } from "drizzle-orm";
import * as esquema from "@/lib/db/schema";
import { filaDeBaseAApp } from "@/lib/db/dinero-filas";
import { computeDiagnosticMetrics } from "@/lib/rayosx/calculations";
import { rowToMetricInputs } from "@/lib/rayosx/mappers";
import {
  activacionRubros,
  conversionPorNivel,
  hallazgosCartera,
  NIVELES_CARTERA,
  type ColegioCartera,
} from "@/lib/rayosx/cartera";
import { calcLlenadoPorBloque, type FilaLlenado } from "@/lib/rayosx/llenado";
import type { RayosXDiagnosticRow } from "@/lib/types/database";

const DIR = process.argv[2];
const leer = (f: string) => JSON.parse(readFileSync(`${DIR}/${f}`, "utf8"))[0].results as Record<string, unknown>[];
const crudas = leer("diags.json");
const inst = new Map(leer("inst.json").map((i) => [i.id as string, i]));
const comp = new Map(leer("comp.json").map((c) => [c.diagnostic_id as string, Number(c.total)]));

// fila SQL → fila Drizzle (propiedades camelCase), como la devuelve db.select()
const cols = Object.entries(getTableColumns(esquema.rayosxDiagnostics)).map(
  ([prop, c]) => [prop, (c as { name: string }).name] as const,
);
const aDrizzle = (r: Record<string, unknown>) => {
  const o: Record<string, unknown> = {};
  for (const [prop, sql] of cols) if (sql in r) o[prop] = r[sql];
  return o;
};
const todos = crudas.map((r) => filaDeBaseAApp<RayosXDiagnosticRow>(esquema.rayosxDiagnostics, aDrizzle(r) as never));
const rows = todos
  .filter((r) => r.status === "submitted")
  .sort((a, b) => String(a.submitted_at ?? "").localeCompare(String(b.submitted_at ?? "")));

function average(values: (number | null | undefined)[]) {
  const c = values.filter((v): v is number => v != null && !Number.isNaN(v));
  return c.length ? { valor: c.reduce((a, b) => a + b, 0) / c.length, n: c.length } : null;
}
function mediana(values: (number | null | undefined)[]) {
  const c = values.filter((v): v is number => v != null && Number.isFinite(v)).sort((a, b) => a - b);
  if (!c.length) return null;
  const m = Math.floor(c.length / 2);
  return { valor: c.length % 2 ? c[m] : (c[m - 1] + c[m]) / 2, n: c.length };
}

// Tarjetas superiores (page.tsx)
const tarjetas = {
  finalizados: rows.length,
  conversionCitaAlumno: average(rows.map((r) => r.tasa_conversion_cita_alumno)),
  ltvPromedio: average(rows.map((r) => r.ltv)),
  roiPublicidad: average(rows.map((r) => r.roi_publicidad)),
};

// Mapeo del mercado (page.tsx colegiosMapeo, sin ciudad: no se publica)
const RUBROS: [string, string][] = [
  ["uniformeEscolar", "monetizacion_uniforme_escolar"],
  ["uniformeDeportes", "monetizacion_uniforme_deportes"],
  ["libros", "monetizacion_libros"],
  ["utiles", "monetizacion_utiles"],
  ["asesorias", "monetizacion_asesorias_extra"],
  ["transporte", "monetizacion_transporte"],
  ["cafeteria", "monetizacion_cafeteria"],
  ["eventosPinatas", "monetizacion_eventos_pinatas"],
  ["graduaciones", "monetizacion_eventos_graduaciones"],
  ["viajes", "monetizacion_viajes"],
];
const colegios: (ColegioCartera & { submitted: string | null; inst: string })[] = todos.map((r) => {
  const m = computeDiagnosticMetrics(rowToMetricInputs(r, []));
  const rubros: Record<string, number> = {};
  for (const [k, col] of RUBROS) {
    const v = (r as unknown as Record<string, number | null>)[col];
    if (v != null) rubros[k] = v > 0 ? 1 : 0;
  }
  return {
    id: r.id,
    inst: r.institution_id,
    submitted: (r.submitted_at as string | null) ?? null,
    finalizado: r.status === "submitted",
    oferta: (r.oferta_academica as string[] | null) ?? [],
    ciudad: (inst.get(r.institution_id)?.ciudad as string | null) ?? null,
    moneda: r.moneda as "mxn" | "usd",
    matricula: r.matricula_actual,
    capacidad: r.capacidad_instalada,
    uso: m.usoCapacidad,
    colegiaturaEfectiva: m.colegiaturaEfectiva,
    conversionReal: m.conversionForzada,
    cierreCita: r.tasa_conversion_cita_alumno,
    ltv: m.ltv,
    caa: m.caa,
    permanenciaMeses: r.meses_promedio_retencion,
    leadsDia: r.leads_al_dia,
    oportunidadAnual: m.oportunidadCapacidadAnual,
    herramientas: (r.proceso_admision_herramientas as string[] | null) ?? [],
    rubros,
  };
});
const fin = colegios.filter((c) => c.finalizado);
const pesos = fin.filter((c) => c.moneda === "mxn");
const promedios = {
  matricula: average(fin.map((c) => c.matricula)),
  capacidad: average(fin.map((c) => c.capacidad)),
  ocupacion: average(fin.map((c) => c.uso)),
  colegiaturaEfectivaMxn: average(pesos.map((c) => c.colegiaturaEfectiva)),
  ltvMxn: average(pesos.map((c) => c.ltv)),
  conversionReal: average(fin.map((c) => c.conversionReal)),
  cierreCita: average(fin.map((c) => c.cierreCita)),
  costoPorAlumnoMxn: average(pesos.map((c) => c.caa)),
  permanenciaMeses: average(fin.map((c) => c.permanenciaMeses)),
  prospectosAlDia: average(fin.map((c) => c.leadsDia)),
};
const medianas = {
  ocupacion: mediana(fin.map((c) => c.uso)),
  conversionReal: mediana(fin.map((c) => c.conversionReal)),
  cierreCita: mediana(fin.map((c) => c.cierreCita)),
  prospectosAlDia: mediana(fin.map((c) => c.leadsDia)),
  colegiaturaEfectivaMxn: mediana(pesos.map((c) => c.colegiaturaEfectiva)),
  costoPorAlumnoMxn: mediana(pesos.map((c) => c.caa)),
  matricula: mediana(fin.map((c) => c.matricula)),
};

// Distribuciones (mismas métricas, cortes propios del estudio)
const tramos = (vals: (number | null)[], cortes: number[], etiquetas: string[]) => {
  const v = vals.filter((x): x is number => x != null && Number.isFinite(x));
  const out = etiquetas.map((e) => ({ tramo: e, n: 0 }));
  for (const x of v) {
    let i = cortes.findIndex((c) => x < c);
    if (i === -1) i = cortes.length;
    out[i].n++;
  }
  return { base: v.length, tramos: out };
};
const distribuciones = {
  conversionReal: tramos(fin.map((c) => c.conversionReal), [0.02, 0.05, 0.1, 0.2], ["<2%", "2–5%", "5–10%", "10–20%", "≥20%"]),
  ocupacion: tramos(fin.map((c) => c.uso), [0.6, 0.8, 0.95], ["<60%", "60–80%", "80–95%", "≥95%"]),
  cierreCita: tramos(fin.map((c) => c.cierreCita), [0.2, 0.4, 0.6, 0.8], ["<20%", "20–40%", "40–60%", "60–80%", "≥80%"]),
};

// Herramientas de admisión declaradas (finalizados)
const herramientas: Record<string, number> = {};
let conHerr = 0;
for (const c of fin) {
  if (!c.herramientas.length) continue;
  conHerr++;
  for (const h of new Set(c.herramientas)) herramientas[h] = (herramientas[h] ?? 0) + 1;
}

// Por mes de finalización
const porMes: Record<string, number> = {};
for (const c of fin) {
  const k = (c.submitted ?? "").slice(0, 7) || "sin_fecha";
  porMes[k] = (porMes[k] ?? 0) + 1;
}

const salida = {
  corte_utc: new Date().toISOString(),
  base: {
    no_archivados: todos.length,
    finalizados: fin.length,
    borradores: todos.length - fin.length,
    instituciones_finalizadas: new Set(fin.map((c) => c.inst)).size,
    periodo: { desde: rows[0]?.submitted_at, hasta: rows.at(-1)?.submitted_at },
    moneda_mxn: pesos.length,
  },
  tarjetas,
  promedios,
  medianas,
  distribuciones,
  conversionPorNivel: conversionPorNivel(fin),
  conteoPorNivel: NIVELES_CARTERA.map((n) => ({ nivel: n.etiqueta, n: fin.filter((c) => c.oferta.some((o) => n.incluye.includes(o))).length })),
  rubros: activacionRubros(fin),
  hallazgosCartera: hallazgosCartera(fin),
  herramientas: { base: conHerr, conteo: herramientas },
  llenadoPorBloque: calcLlenadoPorBloque(todos as unknown as FilaLlenado[], comp),
  porMes,
};
writeFileSync(`${DIR}/corte.json`, JSON.stringify(salida, null, 2));
console.log(JSON.stringify(salida, null, 2));

// Extras para el estudio (mismas métricas por diagnóstico)
const implicitaCita = fin
  .map((c) => (c.conversionReal != null && c.cierreCita != null && c.cierreCita > 0 ? Math.min(1, c.conversionReal / c.cierreCita) : null));
const extras = {
  prospectoACitaImplicita: { promedio: average(implicitaCita), mediana: mediana(implicitaCita) },
  oportunidadAnualMxn: { mediana: mediana(pesos.map((c) => c.oportunidadAnual)), promedio: average(pesos.map((c) => c.oportunidadAnual)) },
  lugaresVacios: mediana(fin.map((c) => (c.capacidad != null && c.matricula != null ? Math.max(0, c.capacidad - c.matricula) : null))),
  conversionMedianaCrm: {
    con: mediana(fin.filter((c) => c.herramientas.length && c.herramientas.some((h) => ["crm_generico", "crm_educativo", "erp"].includes(h))).map((c) => c.conversionReal)),
    sin: mediana(fin.filter((c) => c.herramientas.length && !c.herramientas.some((h) => ["crm_generico", "crm_educativo", "erp"].includes(h))).map((c) => c.conversionReal)),
  },
  soloWhatsappOExcel: fin.filter((c) => c.herramientas.length && c.herramientas.every((h) => ["whatsapp", "messenger", "excel"].includes(h))).length,
  porMes,
};
writeFileSync(`${DIR}/corte-extras.json`, JSON.stringify(extras, null, 2));
console.error("EXTRAS", JSON.stringify(extras, null, 1));
const OTROS = ["crm_educativo","crm_academico","crm_administrativo","crm_empresarial","erp"];
const extras2 = {
  medianaCapacidad: mediana(fin.map((c) => c.capacidad)),
  medianaLtvMxn: mediana(pesos.map((c) => c.ltv)),
  medianaPermanencia: mediana(fin.map((c) => c.permanenciaMeses)),
  instConOtrosCrmErp: fin.filter((c) => c.herramientas.some((h) => OTROS.includes(h))).length,
  instConCrmGenerico: fin.filter((c) => c.herramientas.includes("crm_generico")).length,
  nConvCon: fin.filter((c) => c.herramientas.length && c.herramientas.some((h) => ["crm_generico","crm_educativo","erp"].includes(h)) && c.conversionReal != null).length,
  nConvSin: fin.filter((c) => c.herramientas.length && !c.herramientas.some((h) => ["crm_generico","crm_educativo","erp"].includes(h)) && c.conversionReal != null).length,
  soloWhatsapp: fin.filter((c) => c.herramientas.length && c.herramientas.every((h) => h === "whatsapp")).length,
  convSoloWA: average(fin.filter((c) => c.herramientas.length && c.herramientas.every((h) => h === "whatsapp")).map((c)=>c.conversionReal)),
  medianaImplicitaPorCrm: {
    con: mediana(fin.filter((c) => c.herramientas.some((h) => ["crm_generico","crm_educativo","erp"].includes(h))).map((c)=> c.conversionReal!=null&&c.cierreCita? Math.min(1,c.conversionReal/c.cierreCita):null)),
    sin: mediana(fin.filter((c) => c.herramientas.length && !c.herramientas.some((h) => ["crm_generico","crm_educativo","erp"].includes(h))).map((c)=> c.conversionReal!=null&&c.cierreCita? Math.min(1,c.conversionReal/c.cierreCita):null)),
  },
  cierreCitaPorCrm: { con: average(fin.filter((c) => c.herramientas.some((h) => ["crm_generico","crm_educativo","erp"].includes(h))).map((c)=>c.cierreCita)), sin: average(fin.filter((c) => c.herramientas.length && !c.herramientas.some((h) => ["crm_generico","crm_educativo","erp"].includes(h))).map((c)=>c.cierreCita)) },
};
writeFileSync(`${DIR}/corte-extras2.json`, JSON.stringify(extras2, null, 2));
console.error("EXTRAS2", JSON.stringify(extras2));
