import React, { useState } from 'react';
import { Mascota } from '../types';
import { Plus, Trash2, PawPrint, Scale, AlertCircle } from 'lucide-react';
import { calcularPorcionDiaria } from '../data/products';

interface PetManagerProps {
  pets: Mascota[];
  onAddPet: (newPet: Omit<Mascota, 'id' | 'usuario_id' | 'created_at'>) => void;
  onDeletePet: (id: string) => void;
}

export default function PetManager({ pets, onAddPet, onDeletePet }: PetManagerProps) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'perro' | 'gato'>('perro');
  const [raza, setRaza] = useState('');
  const [peso, setPeso] = useState<number>(10);
  const [alergias, setAlergias] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !raza || peso <= 0) return;
    onAddPet({
      nombre,
      tipo,
      raza,
      peso,
      alergias: alergias || 'Ninguna'
    });
    setNombre('');
    setRaza('');
    setPeso(10);
    setAlergias('');
    setIsAdding(false);
  };

  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-md" id="pet-manager-component">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-serif font-semibold text-primary flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-primary" /> Tus Mascotas Registradas
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vinculadas a tu usuario en la tabla <code className="font-mono text-xs bg-muted px-1 rounded text-primary">mascotas</code>.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-md font-sans text-sm font-medium transition-all cursor-pointer"
            id="register-pet-trigger"
          >
            <Plus className="w-4 h-4" /> Registrar Mascota
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-muted/40 p-4 rounded-lg border border-border mb-6 animate-fade-in" id="add-pet-form">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Nueva Mascota</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Nombre de la Mascota *</label>
              <input
                type="text"
                required
                placeholder="Ej. Rocco, Luna"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Tipo de Mascota *</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="tipo_mascota"
                    checked={tipo === 'perro'}
                    onChange={() => setTipo('perro')}
                    className="accent-primary"
                  />
                  🐶 Perro
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="tipo_mascota"
                    checked={tipo === 'gato'}
                    onChange={() => setTipo('gato')}
                    className="accent-primary"
                  />
                  🐱 Gato
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Raza *</label>
              <input
                type="text"
                required
                placeholder="Ej. Golden Retriever, Mestizo, Siamés"
                value={raza}
                onChange={(e) => setRaza(e.target.value)}
                className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-muted-foreground" /> Peso (kg) *
              </label>
              <input
                type="number"
                required
                step="0.1"
                min="0.1"
                value={peso}
                onChange={(e) => setPeso(parseFloat(e.target.value) || 0)}
                className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Alergias Alimentarias o Requerimientos Especiales (Si tiene)
              </label>
              <input
                type="text"
                placeholder="Ej. Alergia al pollo, intolerancia a cereales, sobrepeso"
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:opacity-95 px-4 py-1.5 rounded text-xs font-medium transition-all"
            >
              Guardar Mascota
            </button>
          </div>
        </form>
      )}

      {pets.length === 0 ? (
        <div className="text-center py-8 bg-muted/20 border border-dashed border-border rounded-lg">
          <PawPrint className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No tienes mascotas registradas.</p>
          <p className="text-xs text-muted-foreground mt-1">Registra tu mascota para sugerirte porciones mágicas de comida natural BARF o cocida.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pets.map((pet) => {
            const diana = calcularPorcionDiaria(pet.peso, pet.tipo);
            return (
              <div
                key={pet.id}
                className="flex flex-col justify-between p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/40 transition-all shadow-sm relative group"
                id={`pet-card-${pet.id}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{pet.tipo === 'perro' ? '🐶' : '🐱'}</span>
                      <div>
                        <h4 className="font-serif font-bold text-foreground text-sm uppercase tracking-wide">{pet.nombre}</h4>
                        <p className="text-xs text-muted-foreground">{pet.raza}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeletePet(pet.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors"
                      title="Eliminar mascota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/60 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-2xs">Peso registrado:</span>
                      <strong className="text-foreground">{pet.peso} Kg</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-2xs">Alergias:</span>
                      <strong className={`block truncate ${pet.alergias !== 'Ninguna' ? 'text-amber-600 font-semibold' : 'text-foreground'}`} title={pet.alergias}>
                        {pet.alergias}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-primary/5 rounded border border-primary/10 text-2xs">
                  <span className="font-semibold text-primary block">Cálculo Nutricional Sugerido:</span>
                  <div className="flex justify-between text-muted-foreground mt-0.5">
                    <span>Porción diaria: <strong className="text-foreground font-medium">{diana.recomenedadoGramos}g</strong></span>
                    <span>Mensual aprox: <strong className="text-foreground font-semibold">{diana.mensualKg} Kg</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
