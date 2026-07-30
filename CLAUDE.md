# CLAUDE.md

Guía para Claude Code y futuros desarrolladores que trabajen en este proyecto. Mantenerla actualizada cuando cambien convenciones, estructura o decisiones de arquitectura.

## 1. Resumen del proyecto

**Suma** es una PWA mobile-only para formar hábitos, con gamificación (XP, niveles, rachas), comunidades con hábitos compartidos, sistema de amigos y un feed de novedades de marcas aliadas.

- Idioma: español en rutas, UI y mensajes al usuario. Identificadores de código en inglés. **El código no lleva comentarios**: lo no obvio se documenta en este archivo.
- Mobile-first con soporte desktop (jul-2026): la app está diseñada para mobile pero es usable en cualquier viewport. En `lg` (≥660px) se agranda la tipografía base (`font-size: 106.25%` en `html`, ver [main.css](app/assets/css/main.css)); en `xl` (≥768px) el contenido de `<main>` se limita a 640px centrado; en `2xl` (≥992px) el grid pasa a layout desktop con el nav como sidebar izquierdo fijo (`w-64`) y el contenido vuelve a ancho completo (`max-w-none`). Ya **no** existe `MobileOnlyScreen` ni pantalla bloqueante en desktop.
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
├── app.vue                  # Root: Splash > NuxtLayout > NuxtPage
├── error.vue                # Página de error (usa el statusCode real, no solo 404)
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
└── utils/                   # handleSupabaseError.js, getArgentineDate.js, habitFrequency.js (auto-importados)
public/
├── favicon.ico, apple-touch-icon.png
└── images/                  # isotipo, logos, íconos de nav, tips, habitsCategories, etc.
server/
└── routes/                  # robots.txt.js y sitemap.xml.js (Nitro, origin-aware — ver §18)
supabase/
├── functions/               # Edge Functions (Deno): daily-habit-reminder, community-habit-reminder, notify-community-message
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
- `/comunidades`, `/comunidades/crear` (3 pasos), `/comunidades/[id]/{index,detalle,habito,editar-habito}`
- `/novedades`, `/novedades/[id]`
- `/amigos`, `/usuarios/[id]`
- `/mi-perfil`, `/mi-perfil/editar`, `/mi-perfil/cambiar-contrasena`

El módulo `@nuxtjs/supabase` redirige a `/iniciar-sesion` cualquier ruta no excluida si no hay sesión.

## 7. Capa de datos (Supabase)

Toda la lógica de datos vive en **composables** ([app/composables/](app/composables/)). No hay `server/api/` ni endpoints de datos propios en Nuxt (lo único en `server/routes/` son `robots.txt` y `sitemap.xml`, que no tocan Supabase — ver §18); lo server-side de datos son las **Edge Functions** de Supabase (ver §17).

**Tablas usadas** (inferidas del código):

| Tabla | Campos clave |
|---|---|
| `profiles` | `id`, `email`, `name`, `display_name`, `avatar_url`, `experience_points`, `current_level` |
| `habits` | `user_id`, `name`, `icon`, `when_where`, `identity`, `unit`, `goal_value`, `frequency_type`, `frequency_option`, `frequency_detail`, `streak`, `longest_streak`, `reminder_enabled`, `streak_grace_used_month` |
| `habit_logs` | `habit_id`, `date`, `value`, `completed` |
| `communities` | `id`, `name`, `icon`, `created_by` |
| `community_members` | `community_id`, `user_id`, `role` (`admin`/`member`) |
| `community_habits` | `community_id`, mismos campos que `habits` (sin `user_id`). Desde jul-2026 `frequency_option` guarda las claves canónicas (`todos`, `dias_especificos_semana`, etc.); filas anteriores pueden tener la etiqueta de UI vieja (ej. "Días específicos de la semana (L, M)") — nada las lee hoy. |
| `community_habit_logs` | `community_habit_id`, `user_id`, `date`, `progress_count`, `completed`. Las columnas `streak`/`longest_streak` de esta tabla **no se usan**: la racha es de la comunidad y vive en `community_habits` |
| `community_messages` | mensajes del chat interno de cada comunidad |
| `friend_requests` | `sender_id`, `receiver_id`, `status` |
| `news` | `title`, `content`, `image_url`, `publication_date`, `brand_id`, `category_id`, `status` |
| `news_categories` | `id`, `name` |
| `levels` | `level_number`, `xp_required` |
| `benefits` | beneficios desbloqueables mostrados en `/progreso`. `valid_until` (date, nullable) es la fecha de vencimiento: `null` = no vence |
| `xp_actions` | `action_key` (PK), `xp_value`, `active` — acciones de XP. Ver §16 para la lista completa. |
| `push_subscriptions` | `user_id`, `endpoint`, `p256dh`, `auth` — suscripciones Web Push por usuario/dispositivo. PK compuesta `user_id + endpoint`. |

**Errores de Supabase**: pasarlos siempre por [`handleSupabaseError()`](app/utils/handleSupabaseError.js) — traduce los mensajes a español.

## 8. Composables (lógica de dominio)

- [useHabits.js](app/composables/useHabits.js) — CRUD de hábitos, logs por fecha, rachas, `syncHabitsWithNewDay`, `shouldShowHabitForDate`, `getArgentineDate`, y la gracia de rachas (`updateStreakForNewDay`, `isPeriodStillMissed`, `applyStreakGrace`, `declineStreakGrace`). Es el composable más grande (~1000 líneas) y concentra toda la lógica de fechas y streaks. **La cadencia de la racha (cada cuánto suma +1) se determina SOLO por `frequency_type`** (helpers `getStreakCadence`/`getGraceBreakMode`/`getPeriodBounds`/`getPeriodQuota`/`calculateStreakUpTo`); ver §14.
- [useExperience.js](app/composables/useExperience.js) — XP, niveles, milestones. Funciones de otorgamiento: `grantXP`, `checkStreakMilestone`, `checkAllHabitsDaily`, `checkFirstHabitCreated`, `checkWeeklyGoalMet`, `checkComeback`. Funciones de revocación: `revokeXP`, `revokeAllHabitsDaily`, `revokeWeeklyGoalXP`. Registra y consulta acciones en `xp_actions`.
- [useCommunities.js](app/composables/useCommunities.js) — comunidades, hábitos compartidos, logs comunitarios, chat (`community_messages`) y completions por miembro. Desde jul-2026 el hábito comunitario tiene paridad con el personal: `logCommunityHabitProgress(habitId, amount, goalValue, date)` y `getCommunityHabitMyLog(habitId, date)` aceptan fecha, `shouldShowCommunityHabitForDate(habit, dateStr)` aplica la frecuencia y `syncCommunityStreaks()` recalcula las rachas al cambiar el día (ver §14). Incluye `recordCommunityJoin(communityId)` para otorgar XP la primera vez que el usuario visita una comunidad (guard en localStorage `joined_community_{userId}_{communityId}`; **no** otorga XP al creador de la comunidad, que ya cobró `create_community`), `isCommunityAdmin(communityId)`, `updateCommunityHabit(habitId, habitData)` y `leaveCommunity(communityId)` (RPC, ver §14).
- [useFriends.js](app/composables/useFriends.js) — búsqueda de usuarios, solicitudes y lista de amigos. `acceptFriendRequest` otorga XP; `removeFriend` lo revoca.
- [useNovedades.js](app/composables/useNovedades.js) — feed de novedades (`status = 'approved'`) y categorías.
- [useNotification.js](app/composables/useNotification.js) — wrapper sobre `console.*`. Stub para una capa futura de notificaciones in-app.
- [usePullToRefresh.js](app/composables/usePullToRefresh.js) — singleton a nivel de módulo para el pull-to-refresh. Cada página registra su recarga con `registerRefresh(fn)` en `onMounted`; `DefaultMain` maneja el gesto táctil y llama `triggerRefresh()`. Al navegar, la página nueva pisa el callback anterior. Detalles del gesto en `DefaultMain` que conviene no revertir (jul-2026):
  - **Un update de `displayHeight` por frame**: `setHeight()` batchea en `requestAnimationFrame`. `touchmove` dispara a 120 Hz en iOS y cada cambio de altura relayoutea todo el contenido de `<main>`; sin el rAF el pull se sentía trabado en las páginas con muchas cards (`/`, `/novedades`).
  - **La flecha no lleva `transition` mientras se arrastra**: tenía `transform 0.1s` fijo, así que rotaba siempre 100 ms atrás del dedo. Ahora la transición solo se aplica cuando `isTransitioning` (el snap-back).
  - **Resistencia después del umbral**: `THRESHOLD` es 70 px y a partir de ahí el arrastre sigue moviéndose al 35 % hasta `MAX_PULL` (120). Antes clampeaba en seco a 80 px y el indicador se congelaba con el dedo todavía moviéndose.
  - **El gesto tiene que declararse vertical**: pasado un deadzone de 8 px, si `|dx| >= |dy|` (o `dy <= 0`) el gesto queda `isLocked` para el resto del touch. Sin eso, un swipe horizontal sobre `HabitsCard` con componente vertical abría el indicador y hacía `preventDefault()`.
  - **`scrollTop` se re-chequea en cada move**, no solo en `touchstart`.
  - **Hay `@touchcancel`**: un gesto interrumpido por el sistema no dispara `touchend` y dejaba `startY`/`isPulling` sucios y el indicador abierto.
