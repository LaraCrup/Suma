# Checklist pendiente — Suma

Solo lo que falta testear. Lo ya marcado como OK vive en [CHECKLIST.md](CHECKLIST.md) y no se toca.

Armada el 29-07-2026. **Los datos de `larabtv` están fechados para testear el 30-07-2026** (ayer = 29-07). Si lo dejás para más adelante, avisame y los recorro de nuevo.

---

## 0. Antes de empezar ⚠️ *el 30-07, con el día nuevo*

Todo el bloque de rachas depende de `syncHabitsWithNewDay`, y `shouldResetToday` lo corre **una sola vez por día** y solo si se cumplen dos condiciones:

1. `lastHabitResetDate_{userId}` en localStorage ≠ hoy, **y**
2. que **no exista ni un solo `habit_log` de hoy** para esa cuenta — ni siquiera uno con `value: 0` / `completed: false`, que es justo lo que queda cuando completás y descompletás un hábito.

El 29 se rompió por (2): había cuatro logs del día (los tres completados de 🔥 🚴 🛼 más un `value: 0` de 📉), así que el sync se saltó todo el día y por eso no salió el punto rojo ni bajaron las rachas. El 30 arranca limpio, así que **no hay que borrar nada de localStorage**: solo respetar el orden.

Con `larabtv` logueada, el 30-07:

1. **Primero abrir la home (`/`) sin completar nada.** En la consola tiene que aparecer `[HABIT SYNC]`.
2. Mirar la home antes de tocar cualquier hábito y anotar lo que ves:
   - 🛟 **TEST salvar racha** y 💔 **TEST perder racha** → **punto rojo** en la card (racha en riesgo)
   - 🚫 **TEST gracia ya usada** y 📉 **TEST 2 dias sin completar** → racha en **0**, sin punto rojo
3. Recién después, hacer los tests del punto 2.

> **Esto es lo que estamos verificando.** Si el 30 ves ese estado, quedó confirmado que lo del 29 era solo el guard del sync y no hay nada roto.
> Si en cambio 📉 vuelve a aparecer con racha **4** y al completarlo salta a **5**, entonces sí hay un bug aparte: `logHabitProgress` hace `streak + 1` sobre el valor que hay en la base sin chequear que el día anterior esté cumplido, así que infla una racha ya cortada. Tengo el fix identificado (validar la continuidad de la unidad anterior antes de sumar) y lo aplico cuando me digas.

**Hoy 29 no toques los hábitos `TEST …`**: si completás alguno, queda un log del 29 y mañana el 29 pasa a ser "el día de ayer, cumplido" → desaparece el hueco y ya no hay nada que salvar.

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

> Resultado en la base después de tu prueba, por si lo querés para la defensa: en **TEST salir siendo admin** el rol cayó en `lara.davinci`, que quedó como `admin` y además con el `created_by` transferido (o sea que puede eliminar la comunidad). **TEST salir siendo miembro** ya no existe: al quedarse con un solo miembro y salir, se eliminó sola.

### Offline: bloqueo de escrituras

Modo avión o DevTools → Network → Offline.

- [ ] En una comunidad: el input del chat queda **deshabilitado**, **desaparece el botón de enviar** y avisa en **rojo** *"Sin conexión: no podés enviar mensajes."*
- [x] Volver online → el input se habilita y el mensaje se envía normal
- [x] En `/mi-perfil`: **no aparece el ícono de editar** (lápiz al lado del avatar)
- [x] Entrando por URL directa a `/mi-perfil/editar` sin conexión: no aparecen los botones de foto ni el de guardar, y avisa *"Sin conexión: no podés editar tu perfil."*
- [x] Volver online → el ícono y el botón de guardar vuelven, y guardar persiste

---

## 2. Fechas y rachas ⚠️ *lo más frágil*

Todos estos hábitos ya están cargados en `larabtv` con su historial, **fechados para el 30-07**. Hacer el punto 0 antes.

