# Pauta

Herramienta de consulta rápida del calendario vacunal infantil, pensada para
agilizar la revisión en consulta de enfermería. Dado un paciente y las dosis
ya recibidas, calcula qué vacunas tocan hoy, cuáles faltan y cuándo corresponde
la siguiente cita, siguiendo la Guía de Calendarios Acelerados ANDAVAC 2026
(Andalucía).

La lógica es completamente determinista (sin IA): un motor de reglas evalúa
los requisitos por edad, las dosis administradas, los intervalos mínimos entre
dosis y las condiciones clínicas especiales del paciente.

Toda la información se procesa en el navegador. Ningún dato del paciente se
almacena ni se envía a ningún servidor.

## Funcionamiento

La app guía al profesional en tres pasos:

1. **Paciente** — fecha de nacimiento, sexo y condiciones clínicas especiales
   (inmunosupresión, asplenia, prematuridad, etc.), que ajustan las
   recomendaciones según la guía.
2. **Vacunas** — registro de las dosis ya recibidas de cada vacuna del
   calendario.
3. **Resultado** — qué administrar hoy, próximas citas con fechas mínimas,
   avisos de vacunas atenuadas y un resumen del estado vacunal completo, listo
   para copiar como nota de evolución.

## Stack técnico

React 19 + TypeScript + Vite + Tailwind CSS v4, con Vitest para el motor de
reglas (74 tests).

## Desarrollo local

```bash
npm install
npm run dev      # servidor de desarrollo
npm test         # tests del motor de reglas
npm run build    # build de producción
```

## Aviso

Es una herramienta de apoyo a la consulta. No sustituye el criterio clínico
del profesional sanitario ni constituye un registro oficial de vacunación, y
no está conectada a Diraya ni a ningún sistema de la Junta de Andalucía. Antes
de administrar cualquier vacuna, verifica siempre las pautas con las fuentes
oficiales.

---

Javier Gázquez García · Enfermero, Almería
