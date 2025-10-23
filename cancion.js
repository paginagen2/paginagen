// Importar Firebase
import { DatabaseService } from './firebase-config.js';
// Variables globales
let cancionActual = null;
let tonoActual = 0;
let tamanoTexto = 2; // 0=pequeño, 1=normal, 2=grande, 3=extra-grande
let autoScrollActivo = false;

// Mapeo de acordes cromáticos para transposición
const acordesCromaticos = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎵 Cargando página de canción...');
    const urlParams = new URLSearchParams(window.location.search);
    const cancionId = urlParams.get('id');
    
    console.log('📋 ID de canción:', cancionId);
    
    if (cancionId) {
        cargarCancion(cancionId);
    } else {
        console.log('❌ No se proporcionó ID de canción');
        mostrarError();
    }
});

// Cargar canción desde Firebase
async function cargarCancion(id) {
    try {
        console.log('🔍 Buscando canción ID:', id);
        
        const canciones = await DatabaseService.getCanciones();
        console.log('📚 Canciones obtenidas:', canciones.length);
        
        cancionActual = canciones.find(c => c.id === id);
        
        if (cancionActual) {
            console.log('✅ Canción encontrada:', cancionActual.titulo);
            mostrarCancion();
            
            // Incrementar reproducciones
            await DatabaseService.incrementarReproducciones(id);
            console.log('👁️ Reproducciones incrementadas');
            
        } else {
            console.log('❌ Canción no encontrada en la lista');
            console.log('🔍 IDs disponibles:', canciones.map(c => c.id));
            mostrarError();
        }
        
    } catch (error) {
        console.error('💥 Error cargando canción:', error);
        mostrarError();
    }
}

// Mostrar información de la canción
function mostrarCancion() {
    try {
        console.log('🎨 Mostrando información de la canción...');
        
        // Actualizar título de la página
        document.title = `${cancionActual.titulo} - Cancionero Gen`;
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = `${cancionActual.titulo} - Cancionero Gen`;
        }
        
        // Información básica
        const elementos = {
            'cancionTitulo': cancionActual.titulo,
            'cancionArtista': cancionActual.artista || 'Desconocido', 
            'cancionCategoria': getCategoriaTexto(cancionActual.categoria),
            'cancionVistas': (cancionActual.reproducciones || 0) + 1
        };
        
        Object.entries(elementos).forEach(([id, value]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = value;
            } else {
                console.warn(`⚠️ Elemento no encontrado: ${id}`);
            }
        });
        
        // Mostrar letra con acordes
        mostrarLetraConAcordes();
        
        console.log('✅ Información mostrada correctamente');
        
    } catch (error) {
        console.error('💥 Error mostrando canción:', error);
        mostrarError();
    }
}

// Mostrar letra con acordes formateada
function mostrarLetraConAcordes() {
    const container = document.getElementById('letraContent');
    
    if (!container) {
        console.error('❌ Contenedor de letra no encontrado');
        return;
    }
    
    let letra = cancionActual.letra;
    
    // Aplicar transposición de tono si es necesario
    if (tonoActual !== 0) {
        letra = transponerLetra(letra, tonoActual);
    }
    
    // Formatear acordes con spans
    const letraFormateada = letra.replace(/\[([^\]]+)\]/g, '<span class="acorde" onclick="mostrarInfoAcorde(\'$1\')">$1</span>');
    
    // Detectar y formatear secciones (Verso, Coro, etc.)
    const letraConSecciones = letraFormateada.replace(
        /^(Verso|Coro|Estribillo|Bridge|Intro|Outro|Pre-coro)(\s*\d*):/gim,
        '<div class="seccion-titulo" id="seccion-$1$2">$1$2</div>'
    );
    
    container.innerHTML = letraConSecciones;
    
    // Actualizar display de tono actual
    const tonos = ['+6', '+5', '+4', '+3', '+2', '+1', 'Original', '-1', '-2', '-3', '-4', '-5', '-6'];
    const tonoElement = document.getElementById('tonoActual');
    if (tonoElement) {
        tonoElement.textContent = tonos[tonoActual + 6];
    }
    
    console.log('🎼 Letra formateada y mostrada');
}

