import { useState } from 'react'
import type { VisitPlan } from '../types'
import { VACCINES } from '../data/vaccines'

interface Props {
  todayVisit: VisitPlan | undefined
}

export function DirayaNote({ todayVisit }: Props) {
  const [copied, setCopied] = useState(false)

  // Genera la lista de vacunas administradas hoy para incluirla en la nota
  const vacunasHoy = todayVisit && todayVisit.vaccines.length > 0
    ? todayVisit.vaccines
        .map(v => {
          const def = VACCINES.find(d => d.id === v.vaccineId)!
          return `${def.name} (${v.doseNumber}ª dosis)`
        })
        .join(', ')
    : null

  const noteText = `Se revisa calendario vacunal del menor y antecedentes disponibles. Se informa a madre/padre/tutor legal sobre las vacunas indicadas en la visita, beneficios esperados, vía de administración, posibles reacciones adversas frecuentes y signos de alarma. Se resuelven dudas y los progenitores/tutor legal aceptan la vacunación.

${vacunasHoy
  ? `Se administran: ${vacunasHoy}. Vacunación según calendario vigente de Andalucía, en lugares anatómicos diferenciados cuando procede, sin incidencias inmediatas. Se registran las vacunas administradas, lote, caducidad, vía y lugar de administración en el módulo vacunal.`
  : 'Se administran vacunas según calendario vigente de Andalucía, en lugares anatómicos diferenciados cuando procede, sin incidencias inmediatas. Se registran las vacunas administradas, lote, caducidad, vía y lugar de administración en el módulo vacunal.'
}

Se dan recomendaciones posteriores a la familia: vigilancia de reacciones locales, fiebre o malestar, medidas generales y consulta si aparecen síntomas de alarma. Se informa de próximas dosis pendientes y de la necesidad de acudir en la fecha indicada para completar pauta.`

  function handleCopy() {
    navigator.clipboard.writeText(noteText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-semibold text-gray-800 text-sm">Nota para Diraya</p>
          <p className="text-xs text-gray-400 mt-0.5">Copia y pega en el módulo de evolución</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            copied
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
          }`}
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      <div className="px-5 py-4">
        <pre className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed font-sans select-all">
          {noteText}
        </pre>
      </div>
    </div>
  )
}
