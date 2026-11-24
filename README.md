# Fugas en el proceso de admisiones · datos agregados (Rayos X, 2026)

**De cada 100 prospectos que escriben o llaman a una institución educativa privada en México, unos 7 llegan a una cita y unos 3 se inscriben** (medianas por institución). La fuga mayor está antes de la cita, no en ella.

Datos agregados y anonimizados del informe técnico:

> Jiménez Gallo, V. (2026). *Fugas en el proceso de admisiones de instituciones educativas privadas en México: análisis de 143 diagnósticos Rayos X de Inscripciones (2026)* (Versión 1.0). SuperLeads. Zenodo. https://doi.org/10.5281/zenodo.24450094

- **Informe (PDF, DOI):** https://doi.org/10.5281/zenodo.24450094
- **Página del estudio:** https://observatorio.superleads.mx/estudios/fugas-admisiones-2026/
- **Licencia:** CC BY 4.0 (úsalo y cítalo). Cita lista en [`CITATION.cff`](CITATION.cff).

## El hallazgo

| Indicador | Mediana | Promedio | n |
|---|---|---|---|
| Conversión real (prospecto → inscrito) | 2.95 % | 4.26 % | 128 |
| Prospecto → cita (implícita) | 7.4 % | 13.0 % | 118 |
| Cierre en cita (cita → inscrito) | 40.0 % | 44.3 % | 126 |
| Ocupación (matrícula ÷ capacidad) | 49.0 % | 47.3 % | 135 |

**89 de 128 instituciones (70 %) convierten menos de 5 % de sus prospectos:**

| Conversión real | Instituciones |
|---|---|
| Menos de 2 % | 47 |
| 2 a 5 % | 42 |
| 5 a 10 % | 26 |
| 10 % o más | 13 |

El tramo de 20 % o más tiene menos de 5 instituciones, así que va dentro de «10 % o más».

Las instituciones que declaran un CRM o ERP no convierten más que las que trabajan con WhatsApp y hojas de cálculo: mediana 2.97 % (n = 35) contra 2.93 % (n = 78). Es una asociación, no una causa: tener la herramienta no es lo mismo que usarla para dar seguimiento.

## Archivos

| Archivo | Qué trae |
|---|---|
| `datos/indicadores.csv` | promedio, mediana y n de los 11 indicadores |
| `datos/embudo-mediana.csv` | por cada 100 prospectos: cita e inscripción (medianas) |
| `datos/conversion-real-tramos.csv` | instituciones por tramo de conversión real (n = 128) |
| `datos/cierre-en-cita-tramos.csv` | instituciones por tramo de cierre en cita (n = 126) |
| `datos/ocupacion-tramos.csv` | instituciones por tramo de ocupación (n = 135) |
| `datos/conversion-por-nivel.csv` | conversión real promedio por nivel (una institución con varios niveles cuenta en cada uno) |
| `datos/con-vs-sin-crm.csv` | conversión, cierre y prospecto → cita según herramienta declarada |
| `datos/herramientas.csv` | herramientas que declaran (base 120 diagnósticos) |
| `datos/diagnosticos-por-mes.csv` | diagnósticos terminados por mes (marzo a junio agrupados) |
| `datos/agregados-rayosx-2026-11-22.json` | todos los agregados del informe, el mismo archivo publicado en Zenodo |
| `metodo/metodo-calculo-analitica.ts` | réplica del cálculo de la vista Analítica de la aplicación |

Las proporciones van de 0 a 1 (0.0295 = 2.95 %). Montos en pesos mexicanos (MXN).

## Metodología

- **Fuente:** el Rayos X de Inscripciones de SuperLeads, una sesión guiada de unos 45 minutos con la dirección de la institución en la que se capturan los números del último ciclo (prospectos, citas, inscritos, capacidad, colegiatura, herramientas). Las cifras salen de la vista Analítica de la aplicación, recalculadas sobre una exportación de solo lectura y cotejadas contra la vista en producción el mismo día.
- **Corte:** 22 de noviembre de 2026, 22:20 UTC. **Muestra:** 143 diagnósticos terminados de 139 instituciones, de preescolar a universidad, hechos entre el 6 de marzo y el 20 de noviembre de 2026. Cada indicador lleva su n (diagnósticos con el dato).
- **Definiciones:** conversión real = alumnos nuevos del último ciclo ÷ (prospectos al día × 365). Cierre en cita = proporción de citas que terminan en inscripción, según la institución. Prospecto → cita (implícita) = conversión real ÷ cierre en cita, por institución (tope 100 %): es una estimación, no un conteo de citas.
- **Anonimización:** solo agregados. Ningún grupo con menos de 5 instituciones o diagnósticos; sin nombres de instituciones ni de personas, sin ciudades. La base individual no se comparte.

## Límites

- **No es una muestra del país:** son instituciones que pidieron un Rayos X a SuperLeads. Sesgo de autoselección hacia instituciones que ya sienten que tienen un problema de admisiones.
- **Datos autorreportados** por la dirección en la sesión; no se auditan contra sus sistemas.
- Las medianas de razones distintas no se multiplican exactamente: el «7 de 100 → 3 de 100» describe el orden de magnitud.
- Asociaciones, no causas.
- **Conflicto de interés:** el autor trabaja en SuperLeads, que desarrolla el Rayos X y vende un sistema de admisiones con CRM. Informe técnico sin revisión por pares.

## Nota del autor

En las direcciones la conversación casi siempre empieza con «nos faltan prospectos». Este corte dice otra cosa: la mayoría de las familias que sí escriben nunca llega a la visita. Lo que se pierde está en la respuesta, el seguimiento y la invitación a la cita.

Víctor Jiménez Gallo · Experto en procesos comerciales educativos + IA en SuperLeads · victor@superleads.mx

---

*English summary:* aggregated, anonymized data from 143 completed enrollment diagnostics (139 private institutions in Mexico, preschool to university; data cut 22 Nov 2026). Median conversion from inquiry to enrolled student is 2.95% (n = 128); 89 of 128 institutions convert below 5%; at the median only 7.4% of inquiries reach a visit (n = 118), while visits close at 40% (n = 126). Self-reported data, non-random sample. CC BY 4.0. Report and DOI: https://doi.org/10.5281/zenodo.24450094
