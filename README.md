# Suma — Hábitos que suman

PWA mobile-first para formar hábitos, con gamificación (XP, niveles y rachas), comunidades con hábitos compartidos, sistema de amigos y un feed de novedades de marcas aliadas.

Proyecto final de la carrera de Diseño y Desarrollo Web — Escuela Da Vinci.

## Qué hace

- **Hábitos personales** con frecuencia diaria, semanal o mensual, meta por valor y unidad, recordatorios y sistema de rachas con una "gracia" mensual para salvar la racha.
- **Gamificación**: 14 acciones que otorgan XP (completar hábitos, hitos de racha, metas semanales, sumar amigos, crear comunidades), niveles y beneficios desbloqueables.
- **Comunidades**: hábito compartido cuya racha avanza solo cuando lo completan todos los miembros, chat interno en tiempo real y roles de admin.
- **Amigos**: búsqueda de usuarios, solicitudes y perfiles públicos.
- **Novedades**: feed de contenido de marcas aliadas, moderado desde un panel de administración externo.
- **PWA**: instalable, con service worker, soporte offline y notificaciones Web Push.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Nuxt 4 (`srcDir: app/`) + Vue 3 Composition API |
| Lenguaje | JavaScript (sin TypeScript en código fuente) |
| Estado | Pinia |
| Backend | Supabase (Postgres + Auth + Storage + Realtime + Edge Functions) |
| Estilos | Tailwind CSS + CSS global |
| PWA | `@vite-pwa/nuxt` (Workbox) |
| Hosting | Vercel (SSR) |

## Puesta en marcha

Requiere Node 20+ y npm.

```bash
npm install
cp .env.example .env   # completar con las credenciales del proyecto
npm run dev            # http://localhost:3000
```

### Variables de entorno

| Variable | Para qué |
|---|---|
| `SUPABASE_URL` | URL del proyecto de Supabase |
| `SUPABASE_KEY` | Anon key (pública) |
| `VAPID_PUBLIC_KEY` | Clave pública Web Push, se expone al cliente |
| `VAPID_PRIVATE_KEY` | Clave privada Web Push (solo servidor) |
| `VAPID_SUBJECT` | Contacto VAPID, ej. `mailto:tu@email.com` |

Las claves VAPID se generan con `npx web-push generate-vapid-keys`. Las privadas también se cargan como *secrets* de las Edge Functions en Supabase.

## Comandos

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run generate` | Generación estática |

No hay suite de tests: la verificación es manual (ver [CLAUDE.md](CLAUDE.md), §15).

## Estructura

```
app/
├── pages/          Routing file-based, rutas en español
├── components/     Agrupados por dominio, autoimportados con prefijo de carpeta
├── composables/    Toda la lógica de datos y las queries a Supabase
├── stores/         Pinia (auth, hábitos, splash, notificaciones de XP)
├── utils/          Helpers autoimportados (fechas, frecuencias, errores)
├── plugins/        Client-only (splash, sync de hábitos, push)
└── constants/      ROUTE_NAMES: fuente de verdad de las rutas
server/routes/      robots.txt y sitemap.xml (Nitro, origin-aware)
supabase/
├── functions/      Edge Functions en Deno (recordatorios y notificaciones)
└── migrations/     SQL versionado (RLS, privilegios, cron jobs)
```

## Convenciones

- **Idioma**: rutas, UI y mensajes al usuario en español rioplatense (voseo). Identificadores de código en inglés.
- **Sin comentarios en el código**: lo no obvio se documenta en [CLAUDE.md](CLAUDE.md).
- **Fechas**: la zona horaria del dominio es Argentina. Toda fecha que se compare con la base usa `getArgentineDate()`, nunca `new Date()` ni `toISOString()`.
- **Rutas**: importar siempre desde `ROUTE_NAMES`, no hardcodear paths.
- **Errores de Supabase**: pasarlos por `handleSupabaseError()`.

La documentación técnica completa —decisiones de arquitectura, lógica de rachas, sistema de XP y modelo de acceso a datos— está en [CLAUDE.md](CLAUDE.md).

## Base de datos

El esquema vive en Supabase. Las migraciones de `supabase/migrations/` cubren los cambios de seguridad y automatización; el esquema base se administra desde el dashboard.

El acceso a `profiles` está restringido por GRANTs a nivel columna: los datos sensibles (`email`, `name`, `role`) solo se leen mediante RPCs `SECURITY DEFINER`. Ver §19 de [CLAUDE.md](CLAUDE.md) antes de tocar esa tabla.
