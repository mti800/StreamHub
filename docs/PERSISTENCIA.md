# 💾 Sistema de Persistencia - StreamHub

## Implementación Completa

StreamHub ahora cuenta con **doble persistencia**: base de datos SQLite en el servidor y localStorage en el navegador.

---

## 🗄️ Persistencia del Servidor (SQLite)

### **Qué se persiste:**

#### 1. **Usuarios**
- ✅ ID, username, rol (STREAMER/VIEWER)
- ✅ Estado de conexión (socketId)
- ✅ Fecha de creación

**Comportamiento:**
- Los usuarios se crean una sola vez
- Al reconectarse con el mismo username, se recupera el usuario existente
- El socketId se actualiza en cada reconexión

#### 2. **Streams**
- ✅ ID, streamKey, streamerId
- ✅ Estado (WAITING, ACTIVE, ENDED)
- ✅ Contador de viewers
- ✅ Fechas (creación, inicio, fin)

**Comportamiento:**
- Solo streams ACTIVOS se cargan al reiniciar
- Streams finalizados se limpian automáticamente (cada hora)
- Mantiene el historial completo en la base de datos

#### 3. **Suscripciones**
- ✅ Relación follower → following
- ✅ Fecha de suscripción

**Comportamiento:**
- Las suscripciones persisten indefinidamente
- Se restauran automáticamente al cargar el servidor

### **Archivo de Base de Datos:**
```
📁 data/
  └── streamhub.db         # Base de datos principal
  └── streamhub.db-shm     # Archivos temporales (modo WAL)
  └── streamhub.db-wal     # para mejor performance
```

---

## 🌐 Persistencia del Navegador (sessionStorage)

### **Qué se persiste:**

#### **Username del Usuario POR PESTAÑA**
- Clave: `streamhub_username` (en sessionStorage)
- Clave: `streamhub_tab_id` (ID único de la pestaña)
- Se guarda al hacer login
- **Cada pestaña es independiente**

### **Cómo funciona:**

1. **Primera pestaña:**
   - Usuario ingresa "Juan"
   - Click en "Conectar"
   - Se guarda en sessionStorage de ESTA pestaña
   - Se registra en el servidor como "Juan"

2. **Nueva pestaña (mismo navegador):**
   - Campo vacío (sessionStorage es independiente)
   - Usuario puede ingresar "María"
   - Es un usuario completamente diferente
   - **Dos pestañas = Dos usuarios distintos** ✅

3. **Recargar pestaña (F5):**
   - sessionStorage persiste en la misma pestaña
   - El username se auto-completa
   - Usuario puede reconectarse con el mismo nombre

4. **Cerrar pestaña:**
   - sessionStorage se borra automáticamente
   - Próxima vez que abras esa URL = nueva pestaña vacía

### **Diferencia con localStorage:**

| Característica | sessionStorage ✅ | localStorage ❌ |
|---------------|------------------|-----------------|
| Alcance | Solo esta pestaña | Todo el navegador |
| Duración | Hasta cerrar pestaña | Permanente |
| Múltiples pestañas | Cada una independiente | Comparten datos |
| **Uso en StreamHub** | **Usuario por pestaña** | Usuario compartido |

---

## 🔄 Flujo de Reconexión

### **Caso 1: Usuario en una pestaña**

```
1. Abre pestaña A → Ingresa "Juan"
2. sessionStorage guarda "Juan" en pestaña A
3. Abre pestaña B → Campo vacío (nueva pestaña)
4. Ingresa "María" en pestaña B
5. ✅ Pestaña A = Juan, Pestaña B = María
6. Dos usuarios simultáneos en el mismo navegador
```

### **Caso 2: Recargar pestaña**

```
1. Pestaña con "Juan" conectado
2. Presiona F5 (recargar)
3. sessionStorage mantiene "Juan"
4. Campo se auto-completa con "Juan"
5. ✅ Puede reconectarse fácilmente
```

### **Caso 3: Cerrar y reabrir pestaña**

```
1. Pestaña con "Juan" conectado
2. Cierra la pestaña (X)
3. Abre nueva pestaña → Campo vacío
4. sessionStorage se borró automáticamente
5. ✅ Debe ingresar nombre nuevamente
```

---

## 📊 Estadísticas al Iniciar

Al iniciar el servidor, verás:

```
💾 Base de datos SQLite conectada
📊 Datos persistidos: X usuarios, Y streams, Z suscripciones
```

Al cerrar (Ctrl+C):

```
[Database] Estadísticas finales: { users: X, streams: Y, subscriptions: Z }
[Database] Conexión cerrada
```

---

## 🛠️ Ventajas de este Sistema

### **Para Desarrollo:**
- ✅ No necesitas registrarte cada vez
- ✅ Tus suscripciones persisten
- ✅ Fácil debugging (archivo SQLite visible)
- ✅ Puedes borrar data/streamhub.db para resetear

### **Para Testing:**
- ✅ Simula usuarios reales con historial
- ✅ Prueba reconexiones fácilmente
- ✅ **Múltiples usuarios en una máquina (diferentes pestañas)**
- ✅ **Testing realista con varios viewers simultáneos**
- ✅ Cada pestaña es independiente

### **Para Producción:**
- ✅ Zero configuración
- ✅ Sin servidor de DB externo
- ✅ Backup simple (copia data/streamhub.db)
- ✅ Migración fácil a PostgreSQL/MySQL más adelante

---

## 🔧 Mantenimiento

### **Limpiar base de datos:**
```powershell
# Detener servidor
Ctrl+C

# Eliminar DB
Remove-Item data/streamhub.db*

# Reiniciar servidor
npm start
```

### **Ver contenido de la DB:**
Usa cualquier cliente SQLite:
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- VS Code Extension: "SQLite Viewer"
- Comando: `sqlite3 data/streamhub.db`

### **Limpiar sessionStorage de una pestaña:**
```javascript
// En consola del navegador (solo afecta ESTA pestaña):
sessionStorage.removeItem('streamhub_username')
sessionStorage.removeItem('streamhub_tab_id')
// o
sessionStorage.clear()
```

### **Ver ID de la pestaña actual:**
```javascript
// En consola del navegador:
console.log('Tab ID:', sessionStorage.getItem('streamhub_tab_id'));
console.log('Username:', sessionStorage.getItem('streamhub_username'));
```

---

## 📝 Archivos Modificados

- ✅ `src/server/Database.ts` - Servicio de base de datos
- ✅ `src/server/UserManager.ts` - Persistencia de usuarios
- ✅ `src/server/StreamManager.ts` - Persistencia de streams
- ✅ `src/server/SubscriptionManager.ts` - Persistencia de suscripciones
- ✅ `src/server/index.ts` - Inicialización y cierre graceful
- ✅ `public/streamer.html` - localStorage de usuario
- ✅ `public/viewer.html` - localStorage de usuario

---

## 🎯 Próximos Pasos (Opcional)

Si quieres mejorar aún más:

1. **Guardar preferencias de calidad** en localStorage
2. **Historial de streams vistos** por usuario
3. **Métricas de streaming** (duración, viewers máximos)
4. **Sistema de favoritos** además de suscripciones
5. **Migración a PostgreSQL** para producción real

---

**¡Disfruta de la persistencia!** 🚀
