import React, { useState, useEffect } from 'react';
import { Usuario, Mascota, ItemCarrito, Pedido, Producto, FeedbackItem } from './types';
import { CATALOGO_PRODUCTOS } from './data/products';
import PetManager from './components/PetManager';
import ShippingCalculator from './components/ShippingCalculator';
import ProductCalculator from './components/ProductCalculator';
import CheckoutAndSync from './components/CheckoutAndSync';
import SupabaseSchema from './components/SupabaseSchema';
import AdminPanel from './components/AdminPanel';
import AuthScreen from './components/AuthScreen';
import UserFeedback from './components/UserFeedback';
import { PawPrint, Settings, Eye, Database, Sun, Moon, MapPin, Compass, HelpCircle, PhoneCall, LogOut } from 'lucide-react';

const DEMO_PETS: Mascota[] = [
  {
    id: 'pet-rocco-01',
    usuario_id: '04b0870f-dfd9-4b6b-80df-89241bda2720',
    nombre: 'Rocco',
    tipo: 'perro',
    raza: 'Golden Retriever',
    peso: 32.5,
    alergias: 'Ninguna',
    created_at: '2026-06-06T15:12:33Z'
  }
];

const DEMO_ORDERS: Pedido[] = [
  {
    id: 'ord-81f7c',
    usuario_id: '04b0870f-dfd9-4b6b-80df-89241bda2720',
    usuario_nombre: 'Gonzalo Barrionuevo',
    usuario_telefono: '+5493834000000',
    mascota_id: 'pet-rocco-01',
    mascota_nombre: 'Rocco',
    detalles: 'Menú Dieta BARF Pollo & Zanahoria (15.5 Kg), Snacks Deshidratados de Pulmón (2 U)',
    coordenadas_lat: -28.468,
    coordenadas_lng: -65.712,
    direccion_texto: 'Calle San Martín 150 - San Isidro',
    metodo_envio: 'gps',
    costo_envio: 1000,
    subtotal: 69000,
    total: 70000,
    estado: 'preparando',
    created_at: '2026-06-06T12:30:00.000Z'
  }
];

