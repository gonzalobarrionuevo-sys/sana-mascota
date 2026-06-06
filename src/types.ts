export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'cliente' | 'admin';
  telefono: string;
  created_at: string;
  contrasenia?: string;
  bloqueado?: boolean;
}

export interface Mascota {
  id: string;
  usuario_id: string;
  nombre: string;
  raza: string;
  peso: number; // en kg
  alergias: string;
  tipo: 'perro' | 'gato';
  edad_meses?: number;
  created_at: string;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio_unitario: number; // por kg o por unidad
  tipo_mascota: 'perro' | 'gato' | 'ambos';
  categoria: 'barf' | 'horneado' | 'suplemento' | 'snack';
  ingredientes: string[];
  imagen?: string;
  stock?: number; // cantidad disponible en stock
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number; // en kg o unidades
  personalizado_para_mascota_id?: string; // opcionalmente adaptado a una mascota
}

export interface Pedido {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_telefono: string;
  mascota_id?: string;
  mascota_nombre?: string;
  detalles: string; // Detalles en texto o JSON de artículos del carrito
  coordenadas_lat: number | null;
  coordenadas_lng: number | null;
  direccion_texto: string;
  metodo_envio: 'gps' | 'manual';
  costo_envio: number;
  subtotal: number;
  total: number;
  estado: 'pendiente' | 'preparando' | 'en_camino' | 'entregado' | 'rechazado';
  pago_confirmado?: boolean; // si el cliente ya pago el producto
  created_at: string;
}

export interface FeedbackItem {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  tipo: 'reclamo' | 'recomendacion' | 'comentario';
  motivo_o_categoria?: string; // ej. "Alimento", "Logística", "Atención", "Perro", "Gato"
  puntos_valoracion?: number; // rango de 1 a 5 estrellas (para comentarios)
  contenido: string;
  created_at: string;
  orden_asociada_id?: string; // opcional
  eliminado?: boolean;
}

