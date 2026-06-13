import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Tag, 
  DollarSign, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Scale, 
  ShoppingBag, 
  X, 
  BookOpen, 
  Wheat 
} from 'lucide-react';
import { Product, Ingredient, Recipe } from '../types';

interface ProductsModuleProps {
  products: Product[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  onAddProduct: (name: string, price: number, recipeIngredients?: { ingredientName: string; amount: number }[]) => Promise<void>;
  onUpdateProduct: (id: string, name: string, price: number, recipeIngredients?: { ingredientName: string; amount: number }[]) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export default function ProductsModule({
  products,
  ingredients,
  recipes,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}: ProductsModuleProps) {
  // Toggle states
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  
  // Recipe linkage states during product creation
  const [selectedIngredients, setSelectedIngredients] = useState<{ ingredientName: string; amount: number; unit: string }[]>([]);
  const [currentIngredientId, setCurrentIngredientId] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [selectedLinkUnit, setSelectedLinkUnit] = useState('Kg');

  // Editing state
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Editing recipe ingredients state
  const [editIngredients, setEditIngredients] = useState<{ ingredientName: string; amount: number; unit: string }[]>([]);
  const [editCurrentIngId, setEditCurrentIngId] = useState('');
  const [editCurrentAmount, setEditCurrentAmount] = useState('');
  const [editSelectedUnit, setEditSelectedUnit] = useState('Kg');

  // Status/Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to format Chilean Peso
  const formatCLP = (val: number) => {
    return '$ ' + Math.round(val).toLocaleString('es-CL');
  };

  const handleAddIngredientToRecipe = () => {
    if (!currentIngredientId || !currentAmount || isNaN(Number(currentAmount)) || Number(currentAmount) <= 0) return;
    const matched = ingredients.find(i => i.id === currentIngredientId);
    if (!matched) return;

    if (selectedIngredients.some(item => item.ingredientName.toLowerCase() === matched.name.toLowerCase())) {
      alert('Este insumo ya se encuentra en la receta.');
      return;
    }

    setSelectedIngredients(prev => [
      ...prev,
      { ingredientName: matched.name, amount: Number(currentAmount), unit: selectedLinkUnit }
    ]);
    
    setCurrentAmount('');
  };

  const handleRemoveIngredientFromRecipe = (name: string) => {
    setSelectedIngredients(prev => prev.filter(item => item.ingredientName !== name));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice || isNaN(Number(newPrice)) || Number(newPrice) <= 0) return;

    setSubmitting(true);
    try {
      // Pass both product fields and convert custom recipe units to base units
      const apiIngredients = selectedIngredients.map(item => {
        const ing = ingredients.find(i => i.name.toLowerCase() === item.ingredientName.toLowerCase());
        let finalAmount = item.amount;
        if (ing) {
          const baseUnit = ing.unit.toLowerCase();
          const chosenUnit = item.unit.toLowerCase();
          
          if (baseUnit === 'kg') {
            if (chosenUnit === 'gramo') {
              finalAmount = item.amount * 0.001;
            } else if (chosenUnit === 'onzas') {
              finalAmount = item.amount * 0.02835;
            }
          } else if (baseUnit === 'litros' || baseUnit === 'l' || baseUnit === 'litro' || baseUnit === 'lts') {
            if (chosenUnit === 'ml') {
              finalAmount = item.amount * 0.001;
            } else if (chosenUnit === 'onzas') {
              finalAmount = item.amount * 0.02957;
            }
          }
        }
        finalAmount = Number(finalAmount.toFixed(4));
        return {
          ingredientName: item.ingredientName,
          amount: finalAmount
        };
      });

      await onAddProduct(newName.trim(), Math.round(Number(newPrice)), apiIngredients);
      
      setNewName('');
      setNewPrice('');
      setSelectedIngredients([]);
      setCurrentIngredientId('');
      setCurrentAmount('');
      setIsAddingMode(false);
      showToast('¡Producto y receta agregados con éxito!');
    } catch (err) {
      showToast('Error al agregar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (p: Product) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(p.price.toString());
    setEditCurrentIngId('');
    setEditCurrentAmount('');
    
    // Find matching recipe linked to this product name
    const matched = recipes.find(r => 
      r.name.toLowerCase() === p.name.toLowerCase() ||
      p.name.toLowerCase().includes(r.name.toLowerCase()) ||
      r.name.toLowerCase().includes(p.name.toLowerCase())
    );
    if (matched) {
      const formatted = matched.requiredIngredients.map(item => {
        const ing = ingredients.find(i => i.name.toLowerCase() === item.ingredientName.toLowerCase());
        return {
          ingredientName: item.ingredientName,
          amount: item.amount,
          unit: ing ? ing.unit : 'Kg'
        };
      });
      setEditIngredients(formatted);
    } else {
      setEditIngredients([]);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim() || !editPrice || isNaN(Number(editPrice)) || Number(editPrice) <= 0) return;

    setSubmitting(true);
    try {
      // Pass both product fields and convert custom recipe units to base units
      const apiIngredients = editIngredients.map(item => {
        const ing = ingredients.find(i => i.name.toLowerCase() === item.ingredientName.toLowerCase());
        let finalAmount = item.amount;
        if (ing) {
          const baseUnit = ing.unit.toLowerCase();
          const chosenUnit = item.unit.toLowerCase();
          
          if (baseUnit === 'kg') {
            if (chosenUnit === 'gramo' || chosenUnit === 'g') {
              finalAmount = item.amount * 0.001;
            } else if (chosenUnit === 'onzas') {
              finalAmount = item.amount * 0.02835;
            }
          } else if (baseUnit === 'litros' || baseUnit === 'l' || baseUnit === 'litro' || baseUnit === 'lts') {
            if (chosenUnit === 'ml') {
              finalAmount = item.amount * 0.001;
            } else if (chosenUnit === 'onzas') {
              finalAmount = item.amount * 0.02957;
            }
          }
        }
        finalAmount = Number(finalAmount.toFixed(4));
        return {
          ingredientName: item.ingredientName,
          amount: finalAmount
        };
      });

      await onUpdateProduct(id, editName.trim(), Math.round(Number(editPrice)), apiIngredients);
      setEditingId(null);
      showToast('¡Producto y receta actualizados con éxito!');
    } catch (err) {
      showToast('Error al actualizar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el producto "${name}"?`)) {
      try {
        await onDeleteProduct(id);
        showToast('Producto eliminado correctamente');
      } catch (err) {
        showToast('Error al eliminar el producto');
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="bg-[#FDFBF7] rounded-3xl border border-[#EADEC9] p-6 shadow-xs flex flex-col" id="products-module-root">
      
      {/* Toast feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#00652c] text-white px-4 py-3 rounded-xl border border-emerald-600 shadow-lg flex items-center gap-2"
          >
            <Check className="w-4.5 h-4.5" />
            <span className="text-sm font-bold font-sans">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-[#EADEC9]/60">
        <div>
          <h3 className="font-sans font-black text-xl text-[#2C2114] flex items-center gap-2">
            <Tag className="w-5.5 h-5.5 text-[#00652c]" /> Catálogo de Productos y Fórmulas
          </h3>
          <p className="text-xs text-[#73624E] mt-0.5">
            Configura los productos que ofreces y asocia de inmediato los insumos de su receta. Al cocinarse, el stock se descontará automáticamente.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddingMode(!isAddingMode);
            setEditingId(null);
            setSelectedIngredients([]);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00652c] text-white hover:bg-[#005123] text-sm font-bold shadow-sm transition-all text-center shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {isAddingMode ? 'Cerrar Formulario' : 'Agregar Nuevo Producto'}
        </button>
      </div>

      {/* Addition Form with Recipe Ingredients builder */}
      <AnimatePresence>
        {isAddingMode && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#FAF6EE] border border-[#ECE0CC] rounded-2xl p-5 mb-6 overflow-hidden space-y-5 text-left"
            onSubmit={handleAdd}
          >
            <h4 className="text-sm font-bold text-[#2C2114] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-[#00652c]" /> Registrar Producto y Definir Receta
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-1.5">
                <label className="text-[11px] font-bold text-[#73624E] uppercase block">Nombre de Fantasía o Comercial</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tarta de Queso estilo Santiago 24cm"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3.5 py-2.5 text-sm text-[#2C2114] focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]/30"
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[11px] font-bold text-[#73624E] uppercase block">Precio de Lista (CLP)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73624E] font-medium text-sm">$</span>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={newName === '' && newPrice === '' ? '' : newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full rounded-xl border border-[#D0C2AB] bg-white pl-8 pr-3.5 py-2.5 text-sm font-mono text-[#2C2114] focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]/30"
                  />
                </div>
              </div>
            </div>

            {/* RECIPE BUILDER SECTION */}
            <div className="bg-white rounded-xl border border-[#ECE0CC] p-4 space-y-4">
              <div>
                <span className="text-xs font-bold text-[#2C2114] uppercase tracking-wider flex items-center gap-1.5">
                  <Wheat className="w-4.5 h-4.5 text-[#8A755D]" /> Ingredientes Recetario (Descuento Automático)
                </span>
                <p className="text-[11px] text-[#73624E] mt-0.5">
                  Selecciona la cantidad exacta de insumos que utiliza esta preparación gastronómica
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[10px] font-bold text-[#8A755D] uppercase">Insumo Base</label>
                  <select
                    value={currentIngredientId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCurrentIngredientId(val);
                      const matched = ingredients.find(i => i.id === val);
                      if (matched) {
                        const bUnit = matched.unit.toLowerCase();
                        if (bUnit === 'kg') setSelectedLinkUnit('Kg');
                        else if (bUnit === 'litros' || bUnit === 'litro' || bUnit === 'l') setSelectedLinkUnit('Litro');
                        else setSelectedLinkUnit('unidades');
                      }
                    }}
                    className="w-full rounded-lg border border-[#D0C2AB] bg-white px-2.5 py-2 text-xs text-[#2C2114] focus:border-[#00652c] focus:outline-none"
                  >
                    <option value="">-- Buscar Insumo --</option>
                    {ingredients.map(ing => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-[#8A755D] uppercase">Cantidad</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.5"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full rounded-lg border border-[#D0C2AB] bg-white px-2.5 py-2 text-xs text-[#2C2114] focus:border-[#00652c] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-[#8A755D] uppercase">Unidad</label>
                  <select
                    value={selectedLinkUnit}
                    onChange={(e) => setSelectedLinkUnit(e.target.value)}
                    className="w-full rounded-lg border border-[#D0C2AB] bg-white px-2 py-2 text-xs text-[#2C2114] focus:border-[#00652c] focus:outline-none"
                  >
                    <option value="Kg">Kg</option>
                    <option value="gramo">gramo</option>
                    <option value="Litro">Litro</option>
                    <option value="ml">ml</option>
                    <option value="onzas">onzas</option>
                    <option value="unidades">unidades</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddIngredientToRecipe}
                  className="sm:col-span-2 px-3 py-2 rounded-lg bg-[#FAF6EE] text-[#73624E] border border-[#ECE0CC] font-bold text-xs hover:bg-[#00652c] hover:text-white hover:border-[#00652c] transition-all cursor-pointer text-center h-9"
                >
                  + Vincular
                </button>
              </div>

              {/* Selected recipe ingredients chips list */}
              {selectedIngredients.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-[#ECE0CC]">
                  {selectedIngredients.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="bg-[#FAF6EE] border border-[#EADEC9] px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium text-[#2C2114]"
                    >
                      <span className="font-bold text-[#00652c]">{item.amount} {item.unit}</span>
                      <span className="text-[#73624E]">{item.ingredientName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientFromRecipe(item.ingredientName)}
                        className="text-red-600 hover:text-red-900 ml-1 p-0.5 rounded-full hover:bg-red-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-[#FAFDF9] border border-dashed border-[#C3E8C1] rounded-lg text-emerald-800 text-xs">
                  ✨ No has seleccionado insumos. Este producto no tendrá deducción automática de stock.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingMode(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D0C2AB] text-[#73624E] hover:bg-white text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-[#00652c] text-white hover:bg-[#005123] text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {submitting ? 'Añadiendo...' : 'Crear Producto y Receta'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Product list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans" id="products-catalog-grid">
        <AnimatePresence initial={false}>
          {products.map((product) => {
            const isEditing = editingId === product.id;

            // Find matching recipe linked to this product name
            const matchedRecipe = recipes.find(r => 
              r.name.toLowerCase() === product.name.toLowerCase() ||
              product.name.toLowerCase().includes(r.name.toLowerCase()) ||
              r.name.toLowerCase().includes(product.name.toLowerCase())
            );

            return (
              <motion.div
                key={product.id}
                layout
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  isEditing
                    ? 'bg-[#FCF9F2] border-[#00652c] shadow-sm'
                    : 'bg-white border-[#ECE0CC] hover:border-[#D0C2AB] shadow-6xs'
                }`}
              >
                {isEditing ? (
                  /* EDITING SUB-FORM FORM */
                  <div className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#73624E] uppercase">Nombre</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-[#D0C2AB] bg-white px-2.5 py-1.5 text-sm text-[#2C2114] focus:border-[#00652c]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#73624E] uppercase">Precio (CLP)</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full rounded-lg border border-[#D0C2AB] bg-white px-2.5 py-1.5 text-sm font-mono text-[#2C2114] focus:border-[#00652c]"
                      />
                    </div>

                    {/* Integrated recipe editing inside editing view */}
                    <div className="bg-[#FAF6EE] p-3 rounded-xl border border-[#ECE0CC] space-y-3 mt-1 text-left">
                      <span className="text-[10px] font-bold text-[#2C2114] uppercase block flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-[#00652c]" /> Vincular Insumos (Receta)
                      </span>
                      
                      {/* Controls to add ingredients in editing mode */}
                      <div className="grid grid-cols-1 gap-1.5">
                        <div className="flex gap-1.5">
                          <select
                            value={editCurrentIngId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditCurrentIngId(val);
                              const matched = ingredients.find(i => i.id === val);
                              if (matched) {
                                setEditSelectedUnit(matched.unit);
                              }
                            }}
                            className="flex-1 rounded-lg border border-[#D0C2AB] bg-white px-2 py-1 text-xs focus:ring-1 focus:ring-[#00652c]"
                          >
                            <option value="">-- Seleccionar Insumo --</option>
                            {ingredients.map(ing => (
                              <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            step="any"
                            placeholder="Cantidad"
                            value={editCurrentAmount}
                            onChange={(e) => setEditCurrentAmount(e.target.value)}
                            className="w-24 rounded-lg border border-[#D0C2AB] bg-white px-2 py-1 text-xs font-mono"
                          />
                          
                          <select
                            value={editSelectedUnit}
                            onChange={(e) => setEditSelectedUnit(e.target.value)}
                            className="w-20 rounded-lg border border-[#D0C2AB] bg-white px-2 py-1 text-xs"
                          >
                            <option value="Kg">Kg</option>
                            <option value="gramo">g</option>
                            <option value="Litro">L</option>
                            <option value="ml">ml</option>
                            <option value="onzas">oz</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              if (!editCurrentIngId || !editCurrentAmount || isNaN(Number(editCurrentAmount)) || Number(editCurrentAmount) <= 0) return;
                              const matched = ingredients.find(i => i.id === editCurrentIngId);
                              if (!matched) return;
                              if (editIngredients.some(item => item.ingredientName.toLowerCase() === matched.name.toLowerCase())) {
                                alert('Este insumo ya se encuentra agregado.');
                                return;
                              }
                              setEditIngredients(prev => [
                                ...prev,
                                { ingredientName: matched.name, amount: Number(editCurrentAmount), unit: editSelectedUnit }
                              ]);
                              setEditCurrentAmount('');
                            }}
                            className="flex-1 py-1 bg-[#00652c] text-white rounded-lg text-xs font-bold transition-all hover:bg-[#005123]"
                          >
                            Vincular
                          </button>
                        </div>
                      </div>

                      {/* Display recipe ingredients with single item deletes */}
                      {editIngredients.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-dashed border-[#ECE0CC] max-h-24 overflow-y-auto">
                          {editIngredients.map((item, idx) => (
                            <div key={idx} className="bg-white border border-[#EADEC9] px-2 py-0.5 rounded-md flex items-center gap-1.5 text-[9px] font-bold text-[#2C2114]">
                              <span className="text-[#00652c] font-mono">{item.amount} {item.unit}</span>
                              <span className="truncate max-w-[80px]">{item.ingredientName}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditIngredients(prev => prev.filter(ing => ing.ingredientName.toLowerCase() !== item.ingredientName.toLowerCase()));
                                }}
                                className="text-red-500 hover:text-red-800 font-black cursor-pointer ml-1"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-[10px] text-[#A18A68] py-1 border border-dashed border-[#DED0B6] rounded-md">
                          Sin ingredientes vinculados.
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-[#ECE0CC]">
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-2 rounded-lg border border-[#D0C2AB] text-[#73624E] text-xs font-bold bg-white cursor-pointer hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveEdit(product.id)}
                        disabled={submitting}
                        className="flex-1 py-2 rounded-lg bg-[#00652c] text-white text-xs font-bold cursor-pointer hover:bg-[#005123]"
                      >
                        {submitting ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* STANDARD PRODUCT CARD VIEW */
                  <div className="flex flex-col justify-between h-full">
                    <div className="text-left space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono bg-[#FAF6EE] text-[#8A755D] border border-[#ECE0CC] text-[10px] px-2 py-0.5 rounded-md font-bold">
                          {product.id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(product)}
                            title="Editar Producto"
                            className="p-1.5 text-gray-400 hover:text-[#00652c] bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            title="Eliminar del Catálogo"
                            className="p-1.5 text-gray-400 hover:text-[#A81A1A] bg-gray-50 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <h4 className="font-sans font-bold text-[#2C2114] leading-snug line-clamp-2 text-base">
                        {product.name}
                      </h4>

                      {/* Display Matched Recipe inside the Card */}
                      {matchedRecipe ? (
                        <div className="bg-[#FAF6EE]/60 border border-[#ECE0CC]/60 rounded-xl p-2.5 text-[11px] text-[#73624E] space-y-1">
                          <span className="font-bold flex items-center gap-1 text-[#2C2114]">
                            <BookOpen className="w-3.5 h-3.5 text-[#00652c]" /> Receta Vinculada
                          </span>
                          <div className="flex flex-col gap-0.5 font-mono">
                            {matchedRecipe.requiredIngredients.map((item, idx) => {
                              // Match ingredient to print its unit perfectly
                              const ingUnit = ingredients.find(ing => ing.name.toLowerCase() === item.ingredientName.toLowerCase())?.unit || '';
                              return (
                                <div key={idx} className="flex justify-between border-b border-[#FAF6EE] pb-0.5">
                                  <span>{item.ingredientName}</span>
                                  <span className="font-bold text-[#205133]">{item.amount} {ingUnit}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-amber-600 bg-amber-50/50 border border-amber-200/50 rounded-lg p-2 text-center font-medium">
                          ⚠️ Sin insumos pre-configurados.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#FAF6EE]">
                      <span className="text-xs text-[#8A755D] font-medium uppercase tracking-wider">Precio de Venta</span>
                      <span className="font-mono font-bold text-base text-[#00652c] bg-[#EAFEEA] px-2.5 py-1 rounded-lg border border-[#BFF6C3]">
                        {formatCLP(product.price)}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {products.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-[#FAF6EE] rounded-2xl border border-dashed border-[#DED0B6]">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
            <h5 className="font-bold text-[#2C2114]">No hay productos registrados</h5>
            <p className="text-xs text-[#73624E] mt-1">Utiliza el botón superior para agregar tu primer pastel o tarta.</p>
          </div>
        )}
      </div>

    </div>
  );
}
