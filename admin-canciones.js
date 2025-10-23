// Variables globales
let todasLasCanciones = [];
let cancionesFiltradas = [];
let firebaseDb = null;
let collection, getDocs, doc, updateDoc, query, where, orderBy;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎵 Admin de canciones iniciado');
    setTimeout(inicializarFirebaseAdmin, 1000);
});

// Inicializar Firebase
async function inicializarFirebaseAdmin() {
    try {
        console.log('🔥 Conectando Firebase para admin canciones...');
        
        if (!window.firebaseDb) {
            console.error('❌ Firebase no está disponible');
            mostrarError('Firebase no está inicializado. Verifica la configuración.');
            return;
        }
        
        firebaseDb = window.firebaseDb;
        console.log('✅ Firebase DB obtenido');

        // Importar funciones
        const firestoreModule = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');
        
        collection = firestoreModule.collection;
        getDocs = firestoreModule.getDocs;
        doc = firestoreModule.doc;
        updateDoc = firestoreModule.updateDoc;
        query = firestoreModule.query;
        where = firestoreModule.where;
        orderBy = firestoreModule.orderBy;
        
        console.log('✅ Funciones importadas');

        // Cargar canciones
        await cargarTodasLasCanciones();
        
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        mostrarError('Error conectando con Firebase: ' + error.message);
    }
}

// Cargar todas las canciones
async function cargarTodasLasCanciones() {
    const loading = document.getElementById('loadingAdmin');
    const container = document.getElementById('cancionesAdmin');
    
    try {
        console.log('📊 Cargando todas las canciones...');
        loading.style.display = 'block';
        container.innerHTML = '';
        
        const cancionesRef = collection(firebaseDb, 'canciones');
        const querySnapshot = await getDocs(cancionesRef);
        
        console.log(`📊 ${querySnapshot.size} canciones encontradas`);
        
        todasLasCanciones = [];
        querySnapshot.forEach((docSnapshot) => {
            const data = {
                id: docSnapshot.id,
                ...docSnapshot.data()
            };
            todasLasCanciones.push(data);
            console.log(`🎵 ${data.titulo} - ${data.estado || 'sin estado'} - ${data.genero || 'sin género'}`);
        });
        
        // Ordenar por fecha de creación
        todasLasCanciones.sort((a, b) => {
            const fechaA = a.fechaCreacion ? (a.fechaCreacion.toDate ? a.fechaCreacion.toDate() : new Date(a.fechaCreacion)) : new Date(0);
            const fechaB = b.fechaCreacion ? (b.fechaCreacion.toDate ? b.fechaCreacion.toDate() : new Date(b.fechaCreacion)) : new Date(0);
            return fechaB - fechaA;
        });
        
        console.log(`✅ ${todasLasCanciones.length} canciones cargadas`);
        
        actualizarEstadisticas();
        aplicarFiltros();
        
        if (todasLasCanciones.length === 0) {
            mostrarNotificacion('ℹ️ No hay canciones en la base de datos', 'info');
        } else {
            mostrarNotificacion(`✅ ${todasLasCanciones.length} canciones cargadas`, 'success');
        }
        
    } catch (error) {
        console.error('❌ Error cargando canciones:', error);
        mostrarError(`Error cargando canciones: ${error.message || 'Error desconocido'}`);
    } finally {
        loading.style.display = 'none';
    }
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const pendientes = todasLasCanciones.filter(c => c.estado === 'pendiente').length;
    const publicadas = todasLasCanciones.filter(c => c.estado === 'publicado').length;
    const rechazadas = todasLasCanciones.filter(c => c.estado === 'rechazado').length;
    const total = todasLasCanciones.length;
    
    document.getElementById('totalPendientes').textContent = pendientes;
    document.getElementById('totalPublicadas').textContent = publicadas;
    document.getElementById('totalRechazadas').textContent = rechazadas;
    document.getElementById('totalCanciones').textContent = total;
    
    console.log(`📊 Estadísticas: ${pendientes} pendientes, ${publicadas} publicadas, ${rechazadas} rechazadas, ${total} total`);
}

// Aplicar filtros
function aplicarFiltros() {
    const filtroEstado = document.getElementById('filtroEstado').value;
    const filtroGenero = document.getElementById('filtroGenero').value;
    const busqueda = document.getElementById('busqueda').value.toLowerCase();
    
    cancionesFiltradas = todasLasCanciones.filter(cancion => {
        // Filtro por estado
        if (filtroEstado !== 'todos' && cancion.estado !== filtroEstado) return false;
        
        // Filtro por género
        if (filtroGenero !== 'todos' && cancion.genero !== filtroGenero) return false;
        
        // Filtro por búsqueda
        if (busqueda) {
            const textoCompleto = [
                cancion.titulo || '',
                cancion.artista || '',
                cancion.genero || '',
                cancion.letra || ''
            ].join(' ').toLowerCase();
            
            if (!textoCompleto.includes(busqueda)) return false;
        }
        
        return true;
    });
    
    console.log(`🔍 Filtros aplicados: ${cancionesFiltradas.length} canciones mostradas`);
    mostrarCanciones();
}

