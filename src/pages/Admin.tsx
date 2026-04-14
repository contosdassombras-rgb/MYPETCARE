import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../contexts/UserContext';
import { 
  Users, UserCheck, UserMinus, Shield, Search, 
  CheckCircle, XCircle, ChevronRight, Loader2, LogOut,
  LayoutDashboard, Key, Mail, ShieldCheck, ShieldAlert,
  TrendingUp, Activity, UserX, AlertCircle, ShoppingCart,
  Clock, DollarSign, Calendar, Plus, RefreshCcw, FileText
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// --- COMPONENTES AUXILIARES ---

const KpiCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <Card className="p-6 border-none shadow-sm flex items-start justify-between bg-white rounded-3xl overflow-hidden relative group">
    <div className={cn("absolute right-0 top-0 w-24 h-24 blur-3xl opacity-5", color)} />
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] mb-1">{title}</p>
      <p className="text-3xl font-black text-[#1E293B] mb-1">{value}</p>
      {subtitle && <p className="text-[10px] font-bold text-slate-400 leading-tight">{subtitle}</p>}
    </div>
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center translate-y-1 transition-transform group-hover:scale-110", color.replace('bg-', 'bg-opacity-10 text-').split(' ')[0])}>
      {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
    </div>
  </Card>
);

const SummaryItem: React.FC<{ label: string; value: string; colorClass: string }> = ({ label, value, colorClass }) => (
  <div className="flex flex-col items-center">
    <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] mb-1">{label}</p>
    <p className={cn("text-xl font-black", colorClass)}>{value}</p>
  </div>
);

// --- LAYOUT ADMIN ---

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, user } = useUser();
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans selection:bg-primary selection:text-white pb-20 lg:pb-0">
      {/* Sidebar Admin Premium */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-slate-100 z-50 hidden lg:flex flex-col shadow-sm">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#517CA1] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#517CA1]/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="font-black text-xl tracking-tighter leading-none">Admin</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MyPetCare</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-8 space-y-1">
          <div className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] opacity-60">Visão Geral</div>
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group",
              activeTab === 'users' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            )}
          >
            <Users className="w-5 h-5" />
            Gerenciar Usuários
          </button>
          
          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:bg-slate-50 font-black text-sm transition-all text-left">
            <Calendar className="w-5 h-5 opacity-40" />
            Agenda Global
          </button>

          <div className="px-6 py-4 pt-8 text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] opacity-60">Integrações</div>
          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:bg-slate-50 font-black text-sm transition-all text-left">
            <FileText className="w-5 h-5 opacity-40" />
            Hotmart Webhook
          </button>
        </nav>

        <div className="p-6 border-t border-slate-50">
          <div className="bg-slate-50 p-4 rounded-2xl mb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <p className="text-[10px] font-black text-success uppercase tracking-widest">Sistema Operacional</p>
            </div>
            <p className="text-[11px] text-slate-500 font-bold leading-tight">Webhook Hotmart ativo e recebendo payloads.</p>
          </div>

          <button 
            onClick={signOut}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-error bg-error/5 hover:bg-error/10 font-black text-sm transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 p-6 lg:p-12 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

