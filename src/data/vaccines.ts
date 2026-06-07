// Catálogo de vacunas e intervalos mínimos entre dosis
// Fuente: Guía Calendarios Acelerados ANDAVAC 2026 (feb 2026), Tablas 1 y 2
// ANDAVAC 2026 — actualizar anualmente
import type { VaccineDef, VaccineId, VaccineIntervals } from '../types'

export const VACCINES: VaccineDef[] = [
  {
    id: 'dtpa',
    name: 'Difteria-Tétanos-Tosferina (DTPa / Hexavalente)',
    shortName: 'DTPa',
    type: 'inactivated',
    color: 'bg-red-500',
    maxDoses: 4,  // 3 primovacunación + refuerzo 6 años
  },
  {
    id: 'hepb',
    name: 'Hepatitis B',
    shortName: 'HepB',
    type: 'inactivated',
    color: 'bg-orange-500',
    maxDoses: 3,
  },
  {
    id: 'polio',
    name: 'Poliomielitis inactivada (VPI)',
    shortName: 'Polio',
    type: 'inactivated',
    color: 'bg-yellow-600',
    maxDoses: 4,  // 3 primovacunación + refuerzo 6 años
  },
  {
    id: 'hib',
    name: 'Haemophilus influenzae tipo b',
    shortName: 'HiB',
    type: 'inactivated',
    color: 'bg-lime-600',
    maxDoses: 3,  // primovacunación completa 3 dosis — aunque el mínimo varíe por edad
  },
  {
    id: 'pneumo',
    name: 'Neumococo conjugada 20v (VNC20 / Prevenar 20®)',
    shortName: 'VNC20',
    type: 'inactivated',
    color: 'bg-blue-600',
    maxDoses: 4,  // pauta 3+1 completa
  },
  {
    id: 'menb',
    name: 'Meningococo B (Bexsero®)',
    shortName: 'MenB',
    type: 'inactivated',
    color: 'bg-purple-600',
    maxDoses: 3,
  },
  {
    id: 'menacwy',
    name: 'Meningococo ACWY (Nimenrix® / MenQuadfi®)',
    shortName: 'MenACWY',
    type: 'inactivated',
    color: 'bg-pink-600',
    maxDoses: 2,
  },
  {
    id: 'mmr',
    name: 'Triple vírica — sarampión, rubeola, parotiditis (M-M-RvaxPro®)',
    shortName: 'TV',
    type: 'live',
    color: 'bg-red-400',
    maxDoses: 2,
  },
  {
    id: 'varicella',
    name: 'Varicela (Varivax®)',
    shortName: 'VVZ',
    type: 'live',
    color: 'bg-indigo-400',
    maxDoses: 2,
  },
  {
    id: 'rotavirus',
    name: 'Rotavirus oral (Rotarix®)',
    shortName: 'RV',
    type: 'live',
    color: 'bg-amber-500',
    maxDoses: 2,
  },
  {
    id: 'tdtdpa',
    name: 'Tétanos-Difteria / Tdpa baja carga (Boostrix® / Tetraxim®)',
    shortName: 'Td/Tdpa',
    type: 'inactivated',
    color: 'bg-red-700',
    maxDoses: 5,  // 3 primovacunación + 2 recuerdos
  },
  {
    id: 'hpv',
    name: 'Papilomavirus humano VPH (Gardasil 9®)',
    shortName: 'VPH',
    type: 'inactivated',
    color: 'bg-fuchsia-500',
    maxDoses: 3,  // pauta 3 dosis en inmunosuprimidos
  },
]

// Intervalos mínimos en días entre dosis consecutivas
// intervals[0] = días entre dosis 1→2, intervals[1] = días entre dosis 2→3, etc.
// Fuente: Tablas 1 y 2, Guía Calendarios Acelerados ANDAVAC 2026
// ANDAVAC 2026 — actualizar anualmente
export const VACCINE_INTERVALS: VaccineIntervals[] = [
  // ── Menores de 7 años (Tabla 1) ─────────────────────────────────────────
  { vaccineId: 'dtpa',      intervals: [42, 56, 180] },    // 6sem | 8sem | 6 meses
  { vaccineId: 'hepb',      intervals: [56, 180] },         // 8sem | 6 meses
  { vaccineId: 'polio',     intervals: [42, 56, 180] },    // 6sem | 8sem | 6 meses
  { vaccineId: 'hib',       intervals: [56, 180] },         // 8sem | 6 meses
  { vaccineId: 'pneumo',    intervals: [28, 28, 56] },     // 4sem | 4sem | 8sem
  { vaccineId: 'menb',      intervals: [56, 180] },         // 8sem | 6 meses (3ª = refuerzo)
  { vaccineId: 'menacwy',   intervals: [60] },              // 2 meses
  { vaccineId: 'mmr',       intervals: [28] },              // 4sem (atenuada)
  { vaccineId: 'varicella', intervals: [28] },              // 4sem (atenuada)
  { vaccineId: 'rotavirus', intervals: [28] },              // 4sem (atenuada oral)
  // ── A partir de 7 años (Tabla 2) ────────────────────────────────────────
  { vaccineId: 'tdtdpa',    intervals: [28, 180, 365, 365] }, // 4sem | 6m | 1año | 1año
  { vaccineId: 'hpv',       intervals: [60, 120] },            // 2m | 4m (pauta 3 dosis)
]

export function getVaccineDef(id: VaccineId): VaccineDef {
  const v = VACCINES.find(v => v.id === id)
  if (!v) throw new Error(`Vacuna desconocida: ${id}`)
  return v
}

export function getIntervals(id: VaccineId): number[] {
  return VACCINE_INTERVALS.find(i => i.vaccineId === id)?.intervals ?? []
}
