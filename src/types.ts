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
  | 'varicella_history'
  | 'measles_immunity_or_history'
  | 'immunosuppression'  // Inmunosupresión: oncología, trasplante, VIH avanzado, corticoides altas dosis
  | 'severe_immunosuppression' // Inmunosupresión grave: precaución crítica con vacunas atenuadas
  | 'immunosuppressive_treatment'
  | 'transplant_or_candidate'
  | 'asplenia'           // Asplenia anatómica o funcional, anemia drepanocítica
  | 'asplenia_hyposplenia'
  | 'complement_deficiency_or_anti_c5'
  | 'previous_invasive_meningococcal_disease'
  | 'invasive_pneumococcal_risk'
  | 'chronic_disease'    // Cardiopatía, neumopatía crónica, hepatopatía, nefropatía, diabetes
  | 'chronic_heart_disease'
  | 'chronic_lung_disease'
  | 'chronic_liver_disease'
  | 'chronic_kidney_disease'
  | 'diabetes'
  | 'neuromuscular_or_respiratory_risk'
  | 'cochlear_implant'   // Implante coclear o fístula de LCR
  | 'cochlear_implant_or_csf_leak'
  | 'premature_lt35'     // Prematuro < 35 semanas de gestación
  | 'hiv'                // VIH (independientemente del estadio)
  | 'undocumented_doses' // Dosis referidas sin documentación verificable
  | 'maternal_hbsag_positive' // Madre HBsAg positiva o situación perinatal de hepatitis B
  | 'maternal_hbsag_unknown'
  | 'international_travel'

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
  shortName: string  // abreviatura para chips del plan de visitas
  type: VaccineType  // live | inactivated
  route?: 'oral'     // si es oral (rotavirus): la regla de separación de 28 días entre atenuadas no aplica — es solo para atenuadas inyectables (TV, varicela)
  color: string      // clase Tailwind bg-* para el chip de color
  maxDoses: number   // máximo de dosis que un paciente podría haber recibido históricamente
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

export type PolioDocumentationType =
  | 'standard_ipv_or_trivalent'
  | 'exclusive_bivalent_opv_after_2016'
  | 'unknown'

export type MmrDocumentationType =
  | 'complete_mmr'
  | 'measles_rubella_only'
  | 'measles_only'
  | 'rubella_only'
  | 'unknown'

export interface VaccineDocumentationDetail {
  vaccineId: VaccineId
  polioType?: PolioDocumentationType
  mmrType?: MmrDocumentationType
}

export interface VaccinationInput {
  mode: InputMode
  doseCounts: DoseCount[]
  doseDates: DoseWithDate[]
  documentationDetails?: VaccineDocumentationDetail[]
}

// ─── Validación de dosis (solo Modo C) ───────────────────────────────────────
export interface DoseValidity {
  doseIndex: number
  isValid: boolean
  reason?: 'too_early' | 'before_min_age' // intervalo insuficiente o edad mínima no alcanzada
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

// ─── Calendario sistemático (capa previa al rescate) ─────────────────────────
// Define CUÁNDO toca cada dosis según el calendario normal (no los mínimos de
// rescate). Se evalúa antes que el motor de rescate: solo si hay un retraso
// genuino (overdue) se activa generateCatchupPlan.
export interface SystematicScheduleEvent {
  vaccineId: VaccineId
  ageMonths: number // edad sistemática de esta dosis
  dose: number      // qué número de dosis es dentro de la pauta sistemática
  // Si está presente: la dosis se considera "toca ahora" durante todo el año en
  // curso (p.ej. "a los 2 años" = 24-35 meses) y solo "retrasada" al cumplir el
  // año siguiente. Si no está presente: gracia plana de 30 días tras la edad.
  graceUnit?: 'year'
  // Regla de transición 2026 (TV/VVZ 2ª dosis): durante 2026 sustituye la
  // ventana habitual — "toca ahora" hasta cumplir esta edad (en meses);
  // "retrasada" a partir de ahí.
  transition2026?: { dueUntilMonths: number; note: string }
  note?: string
}

export interface SystematicVaccineStatus {
  vaccineId: VaccineId
  status: 'up_to_date' | 'due_today' | 'overdue' | 'not_applicable'
  satisfiedDoses: number                     // nº de dosis sistemáticas ya cubiertas por dosis válidas
  nextEvent: SystematicScheduleEvent | null  // próxima dosis pendiente (due_today / overdue / futura inmediata)
  futureEvents: SystematicScheduleEvent[]    // dosis sistemáticas aún no alcanzadas por la edad
}

// ─── Plan de visitas (output principal) ──────────────────────────────────────

// Una vacuna específica dentro de una visita
export interface VisitVaccine {
  vaccineId: VaccineId
  doseNumber: number // qué número de dosis es (1ª, 2ª, 3ª…)
  minDate: Date      // fecha mínima a partir de la cual se puede administrar
  isLive: boolean    // si es atenuada — aviso de co-administración
  // Origen de la indicación: calendario sistemático normal o motor de rescate.
  // Permite diferenciarlo en la UI y en la nota Diraya.
  source?: 'systematic' | 'catchup'
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
  isUpToDate: boolean   // true = al día con el calendario sistemático (no hay retraso real, no hace falta rescate)
  hasDueToday: boolean  // true = hay alguna dosis sistemática que toca hoy (independiente de isUpToDate)
  systematicStatuses: SystematicVaccineStatus[]
  catchupPlan: VisitPlan[] // visita "HOY" puede venir del calendario sistemático o del rescate — ver VisitVaccine.source
  // Si la ventana de rotavirus está al límite (no se puede asegurar iniciar/completar
  // la pauta), el motor la excluye del plan y deja aquí el aviso específico para el sanitario.
  rotavirusCaution: string | null
  vaccineCautions: VaccineCaution[]
  conditionCautions: ConditionCaution[]
  // true cuando el cálculo se basa solo en número de dosis (sin fechas). El sanitario
  // debe confirmar la fecha de la última dosis antes de administrar.
  countMode: boolean
}

export interface VaccineCaution {
  vaccineId: VaccineId
  message: string
}

export interface ConditionCaution {
  conditionId: ConditionType
  label: string
  message: string
  severity: 'warning' | 'critical'
  affectedVaccines?: VaccineId[]
}
