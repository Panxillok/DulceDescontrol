import React, { useState } from 'react';
import { 
  TrendingUp, 
  Landmark, 
  Calendar as LucideCalendar, 
  AlertTriangle, 
  Receipt, 
  FileText, 
  ShoppingBag, 
  Coins,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Order, Expense } from '../types';

interface FinancialModuleProps {
  orders: Order[];
  expenses: Expense[];
}

export default function FinancialModule({ orders, expenses }: FinancialModuleProps) {
  // Calendar: current month defaults to June 2026
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [highlightSeries, setHighlightSeries] = useState<'both' | 'sales' | 'expenses'>('both');

  const confirmedStates = ['Confirmado', 'En Producción', 'Listo', 'Entregado'];

  // Helper inside loop to change months
  const handlePrevMonth = () => {
    let [y, m] = selectedMonth.split('-').map(Number);
    m = m - 1;
    if (m === 0) {
      m = 12;
      y = y - 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let [y, m] = selectedMonth.split('-').map(Number);
    m = m + 1;
    if (m === 13) {
      m = 1;
      y = y + 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const getMonthNameSpanish = (ymStr: string) => {
    const [y, m] = ymStr.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthIndex = parseInt(m, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} del ${y}`;
    }
    return ymStr;
  };

  // FILTERED ARRAY TARGETED TO THE SELECTED YEAR-MONTH
  const monthlyOrders = orders.filter(order => order.deliveryDate.startsWith(selectedMonth));
  const monthlyExpenses = expenses.filter(exp => exp.date.startsWith(selectedMonth));

  // Confirmed monthly revenue
  const confirmedIncome = monthlyOrders
    .filter(order => confirmedStates.includes(order.status))
    .reduce((sum, order) => sum + order.total + (order.deliveryFee || 0), 0);

  // Operational expenses
  const totalExpenses = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Net Operational Profit (Utilidad)
  const netProfit = confirmedIncome - totalExpenses;

  // VAT Math:
  // Sales include 19% IVA, so:
  const ivaDebitoFiscal = confirmedIncome * 0.19 / 1.19;

  // Invoices (Facturas) registered as expenses grant IVA Crédito Fiscal.
  const totalFacturasAmount = monthlyExpenses
    .filter(exp => exp.type === 'Factura' || (!['Factura', 'Boleta'].includes(exp.type) && exp.type !== 'Boleta'))
    .reduce((sum, exp) => sum + exp.amount, 0);

  const ivaCreditoFiscal = totalFacturasAmount * 0.19 / 1.19;

  // Net tax calculation
  const netIvaValue = ivaDebitoFiscal - ivaCreditoFiscal;
  
  const finalIvaPayable = netIvaValue > 0 ? netIvaValue : 0;
  const finalIvaCreditCarryover = netIvaValue < 0 ? Math.abs(netIvaValue) : 0;

  // CLP formatting helper
  const formatCLP = (val: number) => {
    return '$ ' + Math.round(val).toLocaleString('es-CL');
  };

  // RECHARTS LINE-CHART: Group daily values for the chosen year-month
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  const dailyChartData = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dateStrFilter = `${selectedMonth}-${String(day).padStart(2, '0')}`;
    
    // Confirmed income on this date
    const dayIncome = monthlyOrders
      .filter(o => o.deliveryDate === dateStrFilter && confirmedStates.includes(o.status))
      .reduce((sum, o) => sum + o.total + (o.deliveryFee || 0), 0);

    // Sum of expenses on this date
    const dayExpense = monthlyExpenses
      .filter(e => e.date === dateStrFilter)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      day,
      label: `${day}`,
      Ventas: Math.round(dayIncome),
      Egresos: Math.round(dayExpense)
    };
  });

  // Group monthly orders by product name for ranking list
  const productSalesMap = monthlyOrders.reduce((acc: { [key: string]: { name: string; salesCount: number; cashTotal: number } }, order) => {
    const key = order.productName;
    if (!acc[key]) {
      acc[key] = { name: key, salesCount: 0, cashTotal: 0 };
    }
    acc[key].salesCount += 1;
    acc[key].cashTotal += order.total;
    return acc;
  }, {});

  const bestSellers = Object.values(productSalesMap)
    .sort((a, b) => b.cashTotal - a.cashTotal)
    .slice(0, 5);

  const maxSalesValue = bestSellers.length > 0 ? Math.max(...bestSellers.map(b => b.cashTotal)) : 100;

  // Custom tooltips for graphs
  const CustomLineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#2C2114] text-[#FAF6EE] p-3 rounded-xl border border-[#40311F] text-xs font-mono shadow-xl space-y-1">
          <p className="font-bold border-b border-white/10 pb-0.5 mb-1 text-center">Día {payload[0].payload.day}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex justify-between gap-4">
              <span className="text-gray-300">{p.name === 'Ventas' ? '📈 Ventas' : '📉 Egresos'}:</span>
              <span className={`font-black ${p.name === 'Ventas' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCLP(p.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" id="monthly-financial-dashboard">
      
      {/* HEADER CONTROLS INTERACTIVE MONTH SELECTOR CALENDAR */}
      <div className="bg-[#FAF6EE] p-4 rounded-3xl border border-[#EADEC9] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-[#FAF0DD] rounded-xl text-[#8E5E2B] border border-[#ECD9BD]">
            <LucideCalendar className="w-5 h-5 text-[#8A755D]" />
          </span>
          <div className="text-left">
            <span className="text-[10px] text-[#A18A68] uppercase font-bold tracking-wider block">Calendario Operativo</span>
            <h3 className="text-base font-bold text-[#2C2114]">
              Análisis Mensual: <span className="text-[#00652c] font-black">{getMonthNameSpanish(selectedMonth)}</span>
            </h3>
          </div>
        </div>

        {/* Date picking controllers */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="w-10 h-10 bg-white hover:bg-[#FAF9F5] border border-[#ECE0CC] rounded-xl flex items-center justify-center text-[#73624E] transition-all cursor-pointer"
            title="Mes Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedMonth(e.target.value);
              }
            }}
            className="bg-white border border-[#D0C2AB] rounded-xl px-3 py-2 text-xs font-bold text-[#2C2114] focus:outline-none focus:ring-1 focus:ring-[#00652c] cursor-pointer"
          />

          <button
            onClick={handleNextMonth}
            className="w-10 h-10 bg-white hover:bg-[#FAF9F5] border border-[#ECE0CC] rounded-xl flex items-center justify-center text-[#73624E] transition-all cursor-pointer"
            title="Mes Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* A. GENERAL STATS GRID - CHILEAN IVA STANDARDS CO-EXISTING */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 - Sales Income */}
        <div className="bg-[#FDFBF7] p-5 rounded-3xl border border-[#EADEC9] shadow-xs flex flex-col justify-between text-left">
          <div className="flex items-center justify-between pb-2 border-b border-[#FAF6EE]">
            <span className="text-[10px] font-bold text-[#73624E] uppercase tracking-wider">Ventas de {getMonthNameSpanish(selectedMonth).split(' ')[0]}</span>
            <span className="p-1.5 bg-[#EAFEEA] rounded-xl text-[#00652c] border border-[#BFF6C3]">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="pt-4">
            <span className="text-xl font-mono font-black text-[#00652c]">
              {formatCLP(confirmedIncome)}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-[#8C7A65] mt-1.5 font-medium leading-none">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00652c]" /> 
              Neto {formatCLP(confirmedIncome - ivaDebitoFiscal)} + IVA
            </div>
          </div>
        </div>

        {/* Metric 2 - Total Expenses */}
        <div className="bg-[#FDFBF7] p-5 rounded-3xl border border-[#EADEC9] shadow-xs flex flex-col justify-between text-left">
          <div className="flex items-center justify-between pb-2 border-b border-[#FAF6EE]">
            <span className="text-[10px] font-bold text-[#73624E] uppercase tracking-wider">Egresos del Mes</span>
            <span className="p-1.5 bg-[#FFF1F1] rounded-xl text-[#A81A1A] border border-[#FFE2E2]">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="pt-4">
            <span className="text-xl font-mono font-black text-[#A81A1A]">
              {formatCLP(totalExpenses)}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-[#8C7A65] mt-1.5 font-medium leading-none">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A81A1A]" />
              Facturas y boletas del periodo
            </div>
          </div>
        </div>

        {/* Metric 3 - Net Operating Profit */}
        <div className="bg-[#FDFBF7] p-5 rounded-3xl border border-[#EADEC9] shadow-xs flex flex-col justify-between text-left">
          <div className="flex items-center justify-between pb-2 border-b border-[#FAF6EE]">
            <span className="text-[10px] font-bold text-[#73624E] uppercase tracking-wider">Utilidad Neta Neto</span>
            <span className={`p-1.5 rounded-xl border ${
              netProfit >= 0 ? 'bg-[#EAFEEA] text-[#00652c] border-[#BFF6C3]' : 'bg-[#FFF5F5] text-[#A81A1A] border-[#FFD1D1]'
            }`}>
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <div className="pt-4">
            <span className={`text-xl font-mono font-black ${netProfit >= 0 ? 'text-[#00652c]' : 'text-[#A81A1A]'}`}>
              {formatCLP(netProfit)}
            </span>
            <div className="flex items-center gap-1 text-[10px] mt-1.5 font-medium leading-none">
              {netProfit >= 0 ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /> 
                  <span className="text-green-700 font-semibold">Rentabilidad positiva</span>
                </>
              ) : (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" /> 
                  <span className="text-red-700 font-semibold">Déficit operacional</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Metric 4 - Chilean Taxes balance */}
        <div className="bg-[#FDFBF7] p-5 rounded-3xl border border-[#EADEC9] shadow-xs flex flex-col justify-between text-left">
          <div className="flex items-center justify-between pb-2 border-b border-[#FAF6EE]">
            <span className="text-[10px] font-bold text-[#73624E] uppercase tracking-wider">Caja Fisco (Declara F29)</span>
            {netIvaValue >= 0 ? (
              <span className="p-1.5 bg-[#FFFBEB] rounded-xl text-[#D97706] border border-[#FDE68A]">
                <FileText className="w-4 h-4" />
              </span>
            ) : (
              <span className="p-1.5 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-200">
                <FileText className="w-4 h-4" />
              </span>
            )}
          </div>
          <div className="pt-4">
            {netIvaValue >= 0 ? (
              <div>
                <span className="text-xl font-mono font-black text-[#B45309]">
                  {formatCLP(finalIvaPayable)}
                </span>
                <p className="text-[10px] text-amber-800 font-semibold mt-1.5 leading-none">
                  A Pagar (Débito {formatCLP(ivaDebitoFiscal)} - Crédito {formatCLP(ivaCreditoFiscal)})
                </p>
              </div>
            ) : (
              <div>
                <span className="text-xl font-mono font-black text-emerald-700">
                  {formatCLP(finalIvaCreditCarryover)}
                </span>
                <p className="text-[10px] text-emerald-800 font-semibold mt-1.5 leading-none">
                  Remanente Fiscal (A favor del mes)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* B. DETAILED GRID CHART BENTO LAYOUT (With Sales vs Expenses Line Chart!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: INCOMES VS EXPENSES COMPARISON (LINE CHART) */}
        <div className="lg:col-span-8 bg-[#FDFBF7] border border-[#EADEC9] rounded-3xl p-6 shadow-xs flex flex-col justify-between text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EADEC9]/40 pb-3">
            <div>
              <h3 className="font-sans font-black text-base text-[#2C2114] flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#00652c]" /> Rendimiento Diario de Caja
              </h3>
              <p className="text-xs text-[#73624E] mt-0.5">
                Gráfico lineal comparativo de ingresos (ventas) versus egresos cargados día por día
              </p>
            </div>

            {/* Highlighting series toggles */}
            <div className="flex gap-1 bg-white p-1 rounded-xl border border-[#D0C2AB] self-start">
              <button
                onClick={() => setHighlightSeries('both')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  highlightSeries === 'both' ? 'bg-[#00652c] text-white shadow-2xs' : 'text-[#73624E] hover:bg-[#FAF9F5]'
                }`}
              >
                Ambos
              </button>
              <button
                onClick={() => setHighlightSeries('sales')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  highlightSeries === 'sales' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-[#73624E] hover:bg-[#FAF9F5]'
                }`}
              >
                Ventas
              </button>
              <button
                onClick={() => setHighlightSeries('expenses')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  highlightSeries === 'expenses' ? 'bg-rose-600 text-white shadow-2xs' : 'text-[#73624E] hover:bg-[#FAF9F5]'
                }`}
              >
                Egresos
              </button>
            </div>
          </div>

          {/* Daily line chart render element */}
          <div className="bg-white border border-[#EADEC9]/60 p-4 rounded-2xl">
            <span className="text-xs font-bold text-[#73624E] block mb-3 border-b border-gray-50 pb-1">Análisis Diario del Periodo</span>
            <div className="h-64 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyChartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="#73624E" />
                  <XAxis dataKey="label" stroke="#73624E" fontSize={10} tickLine={false} />
                  <YAxis stroke="#73624E" fontSize={9} />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Line 
                    type="monotone" 
                    dataKey="Ventas" 
                    stroke="#10b981" 
                    strokeWidth={highlightSeries === 'sales' || highlightSeries === 'both' ? 3.5 : 1} 
                    opacity={highlightSeries === 'expenses' ? 0.25 : 1}
                    activeDot={{ r: 6 }} 
                    dot={{ r: highlightSeries === 'sales' ? 4 : 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Egresos" 
                    stroke="#ef4444" 
                    strokeWidth={highlightSeries === 'expenses' || highlightSeries === 'both' ? 3.5 : 1}
                    opacity={highlightSeries === 'sales' ? 0.25 : 1}
                    activeDot={{ r: 6 }} 
                    dot={{ r: highlightSeries === 'expenses' ? 4 : 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TOP PRODUCTS - BEST SELLERS (4 columns sidebar) */}
        <div className="lg:col-span-4 bg-[#FDFBF7] border border-[#EADEC9] rounded-3xl p-6 flex flex-col justify-between shadow-xs text-left">
          <div>
            <h3 className="font-sans font-extrabold text-base text-[#2C2114] flex items-center gap-1.5 pb-2 border-b border-[#ECE0CC]">
              <ShoppingBag className="w-5 h-5 text-[#8A755D]" /> Recaudación de Panes y Pasteles
            </h3>
            <p className="text-xs text-[#73624E] mt-1.5 mb-4 leading-normal">
              Desglose de productos con mayor volumen y recaudación en {getMonthNameSpanish(selectedMonth)}
            </p>

            <div className="space-y-4">
              {bestSellers.length === 0 ? (
                <div className="p-8 text-center text-[#8C7A65] bg-[#FAF6EE] rounded-xl border border-dashed border-[#DED0B6] my-4">
                  <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs">No hay registros de pedidos aún en el rango de este mes</p>
                </div>
              ) : (
                bestSellers.map((item, idx) => {
                  const sharePercent = ((item.cashTotal / maxSalesValue) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-[#2C2114]">
                        <span className="truncate max-w-[170px]">{idx + 1}. {item.name}</span>
                        <span className="font-mono text-gray-500">{item.salesCount} uds</span>
                      </div>
                      
                      {/* High Contrast Custom Progress Bar */}
                      <div className="w-full bg-white h-2.5 rounded-full border border-[#ECE0CC] overflow-hidden">
                        <div 
                          className="bg-[#00652c] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(sharePercent, 8)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                        <span>Recaudado</span>
                        <span className="text-[#00652c] font-bold">{formatCLP(item.cashTotal)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-[#EAFEEA] border border-[#BFF6C3] rounded-2xl p-3.5 mt-6 flex gap-2.5">
            <TrendingUp className="w-5 h-5 text-[#00652c] shrink-0" />
            <p className="text-[11px] text-[#00652c] leading-relaxed font-semibold">
              <strong>Plan de Compras:</strong> Use el remanente de IVA acumulado en facturas de insumos para compensar el débito fiscal generado por sus ventas del mes.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
