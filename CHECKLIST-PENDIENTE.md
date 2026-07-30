# Checklist pendiente — Suma

Solo lo que falta testear. Lo ya marcado como OK vive en [CHECKLIST.md](CHECKLIST.md) y no se toca.

Fecha de armado: **29-07-2026** (los datos de prueba de `larabtv` están calculados para *hoy*: si testeás otro día, las rachas se corren y hay que rearmarlas).

---

## 0. Antes de empezar: preparar el navegador ⚠️ *leer esto o los tests de racha no funcionan*

**El bloque de rachas (punto 2) va PRIMERO, antes de completar cualquier otra cosa.** No es un capricho: la gracia de rachas la detecta `syncHabitsWithNewDay`, y `shouldResetToday` decide si correr o no con dos guards:

1. `lastHabitResetDate_{userId}` en localStorage ≠ hoy, **y**
2. que **no exista ni un solo `habit_log` de hoy** para esa cuenta — ni siquiera uno con `value: 0` / `completed: false`, que es lo que deja atrás un hábito completado y descompletado.

Si ya registraste algo hoy, el sync **no corre en todo el día** y por eso no aparece ni el punto rojo ni "Salvar racha", y los hábitos que tenían que caerse a 0 se quedan con la racha vieja (fue exactamente lo que pasó en la primera pasada). Es el comportamiento esperado del guard, no un bug: en uso real el primer render del día corre el sync antes de que el usuario pueda tocar nada.

Con la cuenta `larabtv` logueada:

1. DevTools → Application → Local Storage → borrar estas claves (si existen):
   - `lastHabitResetDate_f9c70bfa-2954-452b-b5e1-627056006b41`
   - `lastCommunityStreakSync_f9c70bfa-2954-452b-b5e1-627056006b41`
   - `streakGracePending_…` y `streakGraceForgiven_…` (todas)
2. **No completar ningún hábito todavía.**
3. Recargar la home (`/`) y mirar la consola: tiene que aparecer `[HABIT SYNC]`.
4. Recién ahí: el punto rojo tiene que estar en 🛟 y 💔, y 🚫 y 📉 tienen que haber caído a 0.

Si volvés a quedar trabada porque ya hay logs de hoy, hay dos salidas: pedirme que limpie el día de nuevo, o **simular la oferta a mano** desde la consola del navegador (sirve para probar la UI y el apply/decline, no la detección):

```js
localStorage.setItem('streakGracePending_d6601386-d5b2-4de6-826f-c6a12783fb57', '{"offeredForDate":"2026-07-28"}') // TEST salvar racha
localStorage.setItem('streakGracePending_67c504e4-6de1-4ba1-a714-7d1b9a807389', '{"offeredForDate":"2026-07-28"}') // TEST perder racha
```

Ya dejé cargado en `larabtv` todo lo necesario (hábitos `TEST …` y 3 comunidades `TEST …`) y **re-armé los fixtures del punto 2** después de la primera pasada: se borraron los logs de hoy y las rachas volvieron a los valores de la tabla. Los ítems del punto 2 que ya validaste (🔥 y los dos híbridos) siguen valiendo; si querés repetirlos, los datos están otra vez en el estado inicial.

---

## 1. Cambios nuevos del 29-07-2026 ⚠️ *probar primero*

### Salir de una comunidad (RPC nuevo `leave_community`)

- [x] **Salir siendo miembro común** → comunidad **TEST salir siendo miembro** 🚪 (admin: `laracrupnicoff`). Salís sin error y desaparece de tu listado
- [x] **Salir siendo admin con más miembros** → comunidad **TEST salir siendo admin** 👋 (vos admin + `laracrupnicoff` + `lara.davinci`).
  - El modal avisa *"Tenés el rol de admin: al salir pasa a otro miembro de la comunidad."*
  - Al salir, entrás con `laracrupnicoff` y verificás que **alguien quedó como Admin** (puede haber caído en `lara.davinci`; el reemplazo es al azar). Ya **no** queda huérfana como pasaba con la comunidad `db12b218…`
  - El admin nuevo puede **editar el nombre, editar el hábito, agregar miembros y eliminar la comunidad**
- [x] **Salir siendo el único miembro** → creá una comunidad nueva vos sola y salí: la comunidad se elimina (no queda basura invisible)
- [x] Regresión: un admin **elimina** a otro miembro → sigue funcionando igual que antes

### Offline: bloqueo de escrituras

Modo avión o DevTools → Network → Offline.

- [ ] En una comunidad: el input del chat queda **deshabilitado**, **desaparece el botón de enviar** y avisa en **rojo** *"Sin conexión: no podés enviar mensajes."*
- [x] Volver online → el input se habilita y el mensaje se envía normal
- [x] En `/mi-perfil`: **no aparece el ícono de editar** (lápiz al lado del avatar)
- [x] Entrando por URL directa a `/mi-perfil/editar` sin conexión: no aparecen los botones de foto ni el de guardar, y avisa *"Sin conexión: no podés editar tu perfil."*
- [x] Volver online → el ícono y el botón de guardar vuelven, y guardar persiste

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
- [x] Racha de 7 días → +30 XP (🔥)
- [ ] Después de salvar la racha en 🛟, mirar en Supabase que `habits.streak_grace_used_month` quedó en `2026-07`

> Si 📉 te aparece con racha 4 y al completarlo sube a 5, o si en 🛟/💔 no ves el punto rojo, es que el sync no corrió: volvé al punto 0. El decaimiento y la oferta de gracia **solo** pasan dentro de ese sync.

### Caso híbrido: diario + cantidad de días por semana

Dos hábitos, los dos "4 días por semana", misma frecuencia, historial distinto:

| Hábito | Semana cerrada (20 al 26-07) | Esta semana (27 y 28) | Racha esperada |
|---|---|---|---|
| **TEST 4x semana OK** 🚴 | 4 de 4 ✅ | 2 | **6** (2 + 4) |
| **TEST 4x semana cortada** 🛼 | 2 de 4 ❌ | 2 | **2** (solo esta semana) |

- [x] Las rachas arrancan en 6 y 2 respectivamente
- [x] Completar hoy cada uno → **+1** en cada racha (7 y 3): suma por día completado
- [x] La semana cerrada que no llegó a la cuota es la única que corta la racha (🛼), la semana en curso nunca resta

---

## 3. Comunidades

Comunidad **TEST racha comunitaria** 🔥, hábito *Tomar 2 litros de agua* 💧: racha **3** (26, 27 y 28-07 completados por `larabtv`, único miembro). El 25-07 quedó libre a propósito.

- [x] **Sumar un miembro nuevo no corta la racha histórica**: agregá a `laracrupnicoff` desde el detalle → borrá `lastCommunityStreakSync_f9c70bfa-2954-452b-b5e1-627056006b41` → recargá la home → la racha **sigue en 3**
- [x] **Completar el hábito comunitario en un día pasado**: desde el DateNavigator elegí el **25-07** y completá → el log queda en el 25, no en hoy (verificable en `community_habit_logs`), y la racha pasa a 4

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
