# Checklist de revisión manual — Suma

Todo lo que hay que verificar a mano antes de la entrega. Ordenado por prioridad: lo de arriba es lo que más riesgo tiene de romper la demo.

---

## 0. Regresiones de los cambios del 29-07-2026 ⚠️

Estos flujos se tocaron a nivel de base de datos y de código. **Probarlos primero.**

### Comunidades (cambió la RLS de `community_members`)

- [x] **Crear una comunidad nueva** con 2+ miembros invitados desde el paso 2 → se crea sin error
- [x] El creador queda como **Admin** y los invitados como miembros
- [x] **Agregar un miembro** a una comunidad existente, siendo admin → funciona
- [ ] **Salir** de una comunidad (no siendo admin) → funciona
- [x] Un admin **elimina** a un miembro → funciona
- [x] Se otorgan los XP de `create_community` (+30) y `join_community` (+15)

> Si algo de esto falla con un error de permisos, el problema está en la policy `community_members_insert` de la migración `20260729_community_members_insert_rls.sql`.

### Login y perfil (se eliminó la policy `profiles_select`)

- [x] Login por username → entra normal
- [x] El perfil carga nombre, email y avatar
- [x] Editar perfil y guardar → persiste
- [x] Ver el perfil público de otro usuario (`/usuarios/[id]`) → se ve nombre, avatar, XP y nivel
- [x] El chat de comunidad muestra el nombre y avatar de cada persona
- [x] La lista de miembros y la de amigos muestran los perfiles correctamente
- [ ] **Panel de administración (repo aparte)**: entrar como superadmin → sigue funcionando

### Guards por usuario (se cambiaron las claves de `localStorage`)

- [x] Loguearse con la **cuenta A**, completar todos los hábitos del día → llega el bonus de +20 XP
- [X] Cerrar sesión, loguearse con la **cuenta B** en el **mismo navegador**, completar todos sus hábitos → **también** llega el +20 XP
- [ ] Con la cuenta B, verificar que el reset diario de hábitos corre normal
- [ ] Volver a la cuenta A → su racha y su progreso siguen intactos

> Antes de este cambio la segunda cuenta no cobraba el bonus ni le corría el reset. Si querés reproducir el estado viejo, borrá el `localStorage` entre sesiones.

### Mensajes de error (cambió `handleSupabaseError`)

- [x] Login con contraseña incorrecta → mensaje claro en español
- [x] Login con usuario inexistente → mensaje claro
- [x] Registro con email ya usado → mensaje claro
- [x] Provocar un error raro (ej. cortar internet a mitad de un guardado) → aparece *"Algo salió mal. Volvé a intentar en unos minutos."* y **nunca** un error en inglés

### Rutas (se reemplazaron 23 rutas hardcodeadas por `ROUTE_NAMES`)

- [x] Los 3 pasos de creación de comunidad, ida y vuelta con el botón de atrás
- [x] Tocar una card de hábito → abre el detalle
- [x] Editar un hábito → vuelve al detalle correcto
- [x] Tocar una novedad, un beneficio, una comunidad y un usuario desde sus listados
- [x] Los 4 ítems del nav inferior

---

## 1. Pendiente que no pude hacer yo

- [ ] **Activar Leaked Password Protection** en Supabase
  Dashboard → Authentication → Sign In / Providers → *Leaked password protection* → activar.
  Es el único punto que queda en el linter de seguridad. El front ya chequea contra HaveIBeenPwned, esto es defensa en profundidad.

- [ ] **Decidir qué hacer con `useNotification`**
  Se usa en 6 lugares (creación de hábito, registro, los 3 flujos de contraseña) pero **solo escribe en consola**: esos mensajes de éxito nunca los ve el usuario. Opciones: conectarlo al sistema de toasts que ya existe para XP (`XpNotification`), o sacar las llamadas. Hoy es una promesa de feedback que no se cumple.

---

## 2. Flujos de autenticación

