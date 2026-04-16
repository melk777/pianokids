"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { Copy, Users, DollarSign, CheckCircle, AlertCircle, LayoutDashboard, LineChart, Wallet, CreditCard, Calendar } from "lucide-react";
import { useSFX } from "@/hooks/useSFX";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart as RechartsLineChart, Line } from 'recharts';

interface StudentData {
  id: string;
  name: string;
  username: string;
  status: "Ativo" | "Inativo";
  plan_interval: "Mensal" | "Anual";
  songs_completed: number;
  trophies: number;
  last_practice: string;
  created_at: string;
}

interface StatsData {
  referral_code: string;
  activeStudents: number;
  estimatedEarnings: number;
  balance_available: number;
  balance_pending: number;
  students: StudentData[];
}

interface WithdrawalData {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

type TabType = 'overview' | 'students' | 'charts' | 'finances';

export default function TeacherDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [chartFilter, setChartFilter] = useState<'all' | '6months' | '3months'>('6months');
  
  const { playClick, playSuccess, playError } = useSFX();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/teacher/stats");
        const data = await res.json();

        if (!res.ok) {
          setLoadError(data?.error || "Nao foi possivel carregar o dashboard do professor.");
          setStats(null);
          return;
        }

        setStats(data);
        setLoadError(null);
      } catch (err) {
        console.error(err);
        setLoadError("Falha de comunicacao ao carregar o painel do professor.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch("/api/teacher/withdraw");
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch {
      console.error("Failed to fetch withdrawals");
    }
  };

  useEffect(() => {
    if (activeTab === 'finances') {
      fetchWithdrawals();
    }
  }, [activeTab]);

  const handleCopy = () => {
    if (stats?.referral_code) {
      playClick();
      navigator.clipboard.writeText(`${window.location.origin}/?ref=${stats.referral_code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdrawRequest = async () => {
    playClick();
    if (!stats || stats.balance_available <= 0) {
      playError();
      setWithdrawMessage({type: 'error', text: "Saldo indisponível para saque no momento."});
      setTimeout(() => setWithdrawMessage(null), 5000);
      return;
    }

    try {
      const res = await fetch("/api/teacher/withdraw", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ amount: stats.balance_available })
      });
      const data = await res.json();

      if (data.success) {
        playSuccess();
        setWithdrawMessage({type: 'success', text: "Solicitação enviada com sucesso! Em análise."});
        fetchWithdrawals(); // Atualiza a tabela
        
        // Atualização otimista no front-end para evitar duplo clique
        setStats({
          ...stats,
          balance_available: 0
        });
      } else {
         playError();
         setWithdrawMessage({type: 'error', text: data.error || "Erro ao solicitar saque."});
      }
    } catch {
      playError();
      setWithdrawMessage({type: 'error', text: "Falha na comunicação com o servidor."});
    }

    setTimeout(() => setWithdrawMessage(null), 5000);
  };

  // --- CHART DATA PROCESSING ---
  const chartData = useMemo(() => {
    if (!stats?.students) return [];

    const monthlyData: Record<string, { month: string, msCount: number, yrCount: number, revenue: number, timestamp: number }> = {};

    stats.students.forEach(student => {
      if (student.status !== 'Ativo') return;
      
      const date = new Date(student.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const displayLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: displayLabel, msCount: 0, yrCount: 0, revenue: 0, timestamp: date.getTime() };
      }

      if (student.plan_interval === 'Anual') {
        monthlyData[monthKey].yrCount += 1;
        monthlyData[monthKey].revenue += 40;
      } else {
        monthlyData[monthKey].msCount += 1;
        monthlyData[monthKey].revenue += 5;
      }
    });

    let sortedData = Object.values(monthlyData).sort((a, b) => a.timestamp - b.timestamp);

    // Apply Filter
    if (chartFilter !== 'all') {
      const limit = chartFilter === '6months' ? 6 : 3;
      sortedData = sortedData.slice(-limit);
    }

    return sortedData;
  }, [stats, chartFilter]);

  if (loading) {
    return (
      <div className="flex bg-black items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-red-500/15 bg-red-500/5 px-6 py-10 text-center">
        <p className="text-base font-semibold text-red-300">Nao foi possivel carregar o dashboard do professor.</p>
        <p className="mt-2 text-sm text-white/45">{loadError || "Tente novamente em alguns instantes."}</p>
      </div>
    );
  }

  const renderTabsNav = () => (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/5 mb-8 p-1">
      {[
        { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'charts', label: 'Análise de Crescimento', icon: LineChart },
        { id: 'students', label: 'Meus Alunos', icon: Users },
        { id: 'finances', label: 'Financeiro e Saques', icon: Wallet },
      ].map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => { playClick(); setActiveTab(tab.id as TabType); }}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${
              isActive ? "text-cyan" : "text-white/40 hover:text-white/70"
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="activeTabBadge"
                className="absolute left-0 right-0 bottom-0 h-0.5 bg-cyan blur-[1px]"
              />
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* HEADER TÍTULO*/}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Painel do Parceiro</h2>
        <div className="text-xs font-semibold px-3 py-1 bg-magenta/10 text-magenta rounded-full border border-magenta/20">
          Afiliado Autorizado
        </div>
      </div>

      {renderTabsNav()}

      <AnimatePresence mode="wait">
        
        {/* ================= VISÃO GERAL ================= */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* LINK CARD */}
            <div className="glass p-6 rounded-2xl border border-cyan/20 lg:col-span-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Users size={120} />
              </div>
              <h3 className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">Seu Link de Indicação</h3>
              <p className="text-white/70 text-sm mb-4 max-w-md">
                Envie este link para seus alunos. Ganhe <strong className="text-emerald-400">R$ 5/mês</strong> por planos mensais ou <strong className="text-cyan">R$ 40/ano</strong> por planos anuais ativados.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-cyan truncate select-all">
                  {`${window.location.origin}/?ref=${stats.referral_code}`}
                </div>
                <button
                  onClick={handleCopy}
                  className="shrink-0 w-full sm:w-auto px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado!" : "Copiar Link"}
                </button>
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="glass p-6 rounded-2xl border border-white/10 relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-sm font-black text-white/70 uppercase tracking-widest">A Receber em Breve</span>
              </div>
              <div className="text-5xl font-black text-white mb-2">
                R$ {stats.balance_pending.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-xs text-white/40 italic">Liberado em até 30 dias do pgto da assinatura do aluno.</p>
            </div>
          </motion.div>
        )}


        {/* ================= ANÁLISE DE CRESCIMENTO ================= */}
        {activeTab === 'charts' && (
          <motion.div
            key="charts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-end gap-2 mb-4">
               {['3months', '6months', 'all'].map(f => (
                 <button 
                  key={f}
                  onClick={() => setChartFilter(f as 'all' | '6months' | '3months')}
                  className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                    chartFilter === f ? 'bg-cyan/10 border-cyan/30 text-cyan' : 'bg-black border-white/10 text-white/40 hover:text-white/70'
                  }`}
                 >
                   {f === '3months' ? 'Últimos 3 Meses' : f === '6months' ? 'Últimos 6 Meses' : 'Todo Período'}
                 </button>
               ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
               {/* Financial EVOLUTION */}
               <div className="glass p-6 rounded-2xl border border-white/10">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
                   <DollarSign className="w-4 h-4 text-emerald-400" /> Evolução de Ganhos Estimados
                 </h3>
                 <div className="h-[300px] w-full">
                    {chartData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-white/20 text-sm">Sem dados suficientes</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="month" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '12px' }}
                            itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                            formatter={(value: unknown) => [`R$ ${Number(value || 0).toFixed(2)}`, "Oportunidade Gerada"]}
                          />

                          <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#0a0a0a', stroke: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    )}
                 </div>
               </div>

               {/* VOLUME DE ALUNOS */}
               <div className="glass p-6 rounded-2xl border border-white/10">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
                   <Users className="w-4 h-4 text-cyan" /> Adesão de Assinaturas (Mensal vs Anual)
                 </h3>
                 <div className="h-[300px] w-full">
                    {chartData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-white/20 text-sm">Sem dados suficientes</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="month" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '12px' }}
                            cursor={{ fill: '#ffffff05' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                          <Bar dataKey="msCount" name="Asst. Mensais" fill="#00eaff" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="yrCount" name="Asst. Anuais" fill="#ff00e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                 </div>
               </div>
            </div>
          </motion.div>
        )}


        {/* ================= ESTUDANTES ================= */}
        {activeTab === 'students' && (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass rounded-2xl border border-white/10 overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
               <h3 className="text-lg font-bold">Base de Alunos Refenciados</h3>
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                 <span className="text-sm font-semibold">{stats.activeStudents} ativos</span>
               </div>
            </div>

            <div className="overflow-x-auto">
              {stats.students.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-center">
                   <AlertCircle className="w-8 h-8 text-white/20 mb-3" />
                   <h4 className="text-white/80 font-semibold mb-1">Você ainda não referenciou nenhum aluno</h4>
                   <p className="text-white/40 text-sm max-w-xs">Use o seu link exclusivo encontrado na aba &quot;Visão Geral&quot;.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5">Nome / User</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5">Criado em</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5">Plano</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5">Progresso</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {stats.students.map((student) => (
                      <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">{student.name}</div>
                          <div className="text-[10px] text-white/30 font-mono">{student.username}</div>
                        </td>
                        <td className="px-6 py-4 text-white/50 text-xs">
                          {new Date(student.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            student.plan_interval === 'Anual' ? 'bg-cyan/10 border-cyan/20 text-cyan' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }`}>
                            {student.plan_interval.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-4">
                              <span className="text-cyan font-bold text-xs">{student.songs_completed} mus.</span>
                              <span className="text-yellow-400 font-bold text-xs">{student.trophies} trof.</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {student.status === "Ativo" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" /> ATIVO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-white/40 text-[10px] font-black border border-white/10">PENDENTE</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}


        {/* ================= FINANCEIRO E SAQUES ================= */}
        {activeTab === 'finances' && (
          <motion.div
            key="finances"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {withdrawMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  withdrawMessage.type === 'success' 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {withdrawMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <p className="text-sm font-medium">{withdrawMessage.text}</p>
              </motion.div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass p-8 rounded-3xl border border-white/10 flex flex-col justify-between items-start relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5">
                    <DollarSign size={160} />
                 </div>
                 <div>
                   <h3 className="text-white/50 uppercase tracking-widest font-black text-sm mb-6 flex items-center gap-2">
                     <Wallet className="w-4 h-4" /> Conta Corrente Pianify
                   </h3>
                   <p className="text-5xl font-black text-white mb-2">
                      R$ {stats.balance_available.toFixed(2).replace('.', ',')}
                   </p>
                   <p className="text-sm text-emerald-400 font-semibold mb-8">Disponível para Saque PIX imediato</p>
                 </div>

                 <button
                    onClick={handleWithdrawRequest}
                    disabled={stats.balance_available <= 0}
                    className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                  >
                    Solicitar Saque Total
                  </button>
              </div>

              <div className="glass rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden">
                 <h3 className="p-6 border-b border-white/5 text-white/50 uppercase tracking-widest font-black text-sm flex items-center gap-2">
                   <CreditCard className="w-4 h-4" /> Histórico de Saques
                 </h3>
                 <div className="flex-1 overflow-y-auto w-full custom-scrollbar max-h-[300px]">
                   {withdrawals.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full text-white/20 p-8">
                       <Calendar className="w-8 h-8 mb-2" />
                       <p className="text-sm font-medium">Nenhum saque solicitado ainda</p>
                     </div>
                   ) : (
                     <ul className="divide-y divide-white/5">
                        {withdrawals.map((w) => (
                           <li key={w.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition">
                             <div>
                               <p className="font-bold text-lg text-white">R$ {w.amount.toFixed(2).replace('.', ',')}</p>
                               <p className="text-xs text-white/40">{new Date(w.created_at).toLocaleString('pt-BR')}</p>
                             </div>
                             <div>
                               <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                                  w.status === 'aprovado' || w.status === 'concluido' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  w.status === 'pendente' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  'bg-red-500/10 text-red-400 border-red-500/20'
                               }`}>
                                 {w.status}
                               </span>
                             </div>
                           </li>
                        ))}
                     </ul>
                   )}
                 </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
