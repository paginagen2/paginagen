// Variables globales
let todosLosRecursos = [];
let recursosFiltrados = [];
let firebaseDb = null;
let collection, getDocs, doc, updateDoc, query, where, orderBy;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Página admin iniciada');
    setTimeout(inicializarFirebaseAdmin, 1000); // Esperar 1 segundo
});

// Inicializar Firebase con mejor debugging
async function inicializarFirebaseAdmin() {
    try {
        console.log('🔥 Intentando conectar Firebase...');
        
        // Verificar que window.firebaseDb esté disponible
        if (!window.firebaseDb) {
            console.error('❌ window.firebaseDb no está disponible');
            mostrarError('Firebase no está inicializado. Verifica la configuración.');
            return;
        }
        
        firebaseDb = window.firebaseDb;
        console.log('✅ Firebase DB obtenido:', firebaseDb);

        // Importar funciones
        console.log('📦 Importando funciones de Firestore...');
        const firestoreModule = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');
        
        collection = firestoreModule.collection;
        getDocs = firestoreModule.getDocs;
        doc = firestoreModule.doc;
        updateDoc = firestoreModule.updateDoc;
        query = firestoreModule.query;
        where = firestoreModule.where;
        orderBy = firestoreModule.orderBy;
        
        console.log('✅ Funciones importadas correctamente');

        // Probar conexión básica
        await probarConexionBasica();
        
        // Si llegamos aquí, cargar recursos
        await cargarTodosLosRecursos();
        
    } catch (error) {
        console.error('❌ Error en inicializarFirebaseAdmin:', error);
        mostrarError('Error conectando con Firebase: ' + error.message);
    }
}

// Probar conexión básica a Firebase
async function probarConexionBasica() {
    try {
        console.log('🧪 Probando conexión básica...');
        
        const testRef = collection(firebaseDb, 'recursos');
        console.log('✅ Referencia a colección creada');
        
        // Intentar obtener solo 1 documento para probar
        const testQuery = query(testRef);
        console.log('✅ Query creado');
        
        const snapshot = await getDocs(testQuery);
        console.log('✅ Query ejecutado, documentos encontrados:', snapshot.size);
        
        return true;
    } catch (error) {
        console.error('❌ Error en prueba básica:', error);
        throw error;
    }
}

// Cargar recursos con consulta simple
async function cargarTodosLosRecursos() {
    const loading = document.getElementById('loadingAdmin');
    const container = document.getElementById('recursosAdmin');
    
    try {
        console.log('📊 Iniciando carga de recursos...');
        loading.style.display = 'flex';
        container.innerHTML = '';
        
        // Consulta MÁS SIMPLE posible
        const recursosRef = collection(firebaseDb, 'recursos');
        console.log('✅ Referencia creada');
        
        // SIN orderBy para evitar problemas de índices
        const querySnapshot = await getDocs(recursosRef);
        console.log('✅ Documentos obtenidos:', querySnapshot.size);
        
        todosLosRecursos = [];
        querySnapshot.forEach((docSnapshot) => {
            const data = {
                id: docSnapshot.id,
                ...docSnapshot.data()
            };
            todosLosRecursos.push(data);
            console.log(`📋 ${data.titulo} - ${data.estado} - ${data.categoria}`);
        });
        
        // Ordenar manualmente por fecha
        todosLosRecursos.sort((a, b) => {
            const fechaA = a.fechaCreacion ? (a.fechaCreacion.toDate ? a.fechaCreacion.toDate() : new Date(a.fechaCreacion)) : new Date(0);
            const fechaB = b.fechaCreacion ? (b.fechaCreacion.toDate ? b.fechaCreacion.toDate() : new Date(b.fechaCreacion)) : new Date(0);
            return fechaB - fechaA;
        });
        
        console.log(`✅ Total recursos cargados: ${todosLosRecursos.length}`);
        console.log('Estados encontrados:', [...new Set(todosLosRecursos.map(r => r.estado))]);
        console.log('Categorías encontradas:', [...new Set(todosLosRecursos.map(r => r.categoria))]);
        
        actualizarEstadisticas();
        aplicarFiltros();
        
        if (todosLosRecursos.length === 0) {
            mostrarNotificacion('ℹ️ No hay recursos en la base de datos', 'info');
        } else {
            mostrarNotificacion(`✅ ${todosLosRecursos.length} recursos cargados`, 'success');
        }
        
    } catch (error) {
        console.error('❌ Error detallado cargando recursos:', error);
        console.error('Código de error:', error.code);
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
        
        mostrarError(`Error cargando recursos: ${error.message || error.code || 'Error desconocido'}`);
    } finally {
        loading.style.display = 'none';
    }
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const pendientes = todosLosRecursos.filter(r => r.estado === 'pendiente').length;
    const publicados = todosLosRecursos.filter(r => r.estado === 'publicado').length;
    const rechazados = todosLosRecursos.filter(r => r.estado === 'rechazado').length;
    
    document.getElementById('totalPendientes').textContent = pendientes;
    document.getElementById('totalPublicados').textContent = publicados;
    document.getElementById('totalRechazados').textContent = rechazados;
    
    console.log(`📊 Estadísticas actualizadas: ${pendientes} pendientes, ${publicados} publicados, ${rechazados} rechazados`);
}

// Aplicar filtros
function aplicarFiltros() {
    const filtroEstado = document.getElementById('filtroEstado').value;
    const filtroCategoria = document.getElementById('filtroCategoria').value;
    const busqueda = document.getElementById('busqueda').value.toLowerCase();
    
    recursosFiltrados = todosLosRecursos.filter(recurso => {
        if (filtroEstado !== 'todos' && recurso.estado !== filtroEstado) return false;
        if (filtroCategoria !== 'todas' && recurso.categoria !== filtroCategoria) return false;
        if (busqueda && !recurso.titulo.toLowerCase().includes(busqueda)) return false;
        return true;
    });
    
    console.log(`🔍 Filtros aplicados: ${recursosFiltrados.length} recursos mostrados`);
    mostrarRecursos();
}

