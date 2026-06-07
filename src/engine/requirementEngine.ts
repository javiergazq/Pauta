// Motor de requisitos vacunales
// Fuente: Tablas 1 y 2, Guía Calendarios Acelerados ANDAVAC 2026 (feb 2026)
// ANDAVAC 2026 — actualizar anualmente
import { differenceInWeeks } from 'date-fns'
import type { PatientData, RequiredVaccine, VaccineId } from '../types'
import { calculateAge } from './ageCalculator'

// Solo nacidos a partir del 1/10/2021 entran en el calendario sistemático de MenB
const MEN_B_CUTOFF = new Date('2021-10-01')

export function getRequirements(patient: PatientData): RequiredVaccine[] {
  const { birthDate, evaluationDate, conditions } = patient
  const age = calculateAge(birthDate, evaluationDate)
  const ageWeeks = differenceInWeeks(evaluationDate, birthDate)

  // Interpretación de condiciones clínicas → grupos de riesgo
  const isImmunosuppressed = conditions.includes('immunosuppression')
    || conditions.includes('hiv')
  const isHighRiskPneumo = conditions.includes('asplenia')
    || conditions.includes('chronic_disease')
    || conditions.includes('cochlear_implant')
    || conditions.includes('immunosuppression')
    || conditions.includes('hiv')
  const isHighRiskMeningo = conditions.includes('asplenia')
    || conditions.includes('immunosuppression')
    || conditions.includes('hiv')

  if (age.group === 'under7') {
    return buildUnder7(age.months, ageWeeks, birthDate, { isHighRiskPneumo, isHighRiskMeningo })
  }
  return build7to18(age.months, isImmunosuppressed)
}

// Helpers
function on(vaccineId: VaccineId, minDoses: number, note?: string): RequiredVaccine {
  return { vaccineId, minDoses, applicable: true, note }
}
function off(vaccineId: VaccineId): RequiredVaccine {
  return { vaccineId, minDoses: 0, applicable: false }
}

interface RiskFlags {
  isHighRiskPneumo: boolean
  isHighRiskMeningo: boolean
}

// ── Menores de 7 años (Tabla 1 ANDAVAC 2026) ─────────────────────────────────
function buildUnder7(
  months: number,
  ageWeeks: number,
  birthDate: Date,
  risk: RiskFlags
): RequiredVaccine[] {
  const { isHighRiskPneumo, isHighRiskMeningo } = risk

  // MenB: solo para nacidos a partir del 1/10/2021 y menores de 7 años
  const menBApplicable = birthDate >= MEN_B_CUTOFF && months < 72

  // Rotavirus: 1ª dosis máximo antes de 20 semanas de vida
  // Si ya tiene ≥24 semanas no puede completar la pauta → no aplicable
  const rotaApplicable = ageWeeks < 24

  // DTPa: pauta 2+1 → 3 dosis en <24 meses; refuerzo DTPa-VPI a los 6 años → 4 dosis en ≥24 meses
  // (alineado con Polio: ambas llevan el mismo refuerzo de los 6 años con Tetraxim)
  const dtpaDoses = months < 24 ? 3 : 4

  // Polio: pauta 2+1 → 3 dosis; refuerzo DTPa-VPI a los 6 años → 4 dosis totales
  const polioDoses = months < 24 ? 3 : 4

  // HepB: siempre 3 dosis
  const hepbDoses = 3

  // HiB: varía por edad
  let hibDoses = 3        // <12 meses: primovacunación
  if (months >= 12 && months < 15) hibDoses = 2
  else if (months >= 15 && months < 60) hibDoses = 1
  else if (months >= 60) hibDoses = 0   // ≥5 años: solo grupos de riesgo

  // Neumococo 20v: pauta sistemática 3+1 (2, 4, 6, 11 meses)
  // Número mínimo de dosis según edad de evaluación (Tabla 1 ANDAVAC 2026)
  let pneumoDoses = 4     // <7 meses
  if (months >= 7 && months < 12) pneumoDoses = 3
  else if (months >= 12 && months < 24) pneumoDoses = 2
  else if (months >= 24 && months < 60) pneumoDoses = 1
  else if (months >= 60) pneumoDoses = isHighRiskPneumo ? 1 : 0  // ≥5 años: solo riesgo

  // MenB: dosis según edad de inicio
  let menBDoses = 3        // <24 meses
  if (months >= 24) menBDoses = 2  // 24-71 meses: 2 dosis separadas ≥1 mes

  // MenACWY: 1 dosis a partir de los 4 meses; grupos de riesgo en cualquier edad
  const menacwyApplicable = months >= 4 || isHighRiskMeningo

  // TV: 1 dosis <24 meses, 2 dosis ≥24 meses
  const mmrDoses = months < 24 ? 1 : 2
  // TV no aplicable antes de los 12 meses (edad mínima: 11 meses, pero idealmente 12)
  const mmrApplicable = months >= 11

  // VVZ: 1 dosis <24 meses, 2 dosis ≥24 meses
  // Edad mínima: 12 meses (15 meses sistemático, pero 12 meses en rescate)
  const varDoses = months < 24 ? 1 : 2
  const varApplicable = months >= 12

  return [
    on('dtpa', dtpaDoses),
    on('hepb', hepbDoses),
    on('polio', polioDoses),
    hibDoses > 0 ? on('hib', hibDoses) : off('hib'),
    pneumoDoses > 0 ? on('pneumo', pneumoDoses) : off('pneumo'),
    menBApplicable ? on('menb', menBDoses, 'Solo nacidos ≥ 1/10/2021') : off('menb'),
    menacwyApplicable ? on('menacwy', 1) : off('menacwy'),
    mmrApplicable ? on('mmr', mmrDoses) : off('mmr'),
    varApplicable ? on('varicella', varDoses) : off('varicella'),
    rotaApplicable ? on('rotavirus', 2, '1ª dosis máx. 20 sem vida; 2ª máx. 24 sem') : off('rotavirus'),
    off('tdtdpa'),  // a partir de 7 años
    off('hpv'),     // a partir de 12 años
  ]
}

// ── 7 a 18 años (Tabla 2 ANDAVAC 2026) ───────────────────────────────────────
function build7to18(months: number, isImmunosuppressed: boolean): RequiredVaccine[] {
  // VPH: 1 dosis (12-21 años); 3 dosis si inmunosupresión (pauta 0-2-6 meses)
  // Rescate activo hasta los 21 años (252 meses) — ANDAVAC 2026
  const hpvApplicable = months <= 252
  const hpvDoses = isImmunosuppressed ? 3 : 1

  return [
    off('dtpa'),           // DTPa solo <7 años
    on('tdtdpa', 5),       // 3 primovacunación + 2 recuerdos = 5 total
    on('hepb', 3),         // 3 dosis hasta los 18 años
    on('polio', 3),        // 3 dosis (si 3ª fue <4 años → 4ª; gestión en notas clínicas)
    off('hib'),            // HiB solo <5 años (salvo riesgo)
    off('pneumo'),         // VNC20 solo grupos de riesgo en ≥5 años
    off('menb'),           // MenB solo grupos de riesgo en ≥7 años
    on('menacwy', 1),      // Rescate 12-18 años sin dosis previa a partir de los 10 años
    on('mmr', 2),          // 2 dosis con intervalo ≥4 semanas
    on('varicella', 2),    // 2 dosis si no ha pasado la enfermedad
    off('rotavirus'),      // Rotavirus solo <24 semanas de vida
    hpvApplicable ? on('hpv', hpvDoses) : off('hpv'),
  ]
}
