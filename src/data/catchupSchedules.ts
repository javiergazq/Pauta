// Pautas de actualización del calendario vacunal por grupo de edad
// Fuente: Tablas 3 y 4, Guía Calendarios Acelerados ANDAVAC 2026 (feb 2026)
// ANDAVAC 2026 — actualizar anualmente
//
// Regla de co-administración (ANDAVAC 2026, Normas Generales):
//   - Inactivadas entre sí: sin restricción — siempre juntas
//   - Atenuada + inactivada: sin restricción — siempre juntas
//   - Atenuada + atenuada (TV, VVZ, RV): mismo día OBLIGATORIO o separadas ≥28 días
//     → Las tablas ya agrupan atenuadas en la misma visita para cumplir esta regla
import { AgeGroup, VaccineId } from '../types'

export interface CatchupVisitTemplate {
  label: string      // "HOY", "+1 mes", "+2 meses", "+8 meses"
  offsetDays: number // días desde la fecha de evaluación
  // Orden: primero inactivadas, luego atenuadas — refuerza el agrupamiento correcto
  vaccines: VaccineId[]
}

// ANDAVAC 2026 — actualizar anualmente
export const CATCHUP_SCHEDULES: Record<AgeGroup, CatchupVisitTemplate[]> = {

  // ── Tabla 3: Menores de 7 años ─────────────────────────────────────────────
  // TV y VVZ siempre en la misma visita (ambas atenuadas → regla 28 días)
  under7: [
    {
      label: 'HOY',
      offsetDays: 0,
      vaccines: [
        'dtpa', 'hepb', 'polio', 'hib',  // Hexavalente (inactivadas)
        'pneumo',                           // VNC20 (inactivada)
        'menacwy', 'menb',                  // Meningococos (inactivadas)
        'mmr', 'varicella', 'rotavirus',    // Atenuadas: siempre juntas
      ],
    },
    {
      label: '+1 mes',
      offsetDays: 30,
      vaccines: [
        'rotavirus',  // 2ª dosis RV (si <24 semanas de vida)
        'mmr',        // 2ª dosis TV
      ],
    },
    {
      label: '+2 meses',
      offsetDays: 60,
      vaccines: [
        'dtpa', 'hepb', 'polio', 'hib',  // Hexavalente 2ª
        'varicella',                       // VVZ 2ª (atenuada — sin TV en esta visita, ok)
      ],
    },
    {
      label: '+8 meses',
      offsetDays: 240,
      vaccines: [
        'dtpa', 'hepb', 'polio',  // Hexavalente 3ª (HiB ya no necesita más)
      ],
    },
  ],

  // ── Tabla 4: Entre 7 y 18 años ────────────────────────────────────────────
  '7to18': [
    {
      label: 'HOY',
      offsetDays: 0,
      vaccines: [
        'tdtdpa', 'polio', 'hepb',  // Primovacunación (inactivadas)
        'menacwy',                    // MenACWY (inactivada)
        'hpv',                        // VPH (inactivada)
        'mmr', 'varicella',           // Atenuadas: siempre juntas
      ],
    },
    {
      label: '+1 mes',
      offsetDays: 30,
      vaccines: [
        'tdtdpa', 'polio', 'hepb',  // 2ª dosis (inactivadas)
        'mmr', 'varicella',           // 2ª dosis atenuadas
      ],
    },
    {
      label: '+6 meses',
      offsetDays: 180,
      vaccines: [
        'tdtdpa', 'polio', 'hepb',  // 3ª dosis primovacunación
      ],
    },
  ],
}
