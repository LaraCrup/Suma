# Checklist pendiente — Suma

Solo lo que falta testear. Lo ya marcado como OK vive en [CHECKLIST.md](CHECKLIST.md) y no se toca.

Fecha de armado: **29-07-2026** (los datos de prueba de `larabtv` están calculados para *hoy*: si testeás otro día, las rachas se corren y hay que rearmarlas).

---

## 0. Antes de empezar: preparar el navegador

Los flujos de racha dependen del sync diario, que **solo corre una vez por día y solo si todavía no hay ningún hábito registrado hoy**. Con la cuenta `larabtv` logueada:

1. DevTools → Application → Local Storage → borrar estas claves (si existen):
   - `lastHabitResetDate_f9c70bfa-2954-452b-b5e1-627056006b41`
   - `lastCommunityStreakSync_f9c70bfa-2954-452b-b5e1-627056006b41`
2. **No completar ningún hábito todavía.** Si registrás algo antes de recargar, el sync no corre y no vas a ver la oferta de "Salvar racha".
3. Recargar la home (`/`) y mirar la consola: tiene que aparecer `[HABIT SYNC]`.

Ya dejé cargado en `larabtv` todo lo necesario (hábitos `TEST …` y 3 comunidades `TEST …`). Detalle de cada fixture abajo, en el punto donde se usa.

---

## 1. Cambios nuevos del 29-07-2026 ⚠️ *probar primero*

### Salir de una comunidad (RPC nuevo `leave_community`)

- [ ] **Salir siendo miembro común** → comunidad **TEST salir siendo miembro** 🚪 (admin: `laracrupnicoff`). Salís sin error y desaparece de tu listado
- [ ] **Salir siendo admin con más miembros** → comunidad **TEST salir siendo admin** 👋 (vos admin + `laracrupnicoff` + `lara.davinci`).
  - El modal avisa *"Tenés el rol de admin: al salir pasa a otro miembro de la comunidad."*
  - Al salir, entrás con `laracrupnicoff` y verificás que **alguien quedó como Admin** (puede haber caído en `lara.davinci`; el reemplazo es al azar). Ya **no** queda huérfana como pasaba con la comunidad `db12b218…`
  - El admin nuevo puede **editar el nombre, editar el hábito, agregar miembros y eliminar la comunidad**
- [ ] **Salir siendo el único miembro** → creá una comunidad nueva vos sola y salí: la comunidad se elimina (no queda basura invisible)
- [ ] Regresión: un admin **elimina** a otro miembro → sigue funcionando igual que antes

### Offline: bloqueo de escrituras

Modo avión o DevTools → Network → Offline.

- [ ] En una comunidad: el input del chat queda **deshabilitado** y dice *"Sin conexión: no podés enviar mensajes."*
- [ ] Volver online → el input se habilita y el mensaje se envía normal
- [ ] En `/mi-perfil`: **no aparece el ícono de editar** (lápiz al lado del avatar)
- [ ] Entrando por URL directa a `/mi-perfil/editar` sin conexión: no aparecen los botones de foto ni el de guardar, y avisa *"Sin conexión: no podés editar tu perfil."*
- [ ] Volver online → el ícono y el botón de guardar vuelven, y guardar persiste

---

## 2. Fechas y rachas ⚠️ *lo más frágil*

Todos estos hábitos ya están cargados en `larabtv` con su historial. Hacer el punto 0 antes.

| Hábito | Estado que dejé | Qué tiene que pasar |
|---|---|---|
| **TEST salvar racha** 🛟 | racha 4, completado hasta el 27-07, el 28 sin hacer | punto rojo en la card → detalle → **Salvar racha** mantiene la racha en 4 |
| **TEST perder racha** 💔 | igual que el anterior | detalle → **Perder racha** la manda a **0** |
| **TEST gracia ya usada** 🚫 | mismo hueco, pero la gracia de julio ya está consumida | **no** ofrece gracia: la racha va directo a 0 |
| **TEST 2 dias sin completar** 📉 | racha 4, sin completar 26, 27 y 28 | hueco de 2+ días → **no** ofrece gracia, resetea directo |
| **TEST racha 7** 🔥 | racha 6, completado del 23 al 28 | completar **hoy** → racha 7 → toast **+30 XP** (`streak_7`) |