// Mostrar recursos
function mostrarRecursos() {
    const container = document.getElementById('recursosAdmin');
    const noResultados = document.getElementById('noResultados');
    
    if (recursosFiltrados.length === 0) {
        container.innerHTML = '';
        noResultados.style.display = 'block';
        return;
    }
    
    noResultados.style.display = 'none';
    
    const html = recursosFiltrados.map(recurso => `
        <div class="recurso-admin-card">
            <div class="recurso-header">
                <div class="recurso-info">
                    <h3>${recurso.titulo}</h3>
                    <div class="recurso-meta">
                        <span class="meta-item">📂 ${getCategoriaText(recurso.categoria)}</span>
                        <span class="meta-item">⏱️ ${recurso.duracion}</span>
                        <span class="meta-item">👥 ${recurso.participantes}</span>
                    </div>
                </div>
                <div class="estado-badge estado-${recurso.estado}">
                    ${getEstadoText(recurso.estado)}
                </div>
            </div>
            
            <p class="recurso-descripcion">${recurso.descripcion}</p>
            
            <div class="recurso-contacto">
                <strong>👤 Autor:</strong> ${recurso.autor}<br>
                <strong>📧 Email:</strong> ${recurso.email || 'No proporcionado'}
            </div>
            
            <div class="recurso-actions">
                <button onclick="verDetalle('${recurso.id}')" class="btn-admin btn-ver">
                    👁️ Ver detalle
                </button>
                
                ${recurso.estado === 'pendiente' ? `
                    <button onclick="cambiarEstado('${recurso.id}', 'publicado')" class="btn-admin btn-aprobar">
                        ✅ Aprobar
                    </button>
                    <button onclick="cambiarEstado('${recurso.id}', 'rechazado')" class="btn-admin btn-rechazar">
                        ❌ Rechazar
                    </button>
                ` : ''}
                
                ${recurso.estado === 'publicado' ? `
                    <button onclick="cambiarEstado('${recurso.id}', 'pendiente')" class="btn-admin">
                        📝 Volver a pendiente
                    </button>
                ` : ''}
                
                ${recurso.estado === 'rechazado' ? `
                    <button onclick="cambiarEstado('${recurso.id}', 'pendiente')" class="btn-admin btn-aprobar">
                        🔄 Revisar de nuevo
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Ver detalle
function verDetalle(recursoId) {
    const recurso = todosLosRecursos.find(r => r.id === recursoId);
    if (!recurso) return;
    
    const modal = document.getElementById('modalDetalle');
    const contenido = document.getElementById('contenidoDetalle');
    
    contenido.innerHTML = `
        <div style="padding: 2rem;">
            <h2 style="color: var(--primary-color); margin-bottom: 1rem;">${recurso.titulo}</h2>
            <div style="background: #333; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p><strong>Categoría:</strong> ${getCategoriaText(recurso.categoria)}</p>
                <p><strong>Estado:</strong> ${getEstadoText(recurso.estado)}</p>
                <p><strong>Autor:</strong> ${recurso.autor}</p>
                <p><strong>Email:</strong> ${recurso.email || 'No proporcionado'}</p>
            </div>
            <p><strong>Descripción:</strong> ${recurso.descripcion}</p>
            <p><strong>Objetivo:</strong> ${recurso.objetivo}</p>
            <div style="margin-top: 1rem;">
                <strong>Materiales:</strong>
                <ul>${(recurso.materiales || []).map(m => `<li>${m}</li>`).join('')}</ul>
            </div>
            <div style="margin-top: 1rem;">
                <strong>Pasos:</strong>
                <ol>${(recurso.pasos || []).map(p => `<li>${p}</li>`).join('')}</ol>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Cambiar estado
function cambiarEstado(recursoId, nuevoEstado) {
    if (!confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) return;
    
    actualizarEstadoFirebase(recursoId, nuevoEstado);
}

// Actualizar en Firebase
async function actualizarEstadoFirebase(recursoId, nuevoEstado) {
    try {
        console.log(`🔄 Actualizando ${recursoId} a ${nuevoEstado}`);
        
        const recursoRef = doc(firebaseDb, 'recursos', recursoId);
        await updateDoc(recursoRef, {
            estado: nuevoEstado,
            fechaModificacion: new Date()
        });
        
        // Actualizar localmente
        const recurso = todosLosRecursos.find(r => r.id === recursoId);
        if (recurso) {
            recurso.estado = nuevoEstado;
        }
        
        mostrarNotificacion(`✅ Estado actualizado a "${nuevoEstado}"`, 'success');
        actualizarEstadisticas();
        aplicarFiltros();
        
    } catch (error) {
        console.error('❌ Error actualizando:', error);
        mostrarNotificacion('❌ Error actualizando estado', 'error');
    }
}

// Funciones de utilidad
function getCategoriaText(categoria) {
    const categorias = {
        'dinamicas': '👥 Dinámicas',
        'juegos': '🎲 Juegos',
        'reflexiones': '🤔 Reflexiones',
        'retiros': '⛰️ Retiros'
    };
    return categorias[categoria] || categoria;
}

function getEstadoText(estado) {
    const estados = {
        'pendiente': '⏳ Pendiente',
        'publicado': '✅ Publicado',
        'rechazado': '❌ Rechazado'
    };
    return estados[estado] || estado;
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
window.cerrarModalDetalle = cerrarModalDetalle;

console.log('✅ Admin de recursos cargado');