- [useOnlineStatus.js](app/composables/useOnlineStatus.js) — expone `isOnline` (ref reactivo) usando `navigator.onLine` y los eventos `online`/`offline` de `window`. Usado por `OfflineBanner`.
- [useSeo.js](app/composables/useSeo.js) — `useSeoTags({ title, description, image, imageAlt, type, indexable })` centraliza title/description/canonical/Open Graph/Twitter de cada página. Exporta además las constantes `SITE_NAME`, `SITE_TAGLINE`, `SITE_DESCRIPTION`, `SITE_IMAGE`. Ver §18.
- [usePushNotifications.js](app/composables/usePushNotifications.js) — gestiona suscripciones Web Push. Expone `isSupported`, `permission`, `isSubscribed`, `isLoading`, `subscribe()`, `unsubscribe()`, `checkSubscription()`, `removeSubscriptionForCurrentUser()`. Persiste las suscripciones en la tabla `push_subscriptions` de Supabase. Usa `config.public.vapidPublicKey` para la clave del applicationServerKey.

**Patrón**: cada composable llama a `useSupabaseClient()` adentro y expone funciones `async`. Los que requieren sesión definen un helper interno `getUserId()` que tira si no hay sesión.

## 9. Stores (Pinia)

- [authStore.js](app/stores/authStore.js) — `user`, `profile`, `loading`, `error`, `isLoggedIn`, `fetchUser`, `updateProfile`, `logout`.
- [habitStore.js](app/stores/habitStore.js) — estado efímero durante el wizard de creación de hábito (`selectedHabit`, `isCustom`).
- [splashStore.js](app/stores/splashStore.js) — visibilidad del splash inicial.
- [xpNotificationStore.js](app/stores/xpNotificationStore.js) — cola de notificaciones de XP. `enqueue(xpAmount, actionKey)` **batchea** los XP ganados en una ventana de 1.5 s y los muestra como un solo toast (el label sale del `actionKey` de mayor prioridad); `enqueueLevelUp(level)` encola el toast de subida de nivel. Procesa una notificación por vez; `dismiss()` muestra la siguiente. Solo `grantXP` encola (las revocaciones no muestran toast), pero `revokeXP` llama a `cancelPending(xp, actionKey)` para descontar del batch todavía no mostrado — sin eso, completar y descompletar rápido (< 1.5 s) mostraba XP fantasma.

> No hay `streakGraceStore`: la gracia de rachas se maneja con guards en localStorage y su UI vive en la página de detalle del hábito (ver §14).

## 10. Plugins (client-only)

- [plugins/splash.client.js](app/plugins/splash.client.js) — oculta el splash a los 2.5 s o al primer cambio de ruta. **El `router.beforeEach` tiene que saltear `from === START_LOCATION`**: Nuxt hace `router.replace(rutaInicial, { force: true })` en el hook `app:created` (ver `node_modules/nuxt/dist/pages/runtime/plugins/router.js`), que corre **después** de los plugins y **antes** de `vueApp.mount()`. Sin ese guard, esa navegación interna cuenta como "primer cambio de ruta", `hideSplash()` corre antes del primer render y **el splash no se ve nunca**.
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
| `components/community/HabitForm.vue` | `<CommunityHabitForm>` |
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

**Top-level**: `Avatar`, `Loader`, `OfflineBanner`, `Splash`, `XpNotification`.

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

**Layout**: la app entera vive en un grid `header | main | nav` definido en [main.css](app/assets/css/main.css). Los layouts deben respetar la composición `DefaultHeader` + `DefaultMain` + `DefaultNav`. En `2xl` (≥992px) el mismo grid cambia a dos columnas (`"nav header" / "nav main"`): el nav ocupa la columna izquierda a toda altura y `DefaultNav` se estiliza como sidebar vertical con clases `2xl:`. El layout `auth` no tiene nav, así que la columna `auto` colapsa a 0 y sigue funcionando.

## 13. Convenciones del proyecto

