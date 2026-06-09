import { useState } from 'react'
import { Check, Copy } from '@phosphor-icons/react'
import type { ConditionCaution, VisitPlan } from '../types'
import { VACCINES } from '../data/vaccines'

interface Props {
  todayVisit: VisitPlan | undefined
  conditionCautions?: ConditionCaution[]
}

export function DirayaNote({ todayVisit, conditionCautions = [] }: Props) {
  const [copied, setCopied] = useState(false)
  const hasVaccinesToday = (todayVisit?.vaccines.length ?? 0) > 0
  const hasUndocumentedDoses = conditionCautions.some(caution => caution.conditionId === 'undocumented_doses')

  if (!hasVaccinesToday && !hasUndocumentedDoses) {
    return null
  }

  const vacunasHoy = hasVaccinesToday && todayVisit
    ? todayVisit.vaccines
        .map(v => {
          const def = VACCINES.find(d => d.id === v.vaccineId)!
          return `${def.name} (${v.doseNumber}ª dosis)`
        })
        .join(', ')
    : null

  const conditionNote = hasUndocumentedDoses
    ? 'Nota: existen dosis previas no documentadas o dudosas. Solo se consideran válidas las dosis documentadas; valorar completar según calendario acelerado si persiste duda razonable.'
    : ''

  const noteText = `Se revisa calendario vacunal del menor y antecedentes disponibles. Se informa a madre/padre/tutor legal sobre las vacunas indicadas en la visita, beneficios esperados, vía de administración, posibles reacciones adversas frecuentes y signos de alarma. Se resuelven dudas y los progenitores/tutor legal aceptan la vacunación.

${vacunasHoy
  ? `Se administran: ${vacunasHoy}. Vacunación según calendario vigente de Andalucía, en lugares anatómicos diferenciados cuando procede, sin incidencias inmediatas. Se registran las vacunas administradas, lote, caducidad, vía y lugar de administración en el módulo vacunal.`
  : 'Se administran vacunas según calendario vigente de Andalucía, en lugares anatómicos diferenciados cuando procede, sin incidencias inmediatas. Se registran las vacunas administradas, lote, caducidad, vía y lugar de administración en el módulo vacunal.'
}
${conditionNote ? `\n${conditionNote}\n` : ''}
Se dan recomendaciones posteriores a la familia: vigilancia de reacciones locales, fiebre o malestar, medidas generales y consulta si aparecen síntomas de alarma. Se informa de próximas dosis pendientes y de la necesidad de acudir en la fecha indicada para completar pauta.`

  function handleCopy() {
    navigator.clipboard.writeText(noteText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div>
          <p className="text-sm font-semibold text-[var(--pauta-navy)]">Nota para Diraya</p>
          <p className="mt-0.5 text-xs text-slate-500">Copia y pega en el módulo de evolución</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all sm:px-4 ${
            copied
              ? 'bg-[var(--pauta-aqua-soft)] text-[var(--pauta-navy)]'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300'
          }`}
        >
          {copied ? <Check size={16} weight="bold" /> : <Copy size={16} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <pre className="select-all whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-600">
          {noteText}
        </pre>
      </div>
    </div>
  )
}
