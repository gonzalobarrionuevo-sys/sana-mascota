import React, { useState, useEffect } from 'react';
import { Usuario } from '../types';
import { Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck, PawPrint, LogIn, UserPlus } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: Usuario) => void;
}

interface UsuarioRegistrado extends Usuario {
  contrasenia: string;
}

const DEFAULT_USERS: UsuarioRegistrado[] = [
  {
    id: '04b0870f-dfd9-4b6b-80df-89241bda2720',
    nombre: 'Gonzalo Barrionuevo',
    email: 'gonzalobarrionuevo@gmail.com',
    contrasenia: 'sanamascota123',
    rol: 'admin',
    telefono: '+5493834000000',
    created_at: '2026-06-06T15:12:33Z'
  },
  {
    id: 'adm-walter-suarez',
    nombre: 'Daniel Walter Suárez',
    email: 'suarezwalterdaniel@hotmail.com',
    contrasenia: 'sanamascota123',
    rol: 'admin',
    telefono: '+5493834111222',
    created_at: '2026-06-06T15:12:33Z'
  }
];

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState<boolean>(true); // Default to register for first-time use
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('sanamascota123');
  const [nombre, setNombre] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Sincronizar usuarios locales
  const getRegisteredUsers = (): UsuarioRegistrado[] => {
    const saved = localStorage.getItem('sanamascota_users_auth');
    let users: UsuarioRegistrado[] = [];
    if (saved) {
      try {
        users = JSON.parse(saved);
      } catch (e) {
        users = [...DEFAULT_USERS];
      }
    } else {
      users = [...DEFAULT_USERS];
    }

    // Asegurar que ambos administradores existan con el rol admin y la clave correcta
    DEFAULT_USERS.forEach(admin => {
      const existingIdx = users.findIndex(u => u.email.toLowerCase() === admin.email.toLowerCase());
      if (existingIdx !== -1) {
        users[existingIdx].rol = 'admin';
        users[existingIdx].contrasenia = 'sanamascota123';
      } else {
        users.push(admin);
      }
    });

    localStorage.setItem('sanamascota_users_auth', JSON.stringify(users));
    return users;
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !password) {
      setErrorMessage('Por favor completa los campos de correo y contraseña.');
      return;
    }

    const currentUsers = getRegisteredUsers();

    if (isRegister) {
      if (!nombre || !telefono) {
        setErrorMessage('Por favor completa todos los campos de registro (Nombre y Teléfono).');
        return;
      }

      // Check if user already exists
      const exists = currentUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        setErrorMessage(`El correo ${email} ya está registrado. Por favor inicia sesión.`);
        return;
      }

      // Create new user
      const nuevoUsuario: UsuarioRegistrado = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        contrasenia: password,
        rol: (email.trim().toLowerCase() === 'gonzalobarrionuevo@gmail.com' || email.trim().toLowerCase() === 'suarezwalterdaniel@hotmail.com') ? 'admin' : 'cliente',
        telefono: telefono.trim(),
        created_at: new Date().toISOString()
      };

      const updatedUsers = [...currentUsers, nuevoUsuario];
      localStorage.setItem('sanamascota_users_auth', JSON.stringify(updatedUsers));
      
      // Auto login
      setSuccessMessage('¡Usuario registrado con éxito! Iniciando sesión...');
      setTimeout(() => {
        onLoginSuccess({
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          rol: nuevoUsuario.rol,
          telefono: nuevoUsuario.telefono,
          created_at: nuevoUsuario.created_at
        });
      }, 1000);

    } else {
      // Login
      const userMatch = currentUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.contrasenia === password
      );

      if (!userMatch) {
        setErrorMessage('Correo o contraseña incorrectos. Si es tu primera vez, haz click en registrarte.');
        return;
      }

      if (userMatch.bloqueado) {
        setErrorMessage('Tu cuenta ha sido bloqueada temporalmente por el Administrador de Sana Mascota. Contactanos por favor.');
        return;
      }

      setSuccessMessage(`¡Bienvenido/a de nuevo, ${userMatch.nombre}!`);
      setTimeout(() => {
        onLoginSuccess({
          id: userMatch.id,
          nombre: userMatch.nombre,
          email: userMatch.email,
          rol: userMatch.rol,
          telefono: userMatch.telefono,
          created_at: userMatch.created_at
        });
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12 transition-colors dark:bg-zinc-950" id="auth-screen-overlay">
      <div className="bg-card text-card-foreground p-8 rounded-2xl border-2 border-[#557A46]/20 shadow-2xl max-w-md w-full space-y-6" id="auth-card">
        
        {/* ENCABEZADO */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#557A46]/10 flex items-center justify-center text-[#557A46]" id="auth-logo-container">
            <PawPrint className="w-9 h-9 fill-[#557A46]/20" />
          </div>
          <h2 className="text-2xl font-serif font-black text-foreground uppercase tracking-tight">Sana Mascota</h2>
          <p className="text-xs text-muted-foreground">
            Alimentación Natural & Viandas Crudas BARF
          </p>
          <div className="inline-flex items-center gap-1 bg-[#557A46]/10 text-[#557A46] dark:text-[#88B04B] border border-[#557A46]/20 rounded-md px-2 py-0.5 text-3xs font-mono font-semibold uppercase mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Debe colocar su mail para ingresar
          </div>
        </div>

        {/* FEEDBACK STATUS */}
        {errorMessage && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-xs text-center font-medium animate-fade-in">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded-lg p-3 text-xs text-center font-medium animate-fade-in">
            {successMessage}
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleAuth} className="space-y-4" id="auth-form">
          {isRegister && (
            <>
              {/* NOMBRE COMPLETO */}
              <div className="space-y-1">
                <label className="block text-3xs font-extrabold text-foreground uppercase tracking-wider">Nombre Completo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Gonzalo Barrionuevo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-background border border-border text-foreground hover:border-muted-foreground/40 focus:border-[#557A46] focus:outline-none rounded-lg text-xs transition-all"
                  />
                </div>
              </div>

              {/* TELEFONO */}
              <div className="space-y-1">
                <label className="block text-3xs font-extrabold text-foreground uppercase tracking-wider">Teléfono de WhatsApp</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="+5493834000000"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-background border border-border text-foreground hover:border-muted-foreground/40 focus:border-[#557A46] focus:outline-none rounded-lg text-xs transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* EMAIL */}
          <div className="space-y-1">
            <label className="block text-3xs font-extrabold text-foreground uppercase tracking-wider">Correo Electrónico</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background border border-border text-foreground hover:border-muted-foreground/40 focus:border-[#557A46] focus:outline-none rounded-lg text-xs transition-all"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="space-y-1">
            <label className="block text-3xs font-extrabold text-foreground uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="• • • • • •"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-background border border-border text-foreground hover:border-muted-foreground/40 focus:border-[#557A46] focus:outline-none rounded-lg text-xs transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-4xs text-muted-foreground font-sans mt-1 block">Por defecto es "sanamascota123", no necesitas cambiarla a menos que lo desees.</span>
          </div>

          {/* ACCION BOTON */}
          <button
            type="submit"
            className="w-full bg-[#557A46] hover:bg-[#405D33] text-white font-sans font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md cursor-pointer mt-2"
          >
            {isRegister ? (
              <>
                <UserPlus className="w-4 h-4" /> Generar Cuenta e Ingresar
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Iniciar Sesión con Mi Cuenta
              </>
            )}
          </button>
        </form>

        {/* SWAP ENTRADA/REGISTRO */}
        <div className="pt-3 border-t border-border/30 text-center flex flex-row justify-between items-center gap-2 text-xs">
          <p className="text-muted-foreground text-left leading-tight">
            {isRegister ? "¿Ya tienes una cuenta?" : "¿Primera vez ingresando?"}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="text-[#557A46] dark:text-[#88B04B] font-bold hover:underline cursor-pointer"
            >
              {isRegister ? "Inicia Sesión" : "Regístrate aquí"}
            </button>
          </p>
          <button
            onClick={() => {
              setIsRegister(false);
              setEmail('');
              setPassword('sanamascota123');
              setErrorMessage('');
              setSuccessMessage('Modo administrador activado. Ingrese con correo de adm y clave "sanamascota123".');
            }}
            className="text-muted-foreground/60 hover:text-[#557A46] dark:hover:text-[#88B04B] hover:bg-muted font-mono text-[10px] border border-border/50 rounded px-2 py-1 transition-all cursor-pointer font-black"
            title="Ingreso de administradores (adm)"
            type="button"
          >
            adm
          </button>
        </div>

      </div>
    </div>
  );
}