- **Idioma**: rutas, variables de UI y mensajes al usuario en **español rioplatense (voseo)**: "iniciá", "revisá", "elegí", "podés" — nunca tuteo peninsular ("inicia", "revisa", "elige", "puedes"). Identificadores de código en inglés.
- **Sin comentarios en el código**: decisión del proyecto (jul-2026). No agregar comentarios nuevos; el conocimiento no obvio va en este archivo.
- **Vue**: solo Composition API con `<script setup>`. La única excepción actual es [button/Primary.vue](app/components/button/Primary.vue), que aún usa `export default { props }`.
- **Rutas**: importar `ROUTE_NAMES` desde [app/constants/ROUTE_NAMES.js](app/constants/ROUTE_NAMES.js). No hardcodear strings de rutas.
- **Errores de Supabase**: pasar siempre por [`handleSupabaseError()`](app/utils/handleSupabaseError.js).
- **Fechas**: usar `getArgentineDate()` ([app/utils/getArgentineDate.js](app/utils/getArgentineDate.js), auto-importado) para cualquier fecha que se compare con `habit_logs.date`. **Nunca** usar `new Date()` ni `toISOString()` para fechas-calendario: `toISOString()` es UTC y en Argentina (UTC−3) corre el día a partir de las 21:00. Para formatear un `Date` local a `YYYY-MM-DD` usar componentes locales (`getFullYear/getMonth/getDate`), como hace `getDateString()` en [habitFrequency.js](app/utils/habitFrequency.js).
- **Fuente de verdad del progreso diario**: `habit_logs.value` (no `habits.progress_count`): nunca se pisa con el reset diario.
- **Helpers de frecuencia/calendario**: viven en [app/utils/habitFrequency.js](app/utils/habitFrequency.js) (auto-importado, funciones puras sin Supabase): `getDateString`, `addDaysToDateStr`, `timestampToArgentineDateStr`, `getWeekStart/getWeekEnd`, `letterDaysToNumbers`, `habitStartDate`, `habitExistsOn`, `isHabitScheduledOn`, `getStreakCadence`, `getPeriodBounds`, `getPeriodQuota`, `getPrevPeriodEndDate`, `findScheduledOnOrBefore/Before` y `shouldShowHabitForDateWith(habit, dateStr, countCompletedInPeriod)`. **No duplicar esta lógica**: `useHabits`, `useCommunities` y `HabitsDateNavigator` la comparten. `shouldShowHabitForDateWith` recibe un contador inyectado para que hábitos personales (`habit_logs`) y comunitarios (`community_habit_logs`) usen el mismo `switch`.
- **Iconos emoji: contar *grafemas*, no code points**: los helpers viven en [app/utils/emojiIcon.js](app/utils/emojiIcon.js) (auto-importado): `splitGraphemes`, `graphemeLength`, `keepLastEmojiGrapheme`. Muchos emojis del catálogo de `habits/Default.vue` son **secuencias ZWJ** (🏃‍♀️ = 4 code points, 🏋️‍♀️ = 5), así que `Array.from(icon).length` los contaba como 4-5 y la validación rechazaba el ícono preseleccionado. Por la misma razón **no filtrar emoji code point por code point**: `[...icon].filter(c => /\p{Extended_Pictographic}/u.test(c))` descarta el ZWJ y el VS16 y convierte 🏃‍♀️ en "🏃♀".
- **El ícono de un hábito es exactamente UN emoji**: los tres inputs de ícono (`habits/Form`, `community/HabitForm`, `crear/paso2`) filtran con `keepLastEmojiGrapheme` en `@input`, que descarta todo lo que no sea emoji y **deja sólo el último**, así escribir un segundo emoji reemplaza al primero en vez de acumular. La validación es `graphemeLength(icon) !== 1`. El `maxlength` de esos inputs es 20, no 10: un solo 🏋️‍♀️ ya ocupa 6 unidades UTF-16 y hacen falta dos para que el reemplazo funcione — **`maxlength` no sirve para limitar la cantidad de emojis**, ese trabajo lo hace el filtro.
- **No hay ícono por defecto**: un hábito custom arranca con el input de ícono **vacío** (antes se precargaba 📝 en `loadFormData`, `handleSubmit` y `HabitsDetails`, lo que hacía que un hábito "sin elegir" ya viniera con el emoji de editar). El ícono es obligatorio, así que no hace falta fallback.
- **Los emojis del catálogo tienen que ser secuencias RGI completas**: "Meditar" estaba guardado como `1F9D8 1F3FB 200D 2640` — **sin el `FE0F` final**, o sea una secuencia no-RGI que WebKit/Android renderizan como **dos glifos** (🧘🏻 + ♀) aunque `Intl.Segmenter` la cuente como un grafema. Se normalizó a `1F9D8 200D 2640 FE0F`. Si agregás emojis al catálogo, verificá que cada uno termine en `FE0F` cuando el último code point es un signo con presentación textual (`2640`, `2642`, `2695`, `2696`, `2708`, `26F9`, `2764`).
- **Strings de variantes de frecuencia**: al comparar etiquetas como "Días específicos de la semana" hay que **normalizar acentos** (`.normalize('NFD').replace(/[̀-ͯ]/g, '')`) — ya hubo un bug donde los pickers de días no aparecían por comparar con/sin tilde (`OptionInput`, `habits/Form`, `crear/paso3`).
- **Mobile-first**: si desarrollás UI, diseñala y testeala primero en viewport mobile (≤ 768px), que es el target principal; después verificá que no se rompa en desktop (≥ 992px, donde el nav es sidebar y el contenido va centrado con max-width). No usar `MobileOnlyScreen`: se eliminó en jul-2026.
- **Skeletons**: usar los de [components/skeleton/](app/components/skeleton/) mientras `isLoading` para evitar layout shift.

## 14. Notas no obvias

- **Login por username, no por email**: el formulario de [iniciar-sesion.vue](app/pages/iniciar-sesion.vue) pide `username`, resuelve el `email` correspondiente con el RPC `email_for_username(p_display_name)` y luego hace `signInWithPassword` con ese email. Cuando agregues flujos de auth recordá este indirect.
- **`profiles` no se lee directo si el usuario no tiene sesión ni si necesitás columnas privadas**: la RLS/GRANTs de `profiles` (ver §19) sólo dejan leer 5 columnas públicas (`id`, `display_name`, `avatar_url`, `experience_points`, `current_level`) y sólo a `authenticated`. Todo lo demás pasa por RPCs `SECURITY DEFINER`: `my_profile()` (fila propia completa, incluye `name`/`email`/`role`), `email_for_username`, `display_name_taken`, `email_taken`. **Nunca hagas `select('*')` sobre `profiles`**: tira `permission denied for column email`.
- **Re-sync de hábitos**: la home corre `syncHabitsWithNewDay()` al montarse, en cada `visibilitychange` y en un `setInterval` que detecta cambio de día — ver el `onMounted` de [pages/index.vue](app/pages/index.vue). No remover sin entender por qué está.
- **El sync diario corre una sola vez por día y se saltea si ya hay cualquier `habit_log` de hoy**: `shouldResetToday()` corta si `lastHabitResetDate_{userId}` ya es hoy **o** si existe al menos un log de hoy — incluso uno con `value: 0` / `completed: false`, que es el que queda cuando se completa y descompleta un hábito. Además escribe la clave **antes** de mirar los logs, así que una vez que decidió "no" no se reintenta en el día. Consecuencia práctica: **todo lo que vive dentro del sync (el decaimiento de rachas y la oferta de "Salvar racha") solo se puede reproducir en un día sin ningún registro previo**; para testearlo hay que borrar la clave de localStorage y los logs del día. En uso real casi no molesta porque el primer render del día corre el sync antes de que el usuario pueda registrar nada. **Hueco conocido**: si el usuario entra directo al detalle de un hábito desde un push (sin pasar por la home) y lo completa, ese día ya no corre el decaimiento ni la oferta de gracia del resto de los hábitos — [mis-habitos/[id].vue](app/pages/mis-habitos/[id].vue) no llama a `syncHabitsWithNewDay`.
- **Sin tipos de Supabase**: `supabase.types: false` en [nuxt.config.ts](nuxt.config.ts). El proyecto es JS puro; no asumir tipos generados del esquema.
- **Offline: se puede leer, no escribir**: además del `OfflineBanner`, los puntos de registro de progreso se esconden cuando `useOnlineStatus().isOnline` es `false` — los `+`/`−` y los botones de completar/reiniciar en [mis-habitos/[id]](app/pages/mis-habitos/[id].vue) y [comunidades/[id]/habito](app/pages/comunidades/[id]/habito.vue), y el swipe de `HabitsCard`/`HabitsCommunityCard` (`isActionable` y `willAct` chequean `isOnline`). El progreso se sigue **mostrando**, sólo se bloquea la escritura: sin conexión el `upsert` a Supabase falla y el optimistic update dejaba la UI mintiendo. `isOnline` arranca en `true` y se corrige en `onMounted`, así que en SSR los controles se renderizan y pueden desaparecer al hidratar. **Las otras dos escrituras bloqueadas offline** (jul-2026): el input del chat de [comunidades/[id]/index.vue](app/pages/comunidades/[id]/index.vue) queda `disabled` con el aviso "Sin conexión: no podés enviar mensajes." (`handleSend` además corta al principio), y el ícono de editar perfil de [mi-perfil/index.vue](app/pages/mi-perfil/index.vue) desaparece; si igual se entra por URL a [mi-perfil/editar.vue](app/pages/mi-perfil/editar.vue), se esconden los botones de foto y el submit, y `handleSave` corta si `!isOnline`.
- **PWA con soporte offline**: la app usa `@vite-pwa/nuxt` con workbox para cachear assets y respuestas de red. `OfflineBanner` informa al usuario cuando pierde conexión. El manifest y los shortcuts de app están configurados en [nuxt.config.ts](nuxt.config.ts). El viewport está bloqueado a `user-scalable=no` y declara `apple-mobile-web-app-capable`.
- **`navigateFallback: null` en el PWA (no tocar)**: la app es SSR en Vercel, no hay app shell precacheado. El default de `@vite-pwa/nuxt` (`navigateFallback: '/'`) hace que el SW tire `non-precached-url` y las navegaciones terminen en 404 (visible en iOS Safari). La key debe quedar presente y en `null` (no `false`, no borrarla: el módulo la re-inyecta como `'/'`).
- **Guard de `Notification` en iOS**: en Safari/Chrome de iOS (navegador, no PWA instalada) la API `Notification` NO existe. Cualquier acceso debe chequear `'Notification' in window` primero (ver `usePushNotifications`); sin el guard, la hidratación crashea y la app cae a error.vue (404).
- **Fechas Argentina**: `getArgentineDate()` vive en [app/utils/getArgentineDate.js](app/utils/getArgentineDate.js) (auto-importado) y también se re-exporta desde `useHabits`.
- **Frases y tips diarios**: se eligen al azar al iniciar la sesión y se cachean en `sessionStorage` (`sessionPhrase`, `sessionTip`). Se limpian al cerrar sesión.
- **RLS de comunidades**: al crear una comunidad, [useCommunities.createCommunity](app/composables/useCommunities.js) hace el `insert` sin `.select()` y luego una `select` separada — workaround para evitar el RLS de `SELECT` antes de ser miembro.
- **Swipe en cards de hábitos**: `HabitsCard` y `HabitsCommunityCard` implementan swipe táctil para completar/descompletar hábitos. Lógica de `touchstart`/`touchend` con animación de fill. No romper la dirección del swipe al modificar el layout de las cards. Detalles de UX que conviene no revertir:
  - **El fill sigue al dedo 1:1**: el ancho es `min(|dx|, cardWidth)` en **px** (`swipeFillWidth`). Antes era un porcentaje sobre `FILL_FULL_DISTANCE = 60`, así que el color corría más rápido que el dedo y llegaba al 100% a los 60 px mientras la acción recién disparaba a los 40 (`SWIPE_THRESHOLD`).
  - **El umbral se comunica con opacidad**: por debajo de `SWIPE_THRESHOLD` el fill va a `opacity: 0.5`; al pasarlo salta a 1. Es la señal de "soltá ahora y se completa".
  - **Cualquier gesto horizontal cancela el click**: `isSwipe = isHorizontalGesture` en `touchend` (antes sólo se marcaba cuando el swipe *actuaba*, así que un arrastre corto navegaba al detalle del hábito sin querer). El feedback de tap es `isPressed` → `scale-[0.98]`, y se apaga en cuanto el gesto se vuelve horizontal o vertical.
  - **La acción exige gesto horizontal declarado**: `isValidSwipe` arranca con `wasHorizontal` (o sea que `handleTouchMove` tuvo que marcar `isHorizontalGesture`). Sin eso, un scroll en diagonal — que `handleTouchMove` descarta por vertical y nunca pinta el fill — igual llegaba a `touchEnd` con `swipeDistance > 40` y completaba el hábito sin ningún feedback previo.
  - Hay `@touchcancel` además de `@touchend`: sin él, un gesto interrumpido por el sistema dejaba `isPressed` prendido.
