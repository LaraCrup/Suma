# CLAUDE.md

Guía para Claude Code y futuros desarrolladores que trabajen en este proyecto. Mantenerla actualizada cuando cambien convenciones, estructura o decisiones de arquitectura.

## 1. Resumen del proyecto

**Suma** es una PWA mobile-only para formar hábitos, con gamificación (XP, niveles, rachas), comunidades con hábitos compartidos, sistema de amigos y un feed de novedades de marcas aliadas.

- Idioma: español en rutas, UI y mensajes al usuario. Identificadores de código en inglés. **El código no lleva comentarios**: lo no obvio se documenta en este archivo.
- Solo mobile: viewport ≤ 768px. En desktop se muestra una pantalla bloqueante — ver [app/components/MobileOnlyScreen.vue](app/components/MobileOnlyScreen.vue).
- Zona horaria del dominio: **Argentina**. Todas las fechas que se comparan con `habit_logs.date` deben obtenerse con `getArgentineDate()` (ver `useHabits`).

## 2. Stack

- **Nuxt 4** (`^4.1.3`) con `srcDir: 'app/'` — ver [nuxt.config.ts](nuxt.config.ts)
- **Vue 3** + Composition API (`<script setup>`)
- **JavaScript** (sin TypeScript en código fuente; `tsconfig.json` solo referencia los autogenerados de `.nuxt/`)
- **Pinia** (`@pinia/nuxt`) para estado global
- **Supabase** (`@nuxtjs/supabase`) para auth y queries desde el cliente
- **Tailwind CSS** (`@nuxtjs/tailwindcss`) + CSS global en [app/assets/css/main.css](app/assets/css/main.css)
- **`@nuxt/fonts`** — fuente Montserrat Alternates
- **`@nuxt/image`** — `<NuxtImg>` para imágenes
- **`@vite-pwa/nuxt`** — PWA con service worker, manifest, workbox caching y soporte offline
- **Package manager**: npm

