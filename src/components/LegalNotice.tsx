import { useState } from 'react'
import { Info, X } from '@phosphor-icons/react'

export function LegalNotice() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
      >
        <Info size={12} />
        Aviso legal
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <p className="font-bold text-gray-800">Aviso legal</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>
                Pauta es una herramienta de apoyo a la consulta, pensada para agilizar la
                revisión del calendario vacunal. No sustituye el criterio clínico del
                profesional sanitario ni constituye un registro oficial de vacunación.
              </p>
              <p>
                No está conectada a Diraya ni a ningún sistema oficial de la Junta de
                Andalucía: es una iniciativa personal e independiente, basada en la Guía de
                Calendarios Acelerados ANDAVAC 2026. Aunque se ha revisado con cuidado,
                puede contener errores o quedar desactualizada: verifica siempre las pautas
                con las fuentes oficiales antes de administrar cualquier vacuna.
              </p>
              <p>
                Toda la información se procesa en el propio navegador: ningún dato del
                paciente se almacena ni se envía a ningún servidor.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
