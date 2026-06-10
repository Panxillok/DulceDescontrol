import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Landmark, 
  Calendar, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Receipt, 
  FileText, 
  ShoppingBag, 
  Coins,
  ChevronDown,
  Info
} from 'lucide-react';
import { Order, Expense } from '../types';

interface FinancialModuleProps {
  orders: Order[];
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export default function FinancialModule({ orders, expenses, onAddExpense, onDeleteExpense }: FinancialModuleProps) {
  // 1. Calculations
  const confirmedStates = ['Confirmado', 'En Producción', 'Listo', 'Entregado'];
  
  // Confirmed monthly revenue
  const confirmedIncome = orders
    .filter(order => confirmedStates.includes(order.status))
    .reduce((sum, order) => sum + order.total + (order.deliveryFee || 0), 0);

  // Operational expenses
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Net Operational Profit (Utilidad)
  const netProfit = confirmedIncome - totalExpenses;

  // VAT (IVA @ 19% on income - default Chilean/typical standard rate)
  const ivaRate = 0.19;
  const ivaPayable = confirmedIncome * ivaRate;

  // Active inputs state for new expense form
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseType, setExpenseType] = useState<Expense['type']>('Boleta');
  const [expenseDoc, setExpenseDoc] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Form submission
  const handleSubmitExpense = (e: FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount || isNaN(Number(expenseAmount))) return;

    onAddExpense({
      description: expenseDesc.trim(),
      amount: Number(expenseAmount),
      type: expenseType,
      documentNumber: expenseDoc.trim() || undefined,
      date: expenseDate
    });

