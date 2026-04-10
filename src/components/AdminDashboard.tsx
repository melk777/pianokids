"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Users, DollarSign, CheckCircle, AlertCircle, LayoutDashboard, Search, UploadCloud, FileText, Check, X, ShieldAlert, LineChart as ChartIcon, Wallet } from "lucide-react";
import { createClientComponent } from "@/lib/supabase";
import { useSFX } from "@/hooks/useSFX";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts";

interface AdminStats {
  totalStudents: number;
  totalActiveMonthly: number;
  totalActiveYearly: number;
  totalTeachers: number;
  totalPendingValue: number;
  totalPaidValue: number;
  debtMature: number;
  debtGlobal: number;
}

interface FinancialStats {
  chartData: any[];
  mrr: number;
  arr: number;
  revenueMonthlyPlan: number;
  revenueYearlyPlan: number;
  monthGatewayCost: number;
  monthTeacherPayouts: number;
  monthNetProfit: number;
}

interface AdminWithdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  receipt_url?: string;
  teacher_id: string;
  profiles: {
    full_name: string;
    username: string;
    pix_key: string;
    balance_withdrawn_total: number;
  };
}

interface AdminTeacher {
  id: string;
  full_name: string;
  username: string;
  pix_key: string;
  balance_withdrawn_total: number;
  created_at: string;
  totalStudents: number;
  activeStudents: number;
  estimatedRevenue: number;
  formattedRevenue: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'withdrawals' | 'teachers'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [finances, setFinances] = useState<FinancialStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date filter (Number of months back, e.g., 3, 6, 12)
  const [financialFilter, setFinancialFilter] = useState<number>(12);

  // States para Custos Variáveis (Contabilidade)
  const [expenseMonthYear, setExpenseMonthYear] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [expensesData, setExpensesData] = useState<any>({ marketing: "", development: "", copyrights: "", other: "" });
  const [expensesHistory, setExpensesHistory] = useState<any[]>([]);
  const [isSavingExpenses, setIsSavingExpenses] = useState(false);

  // States para o Comprovante (Modal)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWithdrawal | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [searchTeacher, setSearchTeacher] = useState("");
  
