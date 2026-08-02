# Suma — Qué cambió y qué chequear

Auditoría de performance sobre los 4 síntomas reportados. Todo está en la branch
`perf/optimizacion-fetching` (no en `main`).

```bash
git checkout perf/optimizacion-fetching
npm run dev
```

---

## Los números

| Qué hacés | Antes | Ahora |
|---|---|---|
| Completar un hábito | 4,2 s | **2,0 s** |
| Cambiar de día | 3,5 s | **1,4 s** |
| Que aparezca la racha | ~3 s | **instantáneo** |
| Que cargue tu foto de perfil | 1,4 s | **instantáneo** |
| Cargar la pantalla de inicio | 2,4 s | 2,2 s |

---

## Por qué pasaba

Cada pedido de datos al servidor tarda ~200 ms **fijos**, sin importar qué pida.
No es que la base sea lenta (responde en 0,3 milisegundos) ni que esté lejos.

El problema era la **cantidad** de pedidos y que iban en fila india, uno esperando
al otro. Completar un hábito disparaba 17 pedidos seguidos: 17 × 200 ms = 4 segundos.

Se bajó a 11 pedidos y varios ahora van en paralelo.

Ejemplo concreto: la lista de hábitos se pedía **4 veces** en un solo swipe. Ahora
se pide una.

---

## Qué chequear

### 1. Completar un hábito ⭐ el más importante

Deslizá una tarjeta hacia la derecha en la pantalla de inicio.

- [ ] El tilde se marca al instante (ya funcionaba)
- [ ] **La racha sube al instante** — antes tardaba ~3 segundos
- [ ] Deslizá a la izquierda: la racha baja al instante
- [ ] El número final coincide con el que queda al recargar la página

### 2. Completar en un día pasado ⚠️ el más delicado

Tocá un día anterior en la barra de fechas, después completá un hábito.

- [ ] La racha **NO** cambia al instante, espera ~1,5 s

Esto es **correcto y a propósito**: en un día pasado la racha se recalcula
mirando todo el historial, así que no se puede adivinar. Si cambiara al toque
podría mostrar un número equivocado.

- [ ] El número que queda es el correcto (comparalo recargando la página)

### 3. Moverse entre días

Tocá distintos días en la barra de arriba.

- [ ] Se siente más rápido
- [ ] **Aparecen los recuadros grises de carga** (antes se quedaba con los datos
      del día anterior y parecía colgado)
- [ ] Los hábitos que se muestran son los correctos de cada día
- [ ] El anillo de progreso de cada día es correcto

### 4. Hábitos con frecuencia especial ⚠️ probar sí o sí

Con hábitos de tipo **"cantidad de días por semana"** (ej. 3 veces por semana).
La cuenta de prueba usada no tenía ninguno, así que esta parte **no se pudo
verificar en vivo**.

- [ ] Los puntitos de progreso (brillos) muestran el número correcto
- [ ] El hábito desaparece de la lista al cumplir la cuota de la semana
- [ ] Aparece en "Ver todos mis hábitos" cuando ya cumplió
- [ ] Cambiar de día no rompe el conteo

Esta parte es la que **más mejora** con los cambios: antes hacía un pedido al
servidor por cada hábito, ahora hace uno solo para todos.

### 5. Comunidades

- [ ] La lista muestra bien la cantidad de participantes
- [ ] El hábito comunitario se completa y se ve el progreso de los demás
- [ ] La racha de la comunidad es la correcta

### 6. XP y niveles

- [ ] Al completar un hábito aparece el cartelito de +XP
- [ ] El XP y el nivel suben bien
- [ ] Al descompletar, el XP se resta

### 7. Volver a la app

Salí de la app (cambiá de pestaña o mandala al fondo) y volvé.

- [ ] Vuelve al día de hoy si pasó la medianoche
- [ ] Si es el mismo día, no recarga de más

---

## Cosas que conviene saber

**Un bug que apareció de paso y se arregló**: el cálculo de nivel modificaba una
lista compartida por error. No se notaba antes; con los cambios nuevos sí habría
roto los niveles. Ya está corregido.

**Un bug que ya existía y NO se tocó**: en *Progreso* y *Comunidades*, el saludo
de arriba dice "Nivel 1" y no muestra el nombre. En *Mi perfil* se ve bien.
Se verificó que **ya pasaba antes** de esta auditoría — es otro tema, aparte.

**Lo que se decidió NO tocar**, porque ya estaba bien resuelto:
- El tilde instantáneo al completar (funcionaba perfecto)
- El manejo de fechas y zona horaria
- Los gestos de deslizar y el "tirar para recargar"
- La base de datos: le faltan índices, pero hoy responde en 0,3 ms. Conviene
  revisarlo recién cuando haya muchísimos más datos.

**No hace falta mudar la base de datos de región.** Era una sospecha inicial, se
midió y no era el problema: mudarla ganaría apenas un 10 %, con bastante riesgo.

---

## Lo que quedó pendiente

**Un síntoma sigue sin resolverse**: volver a un día que ya viste lo pide todo de
nuevo, no se guarda nada en memoria.

Arreglarlo requiere una decisión de producto, porque hay un compromiso real:

- **Guardar datos en memoria** = más rápido, pero si otra persona de tu comunidad
  completa el hábito compartido desde su celular, podés tardar hasta un minuto en
  verlo.
- **No guardar nada** = siempre al día, pero siempre lento.

La recomendación es guardar en memoria con un vencimiento corto (1 minuto) y
refrescar al toque cuando vos completás algo. Para un tracker de hábitos, ese
minuto de demora en ver el progreso ajeno no molesta.

**Hay que decidir esto antes de seguir.**

---

## Si algo sale mal

Los cambios están sin commitear en la branch. Para volver todo atrás:

```bash
git checkout .
```