## 3. Comandos

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo en `http://localhost:3000` |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run generate` | Generación estática |
| `npm start` | `git pull origin main && npm i && nuxt dev --open` |

No hay scripts de lint ni de test configurados.

## 4. Variables de entorno

Crear `.env` en la raíz a partir de [.env.example](.env.example):

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `VAPID_PUBLIC_KEY` — clave pública VAPID para Web Push (generar con `npx web-push generate-vapid-keys`)
- `VAPID_PRIVATE_KEY` — clave privada VAPID (solo usada en el servidor/edge para enviar notificaciones)
- `VAPID_SUBJECT` — contacto VAPID, ej. `mailto:tu@email.com`

`VAPID_PUBLIC_KEY` se expone al cliente vía `runtimeConfig.public.vapidPublicKey` en [nuxt.config.ts](nuxt.config.ts).

## 5. Estructura del proyecto

```
app/
├── app.vue                  # Root: MobileOnlyScreen > Splash > NuxtLayout > NuxtPage
├── error.vue                # Página 404
├── assets/css/main.css      # Reset CSS + grid layout (header / main / nav)
├── layouts/
│   ├── default.vue          # DefaultHeader + DefaultMain + DefaultNav (pantallas con sesión)
│   └── auth.vue             # AuthHeader + DefaultMain (login/registro/recuperación)
├── pages/                   # Routing file-based (en español)
├── components/              # Agrupados por dominio (ver §11)
├── composables/             # Lógica de datos / Supabase queries (JS)
├── stores/                  # Pinia stores
├── plugins/                 # Plugins .client.js (splash, sync de hábitos)
├── constants/ROUTE_NAMES.js # Fuente de verdad de rutas
└── utils/                   # handleSupabaseError.js, getArgentineDate.js (auto-importados)
public/
├── favicon.ico, apple-touch-icon.png
└── images/                  # isotipo, logos, íconos de nav, tips, habitsCategories, etc.
supabase/
├── functions/               # Edge Functions (Deno): daily-habit-reminder, notify-community-message
└── migrations/              # SQL: push_subscriptions + cron de recordatorios (pg_cron)
nuxt.config.ts
tailwind.config.js
```

## 6. Routing (file-based, en español)

Importar siempre desde [app/constants/ROUTE_NAMES.js](app/constants/ROUTE_NAMES.js) en vez de hardcodear paths.

**Rutas públicas** (excluidas del redirect de Supabase en [nuxt.config.ts](nuxt.config.ts)):

- `/iniciar-sesion`, `/registrarse`
- `/restablecer-contrasena`, `/restablecer-contrasena-confirmacion`
- `/confirmar-cuenta`, `/nueva-contrasena`
- `/contrasena-actualizada` — confirmación post-reset de contraseña

**Rutas autenticadas principales**:

- `/` — Mis hábitos (home) — [app/pages/index.vue](app/pages/index.vue)
- `/mis-habitos/crear`, `/mis-habitos/editar/[id]`, `/mis-habitos/[id]`
- `/progreso`, `/progreso/beneficios/[id]`
- `/comunidades`, `/comunidades/crear` (3 pasos), `/comunidades/[id]/{index,detalle,habito}`
- `/novedades`, `/novedades/[id]`
- `/amigos`, `/usuarios/[id]`
- `/mi-perfil`, `/mi-perfil/editar`, `/mi-perfil/cambiar-contrasena`

El módulo `@nuxtjs/supabase` redirige a `/iniciar-sesion` cualquier ruta no excluida si no hay sesión.

## 7. Capa de datos (Supabase)

Toda la lógica de datos vive en **composables** ([app/composables/](app/composables/)). No hay `server/api/` ni endpoints propios en Nuxt; lo único server-side son dos **Edge Functions** de Supabase (ver §17).

**Tablas usadas** (inferidas del código):

| Tabla | Campos clave |
|---|---|
| `profiles` | `id`, `email`, `name`, `display_name`, `avatar_url`, `experience_points`, `current_level` |
| `habits` | `user_id`, `name`, `icon`, `when_where`, `identity`, `unit`, `goal_value`, `frequency_type`, `frequency_option`, `frequency_detail`, `streak`, `longest_streak`, `reminder_enabled`, `streak_grace_used_month` |
| `habit_logs` | `habit_id`, `date`, `value`, `completed` |
| `communities` | `id`, `name`, `icon`, `created_by` |
| `community_members` | `community_id`, `user_id`, `role` (`admin`/`member`) |
| `community_habits` | `community_id`, mismos campos que `habits` (sin `user_id`). Desde jul-2026 `frequency_option` guarda las claves canónicas (`todos`, `dias_especificos_semana`, etc.); filas anteriores pueden tener la etiqueta de UI vieja (ej. "Días específicos de la semana (L, M)") — nada las lee hoy. |
| `community_habit_logs` | logs de completions de hábitos comunitarios por miembro |
| `community_messages` | mensajes del chat interno de cada comunidad |
| `friend_requests` | `sender_id`, `receiver_id`, `status` |
| `news` | `title`, `content`, `image_url`, `publication_date`, `brand_id`, `category_id`, `status` |
| `news_categories` | `id`, `name` |
| `levels` | `level_number`, `xp_required` |
| `benefits` | beneficios desbloqueables mostrados en `/progreso` |
| `xp_actions` | `action_key` (PK), `xp_value`, `active` — acciones de XP. Ver §16 para la lista completa. |
| `push_subscriptions` | `user_id`, `endpoint`, `p256dh`, `auth` — suscripciones Web Push por usuario/dispositivo. PK compuesta `user_id + endpoint`. |

**Errores de Supabase**: pasarlos siempre por [`handleSupabaseError()`](app/utils/handleSupabaseError.js) — traduce los mensajes a español.

## 8. Composables (lógica de dominio)

- [useHabits.js](app/composables/useHabits.js) — CRUD de hábitos, logs por fecha, rachas, `syncHabitsWithNewDay`, `shouldShowHabitForDate`, `getArgentineDate`, y la gracia de rachas (`updateStreakForNewDay`, `isPeriodStillMissed`, `applyStreakGrace`, `declineStreakGrace`). Es el composable más grande (~1000 líneas) y concentra toda la lógica de fechas y streaks. **La cadencia de la racha (cada cuánto suma +1) se determina SOLO por `frequency_type`** (helpers `getStreakCadence`/`getGraceBreakMode`/`getPeriodBounds`/`getPeriodQuota`/`calculateStreakUpTo`); ver §14.
- [useExperience.js](app/composables/useExperience.js) — XP, niveles, milestones. Funciones de otorgamiento: `grantXP`, `checkStreakMilestone`, `checkAllHabitsDaily`, `checkFirstHabitCreated`, `checkWeeklyGoalMet`, `checkComeback`. Funciones de revocación: `revokeXP`, `revokeAllHabitsDaily`, `revokeWeeklyGoalXP`. Registra y consulta acciones en `xp_actions`.
- [useCommunities.js](app/composables/useCommunities.js) — comunidades, hábitos compartidos, logs comunitarios, chat (`community_messages`) y completions por miembro. Incluye `recordCommunityJoin(communityId)` para otorgar XP la primera vez que el usuario visita una comunidad (con guard en localStorage).
- [useFriends.js](app/composables/useFriends.js) — búsqueda de usuarios, solicitudes y lista de amigos. `acceptFriendRequest` otorga XP; `removeFriend` lo revoca.
- [useNovedades.js](app/composables/useNovedades.js) — feed de novedades (`status = 'approved'`) y categorías.
- [useNotification.js](app/composables/useNotification.js) — wrapper sobre `console.*`. Stub para una capa futura de notificaciones in-app.
- [usePullToRefresh.js](app/composables/usePullToRefresh.js) — singleton a nivel de módulo para el pull-to-refresh. Cada página registra su recarga con `registerRefresh(fn)` en `onMounted`; `DefaultMain` maneja el gesto táctil y llama `triggerRefresh()`. Al navegar, la página nueva pisa el callback anterior.
- [useOnlineStatus.js](app/composables/useOnlineStatus.js) — expone `isOnline` (ref reactivo) usando `navigator.onLine` y los eventos `online`/`offline` de `window`. Usado por `OfflineBanner`.
- [usePushNotifications.js](app/composables/usePushNotifications.js) — gestiona suscripciones Web Push. Expone `isSupported`, `permission`, `isSubscribed`, `isLoading`, `subscribe()`, `unsubscribe()`, `checkSubscription()`. Persiste las suscripciones en la tabla `push_subscriptions` de Supabase. Usa `config.public.vapidPublicKey` para la clave del applicationServerKey.

**Patrón**: cada composable llama a `useSupabaseClient()` adentro y expone funciones `async`. Los que requieren sesión definen un helper interno `getUserId()` que tira si no hay sesión.

## 9. Stores (Pinia)

- [authStore.js](app/stores/authStore.js) — `user`, `profile`, `loading`, `error`, `isLoggedIn`, `fetchUser`, `updateProfile`, `logout`.
- [habitStore.js](app/stores/habitStore.js) — estado efímero durante el wizard de creación de hábito (`selectedHabit`, `isCustom`).
- [splashStore.js](app/stores/splashStore.js) — visibilidad del splash inicial.
- [xpNotificationStore.js](app/stores/xpNotificationStore.js) — cola de notificaciones de XP. `enqueue(xpAmount, actionKey)` **batchea** los XP ganados en una ventana de 1.5 s y los muestra como un solo toast (el label sale del `actionKey` de mayor prioridad); `enqueueLevelUp(level)` encola el toast de subida de nivel. Procesa una notificación por vez; `dismiss()` muestra la siguiente. Solo `grantXP` encola (las revocaciones no muestran toast).

> No hay `streakGraceStore`: la gracia de rachas se maneja con guards en localStorage y su UI vive en la página de detalle del hábito (ver §14).

## 10. Plugins (client-only)

- [plugins/splash.client.js](app/plugins/splash.client.js) — oculta el splash a los 2.5 s o al primer cambio de ruta.
- [plugins/habitSync.client.js](app/plugins/habitSync.client.js) — en `visibilitychange` (vuelta del background) llama a `syncHabitsWithNewDay()` y `checkComeback()`.
- [plugins/pushNotifications.client.js](app/plugins/pushNotifications.client.js) — observa `useSupabaseUser()` y, cuando el usuario se autentica, llama a `checkSubscription()` y auto-suscribe al push si tiene permiso y no estaba suscripto.

## 11. Componentes

Nuxt 4 autoimporta los componentes y los **prefija con el nombre de la carpeta**. Hay que tenerlo presente al consumirlos en plantillas:

| Archivo | Uso en template |
|---|---|
| `components/heading/H1.vue` | `<HeadingH1>` |
| `components/heading/H2.vue` | `<HeadingH2>` |
| `components/form/TextField.vue` | `<FormTextField>` |
| `components/form/TextFieldSecondary.vue` | `<FormTextFieldSecondary>` |
| `components/form/PasswordField.vue` | `<FormPasswordField>` |
| `components/form/Switch.vue` | `<FormSwitch>` |
| `components/form/Counter.vue` | `<FormCounter>` |
| `components/form/Options.vue` | `<FormOptions>` |
| `components/form/OptionInput.vue` | `<FormOptionInput>` |
| `components/form/Label.vue` | `<FormLabel>` |
| `components/form/LabelSecondary.vue` | `<FormLabelSecondary>` |
| `components/form/Layout.vue` | `<FormLayout>` |
| `components/form/FieldsContainer.vue` | `<FormFieldsContainer>` |
| `components/form/Error.vue` | `<FormError>` |
| `components/form/Delete.vue` | `<FormDelete>` |
| `components/habits/Card.vue` | `<HabitsCard>` |
| `components/habits/CommunityCard.vue` | `<HabitsCommunityCard>` |
| `components/habits/DateNavigator.vue` | `<HabitsDateNavigator>` |
| `components/habits/Default.vue` | `<HabitsDefault>` |
| `components/habits/Details.vue` | `<HabitsDetails>` |
| `components/habits/Form.vue` | `<HabitsForm>` |
| `components/habits/NewDefault.vue` | `<HabitsNewDefault>` |
| `components/default/Section.vue` | `<DefaultSection>` |
| `components/community/Card.vue` | `<CommunityCard>` |
| `components/community/Header.vue` | `<CommunityHeader>` |
| `components/community/chat/InputMessage.vue` | `<CommunityChatInputMessage>` |
| `components/community/chat/OutputMessage.vue` | `<CommunityChatOutputMessage>` |
| `components/community/friends/Card.vue` | `<CommunityFriendsCard>` |
| `components/community/friends/CardAdd.vue` | `<CommunityFriendsCardAdd>` |
| `components/community/friends/Member.vue` | `<CommunityFriendsMember>` |
| `components/community/friends/Request.vue` | `<CommunityFriendsRequest>` |
| `components/navigation/backArrow.vue` | `<NavigationBackArrow>` |
| `components/skeleton/HabitCard.vue` | `<SkeletonHabitCard>` |
| `components/skeleton/CommunityCard.vue` | `<SkeletonCommunityCard>` |
| `components/skeleton/CommunityHabitCard.vue` | `<SkeletonCommunityHabitCard>` |
| `components/skeleton/FriendCard.vue` | `<SkeletonFriendCard>` |
| `components/skeleton/NewsCard.vue` | `<SkeletonNewsCard>` |
| `components/skeleton/ProgresoDashboard.vue` | `<SkeletonProgresoDashboard>` |
| `components/skeleton/TipCard.vue` | `<SkeletonTipCard>` |
| `components/progress/Bar.vue` | `<ProgressBar>` |
| `components/auth/Header.vue` | `<AuthHeader>` |

**Carpetas existentes**: `auth/`, `benefits/`, `button/` (Primary/Secondary/Terciary), `community/` (+ `chat/`, `friends/`), `default/` (Header/Main/Nav/Section), `form/`, `habits/`, `heading/`, `navigation/`, `progress/`, `skeleton/`.

**Top-level**: `Avatar`, `Loader`, `MobileOnlyScreen`, `OfflineBanner`, `Splash`, `XpNotification`.

`XpNotification` se monta en [layouts/default.vue](app/layouts/default.vue) (posición `fixed top-8 right-4 z-[9999]`). Lee del `xpNotificationStore` y se auto-descarta a los 5 segundos. Muestra `+ N XP` (batchea gains dentro de una ventana de 1.5 s) y toasts de level-up. Las revocaciones (`revokeXP`) NO encolan toast actualmente.

`OfflineBanner` también se monta en [layouts/default.vue](app/layouts/default.vue). Usa `useOnlineStatus` y muestra un banner "Sin conexión — mostrando datos guardados" cuando `isOnline` es `false`.

La gracia de rachas ("Salvar racha") ya **no** es un componente/modal propio: su UI vive en la página de detalle del hábito [mis-habitos/[id].vue](app/pages/mis-habitos/[id].vue) (`checkStreakSavePending`, botones "Salvar racha"/"Perder racha") y `HabitsCard` muestra un punto rojo de "racha en riesgo". Ver §14.

## 12. Estilos y theme

Configuración en [tailwind.config.js](tailwind.config.js).

**Breakpoints** (mobile-first, custom):

- `sm: 400px`, `md: 480px`, `lg: 660px`, `xl: 768px`, `2xl: 992px`

**Paleta**:

- `primary: #157A6E`, `accent: #D7F560`
- `green.light: #499F68`, `green.dark: #12534C`
- `light: #F3FCF7`, `midlight: #E9F3ED`, `dark: #131815`
- `gray: #999999`, `error: #C24848`