const DEMO_FEEDBACKS: FeedbackItem[] = [
  {
    id: 'fb-01',
    usuario_id: '04b0870f-dfd9-4b6b-80df-89241bda2720',
    usuario_nombre: 'Gonzalo Barrionuevo',
    usuario_email: 'gonzalobarrionuevo@gmail.com',
    tipo: 'comentario',
    contenido: '¡Las viandas BARF son insuperables! Rocco devora su comida con gusto y su pelo está súper brilloso. La atención de Sana Mascota en El Bañado es excelente y súper rápida.',
    puntos_valoracion: 5,
    created_at: '2026-06-06T15:20:00.000Z'
  },
  {
    id: 'fb-02',
    usuario_id: 'usr-92a11',
    usuario_nombre: 'María Belén Soto',
    usuario_email: 'mbelen@gmail.com',
    tipo: 'recomendacion',
    motivo_o_categoria: 'Alimentos (🐾 Ambos)',
    contenido: 'Sería fantástico que agreguen envases térmicos reciclables para mantener congelada la carne si tardamos un poco más en retirar el pedido de la sucursal.',
    created_at: '2026-06-05T18:10:00.000Z',
    eliminado: true
  },
  {
    id: 'fb-03',
    usuario_id: 'usr-41c22',
    usuario_nombre: 'Carlos Juárez',
    usuario_email: 'carlosj@gmail.com',
    tipo: 'reclamo',
    motivo_o_categoria: 'Demora Logística',
    contenido: 'El envío por GPS a San Isidro demoró 45 minutos más de lo pautado el día de ayer Lunes. Por favor prever mejor el tráfico.',
    created_at: '2026-06-05T11:45:00.000Z',
    orden_asociada_id: 'ord-81f7c'
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('sanamascota_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'cliente' | 'admin' | 'schema'>('cliente');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const handleLoginSuccess = (user: Usuario) => {
    setCurrentUser(user);
    localStorage.setItem('sanamascota_current_user', JSON.stringify(user));
    if (user.rol !== 'admin') {
      setActiveTab('cliente');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sanamascota_current_user');
  };
  
  // State variables synchronized with localStorage
  const [pets, setPets] = useState<Mascota[]>(() => {
    const saved = localStorage.getItem('sanamascota_pets');
    return saved ? JSON.parse(saved) : DEMO_PETS;
  });

  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const saved = localStorage.getItem('sanamascota_pedidos');
    return saved ? JSON.parse(saved) : DEMO_ORDERS;
  });

  const [productos, setProductos] = useState<Producto[]>(() => {
    const saved = localStorage.getItem('sanamascota_productos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out the requested deleted products so they don't persist
          const forbiddenIds = ['prod-barf-carne', 'prod-barf-gato', 'prod-horneado-cerdo', 'prod-suplemento-calcio'];
          return parsed.filter(p => 
            !forbiddenIds.includes(p.id) && 
            !p.nombre.toLowerCase().includes('instinto salvaje') && 
            !p.nombre.toLowerCase().includes('hueso molido') && 
            !p.nombre.toLowerCase().includes('cerdo y batata') && 
            !p.nombre.toLowerCase().includes('super vacuno')
          );
        }
      } catch (e) {
        // use default
      }
    }
    const withStock = CATALOGO_PRODUCTOS.map(p => ({
      ...p,
      stock: p.stock !== undefined ? p.stock : 120 // base default inventory limit
    }));
    localStorage.setItem('sanamascota_productos', JSON.stringify(withStock));
    return withStock;
  });

  const [cart, setCart] = useState<ItemCarrito[]>([]);
  
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => {
    const saved = localStorage.getItem('sanamascota_feedbacks');
    if (saved) {
      try {
        const parsed: FeedbackItem[] = JSON.parse(saved);
        return parsed.map(f => f.id === 'fb-02' ? { ...f, eliminado: true } : f);
      } catch (e) {
        return DEMO_FEEDBACKS;
      }
    }
    return DEMO_FEEDBACKS;
  });
  
  // Shipping details state
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shippingLat, setShippingLat] = useState<number | null>(null);
  const [shippingLng, setShippingLng] = useState<number | null>(null);
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [shippingMethod, setShippingMethod] = useState<'gps' | 'manual'>('manual');

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Sync state changes with local storage
  useEffect(() => {
    localStorage.setItem('sanamascota_pets', JSON.stringify(pets));
  }, [pets]);

  useEffect(() => {
    localStorage.setItem('sanamascota_pedidos', JSON.stringify(pedidos));
  }, [pedidos]);

  useEffect(() => {
    localStorage.setItem('sanamascota_productos', JSON.stringify(productos));
  }, [productos]);

  useEffect(() => {
    localStorage.setItem('sanamascota_feedbacks', JSON.stringify(feedbacks));
  }, [feedbacks]);

  // Dark mode side effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Pet management handlers
  const handleAddPet = (newPetData: Omit<Mascota, 'id' | 'usuario_id' | 'created_at'>) => {
    const freshPet: Mascota = {
      ...newPetData,
      id: 'pet-' + Math.random().toString(36).substring(2, 9),
      usuario_id: currentUser?.id || 'guest',
      created_at: new Date().toISOString()
    };
    setPets(prev => [...prev, freshPet]);
  };

  const handleDeletePet = (petId: string) => {
    setPets(prev => prev.filter(p => p.id !== petId));
  };

  // Order management handlers
  const handleAddNewOrder = (newOrder: Pedido) => {
    setPedidos(prev => [newOrder, ...prev]);
    setIsCheckoutOpen(false);
    setCart([]); // Reset shopping cart
  };

  const handleUpdateOrderStatus = (pedidoId: string, nuevoEstado: Pedido['estado']) => {
    setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
  };

  const handleUpdateOrderPayment = (pedidoId: string, pagado: boolean) => {
    setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, pago_confirmado: pagado } : p));
  };

  const handleClearDatabase = () => {
    if (window.confirm('¿Seguro quieres despejar la base de datos simulada de pedidos?')) {
      setPedidos([]);
      localStorage.removeItem('sanamascota_pedidos');
    }
  };

  const handleDeleteOrder = (pedidoId: string) => {
    if (window.confirm('¿Estás seguro/a de que quieres eliminar este pedido de la base de datos permanentemente?')) {
      setPedidos(prev => prev.filter(p => p.id !== pedidoId));
    }
  };

  const handleHideAllFeedbacksByUser = (usuarioId: string) => {
    setFeedbacks(prev => prev.map(f => f.usuario_id === usuarioId ? { ...f, eliminado: true } : f));
  };

  const handleHideFeedback = (fbId: string) => {
    setFeedbacks(prev => prev.map(f => f.id === fbId ? { ...f, eliminado: true } : f));
  };

  const handleRestoreFeedback = (fbId: string) => {
    setFeedbacks(prev => prev.map(f => f.id === fbId ? { ...f, eliminado: false } : f));
  };

  const handleDeleteFeedbackPermanently = (fbId: string) => {
    setFeedbacks(prev => prev.filter(f => f.id !== fbId));
  };

  const handleDeleteAllFeedbacksByUserPermanently = (usuarioId: string) => {
    setFeedbacks(prev => prev.filter(f => f.usuario_id !== usuarioId));
  };

  const handleShippingChange = (
    costo: number,
    lat: number | null,
    lng: number | null,
    direccion: string,
    metodo: 'gps' | 'manual'
  ) => {
    setShippingCost(costo);
    setShippingLat(lat);
    setShippingLng(lng);
    setShippingAddress(direccion);
    setShippingMethod(metodo);
  };

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans" id="app-root">
      
      {/* HEADER PRINCIPAL */}
      <header className="bg-card text-card-foreground border-b border-border shadow-sm sticky top-0 z-40 transition-colors" id="app-header">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-sanamascota.png" 
              referrerPolicy="no-referrer" 
              alt="Logo" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="w-8 h-8 object-contain rounded-full bg-[#557A46]/10 p-0.5" 
            />
            <div>
              <h1 className="text-lg font-serif font-black tracking-tight text-[#557A46] uppercase leading-none">Sana Mascota</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Local Time and Session Indicators */}
            <div className="hidden lg:flex flex-col items-end text-right font-mono text-3xs text-muted-foreground">
              <span className="text-[#557A46] dark:text-[#88B04B] font-bold">Sesión: {currentUser.nombre}</span>
              <span>Local: UTC-3 Catamarca, AR</span>
            </div>

            {/* Cerrar Sesión Button */}
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-destructive hover:border-destructive/30 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
              title="Cerrar sesion local"
              id="logout-btn"
            >
              <LogOut className="w-3.5 h-3.5 mr-0.5" /> Salir
            </button>

            {/* Dark mode button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-full border border-border hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              title="Cambiar Modo Visual"
              id="theme-toggler-btn"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500 fill-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* SUB-BARRA DE NAVEGACIÓN DE PESTAÑAS */}
      <section className="bg-muted/40 border-b border-border shadow-2xs" id="app-tabs-navigation">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTab('cliente')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cliente'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              id="tab-client-trigger"
            >
              <Eye className="w-3.5 h-3.5" /> Módulo Cliente
            </button>
            {currentUser.rol === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                id="tab-admin-trigger"
              >
                <Settings className="w-3.5 h-3.5" /> Consola Administrador
              </button>
            )}
            {currentUser.rol === 'admin' && (
              <button
                onClick={() => setActiveTab('schema')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'schema'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                id="tab-schema-trigger"
              >
                <Database className="w-3.5 h-3.5" /> DB Supabase Schema
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/5493834070734"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-sans cursor-pointer bg-card px-2.5 py-1 rounded border border-border"
              id="floating-support-btn"
            >
              <PhoneCall className="w-3 h-3 text-emerald-600 shrink-0" /> Soporte: +5493834070734
            </a>
          </div>
        </div>
      </section>

      {/* CONTENEDOR CENTRAL */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-6" id="app-main-view">
        
        {/* MÓDULO CLIENTE */}
        {activeTab === 'cliente' && (
          <div className="space-y-8 animate-fade-in" id="client-module-container">
            
            {/* HERO BANNER LANDING PAGE - INSPIRADO EN EL LOGO REAL */}
            <div className="bg-[#557A46]/5 dark:bg-[#557A46]/10 border-2 border-[#557A46]/20 rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center" id="client-hero">
              <div className="md:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 bg-[#557A46]/15 text-[#557A46] dark:text-[#88B04B] border border-[#557A46]/25 rounded-full px-3.5 py-1 text-2xs font-bold uppercase tracking-wider animate-pulse">
                  🌱 Alimento 100% Natural
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-black text-[#557A46] dark:text-[#88B04B] leading-tight-none md:leading-tight">
                  Alimentación 100% Natural Para Tu Mascota 🐾
                </h2>
                <p className="text-sm md:text-base text-foreground leading-relaxed">
                  En <strong className="text-[#557A46] dark:text-[#88B04B] font-extrabold">SANA MASCOTA</strong> preparamos viandas crudas BARF sin químicos, <strong className="text-[#557A46] dark:text-[#88B04B] font-extrabold bg-[#557A46]/10 dark:bg-[#557A46]/25 px-1.5 py-0.5 rounded-md inline-block sm:inline whitespace-nowrap">aprobados por SENASA N°-2025.141154910</strong>.
                </p>

                {/* SERVICIOS DESTACADOS DE SANA MASCOTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-3 bg-card border border-border p-2.5 rounded-xl shadow-xs">
                    <span className="text-2xl p-1.5 bg-[#557A46]/10 rounded-lg">🥓</span>
                    <div>
                      <h4 className="font-bold text-xs text-[#557A46] dark:text-[#88B04B] uppercase tracking-wide">Snacks de Colágeno Natural</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">Salud articular y masticación recreativa limpia</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-card border border-border p-2.5 rounded-xl shadow-xs">
                    <span className="text-2xl p-1.5 bg-[#557A46]/10 rounded-lg">🍱</span>
                    <div>
                      <h4 className="font-bold text-xs text-[#557A46] dark:text-[#88B04B] uppercase tracking-wide">Vianda Natural 500g</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">Porciones diarias exactas envasadas al vacío</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-card border border-border p-2.5 rounded-xl shadow-xs">
                    <span className="text-2xl p-1.5 bg-[#557A46]/10 rounded-lg">🦴</span>
                    <div>
                      <h4 className="font-bold text-xs text-[#557A46] dark:text-[#88B04B] uppercase tracking-wide">Vianda Entero</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">Huesos carnosos enteros biológicamente correctos</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-card border border-border p-2.5 rounded-xl shadow-xs">
                    <span className="text-2xl p-1.5 bg-[#557A46]/10 rounded-lg">🩺</span>
                    <div>
                      <h4 className="font-bold text-xs text-[#557A46] dark:text-[#88B04B] uppercase tracking-wide">Viandas Recetadas por Veterinaria</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">Dietas personalizadas según indicación médica</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-3 text-xs text-muted-foreground border-t border-border">
                  <span className="flex items-center gap-1 w-full sm:w-auto bg-[#557A46]/10 dark:bg-[#557A46]/20 text-[#557A46] dark:text-[#88B04B] px-2.5 py-1 rounded-md font-bold text-2xs uppercase tracking-wider">
                    🚚 Delivery: Lunes a Viernes por la Tarde
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-[#557A46]" /> <strong>Local:</strong> El Bañado, Valle Viejo
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Compass className="w-3.5 h-3.5 text-[#557A46]" /> <strong>Envíos con GPS:</strong> $500/Km
                  </span>
                </div>
              </div>

              {/* CONTENEDOR DEL LOGO DE LA MARCA */}
              <div className="md:col-span-4 bg-card p-5 rounded-xl border border-border text-center shadow-md flex flex-col items-center justify-between gap-4">
                <div className="relative group">
                  {/* Etiqueta img exacta solicitada por el usuario */}
                  <img 
                    src="/src/assets/images/regenerated_image_1780768807293.jpg" 
                    referrerPolicy="no-referrer" 
                    alt="Sana Mascota Official Logo" 
                    onError={(e) => {
                      // Fallback elegante en caso de que no lo hubieran colocado aún
                      e.currentTarget.src = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200";
                      e.currentTarget.className = "w-28 h-28 mx-auto rounded-full object-cover border-4 border-[#557A46]/20 bg-muted p-1";
                    }}
                    className="w-32 h-32 mx-auto object-contain transition-transform group-hover:scale-105 duration-300"
                    id="logo-brand-img"
                  />
                </div>

                <div className="w-full text-center">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block">Contacto Coordinación</span>
                  <strong className="text-foreground text-sm font-mono block mt-0.5">+54 9 383 4070734</strong>
                  <a
                    href="https://wa.me/5493834070734"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mt-3 bg-[#557A46] hover:bg-[#405D33] text-white font-sans font-bold text-xs py-2.5 px-4 rounded-lg block shadow-sm transition-all text-center cursor-pointer hover:shadow-md"
                  >
                    💬 Chat de WhatsApp Directo
                  </a>
                </div>
              </div>
            </div>

            {/* SECCIÓN REGISTRO DE MASCOTAS */}
            <PetManager
              pets={pets}
              onAddPet={handleAddPet}
              onDeletePet={handleDeletePet}
            />

            {/* SECCIÓN ADICIÓN DE PRODUCTOS Y CATÁLOGO SALUDABLE */}
            <div>
              <div className="mb-4">
                <h3 className="text-base font-serif font-black text-foreground uppercase tracking-wide">Selección de Artículos & Viandas</h3>
                <p className="text-xs text-muted-foreground">Paso 2: Combina viandas naturales personalizadas y adiciona artículos de nuestro catálogo.</p>
              </div>
              <ProductCalculator
                pets={pets}
                cart={cart}
                setCart={setCart}
                shippingCost={shippingCost}
                onCheckoutTriggered={() => setIsCheckoutOpen(true)}
                viewMode="catalog"
                productosList={productos}
              />
            </div>

            {/* SECCIÓN CALCULADORA DE LOGÍSTICA / ENVÍO */}
            <ShippingCalculator
              onShippingSelected={handleShippingChange}
              selectedCost={shippingCost}
              selectedMethod={shippingMethod}
              selectedAddress={shippingAddress}
            />

            {/* SECCIÓN EL CARRITO - AL FINAL DE TODO */}
            <div id="shopping-cart-section">
              <div className="mb-4">
                <h3 className="text-base font-serif font-black text-[#557A46] dark:text-[#88B04B] uppercase tracking-wide flex items-center gap-2">
                  🛒 Tu Carrito de Sana Mascota
                </h3>
                <p className="text-xs text-muted-foreground">Paso 4: Confirma las viandas seleccionadas, costo de envío por GPS y procede a la orden final.</p>
              </div>
              <ProductCalculator
                pets={pets}
                cart={cart}
                setCart={setCart}
                shippingCost={shippingCost}
                onCheckoutTriggered={() => setIsCheckoutOpen(true)}
                viewMode="cart"
                productosList={productos}
              />
            </div>

            {/* CANAL DE CLIENTES: RECLAMOS, RECOMENDACIONES Y COMENTARIOS */}
            <UserFeedback
              currentUser={currentUser}
              pedidos={pedidos}
              feedbacks={feedbacks}
              onAddFeedback={(newFb) => {
                setFeedbacks(prev => [newFb, ...prev]);
              }}
              onUpdateFeedback={(updatedFb) => {
                setFeedbacks(prev => prev.map(f => f.id === updatedFb.id ? updatedFb : f));
              }}
              onDeleteFeedback={handleHideFeedback}
            />

          </div>
        )}

        {/* MÓDULO ADMINISTRADOR */}
        {activeTab === 'admin' && currentUser?.rol === 'admin' && (
          <div className="animate-fade-in" id="admin-module-container">
            <div className="mb-6">
              <h2 className="text-xl font-serif font-black text-foreground uppercase tracking-wide">Módulo de Administración Sana Mascota</h2>
              <p className="text-sm text-muted-foreground">Panel de monitoreo del local con bases de datos simuladas Supabase, logística e ingresos.</p>
            </div>
            <AdminPanel
              pedidos={pedidos}
              onUpdateStatus={handleUpdateOrderStatus}
              onClearDatabase={handleClearDatabase}
              onDeleteOrder={handleDeleteOrder}
              petsCount={pets.length}
              productos={productos}
              onUpdateProductos={setProductos}
              onUpdatePaymentStatus={handleUpdateOrderPayment}
              feedbacks={feedbacks}
              onDeleteFeedback={handleHideFeedback}
              onDeleteFeedbackPermanently={handleDeleteFeedbackPermanently}
              onDeleteAllFeedbacksByUser={handleHideAllFeedbacksByUser}
              onDeleteAllFeedbacksByUserPermanently={handleDeleteAllFeedbacksByUserPermanently}
              onRestoreFeedback={handleRestoreFeedback}
            />
          </div>
        )}

        {/* MÓDULO VISUALIZADOR DE SCHEMA SQL */}
        {activeTab === 'schema' && currentUser?.rol === 'admin' && (
          <div className="animate-fade-in" id="schema-module-container">
            <div className="mb-6">
              <h2 className="text-xl font-serif font-black text-foreground uppercase tracking-wide">Estructuras DDL y Migración para Supabase</h2>
              <p className="text-sm text-muted-foreground">Estudio del backend e ingeniería de base de datos relacional para Sana Mascota con cero cobro fijo.</p>
            </div>
            <SupabaseSchema />
          </div>
        )}

      </main>

      {/* FOOTER GENERAL */}
      <footer className="bg-card text-muted-foreground border-t border-border mt-12 py-6 text-center text-xs transition-colors" id="app-footer">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Sana Mascota · CP 4707, El Bañado, San Isidro, Catamarca, Argentina.</p>
          <p className="text-3xs text-muted-foreground font-mono mt-1">Calculadora de envío mediante fórmula de Haversine bajo GPS natal (navigator.geolocation) • Sincronización Supabase • Integraciones con WhatsApp</p>
        </div>
      </footer>

      {/* DRAWER / MODAL DE CHECKOUT & SINCRONIZACIÓN SUPABASE */}
      {isCheckoutOpen && (
        <CheckoutAndSync
          usuario={currentUser}
          cart={cart}
          pets={pets}
          shippingCost={shippingCost}
          shippingLat={shippingLat}
          shippingLng={shippingLng}
          shippingAddress={shippingAddress}
          shippingMethod={shippingMethod}
          onOrderPlaced={handleAddNewOrder}
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}

    </div>
  );
}
