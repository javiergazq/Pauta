// ─── Vacunas incluidas en el calendario infantil ANDAVAC 2026 ────────────────
// v1: niños 0-18 años (sistemático + acelerado)
// v2 futuro: adultos, embarazadas
// v3 futuro: grupos de riesgo, viajeros, gripe/VRS estacionales
export type VaccineId =
  | 'dtpa'      // DTPa / Hexavalente (difteria-tétanos-tosferina + HepB + Polio + HiB)
  | 'hepb'      // Hepatitis B (componente hexavalente o monocomponente)
  | 'polio'     // Poliomielitis inactivada VPI (componente hexavalente o Tetraxim)
  | 'hib'       // Haemophilus influenzae tipo b (componente hexavalente)
  | 'pneumo'    // Neumococo conjugada 20v (VNC20, Prevenar 20)
  | 'menb'      // Meningococo B (Bexsero) — solo nacidos ≥ 1/10/2021
  | 'menacwy'   // Meningococo ACWY (Nimenrix 4m / MenQuadfi 12m y 12 años)
  | 'mmr'       // Triple vírica — sarampión, rubeola, parotiditis (M-M-RvaxPro)
  | 'varicella' // Varicela (Varivax)
  | 'rotavirus' // Rotavirus oral (Rotarix) — límite estricto semanas de vida
  | 'tdtdpa'    // Td / Tdpa baja carga (Boostrix) — a partir de 7 años
  | 'hpv'       // Papilomavirus humano VPH (Gardasil 9) — 12-21 años

export type VaccineType = 'live' | 'inactivated'
export type Sex = 'M' | 'F'

// Grupos de edad del calendario acelerado ANDAVAC
export type AgeGroup = 'under7' | '7to18'
// over18, embarazadas, grupos_riesgo → v2/v3

// Condiciones clínicas del paciente — el motor las interpreta para determinar grupos de riesgo
// Se muestran al profesional como patologías concretas, no como "grupos de riesgo"
export type ConditionType =
  | 'immunosuppression'  // Inmunosupresión: oncología, trasplante, VIH avanzado, corticoides altas dosis
  | 'asplenia'           // Asplenia anatómica o funcional, anemia drepanocítica
  | 'chronic_disease'    // Cardiopatía, neumopatía crónica, hepatopatía, nefropatía, diabetes
  | 'cochlear_implant'   // Implante coclear o fístula de LCR
  | 'premature_lt35'     // Prematuro < 35 semanas de gestación
  | 'hiv'                // VIH (independientemente del estadio)

// ─── Edad calculada ───────────────────────────────────────────────────────────
export interface AgeData {
  days: number
  weeks: number
  months: number
  years: number
  group: AgeGroup
}

// ─── Datos del paciente ───────────────────────────────────────────────────────
export interface PatientData {
  birthDate: Date
  sex: Sex
  evaluationDate: Date
  conditions: ConditionType[]
}

// ─── Definición de vacuna (catálogo) ──────────────────────────────────────────
export interface VaccineDef {
  id: VaccineId
  name: string       // nombre completo
  shortName: string  // abreviatura para chips y grid
  type: VaccineType  // live | inactivated — controla la regla de 28 días
  color: string      // clase Tailwind bg-* para el chip de color
}

// intervals[0] = días mínimos entre dosis 1→2
// intervals[1] = días mínimos entre dosis 2→3, etc.
// ANDAVAC 2026 — actualizar anualmente desde Tablas 1 y 2
export interface VaccineIntervals {
  vaccineId: VaccineId
  intervals: number[]
}

// ─── Requisitos calculados por el motor ──────────────────────────────────────
export interface RequiredVaccine {
  vaccineId: VaccineId
  minDoses: number
  applicable: boolean
  note?: string // aviso clínico (ej: "solo nacidos ≥ 1/10/2021")
}

// ─── Input del usuario ────────────────────────────────────────────────────────

// Modo B: número de dosis recibidas por vacuna (consulta rápida)
export interface DoseCount {
  vaccineId: VaccineId
  count: number
}

// Modo C: fecha de cada dosis recibida (análisis de validez)
export interface DoseWithDate {
  vaccineId: VaccineId
  dates: (Date | null)[]
}

export type InputMode = 'count' | 'dates'

export interface VaccinationInput {
  mode: InputMode
  doseCounts: DoseCount[]
  doseDates: DoseWithDate[]
}

// ─── Validación de dosis (solo Modo C) ───────────────────────────────────────
export interface DoseValidity {
  doseIndex: number
  isValid: boolean
  reason?: 'too_early' // administrada ≥5 días antes del intervalo mínimo
}

// ─── Estado vacunal por vacuna ────────────────────────────────────────────────
export interface VaccineStatus {
  vaccineId: VaccineId
  required: number
  received: number
  valid: number    // dosis que cuentan (en Modo B = received; en Modo C = validadas)
  missing: number
  status: 'complete' | 'partial' | 'missing' | 'not_applicable'
  doseValidity?: DoseValidity[] // solo Modo C
}

// ─── Plan de visitas (output principal) ──────────────────────────────────────

// Una vacuna específica dentro de una visita
export interface VisitVaccine {
  vaccineId: VaccineId
  doseNumber: number // qué número de dosis es (1ª, 2ª, 3ª…)
  minDate: Date      // fecha mínima a partir de la cual se puede administrar
  isLive: boolean    // si es atenuada — aviso de co-administración
}

// Una visita del plan (HOY, +1 mes, +2 meses, +8 meses…)
export interface VisitPlan {
  label: string       // "HOY", "+1 mes", "+2 meses", "+8 meses"
  offsetDays: number  // días desde la fecha de evaluación
  vaccines: VisitVaccine[]
  hasLiveVaccines: boolean // aviso: si hay 2+ atenuadas, deben ser el mismo día
}

// ─── Resultado final ──────────────────────────────────────────────────────────
export interface VaccinationResult {
  patientData: PatientData
  ageData: AgeData
  vaccineStatuses: VaccineStatus[]
  isUpToDate: boolean
  catchupPlan: VisitPlan[] // vacío si isUpToDate = true
}