**Gradientes**: `bg-gradient-primary`, `bg-gradient-primary-horizontal`, `bg-gradient-primary-horizontal-reverse`, `bg-gradient-secondary`.

**Fuente**: `font-montserrat` (Montserrat Alternates). El reset global en [main.css](app/assets/css/main.css) usa Quicksand como fallback.

**Layout**: la app entera vive en un grid `header | main | nav` definido en [main.css](app/assets/css/main.css). Los layouts deben respetar la composición `DefaultHeader` + `DefaultMain` + `DefaultNav`.

## 13. Convenciones del proyecto

- **Idioma**: rutas, variables de UI y mensajes al usuario en español. Identificadores de código en inglés.
- **Sin comentarios en el código**: decisión del proyecto (jul-2026). No agregar comentarios nuevos; el conocimiento no obvio va en este archivo.
- **Vue**: solo Composition API con `<script setup>`. La única excepción actual es [button/Primary.vue](app/components/button/Primary.vue), que aún usa `export default { props }`.
- **Rutas**: importar `ROUTE_NAMES` desde [app/constants/ROUTE_NAMES.js](app/constants/ROUTE_NAMES.js). No hardcodear strings de rutas.
- **Errores de Supabase**: pasar siempre por [`handleSupabaseError()`](app/utils/handleSupabaseError.js).
- **Fechas**: usar `getArgentineDate()` ([app/utils/getArgentineDate.js](app/utils/getArgentineDate.js), auto-importado) para cualquier fecha que se compare con `habit_logs.date`. **Nunca** usar `new Date()` ni `toISOString()` para fechas-calendario: `toISOString()` es UTC y en Argentina (UTC−3) corre el día a partir de las 21:00. Para formatear un `Date` local a `YYYY-MM-DD` usar componentes locales (`getFullYear/getMonth/getDate`), como hace `getDateString()` en `useHabits`.
- **Fuente de verdad del progreso diario**: `habit_logs.value` (no `habits.progress_count`): nunca se pisa con el reset diario.
- **Strings de variantes de frecuencia**: al comparar etiquetas como "Días específicos de la semana" hay que **normalizar acentos** (`.normalize('NFD').replace(/[̀-ͯ]/g, '')`) — ya hubo un bug donde los pickers de días no aparecían por comparar con/sin tilde (`OptionInput`, `habits/Form`, `crear/paso3`).
- **Mobile-only**: si desarrollás UI, testeala en viewport ≤ 768px — en desktop la app muestra una pantalla bloqueante.
- **Skeletons**: usar los de [components/skeleton/](app/components/skeleton/) mientras `isLoading` para evitar layout shift.