| Hábito | Estado que dejé (para el 30-07) | Qué tiene que pasar |
|---|---|---|
| **TEST salvar racha** 🛟 | racha 4, completado del 25 al 28, **el 29 sin hacer** | punto rojo en la card → detalle → **Salvar racha** mantiene la racha en 4 |
| **TEST perder racha** 💔 | igual que el anterior | detalle → **Perder racha** la manda a **0** |
| **TEST gracia ya usada** 🚫 | mismo hueco, pero la gracia de julio ya está consumida | **no** ofrece gracia: la racha va directo a 0 |
| **TEST 2 dias sin completar** 📉 | racha 4, completado del 23 al 26: sin hacer 27, 28 y 29 | hueco de 2+ días → **no** ofrece gracia, resetea directo a 0 (y si después lo completás, arranca en **1**) |
| **TEST racha 7** 🔥 | racha 6, completado del 24 al 29 | completar el **30** → racha 7 → toast **+30 XP** (`streak_7`) |

- [x] Salvar racha mantiene la racha (🛟)
- [x] La gracia no se puede usar dos veces en el mismo mes (🚫)
- [x] "Perder racha" la manda a 0 (💔)
- [x] 2+ días sin completar → no ofrece gracia, resetea directo (📉)
- [x] Racha de 7 días → +30 XP (🔥)
- [x] Después de salvar la racha en 🛟, mirar en Supabase que `habits.streak_grace_used_month` quedó en `2026-07`

### Caso híbrido: diario + cantidad de días por semana

Ya los validaste el 29 y **quedaron en el mismo estado inicial**, así que se pueden repetir tal cual el 30 (la semana en curso sigue siendo la del 27-07 al 02-08, así que las cuentas no cambian). Los dos son "4 días por semana", con historial distinto:

| Hábito | Semana cerrada (20 al 26-07) | Esta semana (27 y 28) | Racha esperada |
|---|---|---|---|
| **TEST 4x semana OK** 🚴 | 4 de 4 ✅ | 2 | **6** (2 + 4) |
| **TEST 4x semana cortada** 🛼 | 2 de 4 ❌ | 2 | **2** (solo esta semana) |

- [x] Las rachas arrancan en 6 y 2 respectivamente
- [x] Completar hoy cada uno → **+1** en cada racha (7 y 3): suma por día completado
- [x] La semana cerrada que no llegó a la cuota es la única que corta la racha (🛼), la semana en curso nunca resta

---

## 3. Comunidades

Los dos ítems ya los validaste el 29. Estado en el que quedó la comunidad **TEST racha comunitaria** 🔥, hábito *Tomar 2 litros de agua* 💧: racha **5**, con el 25, 26, 27, 28 y 29-07 completados por `larabtv`, que sigue siendo la **única** miembro. Como el 29 quedó completo, el 30 la racha sigue en 5 y se puede repetir el test de sumar miembro (agregar a `laracrupnicoff` o a `lara.davinci`) sin rearmar nada.

- [x] **Sumar un miembro nuevo no corta la racha histórica**: agregá a `laracrupnicoff` desde el detalle → borrá `lastCommunityStreakSync_f9c70bfa-2954-452b-b5e1-627056006b41` → recargá la home → la racha **sigue en 3**
- [x] **Completar el hábito comunitario en un día pasado**: desde el DateNavigator elegí el **25-07** y completá → el log queda en el 25, no en hoy (verificable en `community_habit_logs`), y la racha pasa a 4

---

## 4. Guards por usuario (`localStorage` con sufijo de userId)

- [x] Con la cuenta B (`larabtv`), verificar que el reset diario de hábitos corre normal
- [x] Volver a la cuenta A (`laracrupnicoff`) → su racha y su progreso siguen intactos

---

## 5. PWA y navegación

### Los 4 shortcuts del manifest — *fuera de alcance, no se testean*

Los shortcuts solo los levantan Android y Chrome de escritorio: **iOS los ignora**, así que no hay dispositivo a mano donde probarlos. Queda como no verificado a propósito, no como pendiente.