    // Reset inputs
    setExpenseDesc('');
    setExpenseAmount('');
    setExpenseDoc('');
  };

  // Group orders by product name for ranking list
  const productSalesMap = orders.reduce((acc: { [key: string]: { name: string; salesCount: number; cashTotal: number } }, order) => {
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

  return (
    <div className="space-y-6" id="monthly-financial-dashboard">
      {/* A. GENERAL STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 - Income */}
        <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#EADEC9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#FAF6EE]">
            <span className="text-xs font-bold text-[#73624E] uppercase tracking-wider">Ingresos Confirmados</span>
            <span className="p-1.5 bg-[#EAFEEA] rounded-lg text-[#00652c] border border-[#BFF6C3]">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="pt-4">
            <span className="text-2xl font-mono font-bold text-[#00652c]">
              ${confirmedIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-[#8C7A65] mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#00652c]" /> 
              Incluye despachos/entregas confirmados
            </div>
          </div>
        </div>

        {/* Metric 2 - Expenses */}
        <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#EADEC9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#FAF6EE]">
            <span className="text-xs font-bold text-[#73624E] uppercase tracking-wider">Egresos Totales</span>
            <span className="p-1.5 bg-[#FFF1F1] rounded-lg text-[#A81A1A] border border-[#FFE2E2]">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="pt-4">
            <span className="text-2xl font-mono font-bold text-[#A81A1A]">
              ${totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-[#8C7A65] mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#A81A1A]" />
              Boletas, Facturas e Insumos cargados
            </div>
          </div>
        </div>

        {/* Metric 3 - Operating Profit */}
        <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#EADEC9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#FAF6EE]">
            <span className="text-xs font-bold text-[#73624E] uppercase tracking-wider">Utilidad Neta</span>
            <span className={`p-1.5 rounded-lg border ${
              netProfit >= 0 ? 'bg-[#EAFEEA] text-[#00652c] border-[#BFF6C3]' : 'bg-[#FFF5F5] text-[#A81A1A] border-[#FFD1D1]'
            }`}>
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <div className="pt-4">
            <span className={`text-2xl font-mono font-bold ${netProfit >= 0 ? 'text-[#00652c]' : 'text-[#A81A1A]'}`}>
              ${netProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1 text-[10px] mt-1">
              {netProfit >= 0 ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" /> 
                  <span className="text-green-700 font-semibold">Flujo de caja saludable</span>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-bounce" /> 
                  <span className="text-red-700 font-semibold">Gastos superan ingresos</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Metric 4 - VAT */}
        <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#EADEC9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#FAF6EE]">
            <span className="text-xs font-bold text-[#73624E] uppercase tracking-wider">IVA a Pagar (19%)</span>
            <span className="p-1.5 bg-[#FFFBEB] rounded-lg text-[#D97706] border border-[#FDE68A]">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="pt-4">
            <span className="text-2xl font-mono font-bold text-[#B45309]">
              ${ivaPayable.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-[#8C7A65] mt-1">
              <Info className="w-3.5 h-3.5 text-[#B45309]" /> 
              Estimación del IVA sobre ventas totales
            </div>
          </div>
        </div>
      </div>

      {/* B. DETAILED GRID (LOGS & EXTRAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* B1. INLINE FORM & LOGS OF EXPENSES (7 columns) */}
        <div className="lg:col-span-8 bg-[#FDFBF7] border border-[#EADEC9] rounded-2xl p-6 flex flex-col">
          <div className="border-b border-[#ECE0CC] pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-sans font-bold text-lg text-[#2C2114] flex items-center gap-1.5">
                <Receipt className="w-5 h-5 text-[#8A755D]" /> Registro de Egresos y Gastos
              </h3>
              <p className="text-xs text-[#73624E] mt-0.5">
                Consolida boletas, facturas e insumos que se descontarán de la utilidad del mes
              </p>
            </div>
          </div>

          {/* New Expense registration inline form */}
          <form onSubmit={handleSubmitExpense} className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#FAF6EE] p-4 rounded-xl border border-[#ECE0CC] mb-4">
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-bold text-[#2C2114] uppercase tracking-wider">Descripción / Detalle</label>
              <input
                type="text"
                required
                placeholder="Ej. Gas Licuado, Harinas, etc."
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D0C2AB] bg-white px-3 py-1.5 text-xs focus:border-[#00652c] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-[#2C2114] uppercase tracking-wider">Monto (MXN)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D0C2AB] bg-white px-3 py-1.5 text-xs font-mono focus:border-[#00652c] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-[#2C2114] uppercase tracking-wider">Tipo</label>
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value as Expense['type'])}
                className="mt-1 w-full rounded-lg border border-[#D0C2AB] bg-white px-2 py-1.5 text-xs focus:border-[#00652c] focus:outline-none"
              >
                <option value="Boleta">Boleta</option>
                <option value="Factura">Factura</option>
                <option value="Insumo">Insumo</option>
                <option value="Servicios">Servicio</option>
                <option value="Otros">Otro</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-[#2C2114] uppercase tracking-wider">Documento #</label>
              <input
                type="text"
                placeholder="Opcional"
                value={expenseDoc}
                onChange={(e) => setExpenseDoc(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D0C2AB] bg-white px-2 py-1.5 text-xs focus:border-[#00652c] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full bg-[#00652c] hover:bg-[#005123] text-white py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer touch-target-min"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>
          </form>

          {/* Expenses Table */}
          <div className="min-h-[220px] max-h-[340px] overflow-y-auto border border-[#EADEC9] rounded-xl bg-white">
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-[#8C7A65] flex flex-col items-center justify-center">
                <Receipt className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm font-medium">No se han registrado gastos en este mes</p>
                <p className="text-xs text-[#A18A68]">Usa la barra de arriba para dar de alta egresos</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF6EE] text-[#73624E] border-b border-[#ECE0CC] font-bold">
                    <th className="p-3">Detalle / Egreso</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Doc #</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3 text-right">Monto</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF6EE]">
                  <AnimatePresence initial={false}>
                    {expenses.map((exp) => (
                      <motion.tr
                        key={exp.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="hover:bg-[#FAF6EE]/40 transition-colors"
                      >
                        <td className="p-3 font-semibold text-[#2C2114]">{exp.description}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            exp.type === 'Factura' ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]' :
                            exp.type === 'Boleta' ? 'bg-[#FAF5FF] text-[#6B21A8] border border-[#E9D5FF]' :
                            exp.type === 'Insumo' ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]' :
                            exp.type === 'Servicios' ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {exp.type}
                          </span>
                        </td>
                        <td className="p-3 text-gray-400 font-mono">{exp.documentNumber || '-'}</td>
                        <td className="p-3 text-gray-500">{exp.date}</td>
                        <td className="p-3 text-right font-mono font-bold text-[#A81A1A]">
                          -${exp.amount.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer transition-colors"
                            title="Eliminar egreso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* B2. TOP PRODUCTS - BEST SELLERS (4 columns) */}
        <div className="lg:col-span-4 bg-[#FDFBF7] border border-[#EADEC9] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-bold text-lg text-[#2C2114] flex items-center gap-1.5 pb-2 border-b border-[#ECE0CC]">
              <ShoppingBag className="w-5 h-5 text-[#8A755D]" /> Productos Más Vendidos
            </h3>
            <p className="text-xs text-[#73624E] mt-1.5 mb-4">
              Desglose de productos con mayor recaudación en el mes actual
            </p>

            <div className="space-y-4">
              {bestSellers.length === 0 ? (
                <div className="p-8 text-center text-[#8C7A65] bg-[#FAF6EE] rounded-xl border border-dashed border-[#DED0B6] my-4">
                  <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs">No hay registros de pedidos aún en el rango mensual</p>
                </div>
              ) : (
                bestSellers.map((item, idx) => {
                  const sharePercent = ((item.cashTotal / maxSalesValue) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-[#2C2114]">
                        <span className="truncate max-w-[170px]">{idx + 1}. {item.name}</span>
                        <span className="font-mono text-gray-500">{item.salesCount} vendidos</span>
                      </div>
                      
                      {/* Custom High Contrast Progress Bar */}
                      <div className="w-full bg-[#FAF6EE] h-3 rounded-full border border-[#ECE0CC] overflow-hidden">
                        <div 
                          className="bg-[#00652c] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(sharePercent, 8)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                        <span>Recaudado</span>
                        <span className="text-[#00652c] font-bold">${item.cashTotal.toLocaleString('es-MX', { minimumFractionDigits: 1 })}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-[#EAFEEA] border border-[#BFF6C3] rounded-xl p-3 mt-6 flex gap-2.5">
            <TrendingUp className="w-5 h-5 text-[#00652c] shrink-0" />
            <p className="text-[11px] text-[#00652c] leading-relaxed">
              <strong>Estrategia de Ventas:</strong> Los productos más demandados pueden requerir pedidos de ingredientes con mayor anticipación y volumen para proteger los márgenes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