- **DateNavigator: 7 días (mobile) / 14 días, 2 semanas (desktop)**: `HabitsDateNavigator` calcula siempre un array fijo de 14 días (`DAYS_DESKTOP`) terminando hoy y nunca permite seleccionar fechas futuras. No hay flechas ni estado de navegación: los 7 días más viejos llevan `isPreviousWeeks: true` y se ocultan con clases puras de Tailwind (`hidden 2xl:flex`), por lo que en mobile solo se ven los últimos 7 días (como antes) y en desktop (`2xl`, ≥992px) se ven los 14 en la misma fila. `fetchWeekCompletions` siempre trae los 14 días, aunque en mobile los 7 más viejos queden ocultos por CSS. El anillo cuenta **hábitos personales + hábitos comunitarios** del usuario (`community_habit_logs` filtrados por `user_id`); el bonus de XP `all_habits_daily` en cambio sigue mirando solo los personales.
- **Hábito comunitario = hábito personal, con dos diferencias**: (1) la racha de `community_habits.streak` sube **solo cuando la completan todos los miembros** de la comunidad ese día/período, y (2) **no existe salvar racha** (ninguna key `streakGrace*`, ningún botón). Todo lo demás espeja al hábito personal: respeta `frequency_type`/`frequency_option` vía `shouldShowCommunityHabitForDate`, permite des/completar días pasados y suma al anillo del `DateNavigator`.
  - **La fecha nunca se hardcodea**: `logCommunityHabitProgress` y `getCommunityHabitMyLog` reciben `date`; `HabitsCommunityCard` toma la prop `selectedDate` y linkea a `/comunidades/{id}/habito?date=...`, que la lee de `route.query.date`. Antes de jul-2026 escribían siempre en `getArgentineDate()`, así que completar un día pasado marcaba HOY.
  - **Cadencia**: aplica la misma regla de oro que los personales (la decide `frequency_type`, nunca la opción). `calculateCommunityStreakUpTo` espeja a `calculateStreakUpTo` pero el predicado "día completado" es `isCommunityDayComplete` (todos los miembros requeridos con `completed = true`).
  - **Miembros requeridos por día**: se calculan con `community_members.joined_at` (`requiredMembersOn`), así sumar un miembro nuevo no corta la racha histórica.
  - **Ancla de la racha**: `resolveCommunityStreakAnchor` elige hoy si la unidad actual ya está completa, o la unidad anterior si sigue en curso — por eso la racha se ve durante el día. Si la última unidad **cerrada** quedó sin cumplir, la racha va a 0 sin ofrecer gracia.
  - **Decaimiento**: `syncCommunityStreaks()` (guard en localStorage `lastCommunityStreakSync_{userId}`) recalcula las rachas una vez por día argentino; se llama desde el `onMounted` de la home y desde [plugins/habitSync.client.js](app/plugins/habitSync.client.js).
  - **Sólo se puede registrar en días programados**: [comunidades/[id]/habito.vue](app/pages/comunidades/[id]/habito.vue) esconde los controles de progreso si `isHabitScheduledOn(habit, fecha)` es `false`. Sin ese guard la página (a la que se llega directo desde la comunidad, no por el feed, que ya filtra con `shouldShowCommunityHabitForDate`) dejaba completar el hábito en días que no estaban en `frequency_detail.weekDays`. Esas completions **no cuentan nunca para la racha** — `calculateCommunityStreakUpTo` saltea los días no programados y `resolveCommunityStreakAnchor` ancla en el último día programado — así que el síntoma era "completamos entre todos y la racha sigue en 0". El guard usa `isHabitScheduledOn` (puro calendario) y **no** `shouldShowCommunityHabitForDate`, que para `cantidad_dias_*` devuelve `false` una vez cumplida la cuota del período y bloquearía registrar de más.
