import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../contexts/UserContext';
import { 
  Users, UserCheck, UserMinus, Shield, Search, 
  CheckCircle, XCircle, ChevronRight, Loader2, LogOut,
  LayoutDashboard, Key, Mail, ShieldCheck, ShieldAlert,
  TrendingUp, Activity, UserX, AlertCircle, ShoppingCart,
  Clock, DollarSign, Calendar, Plus, RefreshCcw, FileText,
  BellRing, Settings as SettingsIcon, Save
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

// --- COMPONENTE PRINCIPAL ---

const Admin: React.FC = () => {
  const { user, isAdmin, loading, signOut } = useUser();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'integrations' | 'notifications' | 'settings'>('dashboard');
  
  // States para dados
  const [profiles, setProfiles] = useState<any[]>([]);
  const [hotmartEvents, setHotmartEvents] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  
  // States para Settings & Notifications
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Form para novos usuários
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [creating, setCreating] = useState(false);

  // Alteração de senha admin
  const [newAdminPass, setNewAdminPass] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      fetchSettings();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setFetching(true);
    try {
      // Consulta simplificada para evitar erros 400 por colunas inexistentes ou relações complexas
      const [profilesRes, eventsRes] = await Promise.allSettled([
        supabase.from('profiles').select('*'),
        supabase.from('hotmart_events').select('*')
      ]);
      
      if (profilesRes.status === 'fulfilled') {
        if (profilesRes.value.error) {
          console.error('Error fetching profiles:', profilesRes.value.error.message, profilesRes.value.error);
        } else {
          setProfiles(profilesRes.value.data || []);
        }
      }
      if (eventsRes.status === 'fulfilled') {
        if (eventsRes.value.error) {
          console.error('Error fetching events:', eventsRes.value.error.message, eventsRes.value.error);
        } else {
          setHotmartEvents(eventsRes.value.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setFetching(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('system_settings').select('*');
      if (error) throw error;
      const settingsMap = (data || []).reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      setSettings(settingsMap);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value
      }));

      const { error } = await supabase.from('system_settings').upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      alert('Configurações salvas com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateAdminPass = async () => {
    if (!newAdminPass || newAdminPass.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newAdminPass });
      if (error) throw error;
      alert('Senha do administrador atualizada com sucesso!');
      setNewAdminPass('');
    } catch (err: any) {
      alert('Erro ao atualizar senha: ' + err.message);
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

  const handleSyncUser = async (user: any) => {
    try {
      setFetching(true);
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          role: user.role,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Falha ao sincronizar');
      }

      alert('Acesso sincronizado e senha resetada com sucesso!');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFetching(false);
    }
  };

  // --- CÁLCULOS DE KPI ---
  const stats = useMemo(() => {
    const total = profiles.length;
    const active = profiles.filter(p => p.active !== false).length;
    const canceled = profiles.filter(p => p.active === false).length;
    const neverAccessed = profiles.filter(p => !p.last_login_at && p.active !== false).length;
    const cartAbandonment = (hotmartEvents || []).filter(e => (e.event_type || '').includes('ABANDONMENT')).length;
    const waitingPayment = (hotmartEvents || []).filter(e => (e.event_type || '').includes('WAITING')).length;
    const totalRevenue = (hotmartEvents || []).reduce((acc, curr) => acc + (curr.price_value || 0), 0);
    const monthlyRevenue = (hotmartEvents || [])
      .filter(e => e.created_at && new Date(e.created_at).getMonth() === new Date().getMonth())
      .reduce((acc, curr) => acc + (curr.price_value || 0), 0);

    return { total, active, canceled, engaged: 0, neverAccessed, cartAbandonment, waitingPayment, totalRevenue, monthlyRevenue };
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
          Sua conta não possui permissões de administrador. 
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.replace('/')}>Ir para o Dashboard</Button>
          <Button variant="ghost" onClick={signOut} className="text-error">Sair</Button>
        </div>
      </div>
    );
  }

  const filteredProfiles = profiles.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col lg:flex-row">
      {/* Sidebar Admin Premium */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-slate-100 z-50 hidden lg:flex flex-col shadow-sm">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="font-black text-xl tracking-tighter leading-none">Admin</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MyPetCare</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-8 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group",
              activeTab === 'dashboard' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group",
              activeTab === 'users' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            )}
          >
            <Users className="w-5 h-5" />
            Usuários
          </button>

          <button 
            onClick={() => setActiveTab('integrations')}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group",
              activeTab === 'integrations' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            )}
          >
            <RefreshCcw className="w-5 h-5" />
            Integrações
          </button>

          <div className="px-6 py-4 pt-8 text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] opacity-60">Configurações</div>
          
          <button 
            onClick={() => setActiveTab('notifications')}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group",
              activeTab === 'notifications' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            )}
          >
            <BellRing className="w-5 h-5" />
            Notificações
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all group",
              activeTab === 'settings' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            )}
          >
            <SettingsIcon className="w-5 h-5" />
            Geral
          </button>
        </nav>

        <div className="p-6 border-t border-slate-50">
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
      <main className="flex-1 lg:ml-72 p-6 lg:p-12 min-h-screen">
        <div className="max-w-7xl mx-auto">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                <div>
                  <h1 className="text-4xl font-black tracking-tighter text-[#1C1E21]">Dashboard Admin</h1>
                  <p className="text-slate-500 font-bold">Gerenciamento Geral de Assinaturas e KPIs</p>
                </div>
                <Button onClick={fetchData} variant="ghost" className="w-12 h-12 p-0"><RefreshCcw className={cn(fetching && "animate-spin")} /></Button>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Assinantes" value={stats.total} icon={<Users />} color="bg-[#517CA1]" />
                <KpiCard title="Ativos" value={stats.active} icon={<UserCheck />} color="bg-[#10B981]" />
                <KpiCard title="Cancelados" value={stats.canceled} icon={<UserMinus />} color="bg-[#EF4444]" />
                <KpiCard title="Engajados" value={stats.engaged} icon={<Activity />} color="bg-[#8B5CF6]" subtitle="com pets" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-8 p-10 bg-white border-none shadow-sm rounded-[2.5rem]">
                   <h3 className="text-xl font-black mb-8 flex items-center gap-3"><DollarSign className="text-primary" /> Receita</h3>
                   <div className="grid grid-cols-2 gap-8 mb-10">
                     <SummaryItem label="Este Mês" value={`R$ ${stats.monthlyRevenue.toFixed(2)}`} colorClass="text-success" />
                     <SummaryItem label="Total Acumulado" value={`R$ ${stats.totalRevenue.toFixed(2)}`} colorClass="text-slate-900" />
                   </div>
                   <div className="p-8 bg-success rounded-3xl text-white flex items-center justify-between">
                     <div>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Saúde Financeira</p>
                       <p className="text-lg font-bold">Webhook Hotmart Ativo</p>
                     </div>
                     <CheckCircle className="w-8 h-8 opacity-40" />
                   </div>
                </Card>
                <div className="lg:col-span-4 space-y-6">
                  <KpiCard title="Abandonos" value={stats.cartAbandonment} icon={<ShoppingCart />} color="bg-[#F97316]" />
                  <KpiCard title="Pagamento Pendente" value={stats.waitingPayment} icon={<Clock />} color="bg-[#06B6D4]" />
                </div>
              </div>
            </div>
          )}

          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-8">
              <header className="flex justify-between items-center mb-12">
                <h2 className="text-3xl font-black tracking-tighter">Gestão de Usuários</h2>
                <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-2xl px-8 py-4"><Plus className="w-5 h-5 mr-2" /> Novo Usuário</Button>
              </header>

              <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100 mb-6">
                <Search className="w-5 h-5 text-slate-400 ml-4 mt-3" />
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome ou e-mail..." 
                  className="flex-1 px-4 py-3 outline-none font-bold text-sm bg-transparent"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <Card className="rounded-[2.5rem] border-none shadow-md overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuário</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Cargo</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Pets</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {fetching ? (
                        <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Carregando...</td></tr>
                      ) : filteredProfiles.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border border-slate-100">
                                <img src={`https://ui-avatars.com/api/?name=${p.name || 'U'}&background=random`} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-black text-slate-900 leading-tight">{p.name || 'Sem Nome'}</p>
                                <p className="text-[11px] text-slate-400 font-bold">{p.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6"><Badge variant={p.role === 'admin' ? 'success' : 'surface'}>{p.role}</Badge></td>
                          <td className="px-8 py-6">
                            <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase", p.active !== false ? "bg-success/10 text-success" : "bg-error/10 text-error")}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", p.active !== false ? "bg-success" : "bg-error")} />
                              {p.active !== false ? 'Ativo' : 'Bloqueado'}
                            </div>
                          </td>
                          <td className="px-8 py-6 font-black">{p.pets?.[0]?.count || 0}</td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2">
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 onClick={() => toggleUserStatus(p.id, p.active !== false)}
                                 className={cn("text-[10px] font-black uppercase", p.active !== false ? "text-error" : "text-success")}
                               >
                                 {p.active !== false ? 'Bloquear' : 'Liberar'}
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 onClick={() => handleSyncUser(p)}
                                 className="text-[10px] font-black uppercase text-primary"
                               >
                                 Sincronizar
                               </Button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB: INTEGRATIONS (HOTMART) */}
          {activeTab === 'integrations' && (
            <div className="space-y-8">
              <header className="mb-12">
                <h2 className="text-3xl font-black tracking-tighter">Logs de Integração</h2>
                <p className="text-slate-500 font-bold">Eventos recebidos via Webhook Hotmart</p>
              </header>

              <Card className="rounded-[2.5rem] border-none shadow-md overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Evento</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Comprador</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {hotmartEvents.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50/30">
                          <td className="px-8 py-6 text-xs font-bold text-slate-500">{new Date(e.created_at).toLocaleString()}</td>
                          <td className="px-8 py-6"><Badge variant="surface" className="text-[9px]">{e.event_type}</Badge></td>
                          <td className="px-8 py-6">
                            <p className="font-black text-sm">{e.buyer_name}</p>
                            <p className="text-[11px] text-slate-400">{e.buyer_email}</p>
                          </td>
                          <td className="px-8 py-6 font-black text-success">R$ {e.price_value?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <header className="mb-12 flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter text-primary flex items-center gap-3">
                    <BellRing /> Gestão de Notificações
                  </h2>
                  <p className="text-slate-500 font-bold">Edite os templates de mensagens disparadas automaticamente.</p>
                </div>
                <Button onClick={handleSaveSettings} isLoading={savingSettings} className="rounded-2xl px-8 py-4"><Save className="mr-2" /> Salvar Tudo</Button>
              </header>

              <div className="grid grid-cols-1 gap-8">
                {/* Email Boas Vindas */}
                <Card className="p-8 bg-white rounded-[2.5rem] shadow-sm">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-secondary"><Mail /> E-mail de Boas-Vindas (Hotmart)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assunto do E-mail</label>
                      <input 
                        type="text" 
                        value={settings.email_welcome_subject || ''}
                        onChange={e => setSettings({...settings, email_welcome_subject: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Corpo HTML</label>
                      <textarea 
                        rows={8}
                        value={settings.email_welcome_body || ''}
                        onChange={e => setSettings({...settings, email_welcome_body: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-mono text-xs outline-none"
                      />
                    </div>
                  </div>
                </Card>

                {/* Email Agendamento */}
                <Card className="p-8 bg-white rounded-[2.5rem] shadow-sm">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-primary"><Clock /> E-mail Lembrete (1 dia antes)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assunto</label>
                      <input 
                        type="text" 
                        value={settings.email_appointment_subject || ''}
                        onChange={e => setSettings({...settings, email_appointment_subject: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Mensagem (use {"{{petName}}"} e {"{{eventTitle}}"} como variáveis)</label>
                      <textarea 
                        rows={4}
                        value={settings.email_appointment_body || ''}
                        onChange={e => setSettings({...settings, email_appointment_body: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none"
                      />
                    </div>
                  </div>
                </Card>

                {/* Push Agendamento */}
                <Card className="p-8 bg-white rounded-[2.5rem] shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black flex items-center gap-3 text-warning"><BellRing /> Notificação Push (Manual / Lembrete)</h3>
                    <Button 
                      size="sm" 
                      onClick={async () => {
                        if (!settings.push_appointment_body) return alert('Digite uma mensagem primeiro.');
                        if (!window.confirm('Enviar esta notificação para TODOS os usuários agora?')) return;
                        try {
                          const res = await fetch('/api/admin/send-push', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: settings.push_appointment_body })
                          });
                          if (!res.ok) throw new Error('Falha ao enviar');
                          alert('Notificação enviada com sucesso!');
                        } catch (err: any) {
                          alert(err.message);
                        }
                      }}
                      className="bg-warning text-on-warning rounded-xl px-6"
                    >
                      Enviar para Todos Agora
                    </Button>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Texto do Push (usado também como template para o Cron)</label>
                    <textarea 
                      rows={3}
                      value={settings.push_appointment_body || ''}
                      onChange={e => setSettings({...settings, push_appointment_body: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none"
                    />
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              <header className="mb-12">
                <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3"><SettingsIcon /> Configurações Gerais</h2>
                <p className="text-slate-500 font-bold">Segurança e recuperação de conta.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* E-mail de Recuperação */}
                <Card className="p-8 bg-white rounded-[2.5rem] shadow-sm space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3"><Mail className="text-primary" /> Recuperação</h3>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">E-mail para suporte/recuperação</label>
                    <input 
                      type="email" 
                      value={settings.recovery_email || ''}
                      onChange={e => setSettings({...settings, recovery_email: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none mb-4"
                    />
                    <Button onClick={handleSaveSettings} isLoading={savingSettings} className="w-full rounded-2xl">Atualizar E-mail</Button>
                  </div>
                </Card>

                {/* Trocar Senha Admin */}
                <Card className="p-8 bg-white rounded-[2.5rem] shadow-sm space-y-6">
                  <h3 className="text-lg font-black flex items-center gap-3"><Key className="text-warning" /> Senha Administrativa</h3>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nova Senha</label>
                    <input 
                      type="password" 
                      value={newAdminPass}
                      onChange={e => setNewAdminPass(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none mb-4"
                    />
                    <Button onClick={handleUpdateAdminPass} className="w-full rounded-2xl bg-warning text-on-warning border-none">Trocar Senha Agora</Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* --- MODAL CRIAÇÃO USUÁRIO --- */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl">
              <h3 className="text-3xl font-black mb-8">Novo Usuário</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <input type="text" placeholder="Nome" required className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                <input type="email" placeholder="E-mail" required className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                <input type="password" placeholder="Senha (Mantenha padrao)" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                <select className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold appearance-none" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="user">Tutor</option>
                  <option value="admin">Administrador</option>
                </select>
                <div className="pt-4 flex gap-4">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" isLoading={creating} className="flex-1">Criar</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
