import { Producto } from '../types';

export const CATALOGO_PRODUCTOS: Producto[] = [
  {
    id: 'prod-barf-pollo',
    nombre: 'Menú Dieta BARF Pollo & Zanahoria',
    descripcion: 'Alimento crudo biológicamente apropiado. Pollo magro, órganos de pollo, zanahoria, calabaza, espinaca, manzana y semillas maceradas. Sin colorantes ni conservantes.',
    precio_unitario: 4200, // ARS por Kg
    tipo_mascota: 'perro',
    categoria: 'barf',
    ingredientes: ['Carne deshuesada de pollo', 'Hígado y corazón', 'Zanahoria', 'Calabacín', 'Espinaca', 'Manzana verde', 'Semillas de chía'],
    imagen: '🍗'
  },
  {
    id: 'prod-vianda-500g',
    nombre: 'Vianda Natural 500g (Vapor/BARF)',
    descripcion: 'Porción justa y equilibrada de 500g de nuestra mejor receta adaptada (BARF o levemente horneada al vapor). Rica en nutrientes esenciales y agua biológica.',
    precio_unitario: 2400, // ARS por unidad de 500g
    tipo_mascota: 'ambos',
    categoria: 'barf',
    ingredientes: ['Carnes premium trituradas', 'Zanahoria y calabacín', 'Órganos seleccionados', 'Huevo orgánico', 'Suplementos naturales'],
    imagen: '🍱'
  },
  {
    id: 'prod-vianda-entero',
    nombre: 'Vianda Entero (Hueso Carnoso Entero)',
    descripcion: 'Piezas completas de huesos carnosos para estimulación cognitiva, masticación higiénica (remoción de sarro) y equilibrio natural de minerales.',
    precio_unitario: 4500, // ARS por Kg
    tipo_mascota: 'perro',
    categoria: 'barf',
    ingredientes: ['Hueso carnoso de ave seleccionado', 'Carne adherida premium', 'Cartílago rico en condroitina'],
    imagen: '🦴'
  },
  {
    id: 'prod-vianda-recetada',
    nombre: 'Viandas Recetadas por Veterinaria',
    descripcion: 'Menús especiales modificados terapéuticamente bajo prescripción (bajos en fósforo para nefropatías, hipoalergénicos puros, o adaptados para control de peso).',
    precio_unitario: 5500, // ARS por Kg
    tipo_mascota: 'ambos',
    categoria: 'barf',
    ingredientes: ['Fórmula adaptada libre de alérgenos recurrentes', 'Control estricto de macronutrientes', 'Soporte clínico profesional'],
    imagen: '🩺'
  },
  {
    id: 'prod-snack-colageno',
    nombre: 'Snacks de Colágeno Natural Deshidratado',
    descripcion: 'Premios crocantes ricos en colágeno extraído de articulaciones de res y cerdo. Ayuda a sostener articulaciones saludables, encías firmes y pelaje brillante.',
    precio_unitario: 2200, // ARS por bolsa
    tipo_mascota: 'ambos',
    categoria: 'snack',
    ingredientes: ['Tendones de res deshidratados', 'Cartílago natural de cerdo', '100% deshidratacion lenta'],
    imagen: '🥓'
  }
];

/**
 * Calcula la porción diaria sugerida de comida natural para una mascota en base a su peso.
 * - Perros adultos sedentarios: 2% a 2.5% de su peso corporal.
 * - Perros adultos activos: 2.5% a 3% de su peso corporal.
 * - Gatos adultos: 3% a 3.5% de su peso corporal debido a mayor metabolismo.
 */
export function calcularPorcionDiaria(peso: number, tipo: 'perro' | 'gato', esActivo: boolean = false): {
  recomenedadoGramos: number;
  mensualKg: number;
} {
  let factor = 0.025; // 2.5% promedio

  if (tipo === 'gato') {
    factor = 0.032; // 3.2% para gatos
  } else {
    factor = esActivo ? 0.03 : 0.023;
  }

  const porcionDiariaGramos = Math.round(peso * factor * 1000);
  const porcionMensualKg = Number(((porcionDiariaGramos * 30.5) / 1000).toFixed(1));

  return {
    recomenedadoGramos: porcionDiariaGramos,
    mensualKg: porcionMensualKg
  };
}
export const BARRIOS_PREESTABLECIDOS = [
  { nombre: 'San Isidro (Valle Viejo)', costo: 1000, distanciaEstimada: 2.0 },
  { nombre: 'El Bañado (Valle Viejo - Zona Centro)', costo: 500, distanciaEstimada: 1.0 },
  { nombre: 'Las Chacras / Tres Puentes (Valle Viejo)', costo: 1200, distanciaEstimada: 2.4 },
  { nombre: 'Polcos / Santa Rosa (Valle Viejo)', costo: 1500, distanciaEstimada: 3.0 },
  { nombre: 'San Fernando del Valle de Catamarca (Centro)', costo: 2500, distanciaEstimada: 5.0 },
  { nombre: 'Alto Fariñango (Catamarca Norte)', costo: 3500, distanciaEstimada: 7.0 },
  { nombre: 'Fray Mamerto Esquiú (Catamarca Norte)', costo: 4000, distanciaEstimada: 8.0 }
];