- **Salir de una comunidad pasa por el RPC `leave_community`, no por un `delete` del cliente**: hasta jul-2026 `confirmLeaveCommunity` llamaba a `removeMemberFromCommunity(id, yo)`, así que cuando salía el **admin** la comunidad quedaba sin ninguna fila `role = 'admin'` — nadie podía editar el hábito, agregar miembros ni eliminarla (pasó con `db12b218-f3c8-4ff7-baf4-f2e304ffc30d`). Lo reemplaza el RPC `leave_community(p_community_id)` de [20260730_leave_community_rpc.sql](supabase/migrations/20260730_leave_community_rpc.sql) (`SECURITY DEFINER`, `row_security = off`, `EXECUTE` sólo para `authenticated`), que en un solo statement: borra la fila del que sale; si no queda **ningún** miembro elimina la comunidad (todo cascadea: hábito, logs y mensajes); y si el que salió era el último admin **promueve a un miembro al azar** (`order by random() limit 1`) y le transfiere `communities.created_by`. Devuelve `'left' | 'promoted' | 'deleted'`.
  - **Por qué RPC y no una policy de UPDATE**: `community_members` no tiene policy de `UPDATE`, y agregar una que deje tocar `role` habilitaría a cualquier miembro a autoproclamarse admin — exactamente el agujero que cerró `community_members_insert` (ver más abajo). El `SECURITY DEFINER` mantiene el privilegio del lado del servidor.
  - **`created_by` se transfiere a propósito**: la policy `Creator can delete community` y la rama del creador de `community_members_insert` se anclan en `communities.created_by`; si el creador se va y no se transfiere, el admin nuevo no podría eliminar la comunidad. Los únicos otros usos de `created_by` son la relectura post-`insert` de `createCommunity` y el guard de XP de `recordCommunityJoin`, y a ninguno le afecta.
  - La migración además **arregla los datos viejos**: promueve al miembro más antiguo de toda comunidad que quedó sin admin y reacomoda los `created_by` que apuntan a alguien que ya no es miembro.
  - El modal de "Salir de la comunidad" avisa antes: si sos admin y hay más gente, que el rol pasa a otro miembro; si sos el único, que la comunidad se elimina.
- **Suscripciones push por usuario, no por device**: `push_subscriptions` tiene PK `(user_id, endpoint)`, así que **un mismo endpoint puede quedar registrado para varias cuentas** si se hace login con otra cuenta en el mismo browser. Eso hacía que te llegara push de tus propios mensajes de comunidad. `checkSubscription` matchea por `(endpoint, user_id)` y `authStore.logout()` llama `removeSubscriptionForCurrentUser()` **antes** de `signOut` (la RLS necesita sesión). Las Edge Functions además deduplican por endpoint, excluyen los del emisor y purgan los endpoints que responden 404/410.
- **Realtime en comunidades**: la página [`/comunidades/[id]/`](app/pages/comunidades/[id]/index.vue) usa Supabase Realtime (`client.channel()`) para escuchar cambios en `community_messages` y `community_habit_logs` en tiempo real. El canal se limpia en `onUnmounted`.
- **Un hábito no existe antes de su fecha de inicio**: `habitExistsOn(habit, dateStr)` ([habitFrequency.js](app/utils/habitFrequency.js)) es lo primero que chequea `shouldShowHabitForDateWith`, así que vale igual para hábitos personales y comunitarios. Sin ese guard, un hábito nuevo aparecía **retroactivo** en todos los días pasados del `DateNavigator`. Tres lugares lo aplican aparte del `switch` de frecuencia, porque no pasan por él: (1) [pages/index.vue](app/pages/index.vue) lo saltea antes de `shouldShowHabitForDate` — si no, el hábito caía en `hiddenHabits` y seguía visible en "Ver todos mis hábitos"; (2) `fetchWeekCompletions` de [HabitsDateNavigator](app/components/habits/DateNavigator.vue) lo suma al filtro del **total** del anillo, si no un día viejo quedaba en 0/N con N inflado; (3) las dos páginas de registro ([mis-habitos/[id]](app/pages/mis-habitos/[id].vue) y [comunidades/[id]/habito](app/pages/comunidades/[id]/habito.vue)) esconden los controles con el mismo patrón que el guard de offline (`canLog` + `blockedReason`), porque se llega a una fecha arbitraria por `?date=` en la URL. **Los hábitos viejos no tienen problema**: si falta la fecha de inicio, `habitExistsOn` devuelve `true`.
  - **La fecha de inicio es `max(created_at, member_since)`** (`habitStartDate`). `member_since` **no** es una columna: es el `community_members.joined_at` **del usuario actual** que se le adosa al hábito comunitario antes de preguntar por la fecha. Un hábito personal nunca lo trae, así que ahí manda `created_at` solo. Para el comunitario manda el `joined_at`: si te sumás hoy a una comunidad de hace un mes, el hábito arranca el día que entraste, no el día que se creó.
  - Lo adosan tres lugares, cada uno con los datos que ya tenía a mano: `shouldShowCommunityHabitForDate` (busca mi fila en `getCommunityMembersFor`), `fetchCommunityHabits` del `DateNavigator` (mapea `community_id → joined_at` de mis membresías; por eso su query de `community_habits` trae `community_id`) y [comunidades/[id]/habito](app/pages/comunidades/[id]/habito.vue) (de `community.members`, que ya viene con `joined_at`). Si agregás otro consumidor, acordate de adosarlo: sin `member_since` el hábito comunitario se muestra desde su `created_at`.
  - Es la misma idea que `requiredMembersOn` (que ya usaba `joined_at` para no cortar la racha histórica al sumar un miembro), aplicada ahora a la visibilidad.