## 14. Notas no obvias

- **Login por username, no por email**: el formulario de [iniciar-sesion.vue](app/pages/iniciar-sesion.vue) pide `username`, busca el `email` correspondiente en `profiles.display_name` y luego hace `signInWithPassword` con ese email. Cuando agregues flujos de auth recordá este indirect.
- **Re-sync de hábitos**: la home corre `syncHabitsWithNewDay()` al montarse, en cada `visibilitychange` y en un `setInterval` que detecta cambio de día — ver el `onMounted` de [pages/index.vue](app/pages/index.vue). No remover sin entender por qué está.
- **Sin tipos de Supabase**: `supabase.types: false` en [nuxt.config.ts](nuxt.config.ts). El proyecto es JS puro; no asumir tipos generados del esquema.
- **PWA con soporte offline**: la app usa `@vite-pwa/nuxt` con workbox para cachear assets y respuestas de red. `OfflineBanner` informa al usuario cuando pierde conexión. El manifest y los shortcuts de app están configurados en [nuxt.config.ts](nuxt.config.ts). El viewport está bloqueado a `user-scalable=no` y declara `apple-mobile-web-app-capable`.
- **`navigateFallback: null` en el PWA (no tocar)**: la app es SSR en Vercel, no hay app shell precacheado. El default de `@vite-pwa/nuxt` (`navigateFallback: '/'`) hace que el SW tire `non-precached-url` y las navegaciones terminen en 404 (visible en iOS Safari). La key debe quedar presente y en `null` (no `false`, no borrarla: el módulo la re-inyecta como `'/'`).
- **Guard de `Notification` en iOS**: en Safari/Chrome de iOS (navegador, no PWA instalada) la API `Notification` NO existe. Cualquier acceso debe chequear `'Notification' in window` primero (ver `usePushNotifications`); sin el guard, la hidratación crashea y la app cae a error.vue (404).
- **Fechas Argentina**: `getArgentineDate()` vive en [app/utils/getArgentineDate.js](app/utils/getArgentineDate.js) (auto-importado) y también se re-exporta desde `useHabits`.
- **Frases y tips diarios**: se eligen al azar al iniciar la sesión y se cachean en `sessionStorage` (`sessionPhrase`, `sessionTip`). Se limpian al cerrar sesión.
- **RLS de comunidades**: al crear una comunidad, [useCommunities.createCommunity](app/composables/useCommunities.js) hace el `insert` sin `.select()` y luego una `select` separada — workaround para evitar el RLS de `SELECT` antes de ser miembro.
- **Swipe en cards de hábitos**: `HabitsCard` y `HabitsCommunityCard` implementan swipe táctil para completar/descompletar hábitos. Lógica de `touchstart`/`touchend` con animación de fill. No romper la dirección del swipe al modificar el layout de las cards.
- **DateNavigator bloqueado a la semana actual**: `HabitsDateNavigator` solo muestra los últimos 7 días hasta hoy. No navega hacia semanas anteriores ni permite seleccionar fechas futuras. Cada día tiene un arco de progreso circular calculado contra los hábitos del día.
- **Realtime en comunidades**: la página [`/comunidades/[id]/`](app/pages/comunidades/[id]/index.vue) usa Supabase Realtime (`client.channel()`) para escuchar cambios en `community_messages` y `community_habit_logs` en tiempo real. El canal se limpia en `onUnmounted`.
- **Cadencia de la racha por `frequency_type` (regla de oro)**: hay 3 frecuencias (`diario`/`semanal`/`mensual`) y sus opciones (`todos`, `dias_especificos_semana/mes`, `cantidad_dias_semana/mes`) **se repiten entre frecuencias**, así que la cadencia del +1 se decide SOLO por el `type`, **nunca** por la opción (helpers `getStreakCadence`/`getGraceBreakMode`/`getPeriodBounds`/`getPeriodQuota`). `diario` ⇒ +1 por cada día completado; `semanal`/`mensual` ⇒ +1 al cumplir la meta del período. La opción define el calendario/meta (qué días aplica y cuántos), no la cadencia. **Caso híbrido**: un hábito **diario** con `cantidad_dias_semana` (ej. 5×/semana) suma +1 por completado y **solo pierde la racha si una semana ya cerrada no llegó a la cuota** (la semana en curso siempre aporta; `calculateStreakUpTo` implementa el conteo). `shouldShowHabitForDate` también respeta la opción en diario (`días específicos` aparece solo esos días; `cantidad` hasta cumplir la meta). **No existe el valor `flexible`.**
- **Sistema de gracia de rachas ("Salvar racha")**: `updateStreakForNewDay()` (dentro de `syncHabitsWithNewDay`) detecta cuando la última unidad (día programado, o período cerrado para semanal/mensual/`cantidad`) quedó sin cumplir. Si la racha estaba viva (**hueco de exactamente 1 unidad**, `streak > 0`) y la gracia del mes está disponible (`streak_grace_used_month !== mesActual`), encola la oferta en localStorage (`streakGracePending_{id}`); si el hueco es mayor, resetea la racha sin ofrecer. **La UI vive en la página de detalle del hábito** [mis-habitos/[id].vue](app/pages/mis-habitos/[id].vue) (`checkStreakSavePending`, botones "Salvar racha"/"Perder racha"); `HabitsCard` muestra un punto rojo de "en riesgo" y re-chequea con `isPeriodStillMissed` (no solo la existencia de la key). `applyStreakGrace(habitId)` marca `streak_grace_used_month`, mantiene la racha y **sella** la unidad salvada (`streakGraceForgiven_{id}`) para que el próximo sync no la resetee. `declineStreakGrace(habitId)` resetea la racha a 0. **La gracia se consume una sola vez por mes por hábito.** (Ya NO existe `streakGraceStore` ni el componente modal `StreakGrace`; fueron reemplazados por este flujo.)
- **Push Notifications (Web Push)**: el plugin `pushNotifications.client.js` auto-suscribe al push al autenticarse. El composable `usePushNotifications` persiste las suscripciones en `push_subscriptions`. El service worker `app/sw.js` maneja `push` y `notificationclick`; está importado como `/sw-push.js` vía `workbox.importScripts` en [nuxt.config.ts](nuxt.config.ts). Requiere las tres vars VAPID en el `.env`. El usuario puede activar/desactivar las notificaciones desde [mi-perfil](app/pages/mi-perfil/index.vue) con el `FormSwitch` de push.
- **Chat de comunidades**: `CommunityChatInputMessage` muestra mensajes recibidos de otros miembros; `CommunityChatOutputMessage` muestra los propios. Ambos viven en `components/community/chat/`.
- **Des/completar días pasados y la racha**: el DateNavigator permite tocar días anteriores de la semana. En `logHabitProgress`, tanto completar como descompletar un día pasado recalculan la racha con `calculateStreakUpTo` anclada en el **último día realmente completado** (cadencia diaria) o en el período actual/anterior según si cumplió su cuota (semanal/mensual). No volver al ancla "día anterior al tocado": ignora completados posteriores al hueco.
- **Avatares en Storage**: `profiles.avatar_url` es una **signed URL** con `?token=...`. Para derivar el path del bucket (`avatar/{userId}/{fileName}`) hay que sacar el query string y `decodeURIComponent` (ver `deleteAvatar`/`handleSave` en [mi-perfil/editar.vue](app/pages/mi-perfil/editar.vue)). Al borrar o reemplazar la foto se elimina el archivo del bucket para no dejar huérfanos.
- **Caché de Novedades**: [novedades/index.vue](app/pages/novedades/index.vue) cachea categorías + noticias en `sessionStorage` (`novedades_last_fetch`, TTL 5 min) **incluyendo los datos**, no solo el timestamp — si se guarda solo el timestamp, al remontar la página los refs quedan vacíos y se ven skeletons infinitos. El pull-to-refresh fuerza recarga.

