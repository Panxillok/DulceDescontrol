import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, DollarSign, User, ClipboardList, Sparkles, MapPin } from 'lucide-react';
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
  { name: 'Lo Barnechea / Chicureo', fee: 10000 }
];

export default function AddOrderModal({ isOpen, onClose, onAddOrder, products }: AddOrderModalProps) {
  const [clientName, setClientName] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('25000');
  const [deliveryTime, setDeliveryTime] = useState('11:00');
  const [deliveryDate, setDeliveryDate] = useState(getRelativeDateString(0)); // today default
  const [status, setStatus] = useState<OrderStatus>('Confirmado');
  const [deliveryZone, setDeliveryZone] = useState('Retiro en local');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Set default product selected name and price on modal list refresh
  useEffect(() => {
    if (products && products.length > 0 && !productName) {
      setProductName(products[0].name);
      setPrice(products[0].price.toString());
    }
  }, [products]);

  const handleSelectPreset = (name: string, defaultPrice: number) => {
    setProductName(name);
    setPrice(Math.round(defaultPrice).toString());
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !productName.trim() || isNaN(Number(price))) return;

    onAddOrder({
      clientName: clientName.trim(),
      productName: productName.trim(),
      total: Number(price),
      deliveryTime,
      deliveryDate,
      status,
      deliveryAddress: deliveryZone === 'Retiro en local' ? 'Retiro en local' : deliveryAddress.trim(),
      deliveryFee: deliveryFee
    });

    // Reset fields
    setClientName('');
    setProductName(products.length > 0 ? products[0].name : '');
    setPrice(products.length > 0 ? products[0].price.toString() : '25000');
    setDeliveryTime('11:00');
    setDeliveryDate(getRelativeDateString(0));
    setStatus('Confirmado');
    setDeliveryZone('Retiro en local');
    setDeliveryAddress('');
    setDeliveryFee(0);
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
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-sans text-[#2C2114]">Ingresar Nuevo Pedido</h3>
                  <p className="text-xs text-[#73624E]">Completa el formulario para agendar en logística y producción</p>
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
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
              {/* Client and Product */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#2C2114] uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[#00652c]" /> Precio del Producto (CLP)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3.5 py-2.5 text-sm font-mono text-[#2C2114] focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]/30"
                  />
                </div>
              </div>

              {/* Product input and Preset buttons */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#2C2114] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#00652c]" /> Producto Solicitado
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pastel de Bodas Real de 3 Pisos"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3.5 py-2.5 text-sm text-[#2C2114] focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]/30"
                />

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#8A755D] uppercase block">Productos de Catálogo Activo (Tap rápido):</span>
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1 border border-dashed border-[#ECE0CC] rounded-xl bg-[#FAF9F5]">
                    {products.map((preset) => (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.name, preset.price)}
                        className={`text-xs px-2.5 py-2 rounded-lg border transition-all truncate text-left hover:scale-[1.01] ${
                          productName.toLowerCase() === preset.name.toLowerCase()
                            ? 'bg-[#EAFEEA] border-[#00652c] text-[#00652c] font-semibold'
                            : 'bg-white border-[#EADEC9] text-[#73624E] hover:bg-[#FAF6EE]'
                        }`}
                      >
                        {preset.name} ({formatCLP(preset.price)})
                      </button>
                    ))}
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
                    className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3.5 py-2 text-sm text-[#2C2114] focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]"
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
                    <Clock className="w-3.5 h-3.5 text-[#00652c]" /> Hora de Entrega o Retiro
                  </label>
                  <input
                    type="time"
                    required
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3.5 py-1.5 text-sm font-mono text-[#2C2114] focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#2C2114] uppercase tracking-wider flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5 text-[#00652c]" /> Estado Inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OrderStatus)}
                    className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3.5 py-2 text-sm text-[#2C2114] focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]"
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
                      className="w-full rounded-xl border border-[#D0C2AB] bg-white px-3.5 py-2 text-sm text-[#2C2114] focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c]"
                    >
                      {DELIVERY_ZONES.map((zone, idx) => (
                        <option key={idx} value={zone.name}>
                          {zone.name} ({formatCLP(zone.fee)})
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
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2C2114] focus:border-[#00652c] focus:outline-none focus:ring-1 focus:ring-[#00652c] ${
                        deliveryZone === 'Retiro en local' ? 'bg-[#FAF6EE]/50 border-dashed border-[#DED0B6] text-gray-400' : 'bg-white border-[#D0C2AB]'
                      }`}
                    />
                  </div>
                </div>
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