- **Cadencia de la racha por `frequency_type` (regla de oro)**: hay 3 frecuencias (`diario`/`semanal`/`mensual`) y sus opciones (`todos`, `dias_especificos_semana/mes`, `cantidad_dias_semana/mes`) **se repiten entre frecuencias**, así que la cadencia del +1 se decide SOLO por el `type`, **nunca** por la opción (helpers `getStreakCadence`/`getGraceBreakMode`/`getPeriodBounds`/`getPeriodQuota`). `diario` ⇒ +1 por cada día completado; `semanal`/`mensual` ⇒ +1 al cumplir la meta del período. La opción define el calendario/meta (qué días aplica y cuántos), no la cadencia. **Caso híbrido**: un hábito **diario** con `cantidad_dias_semana` (ej. 5×/semana) suma +1 por completado y **solo pierde la racha si una semana ya cerrada no llegó a la cuota** (la semana en curso siempre aporta; `calculateStreakUpTo` implementa el conteo). `shouldShowHabitForDate` también respeta la opción en diario (`días específicos` aparece solo esos días; `cantidad` hasta cumplir la meta). **No existe el valor `flexible`.**
- **Sistema de gracia de rachas ("Salvar racha") — solo hábitos personales**: `updateStreakForNewDay()` (dentro de `syncHabitsWithNewDay`) detecta cuando la última unidad (día programado, o período cerrado para semanal/mensual/`cantidad`) quedó sin cumplir. Si la racha estaba viva (**hueco de exactamente 1 unidad**, `streak > 0`) y la gracia del mes está disponible (`streak_grace_used_month !== mesActual`), encola la oferta en localStorage (`streakGracePending_{id}`); si el hueco es mayor, resetea la racha sin ofrecer. **La UI vive en la página de detalle del hábito** [mis-habitos/[id].vue](app/pages/mis-habitos/[id].vue) (`checkStreakSavePending`, botones "Salvar racha"/"Perder racha"); `HabitsCard` muestra un punto rojo de "en riesgo" y re-chequea con `isPeriodStillMissed` (no solo la existencia de la key). `applyStreakGrace(habitId)` marca `streak_grace_used_month`, mantiene la racha y **sella** la unidad salvada (`streakGraceForgiven_{id}`) para que el próximo sync no la resetee. `declineStreakGrace(habitId)` resetea la racha a 0. **La gracia se consume una sola vez por mes por hábito.** (Ya NO existe `streakGraceStore` ni el componente modal `StreakGrace`; fueron reemplazados por este flujo.)
- **Push Notifications (Web Push)**: el plugin `pushNotifications.client.js` auto-suscribe al push al autenticarse. El composable `usePushNotifications` persiste las suscripciones en `push_subscriptions`. El service worker `app/sw.js` maneja `push` y `notificationclick`; está importado como `/sw-push.js` vía `workbox.importScripts` en [nuxt.config.ts](nuxt.config.ts). Requiere las tres vars VAPID en el `.env`. El usuario puede activar/desactivar las notificaciones desde [mi-perfil](app/pages/mi-perfil/index.vue) con el `FormSwitch` de push.
- **Chat de comunidades**: `CommunityChatInputMessage` muestra mensajes recibidos de otros miembros; `CommunityChatOutputMessage` muestra los propios. Ambos viven en `components/community/chat/`.
- **Edición del hábito comunitario (solo admin)**: el form vive en `CommunityHabitForm` ([components/community/HabitForm.vue](app/components/community/HabitForm.vue)) y lo comparten el paso 3 de creación y [comunidades/[id]/editar-habito.vue](app/pages/comunidades/[id]/editar-habito.vue). El botón de editar aparece en `/comunidades/[id]/habito` y en `/comunidades/[id]/detalle` solo si `role === 'admin'`; la página además re-chequea con `isCommunityAdmin` y redirige si no lo sos. **La RLS de `community_habits` deja actualizar la fila a cualquier miembro** (la policy `members can update habit streak` existe para que `updateCommunityStreak` funcione), así que la restricción a admin se refuerza con el trigger de [supabase/migrations/20260724_community_habit_admin_edit.sql](supabase/migrations/20260724_community_habit_admin_edit.sql): rechaza cambios en las columnas de contenido si `auth.uid()` no es admin de esa comunidad, y deja pasar los updates de `streak`/`longest_streak`.
- **RLS de `community_members` (INSERT)**: hasta jul-2026 la policy era `WITH CHECK (auth.role() = 'authenticated')`, o sea que cualquier usuario logueado podía insertar cualquier fila `(community_id, user_id, role)` — incluido **autoproclamarse `admin` de una comunidad ajena** y, con eso, saltear el control de "solo admin edita el hábito". La reemplaza `community_members_insert` ([20260729_community_members_insert_rls.sql](supabase/migrations/20260729_community_members_insert_rls.sql)): solo el **creador** de la comunidad puede insertarse a sí mismo como `admin`, y las filas `member` las puede insertar el creador o un admin (`is_community_admin`). **La rama del creador es imprescindible**: `createCommunity` inserta la fila admin y las de miembros en un **único** statement, y dentro de ese statement `is_community_admin` todavía no ve la fila admin recién creada; por eso el chequeo se ancla en `communities.created_by`, que ya está commiteado.
- **Des/completar días pasados y la racha**: el DateNavigator permite tocar días anteriores de la semana. En `logHabitProgress`, tanto completar como descompletar un día pasado recalculan la racha con `calculateStreakUpTo` anclada en el **último día realmente completado** (cadencia diaria) o en el período actual/anterior según si cumplió su cuota (semanal/mensual). No volver al ancla "día anterior al tocado": ignora completados posteriores al hueco.
- **Avatares en Storage**: `profiles.avatar_url` es una **signed URL** con `?token=...`. Para derivar el path del bucket (`avatar/{userId}/{fileName}`) hay que sacar el query string y `decodeURIComponent` (ver `deleteAvatar`/`handleSave` en [mi-perfil/editar.vue](app/pages/mi-perfil/editar.vue)). Al borrar o reemplazar la foto se elimina el archivo del bucket para no dejar huérfanos. **El nombre del archivo NO es el del archivo original**: `handleSave` genera `{crypto.randomUUID()}.{ext}` porque el validador de keys de Supabase Storage rechaza varios caracteres (acentos, `#`, `%`) que aparecen seguido en fotos del carrete.
- **Las policies de `storage.objects` no pueden leer `profiles` directo**: Postgres evalúa **todas** las policies permisivas de un INSERT/DELETE, así que si *cualquiera* de ellas hace `select … from profiles`, los GRANTs de columna de §19 la hacen tirar `permission denied for column role` y **se cae el statement completo** — incluidas las subidas al bucket `avatar`, que no tienen nada que ver con esa policy. Fue exactamente el bug de las policies de `admin-media` de superadmin: rompieron la edición de foto de perfil de todos los usuarios. Se arreglaron en [20260729_storage_superadmin_policies_fix.sql](supabase/migrations/20260729_storage_superadmin_policies_fix.sql) usando `is_superadmin()` (`SECURITY DEFINER`, `row_security = off`). **Cualquier policy nueva sobre `storage.objects` que necesite datos de `profiles` tiene que pasar por una función `SECURITY DEFINER`.**
- **Pantallas de auth: alto fijo y sin pull-to-refresh**: `DefaultMain` acepta la prop `pullToRefresh` (default `true`); [layouts/auth.vue](app/layouts/auth.vue) la pasa en `false` porque en login/registro no hay nada que recargar y la flecha del gesto aparecía al arrastrar. El mismo layout marca `<main>` con la clase `auth-screen`, y [main.css](app/assets/css/main.css) usa `body>div:first-of-type:has(>main.auth-screen)` para fijar el grid en `100dvh` con `overflow: hidden` (sin rebote de scroll). No sacar el fallback `100vh` antes del `100dvh`.
- **El wizard de comunidad pasa su estado por la query string, no por un store**: `crear/index` (paso 1) → `crear/paso2` → `crear/paso3` se comunican con `?members=&name=&icon=`. El link "Agregar" de paso 2 vuelve al paso 1 **llevando `name` e `icon`**, y el paso 1 los reenvía al paso 2; sin eso, ir a agregar un miembro borraba el nombre ya escrito. `paso2.siguiente` además hace `router.replace` con los tres params para que volver desde el paso 3 tampoco pierda nada.
- **Los beneficios vencidos no se muestran**: las dos queries de `benefits` filtran con `.or('valid_until.is.null,valid_until.gte.{hoy}')` — [progreso/index.vue](app/pages/progreso/index.vue) (listado del nivel) y [progreso/beneficios/[id].vue](app/pages/progreso/beneficios/[id].vue) (detalle, porque se llega por URL directa). `valid_until` en `null` significa **sin vencimiento**, así que se sigue mostrando. El "hoy" sale de `getArgentineDate()`, no de `new Date()`. El detalle tiene un `v-else` con *"Este beneficio ya no está disponible"*: sin él, un beneficio vencido (o inexistente, o `rejected`) renderizaba la página **en blanco**. **Ojo**: la tabla `news` **no** tiene columna de vencimiento — las novedades no vencen.
- **Caché de Novedades**: [novedades/index.vue](app/pages/novedades/index.vue) cachea categorías + noticias en `sessionStorage` (`novedades_last_fetch`, TTL 5 min) **incluyendo los datos**, no solo el timestamp — si se guarda solo el timestamp, al remontar la página los refs quedan vacíos y se ven skeletons infinitos. El pull-to-refresh fuerza recarga.
- **La limpieza de `sessionStorage` vive en `authStore.logout()`**, no en la página de perfil: borra `sessionPhrase`, `sessionTip` y `novedades_last_fetch` justo después del `signOut`. Si se agrega otra clave de `sessionStorage` con datos de la sesión, sumarla ahí — así cualquier punto de salida futuro la limpia sin duplicar lógica.
- **`handleSupabaseError` nunca devuelve el error crudo**: si el mensaje no está en el diccionario, loguea `[SUPABASE]` en consola y devuelve el texto genérico `GENERIC_ERROR`. No volver al fallback `` `Error: ${errorMessage}` ``: filtraba mensajes de Postgres en inglés a la UI.

## 15. Cómo verificar cambios

No hay test suite. Para validar:

