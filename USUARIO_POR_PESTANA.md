# 🔖 Guía Rápida: Usuario por Pestaña

## ✨ Característica Principal

**Cada pestaña del navegador = Un usuario independiente**

---

## 🎯 Cómo Funciona

### **sessionStorage vs localStorage**

| Aspecto | sessionStorage (Actual ✅) | localStorage (Anterior) |
|---------|---------------------------|------------------------|
| **Alcance** | Solo esta pestaña | Todo el navegador |
| **Duración** | Hasta cerrar pestaña | Permanente |
| **Uso práctico** | Usuario por pestaña | Usuario compartido |

---

## 📖 Ejemplos de Uso

### **Ejemplo 1: Testing con Múltiples Viewers**

```
Pestaña 1: viewer.html → Usuario "Alice"
Pestaña 2: viewer.html → Usuario "Bob"  
Pestaña 3: viewer.html → Usuario "Carol"
Pestaña 4: streamer.html → Usuario "Streamer1"

✅ 3 viewers + 1 streamer en la misma máquina
✅ Todos viendo el mismo stream simultáneamente
✅ Chat interactivo entre todos
```

### **Ejemplo 2: Desarrollo y Testing**

```
Pestaña 1: Streamer transmitiendo
Pestaña 2: Viewer normal
Pestaña 3: Viewer con nombre repetido (prueba reconexión)
Pestaña 4: DevTools abierto monitoreando

✅ Simula escenario real con múltiples usuarios
✅ Sin necesidad de múltiples navegadores
```

### **Ejemplo 3: Demo/Presentación**

```
Monitor 1 - Pestaña 1: Streamer
Monitor 2 - Pestañas 2-5: Diferentes viewers

✅ Demo completa en una sola máquina
✅ Muestra la experiencia de múltiples usuarios
```

---

## 🔧 Comportamiento Detallado

### **Al Abrir Nueva Pestaña:**
```javascript
1. Se genera ID único: "tab_1699000000000_abc123def"
2. sessionStorage vacío (nueva pestaña)
3. Campo de username vacío
4. Usuario puede ingresar cualquier nombre
```

### **Al Ingresar Username:**
```javascript
1. Usuario ingresa "Alice"
2. Se guarda en sessionStorage de ESTA pestaña
3. Se envía al servidor
4. Servidor crea/reconecta usuario "Alice"
```

### **Al Recargar Pestaña (F5):**
```javascript
1. sessionStorage persiste en la misma pestaña
2. tabId se mantiene: "tab_1699000000000_abc123def"
3. Username se mantiene: "Alice"
4. Campo se auto-completa
5. Usuario puede reconectarse fácilmente
```

### **Al Cerrar Pestaña:**
```javascript
1. sessionStorage se borra automáticamente
2. Próxima pestaña nueva = sessionStorage limpio
3. Nuevo tabId generado
4. Campo de username vacío
```

---

## 💡 Casos de Uso Reales

### **Caso 1: Mismo Usuario, Múltiples Pestañas**

¿Qué pasa si uso "Alice" en 3 pestañas?

```
Pestaña A: Alice → tabId: tab_xxx → socketId: socket_1
Pestaña B: Alice → tabId: tab_yyy → socketId: socket_2  
Pestaña C: Alice → tabId: tab_zzz → socketId: socket_3

✅ Servidor reconoce a "Alice" como el mismo usuario
✅ Pero cada pestaña tiene conexión independiente
✅ En la DB hay 1 usuario "Alice"
✅ En el servidor hay 3 conexiones de "Alice"
```

**¿Por qué es útil?**
- Testing de reconexiones
- Simular usuario en móvil + desktop
- Probar sincronización de suscripciones

### **Caso 2: Diferentes Usuarios, Mismo Navegador**

```
Pestaña 1: "Alice" 
Pestaña 2: "Bob"
Pestaña 3: "Carol"

✅ 3 usuarios completamente independientes
✅ Cada uno con sus suscripciones
✅ Cada uno puede ver diferentes streams
✅ Testing realista sin múltiples navegadores
```

### **Caso 3: Development Workflow**

```
Terminal 1: npm start (servidor)
Terminal 2: logs en tiempo real

Navegador:
├── Pestaña 1 (Streamer): "DevStreamer"
├── Pestaña 2 (Viewer): "TestViewer1" 
├── Pestaña 3 (Viewer): "TestViewer2"
├── Pestaña 4 (DevTools): Network/Console
└── Pestaña 5 (Docs): README.md

✅ Workflow completo en un solo navegador
```

---

## 🐛 Debugging

### **Ver información de la pestaña:**

Abre **DevTools** (F12) → **Console**:

```javascript
// Ver ID único de esta pestaña
console.log('Tab ID:', sessionStorage.getItem('streamhub_tab_id'));

// Ver usuario de esta pestaña
console.log('Username:', sessionStorage.getItem('streamhub_username'));

// Ver todo el sessionStorage
console.log('Session Data:', sessionStorage);

// Comparar con otra pestaña
// (Cada pestaña mostrará valores diferentes)
```

### **Limpiar sessionStorage de UNA pestaña:**

```javascript
// En Console de la pestaña que quieres limpiar:
sessionStorage.clear();
location.reload(); // Recargar para ver efecto
```

### **Simular nueva pestaña sin abrir una:**

```javascript
// Generar nuevo Tab ID en esta pestaña
const newTabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
sessionStorage.setItem('streamhub_tab_id', newTabId);
sessionStorage.removeItem('streamhub_username');
location.reload();
```

---

## 🎓 Conceptos Clave

### **sessionStorage**
- Almacenamiento temporal del navegador
- Ámbito: Una pestaña específica
- Duración: Hasta cerrar la pestaña
- Persiste al recargar (F5)
- Se borra al cerrar pestaña

### **tabId**
- Identificador único de la pestaña
- Formato: `tab_timestamp_randomstring`
- Se genera una vez por pestaña
- Persiste en sessionStorage
- Útil para debugging

### **Usuario en el Servidor**
- Se identifica por username
- Puede tener múltiples conexiones (sockets)
- Cada pestaña = una conexión diferente
- La DB almacena el último socketId activo

---

## ✅ Ventajas de este Sistema

1. **Testing Simplificado**
   - Múltiples usuarios en una máquina
   - No necesitas VMs o navegadores diferentes

2. **Desarrollo Realista**
   - Simula escenarios reales de múltiples usuarios
   - Fácil probar chat, reacciones, viewers

3. **Flexibilidad**
   - Mismo usuario en varias pestañas (testing de reconexión)
   - Diferentes usuarios en varias pestañas (testing de interacción)

4. **Limpieza Automática**
   - Cerrar pestaña = limpiar sessionStorage
   - No hay "basura" acumulada

5. **UX Mejorada**
   - Campo auto-completado al recargar
   - Cada pestaña independiente
   - Botón "Cambiar Usuario" simple

---

## 🚀 Prueba Ahora

1. **Abre 3 pestañas** de viewer.html
2. **Ingresa nombres diferentes** en cada una
3. **Abre DevTools** en cada pestaña y ejecuta:
   ```javascript
   console.log('Soy:', sessionStorage.getItem('streamhub_username'));
   ```
4. **Verás nombres diferentes** en cada pestaña ✅

---

## 📚 Para Más Información

- Ver `PERSISTENCIA.md` para detalles de la base de datos
- Consulta las DevTools de Chrome para explorar sessionStorage
- Lee la documentación de [sessionStorage MDN](https://developer.mozilla.org/es/docs/Web/API/Window/sessionStorage)

---

**¡Disfruta de tus usuarios por pestaña!** 🎉
