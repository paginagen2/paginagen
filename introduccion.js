// ===================================
// INTRODUCCIÓN AL MOVIMIENTO - VERSIÓN FORMAL
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    initializeIntroduction();
    addCardImages();
    
    // Configurar dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (event.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });
});

function initializeIntroduction() {
    console.log('✅ Introducción al Movimiento inicializada');
    addProfessionalEffects();
}

// ===================================
// AGREGAR IMÁGENES A LAS TARJETAS
// ===================================
function addCardImages() {
    const cards = document.querySelectorAll('.intro-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent;
        
        // Crear elemento de imagen
        const imageDiv = document.createElement('div');
        imageDiv.className = 'card-image';
        imageDiv.setAttribute('data-title', title);
        
        // Insertar antes del header
        const cardHeader = card.querySelector('.card-header');
        card.insertBefore(imageDiv, cardHeader);
    });
}

// ===================================
// TOGGLE DE TARJETAS
// ===================================
function toggleCard(button) {
    const card = button.closest('.intro-card');
    const expandedContent = card.querySelector('.card-expanded');
    const isExpanded = expandedContent.classList.contains('expanded');
    
    if (!isExpanded) {
        // Expandir esta tarjeta
        expandedContent.classList.add('expanded');
        button.querySelector('.btn-text').textContent = 'Leer menos';
        button.querySelector('.btn-icon').textContent = '−';
        button.classList.add('expanded');
        
        // Scroll suave hacia la tarjeta
        setTimeout(() => {
            card.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }, 200);
    } else {
        // Contraer esta tarjeta
        expandedContent.classList.remove('expanded');
        button.querySelector('.btn-text').textContent = 'Leer más';
        button.querySelector('.btn-icon').textContent = '+';
        button.classList.remove('expanded');
    }
}

// ===================================
// EFECTOS PROFESIONALES
// ===================================
function addProfessionalEffects() {
    // Observador de intersección para animaciones suaves
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observar secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'all 0.8s ease';
        observer.observe(section);
    });
    
    // Efectos de hover profesionales
    document.querySelectorAll('.intro-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.zIndex = '5';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.zIndex = '1';
        });
    });
}

// Hacer funciones globales accesibles
window.toggleCard = toggleCard;

console.log('✅ Introducción al Movimiento (versión formal) cargada correctamente');