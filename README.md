# Volare Evento V8

Landing lista para GitHub/Render.

## RSVP
El formulario envía los datos por POST a Google Apps Script usando un iframe oculto. El registro solo se muestra como exitoso cuando Apps Script devuelve una confirmación real mediante `postMessage`.

## Importante
En Apps Script, reemplazar el código por `apps-script.gs` y volver a implementar la MISMA implementación como nueva versión.

Configuración de la implementación:
- Ejecutar como: Yo
- Quién tiene acceso: Cualquier usuario / Anyone

Al abrir la URL /exec en una ventana incógnita debe verse: `VOLARE RSVP OK`.


## V7
Se corrigió la confirmación visual del RSVP. Google Apps Script registra la fila correctamente, pero algunos navegadores no entregan el postMessage de la respuesta embebida. La V7 usa también el evento load del iframe oculto como confirmación de finalización del POST, evitando mostrar un falso error cuando el registro sí fue guardado.


## V8
La confirmación de asistencia es individual. Se eliminó del formulario visible el selector de cantidad de asistentes. Cada invitado debe completar sus propios datos. Para mantener compatibilidad con el Apps Script actual, el formulario envía internamente `cantidad=1` en cada registro.