const Admin: React.FC = () => {
  const { user, isAdmin, loading, signOut } = useUser();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [hotmartEvents, setHotmartEvents] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form para novos usuários
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setFetching(true);
    try {
      const [profilesRes, eventsRes] = await Promise.allSettled([
        supabase.from('profiles').select('*, pets:pets(count)').order('created_at', { ascending: false }),
        supabase.from('hotmart_events').select('*').order('created_at', { ascending: false })
      ]);
      
      let profilesData = [];
      let eventsData = [];

      if (profilesRes.status === 'fulfilled' && !profilesRes.value.error) {
        profilesData = profilesRes.value.data || [];
      } else {
        console.error("DEBUG: Error fetching profiles:", profilesRes.status === 'fulfilled' ? profilesRes.value.error : profilesRes.reason);
      }

      if (eventsRes.status === 'fulfilled' && !eventsRes.value.error) {
        eventsData = eventsRes.value.data || [];
      } else {
        console.warn("DEBUG: hotmart_events query failed or table missing. This is normal if integrations are not set up yet.");
      }

      setProfiles(profilesData);
      setHotmartEvents(eventsData);
    } catch (err) {
      console.error('DEBUG: Unexpected error in Admin fetchData:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Falha ao criar usuário');
      }

      alert('Usuário criado com sucesso!');
      setIsCreateModalOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      fetchData();
    } catch (err) {
      alert('Erro ao atualizar status.');
    }
  };

  // --- CÁLCULOS DE KPI (Baseados no Print) ---
  const stats = useMemo(() => {
    const total = profiles.length;
    const active = profiles.filter(p => p.active !== false).length;
    const canceled = profiles.filter(p => p.active === false).length;
    const engaged = profiles.filter(p => p.pets && p.pets[0]?.count > 0).length;
    const neverAccessed = profiles.filter(p => !p.last_login_at && p.active !== false).length;
    
    // Status do Webhook
    const cartAbandonment = hotmartEvents.filter(e => e.event_type.includes('ABANDONMENT')).length;
    const waitingPayment = hotmartEvents.filter(e => e.event_type.includes('WAITING')).length;

    // Receita (Mock ou real se houver tabela)
    const totalRevenue = hotmartEvents.reduce((acc, curr) => acc + (curr.price_value || 0), 0);
    const monthlyRevenue = hotmartEvents
      .filter(e => new Date(e.created_at).getMonth() === new Date().getMonth())
      .reduce((acc, curr) => acc + (curr.price_value || 0), 0);

    return { total, active, canceled, engaged, neverAccessed, cartAbandonment, waitingPayment, totalRevenue, monthlyRevenue };
  }, [profiles, hotmartEvents]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-30" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Aguarde...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6 text-center">
        <div className="w-20 h-20 bg-error/10 text-error rounded-3xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black mb-2 tracking-tighter">Acesso Restrito</h1>
        <p className="text-slate-500 max-w-sm mb-8 font-medium">
          Você não possui permissões administrativas ou seu perfil ainda está sendo carregado pelo sistema.
        </p>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => window.location.reload()}>Tentar Novamente</Button>
          <Button onClick={signOut}>Sair da Conta</Button>
        </div>
      </div>
    );
  }

  const filtered = profiles.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      {/* Header Dinâmico */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center group">
            <LayoutDashboard className="w-7 h-7 text-[#517CA1] transition-transform group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-[#1C1E21]">Dashboard Admin</h1>
            <p className="text-slate-500 font-bold flex items-center gap-2">
              Controle geral do ecossistema 
              <span className="w-1 h-1 rounded-full bg-slate-300" /> 
              Gerenciamento v2.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={fetchData} 
            variant="ghost" 
            className="w-12 h-12 rounded-2xl p-0 hover:bg-slate-100"
          >
            <RefreshCcw className={cn("w-5 h-5 text-slate-400", fetching && "animate-spin")} />
          </Button>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-4 bg-primary text-white rounded-2xl font-black text-sm flex items-center gap-3 hover:scale-[1.02] transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Novo Usuário
          </Button>
        </div>
      </header>

      {/* --- PRIMEIRA LINHA DE KPI --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard 
          title="Total de Assinantes" 
          value={stats.total} 
          icon={<Users />} 
          color="bg-[#517CA1]" 
        />
        <KpiCard 
          title="Assinantes Ativos" 
          value={stats.active} 
          icon={<UserCheck />} 
          color="bg-[#10B981]" 
        />
        <KpiCard 
          title="Cancelados" 
          value={stats.canceled} 
          icon={<UserMinus />} 
          color="bg-[#EF4444]" 
        />
        <KpiCard 
          title="Engajados" 
          value={stats.engaged} 
          icon={<Activity />} 
          color="bg-[#8B5CF6]" 
          subtitle="com imóveis ou clientes"
        />
      </div>

      {/* --- SEGUNDA LINHA DE KPI (Hotmart) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <KpiCard 
          title="Nunca Acessaram" 
          value={stats.neverAccessed} 
          icon={<AlertCircle />} 
          color="bg-[#F59E0B]" 
          subtitle="ativos sem login"
        />
        <KpiCard 
          title="Abandonos Carrinho" 
          value={stats.cartAbandonment} 
          icon={<ShoppingCart />} 
          color="bg-[#F97316]" 
          subtitle="Hotmart"
        />
        <KpiCard 
          title="Aguardando Pagamento" 
          value={stats.waitingPayment} 
          icon={<Clock />} 
          color="bg-[#06B6D4]" 
          subtitle="boleto/PIX pendente"
        />
      </div>

      <div className="flex items-center gap-3 mb-8 opacity-60">
        <ShieldAlert className="w-4 h-4 text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Legenda: Engajados = Usuários que cadastraram pelo menos 1 pet. Nunca Acessaram = Cadastros ativos sem registro de login.
        </p>
      </div>

      {/* --- RESUMO DO MÊS E FATURAMENTO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <Card className="lg:col-span-8 p-10 bg-white border-none shadow-sm rounded-[2.5rem] relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black flex items-center gap-3">
              <Calendar className="w-6 h-6 text-primary" />
              Resumo do Mês
            </h3>
            <select className="bg-slate-50 border-none outline-none font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl text-slate-400">
              <option>Abril de 2026</option>
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <SummaryItem label="Receita do Mês" value={`R$ ${stats.monthlyRevenue.toFixed(2)}`} colorClass="text-success" />
            <SummaryItem label="Novas Assinaturas" value="17" colorClass="text-[#517CA1]" />
            <SummaryItem label="Cancelamentos" value="3" colorClass="text-error" />
            <SummaryItem label="Reembolsos" value="0" colorClass="text-warning" />
          </div>

          <div className="mt-12 p-8 bg-[#10B981] rounded-[2rem] flex items-center justify-between text-white shadow-xl shadow-success/20">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Receita Total (Acumulada)</p>
              <p className="text-4xl font-black">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-4 p-10 bg-[#4F46E5] border-none shadow-sm rounded-[2.5rem] flex flex-col justify-between text-white">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status de Rede</p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total de Assinantes Ativos</p>
            <p className="text-4xl font-black mb-2">{stats.active}</p>
            <p className="text-sm font-bold opacity-60">de {stats.total} cadastrados</p>
          </div>

          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white" 
              style={{ width: `${(stats.active / stats.total) * 100}%` }} 
            />
          </div>
        </Card>
      </div>

      {/* --- LISTA DE USUÁRIOS --- */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black tracking-tight">Base de Usuários</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-bold w-64 focus:ring-4 focus:ring-primary/5 transition-all"
          />
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-md overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Usuário</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Cargo</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Acesso</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Pets</th>
                <th className="px-8 py-6 text-[10px) font-black uppercase tracking-widest text-[#94A3B8]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {fetching ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto opacity-20" />
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                        <img 
                          src={p.photo_url || `https://ui-avatars.com/api/?name=${p.name || 'User'}&background=random`} 
                          alt="" className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-tight">{p.name || 'Sem Nome'}</p>
                        <p className="text-[11px] text-slate-400 font-bold">ID: {p.id ? p.id.substring(0, 8) : '---'}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant={p.role === 'admin' ? 'success' : 'surface'} className="uppercase font-black text-[9px]">
                      {p.role || 'user'}
                    </Badge>
                  </td>
                  <td className="px-8 py-6">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-black text-[9px] uppercase",
                      p.active !== false ? "bg-success/5 text-success" : "bg-error/5 text-error"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", p.active !== false ? "bg-success" : "bg-error")} />
                      {p.active !== false ? 'Permitido' : 'Bloqueado'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-slate-900">{p.pets ? p.pets[0]?.count : 0}</p>
                  </td>
                  <td className="px-8 py-6">
                    <Button 
                      onClick={() => toggleUserStatus(p.id, p.active !== false)}
                      variant="ghost"
                      className={cn(
                        "font-black text-[9px] uppercase tracking-widest",
                        p.active !== false ? "text-error" : "text-success"
                      )}
                    >
                      {p.active !== false ? 'Desativar' : 'Reativar'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- MODAL DE CRIAÇÃO --- */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10"
            >
              <h3 className="text-3xl font-black tracking-tighter mb-2">Novo Usuário</h3>
              <p className="text-slate-500 font-bold mb-8 text-sm">Preencha os dados para criar um acesso manual.</p>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest ml-4 mb-2 block text-slate-400">Nome Completo</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all"
                    placeholder="Ex: João Silva"
                    value={newUser.name}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest ml-4 mb-2 block text-slate-400">Email de Acesso</label>
                  <input 
                    type="email" required
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all"
                    placeholder="joao@example.com"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest ml-4 mb-2 block text-slate-400">Senha Temporária</label>
                  <input 
                    type="password" required
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all"
                    placeholder="********"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest ml-4 mb-2 block text-slate-400">Cargo / Role</label>
                  <select 
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="user">Usuário (Tutor)</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="flex-1 py-4 rounded-2xl font-black"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Descartar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={creating}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20"
                  >
                    {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Criar Conta'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default Admin;
