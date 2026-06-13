import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Receipt, 
  Scale, 
  TrendingDown, 
  Layers, 
  Coins, 
  FileText,
  Calendar,
  Tag,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Expense, Ingredient } from '../types';

interface ExpensesModuleProps {
  expenses: Expense[];
  ingredients: Ingredient[];
  onAddExpense: (expense: Omit<Expense, 'id'> & { quantity?: number; unit?: string; ingredientId?: string }) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdateIngredientStock?: (id: string, newStock: number, status: 'Crítico' | 'Agotándose' | 'Suficiente') => void;
}

export default function ExpensesModule({ 
  expenses, 
  ingredients, 
  onAddExpense, 
  onDeleteExpense,
  onUpdateIngredientStock 
}: ExpensesModuleProps) {
  // Collapsible Form State
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [supplier, setSupplier] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [docType, setDocType] = useState<'Boleta' | 'Factura'>('Factura');
  const [docNumber, setDocNumber] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<'Insumos' | 'Servicios' | 'Maquinaria' | 'Otros'>('Insumos');
  
  // Supplies specific state
  const [associatedIngredientId, setAssociatedIngredientId] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('kg');

  // Sequential builder helper for folio document
  const generateSeqNumber = (type: 'Boleta' | 'Factura') => {
    const prefix = type === 'Factura' ? 'FAC-' : 'BOL-';
    const numbers = expenses
      .map(e => e.documentNumber || '')
      .filter(num => num.startsWith(prefix))
      .map(num => parseInt(num.split('-')[1], 10))
      .filter(n => !isNaN(n));
    
    // Default base offset sequence
    const maxVal = numbers.length > 0 ? Math.max(...numbers) : 1000;
    return `${prefix}${maxVal + 1}`;
  };

  // Pre-seed sequence number on mount or change
  React.useEffect(() => {
    if (!docNumber) {
      setDocNumber(generateSeqNumber(docType));
    }
  }, []);

  const handleDocTypeChange = (newType: 'Boleta' | 'Factura') => {
    setDocType(newType);
    setDocNumber(generateSeqNumber(newType));
  };

  // Filter/search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDocType, setFilterDocType] = useState<'todos' | 'Boleta' | 'Factura'>('todos');
  const [filterCategory, setFilterCategory] = useState<string>('todos');

  // CLP formatting helper
  const formatCLP = (val: number) => {
    return '$ ' + Math.round(val).toLocaleString('es-CL');
  };

  const amount = Number(amountInput) || 0;
  
  // Chilean taxation math:
  // Net + 19% IVA = Total
  // Net = Total / 1.19
  // IVA = Net * 0.19
  const computedNet = amount / 1.19;
  const computedIva = amount - computedNet;
  
  // Only Facturas allow Crédito Fiscal
  const isEligibleForTaxCredit = docType === 'Factura';
  const taxCredit = isEligibleForTaxCredit ? computedIva : 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    let finalDesc = '';
    if (category === 'Insumos') {
      const targetIng = ingredients.find(i => i.id === associatedIngredientId);
      const prodName = targetIng ? targetIng.name : 'Insumos';
      finalDesc = `${prodName} (${supplier || 'Proveedor Genérico'})`;
    } else {
      finalDesc = description.trim();
    }

    if (!finalDesc.trim() || !amountInput || amount <= 0) {
      alert('Por favor complete la descripción/proveedor y un monto válido.');
      return;
    }

    const qVal = Number(quantityInput) || undefined;
    const finalDocNum = docNumber.trim() || generateSeqNumber(docType);

    const expenseData = {
      description: finalDesc,
      amount: amount,
      type: docType,
      documentNumber: finalDocNum,
      date: dateInput,
      category,
      ingredientId: category === 'Insumos' ? (associatedIngredientId || undefined) : undefined,
      quantity: category === 'Insumos' ? qVal : undefined,
      unit: category === 'Insumos' ? selectedUnit : undefined
    };

    onAddExpense(expenseData);

    // If associated to an ingredient, automatically update inventory stock
    if (category === 'Insumos' && associatedIngredientId && qVal && onUpdateIngredientStock) {
      const targetIng = ingredients.find(i => i.id === associatedIngredientId);
      if (targetIng) {
        let increment = qVal;
        
        const baseUnit = targetIng.unit.toLowerCase();
        const inputUnit = selectedUnit.toLowerCase();

        if ((baseUnit === 'kg' || baseUnit === 'kilo') && (inputUnit === 'g' || inputUnit === 'gramo' || inputUnit === 'gramos')) {
          increment = qVal / 1000;
        } else if ((baseUnit === 'litros' || baseUnit === 'l' || baseUnit === 'litro' || baseUnit === 'lts') && (inputUnit === 'ml' || inputUnit === 'mililitros')) {
          increment = qVal / 1000;
        } else if (inputUnit === 'docenas' || inputUnit === 'docena') {
          increment = qVal * 12;
        }

        const newStock = Number((targetIng.currentStock + increment).toFixed(4));
        
        let status: 'Crítico' | 'Agotándose' | 'Suficiente' = 'Suficiente';
        if (newStock < targetIng.criticalLimit * 0.4) {
          status = 'Crítico';
        } else if (newStock < targetIng.criticalLimit) {
          status = 'Agotándose';
        }

        onUpdateIngredientStock(targetIng.id, newStock, status);
      }
    }

    // Reset fields
    setDescription('');
    setSupplier('');
    setAmountInput('');
    setQuantityInput('');
    setAssociatedIngredientId('');
    // Auto-advance next sequence number!
    setDocNumber(generateSeqNumber(docType));
    
    // Close the form panel for compact workflow!
    setIsFormOpen(false);
  };

  // Filter listed expenditures
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (exp.documentNumber && exp.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Fallbacks for older seeds
    const itemType = (exp.type === 'Boleta' || exp.type === 'Factura') ? exp.type : 'Factura';
    const matchesDocType = filterDocType === 'todos' || itemType === filterDocType;
    
    // Map older category classifications
    let computedCat = 'Otros';
    if (exp.category) {
      computedCat = exp.category;
    } else if (exp.type === 'Insumo') {
      computedCat = 'Insumos';
    } else if (exp.type === 'Servicios') {
      computedCat = 'Servicios';
    }
    
    const matchesCategory = filterCategory === 'todos' || computedCat === filterCategory;

    return matchesSearch && matchesDocType && matchesCategory;
  });

  // Calculate Aggregates for filters view
  const totalFilt = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalFiltNet = filteredExpenses.reduce((sum, e) => sum + (e.amount / 1.19), 0);
  const totalFiltIva = totalFilt - totalFiltNet;
  
  // Total Crédito Fiscal is the sum of IVA from Factura document types
  const totalFiltCredit = filteredExpenses.reduce((sum, e) => {
    const isFact = (e.type === 'Factura' || (!['Factura', 'Boleta'].includes(e.type) && e.type !== 'Boleta')); // default custom old types as Factura for tax safety or if it is Factura
    return sum + (isFact ? (e.amount - (e.amount / 1.19)) : 0);
  }, 0);

  return (
    <div className="space-y-6" id="expenses-module-view">
      {/* 1. TOP CARDS TAX AND EXPENSE BREAKDOWN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#EADEC9] shadow-3xs flex flex-col justify-between">
          <div className="pb-1 border-b border-[#FAF6EE] flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#73624E] uppercase tracking-wider">Egresos Filtrados</span>
            <span className="p-1.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="pt-4">
            <span className="text-xl font-mono font-black text-rose-800">{formatCLP(totalFilt)}</span>
            <p className="text-[10px] text-[#8C7A65] mt-1">Suma de egresos seleccionados</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#EADEC9] shadow-3xs flex flex-col justify-between">
          <div className="pb-1 border-b border-[#FAF6EE] flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#73624E] uppercase tracking-wider">Base Neta</span>
            <span className="p-1.5 bg-slate-50 text-slate-700 border border-slate-100 rounded-xl">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="pt-4">
            <span className="text-xl font-mono font-bold text-slate-800">{formatCLP(totalFiltNet)}</span>
            <p className="text-[10px] text-[#8C7A65] mt-1">Excluye el 19% de IVA de boletas/facturas</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#EADEC9] shadow-3xs flex flex-col justify-between truncate">
          <div className="pb-1 border-b border-[#FAF6EE] flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#00652c] uppercase tracking-wider">Crédito Fiscal Acumulado</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl animate-pulse">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="pt-4">
            <span className="text-xl font-mono font-black text-[#00652c]">{formatCLP(totalFiltCredit)}</span>
            <p className="text-[10px] text-emerald-800 font-medium mt-1">Recuperable solo vía Facturas de compra</p>
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE REGISTRATION FORM TRIGGER HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#FDFBF7] p-5 rounded-3xl border border-[#EADEC9] gap-4 shadow-3xs">
        <div>
          <h2 className="font-sans font-black text-lg text-[#2C2114] tracking-tight flex items-center gap-2">
            <Receipt className="w-5.5 h-5.5 text-rose-800" /> Registro de Egresos y Gastos
          </h2>
          <p className="text-xs text-[#73624E]">Rendición contable de documentos de descarte e incremento automático de stock</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
            isFormOpen 
              ? 'bg-rose-800 text-white hover:bg-rose-950' 
              : 'bg-[#00652c] text-white hover:bg-[#005123]'
          }`}
          type="button"
        >
          <Plus className={`w-4 h-4 transition-transform duration-300 ${isFormOpen ? 'rotate-45 text-white' : 'text-emerald-200'}`} />
          {isFormOpen ? 'Ocultar Formulario de Ingreso' : '+ Registrar Gasto o Compra'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: EXPRESSIVE REGISTRATION FORM (COLLAPSIBLE) */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -30, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: -30, width: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="lg:col-span-4 bg-white border border-[#EADEC9] rounded-3xl p-6 shadow-xs flex flex-col h-fit"
            >
              <h3 className="font-sans font-extrabold text-base text-[#2C2114] flex items-center gap-2 pb-3 border-b border-[#EADEC9]/60 mb-4 text-[#00652c]">
                <Plus className="w-5 h-5 text-[#00652c]" /> Facturar Egreso / Stock
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category selection */}
                <div>
                  <label className="block text-xs font-bold text-[#73624E] uppercase tracking-wide">categoría del egreso</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value as any);
                      // Clear associated stock if they switch from Insumos
                      if (e.target.value !== 'Insumos') {
                        setAssociatedIngredientId('');
                        setQuantityInput('');
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-[#D0C2AB] bg-[#FDFBF7] px-3 py-2.5 text-xs focus:border-[#00652c] focus:outline-none font-semibold"
                  >
                    <option value="Insumos">Compra de Insumo / Materia Prima</option>
                    <option value="Servicios">Servicios Básicos (Luz, Agua, Gas)</option>
                    <option value="Maquinaria">Maquinaria y Herramientas de Horno</option>
                    <option value="Otros">Otros Gastos Generales</option>
                  </select>
                </div>

                {/* If Insumos: Show Supplier Input and Auto Ingredient linking */}
                {category === 'Insumos' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#73624E] uppercase tracking-wide">Proveedor / Distribuidor</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Collico, Soprole, Linderos"
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#D0C2AB] bg-[#FDFBF7] px-3.5 py-2.5 text-xs focus:border-[#00652c] focus:outline-none placeholder:text-gray-400 font-semibold"
                      />
                    </div>

                    <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-[#00652c]" />
                        <span className="text-[11px] font-bold text-emerald-800">Recalcular Auto-Stock e Inventarios</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#556B2F] uppercase">Nombre del Producto o Insumo</label>
                        <select
                          required
                          value={associatedIngredientId}
                          onChange={(e) => {
                            const newId = e.target.value;
                            setAssociatedIngredientId(newId);
                            // Auto-set unit helper
                            const match = ingredients.find(i => i.id === newId);
                            if (match) {
                              const bUnit = match.unit.toLowerCase();
                              if (bUnit === 'kg') setSelectedUnit('g');
                              else if (bUnit === 'litros' || bUnit === 'litro' || bUnit === 'l') setSelectedUnit('ml');
                              else setSelectedUnit('unidades');
                            }
                          }}
                          className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-2 py-1.5 text-xs focus:border-[#00652c] focus:outline-none font-semibold text-[#2C2114]"
                        >
                          <option value="">-- Seleccionar de catálogo --</option>
                          {ingredients.map(ing => (
                            <option key={ing.id} value={ing.id}>{ing.name} (Stock: {ing.currentStock} {ing.unit})</option>
                          ))}
                        </select>
                      </div>

                      {associatedIngredientId && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-[#556B2F] uppercase">Cantidad</label>
                            <input
                              type="number"
                              placeholder="Ej. 10"
                              required
                              min="0.01"
                              step="any"
                              value={quantityInput}
                              onChange={(e) => setQuantityInput(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs focus:border-[#00652c] focus:outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-[#556B2F] uppercase">Unidad</label>
                            <select
                              value={selectedUnit}
                              onChange={(e) => setSelectedUnit(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-1.5 py-1.5 text-xs focus:border-[#00652c] focus:outline-none font-semibold"
                            >
                              <option value="kg">kilogramos (kg)</option>
                              <option value="g">gramos (g)</option>
                              <option value="litros">litros (L)</option>
                              <option value="ml">mililitros (ml)</option>
                              <option value="unidades">unidades (un)</option>
                              <option value="docenas">docenas (doc)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-[#73624E] uppercase tracking-wide">gasto / proveedor / detalle</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Gas Lipigas cilindro 45Kg o Arriendo de local"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#D0C2AB] bg-[#FDFBF7] px-3.5 py-2.5 text-xs focus:border-[#00652c] focus:outline-none placeholder:text-gray-400 font-semibold"
                    />
                  </div>
                )}

                {/* Document type selection */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#73624E] uppercase tracking-wide">tipo documento</label>
                    <div className="flex mt-1 p-1 bg-[#FAF6EE] border border-[#ECE0CC] rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleDocTypeChange('Factura')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center cursor-pointer transition-all ${
                          docType === 'Factura' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-[#73624E] hover:text-[#2C2114]'
                        }`}
                      >
                        Factura
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDocTypeChange('Boleta')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center cursor-pointer transition-all ${
                          docType === 'Boleta' ? 'bg-purple-700 text-white shadow-2xs' : 'text-[#73624E] hover:text-[#2C2114]'
                        }`}
                      >
                        Boleta
                      </button>
                    </div>
                  </div>

                  {/* Document Number */}
                  <div>
                    <label className="block text-xs font-bold text-[#73624E] uppercase tracking-wide" title="Se pre-calcula secuencialmente para comodidad">Folio N° (Automático)</label>
                    <input
                      type="text"
                      placeholder="Ej. FAC-1002"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#D0C2AB] bg-amber-50/40 px-3.5 py-2.5 text-xs focus:border-[#00652c] focus:outline-none font-mono font-bold text-[#805010]"
                    />
                  </div>
                </div>

                {/* Price & Date selection */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#73624E] uppercase tracking-wide">monto pagado (clp)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="$ Total con IVA"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#D0C2AB] bg-[#FDFBF7] px-3.5 py-2.5 text-xs font-mono font-bold focus:border-[#00652c] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#73624E] uppercase tracking-wide">fecha egreso</label>
                    <input
                      type="date"
                      required
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#D0C2AB] bg-[#FDFBF7] px-3.5 py-2 text-xs focus:border-[#00652c] focus:outline-none"
                    />
                  </div>
                </div>

                {/* CHILEAN IVA SIMULATION CARD */}
                {amount > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-1 text-[11px] text-[#2C2114]">
                    <span className="font-bold text-[#73624E] uppercase text-[9px] tracking-wide mb-1">Desglose de Impuesto</span>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Monto Neto:</span>
                      <span className="font-mono font-semibold">{formatCLP(computedNet)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">IVA Pagado (19%):</span>
                      <span className="font-mono font-semibold">{formatCLP(computedIva)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-dashed border-gray-200 mt-1.5 pt-1.5">
                      <span className="font-bold">Crédito Fiscal S.I.I:</span>
                      {isEligibleForTaxCredit ? (
                        <span className="text-emerald-700 font-bold bg-[#EAFEEA] px-2 py-0.5 rounded border border-[#BFF6C3] font-mono">
                          +{formatCLP(computedIva)} (Recuperable)
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold bg-[#FFF5F5] px-2 py-0.5 rounded border border-[#FFD1D1]">
                          $ 0 (Pérdida por Boleta)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#00652c] hover:bg-[#005123] text-white py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm touch-target-min"
                >
                  <Plus className="w-4 h-4" /> Registrar Egreso
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RIGHT PANEL: REGISTERED LOGS TABLE */}
        <div className={`${isFormOpen ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white border border-[#EADEC9] rounded-3xl p-6 shadow-xs flex flex-col justify-between h-fit transition-all duration-300`}>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EADEC9]/60 gap-4">
              <div>
                <h3 className="font-sans font-black text-lg text-[#2C2114]">Todos los Gastos e Impuestos</h3>
                <p className="text-xs text-[#73624E] mt-0.5">Historial tributario detallado, montos netos y créditos fiscales asociados.</p>
              </div>

              {/* SEARCH BOX */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar gastos o folios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-[#FAF6EE] border border-[#ECE0CC] pl-9 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#00652c] font-semibold"
                />
              </div>
            </div>

            {/* TAB FILTER OPTIONS */}
            <div className="flex flex-wrap items-center gap-2.5 py-3 border-b border-[#EADEC9]/30">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filtrar:
              </span>

              {/* doc type filters */}
              <div className="flex p-0.5 bg-[#FAF6EE] border border-[#ECE0CC] rounded-lg text-[10px] font-bold">
                <button
                  onClick={() => setFilterDocType('todos')}
                  className={`px-2 py-1 rounded cursor-pointer ${filterDocType === 'todos' ? 'bg-white text-[#2C2114] shadow-xs' : 'text-gray-500 hover:text-[#2C2114]'}`}
                >
                  Todos Doc.
                </button>
                <button
                  onClick={() => setFilterDocType('Factura')}
                  className={`px-2 py-1 rounded cursor-pointer ${filterDocType === 'Factura' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-emerald-700'}`}
                >
                  Facturas
                </button>
                <button
                  onClick={() => setFilterDocType('Boleta')}
                  className={`px-2 py-1 rounded cursor-pointer ${filterDocType === 'Boleta' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-500 hover:text-purple-700'}`}
                >
                  Boletas
                </button>
              </div>

              {/* categories filters */}
              <div className="flex p-0.5 bg-[#FAF6EE] border border-[#ECE0CC] rounded-lg text-[10px] font-bold">
                <button
                  onClick={() => setFilterCategory('todos')}
                  className={`px-2 py-1 rounded cursor-pointer ${filterCategory === 'todos' ? 'bg-white text-[#2C2114] shadow-xs' : 'text-gray-500'}`}
                >
                  Todas Cat.
                </button>
                <button
                  onClick={() => setFilterCategory('Insumos')}
                  className={`px-2 py-1 rounded cursor-pointer ${filterCategory === 'Insumos' ? 'bg-white text-[#00652c] shadow-xs' : 'text-gray-500'}`}
                >
                  Insumos
                </button>
                <button
                  onClick={() => setFilterCategory('Servicios')}
                  className={`px-2 py-1 rounded cursor-pointer ${filterCategory === 'Servicios' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-500'}`}
                >
                  Servicios
                </button>
                <button
                  onClick={() => setFilterCategory('Maquinaria')}
                  className={`px-2 py-1 rounded cursor-pointer ${filterCategory === 'Maquinaria' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500'}`}
                >
                  Maquinaria
                </button>
              </div>
            </div>

            {/* EXPENSES LOGS TABLE */}
            <div className="overflow-x-auto border border-[#EADEC9] rounded-2xl bg-white mt-4 max-h-[500px]">
              {filteredExpenses.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-bold text-[#2C2114] text-sm">No se encontraron egresos con estos filtros</p>
                  <p className="text-xs text-[#A18A68] mt-1">Registra gastos en el panel izquierdo para poblar la planilla tributaria.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF6EE] text-[#73624E] border-b border-[#EADEC9] font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3.5">Fecha</th>
                      <th className="p-3.5">Detalle / Documento</th>
                      <th className="p-3.5">Categoría</th>
                      <th className="p-3.5">Neto base</th>
                      <th className="p-3.5 text-center">IVA (19%)</th>
                      <th className="p-3.5 text-right font-bold text-rose-800">Total CLP</th>
                      <th className="p-3.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    <AnimatePresence initial={false}>
                      {filteredExpenses.map((exp) => {
                        const itemType = (exp.type === 'Boleta' || exp.type === 'Factura') ? exp.type : 'Factura';
                        const isInvoice = itemType === 'Factura';
                        
                        const netVal = exp.amount / 1.19;
                        const ivaVal = exp.amount - netVal;

                        // category fallback mapping
                        let catText = 'Otros';
                        if (exp.category) catText = exp.category;
                        else if (exp.type === 'Insumo') catText = 'Insumos';
                        else if (exp.type === 'Servicios') catText = 'Servicios';

                        return (
                          <motion.tr
                            key={exp.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="hover:bg-[#FAF6EE]/30 transition-colors"
                          >
                            <td className="p-3.5 text-gray-500 font-mono text-[10px]/tight whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                {exp.date}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div>
                                <span className="font-bold text-[#2C2114] block">{exp.description}</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                                    isInvoice ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-purple-100 text-purple-800 border border-purple-200'
                                  }`}>
                                    {itemType}
                                  </span>
                                  {exp.documentNumber && (
                                    <span className="font-mono text-[10px] text-gray-400">N° {exp.documentNumber}</span>
                                  )}
                                  {exp.quantity && (
                                    <span className="text-[10px] text-emerald-700 font-semibold italic bg-emerald-50 px-1 rounded">
                                      +{exp.quantity} {exp.unit || 'uds'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 text-gray-600 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[11px]">
                                <Tag className="w-3.5 h-3.5 text-gray-400" />
                                {catText}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500 font-mono text-xs whitespace-nowrap">
                              {formatCLP(netVal)}
                            </td>
                            <td className="p-3.5 text-center font-mono text-xs whitespace-nowrap">
                              <div>
                                <span className="text-gray-500">{formatCLP(ivaVal)}</span>
                                <span className={`block text-[8px] font-bold mt-0.5 ${isInvoice ? 'text-emerald-700' : 'text-gray-400'}`}>
                                  {isInvoice ? '✓ Crédito s/imp' : '✕ Sin crédito'}
                                </span>
                              </div>
                            </td>
                            <td className="p-3.5 text-right font-mono font-black text-[#A81A1A] text-xs whitespace-nowrap">
                              -{formatCLP(exp.amount)}
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => onDeleteExpense(exp.id)}
                                className="p-1.5 text-gray-400 hover:text-red-700 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* HELP INFO BAR */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-6 flex gap-3 text-xs leading-relaxed text-slate-600">
            <HelpCircle className="w-6 h-6 text-slate-500 shrink-0" />
            <div>
              <strong>Crédito Fiscal de IVA en la Pastelería Chilena:</strong>
              <p className="mt-0.5">El Servicio de Impuestos Internos (S.I.I.) permite deducir el IVA pagado en compras (IVA Crédito Fiscal) del IVA recargado sobre las ventas (IVA Débito Fiscal). Recuerde que <strong>solo las Facturas</strong> emitidas a nombre de su giro comercial otorgan este derecho fiscal. El IVA de las Boletas forma parte del gasto neto no recuperable.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
