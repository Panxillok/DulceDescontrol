import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  ClipboardList, 
  Sparkles, 
  MapPin, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Trash2 
} from 'lucide-react';
import { Order, OrderStatus, Product } from '../types';
import { getRelativeDateString } from '../data';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (order: Omit<Order, 'id'>) => void;
  products: Product[];
}

const DELIVERY_ZONES = [
  { name: 'Retiro en local', fee: 0 },
  { name: 'Santiago Centro / Providencia', fee: 4000 },
  { name: 'Las Condes / Vitacura', fee: 6000 },
  { name: 'La Reina / Ñuñoa / Italia', fee: 5000 },
  { name: 'Maipú / Cerrillos / Pudahuel', fee: 8000 },
  { name: 'Lo Barnechea / Chicureo', fee: 10000 },
  { name: 'Personalizado (Ingreso manual)', fee: 0 }
];

export default function AddOrderModal({ isOpen, onClose, onAddOrder, products }: AddOrderModalProps) {
  const [clientName, setClientName] = useState('');
  
  // Multiple products basket
  const [basket, setBasket] = useState<{ product: Product; quantity: number }[]>([]);
  
  // Real time synthesized values
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('0');
  
  const [deliveryTime, setDeliveryTime] = useState('11:00');
  const [deliveryDate, setDeliveryDate] = useState(getRelativeDateString(0)); // today default
  const [status, setStatus] = useState<OrderStatus>('Confirmado');
  const [deliveryZone, setDeliveryZone] = useState('Retiro en local');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Parcial'>('Efectivo');

  // Split payment amounts
  const [payEfectivo, setPayEfectivo] = useState<number>(0);
  const [payTransferencia, setPayTransferencia] = useState<number>(0);
  const [payTarjeta, setPayTarjeta] = useState<number>(0);

  // Synchronize basket changes to synthesized string name and calculated price
  useEffect(() => {
    if (basket.length > 0) {
      const orderSummary = basket.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
      const computedTotal = basket.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      setProductName(orderSummary);
      setPrice(computedTotal.toString());
    } else {
      setProductName('');
      setPrice('0');
    }
  }, [basket]);

  const handleAddProductToBasket = (prod: Product) => {
    setBasket(prev => {
      const existing = prev.find(item => item.product.id === prod.id);
      if (existing) {
        return prev.map(item => item.product.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [...prev, { product: prod, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (prodId: string, delta: number) => {
    setBasket(prev => {
      return prev.map(item => {
        if (item.product.id === prodId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const handleRemoveFromBasket = (prodId: string) => {
    setBasket(prev => prev.filter(item => item.product.id !== prodId));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !productName.trim() || isNaN(Number(price))) return;

    const orderGrandTotal = Number(price) + Number(deliveryFee);
    let finalAmountPaid = orderGrandTotal;
    let finalEfectivo = 0;
    let finalTransferencia = 0;
    let finalTarjeta = 0;

    if (paymentMethod === 'Efectivo') {
      finalEfectivo = orderGrandTotal;
    } else if (paymentMethod === 'Transferencia') {
      finalTransferencia = orderGrandTotal;
    } else if (paymentMethod === 'Tarjeta') {
      finalTarjeta = orderGrandTotal;
    } else if (paymentMethod === 'Parcial') {
      finalAmountPaid = payEfectivo + payTransferencia + payTarjeta;
      finalEfectivo = payEfectivo;
      finalTransferencia = payTransferencia;
      finalTarjeta = payTarjeta;
    }

    onAddOrder({
      clientName: clientName.trim(),
      productName: productName.trim(),
      total: Number(price),
      deliveryTime,
      deliveryDate,
      status,
      deliveryAddress: deliveryZone === 'Retiro en local' ? 'Retiro en local' : deliveryAddress.trim(),
      deliveryFee: deliveryFee,
      paymentMethod,
      amountPaid: finalAmountPaid,
      paymentEfectivo: finalEfectivo,
      paymentTransferencia: finalTransferencia,
      paymentTarjeta: finalTarjeta
    });

    // Reset fields
    setClientName('');
    setBasket([]);
    setProductName('');
    setPrice('0');
    setDeliveryTime('11:00');
    setDeliveryDate(getRelativeDateString(0));
    setStatus('Confirmado');
    setDeliveryZone('Retiro en local');
    setDeliveryAddress('');
    setDeliveryFee(0);
    setPaymentMethod('Efectivo');
    setPayEfectivo(0);
    setPayTransferencia(0);
    setPayTarjeta(0);
    onClose();
  };

  const formatCLP = (val: number) => {
    return '$ ' + Math.round(val).toLocaleString('es-CL');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
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
            className="bg-[#FDFBF7] rounded-3xl border-2 border-[#EADEC9] shadow-xl w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-[#FAF6EE] border-b border-[#EADEC9] p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#EAFEEA] rounded-lg text-[#00652c] border border-[#BFF6C3]">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-sans text-[#2C2114]">Ingresar Nuevo Pedido</h3>
                  <p className="text-xs text-[#73624E]">Crea un pedido con uno o más productos del catálogo pastelero</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-[#EADEC9]/40 flex items-center justify-center text-[#73624E] transition-colors cursor-pointer touch-target-min"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-left">
              {/* Client Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2C2114] uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#00652c]" /> Nombre del Cliente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María de la Luz"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3.5 py-2.5 text-sm text-[#2C2114] focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]/30"
                />
              </div>

              {/* PRODUCT SELECTION & BASKET */}
              <div className="space-y-3 bg-white border border-[#EADEC9] rounded-2xl p-4">
                <span className="text-xs font-bold text-[#2C2114] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#FAF6EE] pb-2">
                  <Sparkles className="w-4 h-4 text-[#00652c]" /> Canasta de Pasteles y Dulces
                </span>

                {/* 1. Catalog presets selector (clickable chips) */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#8A755D] block">Catálogo del día (Toca para agregar):</span>
                  <div className="flex flex-wrap gap-1.5 max-h-[130px] overflow-y-auto p-1.5 border border-dashed border-[#ECE0CC] rounded-xl bg-[#FAF9F5]">
                    {products.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleAddProductToBasket(p)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border bg-white border-[#EADEC9] text-[#73624E] hover:bg-[#EAFEEA] hover:border-[#00652c] hover:text-[#00652c] transition-all truncate text-left"
                      >
                        + {p.name} ({formatCLP(p.price)})
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Current basket list */}
                {basket.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] uppercase font-bold text-[#8A755D] block">Productos seleccionados:</span>
                    <div className="divide-y divide-[#FAF6EE] max-h-[160px] overflow-y-auto pr-1">
                      {basket.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2 text-xs">
                          <span className="font-semibold text-[#2C2114] truncate max-w-[280px]">
                            {item.product.name}
                          </span>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[#8A755D] font-mono mr-2">
                              {formatCLP(item.product.price * item.quantity)}
                            </span>
                            
                            <div className="flex items-center border border-[#D0C2AB] rounded-lg overflow-hidden bg-[#FAF9F5]">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.product.id, -1)}
                                className="px-2 py-1 hover:bg-[#EADEC9]/40 text-[#73624E] font-bold"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-3 py-1 bg-white font-mono font-bold text-[#2C2114]">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddProductToBasket(item.product)}
                                className="px-2 py-1 hover:bg-[#EADEC9]/40 text-[#73624E] font-bold"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveFromBasket(item.product.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-xs font-medium">
                    ⚠️ No has añadido ningún producto. Selecciona arriba para armar la canasta.
                  </div>
                )}
              </div>

              {/* Synthesized Output Preview (Editable) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#FAF9F5] p-4 rounded-2xl border border-[#ECE0CC]">
                <div className="md:col-span-8 space-y-1">
                  <label className="text-[10px] font-bold text-[#73624E] uppercase block">Resumen del Pedido (Modificable)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1x Pastel de Bodas"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3 py-2 text-xs text-[#2C2114] focus:border-[#00652c] focus:outline-none"
                  />
                </div>
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-[#73624E] uppercase block">Total a Cobrar (CLP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full rounded-xl border border-[#D0C2AB] bg-white pl-6 pr-2 py-2 text-xs font-mono font-bold text-[#00652c] focus:border-[#00652c] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Date, Time, and Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#2C2114] uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#00652c]" /> Fecha de Entrega
                  </label>
                  <select
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3.5 py-2 text-sm text-[#2C2114] focus:border-[#00652c] focus:outline-none"
                  >
                    <option value={getRelativeDateString(0)}>Hoy ({getRelativeDateString(0)})</option>
                    <option value={getRelativeDateString(1)}>Mañana ({getRelativeDateString(1)})</option>
                    <option value={getRelativeDateString(2)}>En 2 días ({getRelativeDateString(2)})</option>
                    <option value={getRelativeDateString(3)}>En 3 días ({getRelativeDateString(3)})</option>
                    <option value={getRelativeDateString(4)}>En 4 días ({getRelativeDateString(4)})</option>
                    <option value={getRelativeDateString(5)}>En 5 días ({getRelativeDateString(5)})</option>
                    <option value={getRelativeDateString(6)}>En 6 días ({getRelativeDateString(6)})</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#2C2114] uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#00652c]" /> Hora de Despacho
                  </label>
                  <input
                    type="time"
                    required
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3.5 py-1.5 text-sm font-mono text-[#2C2114] focus:border-[#00652c] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#2C2114] uppercase tracking-wider flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5 text-[#00652c]" /> Estado Inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OrderStatus)}
                    className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3.5 py-2 text-sm text-[#2C2114] focus:border-[#00652c] focus:outline-none"
                  >
                    <option value="Pendiente">Pendiente (No proyectar)</option>
                    <option value="Confirmado">Confirmado (Proyectar)</option>
                    <option value="En Producción">En Producción (Descontar insumos)</option>
                    <option value="Listo">Listo para entrega</option>
                  </select>
                </div>
              </div>

              {/* Despacho (Dirección y Tarifa de Envío) */}
              <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#ECE0CC] space-y-4">
                <span className="text-xs font-bold text-[#2C2114] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#A81A1A]" /> Despacho a Domicilio o Retiro
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#73624E] block">
                      Comuna y Tarifa Pre-configurada
                    </label>
                    <select
                      value={deliveryZone}
                      onChange={(e) => {
                        const zoneName = e.target.value;
                        setDeliveryZone(zoneName);
                        const matched = DELIVERY_ZONES.find(z => z.name === zoneName);
                        if (matched) {
                          setDeliveryFee(matched.fee);
                        }
                      }}
                      className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3.5 py-2 text-sm text-[#2C2114] focus:border-[#00652c] focus:outline-none"
                    >
                      {DELIVERY_ZONES.map((zone, idx) => (
                        <option key={idx} value={zone.name}>
                          {zone.name} {zone.name !== 'Retiro en local' && zone.name !== 'Personalizado (Ingreso manual)' ? `(${formatCLP(zone.fee)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#73624E] block">
                      Dirección Completa de Despacho
                    </label>
                    <input
                      type="text"
                      disabled={deliveryZone === 'Retiro en local'}
                      required={deliveryZone !== 'Retiro en local'}
                      placeholder={deliveryZone === 'Retiro en local' ? 'No aplica - Cliente retira en local' : 'Ej. Av. Vitacura 3500, Vitacura'}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2C2114] focus:border-[#00652c] focus:outline-none ${
                        deliveryZone === 'Retiro en local' ? 'bg-[#FAF6EE]/50 border-dashed border-[#DED0B6] text-gray-400' : 'bg-white border-[#D0C2AB]'
                      }`}
                    />
                  </div>
                </div>

                {/* Manual Fee Overrider Field */}
                {deliveryZone !== 'Retiro en local' && (
                  <div className="space-y-1.5 pt-2 border-t border-dashed border-[#ECE0CC] max-w-xs">
                    <label className="text-[11px] font-bold text-[#73624E] uppercase block">
                      Tarifa Personalizada de Despacho (Modificable)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                      <input
                        type="number"
                        placeholder="Cantidad a cobrar por delivery"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                        className="w-full rounded-xl border border-[#D0C2AB] bg-white pl-6 pr-2 py-2 text-xs font-mono font-semibold text-[#2C2114] focus:border-[#00652c] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* MEDIO DE PAGO */}
              <div className="bg-[#FAF6EE] p-4 rounded-xl border border-[#ECE0CC] space-y-3">
                <label className="text-xs font-bold text-[#2C2114] uppercase tracking-wider block">
                  💳 Medio de Pago Seleccionado
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'Efectivo', label: 'Efectivo 💵' },
                    { value: 'Transferencia', label: 'Transfer 📲' },
                    { value: 'Tarjeta', label: 'Tarjeta 💳' },
                    { value: 'Parcial', label: 'Parcial 👥' }
                  ].map(method => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value as any)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                        paymentMethod === method.value
                          ? 'bg-[#00652c] border-[#00652c] text-white shadow-2xs'
                          : 'bg-white border-[#D0C2AB] text-[#73624E] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>

                {/* Split inputs if Parcial */}
                {paymentMethod === 'Parcial' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-3 bg-white rounded-xl border border-[#EADEC9] space-y-3 overflow-hidden text-left"
                  >
                    <div className="text-xs font-bold text-[#73624E] mb-1">
                      Desglose de Pago Parcial (Abonos)
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 block">Efectivo 💵</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400">$</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={payEfectivo || ''}
                            onChange={(e) => setPayEfectivo(Math.max(0, Number(e.target.value) || 0))}
                            className="w-full text-xs font-mono p-1.5 pl-4 border border-[#D0C2AB] rounded-lg focus:outline-none focus:border-[#00652c]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 block">Transfer 📲</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400">$</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={payTransferencia || ''}
                            onChange={(e) => setPayTransferencia(Math.max(0, Number(e.target.value) || 0))}
                            className="w-full text-xs font-mono p-1.5 pl-4 border border-[#D0C2AB] rounded-lg focus:outline-none focus:border-[#00652c]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 block">Tarjeta 💳</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400">$</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={payTarjeta || ''}
                            onChange={(e) => setPayTarjeta(Math.max(0, Number(e.target.value) || 0))}
                            className="w-full text-xs font-mono p-1.5 pl-4 border border-[#D0C2AB] rounded-lg focus:outline-none focus:border-[#00652c]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#FAF9F5] p-2.5 rounded-lg text-[11px] space-y-1.5 border border-[#ECE0CC]">
                      <div className="flex justify-between font-medium text-[#73624E]">
                        <span>Total del Pedido (+ Delivery):</span>
                        <span className="font-mono font-bold text-gray-800">{formatCLP(Number(price) + Number(deliveryFee))}</span>
                      </div>
                      <div className="flex justify-between font-medium text-[#73624E]">
                        <span>Monto Ingresado (Abonado):</span>
                        <span className="font-mono font-bold text-[#00652c]">{formatCLP(payEfectivo + payTransferencia + payTarjeta)}</span>
                      </div>
                      
                      {/* Comparison Status */}
                      <div className="pt-1.5 border-t border-[#ECE0CC] flex justify-between items-center text-xs">
                        <span className="font-bold">Estado del Pago:</span>
                        {(payEfectivo + payTransferencia + payTarjeta) >= (Number(price) + Number(deliveryFee)) ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Totalmente Pagado 🟢
                          </span>
                        ) : (payEfectivo + payTransferencia + payTarjeta) > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Abonado parcial 🟡 (Falta {formatCLP((Number(price) + Number(deliveryFee)) - (payEfectivo + payTransferencia + payTarjeta))})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            No pagado yet 🔴
                          </span>
                        )}
                      </div>

                      {/* Quick full-filler helper */}
                      { (Number(price) + Number(deliveryFee)) - (payEfectivo + payTransferencia + payTarjeta) > 0 && (
                        <div className="pt-2 flex flex-wrap gap-1.5">
                          <span className="text-[10px] text-gray-500 self-center">Autocompletar faltante:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const remainingVal = (Number(price) + Number(deliveryFee)) - (payEfectivo + payTransferencia + payTarjeta);
                              setPayEfectivo(prev => prev + remainingVal);
                            }}
                            className="bg-white border border-[#D0C2AB] hover:bg-[#FAF9F5] px-2 py-0.5 rounded text-[10px] font-bold text-[#73624E] transition-all"
                          >
                            + Efec 💵
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const remainingVal = (Number(price) + Number(deliveryFee)) - (payEfectivo + payTransferencia + payTarjeta);
                              setPayTransferencia(prev => prev + remainingVal);
                            }}
                            className="bg-white border border-[#D0C2AB] hover:bg-[#FAF9F5] px-2 py-0.5 rounded text-[10px] font-bold text-[#73624E] transition-all"
                          >
                            + Transfer 📲
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const remainingVal = (Number(price) + Number(deliveryFee)) - (payEfectivo + payTransferencia + payTarjeta);
                              setPayTarjeta(prev => prev + remainingVal);
                            }}
                            className="bg-white border border-[#D0C2AB] hover:bg-[#FAF9F5] px-2 py-0.5 rounded text-[10px] font-bold text-[#73624E] transition-all"
                          >
                            + Tarj 💳
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-[#EADEC9]/60 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-[#D0C2AB] text-[#73624E] hover:bg-[#FAF6EE] text-sm font-bold transition-all touch-target-min cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-[#00652c] text-white hover:bg-[#005123] text-sm font-bold transition-all shadow-sm hover:shadow-md touch-target-min cursor-pointer text-center"
                >
                  Guardar Pedido
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
