import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Tag, DollarSign, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductsModuleProps {
  products: Product[];
  onAddProduct: (name: string, price: number) => Promise<void>;
  onUpdateProduct: (id: string, name: string, price: number) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export default function ProductsModule({
  products,
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
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Status/Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to format Chilean Peso
  const formatCLP = (val: number) => {
    return '$ ' + Math.round(val).toLocaleString('es-CL');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice || isNaN(Number(newPrice)) || Number(newPrice) <= 0) return;

    setSubmitting(true);
    try {
      await onAddProduct(newName.trim(), Math.round(Number(newPrice)));
      setNewName('');
      setNewPrice('');
      setIsAddingMode(false);
      showToast('¡Producto agregado con éxito!');
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
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim() || !editPrice || isNaN(Number(editPrice)) || Number(editPrice) <= 0) return;

    setSubmitting(true);
    try {
      await onUpdateProduct(id, editName.trim(), Math.round(Number(editPrice)));
      setEditingId(null);
      showToast('¡Producto actualizado con éxito!');
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
    <div className="bg-[#FDFBF7] rounded-2xl border border-[#EADEC9] p-6 shadow-xs flex flex-col" id="products-module-root">
      
      {/* Toast feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#00652c] text-white px-4 py-3 rounded-xl border border-emerald-600 shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-bold font-sans">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-[#EADEC9]/60">
        <div>
          <h3 className="font-sans font-bold text-xl text-[#2C2114] flex items-center gap-2">
            <Tag className="w-5.5 h-5.5 text-[#00652c]" /> Catálogo de Productos y Precios
          </h3>
          <p className="text-xs text-[#73624E] mt-0.5">
            Configura los productos que están disponibles para la venta. Estos se sincronizarán con los formularios de pedidos.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddingMode(!isAddingMode);
            setEditingId(null);
          }}
          className="flex items-center justify-center gap-1.5 px-4  py-2.5 rounded-xl bg-[#00652c] text-white hover:bg-[#005123] text-sm font-bold shadow-sm transition-all text-center shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {isAddingMode ? 'Cerrar Formulario' : 'Agregar Nuevo Producto'}
        </button>
      </div>

      {/* Addition View */}
      <AnimatePresence>
        {isAddingMode && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#FAF6EE] border border-[#ECE0CC] rounded-2xl p-5 mb-6 overflow-hidden space-y-4 text-left"
            onSubmit={handleAdd}
          >
            <h4 className="text-sm font-bold text-[#2C2114] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-[#00652c]" /> Registrar Nuevo Producto de Repostería
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-1.5">
                <label className="text-[11px] font-bold text-[#73624E] uppercase">Nombre Comercial del Producto</label>
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
                <label className="text-[11px] font-bold text-[#73624E] uppercase">Precio de Venta (CLP)</label>
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
                {submitting ? 'Añadiendo...' : 'Crear Producto'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Product list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="products-catalog-grid">
        <AnimatePresence initial={false}>
          {products.map((product) => {
            const isEditing = editingId === product.id;

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
                  <>
                    <div className="text-left">
                      <div className="flex items-center justify-between mb-1">
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
                      
                      <h4 className="font-sans font-bold text-[#2C2114] mt-2 mb-1.5 min-h-[44px] text-base leading-snug line-clamp-2">
                        {product.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#FAF6EE]">
                      <span className="text-xs text-[#8A755D] font-medium uppercase tracking-wider">Precio Sugerido</span>
                      <span className="font-mono font-bold text-lg text-[#00652c] bg-[#EAFEEA] px-2.5 py-1 rounded-lg border border-[#BFF6C3]">
                        {formatCLP(product.price)}
                      </span>
                    </div>
                  </>
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
