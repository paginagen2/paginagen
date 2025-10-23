// Variables globales
let cancionesFiltradas = [];
let categoriaActual = 'todas';
let userFavorites = [];
let cancionActualModal = null;

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
  cargarCanciones();
  
  // Escuchar cambios en favoritos
  document.addEventListener('favoriteToggled', function(event) {
    const { type, id } = event.detail;
    if (type === 'cancion') {
      updateFavoriteUI(id);
      // Si estamos en vista de favoritas, recargar
      if (categoriaActual === 'favoritas') {
        filtrarCategoria('favoritas');
      }
    }
  });
});

// Cargar canciones desde Firebase
async function cargarCanciones() {
  try {
    console.log('📡 Cargando canciones desde Firebase...');
    
    const cancionesSnapshot = await firebase.firestore().collection('canciones').get();
    const canciones = [];
    
    cancionesSnapshot.forEach((doc) => {
      canciones.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ ${canciones.length} canciones cargadas`);
    
    cancionesFiltradas = canciones;
    await loadUserFavorites();
    mostrarCanciones();
    actualizarContador();
    
  } catch (error) {
    console.error('❌ Error cargando canciones:', error);
    
    // Fallback con canciones de ejemplo
    cancionesFiltradas = [
      {
        id: 'ejemplo1',
        titulo: 'Que todos sean uno',
        autor: 'Chiara Lubich',
        categoria: 'adoracion',
        acordes: 'Do Sol Am Fa\nQue todos sean uno\nDo Sol Am Fa\nComo Tú Padre en mí'
      },
      {
        id: 'ejemplo2', 
        titulo: 'Resurrexit',
        autor: 'Gen',
        categoria: 'alegria',
        acordes: 'Re La Si- Sol\nResurrexit, alleluia\nRe La Si- Sol\nEl Señor ha resucitado'
      }
    ];
    
    await loadUserFavorites();
    mostrarCanciones();
    actualizarContador();
  }
}

// Cargar favoritos del usuario
async function loadUserFavorites() {
  const favorites = await getUserFavorites();
  if (favorites && favorites.canciones) {
    userFavorites = favorites.canciones;
    console.log('❤️ Favoritos cargados:', userFavorites.length);
  } else {
    userFavorites = [];
  }
}

// Mostrar canciones en el grid
function mostrarCanciones() {
  const container = document.getElementById('cancionesContainer');
  container.innerHTML = '';

  if (cancionesFiltradas.length === 0) {
    container.innerHTML = `
      <div class="sin-resultados">
        <div class="sin-resultados-icono">🎸</div>
        <h3>No se encontraron canciones</h3>
        <p>Intenta con otros términos de búsqueda o cambia el filtro.</p>
      </div>
    `;
    return;
  }

  cancionesFiltradas.forEach(cancion => {
    const cancionElement = crearElementoCancion(cancion);
    container.appendChild(cancionElement);
  });
  
  // Actualizar estado de favoritos
  updateAllFavoritesUI();
}

// Crear elemento de canción
function crearElementoCancion(cancion) {
  const isFavorite = userFavorites.includes(cancion.id);
  
  const element = document.createElement('div');
  element.className = 'cancion-card';
  element.innerHTML = `
    <div class="cancion-header">
      <h3 class="cancion-titulo">${cancion.titulo}</h3>
      <button class="favorite-btn auth-required" onclick="toggleFavorite('cancion', '${cancion.id}')" style="display: none;" data-cancion="${cancion.id}">
        <span class="favorite-icon">${isFavorite ? '❤️' : '🤍'}</span>
      </button>
    </div>
    
    <div class="cancion-meta">
      <span class="cancion-autor">por ${cancion.autor}</span>
      <span class="cancion-categoria">${getCategoriaLabel(cancion.categoria)}</span>
    </div>
    
    <div class="cancion-preview">
      ${cancion.acordes ? cancion.acordes.split('\n').slice(0, 2).join('\n') : 'Vista previa no disponible'}
    </div>
    
    <div class="cancion-actions">
      <button class="btn-ver-acordes" onclick="abrirModal('${cancion.id}')">
        👁️ Ver acordes
      </button>
      <button class="btn-copiar" onclick="copiarAcordes('${cancion.id}')">
        📋 Copiar
      </button>
    </div>
  `;
  
  return element;
}

// Actualizar UI de favorito específico
function updateFavoriteUI(cancionId) {
  const favoriteBtn = document.querySelector(`[data-cancion="${cancionId}"]`);
  if (favoriteBtn) {
    const icon = favoriteBtn.querySelector('.favorite-icon');
    const isFavorite = userFavorites.includes(cancionId);
    
    if (icon) {
      icon.textContent = isFavorite ? '❤️' : '🤍';
      favoriteBtn.classList.toggle('favorited', isFavorite);
    }
  }
  
  // Actualizar modal si está abierto
  if (cancionActualModal && cancionActualModal.id === cancionId) {
    updateModalFavoriteUI();
  }
}

// Actualizar UI de todos los favoritos
function updateAllFavoritesUI() {
  userFavorites.forEach(cancionId => {
    updateFavoriteUI(cancionId);
  });
}

// Actualizar favorito en modal
function updateModalFavoriteUI() {
  const modalBtn = document.getElementById('modalFavoriteBtn');
  const modalIcon = document.getElementById('modalFavoriteIcon');
  
  if (modalBtn && modalIcon && cancionActualModal) {
    const isFavorite = userFavorites.includes(cancionActualModal.id);
    modalIcon.textContent = isFavorite ? '❤️' : '🤍';
    modalBtn.classList.toggle('favorited', isFavorite);
  }
}

// Toggle favorito desde modal
function toggleFavoriteFromModal() {
  if (cancionActualModal) {
    toggleFavorite('cancion', cancionActualModal.id);
  }
}

// Obtener etiqueta de categoría
function getCategoriaLabel(categoria) {
  const labels = {
    'adoracion': 'Adoración',
    'alegria': 'Alegría', 
    'liturgicas': 'Litúrgicas',
    'infantiles': 'Infantiles'
  };
  return labels[categoria] || categoria;
}

// Filtrar por categoría
async function filtrarCategoria(categoria) {
  categoriaActual = categoria;
  
  // Actualizar botones activos
  document.querySelectorAll('.categoria-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-categoria="${categoria}"]`).classList.add('active');
  
  // Obtener todas las canciones
  const todasCanciones = await obtenerTodasCanciones();
  
  if (categoria === 'todas') {
    cancionesFiltradas = todasCanciones;
  } else if (categoria === 'favoritas') {
    // Filtrar solo favoritas
    await loadUserFavorites();
    cancionesFiltradas = todasCanciones.filter(cancion => 
      userFavorites.includes(cancion.id)
    );
  } else {
    cancionesFiltradas = todasCanciones.filter(cancion => 
      cancion.categoria === categoria
    );
  }
  
  mostrarCanciones();
  actualizarContador();
}

// Obtener todas las canciones
async function obtenerTodasCanciones() {
  try {
    const cancionesSnapshot = await firebase.firestore().collection('canciones').get();
    const canciones = [];
    
    cancionesSnapshot.forEach((doc) => {
      canciones.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return canciones;
  } catch (error) {
    console.error('Error obteniendo canciones:', error);
    return [];
  }
}

// Buscar canciones
function buscarCanciones() {
  const textoBusqueda = document.getElementById('busquedaInput').value.toLowerCase();
  
  if (textoBusqueda === '') {
    filtrarCategoria(categoriaActual);
    return;
  }
  
  cancionesFiltradas = cancionesFiltradas.filter(cancion => 
    cancion.titulo.toLowerCase().includes(textoBusqueda) || 
    cancion.autor.toLowerCase().includes(textoBusqueda) ||
    (cancion.acordes && cancion.acordes.toLowerCase().includes(textoBusqueda))
  );
  
  mostrarCanciones();
  actualizarContador();
}

// Ordenar canciones
function ordenarCanciones() {
  const criterio = document.getElementById('ordenarSelect').value;
  
  cancionesFiltradas.sort((a, b) => {
    switch (criterio) {
      case 'titulo':
        return a.titulo.localeCompare(b.titulo);
      case 'autor':
        return a.autor.localeCompare(b.autor);
      case 'categoria':
        return a.categoria.localeCompare(b.categoria);
      default:
        return 0;
    }
  });
  
  mostrarCanciones();
}

// Actualizar contador de resultados
function actualizarContador() {
  const contador = document.getElementById('contadorResultados');
  const total = cancionesFiltradas.length;
  
  if (total === 0) {
    contador.textContent = 'No se encontraron canciones';
  } else if (total === 1) {
    contador.textContent = '1 canción encontrada';
  } else {
    contador.textContent = `${total} canciones encontradas`;
  }
}

// Abrir modal con acordes
function abrirModal(cancionId) {
  const cancion = cancionesFiltradas.find(c => c.id === cancionId) || 
                 obtenerCancionPorId(cancionId);
  
  if (!cancion) {
    console.error('Canción no encontrada:', cancionId);
    return;
  }
  
  cancionActualModal = cancion;
  
  // Llenar modal
  document.getElementById('modalTitulo').textContent = cancion.titulo;
  document.getElementById('modalAutor').textContent = `por ${cancion.autor}`;
  document.getElementById('modalCategoria').textContent = getCategoriaLabel(cancion.categoria);
  document.getElementById('modalAcordes').textContent = cancion.acordes || 'Acordes no disponibles';
  
  // Actualizar botón favorito del modal
  updateModalFavoriteUI();
  
  // Mostrar modal
  document.getElementById('modalAcordes').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Obtener canción por ID (fallback)
async function obtenerCancionPorId(id) {
  try {
    const doc = await firebase.firestore().collection('canciones').doc(id).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
  } catch (error) {
    console.error('Error obteniendo canción:', error);
  }
  return null;
}

// Cerrar modal
function cerrarModal() {
  document.getElementById('modalAcordes').style.display = 'none';
  document.body.style.overflow = 'auto';
  cancionActualModal = null;
}

// Copiar acordes al portapapeles
async function copiarAcordes(cancionId) {
  const cancion = cancionesFiltradas.find(c => c.id === cancionId) || 
                 await obtenerCancionPorId(cancionId);
  
  if (!cancion || !cancion.acordes) {
    alert('No hay acordes disponibles para copiar');
    return;
  }
  
  try {
    await navigator.clipboard.writeText(`${cancion.titulo} - ${cancion.autor}\n\n${cancion.acordes}`);
    
    // Feedback visual
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '✅ Copiado';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
    
  } catch (error) {
    console.error('Error copiando:', error);
    alert('Error al copiar los acordes');
  }
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
  const modal = document.getElementById('modalAcordes');
  if (event.target === modal) {
    cerrarModal();
  }
}

// Cerrar modal con tecla Escape
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    cerrarModal();
  }
});

// Escuchar cambios en la autenticación
document.addEventListener('DOMContentLoaded', function() {
  // Recargar favoritos cuando el usuario se loguea
  const originalUpdateUI = window.updateUIForLoggedInUser;
  if (typeof originalUpdateUI === 'function') {
    window.updateUIForLoggedInUser = function() {
      originalUpdateUI();
      loadUserFavorites().then(() => {
        updateAllFavoritesUI();
      });
    };
  }
});

console.log('✅ Cancionero con favoritos cargado');