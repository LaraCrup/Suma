# CLAUDE.md

Guía para Claude Code y futuros desarrolladores que trabajen en este proyecto. Mantenerla actualizada cuando cambien convenciones, estructura o decisiones de arquitectura.

## 1. Resumen del proyecto

**Suma** es una PWA mobile-only para formar hábitos, con gamificación (XP, niveles, rachas), comunidades con hábitos compartidos, sistema de amigos y un feed de novedades de marcas aliadas.

- Idioma: español en rutas, UI, mensajes y comentarios. Identificadores de código en inglés.
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
└── utils/handleSupabaseError.js
public/
├── favicon.ico, apple-touch-icon.png
└── images/                  # isotipo, logos, íconos de nav, tips, habitsCategories, etc.
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

Toda la lógica de datos vive en **composables** ([app/composables/](app/composables/)). No hay `server/api/` ni endpoints propios.

**Tablas usadas** (inferidas del código):

| Tabla | Campos clave |
|---|---|
| `profiles` | `id`, `email`, `name`, `display_name`, `avatar_url`, `experience_points`, `current_level` |
| `habits` | `user_id`, `name`, `icon`, `when_where`, `identity`, `unit`, `goal_value`, `frequency_type`, `frequency_option`, `frequency_detail`, `streak`, `longest_streak`, `reminder_enabled` |
| `habit_logs` | `habit_id`, `date`, `value`, `completed` |
| `communities` | `id`, `name`, `icon`, `created_by` |
| `community_members` | `community_id`, `user_id`, `role` (`admin`/`member`) |
| `community_habits` | `community_id`, mismos campos que `habits` (sin `user_id`) |
| `community_habit_logs` | logs de completions de hábitos comunitarios por miembro |
| `community_messages` | mensajes del chat interno de cada comunidad |
| `friend_requests` | `sender_id`, `receiver_id`, `status` |
| `news` | `title`, `content`, `image_url`, `publication_date`, `brand_id`, `category_id`, `status` |
| `news_categories` | `id`, `name` |
| `levels` | `level_number`, `xp_required` |
| `benefits` | beneficios desbloqueables mostrados en `/progreso` |
| `xp_actions` | `action_key` (PK), `xp_value`, `active` — acciones de XP. Ver §16 para la lista completa. |

**Errores de Supabase**: pasarlos siempre por [`handleSupabaseError()`](app/utils/handleSupabaseError.js) — traduce los mensajes a español.

## 8. Composables (lógica de dominio)

- [useHabits.js](app/composables/useHabits.js) — CRUD de hábitos, logs por fecha, rachas (diaria/semanal/mensual), `syncHabitsWithNewDay`, `shouldShowHabitForDate`, `getArgentineDate`. Es el composable más grande (~800 líneas) y concentra toda la lógica de fechas y streaks.
- [useExperience.js](app/composables/useExperience.js) — XP, niveles, milestones. Funciones de otorgamiento: `grantXP`, `checkStreakMilestone`, `checkAllHabitsDaily`, `checkFirstHabitCreated`, `checkWeeklyGoalMet`, `checkComeback`. Funciones de revocación: `revokeXP`, `revokeAllHabitsDaily`, `revokeWeeklyGoalXP`. Registra y consulta acciones en `xp_actions`.
- [useCommunities.js](app/composables/useCommunities.js) — comunidades, hábitos compartidos, logs comunitarios, chat (`community_messages`) y completions por miembro. Incluye `recordCommunityJoin(communityId)` para otorgar XP la primera vez que el usuario visita una comunidad (con guard en localStorage).
- [useFriends.js](app/composables/useFriends.js) — búsqueda de usuarios, solicitudes y lista de amigos. `acceptFriendRequest` otorga XP; `removeFriend` lo revoca.
- [useNovedades.js](app/composables/useNovedades.js) — feed de novedades (`status = 'approved'`) y categorías.
- [useNotification.js](app/composables/useNotification.js) — wrapper sobre `console.*`. Stub para una capa futura de notificaciones in-app.
- [useOnlineStatus.js](app/composables/useOnlineStatus.js) — expone `isOnline` (ref reactivo) usando `navigator.onLine` y los eventos `online`/`offline` de `window`. Usado por `OfflineBanner`.