1. `npm run dev` y probar el flujo en el navegador con DevTools en viewport mobile (≤ 768 px). Para cambios de UI, chequear también un viewport ≥ 992 px (layout desktop con sidebar).
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
| `all_habits_daily` | 20 | Se completan TODOS los hábitos del día (una vez/día, guard en localStorage `lastAllHabitsDailyXP_{userId}`) | Cualquier hábito se descompletea ese día |
| `weekly_goal_met` | 25 | Todos los hábitos semanales cumplen su meta (una vez/semana; guard en localStorage `lastWeeklyGoalXP_{userId}` = fecha del **lunes** de la semana actual en fecha argentina) | Cualquier hábito semanal se descompletea bajo la meta |
| `first_habit_created` | 15 | El usuario crea su primer hábito (guard en localStorage `firstHabitXP_{userId}` para que no se re-gane borrando y recreando hábitos) | — |
| `comeback` | 5 | El usuario vuelve tras 3+ días de inactividad (una vez/sesión, guard en localStorage `lastComebackCheck_{userId}`) | — |
| `community_habit_completed` | 8 | Usuario completa el hábito de una comunidad | Usuario descompletea el hábito comunitario |
| `create_community` | 30 | Usuario crea una comunidad | — |
| `join_community` | 15 | Usuario visita una comunidad por primera vez (guard en localStorage `joined_community_{id}`) | — |
| `friend_added` | 10 | Usuario acepta una solicitud de amistad | Usuario elimina un amigo |

### Flujo técnico

- `grantXP(actionKey)` y `revokeXP(actionKey)` en [useExperience.js](app/composables/useExperience.js) son el punto de entrada único. Ambos actualizan `profiles.experience_points` y `profiles.current_level` y sincronizan el `authStore`; solo `grantXP` encola una notificación en `xpNotificationStore`.
- Las notificaciones se muestran en [XpNotification.vue](app/components/XpNotification.vue): `+ N XP` para ganancias y aviso de level-up. Se descartan automáticamente a los 5 segundos.
- Los milestones de racha (`streak_7` … `streak_100`) se verifican con `checkStreakMilestone(streak)` — nunca se revocan aunque se pierda la racha.
- Los guards de "una vez por día/semana" usan `localStorage` y **todos van sufijados con el `userId`** (`lastAllHabitsDailyXP_{userId}`, `lastWeeklyGoalXP_{userId}`, `lastComebackCheck_{userId}`, `lastHabitResetDate_{userId}`, `lastCommunityStreakSync_{userId}`). Sin ese sufijo, loguearse con una segunda cuenta en el mismo navegador heredaba los guards de la primera: la segunda cuenta no cobraba el bonus diario y no le corría el reset de hábitos. En `useExperience` el helper `scopedKey(base)` arma la clave y devuelve `null` si no hay sesión. Si se revoca el bono, se limpia el guard para que pueda re-ganarse. Limitación conocida: al ser por dispositivo, no protegen entre dispositivos distintos.

## 17. Supabase server-side (Edge Functions y migrations)

- [supabase/functions/daily-habit-reminder](supabase/functions/daily-habit-reminder/index.ts) — envía un Web Push recordatorio a **todas** las suscripciones de `push_subscriptions`. La dispara un cron de `pg_cron` a las 01:00 UTC (22:00 ARG) — ver [supabase/migrations/20260524_pg_cron_reminder.sql](supabase/migrations/20260524_pg_cron_reminder.sql); al aplicarla hay que reemplazar `<PROJECT_REF>` y `<SERVICE_ROLE_KEY>` a mano en el SQL Editor (requiere extensiones `pg_cron` y `pg_net`).
- [supabase/functions/notify-community-message](supabase/functions/notify-community-message/index.ts) — la dispara un **Database Webhook** en el INSERT de `community_messages`; manda push a todos los miembros de la comunidad menos el emisor.
- Ambas usan las vars `VAPID_*` y `SUPABASE_SERVICE_ROLE_KEY` como secrets de la función (no van en el `.env` del front).
- [supabase/functions/community-habit-reminder](supabase/functions/community-habit-reminder/index.ts) — a las 23:00 ARG manda push **solo a los miembros que todavía no completaron** el hábito comunitario de hoy (respeta `frequency_option`: saltea el hábito si hoy no está programado y usa la cuota del período para `cantidad_dias_*`). La dispara el cron `community-habit-reminder` (`0 2 * * *` UTC) — ver [supabase/migrations/20260727_community_habit_reminder.sql](supabase/migrations/20260727_community_habit_reminder.sql), que además le sube el `timeout_milliseconds` al job viejo (el default de 5 s de `pg_net` cortaba la request aunque la función terminara bien).
- [supabase/migrations/20260524_push_subscriptions.sql](supabase/migrations/20260524_push_subscriptions.sql) — tabla `push_subscriptions` con RLS (cada usuario ve/inserta/borra solo las suyas).

## 18. SEO

La app es **privada casi por completo**: salvo `/iniciar-sesion` y `/registrarse`, toda ruta sin sesión la redirige el módulo de Supabase. Por eso la estrategia es "dos páginas indexables, el resto `noindex`", no "indexar todo".

### `useSeoTags` (obligatorio en cada página)

Toda página en [app/pages/](app/pages/) llama a `useSeoTags()` ([useSeo.js](app/composables/useSeo.js)). Emite en un solo lugar: `<title>`, `description`, `robots`, `canonical`, Open Graph (`og:title/description/image/image:alt/url/type/site_name/locale`) y Twitter Card (`summary_large_image`).

```js
useSeoTags({
    title: 'Mis hábitos',
    description: 'Seguí tus hábitos del día, marcá tu progreso y mantené viva tu racha.',
})
```

- **`title` se compone solo**: el composable arma `"{title} · Suma"`. Nunca escribir el sufijo a mano. Sin `title` cae en `"Suma — Hábitos que suman"`.
- **`indexable` es opt-in y por defecto `false`** ⇒ `robots: noindex, nofollow`. Solo `/iniciar-sesion` y `/registrarse` pasan `indexable: true`. **Al crear una página nueva no hay que hacer nada para protegerla**: si te olvidás de `useSeoTags`, el default de `app.head.meta` en [nuxt.config.ts](nuxt.config.ts) ya es `noindex, nofollow`.
- **Títulos dinámicos**: pasar **funciones** (getters), no valores. El composable las envuelve en `computed`, así el título se actualiza cuando llega el fetch. Ver [novedades/[id].vue](app/pages/novedades/[id].vue), [mis-habitos/[id].vue](app/pages/mis-habitos/[id].vue), [usuarios/[id].vue](app/pages/usuarios/[id].vue), [comunidades/[id]/index.vue](app/pages/comunidades/[id]/index.vue), [progreso/beneficios/[id].vue](app/pages/progreso/beneficios/[id].vue).
- **`canonical` y `og:url` salen de `useRequestURL()`**, no de una constante de dominio: funcionan igual en localhost, en preview de Vercel y en producción sin configurar nada. **No** introducir una var `SITE_URL`.
- **`og:image` por defecto es `/pwa-512x512.png`** (`SITE_IMAGE`). Es cuadrado: sirve, pero **falta un asset OG real de 1200×630**. Cuando exista, cambiar `SITE_IMAGE`. Las páginas con imagen propia (novedad, beneficio) ya pasan la suya por `image`.

### `robots.txt` y `sitemap.xml`

Son **rutas Nitro** ([server/routes/](server/routes/)), no archivos en `public/`, porque el `Sitemap:` y los `<loc>` necesitan el origin absoluto y se derivan de `getRequestURL(event)`. No volver a poner un `public/robots.txt`: los estáticos ganan sobre las rutas y romperían el sitemap.

- `robots.txt` deniega todas las secciones privadas y las transaccionales de auth. **Al agregar una sección nueva hay que sumarla al array `DISALLOWED`.**
- `sitemap.xml` lista solo `/iniciar-sesion` y `/registrarse` (array `PUBLIC_ROUTES`). No incluir `/`: para un crawler anónimo devuelve 302.