  const { playClick, playSuccess, playError } = useSFX();
  const supabase = createClientComponent();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [resStats, resWith, resTeach, resFin] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/withdrawals'),
        fetch('/api/admin/teachers'),
        fetch('/api/admin/financial')
      ]);

      if (resStats.ok) setStats(await resStats.json());
      if (resWith.ok) setWithdrawals((await resWith.json()).withdrawals);
      if (resTeach.ok) setTeachers((await resTeach.json()).teachers);
      if (resFin.ok) setFinances(await resFin.json());
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const formatCurToInput = (val: number) => {
      if (!val) return "";
      let v = Number(val).toFixed(2);
      let parts = v.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return parts.join(",");
  };

  const handleMaskChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
     let v = e.target.value.replace(/\D/g, "");
     if (v === "") {
         setExpensesData({ ...expensesData, [field]: "" });
         return;
     }
     v = (Number(v) / 100).toFixed(2);
     let parts = v.split(".");
     parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
     setExpensesData({ ...expensesData, [field]: parts.join(",") });
  };

  const unmask = (val: string) => {
      if (!val) return 0;
      return Number(val.replace(/\./g, "").replace(",", "."));
  };

  const fetchExpenses = async (monthYear: string) => {
      try {
          const res = await fetch(`/api/admin/expenses?month_year=${monthYear}`);
          if (res.ok) {
              const data = await res.json();
              setExpensesData({
                  marketing: formatCurToInput(data.marketing),
                  development: formatCurToInput(data.development),
                  copyrights: formatCurToInput(data.copyrights),
                  other: formatCurToInput(data.other)
              });
          }
          const resAll = await fetch('/api/admin/expenses');
          if (resAll.ok) {
              const dataAll = await resAll.json();
              setExpensesHistory(dataAll.expenses || []);
          }
      } catch (error) {
          console.error(error);
      }
  };

  useEffect(() => {
    if (activeTab === 'financial') {
        fetchExpenses(expenseMonthYear);
    }
  }, [activeTab, expenseMonthYear]);

  const submitExpenses = async () => {
      setIsSavingExpenses(true);
      playClick();
      try {
          const res = await fetch('/api/admin/expenses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  month_year: expenseMonthYear, 
                  marketing: unmask(expensesData.marketing),
                  development: unmask(expensesData.development),
                  copyrights: unmask(expensesData.copyrights),
                  other: unmask(expensesData.other)
              })
          });
          if (res.ok) {
              playSuccess();
              fetchAll(); // Atualiza o gráfico Recharts instantaneamente!
          } else {
              playError();
          }
      } catch (error) {
          playError();
      } finally {
          setIsSavingExpenses(false);
      }
  };

  const deleteExpense = async (mYear: string) => {
      if(!confirm(`Excluir as despesas contábeis do mês ${mYear}?`)) return;
      playClick();
      try {
          const res = await fetch(`/api/admin/expenses?month_year=${mYear}`, { method: 'DELETE' });
          if(res.ok) {
              playSuccess();
              if (mYear === expenseMonthYear) {
                  setExpensesData({ marketing: "", development: "", copyrights: "", other: "" });
              }
              fetchAll();
          }
      } catch(e) {
          playError();
      }
  };

  const handleActionClick = (w: AdminWithdrawal) => {
    playClick();
    setSelectedWithdrawal(w);
    setUploadFile(null);
  };

  const submitApproval = async () => {
    if (!selectedWithdrawal || !uploadFile) return;
    playClick();
    setIsUploading(true);

    try {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${selectedWithdrawal.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, uploadFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName);

      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawal_id: selectedWithdrawal.id,
          status: 'aprovado',
          receipt_url: publicUrl,
          teacher_id: selectedWithdrawal.teacher_id,
          amount: selectedWithdrawal.amount
        })
      });

      if (res.ok) {
        playSuccess();
        setSelectedWithdrawal(null);
        fetchAll(); 
      } else {
        throw new Error("Falha na API");
      }
    } catch (e) {
      playError();
      alert("Erro ao processar o comprovante. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const submitRejection = async () => {
      if (!selectedWithdrawal) return;
      playClick();
      setIsUploading(true);
      try {
          const res = await fetch('/api/admin/withdrawals', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              withdrawal_id: selectedWithdrawal.id,
              status: 'rejeitado',
              receipt_url: null,
              teacher_id: selectedWithdrawal.teacher_id,
              amount: selectedWithdrawal.amount
            })
          });
          if (res.ok) {
            playSuccess();
            setSelectedWithdrawal(null);
            fetchAll();
          }
      } catch (e) {
          playError();
          alert("Erro ao rejeitar");
      } finally {
          setIsUploading(false);
      }
  };

  if (loading && !stats) {
    return <div className="flex bg-black items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
    </div>;
  }

  const filteredTeachers = teachers.filter(t => t.full_name?.toLowerCase().includes(searchTeacher.toLowerCase()) || t.username?.toLowerCase().includes(searchTeacher.toLowerCase()));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-4 rounded-xl border border-white/10 text-xs shadow-2xl">
          <p className="font-bold text-white mb-2 pb-2 border-b border-white/10">{label}</p>
          {payload.map((entry: any, index: number) => (
             <p key={index} className="flex gap-4 justify-between font-bold" style={{ color: entry.color }}>
                 <span>{entry.name}:</span>
                 <span>R$ {entry.value.toFixed(2)}</span>
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Filtragem local dos X meses para o Gráfico
  const visibleChartData = finances?.chartData.slice(-financialFilter) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-cyan w-6 h-6" /> Controle Master Pianify
        </h2>
        <button onClick={fetchAll} className="text-xs font-semibold px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full transition text-white">Atualizar Dados</button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 mb-8 p-1">
        {[
          { id: 'overview', label: 'Panorama Geral', icon: LayoutDashboard },
          { id: 'financial', label: 'DRE Financeiro', icon: ChartIcon },
          { id: 'withdrawals', label: 'Caixa de Repasses', icon: Wallet },
          { id: 'teachers', label: 'Time de Professores', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { playClick(); setActiveTab(tab.id as any); }}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${activeTab === tab.id ? "text-cyan" : "text-white/40 hover:text-white/70"}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && <motion.div layoutId="adminTab" className="absolute left-0 right-0 bottom-0 h-0.5 bg-cyan blur-[1px]" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* OVERVIEW */}
        {activeTab === 'overview' && stats && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="glass p-6 rounded-2xl border border-white/10">
                 <p className="text-xs text-white/40 uppercase font-black mb-2">Total Geral de Alunos</p>
                 <p className="text-4xl text-white font-bold">{stats.totalStudents}</p>
             </div>
             <div className="glass p-6 rounded-2xl border border-white/10">
                 <p className="text-xs text-emerald-400 uppercase font-black mb-2 flex items-center gap-1">Pianify Pro Ativos</p>
                 <div className="flex items-baseline gap-2">
                    <p className="text-4xl text-white font-bold">{stats.totalActiveMonthly + stats.totalActiveYearly}</p>
                 </div>
                 <div className="mt-2 text-[11px] text-white/40 font-bold flex gap-3">
                    <span>{stats.totalActiveMonthly} Mensais</span>
                    <span>{stats.totalActiveYearly} Anuais</span>
                 </div>
             </div>
             <div className="glass p-6 rounded-2xl border border-cyan/20 bg-cyan/5">
                 <p className="text-xs text-cyan uppercase font-black mb-2">Educadores na Rede</p>
                 <p className="text-4xl text-white font-bold">{stats.totalTeachers}</p>
             </div>
             <div className="glass p-6 rounded-2xl border border-magenta/20 bg-magenta/5">
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-magenta/70 uppercase font-black mb-1">Dívida Madura (Pagar Agora)</p>
                        <p className="text-2xl text-white font-bold">R$ {stats.debtMature.toFixed(2)}</p>
                    </div>
                 </div>
                 <div className="mt-3 pt-3 border-t border-magenta/10">
                    <p className="text-[10px] text-white/40 uppercase font-black mb-1">Saques em Fila (Solicitados)</p>
                    <p className="text-lg text-amber-400 font-bold">R$ {stats.totalPendingValue.toFixed(2)}</p>
                 </div>
             </div>
             <div className="glass p-6 rounded-2xl border border-white/10">
                 <p className="text-xs text-white/40 uppercase font-black mb-2">Dívida Global (Total + Futuro)</p>
                 <p className="text-4xl text-white font-bold">R$ {stats.debtGlobal.toFixed(2)}</p>
                 <div className="mt-2 text-[10px] text-white/30 font-bold">
                    <span>Inclui comissões em carência de 30 dias</span>
                 </div>
             </div>
             {finances && (() => {
                 // Balanço Real: Receita Mensal - Passivo Projetado total
                 const overviewProfit = finances.mrr - stats.debtGlobal;
                 const isPositive = overviewProfit >= 0;
                 return (
                     <div className={`glass p-6 rounded-2xl border ${isPositive ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                         <p className={`text-xs uppercase font-black mb-1 ${isPositive ? 'text-emerald-400' : 'text-red-500'}`}>Lucro / Prejuízo Real</p>
                         <p className={`text-3xl font-bold mb-2 ${isPositive ? 'text-emerald-400' : 'text-red-500'}`}>
                             {isPositive ? '+' : '-'} R$ {Math.abs(overviewProfit).toFixed(2)}
                         </p>
                         <p className="text-[10px] font-bold text-white/50 border-t border-white/10 pt-2">Faturamento Mensal vs. Dívida Global</p>
                     </div>
                 );
             })()}
          </motion.div>
        )}

        {/* FINANCIAL DRE */}
        {activeTab === 'financial' && finances && (
          <motion.div key="financial" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
             {/* DRE Top Cards */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="glass p-5 rounded-2xl border border-cyan/30 bg-gradient-to-br from-cyan/10 to-transparent">
                     <p className="text-xs text-cyan uppercase font-black mb-1">Faturamento Mês (MRR)</p>
                     <p className="text-3xl text-white font-bold mb-2">R$ {finances.mrr.toFixed(2)}</p>
                     <p className="text-[10px] font-bold text-white/30 border-t border-white/5 pt-2">Mensal (R$ {finances.revenueMonthlyPlan.toFixed(2)}) + Proporcional Anual</p>
                 </div>
                 
                 <div className="glass p-5 rounded-2xl border border-white/10">
                     <p className="text-xs text-white/40 uppercase font-black mb-1">Faturamento Anual (ARR)</p>
                     <p className="text-3xl text-white font-bold mb-2">R$ {finances.arr.toFixed(2)}</p>
                     <p className="text-[10px] font-bold text-white/30 border-t border-white/5 pt-2">Receita Anual Fixada: R$ {finances.revenueYearlyPlan.toFixed(2)}</p>
                 </div>

                 <div className="glass p-5 rounded-2xl border border-red-500/20 bg-red-500/5">
                     <p className="text-xs text-red-500/80 uppercase font-black mb-1">Custos Mensais Gerais</p>
                     <p className="text-3xl text-white font-bold mb-2">R$ {(finances.monthGatewayCost + finances.monthTeacherPayouts + (visibleChartData[visibleChartData.length-1]?.custosVariaveis || 0)).toFixed(2)}</p>
                     <p className="text-[10px] font-bold text-white/30 border-t border-red-500/10 pt-2 flex flex-col gap-1">
                        <span>Gateway (5%): R$ {finances.monthGatewayCost.toFixed(2)}</span>
                        <span>Parcerias: R$ {finances.monthTeacherPayouts.toFixed(2)}</span>
                        <span>Variáveis (Admin): R$ {(visibleChartData[visibleChartData.length-1]?.custosVariaveis || 0).toFixed(2)}</span>
                     </p>
                 </div>

                 <div className="glass p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
                     <p className="text-xs text-emerald-400 uppercase font-black mb-1 flex items-center gap-1">Líquido na Conta <CheckCircle className="w-3 h-3"/></p>
                     <p className="text-3xl text-emerald-400 font-black mb-2">R$ {finances.monthNetProfit.toFixed(2)}</p>
                     <p className="text-[10px] font-bold text-white/70 border-t border-emerald-500/20 pt-2">
                        Este é o capital livre e disponível pra você.
                     </p>
                 </div>
             </div>

             {/* Gestão Contábil (Variáveis) */}
             <div className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div>
                        <h3 className="text-xl font-bold">Gestão Contábil Fixa</h3>
                        <p className="text-xs text-white/40 mt-1">Insira os custos variados (tráfego, servidores, músicas) para dedução do lucro.</p>
                    </div>
                    {/* Seletor de Meses */}
                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/10">
                        <span className="text-xs text-white/50 font-bold ml-2">Mês:</span>
                        <input 
                           type="month" 
                           value={expenseMonthYear}
                           onChange={(e) => setExpenseMonthYear(e.target.value)}
                           className="bg-transparent text-sm font-bold text-cyan outline-none rounded min-w-[120px] cursor-pointer"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <p className="text-xs text-white/50 uppercase font-bold mb-2">Tráfego & Marketing</p>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">R$</span>
                            <input type="text" placeholder="0,00" value={expensesData.marketing} onChange={(e) => handleMaskChange(e, 'marketing')} className="w-full pl-9 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm focus:border-cyan outline-none text-white transition"/>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-white/50 uppercase font-bold mb-2">Desenvolvimento & Servidor</p>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">R$</span>
                            <input type="text" placeholder="0,00" value={expensesData.development} onChange={(e) => handleMaskChange(e, 'development')} className="w-full pl-9 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm focus:border-cyan outline-none text-white transition"/>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-white/50 uppercase font-bold mb-2">Direitos Musicais</p>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">R$</span>
                            <input type="text" placeholder="0,00" value={expensesData.copyrights} onChange={(e) => handleMaskChange(e, 'copyrights')} className="w-full pl-9 pr-4 py-3 bg-black border border-white/10 rounded-xl text-sm focus:border-cyan outline-none text-white transition"/>
                        </div>
                    </div>
                    <button 
                       onClick={submitExpenses} 
                       disabled={isSavingExpenses}
                       className="w-full py-3 h-[46px] bg-cyan/10 text-cyan uppercase text-xs font-black rounded-xl border border-cyan/20 hover:bg-cyan/20 transition disabled:opacity-50"
                    >
                       {isSavingExpenses ? "Salvando..." : "Salvar no DRE"}
                    </button>
                </div>

                {/* Histórico de Lançamentos Fixos */}
                {expensesHistory.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <h4 className="text-sm font-bold text-white/60 mb-4 uppercase flex items-center gap-2">Histórico de Gastos Lançados</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider">
                                        <th className="py-3 pr-4">Mês Referência</th>
                                        <th className="py-3 px-4">Marketing</th>
                                        <th className="py-3 px-4">Dev / Servidores</th>
                                        <th className="py-3 px-4">Direitos Musicais</th>
                                        <th className="py-3 pl-4 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expensesHistory.map(exp => (
                                        <tr key={exp.month_year} className="border-b border-white/[0.02]">
                                            <td className="py-3 pr-4 font-bold text-cyan text-sm">{exp.month_year}</td>
                                            <td className="py-3 px-4 opacity-80">R$ {Number(exp.marketing).toFixed(2)}</td>
                                            <td className="py-3 px-4 opacity-80">R$ {Number(exp.development).toFixed(2)}</td>
                                            <td className="py-3 px-4 opacity-80">R$ {Number(exp.copyrights).toFixed(2)}</td>
                                            <td className="py-3 pl-4 text-right">
                                                <button onClick={() => setExpenseMonthYear(exp.month_year)} className="text-[10px] uppercase font-black text-cyan hover:text-white px-2 py-1 border border-cyan/20 rounded mr-2 transition">
                                                    Editar
                                                </button>
                                                <button onClick={() => deleteExpense(exp.month_year)} className="text-[10px] uppercase font-black text-red-500 hover:text-white px-2 py-1 border border-red-500/20 rounded transition">
                                                    Excluir
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
             </div>

             {/* Chart Analysis */}
             <div className="glass p-6 rounded-3xl border border-white/10">
                 <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">Evolução do Caixa Pianify</h3>
                        <p className="text-xs text-white/40 mt-1">Comparativo de Múltiplos Meses das suas Reservas Financeiras.</p>
                    </div>
                    {/* Filters */}
                    <div className="flex bg-black/50 p-1 rounded-xl border border-white/5">
                        {[
                           { label: "3 Meses", val: 3 },
                           { label: "6 Meses", val: 6 },
                           { label: "Ano Todo", val: 12 },
                        ].map(f => (
                           <button 
                             key={f.val}
                             onClick={() => setFinancialFilter(f.val)}
                             className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${financialFilter === f.val ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
                           >
                              {f.label}
                           </button>
                        ))}
                    </div>
                 </div>

                 <div className="h-80 w-full relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={visibleChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00eaff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00eaff" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.05} vertical={false} />
                        <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.7 }}/>
                        
                        <Area type="monotone" name="Faturamento Bruto" dataKey="faturamento" stroke="#00eaff" strokeWidth={3} fillOpacity={1} fill="url(#colorFaturamento)" />
                        <Area type="monotone" name="Lucro Líquido" dataKey="lucroLiquido" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorLucro)" />
                    </AreaChart>
                  </ResponsiveContainer>
                 </div>
             </div>
          </motion.div>
        )}

        {/* WITHDRAWALS */}
        {activeTab === 'withdrawals' && (
          <motion.div key="withdrawals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="glass p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-bold mb-4">Fila de Transferências e Saques</h3>
                {withdrawals.length === 0 ? (
                    <div className="text-white/30 text-center py-10">Nenhum saque solicitado transitando no momento.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 uppercase text-[10px] tracking-widest text-white/30 font-bold">
                                    <th className="p-4">Professor</th>
                                    <th className="p-4">Chave PIX</th>
                                    <th className="p-4">Valor</th>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.map(w => (
                                    <tr key={w.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                                        <td className="p-4">
                                            <p className="font-bold">{w.profiles?.full_name}</p>
                                            <p className="text-xs text-white/40">{w.profiles?.username}</p>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-cyan">{w.profiles?.pix_key || "Não cadastrada"}</td>
                                        <td className="p-4 font-bold text-emerald-400">R$ {w.amount.toFixed(2)}</td>
                                        <td className="p-4 text-xs text-white/50">{new Date(w.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4">
                                           <span className={`px-2 py-1 text-[10px] uppercase font-black rounded border ${
                                              w.status === 'pendente' ? 'border-amber-500/20 text-amber-500 bg-amber-500/10' :
                                              w.status === 'concluido' || w.status === 'aprovado' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10' :
                                              'border-red-500/20 text-red-500 bg-red-500/10'
                                           }`}>{w.status}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {w.status === 'pendente' && (
                                                <button onClick={() => handleActionClick(w)} className="text-xs font-bold px-4 py-2 bg-white text-black hover:bg-white/80 rounded-lg">Analisar</button>
                                            )}
                                            {w.receipt_url && (
                                                <a href={w.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan flex items-center justify-end gap-1"><FileText className="w-3 h-3"/> Comprovante</a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
          </motion.div>
        )}

        {/* TEACHERS */}
        {activeTab === 'teachers' && (
            <motion.div key="teachers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
               <div className="glass p-6 rounded-2xl border border-white/10">
                   <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                       <h3 className="text-lg font-bold">Conselho de Professores</h3>
                       <div className="relative w-full sm:w-auto">
                           <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                           <input type="text" placeholder="Buscar por nome ou e-mail..." className="w-full sm:w-64 pl-9 pr-4 py-2 bg-black border border-white/10 rounded-xl text-sm focus:border-cyan outline-none text-white" value={searchTeacher} onChange={e => setSearchTeacher(e.target.value)} />
                       </div>
                   </div>

                   <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 uppercase text-[10px] tracking-widest text-white/30 font-bold">
                                    <th className="p-4">Gestor Educacional</th>
                                    <th className="p-4">Alunos Ativos</th>
                                    <th className="p-4">Receita Estimada (Mês)</th>
                                    <th className="p-4">Total já Pago</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTeachers.map(t => (
                                    <tr key={t.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                                        <td className="p-4">
                                            <p className="font-bold text-white">{t.full_name}</p>
                                            <p className="text-xs text-white/40">{t.username}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-bold text-cyan">{t.activeStudents}</span> <span className="text-xs text-white/40">/ {t.totalStudents} indicados</span>
                                        </td>
                                        <td className="p-4 font-bold text-emerald-400">R$ {t.estimatedRevenue.toFixed(2)}</td>
                                        <td className="p-4 text-xs font-mono text-white/50">R$ {Number(t.balance_withdrawn_total).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
               </div>
            </motion.div>
        )}

      </AnimatePresence>

      {/* MODAL DE PAGAMENTO (UPLOAD) */}
      <AnimatePresence>
          {selectedWithdrawal && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-8 rounded-3xl w-full max-w-lg border border-white/10 relative">
                   <button onClick={() => setSelectedWithdrawal(null)} className="absolute top-4 right-4 p-2 text-white/40 hover:text-white"><X className="w-5 h-5"/></button>
                   
                   <h3 className="text-xl font-bold mb-1 text-white">Autorização de Transferência (PIX)</h3>
                   <p className="text-white/50 text-sm mb-6">Você está prestes a liquidar uma solicitação do professor.</p>

                   <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                       <p className="text-xs text-white/40 mb-1">Beneficiário</p>
                       <p className="font-bold text-lg text-white">{selectedWithdrawal.profiles?.full_name}</p>
                       <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                          <div>
                              <p className="text-xs text-white/40 uppercase mb-1 font-bold">Chave PIX Cadastrada</p>
                              <p className="font-mono text-cyan">{selectedWithdrawal.profiles?.pix_key || "N/A"}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs text-white/40 uppercase mb-1 font-bold">Valor da Operação</p>
                              <p className="font-bold text-xl text-emerald-400">R$ {selectedWithdrawal.amount.toFixed(2)}</p>
                          </div>
                       </div>
                   </div>

                   {/* Upload Area */}
                   <div className="mb-6">
                        <p className="text-xs font-bold text-white/50 uppercase mb-2 flex items-center gap-2"><UploadCloud className="w-4 h-4"/> Anexar Comprovante Bancário</p>
                        <label className={`w-full flex-col flex items-center justify-center border-2 border-dashed ${uploadFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/20 bg-black/50'} rounded-xl p-6 cursor-pointer hover:border-white/40 transition`}>
                            {uploadFile ? (
                                <>
                                <CheckCircle className="w-8 h-8 text-emerald-400 mb-2"/>
                                <span className="font-bold text-sm text-emerald-400 text-center">{uploadFile.name} (Pronto)</span>
                                </>
                            ) : (
                                <>
                                <UploadCloud className="w-8 h-8 text-white/20 mb-2"/>
                                <span className="text-xs text-center text-white/50">Clique para selecionar imagem/PDF<br/>ou arraste e solte</span>
                                </>
                            )}
                            <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => e.target.files && setUploadFile(e.target.files[0])} />
                        </label>
                   </div>

                   <div className="flex gap-3">
                       <button onClick={submitRejection} disabled={isUploading} className="flex-1 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-50">
                           {isUploading ? "Processando..." : "Rejeitar"}
                       </button>
                       <button onClick={submitApproval} disabled={isUploading || !uploadFile} className="flex-[2] py-3 bg-cyan text-black font-bold rounded-xl hover:bg-cyan/90 transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(0,234,255,0.2)]">
                           {isUploading ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> Enviando...</> : "Concluir e Enviar"}
                       </button>
                   </div>
                </motion.div>
             </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