**Patrón**: cada composable llama a `useSupabaseClient()` adentro y expone funciones `async`. Los que requieren sesión definen un helper interno `getUserId()` que tira si no hay sesión.

## 9. Stores (Pinia)

- [authStore.js](app/stores/authStore.js) — `user`, `profile`, `loading`, `error`, `isLoggedIn`, `fetchUser`, `updateProfile`, `logout`.
- [habitStore.js](app/stores/habitStore.js) — estado efímero durante el wizard de creación de hábito (`selectedHabit`, `isCustom`).
- [splashStore.js](app/stores/splashStore.js) — visibilidad del splash inicial.
- [xpNotificationStore.js](app/stores/xpNotificationStore.js) — cola de notificaciones de XP. Expone `enqueue(xpAmount, actionKey)` (valores negativos para revocaciones) y `dismiss()`. Procesa una notificación por vez; la siguiente se muestra automáticamente al cerrar la anterior.

## 10. Plugins (client-only)

- [plugins/splash.client.js](app/plugins/splash.client.js) — oculta el splash a los 2.5 s o al primer cambio de ruta.
- [plugins/habitSync.client.js](app/plugins/habitSync.client.js) — en `visibilitychange` (vuelta del background) llama a `syncHabitsWithNewDay()` y `checkComeback()`.

## 11. Componentes

Nuxt 4 autoimporta los componentes y los **prefija con el nombre de la carpeta**. Hay que tenerlo presente al consumirlos en plantillas:

| Archivo | Uso en template |
|---|---|
| `components/heading/H1.vue` | `<HeadingH1>` |
| `components/heading/H2.vue` | `<HeadingH2>` |
| `components/form/TextField.vue` | `<FormTextField>` |
| `components/form/TextFieldSecondary.vue` | `<FormTextFieldSecondary>` |
| `components/form/PasswordField.vue` | `<FormPasswordField>` |
| `components/form/Select.vue` | `<FormSelect>` |
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

`XpNotification` se monta en [layouts/default.vue](app/layouts/default.vue) (posición `fixed top-8 right-4 z-[9999]`). Lee del `xpNotificationStore` y se auto-descarta a los 5 segundos. Muestra `+ N XP` en `text-accent` para ganancias y `- N XP` en `text-error` para revocaciones.

`OfflineBanner` también se monta en [layouts/default.vue](app/layouts/default.vue). Usa `useOnlineStatus` y muestra un banner "Sin conexión — mostrando datos guardados" cuando `isOnline` es `false`.

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

**Layout**: la app entera vive en un grid `header | main | nav` definido en [main.css:21-30](app/assets/css/main.css). Los layouts deben respetar la composición `DefaultHeader` + `DefaultMain` + `DefaultNav`.

## 13. Convenciones del proyecto

- **Idioma**: rutas, variables de UI, mensajes al usuario y comentarios en español. Identificadores de código en inglés.
- **Vue**: solo Composition API con `<script setup>`. La única excepción actual es [button/Primary.vue](app/components/button/Primary.vue), que aún usa `export default { props }`.
- **Rutas**: importar `ROUTE_NAMES` desde [app/constants/ROUTE_NAMES.js](app/constants/ROUTE_NAMES.js). No hardcodear strings de rutas.
- **Errores de Supabase**: pasar siempre por [`handleSupabaseError()`](app/utils/handleSupabaseError.js).
- **Fechas**: usar `getArgentineDate()` de `useHabits` para cualquier fecha que se compare con `habit_logs.date`. No usar `new Date()` directamente para esto.
- **Fuente de verdad del progreso diario**: `habit_logs.value` (no `habits.progress_count`). Ver el comentario en [useHabits.js:82](app/composables/useHabits.js).
- **Mobile-only**: si desarrollás UI, testeala en viewport ≤ 768px — en desktop la app muestra una pantalla bloqueante.
- **Skeletons**: usar los de [components/skeleton/](app/components/skeleton/) mientras `isLoading` para evitar layout shift.

## 14. Notas no obvias

