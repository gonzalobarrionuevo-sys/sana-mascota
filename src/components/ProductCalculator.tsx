import React, { useState } from 'react';
import { Mascota, Producto, ItemCarrito } from '../types';
import { CATALOGO_PRODUCTOS, calcularPorcionDiaria } from '../data/products';
import { ShoppingCart, Plus, Minus, Trash, Dumbbell, Sparkles, Receipt, Calculator, Eye } from 'lucide-react';

interface ProductCalculatorProps {
  pets: Mascota[];
  cart: ItemCarrito[];
  setCart: React.Dispatch<React.SetStateAction<ItemCarrito[]>>;
  shippingCost: number;
  onCheckoutTriggered: () => void;
  viewMode?: 'catalog' | 'cart' | 'both';
  productosList?: Producto[];
}

export default function ProductCalculator({
  pets,
  cart,
  setCart,
  shippingCost,
  onCheckoutTriggered,
  viewMode = 'both',
  productosList
}: ProductCalculatorProps) {
  const useCatalog = productosList || CATALOGO_PRODUCTOS;
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [selectedFoodId, setSelectedFoodId] = useState<string>(useCatalog[0]?.id || '');
  const [petActivity, setPetActivity] = useState<boolean>(false);

  const getQtyInCart = (productId: string) => {
    return cart.reduce((total, item) => {
      if (item.producto.id === productId) {
        return total + item.cantidad;
      }
      return total;
    }, 0);
  };

  // Cart helper functions
  const addToCart = (producto: Producto, cantidad: number, petId?: string) => {
    // Find live product from useCatalog to obtain current stock level
    const liveProd = useCatalog.find(p => p.id === producto.id) || producto;
    
    setCart((prevCart) => {
      // Check if product with optional pet customization already exists in cart
      const existingIndex = prevCart.findIndex(
        (item) =>
          item.producto.id === producto.id &&
          item.personalizado_para_mascota_id === petId
      );

      const currentQtyInCart = existingIndex > -1 ? prevCart[existingIndex].cantidad : 0;
      const targetQty = Number((currentQtyInCart + cantidad).toFixed(1));

      if (liveProd.stock !== undefined && liveProd.stock < targetQty) {
        alert(`Lo sentimos, no hay suficiente stock. Sólo quedan ${liveProd.stock} de este artículo y ya posees ${currentQtyInCart} en tu carrito.`);
        return prevCart;
      }

      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].cantidad = targetQty;
        return newCart;
      }

      return [...prevCart, { producto: liveProd, cantidad, personalizado_para_mascota_id: petId }];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prevCart) => {
      const newCart = [...prevCart];
      const newQty = Number((newCart[index].cantidad + delta).toFixed(1));
      const prod = newCart[index].producto;
      const liveProd = useCatalog.find(p => p.id === prod.id) || prod;
      
      if (delta > 0 && liveProd.stock !== undefined && liveProd.stock < newQty) {
        alert(`Lo sentimos, no hay suficiente stock disponible. Sólo quedan ${liveProd.stock} de este artículo.`);
        return prevCart;
      }

      if (newQty <= 0) {
        newCart.splice(index, 1);
      } else {
        newCart[index].cantidad = newQty;
      }
      return newCart;
    });
  };

  const removeItem = (index: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  // Nutrition helper
  const selectedPet = pets.find((p) => p.id === selectedPetId);
  const selectedFood = useCatalog.find((f) => f.id === selectedFoodId) || useCatalog[0];

  const handleApplyDiet = () => {
    if (!selectedPet) return;
    const { mensualKg } = calcularPorcionDiaria(selectedPet.peso, selectedPet.tipo, petActivity);
    
    // Auto-add calculated raw KG to cart
    addToCart(selectedFood, mensualKg, selectedPet.id);
  };

  const subtotalProducts = cart.reduce((acc, item) => {
    return acc + item.producto.precio_unitario * item.cantidad;
  }, 0);

  const grandTotal = subtotalProducts + shippingCost;

  if (viewMode === 'catalog') {
    return (
      <div className="space-y-6 animate-fade-in" id="product-calculator-catalog-only">
        {/* CALCULADORA DE PLAN NUTRICIONAL INTELIGENTE */}
        <div className="bg-card text-card-foreground p-5 rounded-lg border border-border shadow-md" id="smart-diet-plan-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 px-2.5 bg-primary/10 text-primary rounded-full text-xs font-bold font-sans">1</div>
            <div>
              <h3 className="text-base font-serif font-semibold text-primary flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Plan Nutricional Mensual Personalizado
              </h3>
              <p className="text-2xs text-muted-foreground mt-0.5">
                Calcula la dieta exacta y presupuesto para las viandas mensuales de tu mascota al instante.
              </p>
            </div>
          </div>

          {pets.length === 0 ? (
            <div className="p-4 bg-muted/30 border border-dashed border-border rounded text-center text-xs text-muted-foreground">
              <Sparkles className="w-5 h-5 text-primary/40 mx-auto mb-1" />
              <span>Para cotizar dietas a medida, registra al menos una mascota arriba en la pestaña de mascotas.</span>
            </div>
          ) : (
            <div className="space-y-4 bg-muted/20 p-4 rounded-md border border-border/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-bold text-foreground uppercase tracking-wide mb-1">Mascota seleccionada</label>
                  <select
                    value={selectedPetId}
                    onChange={(e) => setSelectedPetId(e.target.value)}
                    className="w-full bg-background border border-border rounded p-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="">-- Elige qué mascota alimentar --</option>
                    {pets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.nombre} ({pet.tipo === 'perro' ? 'Perro' : 'Gato'} · {pet.peso} Kg)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-foreground uppercase tracking-wide mb-1">Menú / Sabor</label>
                  <select
                    value={selectedFoodId}
                    onChange={(e) => setSelectedFoodId(e.target.value)}
                    className="w-full bg-background border border-border rounded p-2 text-xs text-foreground focus:outline-none"
                  >
                    {CATALOGO_PRODUCTOS.filter(
                      f => selectedPet ? (selectedPet.tipo === f.tipo_mascota || f.tipo_mascota === 'ambos') : true
                    ).map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.nombre} (${prod.precio_unitario}/Kg)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedPet && (
                <div className="bg-background p-3 rounded border border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-fade-in">
                  <div>
                    <span className="text-muted-foreground text-3xs block uppercase">Porción Diaria:</span>
                    <strong className="text-foreground text-sm">
                      {calcularPorcionDiaria(selectedPet.peso, selectedPet.tipo, petActivity).recomenedadoGramos} gramos/día
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-3xs block uppercase">Consumo Mensual:</span>
                    <strong className="text-primary text-sm">
                      {calcularPorcionDiaria(selectedPet.peso, selectedPet.tipo, petActivity).mensualKg} Kg / Mes
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-3xs block uppercase">Presupuesto Mensual:</span>
                    <strong className="text-foreground text-sm">
                      ${Math.round(calcularPorcionDiaria(selectedPet.peso, selectedPet.tipo, petActivity).mensualKg * selectedFood.precio_unitario)} ARS
                    </strong>
                  </div>

                  <div className="sm:col-span-3 pt-2 border-t border-border/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-2xs font-medium">
                      <input
                        type="checkbox"
                        checked={petActivity}
                        onChange={(e) => setPetActivity(e.target.checked)}
                        className="accent-primary"
                      />
                      <Dumbbell className="w-3.5 h-3.5 text-primary" /> ¿Es una mascota muy activa o realiza ejercicio de trabajo diario?
                    </label>

                    <button
                      type="button"
                      onClick={handleApplyDiet}
                      className="bg-primary/10 hover:bg-primary sm:self-center w-full sm:w-auto text-primary hover:text-primary-foreground text-2xs font-bold py-1.5 px-3 rounded transition-all cursor-pointer"
                    >
                      Añadir Plan Mensivo al Carrito
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CATÁLOGO DE PRODUCTOS RECOMIENDA */}
        <div className="bg-card text-card-foreground p-5 rounded-lg border border-border shadow-md" id="product-catalog-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1 px-2.5 bg-primary/10 text-primary rounded-full text-xs font-bold font-sans">2</div>
            <div>
              <h3 className="text-base font-serif font-semibold text-primary">Nuestro Catálogo Saludable</h3>
              <p className="text-2xs text-muted-foreground">Agrégalo directamente en Kg o packs por unidad.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {useCatalog.map((prod) => (
              <div
                key={prod.id}
                className="p-3.5 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 flex flex-col justify-between gap-3 transition-all"
                id={`product-item-${prod.id}`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-3xl bg-background rounded-md p-1.5 border border-border shadow-2xs leading-none">
                      {prod.imagen}
                    </span>
                    <span className="text-3xs uppercase tracking-wider font-semibold bg-primary/15 text-primary border border-primary/25 rounded px-2 py-0.5 leading-none">
                      {prod.categoria}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground mt-2 leading-snug">{prod.nombre}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-3xs text-[#557A46]/80 dark:text-[#88B04B]/80 font-medium">Menú 100% Natural</p>
                    <span className={`text-[10px] font-bold ${
                      prod.stock !== undefined && prod.stock <= 0 
                        ? 'text-red-500' 
                        : prod.stock !== undefined && prod.stock < 10 
                          ? 'text-amber-500 animate-pulse' 
                          : 'text-[#557A46] dark:text-[#88B04B]'
                    }`}>
                      Stock: {prod.stock !== undefined ? `${prod.stock} ${prod.categoria === 'snack' || prod.categoria === 'suplemento' ? 'U.' : 'Kg'}` : 'Suficiente'}
                    </span>
                  </div>
                  <p className="text-3xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {prod.descripcion}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-border/50 text-xs">
                  <div>
                    <span className="text-3xs text-muted-foreground block">Precio de Lista:</span>
                    <strong className="text-foreground">${prod.precio_unitario} {prod.categoria === 'snack' || prod.categoria === 'suplemento' ? 'U.' : 'Kg'}</strong>
                  </div>
                  <button
                    disabled={prod.stock !== undefined && prod.stock <= 0}
                    onClick={() => addToCart(prod, 1)}
                    className={`text-3xs font-bold px-2.5 py-1.5 rounded cursor-pointer transition-all ${
                      prod.stock !== undefined && prod.stock <= 0
                        ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                        : getQtyInCart(prod.id) > 0
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs animate-pulse-subtle'
                          : 'bg-[#557A46] hover:bg-[#405D33] text-white'
                    }`}
                  >
                    {(() => {
                      const qty = getQtyInCart(prod.id);
                      const unit = prod.categoria === 'snack' || prod.categoria === 'suplemento' ? 'U.' : 'Kg';
                      if (prod.stock !== undefined && prod.stock <= 0) return 'Sin Stock ❌';
                      return qty > 0 ? `+ Agregar 1 ${unit} (${qty} ${unit} seleccionados)` : `+ Agregar 1 ${unit}`;
                    })()}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'cart') {
    return (
      <div className="animate-fade-in" id="product-calculator-cart-only">
        {/* RESUMEN DEL CARRITO */}
        <div className="bg-card text-card-foreground p-6 rounded-xl border-2 border-[#557A46]/20 shadow-lg max-w-3xl mx-auto flex flex-col justify-between" id="shopping-cart-card">
          <div>
            <h3 className="text-lg font-serif font-black text-[#557A46] dark:text-[#88B04B] flex items-center gap-2 pb-3 border-b border-border/80 mb-4">
              <ShoppingCart className="w-5 h-5 text-[#557A46]" /> Detalle del Carrito de Compras
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground font-sans">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
                <p className="text-sm font-bold">Tu carrito está esperando alimentos de verdad 🐾</p>
                <p className="text-xs mt-1 text-muted-foreground/80 max-w-sm mx-auto">Sugerencia: Añade un plan nutricional mensual o viandas saludables del catálogo ubicado en la parte superior.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {cart.map((item, index) => {
                  const petCustom = pets.find((p) => p.id === item.personalizado_para_mascota_id);
                  const isUnit = item.producto.categoria === 'snack' || item.producto.categoria === 'suplemento';
                  return (
                    <div
                      key={`${item.producto.id}-${index}`}
                      className="p-3 bg-muted/30 border border-border rounded-lg text-xs flex justify-between gap-3 relative"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-foreground pr-4 leading-snug">{item.producto.nombre}</div>
                        
                        {petCustom && (
                          <div className="text-3xs text-[#557A46] dark:text-[#88B04B] font-semibold flex items-center gap-1">
                            <span>✨ Alimentando a:</span><strong>{petCustom.nombre} ({petCustom.tipo})</strong>
                          </div>
                        )}
                        
                        <div className="text-3xs text-muted-foreground font-mono">
                          Precio por {isUnit ? 'unidad' : 'Kg'}: ${item.producto.precio_unitario} ARS
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between min-w-[100px]">
                        <button
                          onClick={() => removeItem(index)}
                          className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors self-end mb-1"
                          title="Eliminar de la lista"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(index, isUnit ? -1 : -0.5)}
                            className="bg-background border border-border text-foreground hover:bg-muted font-bold rounded w-5 h-5 flex items-center justify-center text-xs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          
                          <span className="font-mono text-xs font-bold w-12 text-center text-foreground">
                            {item.cantidad} {isUnit ? 'U' : 'Kg'}
                          </span>

                          <button
                            onClick={() => updateQuantity(index, isUnit ? 1 : 0.5)}
                            className="bg-background border border-border text-foreground hover:bg-muted font-bold rounded w-5 h-5 flex items-center justify-center text-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="font-mono font-bold text-xs text-foreground mt-1">
                          ${Math.round(item.producto.precio_unitario * item.cantidad)} ARS
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-border/80">
            <h4 className="text-2xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1 mb-3">
              <Receipt className="w-3.5 h-3.5" /> Desglose de Presupuesto
            </h4>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal Viandas & Snacks:</span>
                <span className="font-mono text-foreground">${Math.round(subtotalProducts)} ARS</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Costo de Envío:</span>
                <span className="font-mono text-foreground">
                  {shippingCost > 0 ? `$${shippingCost} ARS` : 'Establecer dirección'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-sans font-bold pt-2 border-t border-border/60">
                <span className="text-[#557A46] dark:text-[#88B04B] font-bold">TOTAL A ABONAR:</span>
                <span className="font-mono text-foreground">${Math.round(grandTotal)} ARS</span>
              </div>
            </div>

            <button
              onClick={onCheckoutTriggered}
              disabled={cart.length === 0}
              className={`w-full mt-6 py-3 rounded-md text-sm font-sans font-bold shadow-sm transition-all focus:outline-none flex items-center justify-center gap-2 ${
                cart.length === 0
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-[#557A46] hover:bg-[#405D33] text-white cursor-pointer hover:shadow-md'
              }`}
              id="shopping-checkout-action-button"
            >
              <Eye className="w-4 h-4" /> Proceder al Resumen de Compra
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="product-calculator-section">
      
      {/* SECCIÓN IZQUIERDA: PLAN NUTRICIONAL & CATÁLOGO */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* CALCULADORA DE PLAN NUTRICIONAL INTELIGENTE */}
        <div className="bg-card text-card-foreground p-5 rounded-lg border border-border shadow-md" id="smart-diet-plan-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 px-2.5 bg-primary/10 text-primary rounded-full text-xs font-bold font-sans">1</div>
            <div>
              <h3 className="text-base font-serif font-semibold text-primary flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Plan Nutricional Mensual Personalizado
              </h3>
              <p className="text-2xs text-muted-foreground mt-0.5">
                Calcula la dieta exacta y presupuesto para las viandas mensuales de tu mascota al instante.
              </p>
            </div>
          </div>

          {pets.length === 0 ? (
            <div className="p-4 bg-muted/30 border border-dashed border-border rounded text-center text-xs text-muted-foreground">
              <Sparkles className="w-5 h-5 text-primary/40 mx-auto mb-1" />
              <span>Para cotizar dietas a medida, registra al menos una mascota arriba en la pestaña de mascotas.</span>
            </div>
          ) : (
            <div className="space-y-4 bg-muted/20 p-4 rounded-md border border-border/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-bold text-foreground uppercase tracking-wide mb-1">Mascota seleccionada</label>
                  <select
                    value={selectedPetId}
                    onChange={(e) => setSelectedPetId(e.target.value)}
                    className="w-full bg-background border border-border rounded p-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="">-- Elige qué mascota alimentar --</option>
                    {pets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.nombre} ({pet.tipo === 'perro' ? 'Perro' : 'Gato'} · {pet.peso} Kg)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-foreground uppercase tracking-wide mb-1">Menú / Sabor</label>
                  <select
                    value={selectedFoodId}
                    onChange={(e) => setSelectedFoodId(e.target.value)}
                    className="w-full bg-background border border-border rounded p-2 text-xs text-foreground focus:outline-none"
                  >
                    {CATALOGO_PRODUCTOS.filter(
                      f => selectedPet ? (selectedPet.tipo === f.tipo_mascota || f.tipo_mascota === 'ambos') : true
                    ).map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.nombre} (${prod.precio_unitario}/Kg)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedPet && (
                <div className="bg-background p-3 rounded border border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-fade-in">
                  <div>
                    <span className="text-muted-foreground text-3xs block uppercase">Porción Diaria:</span>
                    <strong className="text-foreground text-sm">
                      {calcularPorcionDiaria(selectedPet.peso, selectedPet.tipo, petActivity).recomenedadoGramos} gramos/día
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-3xs block uppercase">Consumo Mensual:</span>
                    <strong className="text-primary text-sm">
                      {calcularPorcionDiaria(selectedPet.peso, selectedPet.tipo, petActivity).mensualKg} Kg / Mes
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-3xs block uppercase">Presupuesto Mensual:</span>
                    <strong className="text-foreground text-sm">
                      ${Math.round(calcularPorcionDiaria(selectedPet.peso, selectedPet.tipo, petActivity).mensualKg * selectedFood.precio_unitario)} ARS
                    </strong>
                  </div>

                  <div className="sm:col-span-3 pt-2 border-t border-border/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-2xs font-medium">
                      <input
                        type="checkbox"
                        checked={petActivity}
                        onChange={(e) => setPetActivity(e.target.checked)}
                        className="accent-primary"
                      />
                      <Dumbbell className="w-3.5 h-3.5 text-primary" /> ¿Es una mascota muy activa o realiza ejercicio de trabajo diario?
                    </label>

                    <button
                      type="button"
                      onClick={handleApplyDiet}
                      className="bg-primary/10 hover:bg-primary sm:self-center w-full sm:w-auto text-primary hover:text-primary-foreground text-2xs font-bold py-1.5 px-3 rounded transition-all cursor-pointer"
                    >
                      Añadir Plan Mensivo al Carrito
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CATÁLOGO DE PRODUCTOS RECOMIENDA */}
        <div className="bg-card text-card-foreground p-5 rounded-lg border border-border shadow-md" id="product-catalog-card-both">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1 px-2.5 bg-primary/10 text-primary rounded-full text-xs font-bold font-sans">2</div>
            <div>
              <h3 className="text-base font-serif font-semibold text-primary">Nuestro Catálogo Saludable</h3>
              <p className="text-2xs text-muted-foreground">Agrégalo directamente en Kg o packs por unidad.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {useCatalog.map((prod) => (
              <div
                key={prod.id}
                className="p-3.5 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 flex flex-col justify-between gap-3 transition-all"
                id={`product-item-both-${prod.id}`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-3xl bg-background rounded-md p-1.5 border border-border shadow-2xs leading-none">
                      {prod.imagen}
                    </span>
                    <span className="text-3xs uppercase tracking-wider font-semibold bg-primary/15 text-primary border border-primary/25 rounded px-2 py-0.5 leading-none">
                      {prod.categoria}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground mt-2 leading-snug">{prod.nombre}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-3xs text-[#557A46]/80 dark:text-[#88B04B]/80 font-medium">Menú 100% Natural</p>
                    <span className={`text-[10px] font-bold ${
                      prod.stock !== undefined && prod.stock <= 0 
                        ? 'text-red-500' 
                        : prod.stock !== undefined && prod.stock < 10 
                          ? 'text-amber-500 animate-pulse' 
                          : 'text-primary'
                    }`}>
                      Stock: {prod.stock !== undefined ? `${prod.stock} ${prod.categoria === 'snack' || prod.categoria === 'suplemento' ? 'U.' : 'Kg'}` : 'Suficiente'}
                    </span>
                  </div>
                  <p className="text-3xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {prod.descripcion}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-border/50 text-xs">
                  <div>
                    <span className="text-3xs text-muted-foreground block">Precio de Lista:</span>
                    <strong className="text-foreground">${prod.precio_unitario} {prod.categoria === 'snack' || prod.categoria === 'suplemento' ? 'U.' : 'Kg'}</strong>
                  </div>
                  <button
                    disabled={prod.stock !== undefined && prod.stock <= 0}
                    onClick={() => addToCart(prod, 1)}
                    className={`text-3xs font-bold px-2.5 py-1.5 rounded cursor-pointer transition-all ${
                      prod.stock !== undefined && prod.stock <= 0
                        ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                        : getQtyInCart(prod.id) > 0
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs animate-pulse-subtle'
                          : 'bg-primary hover:opacity-90 text-primary-foreground text-3xs font-bold'
                    }`}
                  >
                    {(() => {
                      const qty = getQtyInCart(prod.id);
                      const unit = prod.categoria === 'snack' || prod.categoria === 'suplemento' ? 'U.' : 'Kg';
                      if (prod.stock !== undefined && prod.stock <= 0) return 'Sin Stock ❌';
                      return qty > 0 ? `+ Agregar 1 ${unit} (${qty} ${unit} seleccionados)` : `+ Agregar 1 ${unit}`;
                    })()}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECCIÓN DERECHA: CARRITO & TOTALES */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* RESUMEN DEL CARRITO */}
        <div className="bg-card text-card-foreground p-5 rounded-lg border border-border shadow-md sticky top-4 flex flex-col justify-between" id="shopping-cart-card">
          <div>
            <h3 className="text-base font-serif font-semibold text-primary flex items-center gap-1.5 pb-3 border-b border-border/80 mb-4">
              <ShoppingCart className="w-5 h-5 text-primary" /> Carrito de Sana Mascota
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground font-sans">
                <ShoppingCart className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold">El carrito está vacío</p>
                <p className="text-3xs mt-1">Sugerencia: Añade un plan nutricional mensual o viandas saludables del catálogo.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {cart.map((item, index) => {
                  const petCustom = pets.find((p) => p.id === item.personalizado_para_mascota_id);
                  const isUnit = item.producto.categoria === 'snack' || item.producto.categoria === 'suplemento';
                  return (
                    <div
                      key={`${item.producto.id}-${index}`}
                      className="p-3 bg-muted/30 border border-border rounded-lg text-xs flex justify-between gap-3 relative"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-foreground pr-4 leading-snug">{item.producto.nombre}</div>
                        
                        {petCustom && (
                          <div className="text-3xs text-primary font-semibold flex items-center gap-1">
                            <span>✨ Alimentando a:</span><strong>{petCustom.nombre} ({petCustom.tipo})</strong>
                          </div>
                        )}
                        
                        <div className="text-3xs text-muted-foreground">
                          Precio por {isUnit ? 'unidad' : 'Kg'}: ${item.producto.precio_unitario} ARS
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between min-w-[100px]">
                        <button
                          onClick={() => removeItem(index)}
                          className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors self-end mb-1"
                          title="Eliminar de la lista"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-2">
                          {/* Decrement qty */}
                          <button
                            onClick={() => updateQuantity(index, isUnit ? -1 : -0.5)}
                            className="bg-background border border-border text-foreground hover:bg-muted font-bold rounded w-5 h-5 flex items-center justify-center text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          
                          <span className="font-mono text-xs font-bold w-12 text-center text-foreground">
                            {item.cantidad} {isUnit ? 'U' : 'Kg'}
                          </span>

                          {/* Increment qty */}
                          <button
                            onClick={() => updateQuantity(index, isUnit ? 1 : 0.5)}
                            className="bg-background border border-border text-foreground hover:bg-muted font-bold rounded w-5 h-5 flex items-center justify-center text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="font-mono font-bold text-xs text-foreground mt-1">
                          ${Math.round(item.producto.precio_unitario * item.cantidad)} ARS
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-border/80">
            <h4 className="text-2xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1 mb-3">
              <Receipt className="w-3.5 h-3.5" /> Desglose de Presupuesto
            </h4>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal Viandas & Snacks:</span>
                <span className="font-mono text-foreground">${Math.round(subtotalProducts)} ARS</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Costo de Envío:</span>
                <span className="font-mono text-foreground">
                  {shippingCost > 0 ? `$${shippingCost} ARS` : 'Establecer dirección'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-sans font-bold pt-2 border-t border-border/60">
                <span className="text-primary">TOTAL A ABONAR:</span>
                <span className="font-mono text-foreground">${Math.round(grandTotal)} ARS</span>
              </div>
            </div>

            <button
              onClick={onCheckoutTriggered}
              disabled={cart.length === 0}
              className={`w-full mt-6 py-3 rounded-md text-sm font-sans font-bold shadow-sm transition-all focus:outline-none flex items-center justify-center gap-2 ${
                cart.length === 0
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:opacity-95 cursor-pointer hover:shadow-md'
              }`}
              id="shopping-checkout-action-button"
            >
              <Eye className="w-4 h-4" /> Proceder al Resumen de Compra
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
