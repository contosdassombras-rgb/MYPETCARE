import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { 
  Users, UserCheck, UserMinus, Shield, Search, 
  CheckCircle, XCircle, ChevronRight, Loader2, LogOut,
  LayoutDashboard, Key, Mail, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

// Componente de Layout Exclusivo para Admin
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut } = useUser();
  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#1C1E21] font-sans selection:bg-primary selection:text-white">
      {/* Sidebar Admin Simples */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-right border-surface-container-high z-50 hidden lg:flex flex-col shadow-sm">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-lg tracking-tighter leading-none">ADMIN</p>
              <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">MyPetCare</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <div className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-30">Menu Principal</div>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-md shadow-primary/10 transition-all">
            <Users className="w-5 h-5" />
            Usuários
          </button>
          <button onClick={() => window.location.href = '/'} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-on-surface-variant hover:bg-surface-container-low font-bold text-sm transition-all text-left">
            <LayoutDashboard className="w-5 h-5" />
            Painel Tutor
          </button>
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-error hover:bg-error/5 font-bold text-sm transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-10 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const Admin: React.FC = () => {
  const { user, session, isAdmin, loading } = useUser();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
    }
  }, [isAdmin]);

  const fetchProfiles = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setFetching(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      fetchProfiles();
    } catch (err) {
      alert('Erro ao atualizar status.');
    }
  };

  // 1. TELA DE CARREGAMENTO
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-30" />
        <p className="text-sm font-black text-on-surface-variant opacity-40 uppercase tracking-[0.2em]">Verificando permissões...</p>
      </div>
    );
  }

  // 2. TELA DE ACESSO NEGADO
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6 text-center">
        <div className="w-24 h-24 bg-error/10 rounded-[2.5rem] flex items-center justify-center text-error mb-8 shadow-inner">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-3 text-[#1E293B]">Acesso Restrito</h1>
        <p className="text-[#64748B] max-w-md mx-auto mb-10 font-medium leading-relaxed">
          Esta área é reservada para administradores do MyPetCare. Seu perfil atual não possui autorização.
        </p>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 mb-10 w-full max-w-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] mb-6 border-b border-slate-50 pb-4">Diagnóstico de Acesso</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-slate-400">Usuário:</span>
              <span className="text-slate-700">{session?.user.email}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-slate-400">Cargo:</span>
              <Badge variant="error" className="uppercase px-3 py-1 rounded-lg text-[10px]">{user?.role || 'user'}</Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => window.location.href = '/'} className="px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-slate-900 text-white hover:bg-slate-800 transition-all">
            Ir para Painel Tutor
          </Button>
          <Button onClick={signOut} variant="ghost" className="px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500">
            Sair da Conta
          </Button>
        </div>
      </div>
    );
  }

  // 3. PAINEL ADMINISTRATIVO REAL
  const filtered = profiles.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <header className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-2">Administração</h1>
            <p className="text-slate-500 font-medium">Gestão de usuários e parâmetros do sistema</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Buscar usuários..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-14 pr-6 py-4 bg-white rounded-3xl w-full lg:w-80 outline-none shadow-sm focus:ring-4 focus:ring-primary/10 border border-slate-100 font-bold transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="p-8 border-none shadow-sm transition-transform hover:scale-[1.02]">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total de Usuários</p>
          <p className="text-4xl font-black text-slate-900">{profiles.length}</p>
        </Card>
        <Card className="p-8 border-none shadow-sm transition-transform hover:scale-[1.02]">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Usuários Ativos</p>
          <p className="text-4xl font-black text-success">{profiles.filter(p => p.active !== false).length}</p>
        </Card>
        <Card className="p-8 border-none shadow-sm transition-transform hover:scale-[1.02]">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Aguardando Aprovação</p>
          <p className="text-4xl font-black text-warning">0</p>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-md overflow-hidden bg-white">
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuário</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fetching ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4 opacity-20" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando lista...</p>
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        <img 
                          src={p.photo_url || `https://ui-avatars.com/api/?name=${p.name || 'User'}&background=random`} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate">{p.name || 'Sem Nome'}</p>
                        <p className="text-xs text-slate-400 font-medium truncate">{p.email || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant={p.role === 'admin' ? 'success' : 'surface'} className="uppercase px-3 font-black text-[9px]">
                      {p.role || 'user'}
                    </Badge>
                  </td>
                  <td className="px-8 py-6">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-tight",
                      p.active !== false ? "bg-success/10 text-success" : "bg-error/10 text-error"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", p.active !== false ? "bg-success" : "bg-error")} />
                      {p.active !== false ? 'Ativo' : 'Bloqueado'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Button 
                      onClick={() => toggleUserStatus(p.id, p.active !== false)}
                      variant="ghost" 
                      className={cn(
                        "font-black text-[9px] uppercase tracking-widest px-4 py-2 hover:bg-slate-100 rounded-xl transition-all",
                        p.active !== false ? "text-error" : "text-success"
                      )}
                    >
                      {p.active !== false ? 'Bloquear' : 'Ativar'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
};

export default Admin;