- **Login por username, no por email**: el formulario de [iniciar-sesion.vue](app/pages/iniciar-sesion.vue) pide `username`, busca el `email` correspondiente en `profiles.display_name` y luego hace `signInWithPassword` con ese email. Cuando agregues flujos de auth recordá este indirect.
- **Re-sync de hábitos**: la home corre `syncHabitsWithNewDay()` al montarse, en cada `visibilitychange` y en un `setInterval` que detecta cambio de día — ver [pages/index.vue:195-252](app/pages/index.vue). No remover sin entender por qué está.
- **Sin tipos de Supabase**: `supabase.types: false` en [nuxt.config.ts](nuxt.config.ts). El proyecto es JS puro; no asumir tipos generados del esquema.
- **PWA con soporte offline**: la app usa `@vite-pwa/nuxt` con workbox para cachear assets y respuestas de red. `OfflineBanner` informa al usuario cuando pierde conexión. El manifest y los shortcuts de app están configurados en [nuxt.config.ts](nuxt.config.ts). El viewport está bloqueado a `user-scalable=no` y declara `apple-mobile-web-app-capable`.
- **Plugin desactivado**: en [nuxt.config.ts](nuxt.config.ts) hay un `preload-data.js` comentado. No está activo.
- **Frases y tips diarios**: se eligen al azar al iniciar la sesión y se cachean en `sessionStorage` (`sessionPhrase`, `sessionTip`). Se limpian al cerrar sesión.
- **RLS de comunidades**: al crear una comunidad, [useCommunities.createCommunity](app/composables/useCommunities.js) hace el `insert` sin `.select()` y luego una `select` separada — workaround para evitar el RLS de `SELECT` antes de ser miembro.
- **Swipe en cards de hábitos**: `HabitsCard` y `HabitsCommunityCard` implementan swipe táctil para completar/descompletar hábitos. Lógica de `touchstart`/`touchend` con animación de fill. No romper la dirección del swipe al modificar el layout de las cards.
- **DateNavigator bloqueado a la semana actual**: `HabitsDateNavigator` solo muestra los últimos 7 días hasta hoy. No navega hacia semanas anteriores ni permite seleccionar fechas futuras. Cada día tiene un arco de progreso circular calculado contra los hábitos del día.
- **Realtime en comunidades**: la página [`/comunidades/[id]/`](app/pages/comunidades/[id]/index.vue) usa Supabase Realtime (`client.channel()`) para escuchar cambios en `community_messages` y `community_habit_logs` en tiempo real. El canal se limpia en `onUnmounted`.

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
| `weekly_goal_met` | 25 | Todos los hábitos semanales cumplen su meta (una vez/semana, guard en localStorage `lastWeeklyGoalXP`) | Cualquier hábito semanal se descompletea bajo la meta |
| `first_habit_created` | 15 | El usuario crea su primer hábito | — |
| `comeback` | 5 | El usuario vuelve tras 3+ días de inactividad (una vez/sesión, guard en localStorage `lastComebackCheck`) | — |
| `community_habit_completed` | 8 | Usuario completa el hábito de una comunidad | Usuario descompletea el hábito comunitario |
| `create_community` | 30 | Usuario crea una comunidad | — |
| `join_community` | 15 | Usuario visita una comunidad por primera vez (guard en localStorage `joined_community_{id}`) | — |
| `friend_added` | 10 | Usuario acepta una solicitud de amistad | Usuario elimina un amigo |

### Flujo técnico

- `grantXP(actionKey)` y `revokeXP(actionKey)` en [useExperience.js](app/composables/useExperience.js) son el punto de entrada único. Ambos actualizan `profiles.experience_points` y `profiles.current_level`, sincronizan el `authStore`, y encolan una notificación en `xpNotificationStore`.
- Las notificaciones se muestran en [XpNotification.vue](app/components/XpNotification.vue): `+ N XP` en amarillo para ganancias, `- N XP` en rojo para revocaciones. Se descartan automáticamente a los 5 segundos.
- Los milestones de racha (`streak_7` … `streak_100`) se verifican con `checkStreakMilestone(streak)` — nunca se revocan aunque se pierda la racha.
- Los guards de "una vez por día/semana" usan `localStorage`; si se revoca el bono, se limpia el guard para que pueda re-ganarse.
