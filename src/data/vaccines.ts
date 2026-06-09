// Catálogo de vacunas e intervalos mínimos entre dosis.
// Fuente: Guía Calendarios Acelerados ANDAVAC 2026, tablas 1 y 2.
import type { VaccineDef, VaccineId, VaccineIntervals } from '../types'

export const VACCINES: VaccineDef[] = [
  {
    id: 'dtpa',
    name: 'Difteria-Tétanos-Tosferina (DTPa / Hexavalente)',
    shortName: 'DTPa',
    type: 'inactivated',
    color: 'bg-red-500',
    maxDoses: 4,
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
    maxDoses: 4,
  },
  {
    id: 'hib',
    name: 'Haemophilus influenzae tipo b',
    shortName: 'HiB',
    type: 'inactivated',
    color: 'bg-lime-600',
    maxDoses: 3,
  },
  {
    id: 'pneumo',
    name: 'Neumococo conjugada 20v (VNC20 / Prevenar 20®)',
    shortName: 'VNC20',
    type: 'inactivated',
    color: 'bg-blue-600',
    maxDoses: 4,
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
    name: 'Triple vírica: sarampión, rubeola y parotiditis (M-M-RvaxPro®)',
    shortName: 'TV',
    type: 'live',
    color: 'bg-rose-500',
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
    route: 'oral',
    color: 'bg-amber-500',
    maxDoses: 2,
  },
  {
    id: 'tdtdpa',
    name: 'Tétanos-Difteria / Tdpa baja carga (Boostrix® / Tetraxim®)',
    shortName: 'Td/Tdpa',
    type: 'inactivated',
    color: 'bg-stone-600',
    maxDoses: 5,
  },
  {
    id: 'hpv',
    name: 'Papilomavirus humano VPH (Gardasil 9®)',
    shortName: 'VPH',
    type: 'inactivated',
    color: 'bg-fuchsia-500',
    maxDoses: 3,
  },
]

export const VACCINE_INTERVALS: VaccineIntervals[] = [
  { vaccineId: 'dtpa',      intervals: [42, 56, 180] },
  { vaccineId: 'hepb',      intervals: [56, 180] },
  { vaccineId: 'polio',     intervals: [42, 56, 180] },
  { vaccineId: 'hib',       intervals: [56, 180] },
  { vaccineId: 'pneumo',    intervals: [28, 28, 56] },
  { vaccineId: 'menb',      intervals: [56, 180] },
  { vaccineId: 'menacwy',   intervals: [60] },
  { vaccineId: 'mmr',       intervals: [28] },
  { vaccineId: 'varicella', intervals: [28] },
  { vaccineId: 'rotavirus', intervals: [28] },
  { vaccineId: 'tdtdpa',    intervals: [28, 180, 365, 365] },
  { vaccineId: 'hpv',       intervals: [60, 120] },
]

export function getVaccineDef(id: VaccineId): VaccineDef {
  const v = VACCINES.find(v => v.id === id)
  if (!v) throw new Error(`Vacuna desconocida: ${id}`)
  return v
}

export function getIntervals(id: VaccineId): number[] {
  return VACCINE_INTERVALS.find(i => i.vaccineId === id)?.intervals ?? []
}

// La regla de separación de 28 días entre atenuadas es para atenuadas inyectables.
// Rotavirus es oral y no entra en esa regla.
export function requiresLiveSpacing(id: VaccineId): boolean {
  const def = getVaccineDef(id)
  return def.type === 'live' && def.route !== 'oral'
}
