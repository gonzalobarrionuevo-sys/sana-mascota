import React, { useState } from 'react';
import { Usuario, Pedido, FeedbackItem } from '../types';
import { AlertTriangle, Lightbulb, MessageSquare, Star, CheckCircle2, ArrowLeft, Heart, Sparkles, MessageCircle, Edit2, Trash2 } from 'lucide-react';

interface UserFeedbackProps {
  currentUser: Usuario;
  pedidos: Pedido[];
  feedbacks: FeedbackItem[];
  onAddFeedback: (feedback: FeedbackItem) => void;
  onUpdateFeedback?: (feedback: FeedbackItem) => void;
  onDeleteFeedback?: (feedbackId: string) => void;
}

export default function UserFeedback({
  currentUser,
  pedidos,
  feedbacks,
  onAddFeedback,
  onUpdateFeedback,
  onDeleteFeedback
}: UserFeedbackProps) {
  const [activeForm, setActiveForm] = useState<'reclamo' | 'recomendacion' | 'comentario' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);

  // Form Fields State
  const [contenido, setContenido] = useState('');
  const [motivoReclamo, setMotivoReclamo] = useState('Alimento / Vianda');
  const [ordenAsociada, setOrdenAsociada] = useState('');
  const [categoriaRecomendacion, setCategoriaRecomendacion] = useState('Nuevas Recetas BARF');
  const [aptoMascotaRecom, setAptoMascotaRecom] = useState('perro');
  const [estrellasValoracion, setEstrellasValoracion] = useState<number>(5);
  const [hoverEstrellas, setHoverEstrellas] = useState<number | null>(null);

  // Filter our user's orders as reference for complaints
  const userOrders = pedidos.filter(p => p.usuario_id === currentUser.id);

  const resetForm = () => {
    setContenido('');
    setMotivoReclamo('Alimento / Vianda');
    setOrdenAsociada('');
    setCategoriaRecomendacion('Nuevas Recetas BARF');
    setAptoMascotaRecom('perro');
    setEstrellasValoracion(5);
    setHoverEstrellas(null);
    setEditingFeedbackId(null);
  };

  const handleCancel = () => {
    setActiveForm(null);
    setSuccessMessage(null);
    resetForm();
  };

  const handleStartEdit = (item: FeedbackItem) => {
    setEditingFeedbackId(item.id);
    setActiveForm(item.tipo);
    setContenido(item.contenido);

    if (item.tipo === 'reclamo') {
      setMotivoReclamo(item.motivo_o_categoria || 'Alimento / Vianda');
      setOrdenAsociada(item.orden_asociada_id || '');
    } else if (item.tipo === 'recomendacion') {
      if (item.motivo_o_categoria) {
        if (item.motivo_o_categoria.includes(' (')) {
          const parts = item.motivo_o_categoria.split(' (');
          setCategoriaRecomendacion(parts[0]);
          if (parts[1].includes('🐕')) setAptoMascotaRecom('perro');
          else if (parts[1].includes('🐈')) setAptoMascotaRecom('gato');
          else setAptoMascotaRecom('ambos');
        } else {
          setCategoriaRecomendacion(item.motivo_o_categoria);
        }
      }
    } else if (item.tipo === 'comentario') {
      setEstrellasValoracion(item.puntos_valoracion || 5);
    }

    // Scroll to the section smoothly
    const sectionElement = document.getElementById('user-feedback-section');
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!contenido.trim()) {
      alert('Por favor, escribe los detalles antes de enviar.');
      return;
    }

    let motivo_o_categoria = '';
    let puntos_valoracion: number | undefined = undefined;

    if (activeForm === 'reclamo') {
      motivo_o_categoria = motivoReclamo;
    } else if (activeForm === 'recomendacion') {
      motivo_o_categoria = `${categoriaRecomendacion} (${aptoMascotaRecom === 'perro' ? '🐕 Perros' : aptoMascotaRecom === 'gato' ? '🐈 Gatos' : '🐾 Ambos'})`;
    } else if (activeForm === 'comentario') {
      puntos_valoracion = estrellasValoracion;
      motivo_o_categoria = 'Testimonio General';
    }

    if (editingFeedbackId) {
      const updatedItem: FeedbackItem = {
        id: editingFeedbackId,
        usuario_id: currentUser.id,
        usuario_nombre: currentUser.nombre || 'Cliente Registrado',
        usuario_email: currentUser.email,
        tipo: activeForm!,
        motivo_o_categoria,
        puntos_valoracion,
        contenido: contenido.trim(),
        created_at: new Date().toISOString(),
        orden_asociada_id: activeForm === 'reclamo' && ordenAsociada ? ordenAsociada : undefined
      };

      if (onUpdateFeedback) {
        onUpdateFeedback(updatedItem);
      }
      setSuccessMessage(`¡Listo! Tu ${activeForm === 'reclamo' ? 'reclamo privado' : activeForm === 'recomendacion' ? 'recomendación' : 'comentario'} ha sido editado y guardado correctamente.`);
    } else {
      const newItem: FeedbackItem = {
        id: 'fb-' + Math.random().toString(36).substring(2, 9),
        usuario_id: currentUser.id,
        usuario_nombre: currentUser.nombre || 'Cliente Registrado',
        usuario_email: currentUser.email,
        tipo: activeForm!,
        motivo_o_categoria,
        puntos_valoracion,
        contenido: contenido.trim(),
        created_at: new Date().toISOString(),
        orden_asociada_id: activeForm === 'reclamo' && ordenAsociada ? ordenAsociada : undefined
      };

      onAddFeedback(newItem);
      setSuccessMessage(`¡Gracias! Tu ${activeForm === 'reclamo' ? 'reclamo privado' : activeForm === 'recomendacion' ? 'recomendación' : 'comentario'} ha sido enviado correctamente.`);
    }

    resetForm();

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setSuccessMessage(null);
      setActiveForm(null);
    }, 4000);
  };

  // Only display public items in the testimonials/comments grid: comments and recommendations
  const publicFeedbacks = feedbacks.filter(f => !f.eliminado && (f.tipo === 'comentario' || f.tipo === 'recomendacion'));

  const myFeedbacks = feedbacks.filter(f => !f.eliminado && f.usuario_id === currentUser.id);

  return (
    <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-md space-y-6" id="user-feedback-section">
      
      {/* SECCIÓN CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-md font-serif font-black text-primary uppercase tracking-wide flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#557A46]" /> Canal de Clientes: Reclamos, Ideas y Testimonios
          </h3>
          <p className="text-2xs text-muted-foreground font-sans">
            Tu opinión es clave para el control de calidad de nuestras recetas BARF de Catamarca.
          </p>
        </div>
        <span className="text-3xs bg-[#557A46]/10 text-[#557A46] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider">
          Fomentando Nutrición Responsable 🥩
        </span>
      </div>

      {/* BOTONES PRINCIPALES (Mostrados sólo cuando no hay formulario seleccionado) */}
      {!activeForm ? (
        <div className="space-y-6" id="feedback-dashboard-user">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="feedback-buttons-row">
            
            {/* BOTÓN RECLAMOS */}
            <button
              onClick={() => setActiveForm('reclamo')}
              className="flex flex-col items-center justify-between text-center p-5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 transition-all cursor-pointer group text-left h-full shadow-2xs"
              id="trigger-complaint-form"
            >
              <div className="flex flex-col items-center gap-3">
                <span className="p-3 bg-rose-500/10 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-full group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-rose-700 dark:text-rose-300">🚨 Generar un Reclamo</h4>
                  <p className="text-3xs text-muted-foreground mt-1.5 leading-relaxed">
                    ¿Tuviste algún problema con la entrega, las viandas congeladas o el cobro GPS? Infórmalo de inmediato de forma directa y privada.
                  </p>
                </div>
              </div>
              <span className="mt-4 text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 group-hover:underline">
                Comenzar Reclamo &rarr;
              </span>
            </button>

            {/* BOTÓN RECOMENDACIONES */}
            <button
              onClick={() => setActiveForm('recomendacion')}
              className="flex flex-col items-center justify-between text-center p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 transition-all cursor-pointer group text-left h-full shadow-2xs"
              id="trigger-recommendation-form"
            >
              <div className="flex flex-col items-center gap-3">
                <span className="p-3 bg-amber-500/10 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-6 h-6" />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-amber-700 dark:text-amber-300">💡 Sugerir Recomendaciones</h4>
                  <p className="text-3xs text-muted-foreground mt-1.5 leading-relaxed">
                    ¿Se te ocurre un nuevo ingrediente, modificaciones a la calculadora de porciones o mejores recipientes térmicos? Contanos.
                  </p>
                </div>
              </div>
              <span className="mt-4 text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 group-hover:underline">
                Hacer Recomendación &rarr;
              </span>
            </button>

            {/* BOTÓN COMENTARIOS DE CLIENTES */}
            <button
              onClick={() => setActiveForm('comentario')}
              className="flex flex-col items-center justify-between text-center p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group text-left h-full shadow-2xs"
              id="trigger-comment-form"
            >
              <div className="flex flex-col items-center gap-3">
                <span className="p-3 bg-indigo-500/10 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-indigo-700 dark:text-indigo-300">💬 Comentarios de Clientes</h4>
                  <p className="text-3xs text-muted-foreground mt-1.5 leading-relaxed">
                    Califica nuestra comida y dejanos tu comentario de cinco estrellas. ¡Ayuda a otros vecinos del Valle Viejo de Catamarca a confiar en nosotros!
                  </p>
                </div>
              </div>
              <span className="mt-4 text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                Escribir Testimonio &rarr;
              </span>
            </button>

          </div>

          {/* SECCIÓN TUS APORTES */}
          {myFeedbacks.length > 0 && (
            <div className="border border-border p-4 bg-muted/10 rounded-xl space-y-3" id="user-my-submissions">
              <h4 className="font-extrabold text-foreground text-xs uppercase flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-[#557A46]" /> Tus Mensajes y Reclamos Enviados ({myFeedbacks.length})
              </h4>
              <p className="text-3xs text-muted-foreground font-sans">
                Como usuario registrado, puedes modificar o eliminar tus consultas, propuestas o quejas del control de calidad.
              </p>
              
              <div className="space-y-2">
                {myFeedbacks.map((item) => {
                  const isReclamo = item.tipo === 'reclamo';
                  const isRecom = item.tipo === 'recomendacion';
                  return (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors ${
                        isReclamo 
                          ? 'border-rose-500/15 bg-rose-500/5' 
                          : isRecom 
                            ? 'border-amber-500/15 bg-amber-500/5' 
                            : 'border-indigo-500/15 bg-indigo-500/5'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            isReclamo ? 'bg-rose-500 text-white' :
                            isRecom ? 'bg-amber-500 text-black' :
                            'bg-indigo-500 text-white'
                          }`}>
                            {isReclamo ? '🚨 Reclamo' : isRecom ? '💡 Sugerencia' : '💬 Reseña'}
                          </span>
                          <span className="text-3xs text-muted-foreground font-mono">{new Date(item.created_at).toLocaleDateString('es-AR')}</span>
                        </div>
                        <p className="text-xs italic text-foreground leading-relaxed">&ldquo;{item.contenido}&rdquo;</p>
                        {item.motivo_o_categoria && (
                          <div className="text-3xs font-bold text-primary uppercase">
                            Detalle: {item.motivo_o_categoria}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-row gap-1.5 shrink-0 self-end sm:self-center font-sans">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="flex items-center gap-1 p-2 px-2.5 bg-sky-500/10 hover:bg-sky-500 text-sky-800 hover:text-white dark:text-sky-300 dark:hover:text-white transition-colors text-[10px] font-extrabold rounded-md cursor-pointer"
                          title="Editar este aporte"
                        >
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                        {onDeleteFeedback && (
                          <button
                            onClick={() => {
                              if (confirm('¿Seguro quieres eliminar este registro de comentarios permanentemente?')) {
                                onDeleteFeedback(item.id);
                              }
                            }}
                            className="flex items-center gap-1 p-2 px-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-800 hover:text-white dark:text-rose-300 dark:hover:text-white transition-colors text-[10px] font-extrabold rounded-md cursor-pointer"
                            title="Eliminar este aporte"
                          >
                            <Trash2 className="w-3 h-3" /> Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VISTA FORMULARIO INTERACTIVO SELECCIONADO */
        <div className="bg-muted/15 border border-dashed border-border p-5 rounded-xl space-y-4 animate-fade-in relative">
          
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 cursor-pointer font-bold"
            title="Volver"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver
          </button>

          {/* MENSAJE DE ÉXITO */}
          {successMessage ? (
            <div className="text-center py-8 space-y-3 animate-fade-in">
              <span className="p-3 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full inline-block">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
              </span>
              <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400">{successMessage}</h4>
              <p className="text-3xs text-muted-foreground">La consola de Sana Mascota ha registrado e indexado tu respuesta.</p>
              <button
                onClick={handleCancel}
                className="mt-2 bg-primary text-primary-foreground font-black text-xs px-4 py-1.5 rounded cursor-pointer"
              >
                Cerrar Panel
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              
              {/* INDICADOR DEL FORMULARIO ACTUAL */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`p-1.5 rounded text-white ${
                  activeForm === 'reclamo' ? 'bg-rose-500' : activeForm === 'recomendacion' ? 'bg-amber-500' : 'bg-indigo-500'
                }`}>
                  {activeForm === 'reclamo' ? <AlertTriangle className="w-4 h-4" /> : activeForm === 'recomendacion' ? <Lightbulb className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </span>
                <div>
                  <h4 className="font-extrabold text-foreground text-sm uppercase">
                    {editingFeedbackId ? '✏️ EDITAR ' : ''}
                    {activeForm === 'reclamo' ? 'Reclamo en Servicio' : activeForm === 'recomendacion' ? 'Recomendación / Sugerencia' : 'Comentario de Cliente'}
                  </h4>
                  <p className="text-3xs text-muted-foreground">
                    {editingFeedbackId ? 'Modificando tu registro guardado' : 'Iniciando como'}: <strong className="text-primary">{currentUser.nombre}</strong> ({currentUser.email})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* CAMPOS DINÁMICOS SEGÚN SELECCIÓN */}
                {activeForm === 'reclamo' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-3xs uppercase font-extrabold text-muted-foreground">Motivo Principal del Reclamo:</label>
                      <select
                        value={motivoReclamo}
                        onChange={(e) => setMotivoReclamo(e.target.value)}
                        className="w-full bg-background border border-border p-2 rounded text-xs text-foreground focus:outline-none focus:border-primary font-sans"
                      >
                        <option value="Alimento / Vianda">Vianda o Alimento (Estado, empaque vacío, cantidad)</option>
                        <option value="Demora Logística">Demora de Logística / Envío por GPS</option>
                        <option value="Atención o Respuesta">Falta de respuesta o soporte al WhatsApp</option>
                        <option value="Pagos / Facturación">Diferencia de precios o cargo final</option>
                        <option value="Otro Motivo">Otro motivo específico</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-3xs uppercase font-extrabold text-muted-foreground">Vincular a Pedido Real (Opcional):</label>
                      <select
                        value={ordenAsociada}
                        onChange={(e) => setOrdenAsociada(e.target.value)}
                        className="w-full bg-background border border-border p-2 rounded text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                      >
                        <option value="">-- No vincular / Reclamo general --</option>
                        {userOrders.map(o => (
                          <option key={o.id} value={o.id}>
                            ORD #{o.id} - ${o.total} ARS ({new Date(o.created_at).toLocaleDateString('es-AR')})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {activeForm === 'recomendacion' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-3xs uppercase font-extrabold text-muted-foreground">Tipo de Idea / Sugerencia:</label>
                      <select
                        value={categoriaRecomendacion}
                        onChange={(e) => setCategoriaRecomendacion(e.target.value)}
                        className="w-full bg-background border border-border p-2 rounded text-xs text-foreground focus:outline-none focus:border-primary font-sans"
                      >
                        <option value="Nuevas Recetas BARF">Nuevas Recetas BARF o Ingredientes</option>
                        <option value="Empaquetado Térmico">Mejoras de Envase y Conservación</option>
                        <option value="Frecuencias de Envíos">Rutas y Logística y El Bañado / Valle Viejo</option>
                        <option value="Mejoras del Software / App">Mejoras Técnicas en esta Calculadora</option>
                        <option value="Otro">Otros temas</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-3xs uppercase font-extrabold text-muted-foreground">Especie Beneficiada:</label>
                      <select
                        value={aptoMascotaRecom}
                        onChange={(e) => setAptoMascotaRecom(e.target.value)}
                        className="w-full bg-background border border-border p-2 rounded text-xs text-foreground focus:outline-none focus:border-primary font-sans"
                      >
                        <option value="perro">Para Perros 🐕</option>
                        <option value="gato">Para Gatos 🐈</option>
                        <option value="ambos">General / Ambas Mascotas 🐾</option>
                      </select>
                    </div>
                  </>
                )}

                {activeForm === 'comentario' && (
                  <div className="md:col-span-2 space-y-1.5 flex flex-col items-center py-2 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-lg">
                    <label className="block text-3xs uppercase font-extrabold text-indigo-700 dark:text-indigo-400">Valoración Sana Mascota (Clic en Estrellas):</label>
                    <div className="flex gap-2 text-2xl select-none">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isGold = hoverEstrellas !== null ? star <= hoverEstrellas : star <= estrellasValoracion;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEstrellasValoracion(star)}
                            onMouseEnter={() => setHoverEstrellas(star)}
                            onMouseLeave={() => setHoverEstrellas(null)}
                            className="transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                            title={`Valorar con ${star} estrella(s)`}
                          >
                            <Star className={`w-8 h-8 ${isGold ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-3xs font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">
                      {estrellasValoracion === 5 ? '🏆 ¡Excelente! Experiencia Perfecta' :
                       estrellasValoracion === 4 ? '✨ Muy Bueno, Satisfecho' :
                       estrellasValoracion === 3 ? '👍 Bueno / Regular' :
                       estrellasValoracion === 2 ? '⚠️ Debe Mejorar' : '🚫 Insatisfecho'}
                    </span>
                  </div>
                )}

              </div>

              {/* DETALLE EN TEXTO */}
              <div className="space-y-1">
                <label className="block text-3xs uppercase font-extrabold text-muted-foreground">
                  {activeForm === 'reclamo' ? 'Describe detalladamente el reclamo (máx 400 caracteres):' :
                   activeForm === 'recomendacion' ? 'Describe tu consejo o sugerencia del menú (máx 400 caracteres):' :
                   'Escribe tu testimonio / reseña de veterinaria sana mascota (máx 280 caracteres):'}
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={activeForm === 'comentario' ? 280 : 400}
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  placeholder={
                    activeForm === 'reclamo' ? 'Escribe aquí tu objeción. Detalla si hay viandas repetidas, problemas de entrega, etc. Nos comunicaremos a la brevedad por WhatsApp...' :
                    activeForm === 'recomendacion' ? 'Escribe tu idea. Ej: "Estaría genial que incorporen platos deshidratados para viajes..."' :
                    'Explica qué tal le sientan las viandas a tu perro/gato y cómo evalúas el asesoramiento nutricional...'
                  }
                  className="w-full bg-background border border-border p-3 rounded-lg text-xs text-foreground focus:outline-none focus:border-primary leading-normal w-full"
                />
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                  <span>Soporte activo de Lunes a Viernes de 8:00 a 19:00</span>
                  <span>{contenido.length} / {activeForm === 'comentario' ? 280 : 400}</span>
                </div>
              </div>

              {/* ACCIONES */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-border/40 font-sans">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-border text-muted-foreground hover:bg-muted font-bold rounded-lg cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 font-black text-white rounded-lg shadow-sm hover:opacity-95 cursor-pointer transition-all ${
                    activeForm === 'reclamo' ? 'bg-rose-600 hover:shadow-rose-600/10' :
                    activeForm === 'recomendacion' ? 'bg-amber-600 hover:shadow-amber-600/10' :
                    'bg-indigo-600 hover:shadow-indigo-600/10'
                  }`}
                >
                  {editingFeedbackId ? '✏️ Guardar Cambios' : (
                    activeForm === 'reclamo' ? '🚀 Enviar Reclamo Seguro' :
                    activeForm === 'recomendacion' ? '💡 Registrar Sugerencia' :
                    '💬 Publicar Testimonio ⭐'
                  )}
                </button>
              </div>

              {activeForm === 'reclamo' && (
                <p className="text-[10px] text-rose-600 dark:text-rose-400 italic bg-rose-500/5 p-2 rounded border border-rose-500/10">
                  🔒 Info: Tu reclamo se envía exclusivamente y de forma privada al Administrador para garantizar la protección de tus datos y agilizar la compensación del pedido. No se exhibirá en la pizarra pública de clientes.
                </p>
              )}

            </form>
          )}

        </div>
      )}

      {/* PIZARRA PÚBLICA DE RECOMENDACIONES Y TESTIMONIOS (Muro de clientes) */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" /> Pizarra Sana Mascota: Muro de Testimonios y Sugerencias de Vecinos
          </h4>
          <span className="text-3xs font-mono text-muted-foreground">Muestras del local ({publicFeedbacks.length})</span>
        </div>

        {publicFeedbacks.length === 0 ? (
          <div className="text-center py-8 rounded-lg bg-muted/10 border border-dashed border-border text-muted-foreground text-xs">
            ¡Sé el primer cliente en aportar su recomendación u opinión! Haz clic en los botones de arriba para enviar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {publicFeedbacks.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  item.tipo === 'comentario' 
                    ? 'bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20 shadow-3xs' 
                    : 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 shadow-3xs'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-foreground block">{item.usuario_nombre}</span>
                        {item.usuario_id === currentUser.id && (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="text-[9px] text-sky-600 dark:text-sky-400 font-extrabold hover:underline py-0.5 px-1.5 bg-sky-500/10 rounded flex items-center gap-0.5 cursor-pointer"
                            title="Haz clic para modificar este aporte"
                          >
                            <Edit2 className="w-2.5 h-2.5" /> Editar
                          </button>
                        )}
                      </div>
                      <span className="text-3xs text-muted-foreground font-mono block">
                        Registrado el: {new Date(item.created_at).toLocaleDateString('es-AR')}
                      </span>
                    </div>

                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      item.tipo === 'comentario' ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                    }`}>
                      {item.tipo === 'comentario' ? 'Comentario ⭐' : 'Idea 💡'}
                    </span>
                  </div>

                  {item.tipo === 'comentario' && item.puntos_valoracion && (
                    <div className="flex text-amber-400 text-xs gap-0.5 shrink-0" title={`${item.puntos_valoracion} estrellas`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < (item.puntos_valoracion || 5) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {item.motivo_o_categoria && (
                    <span className="text-3xs text-primary font-bold uppercase tracking-wider block bg-[#557A46]/10 py-0.5 px-2 rounded w-fit">
                      Categoría: {item.motivo_o_categoria}
                    </span>
                  )}

                  <p className="text-xs text-foreground italic leading-relaxed pt-1">
                    &ldquo;{item.contenido}&rdquo;
                  </p>
                </div>

                <div className="text-right border-t border-border/40 pt-2 flex justify-between items-center text-[10px]">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-500 shrink-0 fill-red-500" /> Alimentación Natural
                  </span>
                  <span className="text-primary font-bold">Catamarca, Argentina</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
