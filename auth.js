// Configuración Firebase (REEMPLAZA CON TU CONFIG)
const firebaseConfig = {
  apiKey: "AIzaSyB7US5r--cM82usyzLqd-ckamgIdyewfKE",
  authDomain: "pagina-gen.firebaseapp.com",
  projectId: "pagina-gen",
  storageBucket: "pagina-gen.firebasestorage.app",
  messagingSenderId: "876893109130",
  appId: "1:876893109130:web:862f79fc7a609e512ee673",
  measurementId: "G-TCF3R6C846"
};


// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Estado global del usuario
let currentUser = null;
let isLoginMode = true;

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
  initializeAuth();
});

// Inicializar sistema de autenticación
function initializeAuth() {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      await createUserProfile(user);
      updateUIForLoggedInUser();
    } else {
      currentUser = null;
      updateUIForLoggedOutUser();
    }
  });
}

// Login con Google
async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await auth.signInWithPopup(provider);
    await createUserProfile(result.user);
    closeAuthModal();
    
  } catch (error) {
    console.error('Error en login con Google:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      showAuthError('Popup cerrado. Inténtalo de nuevo.');
    } else if (error.code === 'auth/popup-blocked') {
      showAuthError('Popup bloqueado. Permite popups para este sitio.');
    } else if (error.code === 'auth/unauthorized-domain') {
      showAuthError('Dominio no autorizado. Contacta al administrador.');
    } else {
      showAuthError('Error al iniciar sesión con Google: ' + error.message);
    }
  }
}

// Login/Registro con email
async function handleEmailAuth(event) {
  event.preventDefault();
  
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value;
  
  try {
    let result;
    
    if (isLoginMode) {
      result = await auth.signInWithEmailAndPassword(email, password);
    } else {
      result = await auth.createUserWithEmailAndPassword(email, password);
      await result.user.updateProfile({
        displayName: name
      });
    }
    
    await createUserProfile(result.user);
    closeAuthModal();
    
  } catch (error) {
    console.error('Error en autenticación con email:', error);
    showAuthError(getErrorMessage(error.code));
  }
}

// Crear/actualizar perfil de usuario en Firestore
async function createUserProfile(user) {
  try {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      await userRef.set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Usuario',
        photoURL: user.photoURL || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        favorites: {
          canciones: [],
          experiencias: [],
          palabras: [],
          pasapalabras: []
        },
        preferences: {
          theme: 'auto',
          notifications: true
        }
      });
    } else {
      await userRef.update({
        displayName: user.displayName || userDoc.data().displayName,
        photoURL: user.photoURL || userDoc.data().photoURL,
        email: user.email
      });
    }
  } catch (error) {
    console.error('Error creando perfil:', error);
  }
}

// Actualizar UI para usuario logueado (SIMPLIFICADO)
function updateUIForLoggedInUser() {
  // Mostrar info de usuario
  const userInfo = document.getElementById('userInfo');
  const loginBtn = document.getElementById('loginBtn');
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  const welcomeMessage = document.getElementById('welcomeMessage');
  const welcomeUserName = document.getElementById('welcomeUserName');
  
  if (userInfo && loginBtn) {
    // Sidebar
    userInfo.style.display = 'flex';
    loginBtn.style.display = 'none';
    
    if (userName) userName.textContent = currentUser.displayName || 'Usuario';
    if (userAvatar) userAvatar.src = currentUser.photoURL || 'https://via.placeholder.com/32x32/5D5CDE/FFFFFF?text=U';
    
    // Mensaje de bienvenida
    if (welcomeMessage) welcomeMessage.style.display = 'block';
    if (welcomeUserName) welcomeUserName.textContent = currentUser.displayName || 'Usuario';
    
    // Agregar evento logout al avatar
    if (userInfo) userInfo.onclick = showUserMenu;
  }
}

// Actualizar UI para usuario no logueado
function updateUIForLoggedOutUser() {
  const userInfo = document.getElementById('userInfo');
  const loginBtn = document.getElementById('loginBtn');
  const welcomeMessage = document.getElementById('welcomeMessage');
  
  if (userInfo) userInfo.style.display = 'none';
  if (loginBtn) loginBtn.style.display = 'flex';
  if (welcomeMessage) welcomeMessage.style.display = 'none';
}

// Mostrar modal de autenticación
function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// Cerrar modal de autenticación
function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    const form = document.getElementById('authForm');
    if (form) form.reset();
  }
}

// Toggle entre login y registro
function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  
  const title = document.getElementById('authTitle');
  const submitBtn = document.getElementById('authSubmit');
  const switchText = document.getElementById('authSwitchText');
  const switchBtn = document.getElementById('authSwitchBtn');
  const nameGroup = document.getElementById('nameGroup');
  
  if (isLoginMode) {
    if (title) title.textContent = 'Iniciar Sesión';
    if (submitBtn) submitBtn.textContent = 'Iniciar Sesión';
    if (switchText) switchText.textContent = '¿No tienes cuenta?';
    if (switchBtn) switchBtn.textContent = 'Regístrate';
    if (nameGroup) nameGroup.style.display = 'none';
  } else {
    if (title) title.textContent = 'Crear Cuenta';
    if (submitBtn) submitBtn.textContent = 'Crear Cuenta';
    if (switchText) switchText.textContent = '¿Ya tienes cuenta?';
    if (switchBtn) switchBtn.textContent = 'Inicia Sesión';
    if (nameGroup) nameGroup.style.display = 'block';
  }
}

// Mostrar menu de usuario
function showUserMenu() {
  if (confirm('¿Cerrar sesión?')) {
    auth.signOut();
  }
}

// Mostrar error de autenticación
function showAuthError(message) {
  alert(message);
}

// Obtener mensaje de error legible
function getErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No existe una cuenta con este email';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este email';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres';
    case 'auth/invalid-email':
      return 'Email inválido';
    default:
      return 'Error de autenticación: ' + errorCode;
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.onclick = openAuthModal;
  
  const authForm = document.getElementById('authForm');
  if (authForm) authForm.onsubmit = handleEmailAuth;
  
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.onclick = function(event) {
      if (event.target === this) {
        closeAuthModal();
      }
    };
  }
});

// Funciones globales
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.toggleAuthMode = toggleAuthMode;
window.signInWithGoogle = signInWithGoogle;

console.log('✅ Sistema de autenticación simplificado cargado');