## 15. Cómo verificar cambios

No hay test suite. Para validar:

1. `npm run dev` y probar el flujo en el navegador con DevTools en viewport mobile (≤ 768 px).
2. Para cambios de auth, probar login + redirect + logout.
3. Para cambios en hábitos, probar: crear, loggear progreso, completar, simular cambio de día (visibility change o esperar el interval), borrar.
4. Revisar la consola del navegador — el código loguea bastante (`[HABIT SYNC]`, `[PAGE INDEX]`, `[XP]`, etc.).

## 16. Sistema de XP

### Acciones en la BD (`xp_actions`)

| `action_key` | XP | Se otorga cuando… | Se revoca cuando… |
|---|---|---|---|
| `habit_completed` | 10 | Hábito pasa a completado (swipe derecho) | Hábito pasa a no completado (swipe izquierdo) |
| `streak_7` | 30 | Racha de un hábito llega a 7 días | — |
| `streak_14` | 50 | Racha llega a 14 días | — |
| `streak_30` | 100 | Racha llega a 30 días | — |
| `streak_60` | 200 | Racha llega a 60 días | — |
| `streak_100` | 400 | Racha llega a 100 días | — |
| `all_habits_daily` | 20 | Se completan TODOS los hábitos del día (una vez/día, guard en localStorage `lastAllHabitsDailyXP`) | Cualquier hábito se descompletea ese día |
| `weekly_goal_met` | 25 | Todos los hábitos semanales cumplen su meta (una vez/semana; guard en localStorage `lastWeeklyGoalXP` = fecha del **lunes** de la semana actual en fecha argentina) | Cualquier hábito semanal se descompletea bajo la meta |
| `first_habit_created` | 15 | El usuario crea su primer hábito (guard en localStorage `firstHabitXP_{userId}` para que no se re-gane borrando y recreando hábitos) | — |
| `comeback` | 5 | El usuario vuelve tras 3+ días de inactividad (una vez/sesión, guard en localStorage `lastComebackCheck`) | — |
| `community_habit_completed` | 8 | Usuario completa el hábito de una comunidad | Usuario descompletea el hábito comunitario |
| `create_community` | 30 | Usuario crea una comunidad | — |
| `join_community` | 15 | Usuario visita una comunidad por primera vez (guard en localStorage `joined_community_{id}`) | — |
| `friend_added` | 10 | Usuario acepta una solicitud de amistad | Usuario elimina un amigo |

