import React, { useState, useEffect } from 'react';
import { calculateHaversineDistance, SHOP_LATITUDE, SHOP_LONGITUDE, SHIPPING_COST_PER_KM } from '../utils/haversine';
import { BARRIOS_PREESTABLECIDOS } from '../data/products';
import { MapPin, Navigation, Map, ShieldAlert, CheckCircle, Info, Landmark } from 'lucide-react';

interface ShippingCalculatorProps {
  onShippingSelected: (costo: number, lat: number | null, lng: number | null, direccion: string, metodo: 'gps' | 'manual') => void;
  selectedCost: number;
  selectedMethod: 'gps' | 'manual';
  selectedAddress: string;
}

export default function ShippingCalculator({
  onShippingSelected,
  selectedCost,
  selectedMethod,
  selectedAddress
}: ShippingCalculatorProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  
  const [direccionManual, setDireccionManual] = useState(selectedAddress);
  const [barrioSeleccionado, setBarrioSeleccionado] = useState('');
  const [barrioDistancia, setBarrioDistancia] = useState<number | null>(null);

  // Initialize with manual Valle Viejo default if nothing selected yet
  useEffect(() => {
    if (selectedCost === 0 && selectedAddress === '') {
      // Set default fallback to El Bañado (Valle Viejo) local delivery
      const elBanaDo = BARRIOS_PREESTABLECIDOS[1]; // El Bañado
      onShippingSelected(elBanaDo.costo, null, null, elBanaDo.nombre, 'manual');
      setDireccionManual(elBanaDo.nombre);
      setBarrioSeleccionado(elBanaDo.nombre);
      setBarrioDistancia(elBanaDo.distanciaEstimada);
    }
  }, []);

  const handleGetLocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('La geolocalización no está soportada por tu navegador.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        // Calculate distance mathematically using Haversine formula
        const calculatedDistance = calculateHaversineDistance(
          SHOP_LATITUDE,
          SHOP_LONGITUDE,
          latitude,
          longitude
        );
        
        setDistance(calculatedDistance);

        // Cost = Distance * $500 ARS, with a minimum cost of $300 to protect margins
        const rawCost = Math.round(calculatedDistance * SHIPPING_COST_PER_KM);
        const calculatedCost = rawCost < 300 ? 300 : rawCost;

        const addressString = `Coordenadas GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
        setDireccionManual(addressString);
        
        // Callback to parent shopping cart
        onShippingSelected(calculatedCost, latitude, longitude, addressString, 'gps');
        setGpsLoading(false);
      },
      (error) => {
        console.error('Geo error', error);
        let errorMsg = 'No pudimos obtener tu ubicación GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Permiso denegado. Comparte tu GPS para calcular en tiempo real, o selecciona tu barrio de forma manual abajo.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Ubicación no disponible en este momento.';
        }
        setGpsError(errorMsg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleBarrioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const barrioName = e.target.value;
    setBarrioSeleccionado(barrioName);
    
    const barrioObject = BARRIOS_PREESTABLECIDOS.find(b => b.nombre === barrioName);
    if (barrioObject) {
      setBarrioDistancia(barrioObject.distanciaEstimada);
      setDireccionManual(barrioObject.nombre);
      onShippingSelected(barrioObject.costo, null, null, barrioObject.nombre, 'manual');
    }
  };

  const handleManualTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const textAddress = e.target.value;
    setDireccionManual(textAddress);
    
    // If text address doesn't match an exact preset, calculate a basic flat rate
    // unless they already have a GPS coordinate set.
    if (selectedMethod === 'manual') {
      const matchedBarrio = BARRIOS_PREESTABLECIDOS.find(b => 
        textAddress.toLowerCase().includes(b.nombre.replaceAll('(', '').replaceAll(')', '').toLowerCase())
      );
      
      const flatCost = matchedBarrio ? matchedBarrio.costo : 1500; // default estimated flat shipping
      const flatDist = matchedBarrio ? matchedBarrio.distanciaEstimada : 3.0;
      setBarrioDistancia(flatDist);
      onShippingSelected(flatCost, null, null, textAddress, 'manual');
    } else {
      // Just updating the text address for the GPS delivery
      if (coords) {
        onShippingSelected(selectedCost, coords.lat, coords.lng, textAddress, 'gps');
      }
    }
  };

  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-md" id="shipping-calculator-component">
      <h2 className="text-xl font-serif font-semibold text-primary flex items-center gap-2 mb-1">
        <MapPin className="w-5 h-5 text-primary" /> Logística & Calculadora de Envío
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Establece tu envío hacia tu hogar en Catamarca. Nuestro local físico se encuentra en <span className="text-foreground font-semibold">El Bañado, Valle Viejo (-28.435, -65.731)</span>.
      </p>

      {/* Selector de Método */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* GPS Button Option */}
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={gpsLoading}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 text-center transition-all cursor-pointer ${
            selectedMethod === 'gps'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-muted/20 hover:border-border-hover text-muted-foreground'
          }`}
          id="gps-location-selector"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-2 shadow-sm">
            <Navigation className={`w-5 h-5 ${gpsLoading ? 'animate-spin' : ''}`} />
          </div>
          <span className="font-sans font-bold text-sm block">Ubicación Precisa GPS</span>
          <span className="text-2xs text-muted-foreground mt-1 max-w-[200px]">
            Usa el GPS del navegador con la fórmula matemática de Haversine ($500/Km).
          </span>
        </button>

        {/* Manual Input Fallback Option */}
        <button
          type="button"
          onClick={() => {
            // Restore manual selection default
            const elBanaDo = BARRIOS_PREESTABLECIDOS[1];
            setBarrioSeleccionado(elBanaDo.nombre);
            setBarrioDistancia(elBanaDo.distanciaEstimada);
            setDireccionManual(elBanaDo.nombre);
            onShippingSelected(elBanaDo.costo, null, null, elBanaDo.nombre, 'manual');
          }}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 text-center transition-all cursor-pointer ${
            selectedMethod === 'manual'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-muted/20 hover:border-border-hover text-muted-foreground'
          }`}
          id="manual-location-selector"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/20 text-secondary-foreground mb-2 shadow-sm">
            <Map className="w-5 h-5" />
          </div>
          <span className="font-sans font-bold text-sm block">Barrio / Localidad Manual</span>
          <span className="text-2xs text-muted-foreground mt-1 max-w-[200px]">
            Selecciona tu barrio de Catamarca con tarifas fijas de costo cero de API.
          </span>
        </button>
      </div>

      {gpsError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 rounded-md text-xs flex gap-2 items-start mb-4" id="gps-error-banner">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Aviso Logístico: </span>
            {gpsError}
          </div>
        </div>
      )}

      {/* MUESTRA DETALLES SEGÚN EL MÉTODO SELECCIONADO */}
      <div className="bg-muted/40 p-4 rounded-lg border border-border">
        {selectedMethod === 'gps' && (
          <div className="space-y-4 animate-fade-in" id="gps-results-details">
            <div className="flex items-center gap-2 mb-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-800 dark:text-emerald-400 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Coordenadas GPS obtenidas con éxito: <strong>Calculador Haversine Activo</strong></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-background p-3 rounded border border-border">
                <span className="text-muted-foreground block text-2xs uppercase">Sana Mascota El Bañado</span>
                <span className="text-foreground">Lat: {SHOP_LATITUDE}</span>
                <span className="text-foreground block">Lng: {SHOP_LONGITUDE}</span>
              </div>
              <div className="bg-background p-3 rounded border border-border">
                <span className="text-muted-foreground block text-2xs uppercase">Tu Ubicación (Cliente)</span>
                {coords ? (
                  <>
                    <span className="text-foreground">Lat: {coords.lat.toFixed(5)}</span>
                    <span className="text-foreground block">Lng: {coords.lng.toFixed(5)}</span>
                  </>
                ) : (
                  <span className="text-foreground">Calculando coordenadas GPS...</span>
                )}
              </div>
            </div>

            {distance !== null && (
              <div className="flex flex-col gap-2 p-3 bg-primary/5 rounded border border-primary/20">
                <div className="flex justify-between items-center text-sm font-sans">
                  <span>Distancia lineal (Fórmula Haversine):</span>
                  <strong className="text-primary text-base font-serif">{distance} Km</strong>
                </div>
                <div className="flex justify-between items-center text-sm font-sans pt-1 border-t border-border/80">
                  <span>Costo ($500 por Km):</span>
                  <strong className="text-foreground text-base">${selectedCost} ARS</strong>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Dirección exacta de entrega (ej. Calle, Casa o departamento) *</label>
              <input
                type="text"
                required
                placeholder="Ej. Barrio 40 Viv. Casa 12, Planta Baja"
                value={direccionManual.startsWith('Coordenadas') ? '' : direccionManual}
                onChange={handleManualTextChange}
                className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:outline-none"
              />
              <span className="text-3xs text-muted-foreground mt-0.5 block">Súmale referencias físicas para acelerar la entrega de las viandas.</span>
            </div>
          </div>
        )}

        {selectedMethod === 'manual' && (
          <div className="space-y-4 animate-fade-in" id="manual-results-details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-primary" /> Seleccionar Barrio / Zona
                </label>
                <select
                  value={barrioSeleccionado}
                  onChange={handleBarrioChange}
                  className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="" disabled>-- Elige tu barrio --</option>
                  {BARRIOS_PREESTABLECIDOS.map((barrio) => (
                    <option key={barrio.nombre} value={barrio.nombre}>
                      {barrio.nombre} (${barrio.costo} ARS)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="bg-background p-3 rounded border border-border flex flex-col justify-between h-full font-sans text-xs">
                  <div>
                    <span className="text-muted-foreground block text-2xs uppercase">Costo Estimado de Envío</span>
                    <strong className="text-primary text-base">${selectedCost} ARS</strong>
                  </div>
                  {barrioDistancia !== null && (
                    <span className="text-3xs text-muted-foreground mt-1">Distancia estimada: ~ {barrioDistancia} Km</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Completa tu Calle, Barrio exacto y Casa *</label>
              <input
                type="text"
                required
                placeholder="Ej. Calle San Martín 150 - San Isidro"
                value={direccionManual}
                onChange={handleManualTextChange}
                className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-muted/20 border border-border rounded-md text-3xs text-muted-foreground flex gap-2 items-start leading-normal">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p>
          <strong>Información de Envío:</strong> Para envíos de más de 12 Km fuera de Valle Viejo y Catamarca Capital, por favor contáctanos directo a nuestro botón de soporte por WhatsApp para acordar un transportista refrigerado de viandas naturales.
        </p>
      </div>
    </div>
  );
}
