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
| `friend_requests` | `sender_id`, `receiver_id`, `status` |
| `news` | `title`, `content`, `image_url`, `publication_date`, `brand_id`, `category_id`, `status` |
| `news_categories` | `id`, `name` |
| `levels` | `level_number`, `xp_required` |

**Errores de Supabase**: pasarlos siempre por [`handleSupabaseError()`](app/utils/handleSupabaseError.js) — traduce los mensajes a español.

## 8. Composables (lógica de dominio)

- [useHabits.js](app/composables/useHabits.js) — CRUD de hábitos, logs por fecha, rachas (diaria/semanal/mensual), `syncHabitsWithNewDay`, `shouldShowHabitForDate`, `getArgentineDate`. Es el composable más grande (~800 líneas) y concentra toda la lógica de fechas y streaks.
- [useExperience.js](app/composables/useExperience.js) — XP, niveles, milestones. Funciones: `grantXP`, `checkStreakMilestone`, `checkAllHabitsDaily`, `checkFirstHabitCreated`, `checkWeeklyGoalMet`, `checkComeback`.
- [useCommunities.js](app/composables/useCommunities.js) — comunidades, hábitos compartidos y completions por miembro.
- [useFriends.js](app/composables/useFriends.js) — búsqueda de usuarios, solicitudes y lista de amigos.
- [useNovedades.js](app/composables/useNovedades.js) — feed de novedades (`status = 'approved'`) y categorías.
- [useNotification.js](app/composables/useNotification.js) — wrapper sobre `console.*`. Stub para una capa futura de notificaciones in-app.

**Patrón**: cada composable llama a `useSupabaseClient()` adentro y expone funciones `async`. Los que requieren sesión definen un helper interno `getUserId()` que tira si no hay sesión.

## 9. Stores (Pinia)

- [authStore.js](app/stores/authStore.js) — `user`, `profile`, `loading`, `error`, `isLoggedIn`, `fetchUser`, `updateProfile`, `logout`.
- [habitStore.js](app/stores/habitStore.js) — estado efímero durante el wizard de creación de hábito (`selectedHabit`, `isCustom`).
- [splashStore.js](app/stores/splashStore.js) — visibilidad del splash inicial.

## 10. Plugins (client-only)

- [plugins/splash.client.js](app/plugins/splash.client.js) — oculta el splash a los 2.5 s o al primer cambio de ruta.
- [plugins/habitSync.client.js](app/plugins/habitSync.client.js) — en `visibilitychange` (vuelta del background) llama a `syncHabitsWithNewDay()` y `checkComeback()`.

## 11. Componentes

Nuxt 4 autoimporta los componentes y los **prefija con el nombre de la carpeta**. Hay que tenerlo presente al consumirlos en plantillas:

| Archivo | Uso en template |
|---|---|
| `components/heading/H1.vue` | `<HeadingH1>` |
| `components/form/TextField.vue` | `<FormTextField>` |
| `components/habits/Card.vue` | `<HabitsCard>` |
| `components/default/Section.vue` | `<DefaultSection>` |
| `components/skeleton/HabitCard.vue` | `<SkeletonHabitCard>` |
| `components/community/friends/Card.vue` | `<CommunityFriendsCard>` |

**Carpetas existentes**: `auth/`, `benefits/`, `button/` (Primary/Secondary/Terciary), `community/` (+ `chat/`, `friends/`), `default/` (Header/Main/Nav/Section), `form/`, `habits/`, `heading/`, `navigation/`, `progress/`, `skeleton/`.

**Top-level**: `Avatar`, `Loader`, `MobileOnlyScreen`, `Splash`.

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
- **Re-sync de hábitos**: la home corre `syncHabitsWithNewDay()` al montarse, en cada `visibilitychange` y en un `setInterval` de 5 min que detecta cambio de día — ver [pages/index.vue:189-222](app/pages/index.vue). No remover sin entender por qué está.
- **Sin tipos de Supabase**: `supabase.types: false` en [nuxt.config.ts](nuxt.config.ts). El proyecto es JS puro; no asumir tipos generados del esquema.
- **PWA-ready**: el viewport está bloqueado a `user-scalable=no` y la app declara `apple-mobile-web-app-capable`. Pensada para instalarse en mobile.
- **Plugin desactivado**: en [nuxt.config.ts:70-72](nuxt.config.ts) hay un `preload-data.js` comentado. No está activo.
- **Frases y tips diarios**: se eligen al azar al iniciar la sesión y se cachean en `sessionStorage` (`sessionPhrase`, `sessionTip`). Se limpian al cerrar sesión.
- **RLS de comunidades**: al crear una comunidad, [useCommunities.createCommunity](app/composables/useCommunities.js) hace el `insert` sin `.select()` y luego una `select` separada — workaround para evitar el RLS de `SELECT` antes de ser miembro.

## 15. Cómo verificar cambios

No hay test suite. Para validar:

1. `npm run dev` y probar el flujo en el navegador con DevTools en viewport mobile (≤ 768 px).
2. Para cambios de auth, probar login + redirect + logout.
3. Para cambios en hábitos, probar: crear, loggear progreso, completar, simular cambio de día (visibility change o esperar el interval), borrar.
4. Revisar la consola del navegador — el código loguea bastante (`[HABIT SYNC]`, `[PAGE INDEX]`, etc.).