### Flujo técnico

- `grantXP(actionKey)` y `revokeXP(actionKey)` en [useExperience.js](app/composables/useExperience.js) son el punto de entrada único. Ambos actualizan `profiles.experience_points` y `profiles.current_level` y sincronizan el `authStore`; solo `grantXP` encola una notificación en `xpNotificationStore`.
- Las notificaciones se muestran en [XpNotification.vue](app/components/XpNotification.vue): `+ N XP` para ganancias y aviso de level-up. Se descartan automáticamente a los 5 segundos.
- Los milestones de racha (`streak_7` … `streak_100`) se verifican con `checkStreakMilestone(streak)` — nunca se revocan aunque se pierda la racha.
- Los guards de "una vez por día/semana" usan `localStorage`; si se revoca el bono, se limpia el guard para que pueda re-ganarse. Limitación conocida: al ser por dispositivo, no protegen entre dispositivos distintos.

## 17. Supabase server-side (Edge Functions y migrations)

- [supabase/functions/daily-habit-reminder](supabase/functions/daily-habit-reminder/index.ts) — envía un Web Push recordatorio a **todas** las suscripciones de `push_subscriptions`. La dispara un cron de `pg_cron` a las 01:00 UTC (22:00 ARG) — ver [supabase/migrations/20260524_pg_cron_reminder.sql](supabase/migrations/20260524_pg_cron_reminder.sql); al aplicarla hay que reemplazar `<PROJECT_REF>` y `<SERVICE_ROLE_KEY>` a mano en el SQL Editor (requiere extensiones `pg_cron` y `pg_net`).
- [supabase/functions/notify-community-message](supabase/functions/notify-community-message/index.ts) — la dispara un **Database Webhook** en el INSERT de `community_messages`; manda push a todos los miembros de la comunidad menos el emisor.
- Ambas usan las vars `VAPID_*` y `SUPABASE_SERVICE_ROLE_KEY` como secrets de la función (no van en el `.env` del front).
- [supabase/migrations/20260524_push_subscriptions.sql](supabase/migrations/20260524_push_subscriptions.sql) — tabla `push_subscriptions` con RLS (cada usuario ve/inserta/borra solo las suyas).
