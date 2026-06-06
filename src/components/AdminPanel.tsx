import React, { useState } from 'react';
import { Pedido, Mascota, Usuario, Producto, FeedbackItem } from '../types';
import { Truck, CircleDollarSign, Compass, Settings, AlertCircle, MapPin, RefreshCw, Layers, Users, UserX, ShieldAlert, Trash2, Lock, Unlock, Calendar, Smartphone, Check, Edit2, PlusCircle, CheckCircle2, XCircle, Star } from 'lucide-react';

interface AdminPanelProps {
  pedidos: Pedido[];
  onUpdateStatus: (pedidoId: string, nuevoEstado: Pedido['estado']) => void;
  onClearDatabase: () => void;
  onDeleteOrder?: (pedidoId: string) => void;
  petsCount: number;
  productos?: Producto[];
  onUpdateProductos?: (nuevoProductos: Producto[]) => void;
  onUpdatePaymentStatus?: (pedidoId: string, pagado: boolean) => void;
  feedbacks?: FeedbackItem[];
  onDeleteFeedback?: (feedbackId: string) => void;
  onDeleteFeedbackPermanently?: (feedbackId: string) => void;
  onDeleteAllFeedbacksByUser?: (usuarioId: string) => void;
  onDeleteAllFeedbacksByUserPermanently?: (usuarioId: string) => void;
  onRestoreFeedback?: (feedbackId: string) => void;
}