Lo que sí está chequeado es que el manifest los declara bien: en el build de producción (`.output/public/manifest.webmanifest`) salen los 4 con su `name`, `short_name`, `url` e ícono de 192×192 — Hábitos → `/`, Progreso → `/progreso`, Comunidades → `/comunidades`, Novedades → `/novedades`. Si en la defensa te preguntan, se ve en DevTools → Application → Manifest → Shortcuts.

### Pull-to-refresh

Es un gesto **táctil** (`touchstart`/`touchmove`/`touchend` en `DefaultMain`): con el mouse no pasa nada. Probalo en el celular, o en DevTools con el device toolbar (⌘⇧M), que emula touch.

Dos condiciones para que dispare: el `<main>` tiene que estar **scrolleado arriba de todo** y hay que arrastrar hacia abajo **80 px** (`THRESHOLD`). Mientras tirás aparece una flecha que rota; al soltar, el Loader.

Registran su recarga 6 páginas — probar una por una:

- [ ] `/` (Mis hábitos)
- [x] `/progreso`
- [x] `/comunidades`
- [x] `/amigos`
- [ ] `/novedades` (además tiene que saltear el caché de `sessionStorage`, TTL 5 min)
- [x] `/mi-perfil`
- [x] Negativo: en `/iniciar-sesion` y `/registrarse` **no** aparece la flecha (el layout `auth` pasa `pullToRefresh: false`)

Para confirmar que recargó de verdad y no solo animó: Network → tienen que salir requests nuevas a `supabase.co`. Si una página no refresca, lo más probable es que le falte el `registerRefresh(fn)` en su `onMounted` — es un singleton de módulo, la última página montada pisa el callback anterior.

### El splash

Arranca visible y se oculta a los **2,5 s** o en el primer cambio de ruta, lo que pase primero ([splash.client.js](app/plugins/splash.client.js)).

> ⚠️ **Estaba roto: el splash no salía nunca.** Nuxt hace `router.replace(rutaInicial, { force: true })` en el hook `app:created`, o sea **después** de correr los plugins y **antes** de montar la app. Esa navegación disparaba el `router.beforeEach` del plugin, así que `hideSplash()` corría antes del primer render y el splash nunca llegaba a pintarse. Arreglado ignorando la navegación inicial (`from === START_LOCATION`). Volver a testear.

- [ ] **Cold start** en la PWA instalada: cerrarla del multitarea (no solo minimizar) y abrirla desde el ícono → logo blanco + *"Pequeños pasos, grandes cambios."* por ~2,5 s
- [ ] En el navegador: recargar `/` → el splash aparece y se va solo a los 2,5 s
- [ ] Navegar a otra sección apenas abre → el splash se corta antes de los 2,5 s

> Volver a la app desde el multitarea (warm start) **no** muestra el splash: no hay remount, es correcto. En iOS, antes del splash de la app aparece el splash nativo del manifest: son dos pantallas distintas. Y si navegás apenas abre, se corta antes de los 2,5 s (lo apaga el `router.beforeEach`).

---

## 6. Pendiente que no depende del código

- [x] **Panel de administración (repo aparte)**: entrar como superadmin → sigue funcionando
- [x] **`useNotification` queda como está** (decidido el 30-07): se usa en 6 lugares (creación de hábito, registro, los 3 flujos de contraseña) y solo escribe en consola, pero esas 6 pantallas ya muestran su propio feedback al usuario, así que no hay nada roto de cara al usuario. No se conecta a los toasts ni se sacan las llamadas

> **Leaked Password Protection**: sacado de la lista. Es feature de **plan Pro** y la organización está en **free**, así que el toggle ni siquiera aparece en el dashboard. El warning `auth_leaked_password_protection` del linter de seguridad de Supabase va a seguir apareciendo y es esperable. Si en la defensa preguntan: el front ya chequea las contraseñas contra HaveIBeenPwned por su cuenta, así que la protección existe igual, del lado del cliente.

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