- [ ] Salvar racha mantiene la racha (🛟)
- [ ] La gracia no se puede usar dos veces en el mismo mes (🚫)
- [ ] "Perder racha" la manda a 0 (💔)
- [ ] 2+ días sin completar → no ofrece gracia, resetea directo (📉)
- [ ] Racha de 7 días → +30 XP (🔥)
- [ ] Después de salvar la racha en 🛟, mirar en Supabase que `habits.streak_grace_used_month` quedó en `2026-07`

### Caso híbrido: diario + cantidad de días por semana

Dos hábitos, los dos "4 días por semana", misma frecuencia, historial distinto:

| Hábito | Semana cerrada (20 al 26-07) | Esta semana (27 y 28) | Racha esperada |
|---|---|---|---|
| **TEST 4x semana OK** 🚴 | 4 de 4 ✅ | 2 | **6** (2 + 4) |
| **TEST 4x semana cortada** 🛼 | 2 de 4 ❌ | 2 | **2** (solo esta semana) |

- [ ] Las rachas arrancan en 6 y 2 respectivamente
- [ ] Completar hoy cada uno → **+1** en cada racha (7 y 3): suma por día completado
- [ ] La semana cerrada que no llegó a la cuota es la única que corta la racha (🛼), la semana en curso nunca resta

---

## 3. Comunidades

Comunidad **TEST racha comunitaria** 🔥, hábito *Tomar 2 litros de agua* 💧: racha **3** (26, 27 y 28-07 completados por `larabtv`, único miembro). El 25-07 quedó libre a propósito.

- [ ] **Sumar un miembro nuevo no corta la racha histórica**: agregá a `laracrupnicoff` desde el detalle → borrá `lastCommunityStreakSync_f9c70bfa-2954-452b-b5e1-627056006b41` → recargá la home → la racha **sigue en 3**
- [ ] **Completar el hábito comunitario en un día pasado**: desde el DateNavigator elegí el **25-07** y completá → el log queda en el 25, no en hoy (verificable en `community_habit_logs`), y la racha pasa a 4

---

## 4. Guards por usuario (`localStorage` con sufijo de userId)

- [ ] Con la cuenta B (`larabtv`), verificar que el reset diario de hábitos corre normal
- [ ] Volver a la cuenta A (`laracrupnicoff`) → su racha y su progreso siguen intactos

---

## 5. PWA y navegación

- [ ] Los 4 shortcuts del manifest (Hábitos / Progreso / Comunidades / Novedades)
- [ ] Pull-to-refresh en cada página que lo registra
- [ ] El splash aparece al abrir la PWA instalada

---

## 6. Pendiente que no depende del código

- [ ] **Activar Leaked Password Protection** en Supabase
  Dashboard → Authentication → Sign In / Providers → *Leaked password protection*. Es el único punto que queda en el linter de seguridad; el front ya chequea contra HaveIBeenPwned
- [ ] **Panel de administración (repo aparte)**: entrar como superadmin → sigue funcionando
- [ ] **Decidir qué hacer con `useNotification`**: se usa en 6 lugares (creación de hábito, registro, los 3 flujos de contraseña) pero **solo escribe en consola**. Opciones: conectarlo a los toasts que ya existen (`XpNotification`) o sacar las llamadas

---

## 7. Antes de entregar

- [ ] Correr **Lighthouse** en mobile (Performance / Accessibility / Best Practices / SEO)
- [ ] El deploy de producción tiene todas las variables de entorno cargadas
- [ ] Probar la app **desde el celular de otra persona**, con datos móviles
- [ ] Revisar que `.env` no esté en el **historial** de git (hoy no está trackeado, pero conviene mirar el historial)
- [ ] Tener un **usuario de demo** listo, con hábitos, racha y comunidad ya cargados
- [ ] Tener una **segunda cuenta** lista para demostrar comunidades y amigos en vivo
- [ ] Ensayar la demo completa una vez, de punta a punta

---

## Limpieza post-testeo

Cuando termines, borrar de `larabtv` los hábitos `TEST …` y las comunidades `TEST …` (o pedirme el SQL). También quedó una comunidad vieja sin miembros de un testeo anterior — *Comunidad de pruebaaaaaaaaaaa* (`392aaf44-c129-49c9-b446-ce56398071b9`) — que no se ve en ninguna pantalla; se puede borrar tranquila.
