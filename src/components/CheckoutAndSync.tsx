import React, { useState } from 'react';
import { ItemCarrito, Mascota, Usuario, Pedido } from '../types';
import { Send, Copy, Database, Code, ShieldCheck, ArrowRight, Phone, Coffee } from 'lucide-react';

interface CheckoutAndSyncProps {
  usuario: Usuario;
  cart: ItemCarrito[];
  pets: Mascota[];
  shippingCost: number;
  shippingLat: number | null;
  shippingLng: number | null;
  shippingAddress: string;
  shippingMethod: 'gps' | 'manual';
  onOrderPlaced: (newPedido: Pedido) => void;
  onClose: () => void;
}

export default function CheckoutAndSync({
  usuario,
  cart,
  pets,
  shippingCost,
  shippingLat,
  shippingLng,
  shippingAddress,
  shippingMethod,
  onOrderPlaced,
  onClose
}: CheckoutAndSyncProps) {
  const [dbState, setDbState] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [nombreCliente, setNombreCliente] = useState(usuario.nombre);
  const [telefonoCliente, setTelefonoCliente] = useState(usuario.telefono);

  // Calculate items summary
  const subtotalProducts = cart.reduce((acc, item) => {
    return acc + item.producto.precio_unitario * item.cantidad;
  }, 0);
  const totalCost = subtotalProducts + shippingCost;

  // Compile cart details to text
  const formatCartText = () => {
    return cart.map((item) => {
      const petMatch = pets.find(p => p.id === item.personalizado_para_mascota_id);
      const isUnit = item.producto.categoria === 'snack' || item.producto.categoria === 'suplemento';
      const petDetails = petMatch ? ` (Para ${petMatch.nombre}: ${petMatch.tipo})` : '';
      return `- ${item.producto.nombre}: ${item.cantidad} ${isUnit ? 'Unid.' : 'Kg'}${petDetails} — $${Math.round(item.producto.precio_unitario * item.cantidad)} ARS`;
    }).join('\n');
  };

  // Compile full order description for Database schema inserts
  const detallesDBString = cart.map((item) => {
    const isUnit = item.producto.categoria === 'snack' || item.producto.categoria === 'suplemento';
    return `${item.producto.nombre} (${item.cantidad} ${isUnit ? 'U' : 'Kg'})`;
  }).join(', ');

  // 4. GENERACIÓ DEL TEXTO DE WHATSAPP
  const compileWhatsAppText = () => {
    const cartText = formatCartText();
    const gpsCoords = shippingLat && shippingLng 
      ? `\n📍 Coordenadas GPS: ${shippingLat.toFixed(5)}, ${shippingLng.toFixed(5)} (Fórmula Haversine)`
      : '';
    const locMethod = shippingMethod === 'gps' ? 'GPS Real-time' : 'Selección de Barrio';

    return `🐾 *NUEVOPEDIDO DE SANA MASCOTA* 🐾
-----------------------------------------
👤 *Datos de Contacto:*
- Cliente: ${nombreCliente}
- Teléfono: ${telefonoCliente}
- Entrega en: ${shippingAddress}${gpsCoords}
- Método Logístico: ${locMethod}

🛒 *Detalle de Viandas & Pedido:*
${cartText}

💰 *Desglose de Presupuesto:*
- Subtotal Productos: $${Math.round(subtotalProducts)} ARS
- Costo de Envío: $${Math.round(shippingCost)} ARS
- *TOTAL A ABONAR: $${Math.round(totalCost)} ARS*

-----------------------------------------
💬 Confirmando Viandas Naturales de Catamarca. ¡Muchas gracias!`;
  };

  const getWhatsAppUrl = () => {
    const prefixedNum = '+5493834070734'.replace('+', '');
    const encodedText = encodeURIComponent(compileWhatsAppText());
    return `https://wa.me/${prefixedNum}?text=${encodedText}`;
  };

  // Compile simulated raw insert string to show Supabase behavior
  const getSupabaseSqlInsert = () => {
    const latVal = shippingLat !== null ? shippingLat : 'NULL';
    const lngVal = shippingLng !== null ? shippingLng : 'NULL';
    const clientUuid = usuario.id;
    const petUuid = cart[0]?.personalizado_para_mascota_id 
      ? `'${cart[0].personalizado_para_mascota_id}'` 
      : 'NULL';

    return `INSERT INTO public.pedidos (
    id, usuario_id, mascota_id, detalles, 
    coordenadas_lat, coordenadas_lng, 
    direccion_texto, costo_envio, total, estado
) VALUES (
    gen_random_uuid(),
    '${clientUuid}',
    ${petUuid},
    '${detallesDBString.replace(/'/g, "''")}',
    ${latVal},
    ${lngVal},
    '${shippingAddress.replace(/'/g, "''")}',
    ${shippingCost},
    ${totalCost},
    'pendiente'
);`;
  };

  const handleConfirmAndSync = () => {
    setDbState('syncing');
    
    // Simulate API roundtrip database insertion to Supabase
    setTimeout(() => {
      setDbState('synced');
      
      const newPedido: Pedido = {
        id: Math.random().toString(36).substring(2, 11),
        usuario_id: usuario.id,
        usuario_nombre: nombreCliente,
        usuario_telefono: telefonoCliente,
        mascota_id: cart[0]?.personalizado_para_mascota_id || undefined,
        mascota_nombre: pets.find(p => p.id === cart[0]?.personalizado_para_mascota_id)?.nombre || undefined,
        detalles: detallesDBString,
        coordenadas_lat: shippingLat,
        coordenadas_lng: shippingLng,
        direccion_texto: shippingAddress,
        metodo_envio: shippingMethod,
        costo_envio: shippingCost,
        subtotal: subtotalProducts,
        total: totalCost,
        estado: 'pendiente',
        pago_confirmado: false,
        created_at: new Date().toISOString()
      };

      onOrderPlaced(newPedido);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="checkout-drawer-overlay">
      <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" id="checkout-drawer-container">
        
        {/* COLUMNA IZQUIERDA: RESUMEN Y BOTÓN DIRECTO DE WHATSAPP */}
        <div className="space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-serif font-semibold text-primary">Resumen del Pedido</h3>
                <p className="text-2xs text-muted-foreground">Revisa los datos antes de emitir a WhatsApp</p>
              </div>
              <button 
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold px-2 py-1 rounded hover:bg-muted"
              >
                Volver
              </button>
            </div>

            <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
              {/* Campos de Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-2xs font-semibold text-muted-foreground uppercase mb-0.5">Tu Nombre completo</label>
                  <input
                    type="text"
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                    className="w-full bg-background border border-border rounded p-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-muted-foreground uppercase mb-0.5">Celular de Contacto</label>
                  <input
                    type="text"
                    value={telefonoCliente}
                    onChange={(e) => setTelefonoCliente(e.target.value)}
                    className="w-full bg-background border border-border rounded p-1.5 focus:outline-none"
                  />
                </div>
              </div>

              {/* Detalle Texto */}
              <div className="text-2xs font-mono bg-background p-3 rounded border border-border leading-relaxed text-foreground max-h-48 overflow-y-auto">
                <div className="font-semibold text-primary mb-1 border-b border-border/60 pb-1">Previsualización del WhatsApp:</div>
                <pre className="whitespace-pre-wrap">{compileWhatsAppText()}</pre>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            {dbState !== 'synced' ? (
              <button
                type="button"
                onClick={handleConfirmAndSync}
                disabled={dbState === 'syncing'}
                className="w-full bg-secondary hover:bg-primary/20 text-secondary-foreground hover:text-primary font-bold py-3 px-4 rounded-md text-xs flex items-center justify-center gap-2 border border-secondary transition-all cursor-pointer"
                id="sync-supabase-button"
              >
                <Database className="w-4 h-4" /> 
                {dbState === 'syncing' ? 'Sincronizando con Supabase...' : 'Confirmar & Registrar en Supabase'}
              </button>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-center text-xs text-emerald-800 dark:text-emerald-400 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" /> ¡Registrado con éxito en Supabase! Puedes enviar el WhatsApp ahora.
              </div>
            )}

            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (dbState !== 'synced') {
                  // auto-sync under the hood if skipped to preserve orders inside state
                  const newPedido: Pedido = {
                    id: Math.random().toString(36).substring(2, 11),
                    usuario_id: usuario.id,
                    usuario_nombre: nombreCliente,
                    usuario_telefono: telefonoCliente,
                    mascota_id: cart[0]?.personalizado_para_mascota_id || undefined,
                    mascota_nombre: pets.find(p => p.id === cart[0]?.personalizado_para_mascota_id)?.nombre || undefined,
                    detalles: detallesDBString,
                    coordenadas_lat: shippingLat,
                    coordenadas_lng: shippingLng,
                    direccion_texto: shippingAddress,
                    metodo_envio: shippingMethod,
                    costo_envio: shippingCost,
                    subtotal: subtotalProducts,
                    total: totalCost,
                    estado: 'pendiente',
                    created_at: new Date().toISOString()
                  };
                  onOrderPlaced(newPedido);
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold py-3.5 px-4 rounded-md text-sm text-center shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              id="whatsapp-integration-button"
            >
              <Phone className="w-4 h-4 fill-white" /> Enviar Pedido por WhatsApp
              <ArrowRight className="w-4 h-4" />
            </a>
            <span className="block text-center text-3xs text-muted-foreground">
              Abre WhatsApp con el mensaje preestablecido para coordinar el pago por transferencia o efectivo.
            </span>
          </div>
        </div>

        {/* COLUMNA DERECHA: EXPLICACIÓN DE FLUJO / SQL INSERCIÓN */}
        <div className="border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-6 space-y-4">
          <div>
            <h4 className="font-serif font-semibold text-primary flex items-center gap-2 text-sm">
              <Code className="w-4 h-4" /> Flujo Técnico y Query SQL de Sincronización
            </h4>
            <p className="text-2xs text-muted-foreground mt-1">
              Aquí puedes ver exactamente cómo se ejecuta la transacción DDL/DML. Así interactúa nuestro frontend con las tablas de Supabase en tiempo real.
            </p>
          </div>

          <div className="space-y-4 text-xs font-mono h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="bg-zinc-950 text-zinc-400 p-3 rounded border border-zinc-800 text-2xs">
                <div className="text-emerald-500 font-bold mb-1 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" /> query_insert_pedido.sql
                </div>
                <pre className="overflow-x-auto text-zinc-300 select-all p-1 whitespace-pre-wrap">{getSupabaseSqlInsert()}</pre>
              </div>

              <div className="p-3 bg-muted/60 rounded border border-border space-y-2 font-sans text-foreground">
                <span className="font-bold text-xs text-primary block">¿Cómo funciona esta simulación?</span>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Al pulsar <strong className="text-foreground">"Confirmar & Registrar"</strong>, el aplicativo realiza una llamada simulando una transacción a Supabase que guarda el registro en la tabla <code className="bg-muted text-primary px-1 font-mono text-2xs rounded">pedidos</code>. 
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Una vez confirmada, esta orden viaja de manera dinámica a la pestaña de <strong className="text-foreground">Módulo Administrador</strong>, simulando una base de datos distribuida en tiempo real accesible para el local de Sana Mascota.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-primary/5 rounded border border-primary/10 flex items-center gap-3">
              <Coffee className="w-8 h-8 text-primary shrink-0" />
              <div className="font-sans">
                <span className="block font-bold text-2xs text-primary uppercase">Costo API de Terceros: $0</span>
                <span className="block text-3xs text-muted-foreground">Todo el flujo logístico opera con geolocalización nativa, evitando costos fijos de Google Maps Platform API.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
