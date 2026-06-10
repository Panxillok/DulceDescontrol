import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  User, 
  MapPin, 
  CheckCircle, 
  ChevronRight, 
  AlertTriangle,
  Play,
  Check,
  Truck,
  Plus,
  Package
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { getRelativeDateString } from '../data';

interface LogisticsModuleProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onOpenQuickOrder: () => void;
  onSelectOrder: (order: Order) => void;
  hideUpcoming?: boolean;
}

export default function LogisticsModule({ 
  orders, 
  onUpdateOrderStatus, 
  onOpenQuickOrder, 
  onSelectOrder,
  hideUpcoming = false 
}: LogisticsModuleProps) {
  const todayISO = getRelativeDateString(0);

  // Filter deliveries
  const todayDeliveries = orders
    .filter(order => order.deliveryDate === todayISO)
    .sort((a, b) => a.deliveryTime.localeCompare(b.deliveryTime));

  const upcomingDeliveries = orders
    .filter(order => order.deliveryDate !== todayISO)
    .sort((a, b) => {
      if (a.deliveryDate !== b.deliveryDate) {
        return a.deliveryDate.localeCompare(b.deliveryDate);
      }
      return a.deliveryTime.localeCompare(b.deliveryTime);
    });

  // Helper to format Spanish weekday name
  function getFriendlyDayLabel(dateStr: string): string {
    const today = getRelativeDateString(0);
    const tomorrow = getRelativeDateString(1);
    if (dateStr === today) return 'Hoy';
    if (dateStr === tomorrow) return 'Mañana';

    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
  }

  // CLP formatting helper
  const formatCLP = (val: number) => {
    return '$ ' + Math.round(val).toLocaleString('es-CL');
  };

  // Get status badge dynamic colors and icons
  const getStatusMeta = (status: OrderStatus) => {
    switch (status) {
      case 'Pendiente':
        return {
          bg: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
          badgeText: 'Pendiente',
          color: '#C2410C',
          icon: <Clock className="w-3.5 h-3.5" />
        };
      case 'Confirmado':
        return {
          bg: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
          badgeText: 'Confirmado',
          color: '#15803D',
          icon: <Check className="w-3.5 h-3.5" />
        };
      case 'En Producción':
        return {
          bg: 'bg-[#FEFCE8] text-[#854D0E] border-[#FEF08A] animate-pulse',
          badgeText: 'Baneando / Horno',
          color: '#854D0E',
          icon: <Play className="w-3.5 h-3.5 fill-current" />
        };
      case 'Listo':
        return {
          bg: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
          badgeText: 'Listo para despacho',
          color: '#047857',
          icon: <CheckCircle className="w-3.5 h-3.5" />
        };
      case 'Entregado':
        return {
          bg: 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]',
          badgeText: 'Entregado',
          color: '#64748B',
          icon: <Truck className="w-3.5 h-3.5" />
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          badgeText: status,
          color: '#374151',
          icon: <Clock className="w-3.5 h-3.5" />
        };
    }
  };

  const statusHierarchy: OrderStatus[] = ['Pendiente', 'Confirmado', 'En Producción', 'Listo', 'Entregado'];

  const cycleStatus = (order: Order) => {
    const currentIndex = statusHierarchy.indexOf(order.status);
    const nextIndex = (currentIndex + 1) % statusHierarchy.length;
    onUpdateOrderStatus(order.id, statusHierarchy[nextIndex]);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="logistics-module-grid">
      {/* 1. ENTREGAS DE HOY */}
      <div className={`${hideUpcoming ? 'xl:col-span-12' : 'xl:col-span-7'} bg-[#FDFBF7] rounded-3xl border border-[#EADEC9] p-6 shadow-xs flex flex-col`}>
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#EADEC9]/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#00652c] animate-pulse shrink-0" />
              <h3 className="font-sans font-bold text-xl text-[#2C2114]">
                Entregas de Hoy
              </h3>
            </div>
            <p className="text-xs text-[#73624E] mt-0.5">
              Presione la comanda para ver multiplicidades, despachos o comience preparación
            </p>
          </div>
          <button
            onClick={onOpenQuickOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00652c] text-white hover:bg-[#005223] transition-colors text-xs font-semibold shadow-xs touch-target-min cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Nuevo Pedido
          </button>
        </div>

        {todayDeliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-[#8C7A65] bg-[#FAF6EE] rounded-xl border border-dashed border-[#DED0B6] my-auto">
            <Package className="w-12 h-12 text-[#BCA374] mb-3" />
            <p className="font-medium">No hay entregas programadas de hoy</p>
            <p className="text-xs text-[#A18A68] mt-1">¡Buen momento para adelantar pre-producción!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {todayDeliveries.map((order) => {
                const meta = getStatusMeta(order.status);
                const isUrgent = order.status === 'Pendiente' && order.deliveryTime < '12:00';
                
                return (
                  <motion.div
                    key={order.id}
                    layoutId={`order-${order.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button')) return;
                      onSelectOrder(order);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:shadow-2xs ${
                      isUrgent 
                        ? 'bg-[#FFF5F5] border-[#FFC1C1]' 
                        : 'bg-white border-[#ECE0CC] hover:border-[#D0C2AB]'
                    }`}
                  >
                    {/* Time & Client Segment */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className={`px-3 py-2 rounded-xl text-center font-mono font-bold shrink-0 flex flex-col justify-center min-w-[72px] ${
                        isUrgent ? 'bg-[#FFD6D6] text-[#A81A1A] border border-[#FFA6A6]' : 'bg-[#FAF6EE] text-[#2C2114]'
                      }`}>
                        <span className="text-base tracking-tight">{order.deliveryTime}</span>
                        <span className="text-[9px] uppercase tracking-wider text-opacity-80">Hora</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-sans font-bold text-[#2C2114] text-base truncate">
                            {order.clientName}
                          </h4>
                          {isUrgent && (
                            <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#FFD6D6] text-[#A81A1A] px-1.5 py-0.5 rounded border border-[#FFA6A6]">
                              <AlertTriangle className="w-2.5 h-2.5" /> URGENTE
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-[#00652c] mt-0.5 flex items-center gap-1 truncate">
                          {order.productName}
                        </p>
                        
                        {/* Display Address & Shipment details */}
                        {order.deliveryAddress && (
                          <div className="flex items-center gap-1.5 text-xs text-[#73624E] mt-1.5 bg-[#FAF6EE] px-2.5 py-1 rounded-lg border border-[#ECE0CC] w-fit">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate max-w-[280px] sm:max-w-[400px]">{order.deliveryAddress}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-1.5 text-xs text-[#8A755D]">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">ID: {order.id}</span>
                          {order.deliveryFee && order.deliveryFee > 0 ? (
                            <span className="font-medium text-[#00652c] bg-[#EAFEEA] px-1.5 py-0.5 rounded border border-[#BFF6C3] text-[10px]">
                              + {formatCLP(order.deliveryFee)} envío
                            </span>
                          ) : (
                            <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">Retiro Local</span>
                          )}
                          {order.ingredientsDeducted && (
                            <span className="text-[#00652c] bg-emerald-50 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                              ✓ Inasum. Desc
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cost & Interactive Status Segment */}
                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-[#F4EFE6] shrink-0">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-[#8A755D] block uppercase">Cobro Ficha</span>
                        <span className="font-mono font-bold text-base text-[#2C2114]">
                          {formatCLP(order.total)}
                        </span>
                      </div>

                      {/* Tap Status to cycle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cycleStatus(order);
                        }}
                        title="Toca para cambiar estado"
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer active:scale-95 shadow-xs touch-target-min ${meta.bg}`}
                      >
                        {meta.icon}
                        <span>{meta.badgeText}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0 ml-0.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 2. PRÓXIMOS DÍAS (SEMANA) */}
      {!hideUpcoming && (
        <div className="xl:col-span-5 bg-[#FDFBF7] rounded-3xl border border-[#EADEC9] p-6 shadow-xs flex flex-col">
          <div className="pb-4 mb-4 border-b border-[#EADEC9]/60">
            <h3 className="font-sans font-bold text-lg text-[#2C2114] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#8A755D]" /> Anticipación Semanal
            </h3>
            <p className="text-xs text-[#73624E] mt-0.5">
              Pedidos programados de los próximos días
            </p>
          </div>

          {upcomingDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-[#8C7A65] bg-[#FAF6EE] rounded-xl border border-dashed border-[#DED0B6] my-auto">
              <p className="font-medium">Sin entregas para el resto de la semana</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {upcomingDeliveries.map((order) => {
                const meta = getStatusMeta(order.status);
                return (
                  <div
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className="p-3 bg-white hover:bg-[#FAF6EE] border border-[#ECE0CC] rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-[#8A755D] uppercase bg-[#FAF6EE] border border-[#EADEC9] px-2 py-0.5 rounded">
                        {getFriendlyDayLabel(order.deliveryDate)}
                      </span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[#8A755D] text-xs font-mono">{order.deliveryTime}</span>
                        <span className="text-[#8A755D]">•</span>
                        <span className="text-xs font-bold text-[#2C2114] truncate max-w-[140px]">
                          {order.clientName}
                        </span>
                      </div>
                      <p className="text-xs text-[#00652c] font-medium truncate max-w-[200px] mt-0.5">
                        {order.productName}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs font-mono font-bold text-[#2C2114]">
                        {formatCLP(order.total)}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${meta.bg}`}>
                        {meta.badgeText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