// Transponer toda la letra
function transponerLetra(letra, semitonos) {
    return letra.replace(/\[([^\]]+)\]/g, (match, acorde) => {
        const acordeTranspuesto = transponerAcorde(acorde, semitonos);
        return `[${acordeTranspuesto}]`;
    });
}

// Transponer un acorde individual
function transponerAcorde(acorde, semitonos) {
    // Detectar la nota base del acorde (ej: C, Dm, F#, Bb)
    const acordeBase = acorde.match(/^([A-G][#b]?)/);
    if (!acordeBase) return acorde;
    
    // Normalizar bemoles a sostenidos
    const nota = acordeBase[1].replace('b', '#');
    const sufijo = acorde.replace(acordeBase[1], '');
    
    // Encontrar índice en la escala cromática
    const indiceActual = acordesCromaticos.indexOf(nota);
    if (indiceActual === -1) return acorde;
    
    // Calcular nuevo índice (con wrap-around)
    const nuevoIndice = (indiceActual + semitonos + 12) % 12;
    return acordesCromaticos[nuevoIndice] + sufijo;
}

// Obtener texto de categoría con emoji
function getCategoriaTexto(categoria) {
    const categorias = {
        'misa': '⛪ Misa',
        'gen': '❤️ Gen',
        'fogon': '🔥 Fogón'
    };
    return categorias[categoria] || categoria;
}

// Funciones de control público (llamadas desde HTML)
window.cambiarTono = function(direccion) {
    tonoActual += direccion;
    
    // Limitar rango de transposición (-6 a +6 semitonos)
    if (tonoActual > 6) tonoActual = 6;
    if (tonoActual < -6) tonoActual = -6;
    
    mostrarLetraConAcordes();
    console.log(`🎵 Tono cambiado: ${tonoActual > 0 ? '+' : ''}${tonoActual}`);
};

window.cambiarTamano = function(direccion) {
    tamanoTexto += direccion;
    
    // Limitar rango de tamaños (0 a 3)
    if (tamanoTexto > 3) tamanoTexto = 3;
    if (tamanoTexto < 0) tamanoTexto = 0;
    
    const clases = ['texto-pequeno', 'texto-normal', 'texto-grande', 'texto-extra-grande'];
    const container = document.getElementById('letraContent');
    
    if (container) {
        // Remover clases anteriores
        clases.forEach(clase => container.classList.remove(clase));
        
        // Aplicar nueva clase de tamaño
        container.classList.add(clases[tamanoTexto]);
    }
    
    console.log(`📏 Tamaño cambiado: ${clases[tamanoTexto]}`);
};

window.toggleAutoScroll = function() {
    if (autoScrollActivo) {
        detenerAutoScroll();
    } else {
        iniciarAutoScroll();
    }
};

function iniciarAutoScroll() {
    const velocidadInput = document.getElementById('scrollSpeed');
    const velocidad = velocidadInput ? velocidadInput.value : 5;
    const container = document.getElementById('letraContent');
    
    if (!container) return;
    
    autoScrollActivo = true;
    
    // Configurar duración basada en velocidad
    container.style.setProperty('--scroll-duration', `${60 / velocidad}s`);
    container.classList.add('auto-scrolling');
    
    // Actualizar botón
    const btn = document.getElementById('btnAutoScroll');
    if (btn) {
        btn.textContent = '⏸️ Pausar';
        btn.classList.add('active');
    }
    
    console.log(`📜 Auto-scroll iniciado (velocidad: ${velocidad})`);
}

function detenerAutoScroll() {
    const container = document.getElementById('letraContent');
    
    if (!container) return;
    
    autoScrollActivo = false;
    container.classList.remove('auto-scrolling');
    
    // Actualizar botón
    const btn = document.getElementById('btnAutoScroll');
    if (btn) {
        btn.textContent = '📜 Auto-scroll';
        btn.classList.remove('active');
    }
    
    console.log('⏸️ Auto-scroll detenido');
}

window.resetearConfiguracion = function() {
    console.log('🔄 Reseteando configuración...');
    
    // Resetear variables
    tonoActual = 0;
    tamanoTexto = 2;
    
    const scrollSpeedInput = document.getElementById('scrollSpeed');
    if (scrollSpeedInput) {
        scrollSpeedInput.value = 5;
    }
    
    // Detener auto-scroll
    detenerAutoScroll();
    
    // Actualizar letra
    mostrarLetraConAcordes();
    
    // Resetear tamaño de texto
    const container = document.getElementById('letraContent');
    if (container) {
        ['texto-pequeno', 'texto-normal', 'texto-grande', 'texto-extra-grande'].forEach(clase => {
            container.classList.remove(clase);
        });
        container.classList.add('texto-grande');
    }
    
    console.log('✅ Configuración reseteada');
};

window.imprimirCancion = function() {
    console.log('🖨️ Imprimiendo canción...');
    window.print();
};

// Función para mostrar información de acordes (expandible)
window.mostrarInfoAcorde = function(acorde) {
    console.log(`🎸 Info acorde: ${acorde}`);
};

// Mostrar modal de error
function mostrarError() {
    console.log('❌ Mostrando error de canción no encontrada');
    
    const container = document.getElementById('letraContent');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                <div style="font-size: 4rem; margin-bottom: 2rem;">❌</div>
                <h2 style="color: var(--text-light); margin-bottom: 1rem;">Canción no encontrada</h2>
                <p>La canción que buscas no existe o fue eliminada del cancionero.</p>
                <a href="cancionero.html" style="
                    background: var(--primary-color);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    text-decoration: none;
                    display: inline-block;
                    margin-top: 2rem;
                    font-weight: 600;
                ">← Volver al cancionero</a>
            </div>
        `;
    }
    
    // Actualizar título también
    document.title = 'Canción no encontrada - Cancionero Gen';
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = 'Canción no encontrada - Cancionero Gen';
    }
    
    // Actualizar header info
    const elementos = {
        'cancionTitulo': 'Canción no encontrada',
        'cancionArtista': '-',
        'cancionCategoria': '-',
        'cancionVistas': '0'
    };
    
    Object.entries(elementos).forEach(([id, value]) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = value;
        }
    });
}

// Event listeners adicionales
document.addEventListener('keydown', function(e) {
    // Atajos de teclado
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '+':
            case '=':
                e.preventDefault();
                cambiarTono(1);
                break;
            case '-':
                e.preventDefault();
                cambiarTono(-1);
                break;
            case '0':
                e.preventDefault();
                resetearConfiguracion();
                break;
        }
    }
    
    // Espaciadora para toggle auto-scroll
    if (e.key === ' ' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        toggleAutoScroll();
    }
});

// Funciones de control público (llamadas desde HTML)
window.cambiarTono = function(direccion) {
    tonoActual += direccion;
    
    // Limitar rango de transposición (-6 a +6 semitonos)
    if (tonoActual > 6) tonoActual = 6;
    if (tonoActual < -6) tonoActual = -6;
    
    mostrarLetraConAcordes();
    console.log(`🎵 Tono cambiado: ${tonoActual > 0 ? '+' : ''}${tonoActual}`);
};

window.cambiarTamano = function(direccion) {
    tamanoTexto += direccion;
    
    // Limitar rango de tamaños (0 a 3)
    if (tamanoTexto > 3) tamanoTexto = 3;
    if (tamanoTexto < 0) tamanoTexto = 0;
    
    const clases = ['texto-pequeno', 'texto-normal', 'texto-grande', 'texto-extra-grande'];
    const container = document.getElementById('letraContent');
    
    if (container) {
        // Remover clases anteriores
        clases.forEach(clase => container.classList.remove(clase));
        
        // Aplicar nueva clase de tamaño
        container.classList.add(clases[tamanoTexto]);
    }
    
    console.log(`📏 Tamaño cambiado: ${clases[tamanoTexto]}`);
};

window.toggleAutoScroll = function() {
    if (autoScrollActivo) {
        detenerAutoScroll();
    } else {
        iniciarAutoScroll();
    }
};

function iniciarAutoScroll() {
    const velocidadInput = document.getElementById('scrollSpeed');
    const velocidad = velocidadInput ? velocidadInput.value : 5;
    const container = document.getElementById('letraContent');
    
    if (!container) return;
    
    autoScrollActivo = true;
    
    // Configurar duración basada en velocidad
    container.style.setProperty('--scroll-duration', `${60 / velocidad}s`);
    container.classList.add('auto-scrolling');
    
    // Actualizar botón
    const btn = document.getElementById('btnAutoScroll');
    if (btn) {
        btn.textContent = '⏸️ Pausar';
        btn.classList.add('active');
    }
    
    console.log(`📜 Auto-scroll iniciado (velocidad: ${velocidad})`);
}

function detenerAutoScroll() {
    const container = document.getElementById('letraContent');
    
    if (!container) return;
    
    autoScrollActivo = false;
    container.classList.remove('auto-scrolling');
    
    // Actualizar botón
    const btn = document.getElementById('btnAutoScroll');
    if (btn) {
        btn.textContent = '📜 Auto-scroll';
        btn.classList.remove('active');
    }
    
    console.log('⏸️ Auto-scroll detenido');
}

window.resetearConfiguracion = function() {
    console.log('🔄 Reseteando configuración...');
    
    // Resetear variables
    tonoActual = 0;
    tamanoTexto = 2;
    
    const scrollSpeedInput = document.getElementById('scrollSpeed');
    if (scrollSpeedInput) {
        scrollSpeedInput.value = 5;
    }
    
    // Detener auto-scroll
    detenerAutoScroll();
    
    // Actualizar letra
    mostrarLetraConAcordes();
    
    // Resetear tamaño de texto
    const container = document.getElementById('letraContent');
    if (container) {
        ['texto-pequeno', 'texto-normal', 'texto-grande', 'texto-extra-grande'].forEach(clase => {
            container.classList.remove(clase);
        });
        container.classList.add('texto-grande');
    }
    
    console.log('✅ Configuración reseteada');
};

window.imprimirCancion = function() {
    console.log('🖨️ Imprimiendo canción...');
    window.print();
};

// Función para mostrar información de acordes (expandible)
window.mostrarInfoAcorde = function(acorde) {
    console.log(`🎸 Info acorde: ${acorde}`);
};

// Transponer toda la letra
function transponerLetra(letra, semitonos) {
    return letra.replace(/\[([^\]]+)\]/g, (match, acorde) => {
        const acordeTranspuesto = transponerAcorde(acorde, semitonos);
        return `[${acordeTranspuesto}]`;
    });
}

// Transponer un acorde individual
function transponerAcorde(acorde, semitonos) {
    // Detectar la nota base del acorde (ej: C, Dm, F#, Bb)
    const acordeBase = acorde.match(/^([A-G][#b]?)/);
    if (!acordeBase) return acorde;
    
    // Normalizar bemoles a sostenidos
    const nota = acordeBase[1].replace('b', '#');
    const sufijo = acorde.replace(acordeBase[1], '');
    
    // Encontrar índice en la escala cromática
    const indiceActual = acordesCromaticos.indexOf(nota);
    if (indiceActual === -1) return acorde;
    
    // Calcular nuevo índice (con wrap-around)
    const nuevoIndice = (indiceActual + semitonos + 12) % 12;
    return acordesCromaticos[nuevoIndice] + sufijo;
}

// Obtener texto de categoría con emoji
function getCategoriaTexto(categoria) {
    const categorias = {
        'misa': '⛪ Misa',
        'gen': '❤️ Gen',
        'fogon': '🔥 Fogón'
    };
    return categorias[categoria] || categoria;
}

// Cleanup y logging
window.addEventListener('beforeunload', () => {
    console.log('👋 Saliendo de la página de canción');
});

console.log('🎸 Cancion.js cargado correctamente');