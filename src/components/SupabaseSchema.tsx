import React, { useState } from 'react';
import { Copy, Check, Database, Zap } from 'lucide-react';

export default function SupabaseSchema() {
  const [copied, setCopied] = useState(false);

  const sqlSchema = `-- ==========================================
-- SANA MASCOTA - SUPABASE SQL SCHEMA
-- ==========================================

-- 1. TABLA DE USUARIOS
-- Almacena la información de clientes y administradores
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
    telefono VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE MASCOTAS
-- Registra las mascotas de cada cliente para calcular porciones/dietas
CREATE TABLE IF NOT EXISTS public.mascotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('perro', 'gato')),
    raza VARCHAR(255) NOT NULL,
    peso NUMERIC(5,2) NOT NULL, -- peso en kg para cálculo nutricional
    alergias TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE PEDIDOS
-- Contiene las compras, coordenadas GPS capturadas y costo de envío calculado por Haversine
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    mascota_id UUID REFERENCES public.mascotas(id) ON DELETE SET NULL,
    detalles TEXT NOT NULL, -- JSON con formato o listado detallado de productos
    coordenadas_lat NUMERIC(9,6), -- GPS Latitud del cliente
    coordenadas_lng NUMERIC(9,6), -- GPS Longitud del cliente
    direccion_texto VARCHAR(500) NOT NULL, -- Barrio / Dirección física (respaldo)
    costo_envio NUMERIC(10,2) NOT NULL DEFAULT 0.00, -- Calculado con $500/km (Haversine)
    total NUMERIC(10,2) NOT NULL, -- Subtotal productos + costos envío
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'preparando', 'en_camino', 'entregado', 'rechazado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. SEGURIDAD DE FILA (RLS) & POLÍTICAS
-- ==========================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mascotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas para Usuarios
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins pueden ver todos los perfiles" ON public.usuarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para Mascotas
CREATE POLICY "Usuarios pueden gestionar sus mascotas" ON public.mascotas
    FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Admins pueden ver todas las mascotas" ON public.mascotas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para Pedidos
CREATE POLICY "Clientes pueden ver o insertar sus pedidos" ON public.pedidos
    FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Admins gestionan todos los pedidos" ON public.pedidos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- ==========================================
-- 5. SEMILLAS DE PRUEBA (SEED DATA)
-- ==========================================

-- Insertar un Administrador y un Cliente demo
INSERT INTO public.usuarios (id, nombre, email, rol, telefono)
VALUES
  ('800cc412-1473-4f24-9b88-1bfdcdced881', 'Admin Sana Mascota', 'contacto@sanamascota.com', 'admin', '+5493834070734'),
  ('04b0870f-dfd9-4b6b-80df-89241bda2720', 'Gonzalo Barrionuevo', 'gonzalobarrionuevo@gmail.com', 'cliente', '+5493834000000')
ON CONFLICT (email) DO NOTHING;

-- Insertar Mascota del Cliente demo
INSERT INTO public.mascotas (usuario_id, nombre, tipo, raza, peso, alergias)
VALUES
  ('04b0870f-dfd9-4b6b-80df-89241bda2720', 'Rocco', 'perro', 'Golden Retriever', 32.5, 'Ninguna');`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-md" id="supabase-schema-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-serif font-semibold text-primary flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" /> Esquema SQL de Supabase
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Copia y ejecuta este script en el editor SQL de tu panel de control de Supabase para inicializar la base de datos estructural.
          </p>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-md font-sans text-sm font-medium transition-all"
          id="copy-sql-button"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" /> ¡Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Copiar SQL
            </>
          )}
        </button>
      </div>

      <div className="relative">
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 text-white rounded px-2 py-1 text-2xs font-mono select-none">
          <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /> SUPABASE SQL
        </div>
        <pre className="max-h-96 overflow-y-auto bg-zinc-950 text-emerald-400 p-4 rounded font-mono text-xs md:text-sm leading-relaxed border border-zinc-800 shadow-inner scrollbar-thin">
          <code>{sqlSchema}</code>
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-3 bg-muted/60 rounded-md border border-border/80">
          <div className="font-sans font-semibold text-xs uppercase tracking-wider text-primary">Tabla: usuarios</div>
          <p className="text-xs text-muted-foreground mt-1">
            Almacena perfiles de clientes y administradores con roles, correos vinculados y teléfonos para la integración rápida.
          </p>
        </div>
        <div className="p-3 bg-muted/60 rounded-md border border-border/80">
          <div className="font-sans font-semibold text-xs uppercase tracking-wider text-primary">Tabla: mascotas</div>
          <p className="text-xs text-muted-foreground mt-1">
            Registra tipo, raza, peso exacto y alergias. El peso permite calcular de forma precisa el consumo diario recomendado.
          </p>
        </div>
        <div className="p-3 bg-muted/60 rounded-md border border-border/80">
          <div className="font-sans font-semibold text-xs uppercase tracking-wider text-primary">Tabla: pedidos</div>
          <p className="text-xs text-muted-foreground mt-1">
            Persiste coordenadas GPS exactas, dirección textual, total general y el costo de envío obtenido por Haversine.
          </p>
        </div>
      </div>
    </div>
  );
}
