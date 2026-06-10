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
  RefreshCw
} from 'lucide-react';
import { Ingredient, Recipe } from '../types';

interface InventoryModuleProps {
  ingredients: Ingredient[];
  recipes: Recipe[];
  onUpdateStock: (ingredientId: string, delta: number) => void;
  onRestock: (ingredientId: string) => void;
  onToggleRecipeActive: (recipeId: string) => void;
}

export default function InventoryModule({
  ingredients,
  recipes,
  onUpdateStock,
  onRestock,
  onToggleRecipeActive
}: InventoryModuleProps) {
  // Checklist local states for buying checkboxes
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

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
  const [phoneNumber, setPhoneNumber] = useState('56912345678');
  const [showPhoneConfig, setShowPhoneConfig] = useState(false);

  const getWhatsAppMessage = () => {
    let msg = `*🍞 Artisan Bakehouse - Lista de Compras 🇨🇱*\n`;
    msg += `Fecha: ${new Date().toLocaleDateString('es-CL')}\n\n`;
    msg += `⚠️ *Insumos Críticos a Comprar:* \n`;
    
    shoppingList.forEach(item => {
      const isChecked = !!checkedItems[item.id];
      if (!isChecked) {
        const required = Math.max(item.criticalLimit, item.requiredThisWeek);
        const missing = Math.max(0, Number((required - item.currentStock).toFixed(2)));
        msg += `• *${item.name}*: Falta *${missing} ${item.unit}* (Stock: ${item.currentStock} / Requerido: ${required})\n`;
      }
    });
    
    msg += `\n_Generado automáticamente desde el Dashboard de Cocina_`;
    return encodeURIComponent(msg);
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
              
              <div className="relative">
                <button
                  onClick={() => setShowPhoneConfig(!showPhoneConfig)}
                  className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all px-2.5 py-1.5 rounded-lg cursor-pointer shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0" />
                  <span>Enviar a WhatsApp</span>
                </button>
                
                {showPhoneConfig && (
                  <div className="absolute right-0 mt-2 bg-white border border-[#EADEC9] p-4 rounded-xl shadow-xl z-50 w-64 text-left">
                    <p className="text-xs font-bold text-[#2C2114] mb-1">Destinatario WhatsApp (Chile)</p>
                    <p className="text-[10px] text-[#73624E] mb-2 leading-tight">Ingresa el celular con código de país sin el signo '+' (ej: 56912345678)</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-[#ECE0CC] rounded-lg focus:outline-[#00652c] font-mono"
                        placeholder="56912345678"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-3 text-xs">
                      <button 
                        onClick={() => setShowPhoneConfig(false)} 
                        className="px-2 py-1 text-[11px] text-[#73624E] hover:underline"
                      >
                        Cancelar
                      </button>
                      <a 
                        href={`https://api.whatsapp.com/send?phone=${phoneNumber}&text=${getWhatsAppMessage()}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => {
                          setShowPhoneConfig(false);
                          alert('Conexión redirigida con éxito. Se abrirá la aplicación o web de WhatsApp para despachar el mensaje.');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-center"
                      >
                        Enviar Ahora
                      </a>
                    </div>
                  </div>
                )}
              </div>
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
      
    </div>
  );
}
