// Calendario sistemático infantil — CUÁNDO toca cada dosis según la pauta normal
// (no los mínimos de rescate, que ya cubre requirementEngine/CATCHUP_SCHEDULES).
// Fuente: Guía de Calendarios Acelerados ANDAVAC 2026 (feb 2026), tabla de
// calendario sistemático. ANDAVAC 2026 — actualizar anualmente.
//
// graceUnit: 'year' marca las dosis "de X años" (2, 12, 14 años): se consideran
// "toca ahora" durante todo el año en curso, y solo "retrasadas" al cumplir el
// año siguiente. El resto usa una gracia plana de 30 días tras la edad sistemática.
//
// transition2026 sustituye, solo durante 2026, la ventana de la 2ª dosis de
// TV/VVZ: "toca ahora" entre los 24 y los 47 meses; "retrasada" a partir de los
// 48 (cubre a los niños de 2 y 3 años durante el año de transición).
import type { SystematicScheduleEvent } from '../types'

export const SYSTEMATIC_SCHEDULE: SystematicScheduleEvent[] = [
  // Hexavalente (DTPa, Polio, HepB, HiB): pauta 2+1 a los 2, 4 y 11 meses
  { vaccineId: 'dtpa',  ageMonths: 2,  dose: 1 },
  { vaccineId: 'dtpa',  ageMonths: 4,  dose: 2 },
  { vaccineId: 'dtpa',  ageMonths: 11, dose: 3 },

  { vaccineId: 'polio', ageMonths: 2,  dose: 1 },
  { vaccineId: 'polio', ageMonths: 4,  dose: 2 },
  { vaccineId: 'polio', ageMonths: 11, dose: 3 },

  { vaccineId: 'hepb',  ageMonths: 2,  dose: 1 },
  { vaccineId: 'hepb',  ageMonths: 4,  dose: 2 },
  { vaccineId: 'hepb',  ageMonths: 11, dose: 3 },

  { vaccineId: 'hib',   ageMonths: 2,  dose: 1 },
  { vaccineId: 'hib',   ageMonths: 4,  dose: 2 },
  { vaccineId: 'hib',   ageMonths: 11, dose: 3 },

  // Rotavirus: 2 dosis, a los 2 y 4 meses (ventana estricta — rescate ya gestiona el corte de 24 semanas)
  { vaccineId: 'rotavirus', ageMonths: 2, dose: 1 },
  { vaccineId: 'rotavirus', ageMonths: 4, dose: 2 },

  // Neumococo 20v: pauta 3+1 a los 2, 4, 6 y 11 meses
  { vaccineId: 'pneumo', ageMonths: 2,  dose: 1 },
  { vaccineId: 'pneumo', ageMonths: 4,  dose: 2 },
  { vaccineId: 'pneumo', ageMonths: 6,  dose: 3 },
  { vaccineId: 'pneumo', ageMonths: 11, dose: 4 },

  // MenB: 2, 4 y 15 meses (solo nacidos ≥ 1/10/2021 — gestionado por requirementEngine.applicable)
  { vaccineId: 'menb', ageMonths: 2,  dose: 1 },
  { vaccineId: 'menb', ageMonths: 4,  dose: 2 },
  { vaccineId: 'menb', ageMonths: 15, dose: 3 },

  // MenACWY: 4 y 12 meses (bloque de visitas del primer año), y refuerzo a los 12 años
  { vaccineId: 'menacwy', ageMonths: 4,   dose: 1 },
  { vaccineId: 'menacwy', ageMonths: 12,  dose: 2 },
  { vaccineId: 'menacwy', ageMonths: 144, dose: 3, graceUnit: 'year', note: 'Refuerzo de los 12 años' },

  // Triple vírica: 1ª a los 12 meses, 2ª a los 2 años
  { vaccineId: 'mmr', ageMonths: 12, dose: 1 },
  {
    vaccineId: 'mmr', ageMonths: 24, dose: 2, graceUnit: 'year',
    transition2026: { dueUntilMonths: 47, note: 'Durante 2026, la 2ª dosis cubre también a los niños de 3 años (transición del calendario)' },
  },

  // Varicela: 1ª a los 15 meses, 2ª a los 2 años
  { vaccineId: 'varicella', ageMonths: 15, dose: 1 },
  {
    vaccineId: 'varicella', ageMonths: 24, dose: 2, graceUnit: 'year',
    transition2026: { dueUntilMonths: 47, note: 'Durante 2026, la 2ª dosis cubre también a los niños de 3 años (transición del calendario)' },
  },

  // VPH: 1 dosis a los 12 años
  { vaccineId: 'hpv', ageMonths: 144, dose: 1, graceUnit: 'year' },

  // Td/Tdpa: refuerzo a los 14 años
  { vaccineId: 'tdtdpa', ageMonths: 168, dose: 1, graceUnit: 'year', note: 'Refuerzo de los 14 años' },
]