export default function AdminPanel({
  pedidos,
  onUpdateStatus,
  onClearDatabase,
  onDeleteOrder,
  petsCount,
  productos = [],
  onUpdateProductos,
  onUpdatePaymentStatus,
  feedbacks = [],
  onDeleteFeedback,
  onDeleteFeedbackPermanently,
  onDeleteAllFeedbacksByUser,
  onDeleteAllFeedbacksByUserPermanently,
  onRestoreFeedback
}: AdminPanelProps) {
  const [selectedPedidoSql, setSelectedPedidoSql] = useState<{ id: string; query: string } | null>(null);
  const [adminTab, setAdminTab] = useState<'pedidos' | 'usuarios' | 'productos' | 'clientes'>('pedidos');
  
  const [usersList, setUsersList] = useState<Usuario[]>(() => {
    const saved = localStorage.getItem('sanamascota_users_auth');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const handleToggleBlockUser = (userId: string) => {
    const updated = usersList.map(u => {
      if (u.id === userId) {
        return { ...u, bloqueado: !u.bloqueado };
      }
      return u;
    });
    setUsersList(updated);
    localStorage.setItem('sanamascota_users_auth', JSON.stringify(updated));

    const userToBlock = usersList.find(u => u.id === userId);
    const newBlockValue = userToBlock ? !userToBlock.bloqueado : false;
    const sqlUpdate = `UPDATE public.usuarios 
SET bloqueado = ${newBlockValue} 
WHERE id = '${userId}';`;
    
    setSelectedPedidoSql({ id: userId, query: sqlUpdate });
    setTimeout(() => {
      setSelectedPedidoSql(null);
    }, 4500);
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = usersList.find(u => u.id === userId);
    if (userToDelete?.email === 'gonzalobarrionuevo@gmail.com') {
      alert('No puedes eliminar al usuario administrador principal.');
      return;
    }

    if (!confirm(`¿Estás seguro/a de que quieres eliminar permanentemente al usuario "${userToDelete?.nombre || 'este usuario'}"?`)) {
      return;
    }

    const updated = usersList.filter(u => u.id !== userId);
    setUsersList(updated);
    localStorage.setItem('sanamascota_users_auth', JSON.stringify(updated));

    const sqlDelete = `DELETE FROM public.usuarios 
WHERE id = '${userId}';`;
    
    setSelectedPedidoSql({ id: userId, query: sqlDelete });
    setTimeout(() => {
      setSelectedPedidoSql(null);
    }, 4500);
  };

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Omit<Producto, 'id'>>({
    nombre: '',
    descripcion: '',
    precio_unitario: 0,
    tipo_mascota: 'ambos',
    categoria: 'barf',
    ingredientes: [],
    imagen: '🍖',
    stock: 100
  });
  const [ingredientesText, setIngredientesText] = useState<string>('');

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProductos) return;

    const ingredientesArr = ingredientesText
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const updatedFormData = {
      ...productForm,
      precio_unitario: Number(productForm.precio_unitario),
      stock: Number(productForm.stock),
      ingredientes: ingredientesArr
    };

    let updatedList: Producto[] = [];
    let sqlQuery = '';

    if (editingProductId && editingProductId !== 'new') {
      // Edit mode
      updatedList = productos.map(p => 
        p.id === editingProductId ? { ...p, ...updatedFormData } : p
      );
      sqlQuery = `UPDATE public.productos 
SET nombre = '${updatedFormData.nombre.replace(/'/g, "''")}', 
    descripcion = '${updatedFormData.descripcion.replace(/'/g, "''")}', 
    precio_unitario = ${updatedFormData.precio_unitario}, 
    stock = ${updatedFormData.stock}, 
    tipo_mascota = '${updatedFormData.tipo_mascota}', 
    categoria = '${updatedFormData.categoria}', 
    imagen = '${updatedFormData.imagen}',
    ingredientes = ARRAY['${ingredientesArr.map(x => x.replace(/'/g, "''")).join("','")}']
WHERE id = '${editingProductId}';`;
    } else {
      // Add mode
      const newId = 'prod-' + Math.random().toString(36).substring(2, 9);
      const newProduct: Producto = {
        id: newId,
        ...updatedFormData
      };
      updatedList = [...productos, newProduct];
      sqlQuery = `INSERT INTO public.productos (id, nombre, descripcion, precio_unitario, stock, tipo_mascota, categoria, imagen, ingredientes) 
VALUES ('${newId}', '${updatedFormData.nombre.replace(/'/g, "''")}', '${updatedFormData.descripcion.replace(/'/g, "''")}', ${updatedFormData.precio_unitario}, ${updatedFormData.stock}, '${updatedFormData.tipo_mascota}', '${updatedFormData.categoria}', '${updatedFormData.imagen}', ARRAY['${ingredientesArr.map(x => x.replace(/'/g, "''")).join("','")}']);`;
    }

    onUpdateProductos(updatedList);
    setEditingProductId(null);
    
    // SQL feedback
    setSelectedPedidoSql({ id: editingProductId || 'new', query: sqlQuery });
    setTimeout(() => {
      setSelectedPedidoSql(null);
    }, 4500);
  };

  const handleAdjustmentStock = (prodId: string, diff: number) => {
    if (!onUpdateProductos) return;
    const updated = productos.map(p => {
      if (p.id === prodId) {
        const currentStock = p.stock !== undefined ? p.stock : 100;
        const newStock = Math.max(0, currentStock + diff);
        return { ...p, stock: newStock };
      }
      return p;
    });
    onUpdateProductos(updated);

    const targetProd = productos.find(p => p.id === prodId);
    if (targetProd) {
      const currentStock = targetProd.stock !== undefined ? targetProd.stock : 100;
      const newStock = Math.max(0, currentStock + diff);
      const sqlQuery = `UPDATE public.productos 
SET stock = ${newStock} 
WHERE id = '${prodId}';`;
      setSelectedPedidoSql({ id: prodId, query: sqlQuery });
      setTimeout(() => {
        setSelectedPedidoSql(null);
      }, 4500);
    }
  };

  const handleDeleteProduct = (prodId: string) => {
    if (!onUpdateProductos) return;
    const item = productos.find(p => p.id === prodId);
    if (!window.confirm(`¿Estás seguro/a de que quieres eliminar el producto "${item?.nombre || ''}" de la tienda?`)) {
      return;
    }
    const updated = productos.filter(p => p.id !== prodId);
    onUpdateProductos(updated);

    const sqlQuery = `DELETE FROM public.productos WHERE id = '${prodId}';`;
    setSelectedPedidoSql({ id: prodId, query: sqlQuery });
    setTimeout(() => {
      setSelectedPedidoSql(null);
    }, 4500);
  };

  const handleTogglePayment = (pedidoId: string, currentStatus: boolean) => {
    if (!onUpdatePaymentStatus) return;
    onUpdatePaymentStatus(pedidoId, !currentStatus);

    const sqlQuery = `UPDATE public.pedidos 
SET pago_confirmado = ${!currentStatus} 
WHERE id = '${pedidoId}';`;
    setSelectedPedidoSql({ id: pedidoId, query: sqlQuery });
    setTimeout(() => {
      setSelectedPedidoSql(null);
    }, 4500);
  };

  // Calculate stats
  const totalSalesProducts = pedidos.reduce((sum, p) => sum + p.subtotal, 0);
  const totalShippingCollected = pedidos.reduce((sum, p) => sum + p.costo_envio, 0);
  const grandTotalEarnings = totalSalesProducts + totalShippingCollected;
  
  // Calculate average distance
  const gpsOrders = pedidos.filter(p => p.metodo_envio === 'gps' && p.coordenadas_lat !== null);
  const avgDistance = gpsOrders.length > 0 
    ? (gpsOrders.reduce((sum, p) => {
        // approximate distance back from cost
        return sum + (p.costo_envio / 500);
      }, 0) / gpsOrders.length).toFixed(1)
    : '0';

  const handleStatusChange = (pedidoId: string, nuevoEstado: Pedido['estado']) => {
    onUpdateStatus(pedidoId, nuevoEstado);
    
    // Create live UPDATE query feedback
    const sqlUpdate = `UPDATE public.pedidos 
SET estado = '${nuevoEstado}' 
WHERE id = '${pedidoId}';`;
    
    setSelectedPedidoSql({ id: pedidoId, query: sqlUpdate });
    setTimeout(() => {
      setSelectedPedidoSql(null);
    }, 4500);
  };

  return (
    <div className="space-y-6" id="admin-panel-component">
      
      {/* TARJETAS DE INDICADORES / KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-card text-card-foreground p-4 rounded-lg border border-border shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <CircleDollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-3xs text-muted-foreground block uppercase font-bold tracking-wide">Recaudación Total</span>
            <strong className="text-lg font-serif font-black text-foreground">${grandTotalEarnings} ARS</strong>
            <span className="text-3xs text-muted-foreground block mt-0.5">Viandas: ${totalSalesProducts} / Enevío: ${totalShippingCollected}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card text-card-foreground p-4 rounded-lg border border-border shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-full bg-secondary/30 text-secondary-foreground">
            <Truck className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <span className="text-3xs text-muted-foreground block uppercase font-bold tracking-wide">Pedidos Registrados</span>
            <strong className="text-lg font-serif font-black text-foreground">{pedidos.length} órdenes</strong>
            <span className="text-3xs text-muted-foreground block mt-0.5">Pendientes de preparación: {pedidos.filter(p => p.estado === 'pendiente').length}</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card text-card-foreground p-4 rounded-lg border border-border shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Compass className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <span className="text-3xs text-muted-foreground block uppercase font-bold tracking-wide">Distancia Media Km</span>
            <strong className="text-lg font-serif font-black text-foreground">{avgDistance} km</strong>
            <span className="text-3xs text-muted-foreground block mt-0.5">Mapeado en Catamarca vía GPS natal</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-card text-card-foreground p-4 rounded-lg border border-border shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Layers className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-3xs text-muted-foreground block uppercase font-bold tracking-wide">Mascotas en Sistema</span>
            <strong className="text-lg font-serif font-black text-foreground">{petsCount} perfiles</strong>
            <span className="text-3xs text-muted-foreground block mt-0.5">Consumo nutricional personalizado</span>
          </div>
        </div>
      </div>

      {/* SQL FEEDBACK BOX (WHEN UPDATE TRIGGERS) */}
      {selectedPedidoSql && (
        <div className="p-3.5 bg-zinc-950 text-emerald-400 border border-emerald-950/40 rounded-lg text-2xs font-mono animate-fade-in shadow-inner flex flex-col gap-1">
          <span className="font-bold text-primary flex items-center gap-1.5 font-sans">
            <Settings className="w-3.5 h-3.5 animate-spin" /> Simulación de Base de Datos - Consulta SQL de Actualización Ejecutada:
          </span>
          <pre className="whitespace-pre-wrap select-all text-amber-400">{selectedPedidoSql.query}</pre>
        </div>
      )}

      {/* PESTAÑAS DE ADMIN */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setAdminTab('pedidos')}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold leading-none border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'pedidos'
              ? 'border-primary text-primary bg-primary/5 rounded-t-md font-extrabold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          <Truck className="w-4 h-4" /> Pedidos y Logística
        </button>
        <button
          onClick={() => setAdminTab('usuarios')}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold leading-none border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'usuarios'
              ? 'border-primary text-primary bg-primary/5 rounded-t-md font-extrabold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          <Users className="w-4 h-4" /> Gestión de Clientes
        </button>
        <button
          onClick={() => setAdminTab('clientes')}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold leading-none border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'clientes'
              ? 'border-primary text-primary bg-primary/5 rounded-t-md font-extrabold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Clientes con Pedidos
        </button>
        <button
          onClick={() => setAdminTab('productos')}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold leading-none border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'productos'
              ? 'border-primary text-primary bg-primary/5 rounded-t-md font-extrabold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          <Layers className="w-4 h-4" /> Control de Stock & Catálogo
        </button>
        <button
          onClick={() => setAdminTab('feedbacks' as any)}
          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold leading-none border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            adminTab === ('feedbacks' as any)
              ? 'border-primary text-primary bg-primary/5 rounded-t-md font-extrabold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          <Smartphone className="w-4 h-4 text-indigo-500" /> Reclamos & Reseñas ({feedbacks.length})
        </button>
      </div>

      {adminTab === 'pedidos' && (
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-md animate-fade-in" id="admin-orders-board">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-border/60">
            <div>
              <h3 className="text-lg font-serif font-semibold text-primary">Consola de Pedidos de Sana Mascota</h3>
              <p className="text-2xs text-muted-foreground">Monitoreo distribuido de clientes y entregas logísticas de El Bañado, Catamarca.</p>
            </div>
            <button
              onClick={onClearDatabase}
              className="text-xs text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-md px-3 py-1.5 transition-colors cursor-pointer flex items-center gap-1 font-bold"
              id="clear-orders-action"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" /> Eliminar Todos los Pedidos (Gral)
            </button>
          </div>

          {pedidos.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Truck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">Aún no se registran pedidos en la base de datos.</p>
              <p className="text-xs text-muted-foreground mt-1">Crea un pedido desde el Módulo de Clientes para verlo sincronizarse aquí.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  className="p-4 bg-muted/20 hover:bg-muted/30 border border-border rounded-lg grid grid-cols-1 md:grid-cols-12 gap-4 transition-all"
                  id={`admin-order-row-${pedido.id}`}
                >
                  
                  {/* ID & CONTACTO */}
                  <div className="md:col-span-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">#ORD-{pedido.id}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        pedido.estado === 'pendiente' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                        pedido.estado === 'preparando' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' :
                        pedido.estado === 'en_camino' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400' :
                        pedido.estado === 'rechazado' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400' :
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                      }`}>
                        {pedido.estado}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-foreground">{pedido.usuario_nombre}</div>
                    <div className="text-3xs text-muted-foreground font-mono">{pedido.usuario_id}</div>
                    <div className="text-xs text-primary font-medium">{pedido.usuario_telefono}</div>
                  </div>

                  {/* DETALLES DE COMPRA */}
                  <div className="md:col-span-4 space-y-1 text-xs">
                    <span className="text-3xs text-muted-foreground block uppercase font-bold">Detalle del Carrito:</span>
                    <p className="text-foreground font-medium leading-relaxed">{pedido.detalles}</p>
                    
                    {pedido.mascota_nombre && (
                      <span className="text-3xs text-primary font-semibold block">
                        🐾 Nutriendo a: {pedido.mascota_nombre}
                      </span>
                    )}
                    
                    <span className="text-3xs text-muted-foreground block pt-1">
                      Registrado el: {new Date(pedido.created_at).toLocaleString('es-AR')}
                    </span>
                  </div>

                  {/* DIRECCIÓN & COORDENADAS GPS */}
                  <div className="md:col-span-3 space-y-1.5 text-xs">
                    <div>
                      <span className="text-3xs text-muted-foreground block uppercase font-bold">Entrega logística en:</span>
                      <p className="text-foreground font-semibold leading-relaxed mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" /> {pedido.direccion_texto}
                      </p>
                    </div>

                    {pedido.coordenadas_lat && pedido.coordenadas_lng ? (
                      <a
                        href={`https://www.google.com/maps?q=${pedido.coordenadas_lat},${pedido.coordenadas_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-teal-600 dark:text-teal-400 hover:underline bg-teal-500/10 px-1.5 py-0.5 rounded"
                        title="Ver mapa satelital del cliente"
                      >
                        🗺️ GPS: {pedido.coordenadas_lat.toFixed(5)}, {pedido.coordenadas_lng.toFixed(5)}
                      </a>
                    ) : (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Distancia Estimada (Valle Viejo)
                      </span>
                    )}
                  </div>

                  {/* ACCIONES DE ESTADO & COSTOS */}
                  <div className="md:col-span-2 flex flex-col justify-between items-end gap-3 text-xs">
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-3xs text-muted-foreground block">Envío: ${pedido.costo_envio} ARS</span>
                      <strong className="text-foreground text-sm font-mono block">${pedido.total} ARS</strong>
                      <button
                        onClick={() => handleTogglePayment(pedido.id, !!pedido.pago_confirmado)}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-all flex items-center gap-0.5 mt-0.5 ${
                          pedido.pago_confirmado
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                        }`}
                        title={pedido.pago_confirmado ? 'Marcar como IMPAGO' : 'Marcar como PAGADO'}
                      >
                        {pedido.pago_confirmado ? 'Pagado ✅' : 'Impago ⏳ (Pagar)'}
                      </button>
                    </div>

                    <div className="w-full space-y-2">
                      <div>
                        <label className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">Estado de Pedido:</label>
                        <select
                          value={pedido.estado}
                          onChange={(e) => handleStatusChange(pedido.id, e.target.value as Pedido['estado'])}
                          className="w-full text-xs font-sans bg-background border border-border p-1.5 rounded text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="pendiente">Pendiente 📌</option>
                          <option value="preparando">Preparando 🥣</option>
                          <option value="en_camino">En Camino 🚚</option>
                          <option value="entregado">Entregado ✅</option>
                          <option value="rechazado">Rechazado ❌</option>
                        </select>
                      </div>

                      <button
                        onClick={() => onDeleteOrder && onDeleteOrder(pedido.id)}
                        className="w-full text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 py-1 rounded transition-colors cursor-pointer flex items-center justify-center gap-1 font-sans"
                        title="Eliminar este pedido de manera de la base de datos"
                      >
                        <Trash2 className="w-3 h-3" /> Eliminar Pedido
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {adminTab === 'usuarios' && (
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-md animate-fade-in" id="admin-users-board">
          <div className="mb-4">
            <h3 className="text-lg font-serif font-semibold text-primary flex items-center gap-1.5">
              <Users className="w-5 h-5 text-primary" /> Base de Datos de Clientes Registrados
            </h3>
            <p className="text-2xs text-muted-foreground font-sans">Administra, bloquea temporalmente o elimina accesos de usuarios al sistema.</p>
          </div>

          {usersList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs font-semibold">No hay usuarios registrados aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border text-2xs uppercase tracking-wide text-muted-foreground font-bold">
                    <th className="py-2.5 px-3">Email de Acceso</th>
                    <th className="py-2.5 px-3">Teléfono</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-muted/15 transition-colors">
                      <td className="py-3 px-3 font-semibold text-foreground">{usr.email}</td>
                      <td className="py-3 px-3 text-primary font-mono">{usr.telefono || 'Sin especificar'}</td>
                      <td className="py-3 px-3">
                        {usr.bloqueado ? (
                          <span className="text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">Bloqueado 🚫</span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Activo ✅</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleToggleBlockUser(usr.id)}
                          className={`text-2xs px-2.5 py-1 rounded font-bold cursor-pointer transition-colors ${
                            usr.bloqueado 
                              ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-600 hover:text-white' 
                              : 'bg-amber-500/15 text-amber-600 hover:bg-amber-600 hover:text-white'
                          }`}
                        >
                          {usr.bloqueado ? 'Habilitar Acceso' : 'Bloquear Cliente'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(usr.id)}
                          className="text-2xs bg-rose-500/15 text-rose-600 hover:bg-rose-600 hover:text-white px-2.5 py-1 rounded font-bold cursor-pointer transition-colors"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {adminTab === 'clientes' && (
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-md animate-fade-in" id="admin-clients-orders-board">
          <div className="mb-4">
            <h3 className="text-lg font-serif font-semibold text-primary flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-primary" /> Relación de Clientes y su Historial de Pedidos
            </h3>
            <p className="text-2xs text-muted-foreground font-sans">Consulta consolidada de compras realizadas por cada usuario registrado y el estado de sus pagos.</p>
          </div>

          {pedidos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs font-semibold">Aún no se registran transacciones para auditar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const uniqueClientNames = Array.from(new Set(pedidos.map(p => p.usuario_nombre || 'Cliente Anónimo')));
                return uniqueClientNames.map((clientName) => {
                  const clientOrders = pedidos.filter(p => (p.usuario_nombre || 'Cliente Anónimo') === clientName);
                  const totalSpent = clientOrders.reduce((acc, cr) => acc + cr.total, 0);
                  const unpaidCount = clientOrders.filter(cr => !cr.pago_confirmado).length;

                  return (
                    <div key={clientName} className="p-4 rounded-lg border border-border bg-muted/10 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/40 pb-2 gap-2">
                        <div>
                          <h4 className="text-sm font-black text-foreground">{clientName}</h4>
                          <p className="text-3xs text-muted-foreground font-mono">
                            Contacto: {clientOrders[0]?.usuario_telefono || 'Sin teléfono/Fijo'} · ID: {clientOrders[0]?.usuario_id || 'guest'}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-3xs text-muted-foreground uppercase block font-bold">Monto Consumido Total:</span>
                          <strong className="text-foreground text-sm font-mono">${totalSpent} ARS</strong>
                          <div className="mt-1">
                            {unpaidCount > 0 ? (
                              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-350 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit sm:ml-auto">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> {unpaidCount} Impago(s) ⏳
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit sm:ml-auto">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Pagado al Día ✅
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Órdenes de Compra del Cliente:</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {clientOrders.map(o => (
                            <div key={o.id} className="p-2.5 bg-background border border-border rounded text-2xs flex justify-between items-center gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-foreground truncate">ORD #{o.id}</div>
                                <div className="text-3xs text-muted-foreground truncate">{o.detalles}</div>
                                <span className="text-3xs text-muted-foreground block font-mono">{new Date(o.created_at).toLocaleString('es-AR')}</span>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                                <span className="font-mono font-bold text-foreground text-xs">${o.total} ARS</span>
                                <button
                                  onClick={() => handleTogglePayment(o.id, !!o.pago_confirmado)}
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer hover:opacity-90 transition-all ${
                                    o.pago_confirmado 
                                      ? 'bg-emerald-500/10 text-emerald-600' 
                                      : 'bg-amber-500/10 text-amber-600 animate-pulse'
                                  }`}
                                >
                                  {o.pago_confirmado ? 'Pagado ✅' : 'Impago ⏳ (Cambiar)'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}

      {adminTab === 'productos' && (
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-md animate-fade-in space-y-6" id="admin-inventory-board">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-4">
            <div>
              <h3 className="text-lg font-serif font-semibold text-primary flex items-center gap-1.5">
                <Layers className="w-5 h-5 text-primary" /> Control de Stock & Catálogo Saludable
              </h3>
              <p className="text-2xs text-muted-foreground font-sans">Monitoreo y reabastecimiento en tiempo real. Añade nuevos platos o modifica los valores base.</p>
            </div>
            {!editingProductId && (
              <button
                onClick={() => {
                  setEditingProductId('new');
                  setProductForm({
                    nombre: '',
                    descripcion: '',
                    precio_unitario: 1200,
                    tipo_mascota: 'ambos',
                    categoria: 'barf',
                    ingredientes: [],
                    imagen: '🍖',
                    stock: 50
                  });
                  setIngredientesText('');
                }}
                className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Agregar Nuevo Producto
              </button>
            )}
          </div>

          {editingProductId && (
            <form onSubmit={handleSaveProduct} className="p-4 rounded-lg bg-muted/15 border border-dashed border-border space-y-4 animate-fade-in text-xs">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1 font-sans">
                <Edit2 className="w-3.5 h-3.5" /> 
                {editingProductId === 'new' ? 'Insertar Nuevo Registro en Catálogo' : 'Modificar Valores de Producto / Vianda'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-3xs uppercase text-muted-foreground font-bold mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    value={productForm.nombre}
                    onChange={(e) => setProductForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full bg-background border border-border p-2 rounded text-foreground focus:outline-none focus:border-primary text-xs"
                    placeholder="E.g., Vianda BARF de Pavo"
                  />
                </div>
                <div>
                  <label className="block text-3xs uppercase text-muted-foreground font-bold mb-1">Precio Unitario ($)</label>
                  <input
                    type="number"
                    required
                    value={productForm.precio_unitario}
                    onChange={(e) => setProductForm(prev => ({ ...prev, precio_unitario: Number(e.target.value) }))}
                    className="w-full bg-background border border-border p-2 rounded font-mono text-foreground focus:outline-none focus:border-primary text-xs"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="block text-3xs uppercase text-muted-foreground font-bold mb-1">Aprovisionamiento (Stock)</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
                    className="w-full bg-background border border-border p-2 rounded font-mono text-foreground focus:outline-none focus:border-primary text-xs"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-3xs uppercase text-muted-foreground font-bold mb-1">Icono / Emoji Ilustrador</label>
                  <input
                    type="text"
                    required
                    value={productForm.imagen}
                    onChange={(e) => setProductForm(prev => ({ ...prev, imagen: e.target.value }))}
                    className="w-full bg-background border border-border p-2 rounded text-foreground focus:outline-none focus:border-primary text-xs"
                    placeholder="🍗"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-3xs uppercase text-muted-foreground font-bold mb-1">Categoría</label>
                  <select
                    value={productForm.categoria}
                    onChange={(e) => setProductForm(prev => ({ ...prev, categoria: e.target.value as any }))}
                    className="w-full bg-background border border-border p-2 rounded text-foreground focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="barf">Menú BARF (Alimento Crudo) 🥩</option>
                    <option value="cocido">Plato Cocinado a Vapor 🍲</option>
                    <option value="snack">Snack Nutritivo Deshidratado 🦴</option>
                    <option value="suplemento">Suplemento Vitamínico Natural 🧪</option>
                  </select>
                </div>
                <div>
                  <label className="block text-3xs uppercase text-muted-foreground font-bold mb-1">Apto para Mascota</label>
                  <select
                    value={productForm.tipo_mascota}
                    onChange={(e) => setProductForm(prev => ({ ...prev, tipo_mascota: e.target.value as any }))}
                    className="w-full bg-background border border-border p-2 rounded text-foreground focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="ambos">Ambos (Perro y Gato) 🐕🐈</option>
                    <option value="perro">Únicamente Perros 🐕</option>
                    <option value="gato">Únicamente Gatos 🐈</option>
                  </select>
                </div>
                <div>
                  <label className="block text-3xs uppercase text-muted-foreground font-bold mb-1">Ingredientes básicos (separar por coma)</label>
                  <input
                    type="text"
                    value={ingredientesText}
                    onChange={(e) => setIngredientesText(e.target.value)}
                    className="w-full bg-background border border-border p-2 rounded text-foreground focus:outline-none focus:border-primary text-xs"
                    placeholder="Carne de res, calabaza, espinaca..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-3xs uppercase text-muted-foreground font-bold mb-1">Detalle / Descripción</label>
                <textarea
                  required
                  rows={2}
                  value={productForm.descripcion}
                  onChange={(e) => setProductForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full bg-background border border-border p-2 rounded text-foreground focus:outline-none focus:border-primary text-xs w-full"
                  placeholder="Detalles nutricionales..."
                />
              </div>

              <div className="flex justify-end gap-2 text-xs font-sans">
                <button
                  type="button"
                  onClick={() => setEditingProductId(null)}
                  className="px-3.5 py-1.5 border border-border rounded text-muted-foreground hover:bg-muted font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-primary text-primary-foreground font-bold rounded hover:opacity-95 cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {productos.map((prod) => {
              const currentStock = prod.stock !== undefined ? prod.stock : 100;
              return (
                <div key={prod.id} className="p-4 border border-border rounded-lg bg-muted/10 flex hover:bg-muted/15 transition-all gap-3.5" id={`admin-product-row-${prod.id}`}>
                  <span className="text-4xl bg-background rounded p-2.5 shadow-2xs border border-border/80 self-center">
                    {prod.imagen}
                  </span>

                  <div className="space-y-1 flex-1 min-w-0 text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-bold text-foreground truncate text-sm">{prod.nombre}</h4>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingProductId(prod.id);
                              setProductForm({
                                nombre: prod.nombre,
                                descripcion: prod.descripcion,
                                precio_unitario: prod.precio_unitario,
                                tipo_mascota: prod.tipo_mascota,
                                categoria: prod.categoria,
                                imagen: prod.imagen,
                                stock: currentStock,
                                ingredientes: prod.ingredientes || []
                              });
                              setIngredientesText((prod.ingredientes || []).join(', '));
                            }}
                            className="p-1 border border-border text-foreground hover:bg-muted rounded cursor-pointer"
                            title="Modificar producto"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                            title="Eliminar de catálogo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-3xs text-muted-foreground uppercase font-bold">
                        Cat: {prod.categoria} · Aptitud: {prod.tipo_mascota === 'ambos' ? '🐕 + 🐈' : prod.tipo_mascota === 'perro' ? '🐕 Perros' : '🐈 Gatos'}
                      </p>
                      <p className="text-3xs text-muted-foreground line-clamp-1 italic mt-0.5">{prod.descripcion}</p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2.5 border-t border-border/50 gap-2">
                      <div>
                        <span className="text-3xs text-muted-foreground block font-medium">Precio lista ($):</span>
                        <strong className="text-foreground text-xs font-mono">${prod.precio_unitario} {prod.categoria === 'snack' || prod.categoria === 'suplemento' ? 'U.' : 'Kg'}</strong>
                      </div>
                      
                      {/* STOCK INVENTORY CONTROLLER */}
                      <div className="bg-background border border-border rounded px-2 py-1 flex items-center gap-1.5 shadow-3xs shrink-0 select-none">
                        <button
                          type="button"
                          onClick={() => handleAdjustmentStock(prod.id, -5)}
                          className="bg-muted hover:bg-muted/80 text-foreground w-6 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all"
                          title="Faltante 5"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustmentStock(prod.id, -1)}
                          className="bg-muted hover:bg-muted/80 text-foreground w-5 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all"
                          title="Faltante 1"
                        >
                          -1
                        </button>
                        
                        <span className={`font-mono font-black text-xs min-w-[28px] text-center ${
                          currentStock <= 0 
                            ? 'text-rose-500 font-bold border border-rose-500/10 px-1 py-0.5 rounded bg-rose-500/5' 
                            : currentStock < 10 
                              ? 'text-amber-500 border border-amber-500/10 px-1 py-0.5 rounded bg-amber-500/5 animate-pulse' 
                              : 'text-primary'
                        }`}>
                          {currentStock}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAdjustmentStock(prod.id, 1)}
                          className="bg-muted hover:bg-muted/80 text-foreground w-5 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all"
                          title="Suma 1"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustmentStock(prod.id, 5)}
                          className="bg-muted hover:bg-muted/80 text-foreground w-6 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all"
                          title="Suma 5"
                        >
                          +5
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {adminTab === ('feedbacks' as any) && (
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-md animate-fade-in space-y-6" id="admin-feedbacks-board">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-4">
            <div>
              <h3 className="text-lg font-serif font-semibold text-primary flex items-center gap-1.5">
                <Smartphone className="w-5 h-5 text-primary animate-pulse" /> Consola de Opiniones, Reclamos y Recomendaciones de Clientes
              </h3>
              <p className="text-2xs text-muted-foreground font-sans">
                Monitorea en tiempo real los testimonios, quejas de logística o sugerencias de recetas BARF enviadas por los usuarios.
              </p>
            </div>
            <div className="text-xs bg-muted/30 p-2 rounded border border-border">
              <span className="font-bold text-foreground">Distribución: </span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">🚨 {feedbacks.filter(f => f.tipo === 'reclamo').length}</span> ·{' '}
              <span className="text-amber-600 dark:text-amber-400 font-bold">💡 {feedbacks.filter(f => f.tipo === 'recomendacion').length}</span> ·{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">💬 {feedbacks.filter(f => f.tipo === 'comentario').length}</span>
            </div>
          </div>

          {feedbacks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Smartphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">Ningún cliente ha cargado opiniones o reclamos.</p>
              <p className="text-xs text-muted-foreground mt-1">Sincronización activa con localStorage.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((item) => {
                const isReclamo = item.tipo === 'reclamo';
                const isRecom = item.tipo === 'recomendacion';
                const isComent = item.tipo === 'comentario';
                const isEliminado = item.eliminado === true;

                return (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isEliminado
                        ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 opacity-75'
                        : isReclamo 
                          ? 'border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10' 
                          : isRecom 
                            ? 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10' 
                            : 'border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10'
                    }`}
                  >
                    {/* CLIENT & HEADER INFO */}
                    <div className="space-y-1.5 md:w-1/3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                          isEliminado ? 'bg-emerald-600 text-white' :
                          isReclamo ? 'bg-rose-500 text-white' :
                          isRecom ? 'bg-amber-500 text-black' :
                          'bg-indigo-500 text-white'
                        }`}>
                          {item.tipo}
                        </span>
                        <span className="font-mono text-3xs font-bold text-muted-foreground">#{item.id}</span>
                        {isEliminado && (
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded uppercase tracking-wider font-extrabold flex items-center gap-0.5 transition-all">
                            ✓ Eliminado / Oculto
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-1">
                        {item.usuario_nombre}
                        {isEliminado && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </h4>
                      <div className="text-[10px] text-muted-foreground font-mono leading-none">{item.usuario_email}</div>
                      <div className="text-3xs text-muted-foreground">Enviado: {new Date(item.created_at).toLocaleString('es-AR')}</div>
                    </div>

                    {/* CONTENT DETAILS */}
                    <div className="space-y-1 flex-1 text-xs">
                      {item.motivo_o_categoria && (
                        <div className="font-bold text-primary text-2xs uppercase">
                          📂 Clasificación: {item.motivo_o_categoria}
                        </div>
                      )}
                      
                      {isReclamo && item.orden_asociada_id && (
                        <div className="inline-flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-700 dark:text-rose-300 font-mono px-1.5 py-0.5 rounded">
                          🔗 Pedido Relacionado: <strong>#{item.orden_asociada_id}</strong>
                        </div>
                      )}

                      {isComent && item.puntos_valoracion && (
                        <div className="flex text-amber-500 text-xs gap-0.5 py-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < (item.puntos_valoracion || 5) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-3xs font-mono font-bold">({item.puntos_valoracion}/5 estrellas)</span>
                        </div>
                      )}

                      <p className={`text-foreground leading-relaxed italic p-2.5 rounded border mt-1 font-sans ${
                        isEliminado 
                          ? 'bg-emerald-500/5 border-emerald-500/20 line-through text-muted-foreground/75' 
                          : 'bg-background/50 border-border/40'
                      }`}>
                        &ldquo;{item.contenido}&rdquo;
                      </p>
                    </div>

                    {/* ACTIONS */}
                    <div className="shrink-0 flex flex-col gap-2 min-w-[200px]">
                      {isEliminado ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] py-1.5 px-3 rounded-lg border border-emerald-500/30">
                            <Check className="w-3.5 h-3.5 text-emerald-500 animate-bounce" /> 
                            <span>Oculto del Muro de Clientes</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => {
                                if (onRestoreFeedback) {
                                  onRestoreFeedback(item.id);
                                  const sqlQuery = `UPDATE public.feedbacks SET eliminado = false \nWHERE id = '${item.id}';`;
                                  setSelectedPedidoSql({ id: item.id, query: sqlQuery });
                                  setTimeout(() => setSelectedPedidoSql(null), 4500);
                                }
                              }}
                              className="text-[10px] font-bold bg-muted hover:bg-muted/80 text-foreground py-1 px-2 rounded border border-border transition-colors cursor-pointer text-center"
                              title="Volver a mostrar este comentario a los clientes"
                            >
                              Restaurar ↩
                            </button>
                            <button
                              onClick={() => {
                                if (onDeleteFeedbackPermanently) {
                                  if (confirm('¿Estás seguro/a de que quieres ELIMINAR DEFINITIVAMENTE este comentario de la base de datos? Se borrará para siempre de todo el sistema.')) {
                                    onDeleteFeedbackPermanently(item.id);
                                    const sqlQuery = `DELETE FROM public.feedbacks \nWHERE id = '${item.id}';`;
                                    setSelectedPedidoSql({ id: item.id, query: sqlQuery });
                                    setTimeout(() => setSelectedPedidoSql(null), 4500);
                                  }
                                }
                              }}
                              className="text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white py-1 px-2 rounded transition-colors cursor-pointer text-center"
                              title="Borrar de forma física y definitiva de la base de datos"
                            >
                              Borrar DB ❌
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="border border-border/40 p-1 bg-muted/20 rounded text-[9px] text-muted-foreground text-center">
                            Acciones de Moderación:
                          </div>

                          {/* OPCIONES DE COMENTARIO ÚNICO */}
                          <div className="grid grid-cols-2 gap-1 text-[10px]">
                            <button
                              onClick={() => {
                                if (onDeleteFeedback) {
                                  if (confirm('¿Seguro quieres ocultar este comentario del muro de clientes? (Seguirá visible solo en esta consola para ti)')) {
                                    onDeleteFeedback(item.id);
                                    const sqlQuery = `UPDATE public.feedbacks SET eliminado = true \nWHERE id = '${item.id}';`;
                                    setSelectedPedidoSql({ id: item.id, query: sqlQuery });
                                    setTimeout(() => setSelectedPedidoSql(null), 4500);
                                  }
                                }
                              }}
                              className="p-1 px-2 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-black rounded font-bold cursor-pointer transition-colors text-center"
                              title="Ocultar de clientes (conservar en consola)"
                            >
                              Ocultar
                            </button>

                            <button
                              onClick={() => {
                                if (onDeleteFeedbackPermanently) {
                                  if (confirm('¿Seguro quieres borrar DEFINITIVAMENTE este comentario del sistema? No se podrá ver ni en esta consola ni en ningún lado.')) {
                                    onDeleteFeedbackPermanently(item.id);
                                    const sqlQuery = `DELETE FROM public.feedbacks \nWHERE id = '${item.id}';`;
                                    setSelectedPedidoSql({ id: item.id, query: sqlQuery });
                                    setTimeout(() => setSelectedPedidoSql(null), 4500);
                                  }
                                }
                              }}
                              className="p-1 px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer transition-colors text-center"
                              title="Eliminar permanentemente de todo el sistema"
                            >
                              Borrar DB
                            </button>
                          </div>

                          {/* OPCIONES DE MULTI-COMENTARIOS DEL USUARIO */}
                          <div className="border-t border-border/40 pt-1.5 space-y-1">
                            <button
                              onClick={() => {
                                if (onDeleteAllFeedbacksByUser) {
                                  if (confirm(`¿Ocultar TODOS los comentarios de ${item.usuario_nombre} del muro de clientes?`)) {
                                    onDeleteAllFeedbacksByUser(item.usuario_id);
                                    const sqlQuery = `UPDATE public.feedbacks SET eliminado = true \nWHERE usuario_id = '${item.usuario_id}';`;
                                    setSelectedPedidoSql({ id: item.usuario_id, query: sqlQuery });
                                    setTimeout(() => setSelectedPedidoSql(null), 4500);
                                  }
                                }
                              }}
                              className="w-full py-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white rounded font-bold text-[9px] cursor-pointer transition-colors text-center"
                              title="Ocultar todos los aportes de este usuario en el muro de clientes"
                            >
                              Ocultar todos de User
                            </button>

                            <button
                              onClick={() => {
                                if (onDeleteAllFeedbacksByUserPermanently) {
                                  if (confirm(`¿ELIMINAR DEFINITIVAMENTE TODOS los comentarios de ${item.usuario_nombre} del sistema?`)) {
                                    onDeleteAllFeedbacksByUserPermanently(item.usuario_id);
                                    const sqlQuery = `DELETE FROM public.feedbacks \nWHERE usuario_id = '${item.usuario_id}';`;
                                    setSelectedPedidoSql({ id: item.usuario_id, query: sqlQuery });
                                    setTimeout(() => setSelectedPedidoSql(null), 4500);
                                  }
                                }
                              }}
                              className="w-full py-1 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold text-[9px] cursor-pointer transition-colors text-center"
                              title="Eliminar permanentemente todos los aportes de este usuario"
                            >
                              Borrar todos de User (DB)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="p-4 bg-muted/30 border border-border rounded-lg text-xs flex gap-2 items-start leading-normal">
        <AlertCircle className="w-4 h-4 text-primary shrink-0" />
        <p>
          Las coordenadas capturadas utilizan la <strong>fórmula de Haversine</strong> para medir de forma estricta la distancia lineal de la Tierra evitando costos fijos de Google Maps API. Puedes hacer clic en las coordenadas GPS para abrir directamente Google Maps satelital y calibrar la ruta al instante.
        </p>
      </div>

    </div>
  );
}
