import { Link } from '@tanstack/react-router';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Trophy, Shield, Home } from 'lucide-react';

export function Navbar() {
  const { session, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-white">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">11-0</span>
          </Link>

          {session && (
            <div className="hidden items-center gap-6 md:flex">
              <Link
                to="/"
                className="flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white [&.active]:text-emerald-400"
                activeProps={{ className: 'active' }}
                activeOptions={{ exact: true }}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/solo-mode"
                className="flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white [&.active]:text-emerald-400"
                activeProps={{ className: 'active' }}
              >
                <Trophy className="h-4 w-4" />
                Modo Solo
              </Link>
              <Link
                to="/" // placeholder for pvp
                className="flex items-center gap-2 text-sm font-medium text-zinc-400 opacity-50 cursor-not-allowed"
              >
                <Shield className="h-4 w-4" />
                PvP (Em breve)
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-zinc-300">
                {session.user.email?.split('@')[0]}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