- [x] Registro completo → llega el email de confirmación → el link funciona → entra a la app
- [x] Login por **username**, no por email (hay un indirect vía el RPC `email_for_username`)
- [x] Login con username inexistente → mensaje en español
- [x] Login con contraseña incorrecta → mensaje claro
- [x] Registro con username ya tomado → lo detecta antes de enviar
- [x] Registro con email ya registrado → lo detecta
- [x] Registro con una contraseña filtrada (probar `password123`) → la rechaza
- [x] Recuperar contraseña: pedir → email → link → nueva contraseña → `/contrasena-actualizada` → login con la nueva
- [x] Link de recuperación **expirado** → mensaje comprensible
- [x] Logout → redirige al login y no se puede volver con el botón "atrás"
- [x] Cambiar contraseña desde `/mi-perfil/cambiar-contrasena`
- [x] Entrar a una ruta privada por URL directa sin sesión → redirige al login

---

## 3. Hábitos — el corazón del proyecto

- [x] Crear un hábito de cada `frequency_type`: **diario**, **semanal**, **mensual**
- [x] Y de cada opción: `todos`, `días específicos`, `cantidad de días`
- [ ] **Caso híbrido**: hábito **diario** con `cantidad_dias_semana` (ej. 5×/semana) → suma +1 por día completado y solo pierde la racha si una semana **ya cerrada** no llegó a la cuota
- [x] Completar por swipe → +10 XP → aparece el toast
- [x] Descompletar por swipe → resta XP y **no** muestra toast
- [x] Completar y descompletar rápido (< 1,5 s) → no aparece XP fantasma
- [x] Editar un hábito sin que se rompa la racha
- [x] Borrar un hábito
- [x] Hábito con meta de valor y unidad (ej. 8 vasos de agua): el contador llega al goal y marca completado
- [x] Crear el **primer** hábito de una cuenta nueva → +15 XP (`first_habit_created`)
- [x] Borrar ese hábito y crear otro → **no** vuelve a dar los 15 XP

---

## 4. Fechas y rachas ⚠️ *lo más frágil del proyecto*

- [x] **Probar después de las 21:00 hora argentina.** Es la franja donde `toISOString()` (UTC) corre el día. El hábito de hoy tiene que seguir siendo el de hoy
- [x] Completar un **día pasado** desde el DateNavigator → se marca ese día, no hoy
- [x] Descompletar un día pasado → la racha se recalcula correctamente
- [ ] **Salvar racha**: dejar pasar un día → punto rojo en la card → entrar al detalle → "Salvar racha" mantiene la racha
- [ ] La gracia **no** se puede usar dos veces en el mismo mes para el mismo hábito
- [ ] "Perder racha" la manda a 0
- [ ] Dejar pasar **2+ días** → no ofrece gracia, resetea directo
- [ ] Llegar a una racha de 7 días → +30 XP (`streak_7`)
- [x] Perder la racha después de un hito → el XP del hito **no** se revoca

---

## 5. Comunidades

- [x] Crear comunidad (los 3 pasos completos) → +30 XP
- [x] Entrar a una comunidad ajena por primera vez → +15 XP, una sola vez
- [x] El **creador** no cobra `join_community` además de `create_community`
- [x] Completar el hábito comunitario → +8 XP
- [x] La racha comunitaria sube **solo** cuando lo completan todos los miembros
- [ ] Sumar un miembro nuevo → **no** corta la racha histórica
- [x] Chat en tiempo real: dos navegadores abiertos, mandar mensaje, aparece sin refrescar
- [x] Editar el hábito comunitario **siendo admin** → funciona
- [x] Editar **sin ser admin**, entrando por URL directa → redirige
- [ ] Completar el hábito comunitario en un **día pasado** → se marca en ese día
- [x] El hábito comunitario respeta su frecuencia (no aparece los días que no toca)
- [x] Eliminar una comunidad siendo admin

---

## 6. Amigos y perfil

- [x] Buscar un usuario, mandar solicitud, aceptar → +10 XP a quien acepta
- [x] Eliminar un amigo → revoca los 10 XP
- [x] Rechazar una solicitud
- [x] Editar perfil: cambiar nombre y username (valida unicidad)
- [x] Subir avatar → cambiarlo → el archivo viejo **se borra** del bucket (revisar Storage en Supabase)
- [x] Borrar avatar → vuelve al default y el archivo se elimina
- [x] La barra de progreso de nivel refleja el XP real