### Otras piezas

- **JSON-LD**: [iniciar-sesion.vue](app/pages/iniciar-sesion.vue) emite un `WebApplication` de schema.org. Es la landing efectiva del sitio; si algún día se agrega una landing pública real, mover el bloque ahí.
- **`app/error.vue`**: usa el `statusCode` real del error (ya no hardcodea 404), tiene `noindex` vía `useSeoTags` y un botón que hace `clearError({ redirect: HOME })`.
- **`lang="es-AR"`** en `htmlAttrs` y `og:locale: es_AR` — el dominio de la app es Argentina (ver la zona horaria en §1).
- **`alt` en todas las imágenes**: los íconos decorativos (pasos `brillo-*.svg`, lupa de búsqueda) llevan `alt=""` a propósito para que los lectores de pantalla los salteen; los avatares llevan alt descriptivo. **No dejar imágenes sin ningún `alt`.**

### Deuda conocida

- **`user-scalable=no` en el viewport** ([nuxt.config.ts](nuxt.config.ts)) es una decisión deliberada de PWA (§14), pero Lighthouse lo marca en Accessibility. Si alguna vez se prioriza ese score, la salida es sacar `maximum-scale=1, user-scalable=no`; cambia el gesto de zoom en mobile, así que es decisión de producto.
- **Soft 404 para anónimos**: una URL inexistente sin sesión devuelve 302 a `/iniciar-sesion` en vez de 404, porque el middleware de Supabase corre antes. Impacto bajo (esas rutas están en `Disallow`), pero es la razón por la que `error.vue` en la práctica solo se ve logueado.

## 19. Modelo de acceso a `profiles`

Hasta jul-2026 `profiles` tenía una policy de SELECT `Enable read access for all users` (`TO public USING (true)`) que dejaba a **cualquiera con la anon key**, sin sesión, hacer `select id, email, name from profiles` y llevarse la tabla entera. Las migraciones `20260729_profiles_public_rpcs.sql` y `20260729_profiles_column_privileges.sql` la reemplazan.

**Modelo resultante**: `profiles` tiene una **sola** policy de SELECT — `profiles_select_public` (`TO authenticated USING (true)`); la duplicada `profiles_select` se eliminó en `20260729_profiles_drop_duplicate_select.sql`. La RLS deja leer cualquier fila, y lo que acota el daño son los **GRANTs a nivel columna**, que son la única protección por columna real de Postgres:

- `authenticated` tiene `SELECT` sólo sobre `id`, `display_name`, `avatar_url`, `experience_points`, `current_level`.
- `anon` no tiene `SELECT` sobre `profiles`.
- `email`, `name` y `role` no son legibles vía PostgREST por ningún rol de cliente.

**Los GRANTs de columna son por rol, no por fila**: el usuario tampoco puede leer su propio `email`/`name`/`role` desde la tabla. Por eso existe `my_profile()`.

### RPCs (`SECURITY DEFINER`, `row_security = off`)

| RPC | Rol | Para qué |
|---|---|---|
| `my_profile()` | `authenticated` | Fila propia completa (incluye `email`, `name`, `role`). Lo usan `authStore.fetchUser`, el refresh de `updateProfile` y el panel externo. |
| `email_for_username(p_display_name)` | `anon`, `authenticated` | Login por username. |
| `display_name_taken(p_display_name)` | `anon`, `authenticated` | Unicidad en registro y en `mi-perfil/editar`. |
| `email_taken(p_email)` | `anon`, `authenticated` | Unicidad de email en registro. |
| `public_profile_stats(p_user_id)` | `authenticated` | Contadores públicos de otro usuario (hábitos activos, amigos, comunidades) para [usuarios/[id]](app/pages/usuarios/[id].vue). Necesario porque la RLS de `habits` es `auth.uid() = user_id`, la de `friend_requests` sólo ve las propias y la de `community_members` sólo las comunidades compartidas: contar desde el cliente daba **siempre 0** para un perfil ajeno. |

Siguen permitiendo enumerar de a un valor por vez, pero no el dump masivo que habilitaba la policy vieja.

`handle_new_user()` **no** es un RPC: es la función del trigger `on_auth_user_created` sobre `auth.users`. Los default privileges de Supabase la exponían igual en `/rest/v1/rpc/handle_new_user`; `20260729_profiles_drop_duplicate_select.sql` le revoca el `EXECUTE` a `public`, `anon` y `authenticated`. El trigger sigue funcionando: el permiso de ejecución de una función de trigger se chequea al crear el trigger, no al dispararlo.

### Al tocar este código

- **Nunca `select('*')` sobre `profiles`** — tira `permission denied for column email`. Usá la lista explícita de columnas públicas, o `my_profile()` si necesitás la fila propia entera.
- **`update().select()` sobre `profiles` también rompe** si el returning incluye columnas no otorgadas. Por eso `authStore.updateProfile` hace el `update` pelado y después llama `my_profile()`.
- **Los GRANTs de columna rompen cualquier policy de *otra* tabla que lea `profiles`** — ver la nota de `storage.objects` en §14. Antes de revocar una columna más, buscá `from profiles` en las policies de todo el esquema (`select polname, pg_get_expr(polqual, polrelid) from pg_policy`), no sólo en el código del cliente.
- **Los embeds de PostgREST (`sender:sender_id(…)`, `profile:user_id(…)`) aplican la RLS de `profiles`**. Funcionan porque `profiles_select_public` es `USING (true)`; si alguna vez se restringe a la fila propia, se rompen 7 lugares (chat de comunidades, miembros, amigos, solicitudes, completions) y dos tiran TypeError (`row.sender.id` en `useFriends.getFriends`, `m.profile.id` en `useCommunities.getCommunityHabitCompletions`).
- **Hay un segundo consumidor de `profiles`: el panel de administración `PanelAdminSuma`** (repo aparte). Sus lecturas de `email`/`role` viven en `server/api/` y usan la `SERVICE_ROLE_KEY`, así que son inmunes a los GRANTs de columna; la única lectura desde el cliente es la que resuelve si el usuario es superadmin (`app/stores/auth.js`), y usa `my_profile()`. Sin ese RPC, el `REVOKE` sobre `role`/`name` dejaba a `profileData` en `null`, `isSuperAdmin` nunca daba `true` y el middleware del panel hacía `signOut()`: el superadmin quedaba permanentemente afuera. **Si cambiás los GRANTs de columna de `profiles`, revisá también ese repo.**
- **`revoke execute … from public` NO le saca el permiso a `anon`**: Supabase tiene default privileges que otorgan `EXECUTE` **directo** a `anon`, `authenticated` y `service_role` sobre toda función nueva del schema `public`. Si querés que un RPC sea sólo para logueados hay que revocarlo explícitamente (`from public, anon`), como hace `my_profile()`. Con el `revoke from public` solo, la función queda ejecutable por cualquiera con la anon key.
- **Orden de despliegue**: (1) migración de RPCs, (2) deploy del cliente Suma, (3) deploy de `PanelAdminSuma`, (4) migración de privilegios. Los RPCs son aditivos y no rompen nada; la de privilegios es la que corta. Aplicar (4) antes de (2) tira el login de Suma, y antes de (3) deja al superadmin sin acceso al panel.
- **`anon` ya no tiene `INSERT` sobre `profiles`**: el `GRANT` existía pero era redundante — la fila la crea el trigger `on_auth_user_created` → `handle_new_user()` (SECURITY DEFINER) sobre `auth.users`, y la policy de INSERT tiene `WITH CHECK (auth.uid() = id)`, que para `anon` evalúa `NULL` y rechaza la fila. Ningún cliente inserta en `profiles`.
