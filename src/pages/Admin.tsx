import React, { useState, useEffect } from 'react';
import * as m from 'motion/react';
const { motion, AnimatePresence } = m;
import { 
  Users, UserCheck, UserMinus, DollarSign, Search, 
  Settings as SettingsIcon, Shield, Trash2, CheckCircle, 
  XCircle, Filter, ChevronRight, Save, Key, Mail, Plus
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

interface AdminUserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  photo_url: string | null;
  created_at: string;
}

export const Admin: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard');
  
  // Settings States
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (err) {
      alert('Erro ao atualizar status.');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza? Esta ação removerá o perfil do usuário permanentemente.')) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (err) {
      alert('Erro ao excluir usuário.');
    }
  };

  const handleUpdateAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    setIsUpdatingAuth(true);
    try {
      const updates: any = {};
      if (newEmail) updates.email = newEmail;
      if (newPassword) updates.password = newPassword;

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      alert('Dados de acesso atualizados com sucesso!');
      setNewEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    } finally {
      setIsUpdatingAuth(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const searchLower = search.toLowerCase();
    const nameMatch = (u.name || '').toLowerCase().includes(searchLower);
    const emailMatch = (u.email || '').toLowerCase().includes(searchLower);
    return nameMatch || emailMatch;
  });

  const stats = [
    { label: 'Total Usuários', value: users.length, icon: Users, color: 'primary' },
    { label: 'Usuários Ativos', value: users.filter(u => u.active).length, icon: UserCheck, color: 'success' },
    { label: 'Inativos', value: users.filter(u => !u.active).length, icon: UserMinus, color: 'error' },
    { label: 'Receita (Mock)', value: 'R$ 1.250', icon: DollarSign, color: 'warning' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tighter text-on-surface">Painel Administrativo</h1>
          <p className="text-on-surface-variant font-medium opacity-60">Gestão centralizada do MyPetCare</p>
        </div>
        
        <div className="flex bg-surface-container-low p-1.5 rounded-3xl self-start">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
              activeTab === 'dashboard' ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
              activeTab === 'users' ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            Usuários
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
              activeTab === 'settings' ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            Acesso
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <Card key={i} className="p-8 border-none bg-surface-container-low shadow-none overflow-hidden relative group">
                  <div className={cn(
                    "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-5 transition-transform group-hover:scale-110",
                    `text-${stat.color}`
                  )}>
                    <stat.icon className="w-full h-full" />
                  </div>
                  
                  <div className="relative">
                    <div className={cn("inline-flex p-3 rounded-2xl mb-4", `bg-${stat.color}/10 text-${stat.color}`)}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-on-surface tracking-tighter">{stat.value}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Card className="p-10 rounded-[3rem]">
                <h3 className="text-xl font-black mb-6">Novos Cadastros</h3>
                <div className="space-y-4">
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-3xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase">
                          {u.name?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{u.name}</p>
                          <p className="text-[10px] text-on-surface-variant opacity-60">{u.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-on-surface-variant opacity-20" />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-10 rounded-[3rem] bg-primary text-on-primary">
                <Shield className="w-12 h-12 mb-6" />
                <h3 className="text-2xl font-black mb-4">Segurança do Sistema</h3>
                <p className="text-on-primary/70 leading-relaxed mb-8">
                  Como administrador, você tem acesso total aos dados. Lembre-se de manter suas credenciais seguras e revisar o log de atividades regularmente.
                </p>
                <Button variant="surface" className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                  Ver Logs Completo
                </Button>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-40" />
                <input 
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-surface-container-low rounded-3xl outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                />
              </div>
              <Button onClick={() => alert('Função em desenvolvimento: Link de convite')}>
                <Plus className="w-5 h-5" />
                Criar Usuário
              </Button>
            </div>

            <Card className="overflow-hidden border-none shadow-none rounded-[2.5rem] bg-surface-container-low">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-surface-container-high/30">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">Usuário</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">Nível</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/20">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="group hover:bg-surface-container-high/20 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-surface-container-high">
                              <img src={u.photo_url || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100'} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-black text-on-surface">{u.name || 'Sem Nome'}</p>
                              <p className="text-xs text-on-surface-variant opacity-60 font-medium">{u.email || 'Sem E-mail'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <Badge variant={u.role === 'admin' ? 'success' : 'surface'} className="uppercase text-[9px] px-3 font-black">
                             {u.role === 'admin' ? 'Administrador' : 'Usuário'}
                           </Badge>
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => toggleUserStatus(u.id, u.active)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
                              u.active ? "text-success bg-success/10" : "text-error bg-error/10"
                            )}
                          >
                            {u.active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            <span className="text-[10px] font-black uppercase tracking-tight">{u.active ? 'Ativo' : 'Bloqueado'}</span>
                          </button>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)} className="text-error hover:bg-error/10">
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-12 rounded-[3.5rem] border-none shadow-xl bg-surface-container-low overflow-hidden relative">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                <Shield className="w-32 h-32" />
              </div>

              <div className="relative space-y-10">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-6">
                    <Key className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-black font-headline tracking-tighter">Dados de Acesso Admin</h3>
                  <p className="text-on-surface-variant opacity-60 font-medium">Altere suas credenciais de acesso ao painel</p>
                </div>

                <form onSubmit={handleUpdateAuth} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1">E-mail Administrativo</label>
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-40" />
                      <input 
                        type="email"
                        placeholder="Novo e-mail (opcional)"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-surface-container-high/30 rounded-3xl outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1">Nova Senha</label>
                      <div className="relative">
                        <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-40" />
                        <input 
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full pl-14 pr-6 py-5 bg-surface-container-high/30 rounded-3xl outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1">Confirmar Senha</label>
                      <div className="relative">
                        <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-40" />
                        <input 
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full pl-14 pr-6 py-5 bg-surface-container-high/30 rounded-3xl outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full py-6 rounded-3xl shadow-xl shadow-primary/20"
                    disabled={isUpdatingAuth || (!newEmail && !newPassword)}
                  >
                    <Save className="w-5 h-5" />
                    {isUpdatingAuth ? 'Atualizando...' : 'Salvar Alterações'}
                  </Button>
                </form>

                <div className="p-6 bg-error/5 rounded-[2rem] border border-error/10">
                  <div className="flex gap-4">
                    <Shield className="w-6 h-6 text-error shrink-0" />
                    <div>
                      <p className="text-xs font-black text-error uppercase tracking-tight mb-1">Aviso de Segurança</p>
                      <p className="text-[10px] text-error opacity-70 leading-relaxed font-medium">
                        Ao alterar o e-mail ou senha, você precisará fazer login novamente em todos os seus dispositivos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
