import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  Check, 
  AlertOctagon, 
  AlertTriangle, 
  Plus, 
  Minus,
  CheckCircle2, 
  UtensilsCrossed,
  Printer,
  RotateCcw,
  RefreshCw,
  Download,
  FileText,
  Wheat,
  Trash2
} from 'lucide-react';
import { Ingredient, Recipe } from '../types';

interface InventoryModuleProps {
  ingredients: Ingredient[];
  recipes: Recipe[];
  onUpdateStock: (ingredientId: string, delta: number) => void;
  onRestock: (ingredientId: string) => void;
  onToggleRecipeActive: (recipeId: string) => void;
  onAddIngredient?: (name: string, initialStock: number, criticalLimit: number, unit: string, category: string) => Promise<void>;
  onDeleteIngredient?: (ingredientId: string) => Promise<void> | void;
}

export default function InventoryModule({
  ingredients,
  recipes,
  onUpdateStock,
  onRestock,
  onToggleRecipeActive,
  onAddIngredient,
  onDeleteIngredient
}: InventoryModuleProps) {
  // Checklist local states for buying checkboxes
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Confirm delete local state for ingredients
  const [confirmDeleteIngId, setConfirmDeleteIngId] = useState<string | null>(null);

  // New States for Ingredient registration
  const [isAddingIng, setIsAddingIng] = useState(false);
  const [ingName, setIngName] = useState('');
  const [ingCategory, setIngCategory] = useState('Materia Seca');
  const [ingUnit, setIngUnit] = useState('Kg');
  const [ingStock, setIngStock] = useState('');
  const [ingLimit, setIngLimit] = useState('');
  const [submittingIng, setSubmittingIng] = useState(false);

  const handleSubmitIng = async () => {
    if (!ingName.trim() || !ingStock || isNaN(Number(ingStock)) || !ingLimit || isNaN(Number(ingLimit))) {
      alert('Por favor complete todos los datos del insumo.');
      return;
    }
    if (onAddIngredient) {
      setSubmittingIng(true);
      try {
        await onAddIngredient(
          ingName.trim(), 
          Number(ingStock), 
          Number(ingLimit), 
          ingUnit, 
          ingCategory
        );
        setIsAddingIng(false);
        setIngName('');
        setIngStock('');
        setIngLimit('');
        alert('Insumo registrado con éxito en el catálogo.');
      } catch (err: any) {
        alert(err.message || 'Error al guardar insumo');
      } finally {
        setSubmittingIng(false);
      }
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const resetCheckedList = () => {
    setCheckedItems({});
  };

  // Filter low-level critical items
  // An item is critical if currentStock <= criticalLimit OR currentStock <= weeklyRequired (derived from recipes active this week)
  const activeRecipes = recipes.filter(r => r.activeThisWeek);
  
  // Calculate dynamic recipe requirement mapping for this week
  const recipeNecessityMap: Record<string, number> = {};
  
  // Initialize requirements to 0
  ingredients.forEach(i => {
    recipeNecessityMap[i.name] = 0;
  });

  // Aggregate requirements based on active recipes
  activeRecipes.forEach(recipe => {
    recipe.requiredIngredients.forEach(req => {
      if (req.ingredientName in recipeNecessityMap) {
        recipeNecessityMap[req.ingredientName] += req.amount;
      } else {
        recipeNecessityMap[req.ingredientName] = req.amount;
      }
    });
  });

  // Calculate critical ingredients based on stocks vs requirements
  const shoppingList = ingredients.map(ing => {
    const requiredAmount = recipeNecessityMap[ing.name] || 0;
    const isCritical = ing.currentStock < ing.criticalLimit;
    const isUnderRequired = ing.currentStock < requiredAmount;
    
    let severity: 'critico' | 'advertencia' | 'seguro' = 'seguro';
    let label = 'Nivel Óptimo';
    
    if (ing.currentStock === 0 || (isCritical && ing.currentStock < ing.criticalLimit * 0.4)) {
      severity = 'critico';
      label = 'CRÍTICO';
    } else if (isCritical || isUnderRequired) {
      severity = 'advertencia';
      label = 'Poco Inventario';
    }

    return {
      ...ing,
      requiredThisWeek: requiredAmount,
      severity,
      label
    };
  }).filter(item => item.severity !== 'seguro'); // Focus only on low/needed stocks

  // Simulation parameters
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handleDownloadList = () => {
    let text = `========================================================\n`;
    text += `          🎨 ARTISAN BAKEHOUSE - LISTA DE COMPRAS 🇨🇱\n`;
    text += `          Fecha de emisión: ${new Date().toLocaleDateString('es-CL')}\n`;
    text += `========================================================\n\n`;
    text += `⚠️ INSUMOS CRÍTICOS A COMPRAR:\n\n`;
    
    let count = 1;
    shoppingList.forEach(item => {
      const isChecked = !!checkedItems[item.id];
      if (!isChecked) {
        const required = Math.max(item.criticalLimit, item.requiredThisWeek);
        const missing = Math.max(0, Number((required - item.currentStock).toFixed(2)));
        text += `${count}. [ ] ${item.name.toUpperCase()}\n`;
        text += `   - Cantidad a comprar: ${missing} ${item.unit}\n`;
        text += `   - Stock actual: ${item.currentStock} ${item.unit} (Nivel Mínimo: ${required} ${item.unit})\n`;
        text += `   - Categoría: ${item.category}\n\n`;
        count++;
      }
    });

    if (count === 1) {
      text += `¡Todos los ingredientes tienen stock óptimo actual!\n`;
    }

    text += `--------------------------------------------------------\n`;
    text += `Generado automáticamente por el Sistema de Control de Pastelería.\n`;
    text += `========================================================\n`;

    const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lista_Compras_Artisan_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="inventory-module-grid">
      
      {/* LEFT PANEL: AUTOMATIC SHOPPING LIST (Taking up 8 columns) */}
      <div className="xl:col-span-8 bg-[#FDFBF7] rounded-3xl border border-[#EADEC9] p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#EADEC9]/60">
            <div>
              <h3 className="font-sans font-bold text-xl text-[#2C2114] flex items-center gap-2">
                <ShoppingCart className="w-5.5 h-5.5 text-[#00652c]" /> Lista de Compras Automática
              </h3>
              <p className="text-xs text-[#73624E] mt-0.5">
                Cruza niveles de stock críticos con las necesidades de recetas activas antes del viernes
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={resetCheckedList}
                className="flex items-center gap-1 text-xs text-[#8A755D] hover:text-[#2C2114] font-semibold transition-colors border border-[#ECE0CC] px-2.5 py-1.5 rounded-lg bg-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Limpiar Marcas
              </button>
              <button
                onClick={() => {
                  setShowPrintModal(true);
                  setTimeout(() => setShowPrintModal(false), 2000);
                }}
                className="flex items-center gap-1 text-xs bg-white text-[#2C2114] border border-[#ECE0CC] hover:bg-[#FAF6EE] font-semibold transition-all px-2.5 py-1.5 rounded-lg cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> {showPrintModal ? 'Espere...' : 'Imprimir'}
              </button>
              
              <button
                onClick={handleDownloadList}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all px-3.5 py-1.5 rounded-lg cursor-pointer shadow-2xs"
                title="Descargar lista de compras en formato legible para el dispositivo"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Lista</span>
              </button>
            </div>
          </div>

          {shoppingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-[#047857] bg-[#ECFDF5] rounded-xl border border-dashed border-[#A7F3D0] my-4">
              <CheckCircle2 className="w-12 h-12 text-[#10B981] mb-3" />
              <p className="font-bold text-base">¡Stock de ingredientes completo!</p>
              <p className="text-xs text-[#065F46] mt-1">Todos los ingredientes requeridos tienen stock óptimo.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              <AnimatePresence>
                {shoppingList.map((item) => {
                  const isChecked = !!checkedItems[item.id];
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isChecked 
                          ? 'bg-[#F1EDE7] border-[#D1C2A5] opacity-60' 
                          : item.severity === 'critico' 
                            ? 'bg-[#FFF5F5] border-[#FFAEA9]' 
                            : 'bg-white border-[#ECE0CC] hover:border-[#D0C2AB]'
                      }`}
                    >
                      {/* Checkbox and Ingredient Name */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <button
                          onClick={() => toggleCheck(item.id)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer touch-target-min ${
                            isChecked 
                              ? 'bg-[#00652c] border-[#00652c] text-white' 
                              : item.severity === 'critico'
                                ? 'border-[#A81A1A] hover:bg-[#FFF1F1]'
                                : 'border-[#8A755D] hover:bg-[#FAF6EE]'
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4 text-white stroke-[3px]" />}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-base font-sans font-bold ${isChecked ? 'line-through text-[#8A755D]' : 'text-[#2C2114]'}`}>
                              {item.name}
                            </span>
                            
                            {!isChecked && (
                              <span className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                item.severity === 'critico' 
                                  ? 'bg-[#FFD6D6] text-[#A81A1A] border-[#FFA6A6]' 
                                  : 'bg-[#FFF9DB] text-[#854D00] border-[#FFE28A]'
                              }`}>
                                {item.severity === 'critico' ? <AlertOctagon className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                {item.label}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[#73624E]">
                            <span>Categoría: <strong className="text-[#2C2114] font-medium">{item.category}</strong></span>
                            <span>Mínimo: <strong className="font-mono text-[#2C2114]">{item.criticalLimit} {item.unit}</strong></span>
                            {item.requiredThisWeek > 0 && (
                              <span className="text-[#00652c] font-medium">
                                Recetas esta semana: <strong className="font-mono">{item.requiredThisWeek} {item.unit}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stock Adjustments & Controls */}
                      <div className="flex items-center justify-between md:justify-end gap-x-6 gap-y-2 border-t md:border-t-0 pt-3 md:pt-0 border-[#F4EFE6] shrink-0">
                        {/* Current vs Shortage count */}
                        <div className="text-left md:text-right">
                          <span className="text-[10px] text-[#8A755D] block uppercase">Stock Actual (Faltante)</span>
                          <div className="font-mono text-sm">
                            <span className={`font-bold ${item.severity === 'critico' ? 'text-[#A81A1A]' : 'text-[#854D0E]'}`}>
                              {item.currentStock} /
                            </span>{' '}
                            <span className="text-[#73624E]">{Math.max(item.criticalLimit, item.requiredThisWeek)} {item.unit}</span>
                          </div>
                        </div>

                        {/* Inventory quick input triggers */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onUpdateStock(item.id, -1)}
                            disabled={item.currentStock <= 0}
                            className="bg-white hover:bg-[#FAF6EE] text-[#73624E] border border-[#ECE0CC] w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:scale-105 transition-all text-sm font-bold"
                            title="Restar 1 Unidad"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => onUpdateStock(item.id, 1)}
                            className="bg-white hover:bg-[#FAF6EE] text-[#73624E] border border-[#ECE0CC] w-8 h-8 rounded-lg flex items-center justify-center hover:scale-105 transition-all text-sm font-bold"
                            title="Sumar 1 Unidad"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onRestock(item.id)}
                            className="ml-1 bg-[#00652c] text-white hover:bg-[#005223] rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all hover:scale-[1.02] flex items-center gap-1"
                            title="Completar stock óptimo"
                          >
                            <RefreshCw className="w-3 h-3" /> Reabastecer
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
        
        {showPrintModal && (
          <div className="mt-4 p-3 bg-[#EAFEEA] border border-[#BFF6C3] text-[#00652c] rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span><strong>¡Impresión simulada con éxito!</strong> Se ha enviado el ticket con {shoppingList.length} ingredientes críticos a la impresora de logística.</span>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: RECIPES TRIGGERING INGREDIENT CALCULATION (Taking up 4 columns) */}
      <div className="xl:col-span-4 bg-[#FDSBF7] bg-[#FDFBF7] rounded-xl border border-[#EADEC9] p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="pb-3 mb-3 border-b border-[#EADEC9]/60">
            <h4 className="font-sans font-bold text-lg text-[#2C2114] flex items-center gap-2">
              <UtensilsCrossed className="w-4.5 h-4.5 text-[#8A755D]" /> Recetas del Menú
            </h4>
            <p className="text-xs text-[#73624E] mt-0.5">
              Reactiva/desactiva recetas de esta semana para reajustar automáticamente los ingredientes requeridos en compras
            </p>
          </div>

          <div className="space-y-2 mt-4">
            {recipes.map((recipe) => (
              <label
                key={recipe.id}
                className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all select-none ${
                  recipe.activeThisWeek
                    ? 'bg-[#F2FAF3] border-[#00652c]/40 hover:border-[#00652c]'
                    : 'bg-white border-[#ECE0CC] hover:bg-[#FAF6EE] opacity-75'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <span className={`text-sm font-bold block ${recipe.activeThisWeek ? 'text-[#00652c]' : 'text-[#73624E]'}`}>
                    {recipe.name}
                  </span>
                  
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                    {recipe.requiredIngredients.map((ing, idx) => (
                      <span key={idx} className="text-[10px] text-[#A18A68] hover:text-[#2C2114] whitespace-nowrap">
                        {ing.ingredientName.split(' ')[0]} ({ing.amount})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 flex items-center h-6">
                  <input
                    type="checkbox"
                    checked={recipe.activeThisWeek}
                    onChange={() => onToggleRecipeActive(recipe.id)}
                    className="w-5.5 h-5.5 rounded border-[#8A755D] text-[#00652c] focus:ring-[#00652c] cursor-pointer"
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-[#FAF6EE] rounded-xl border border-[#ECE0CC]">
          <h5 className="text-xs font-bold text-[#2C2114] uppercase mb-1 flex items-center gap-1 justify-between">
            <span>Nota de Usabilidad</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" />
          </h5>
          <p className="text-[11px] leading-relaxed text-[#73624E]">
            Mover un interruptor recalcula los requerimientos de la cocina al instante. El sistema vigila que la levadura, harina y grasas nunca se queden cortas para el horneado diario.
          </p>
        </div>
      </div>

      {/* SECTION: GENERAL INGREDIENTS INVENTORY (See all ingredients & Add new ones!) */}
      <div className="xl:col-span-12 bg-[#FDFBF7] rounded-3xl border border-[#EADEC9] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EADEC9]/60 gap-4">
          <div>
            <h3 className="font-sans font-bold text-xl text-[#2C2114] flex items-center gap-2">
              <Wheat className="w-5.5 h-5.5 text-amber-700" /> Catálogo General de Insumos (Materia Prima)
            </h3>
            <p className="text-xs text-[#73624E] mt-0.5">
              Visualice la totalidad de las materias primas del taller y registre nuevos ingredientes para asociar en recetas
            </p>
          </div>

          {/* Toggle form button */}
          <button
            onClick={() => setIsAddingIng(!isAddingIng)}
            className="flex items-center gap-1.5 text-xs bg-[#00652c] hover:bg-[#005123] text-white font-bold transition-all px-4 py-2.5 rounded-xl cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingIng ? 'Cerrrar Formulario' : 'Registrar Nuevo Insumo'}</span>
          </button>
        </div>

        {/* Collapsible Form */}
        {isAddingIng && (
          <div className="bg-white border border-[#E9DEC7] p-5 rounded-2xl shadow-6xs max-w-2xl text-left">
            <h4 className="font-sans font-bold text-sm text-[#2C2114] uppercase mb-4 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              Registrar Nueva Materia Prima
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#73624E]">Nombre del Insumo</label>
                <input
                  type="text"
                  placeholder="Ej. Harina de Centeno Suprema"
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3 py-2 text-xs focus:border-[#00652c] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#73624E]">Categoría</label>
                <select
                  value={ingCategory}
                  onChange={(e) => setIngCategory(e.target.value)}
                  className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3 py-2 text-xs focus:border-[#00652c] focus:outline-none"
                >
                  <option value="Materia Seca">Materia Seca (Harina, azúcar, etc)</option>
                  <option value="Lácteos/Grasas">Lácteos/Grasas (Manteca, mantequilla, crema)</option>
                  <option value="Fermentos">Fermentos (Levaduras, masa madre)</option>
                  <option value="Dulces">Dulces & Chocolates</option>
                  <option value="Huevos">Huevos & Ovoproductos</option>
                  <option value="Frutas">Frutas & Semillas</option>
                  <option value="Envases">Envases & Cajas</option>
                  <option value="Otros">Otros Insumos</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#73624E]">Unidad de Medida Principal</label>
                <select
                  value={ingUnit}
                  onChange={(e) => setIngUnit(e.target.value)}
                  className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3 py-2 text-xs focus:border-[#00652c] focus:outline-none"
                >
                  <option value="Kg">Kilogramo (Kg)</option>
                  <option value="Gramo">Gramo (g)</option>
                  <option value="Litro">Litro (L)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="unidades">Unidades (uds)</option>
                  <option value="onzas">Onzas (oz)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#73624E]">Stock Inicial</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={ingStock}
                    onChange={(e) => setIngStock(e.target.value)}
                    className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3 py-2 text-xs font-mono focus:border-[#00652c] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#73624E]">Límite Crítico</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej. 5"
                    value={ingLimit}
                    onChange={(e) => setIngLimit(e.target.value)}
                    className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3 py-2 text-xs font-mono focus:border-[#00652c] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-[#ECE0CC]">
              <button
                type="button"
                onClick={() => setIsAddingIng(false)}
                className="px-4 py-2 border border-[#D0C2AB] text-xs font-bold rounded-xl text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submittingIng}
                onClick={handleSubmitIng}
                className="px-4 py-2 bg-[#00652c] hover:bg-[#005123] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {submittingIng ? 'Guardando...' : 'Crear Insumo'}
              </button>
            </div>
          </div>
        )}

        {/* Ingredients Grid view */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-2 text-left">
          {ingredients.map((ing) => {
            const isLow = ing.currentStock < ing.criticalLimit;
            return (
              <div 
                key={ing.id}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 relative transition-all ${
                  isLow 
                    ? 'bg-[#FFF9F9] border-[#FFAEA9] shadow-2xs' 
                    : 'bg-white border-[#EADEC9]/70 hover:border-[#C8B89C] shadow-6xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[9px] uppercase font-bold text-gray-400">
                    <span className="font-mono font-black">{ing.id}</span>
                    <span className="font-mono bg-amber-50 text-amber-700 px-1 py-0.5 rounded-md font-bold truncate max-w-[80px]" title={ing.category}>
                      {ing.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#2C2114] mt-1.5 pr-4 truncate" title={ing.name}>
                    {ing.name}
                  </h4>
                </div>

                <div className="pt-1.5 border-t border-[#FAF6EE]">
                  <span className="text-[10px] text-[#8C7A65] block uppercase font-mono">Stock</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className={`text-base font-mono font-extrabold ${isLow ? 'text-red-700' : 'text-[#00652c]'}`}>
                      {ing.currentStock}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{ing.unit}</span>
                  </div>
                  <span className="text-[9px] text-[#A18A68] mt-1 block">
                    Mínimo: <strong className="font-mono">{ing.criticalLimit} {ing.unit}</strong>
                  </span>
                </div>

                {/* Indicator dot */}
                <div className={`absolute top-2.5 right-8 w-2 h-2 rounded-full ${isLow ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                
                {/* Deletion trigger */}
                {onDeleteIngredient && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteIngId(ing.id);
                    }}
                    className="absolute top-1.5 right-1.5 text-gray-400 hover:text-red-650 p-0.5 rounded transition-colors cursor-pointer"
                    title="Eliminar insumo del inventario"
                  >
                    <Trash2 className="w-3.5 h-3.5 hover:text-red-650 shrink-0" />
                  </button>
                )}

                {/* Confirmation Overlay inside the card */}
                {confirmDeleteIngId === ing.id && (
                  <div className="absolute inset-0 bg-[#FFF5F5] rounded-2xl p-3 flex flex-col justify-between border-2 border-red-300 z-20 text-center select-none animate-fadeIn">
                    <div className="my-auto space-y-1.5">
                      <h5 className="text-[11px] font-bold text-red-800 uppercase tracking-wide">¿Eliminar Insumo?</h5>
                      <p className="text-[10.5px] text-gray-600 font-semibold leading-tight line-clamp-2">{ing.name}</p>
                      <p className="text-[9px] text-red-500 leading-tight">¿Deseas quitar este insumo del catálogo?</p>
                    </div>
                    <div className="flex gap-2 justify-center pb-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteIngredient) {
                            onDeleteIngredient(ing.id);
                          }
                          setConfirmDeleteIngId(null);
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        Sí, Borrar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteIngId(null);
                        }}
                        className="px-3 py-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-150 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
