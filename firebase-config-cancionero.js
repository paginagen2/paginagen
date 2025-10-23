// Importar Firebase desde CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  increment, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// 🔥 PEGA AQUÍ TU CONFIGURACIÓN REAL (reemplaza esto)
const firebaseConfig = {
  apiKey: "AIzaSyB7US5r--cM82usyzLqd-ckamgIdyewfKE",
  authDomain: "pagina-gen.firebaseapp.com",
  projectId: "pagina-gen",
  storageBucket: "pagina-gen.firebasestorage.app",
  messagingSenderId: "876893109130",
  appId: "1:876893109130:web:862f79fc7a609e512ee673",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Servicio de base de datos
export const DatabaseService = {
    // Obtener todas las canciones
  async getCanciones() {
    try {
      console.log('🔍 Obteniendo canciones...');
      const snapshot = await getDocs(collection(db, 'canciones'));
      const canciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convertir timestamp de Firebase a Date
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
      }));
      console.log('✅ Canciones obtenidas:', canciones.length);
      return canciones;
    } catch (error) {
      console.error('❌ Error obteniendo canciones:', error);
      throw error;
    }
  },

  // Agregar nueva canción
  async agregarCancion(cancion) {
    try {
      console.log('➕ Agregando canción:', cancion.titulo);
      const docRef = await addDoc(collection(db, 'canciones'), {
        ...cancion,
        reproducciones: 0,
        fechaCreacion: new Date(),
        activa: true
      });
      console.log('✅ Canción agregada con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error agregando canción:', error);
      throw error;
    }
  },

  // Incrementar reproducciones
  async incrementarReproducciones(cancionId) {
    try {
      const cancionRef = doc(db, 'canciones', cancionId);
      await updateDoc(cancionRef, {
        reproducciones: increment(1)
      });
      console.log('👁️ Reproducciones incrementadas para:', cancionId);
    } catch (error) {
      console.error('❌ Error incrementando reproducciones:', error);
    }
  },

  // Listener en tiempo real
  onCancionesChange(callback) {
    console.log('🔄 Configurando listener en tiempo real...');
    return onSnapshot(collection(db, 'canciones'), (snapshot) => {
      const canciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
      }));
      console.log('🔄 Canciones actualizadas en tiempo real:', canciones.length);
      callback(canciones);
    }, (error) => {
      console.error('❌ Error en listener:', error);
    });
  },

// Agregar datos iniciales (solo para testing)
  async agregarDatosIniciales() {
    try {
      const cancionesIniciales = [
        {
          titulo: "Alabaré",
          artista: "Tradicional",
          categoria: "misa",
          letra: `[C]Alabaré, alabaré
[G]Alabaré a mi Señor
[Am]Todos unidos [F]alegres
[C]Alabemos al Se[G]ñor

[C]Juan vio el número
[G]De los redimidos
[Am]Y todos [F]alababan
[C]Al Señor con [G]gozo

[C]Unos oraban, [G]otros cantaban
[Am]Unos gritaban [F]otros lloraban
[C]Pero todos [G]alababan
[C]Al Señor`
        },
        {
          titulo: "Que todos sean uno",
          artista: "Gen",
          categoria: "gen",
          letra: `[E]Que todos sean uno
[B]Como tú Padre en mí
[C#m]Y yo en ti [A]también
[E]Que ellos sean [B]uno en [E]nos

[A]Esta es la oración
[E]Que Jesús elevó al Padre
[B]Por toda la humani[E]dad
[A]Y es el ideal
[E]Que nos mueve cada día
[B]A construir frater[E]nidad`
        },
        {
          titulo: "Fogón de hermanos",
          artista: "Tradicional",
          categoria: "fogon",
          letra: `[A]Este fogón está encendido
[E]Con el calor de la amistad
[D]Cada llama es un la[A]tido
[E]De nuestro corazón de [A]paz

[A]Cantemos juntos esta noche
[E]Bajo las estrellas del lugar
[D]Que nuestras voces se des[A]borden
[E]En canciones del ho[A]gar`
        }
      ];

      for (const cancion of cancionesIniciales) {
        await this.agregarCancion(cancion);
      }
      
      console.log('✅ Datos iniciales agregados correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error agregando datos iniciales:', error);
      throw error;
    }
  }
};

// Función para probar la conexión
export async function probarConexion() {
  try {
    console.log('🧪 Probando conexión a Firebase...');
    const canciones = await DatabaseService.getCanciones();
    console.log('✅ Conexión exitosa. Canciones:', canciones.length);
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return false;
  }
}