// Mostrar canciones
function mostrarCanciones() {
    const container = document.getElementById('cancionesAdmin');
    const noResultados = document.getElementById('noResultados');
    
    if (cancionesFiltradas.length === 0) {
        container.innerHTML = '';
        noResultados.style.display = 'block';
        return;
    }
    
    noResultados.style.display = 'none';
    
    const html = cancionesFiltradas.map(cancion => `
        <div class="cancion-admin-card">
            <div class="cancion-header">
                <div class="cancion-info">
                    <h3>${cancion.titulo || 'Sin título'}</h3>
                    <div class="cancion-meta">
                        <span class="meta-item">🎤 ${cancion.artista || 'Artista desconocido'}</span>
                        <span class="meta-item">🎼 ${getGeneroText(cancion.genero)}</span>
                        ${cancion.fechaCreacion ? `<span class="meta-item">📅 ${formatearFecha(cancion.fechaCreacion)}</span>` : ''}
                    </div>
                </div>
                <div class="estado-badge estado-${cancion.estado || 'pendiente'}">
                    ${getEstadoText(cancion.estado)}
                </div>
            </div>
            
            ${cancion.letra ? `
                <div style="background: #0f0f0f; padding: 1rem; border-radius: 8px; margin: 1rem 0; max-height: 100px; overflow: hidden;">
                    <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.4;">
                        ${cancion.letra.substring(0, 150)}${cancion.letra.length > 150 ? '...' : ''}
                    </p>
                </div>
            ` : ''}
            
            <div class="cancion-actions">
                <button onclick="verDetalle('${cancion.id}')" class="btn-admin btn-ver">
                    👁️ Ver detalle
                </button>
                
                ${cancion.estado === 'pendiente' ? `
                    <button onclick="cambiarEstado('${cancion.id}', 'publicado')" class="btn-admin btn-aprobar">
                        ✅ Aprobar
                    </button>
                    <button onclick="cambiarEstado('${cancion.id}', 'rechazado')" class="btn-admin btn-rechazar">
                        ❌ Rechazar
                    </button>
                ` : ''}
                
                ${cancion.estado === 'publicado' ? `
                    <button onclick="cambiarEstado('${cancion.id}', 'pendiente')" class="btn-admin">
                        📝 Volver a pendiente
                    </button>
                ` : ''}
                
                ${cancion.estado === 'rechazado' ? `
                    <button onclick="cambiarEstado('${cancion.id}', 'pendiente')" class="btn-admin btn-aprobar">
                        🔄 Revisar de nuevo
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Ver detalle de canción
function verDetalle(cancionId) {
    const cancion = todasLasCanciones.find(c => c.id === cancionId);
    if (!cancion) return;
    
    const modal = document.getElementById('modalDetalle');
    const contenido = document.getElementById('contenidoDetalle');
    
    contenido.innerHTML = `
        <div style="padding: 2rem;">
            <h2 style="color: var(--primary-color); margin-bottom: 1rem;">${cancion.titulo || 'Sin título'}</h2>
            
            <div style="background: #333; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p><strong>Artista:</strong> ${cancion.artista || 'Desconocido'}</p>
                <p><strong>Género:</strong> ${getGeneroText(cancion.genero)}</p>
                <p><strong>Estado:</strong> ${getEstadoText(cancion.estado)}</p>
                ${cancion.fechaCreacion ? `<p><strong>Fecha:</strong> ${formatearFecha(cancion.fechaCreacion)}</p>` : ''}
            </div>
            
            ${cancion.letra ? `
                <div style="margin-top: 1rem;">
                    <strong>Letra:</strong>
                    <div style="background: #0f0f0f; padding: 1rem; border-radius: 8px; margin-top: 0.5rem; max-height: 300px; overflow-y: auto;">
                        <pre style="color: var(--text-muted); font-family: inherit; white-space: pre-wrap; margin: 0;">${cancion.letra}</pre>
                    </div>
                </div>
            ` : ''}
            
            ${cancion.acordes ? `
                <div style="margin-top: 1rem;">
                    <strong>Acordes:</strong>
                    <div style="background: #0f0f0f; padding: 1rem; border-radius: 8px; margin-top: 0.5rem;">
                        <p style="color: var(--text-muted);">${cancion.acordes}</p>
                    </div>
                </div>
            ` : ''}
            
            ${cancion.video ? `
                <div style="margin-top: 1rem;">
                    <strong>Video:</strong>
                    <div style="background: #0f0f0f; padding: 1rem; border-radius: 8px; margin-top: 0.5rem;">
                        <a href="${cancion.video}" target="_blank" style="color: var(--primary-color);">${cancion.video}</a>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Cambiar estado de canción
function cambiarEstado(cancionId, nuevoEstado) {
    // Crear modal de confirmación personalizado
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal-overlay';
    confirmModal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    confirmModal.innerHTML = `
        <div style="background: var(--card-bg); padding: 2rem; border-radius: 12px; max-width: 400px; text-align: center;">
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Confirmar cambio</h3>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">¿Cambiar estado a "${getEstadoText(nuevoEstado)}"?</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button onclick="this.closest('.modal-overlay').remove()" style="padding: 0.8rem 1.5rem; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Cancelar
                </button>
                <button onclick="this.closest('.modal-overlay').remove(); actualizarEstadoFirebase('${cancionId}', '${nuevoEstado}')" style="padding: 0.8rem 1.5rem; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Confirmar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmModal);
}

// Actualizar estado en Firebase
async function actualizarEstadoFirebase(cancionId, nuevoEstado) {
    try {
        console.log(`🔄 Actualizando ${cancionId} a ${nuevoEstado}`);
        
        const cancionRef = doc(firebaseDb, 'canciones', cancionId);
        await updateDoc(cancionRef, {
            estado: nuevoEstado,
            fechaModificacion: new Date()
        });
        
        // Actualizar localmente
        const cancion = todasLasCanciones.find(c => c.id === cancionId);
        if (cancion) {
            cancion.estado = nuevoEstado;
        }
        
        mostrarNotificacion(`✅ Estado actualizado a "${getEstadoText(nuevoEstado)}"`, 'success');
        actualizarEstadisticas();
        aplicarFiltros();
        
    } catch (error) {
        console.error('❌ Error actualizando:', error);
        mostrarNotificacion('❌ Error actualizando estado', 'error');
    }
}

// Funciones de utilidad
function getGeneroText(genero) {
    const generos = {
        'alabanza': '🙌 Alabanza',
        'adoracion': '🙏 Adoración',
        'juvenil': '🎸 Juvenil',
        'gen': '🌟 Gen',
        'tradicional': '📿 Tradicional'
    };
    return generos[genero] || genero || 'Sin género';
}

function getEstadoText(estado) {
    const estados = {
        'pendiente': '⏳ Pendiente',
        'publicado': '✅ Publicado',
        'rechazado': '❌ Rechazado'
    };
    return estados[estado] || estado || 'Sin estado';
}

function formatearFecha(fecha) {
    if (!fecha) return 'Sin fecha';
    try {
        const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
        return date.toLocaleDateString('es-ES');
    } catch (error) {
        return 'Fecha inválida';
    }
}

function recargarDatos() {
    location.reload();
}

function cerrarModalDetalle() {
    const modal = document.getElementById('modalDetalle');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function mostrarError(mensaje) {
    const loading = document.getElementById('loadingAdmin');
    loading.innerHTML = `
        <div style="text-align: center; color: #F44336; padding: 2rem;">
            <h3>❌ Error</h3>
            <p style="margin: 1rem 0;">${mensaje}</p>
            <button onclick="location.reload()" style="padding: 0.8rem 1.5rem; background: #FF8C00; color: white; border: none; border-radius: 8px; cursor: pointer;">
                🔄 Recargar página
            </button>
        </div>
    `;
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const colores = { success: '#4CAF50', error: '#F44336', info: '#2196F3' };
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: ${colores[tipo]};
        color: white; padding: 1rem; border-radius: 8px; z-index: 10000;
    `;
    notif.textContent = mensaje;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 4000);
}

// Event listeners
document.addEventListener('click', function(event) {
    const modal = document.getElementById('modalDetalle');
    if (event.target === modal) cerrarModalDetalle();
});

// Funciones globales
window.recargarDatos = recargarDatos;
window.aplicarFiltros = aplicarFiltros;
window.verDetalle = verDetalle;
window.cambiarEstado = cambiarEstado;
window.actualizarEstadoFirebase = actualizarEstadoFirebase;
window.cerrarModalDetalle = cerrarModalDetalle;

console.log('✅ Admin de canciones cargado');