---

## 7. Notificaciones push

- [x] Activar push desde `/mi-perfil` → llega la notificación
- [x] Desactivar → deja de llegar
- [x] **Login con otra cuenta en el mismo navegador** → no llegan los push de la cuenta anterior
- [x] Push de mensaje de comunidad: **no** llega de los mensajes propios
- [x] Tocar la notificación → abre la pantalla correcta
- [x] Las 3 Edge Functions están desplegadas y los cron jobs activos

---

## 8. PWA, offline y dispositivos ⚠️

- [x] **Instalar la PWA en un iPhone real** (Safari → Compartir → Añadir a inicio). Es donde ya hubo un 404
- [x] Abrir en **Safari iOS sin instalar** — ahí la API `Notification` no existe
- [x] Instalar en Android
- [x] Modo avión → aparece el `OfflineBanner` y se ven los datos cacheados
- [x] Volver online → se recupera
- [ ] Los 4 shortcuts del manifest (Hábitos / Progreso / Comunidades / Novedades)
- [ ] Pull-to-refresh en cada página que lo registra
- [ ] El splash aparece al abrir la PWA instalada

---

## 9. Responsive

- [x] iPhone SE (375 px) — el viewport más chico realista
- [x] 480 px, 660 px (ahí cambia la tipografía base), 768 px
- [x] **≥ 992 px**: el nav pasa a sidebar izquierdo y el contenido queda centrado
- [x] DateNavigator: 7 días en mobile, 14 en desktop
- [x] Ninguna pantalla scrollea horizontalmente
- [x] Textos largos: nombre de hábito largo, nombre de comunidad largo, mensaje de chat largo

---

## 10. Estados vacíos y de error

- [x] Usuario nuevo sin hábitos
- [x] Sin comunidades / sin amigos / sin novedades / sin beneficios
- [x] Buscar un usuario que no existe
- [x] Entrar a `/mis-habitos/{id-inexistente}` → error manejado
- [x] Entrar a una URL inexistente estando logueada → `error.vue`
- [x] Los skeletons aparecen mientras carga y no hay salto de layout

---

## 11. Contenido y prolijidad *(peso alto en una tesis de diseño)*

- [x] Leer **todos** los textos de la UI buscando errores de tipeo y acentos
- [x] Verificar que el **voseo** quedó consistente en toda la app (se unificó, pero conviene releerlo)
- [x] Revisar el nombre de cada hábito predefinido y cada categoría
- [x] Los datos de demo en la base son presentables (novedades, beneficios, marcas)
- [x] Compartir un link por WhatsApp → la preview de Open Graph se ve bien
- [x] Favicon correcto en la pestaña

---

## 12. Antes de entregar

- [ ] Correr **Lighthouse** en mobile (Performance / Accessibility / Best Practices / SEO)
- [ ] El deploy de producción tiene todas las variables de entorno cargadas
- [ ] Probar la app **desde el celular de otra persona**, con datos móviles
- [ ] Revisar que `.env` no esté en el **historial** de git (hoy no está trackeado, pero conviene mirar el historial)
- [ ] Tener un **usuario de demo** listo, con hábitos, racha y comunidad ya cargados
- [ ] Tener una **segunda cuenta** lista para demostrar comunidades y amigos en vivo
- [ ] Ensayar la demo completa una vez, de punta a punta

---

## Deuda conocida (documentada, no bloqueante)

Está en CLAUDE.md §18. No hace falta resolverlo, pero conviene saberlo por si lo preguntan en la defensa:

- `user-scalable=no` en el viewport es una decisión deliberada de PWA, pero Lighthouse lo penaliza en Accessibility.
- Una URL inexistente sin sesión devuelve 302 al login en vez de 404, porque el middleware de Supabase corre antes.
- Los guards de XP viven en `localStorage`: son por dispositivo, no protegen entre dispositivos distintos.
