import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MapPin, 
  Clock, 
  Calendar, 
  User, 
  Truck, 
  CheckSquare, 
  Square, 
  Printer, 
  CheckCircle,
  Play,
  RotateCcw,
  ShoppingBag,
  Trash2
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useState, useEffect } from 'react';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onUpdatePayment?: (
    orderId: string,
    paymentMethod: string,
    amountPaid: number,
    paymentEfectivo: number,
    paymentTransferencia: number,
    paymentTarjeta: number
  ) => void;
  onDeleteOrder?: (orderId: string) => Promise<void> | void;
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
  onUpdatePayment,
  onDeleteOrder
}: OrderDetailModalProps) {
  // Parsing the products. Check if user typed multiple separated by comma, plus or 'y'
  const getProductItemsList = (productName: string) => {
    if (!productName) return [];
    // Split by common separators: comma, plus, or word " y "
    const items = productName.split(/,|\+|\by\b/);
    return items
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map((item, idx) => ({ id: idx, label: item }));
  };

  // State to track checked subproducts for kitchen picklist satisfaction
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  // Payment editing states
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [editMethod, setEditMethod] = useState<string>('Efectivo');
  const [editEf, setEditEf] = useState<number>(0);
  const [editTrans, setEditTrans] = useState<number>(0);
  const [editTar, setEditTar] = useState<number>(0);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Sync editing fields when order changes
  useEffect(() => {
    if (order) {
      setEditMethod(order.paymentMethod || 'Efectivo');
      setEditEf(order.paymentEfectivo || 0);
      setEditTrans(order.paymentTransferencia || 0);
      setEditTar(order.paymentTarjeta || 0);
      setIsEditingPayment(false);
      setCheckedItems({});
      setIsConfirmingDelete(false);
    }
  }, [order]);

  const toggleProductItem = (id: number) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!order) return null;

  const productItems = getProductItemsList(order.productName);

  // Helper to format Chilean Peso
  const formatCLP = (val: number) => {
    return '$ ' + Math.round(val).toLocaleString('es-CL');
  };

  // Safe weekday label helper
  const getFriendlyDateStr = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch (_) {
      return dateStr;
    }
  };

  // Next status transition helper
  const getNextStatusAction = (status: OrderStatus) => {
    switch (status) {
      case 'Pendiente':
        return { label: 'Confirmar Pedido', next: 'Confirmado' as OrderStatus, color: 'bg-green-600 hover:bg-green-700' };
      case 'Confirmado':
        return { label: 'Empezar Preparación', next: 'En Producción' as OrderStatus, color: 'bg-yellow-600 hover:bg-yellow-700' };
      case 'En Producción':
        return { label: 'Marcar como Listo (Horneado)', next: 'Listo' as OrderStatus, color: 'bg-emerald-600 hover:bg-emerald-700' };
      case 'Listo':
        return { label: 'Marcar como Entregado', next: 'Entregado' as OrderStatus, color: 'bg-slate-600 hover:bg-slate-700' };
      case 'Entregado': // fallback
      default:
        return null;
    }
  };

  const handleSavePaymentEdits = () => {
    if (!onUpdatePayment) return;
    const grandTotal = order.total + (order.deliveryFee || 0);
    
    let finalPaid = grandTotal;
    let finalEf = 0;
    let finalTrans = 0;
    let finalTar = 0;

    if (editMethod === 'Efectivo') {
      finalEf = grandTotal;
    } else if (editMethod === 'Transferencia') {
      finalTrans = grandTotal;
    } else if (editMethod === 'Tarjeta') {
      finalTar = grandTotal;
    } else if (editMethod === 'Parcial') {
      finalPaid = editEf + editTrans + editTar;
      finalEf = editEf;
      finalTrans = editTrans;
      finalTar = editTar;
    }

    onUpdatePayment(order.id, editMethod, finalPaid, finalEf, finalTrans, finalTar);
    setIsEditingPayment(false);
  };

  const nextAction = getNextStatusAction(order.status);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#3F372F]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-[#FDFBF7] rounded-3xl border-2 border-[#EADEC9] shadow-xl w-full max-w-xl relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-[#FAF6EE] border-b border-[#EADEC9] p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FAF0DD] rounded-xl text-[#8E5E2B] border border-[#ECD9BD]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#A18A68] block">Ficha Interactiva de Pedido</span>
                  <h3 className="text-lg font-bold font-sans text-[#2C2114] flex items-center gap-2">
                    Código: <span className="font-mono text-emerald-700">{order.id}</span>
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full hover:bg-[#EADEC9]/40 flex items-center justify-center text-[#73624E] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 text-left">
              
              {/* Top Banner Status Info */}
              <div className="bg-white rounded-2xl border border-[#ECE0CC] p-4 flex items-center justify-between shadow-6xs">
                <div>
                  <span className="text-[10px] text-[#A18A68] uppercase font-bold tracking-wider">Estado de Elaboración</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="font-sans font-bold text-[#2C2114] text-base">{order.status}</span>
                  </div>
                </div>
                {order.ingredientsDeducted ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-[#00652c] border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                    ✓ Insumos Descontados
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1.5 rounded-lg">
                    ⏰ Consumo Pendiente
                  </span>
                )}
              </div>

              {/* Client and Date Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FAF6EE]/70 p-3.5 rounded-xl border border-[#ECE0CC]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A755D] flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-emerald-700" /> Cliente
                  </span>
                  <p className="font-bold text-[#2C2114] mt-1 text-sm sm:text-base truncate">{order.clientName}</p>
                </div>

                <div className="bg-[#FAF6EE]/70 p-3.5 rounded-xl border border-[#ECE0CC]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A755D] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Fecha y Hora
                  </span>
                  <p className="font-bold text-[#2C2114] mt-1 text-[11px] sm:text-xs">
                    {getFriendlyDateStr(order.deliveryDate)} a las <strong className="font-mono text-indigo-700 text-sm">{order.deliveryTime}</strong>
                  </p>
                </div>
              </div>

              {/* PRODUCTS CHECKLIST - CRITICAL FOR SEVERAL PRODUCTS */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-[#2C2114] flex items-center justify-between">
                  <span>Productos en la Comanda</span>
                  {productItems.length > 1 && (
                    <span className="text-[10px] text-[#00652c] font-bold bg-[#EAFEEA] px-2 py-0.5 rounded-full border border-[#BFF6C3]">
                      Múltiples ({productItems.length})
                    </span>
                  )}
                </h4>

                <div className="bg-white border border-[#ECE0CC] rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-6xs">
                  {productItems.map((item) => {
                    const isCompleted = !!checkedItems[item.id];
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => toggleProductItem(item.id)}
                        className={`w-full p-3.5 flex items-start gap-3 transition-colors text-left hover:bg-slate-50 cursor-pointer ${
                          isCompleted ? 'bg-[#FAFAF9]/80 opacity-60' : ''
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {isCompleted ? (
                            <CheckSquare className="w-5 h-5 text-[#00652c] stroke-[2.5px]" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold text-[#2C2114] ${isCompleted ? 'line-through text-opacity-50' : ''}`}>
                            {item.label}
                          </p>
                          <span className="text-[10px] text-[#8A755D] block mt-0.5">Haga clic sobre el ítem para marcarlo como verificado en cocina</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delivery and Route Info */}
              <div className="bg-[#FAF6EE] border border-[#ECE0CC] p-4 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-[#2C2114] uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#A81A1A]" /> Logística de Entrega & Pago
                </span>
                
                <div className="text-sm bg-white p-3 rounded-xl border border-[#ECE0CC] flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-gray-400 block font-bold">Dirección de Despacho</span>
                    <p className="font-semibold text-gray-800 mt-0.5">
                      {order.deliveryAddress || 'Retiro Presencial en Local de Panadería'}
                    </p>
                  </div>
                </div>

                <div className="text-sm bg-white p-3.5 rounded-xl border border-[#ECE0CC] space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A755D]">Medio de Pago Principal:</span>
                    <span className="font-sans font-extrabold text-[#00652c] text-xs bg-[#EAFEEA] border border-[#BFF6C3] px-3 py-1 rounded-lg">
                      {order.paymentMethod || 'Efectivo'}
                    </span>
                  </div>

                  {/* Payment tracking details */}
                  <div className="pt-2.5 border-t border-dashed border-[#ECE0CC] space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-gray-600">
                      <span>Total Abonado / Pagado:</span>
                      <strong className="font-mono text-[#00652c]">{formatCLP(order.amountPaid ?? (order.total + (order.deliveryFee || 0)))}</strong>
                    </div>

                    {order.paymentMethod === 'Parcial' && (
                      <div className="bg-[#FAF9F5] p-2.5 rounded-lg text-xs space-y-2 border border-[#EADEC9]">
                        <div className="text-[9px] uppercase font-bold text-gray-400">Historial de Abonos registrados:</div>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="bg-white p-1.5 rounded border border-[#ECE0CC]">
                            <div className="text-[9px] text-gray-400 font-semibold">Efec 💵</div>
                            <div className="font-mono font-bold text-[#73624E] text-[11px]">{formatCLP(order.paymentEfectivo || 0)}</div>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-[#ECE0CC]">
                            <div className="text-[9px] text-gray-400 font-semibold">Transf 📲</div>
                            <div className="font-mono font-bold text-[#73624E] text-[11px]">{formatCLP(order.paymentTransferencia || 0)}</div>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-[#ECE0CC]">
                            <div className="text-[9px] text-gray-400 font-semibold">Tarj 💳</div>
                            <div className="font-mono font-bold text-[#73624E] text-[11px]">{formatCLP(order.paymentTarjeta || 0)}</div>
                          </div>
                        </div>

                        {/* Status bar */}
                        <div className="pt-1 border-t border-[#ECE0CC] flex justify-between items-center text-[11px]">
                          <span className="font-bold text-[#73624E]">Saldo Restante:</span>
                          {((order.amountPaid || 0) >= (order.total + (order.deliveryFee || 0))) ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              ✓ Total Completo 🟢
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Pendiente: {formatCLP((order.total + (order.deliveryFee || 0)) - (order.amountPaid || 0))} 🟡
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* INTERACTIVE PAYMENT EDITOR INTEGRATION */}
                    {onUpdatePayment && (
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => setIsEditingPayment(!isEditingPayment)}
                          className="w-full py-2 rounded-xl border border-[#00652c] text-[#00652c] hover:bg-emerald-50 text-[11px] font-bold transition-all text-center cursor-pointer block"
                        >
                          {isEditingPayment ? '✕ Cerrar Editor' : '✏️ Editar Métodos o Registrar Abonos'}
                        </button>

                        {isEditingPayment && (
                          <div className="mt-3 p-3 bg-[#FAF6EE] rounded-xl border border-[#EADEC9] space-y-3 text-left">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-[#73624E] uppercase block">
                                Método de Pago Actualizado
                              </label>
                              <div className="grid grid-cols-4 gap-1">
                                {['Efectivo', 'Transferencia', 'Tarjeta', 'Parcial'].map(m => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                      setEditMethod(m);
                                      if (m !== 'Parcial') {
                                        const tot = order.total + (order.deliveryFee || 0);
                                        setEditEf(m === 'Efectivo' ? tot : 0);
                                        setEditTrans(m === 'Transferencia' ? tot : 0);
                                        setEditTar(m === 'Tarjeta' ? tot : 0);
                                      }
                                    }}
                                    className={`px-1 py-1.5 text-[9px] font-bold rounded-lg border text-center transition-all ${
                                      editMethod === m
                                        ? 'bg-[#00652c] border-[#00652c] text-white'
                                        : 'bg-white border-[#D0C2AB] text-[#73624E] hover:bg-[#FAF9F5]'
                                    }`}
                                  >
                                    {m}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {editMethod === 'Parcial' && (
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-500 block">Efectivo 💵</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editEf || ''}
                                    onChange={(e) => setEditEf(Math.max(0, Number(e.target.value) || 0))}
                                    className="w-full text-xs font-mono p-1 border border-[#D0C2AB] rounded focus:outline-none focus:border-[#00652c] bg-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-500 block">Transfer 📲</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editTrans || ''}
                                    onChange={(e) => setEditTrans(Math.max(0, Number(e.target.value) || 0))}
                                    className="w-full text-xs font-mono p-1 border border-[#D0C2AB] rounded focus:outline-none focus:border-[#00652c] bg-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-500 block">Tarjeta 💳</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editTar || ''}
                                    onChange={(e) => setEditTar(Math.max(0, Number(e.target.value) || 0))}
                                    className="w-full text-xs font-mono p-1 border border-[#D0C2AB] rounded focus:outline-none focus:border-[#00652c] bg-white"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="bg-white p-2.5 rounded-lg border border-[#ECE0CC] text-[11px] space-y-1">
                              <div className="flex justify-between text-gray-500">
                                <span>Total del Pedido:</span>
                                <span>{formatCLP(order.total + (order.deliveryFee || 0))}</span>
                              </div>
                              <div className="flex justify-between font-bold text-[#00652c]">
                                <span>Monto Registrado:</span>
                                <span>{formatCLP(editMethod === 'Parcial' ? (editEf + editTrans + editTar) : (order.total + (order.deliveryFee || 0)))}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleSavePaymentEdits}
                              className="w-full py-2 bg-[#00652c] text-white rounded-xl hover:bg-[#005123] text-xs font-bold transition-all text-center cursor-pointer shadow-xs block"
                            >
                              Guardar Cambios de Pago
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TOTAL PRICES IN CLP */}
              <div className="border-t border-[#EADEC9] pt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-[#73624E]">
                  <span>Subtotal Elaboraciones:</span>
                  <span className="font-mono">{formatCLP(order.total)}</span>
                </div>
                {order.deliveryFee && order.deliveryFee > 0 ? (
                  <div className="flex justify-between items-center text-xs text-[#73624E]">
                    <span>Tarifa Despacho de Logística:</span>
                    <span className="font-mono text-emerald-800">+ {formatCLP(order.deliveryFee)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center text-base font-bold text-[#2C2114] bg-[#FAF6EE] p-3 rounded-xl border border-[#ECE0CC] mt-2">
                  <span>Monto Total a Cobrar:</span>
                  <span className="font-mono text-[#00652c] text-lg">
                    {formatCLP(order.total + (order.deliveryFee || 0))}
                  </span>
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="bg-[#FAF6EE] border-t border-[#EADEC9] p-5 flex flex-col gap-3 shrink-0">
              
              {onDeleteOrder && (
                <div className="w-full border-b border-[#EADEC9]/60 pb-3">
                  {!isConfirmingDelete ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="w-full py-2.5 rounded-xl border border-rose-200 hover:border-rose-400 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>Eliminar Pedido</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-center">
                      <p className="text-xs font-bold text-red-800">¿Está seguro que desea eliminar este pedido?</p>
                      <p className="text-[10px] text-red-600 font-medium select-none">Esta acción es irreversible y afectará la contabilidad.</p>
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (onDeleteOrder) {
                              onDeleteOrder(order.id);
                            }
                            setIsConfirmingDelete(false);
                            onClose();
                          }}
                          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          Sí, Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDelete(false)}
                          className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          No, Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2.5">
                {/* Transition status button */}
                {nextAction ? (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateStatus(order.id, nextAction.next);
                      onClose();
                    }}
                    className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-white text-xs font-bold transition-all hover:scale-[1.01] shadow-xs cursor-pointer text-center ${nextAction.color}`}
                  >
                    {nextAction.label}
                  </button>
                ) : (
                  <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center justify-center gap-1.5 text-[#00652c] font-bold text-xs">
                    <CheckCircle className="w-4 h-4" /> ¡Elaboración Completada!
                  </div>
                )}

                {/* Secondary action: simulated invoice print */}
                <button
                  type="button"
                  onClick={() => {
                    alert(`Imprimiendo comanda de cocina para pedido ${order.id}. Ticket enviado a la impresora.`);
                  }}
                  className="px-3.5 py-3 rounded-xl bg-white border border-[#D0C2AB] hover:bg-[#FAF6EE] text-[#73624E] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Imprimir Ticket"
                >
                  <Printer className="w-4 h-4" /> Imprimir Comanda
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
