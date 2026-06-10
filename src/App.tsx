import { useState, useEffect } from 'react';
import { 
  INITIAL_ORDERS, 
  INITIAL_INGREDIENTS, 
  INITIAL_RECIPES, 
  INITIAL_EXPENSES,
  getRelativeDateString 
} from './data';
import { Order, OrderStatus, Ingredient, Recipe, Expense, Product } from './types';
import FinancialModule from './components/FinancialModule';
import LogisticsModule from './components/LogisticsModule';
import InventoryModule from './components/InventoryModule';
import AddOrderModal from './components/AddOrderModal';
import ProductsModule from './components/ProductsModule';
import OrderDetailModal from './components/OrderDetailModal';
import { 
  ChefHat, 
  Search, 
  Bell, 
  Settings, 
  HelpCircle, 
  Calendar,
  UtensilsCrossed,
  Package,
  ShoppingCart,
  Undo2,
  AlertTriangle,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertOctagon,
  ChevronDown,
  Tag
} from 'lucide-react';

// A. COLLAPSIBLE ACCORDION FOR WEAKLY INGREDIENT INVENTORIES
function CriticalIngredientsAccordion({ 
  ingredients, 
  onRestock 
}: { 
  ingredients: Ingredient[]; 
  onRestock: (id: string) => void; 
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const criticals = ingredients.filter(i => i.currentStock < i.criticalLimit || i.status === 'Crítico');

  return (
    <div className="bg-[#FFF5F5] border-2 border-[#FFAEA9] rounded-2xl overflow-hidden shadow-xs transition-all" id="critical-stock-accordion">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-[#FFECEC] text-[#A81A1A] font-bold text-sm cursor-pointer hover:bg-[#FFD9D9] transition-colors focus:outline-none"
      >
        <span className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 animate-bounce shrink-0" />
          <span>Alerta de Ingredientes Críticos en Cocina ({criticals.length})</span>
        </span>
        <span className="text-xs flex items-center gap-1 font-semibold uppercase">
          {isExpanded ? 'Contraer' : 'Desplegar'} lista
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 bg-white border-t border-[#FFAEA9]">
          {criticals.length === 0 ? (
            <p className="text-xs text-[#00652c] font-semibold text-center py-2">
              🟢 No hay insumos en estado crítico. ¡Todo aprovisionado para la semana!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {criticals.map(ing => (
                <div key={ing.id} className="p-3 rounded-xl border border-[#FFAEA9] bg-[#FFF8F8] flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-[#2C2114] truncate">{ing.name}</h5>
                    <span className="text-[10px] text-[#A81A1A] font-mono mt-0.5 block font-bold">
                      Stock: {ing.currentStock} {ing.unit} (Límite: {ing.criticalLimit} {ing.unit})
                    </span>
                  </div>
                  <button
                    onClick={() => onRestock(ing.id)}
                    className="text-[10px] font-bold bg-[#A81A1A] hover:bg-[#851111] text-white px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer shadow-xs transition-colors"
                  >
                    Reabastecer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  // Initialize states with local data so user gets instant painting
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [products, setProducts] = useState<Product[]>([]);
  
  // UI States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pedidos' | 'inventario' | 'productos'>('dashboard');
  const [dashboardStatus, setDashboardStatus] = useState<'semanal' | 'mensual'>('semanal');
  const [showAlert, setShowAlert] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Synchronize state with Full-Stack REST API on startup
  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.warn('Could not sync orders with server backend api:', err));

    fetch('/api/ingredients')
      .then(res => res.json())
      .then(data => setIngredients(data))
      .catch(err => console.warn('Could not sync ingredients with server backend api:', err));

    fetch('/api/recipes')
      .then(res => res.json())
      .then(data => setRecipes(data))
      .catch(err => console.warn('Could not sync recipes with server backend api:', err));

    fetch('/api/expenses')
      .then(res => res.json())
      .then(data => setExpenses(data))
      .catch(err => console.warn('Could not sync expenses with server backend api:', err));

    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.warn('Could not sync products with server backend api:', err));
  }, []);

  // PRODUCT HANDLERS FOR PRODUCTS CATALOG MODULE
  const handleAddProduct = async (name: string, price: number): Promise<void> => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price })
    });
    if (!res.ok) throw new Error('Error al agregar producto');
    const newProd = await res.json();
    setProducts(prev => [...prev, newProd]);
  };

  const handleUpdateProduct = async (id: string, name: string, price: number): Promise<void> => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price })
    });
    if (!res.ok) throw new Error('Error al actualizar producto');
    setProducts(prev => prev.map(p => p.id === id ? { ...p, name, price } : p));
  };

  const handleDeleteProduct = async (id: string): Promise<void> => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar producto');
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Notifications simulation data
  const notifications = [
    { id: 1, text: '¡ALERTA!: Especial Mantequilla en nivel crítico', type: 'error', time: 'Hace 5m' },
    { id: 2, text: 'Nuevo pedido agendado de Andrés Mendoza', type: 'info', time: 'Hace 20m' },
    { id: 3, text: 'Masa de hojaldre templada lista en horno', type: 'success', time: 'Hace 1h' }
  ];

  // LOGISTICS HANDLERS
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    // Optimistic UI update
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    }).catch(err => console.error('Error synchronizing status API:', err));
  };

  const handleAddOrder = (newOrderData: Omit<Order, 'id'>) => {
    // Save to server
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrderData)
    })
      .then(res => res.json())
      .then(savedOrder => {
        setOrders(prev => [savedOrder, ...prev]);
      })
      .catch(err => {
        console.error('Error creating order API, falling back to local simulation:', err);
        const id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        setOrders(prev => [{ id, ...newOrderData }, ...prev]);
      });
  };

  // INVENTORY HANDLERS
  const handleUpdateStock = (ingredientId: string, delta: number) => {
    let targetStock = 0;
    let targetStatus: Ingredient['status'] = 'Suficiente';

    setIngredients(prevIngs => 
      prevIngs.map(ing => {
        if (ing.id !== ingredientId) return ing;
        const newStock = Math.max(0, Number((ing.currentStock + delta).toFixed(2)));
        targetStock = newStock;
        
        let status: 'Crítico' | 'Agotándose' | 'Suficiente' = 'Suficiente';
        if (newStock < ing.criticalLimit * 0.4) {
          status = 'Crítico';
        } else if (newStock < ing.criticalLimit) {
          status = 'Agotándose';
        }
        targetStatus = status;

        return {
          ...ing,
          currentStock: newStock,
          status
        };
      })
    );

    // Sync API
    setTimeout(() => {
      fetch(`/api/ingredients/${ingredientId}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStock: targetStock, status: targetStatus })
      }).catch(err => console.error('Error syncing ingredient API:', err));
    }, 50);
  };

  const handleRestockIngredient = (ingredientId: string) => {
    const targetStock = 12.0; // Optimum stock safe value
    const targetStatus = 'Suficiente';

    setIngredients(prevIngs => 
      prevIngs.map(ing => {
        if (ing.id !== ingredientId) return ing;
        return {
          ...ing,
          currentStock: targetStock,
          status: targetStatus
        };
      })
    );

    fetch(`/api/ingredients/${ingredientId}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentStock: targetStock, status: targetStatus })
    }).catch(err => console.error('Error syncing restock API:', err));
  };

  const handleToggleRecipeActive = (recipeId: string) => {
    let nextActive = false;
    setRecipes(prevRecipes => 
      prevRecipes.map(r => {
        if (r.id === recipeId) {
          nextActive = !r.activeThisWeek;
          return { ...r, activeThisWeek: nextActive };
        }
        return r;
      })
    );

    fetch(`/api/recipes/${recipeId}/toggle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeThisWeek: nextActive })
    }).catch(err => console.error('Error saving active recipe API:', err));
  };

  // EXPENSES HANDLERS
  const handleAddExpense = (newExpenseData: Omit<Expense, 'id'>) => {
    fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExpenseData)
    })
      .then(res => res.json())
      .then(savedExpense => {
        setExpenses(prev => [savedExpense, ...prev]);
      })
      .catch(err => {
        console.error('Error saving expense, falling back to offline simulation:', err);
        const id = `EXP-${Math.floor(100 + Math.random() * 900)}`;
        setExpenses(prev => [{ id, ...newExpenseData }, ...prev]);
      });
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== expenseId));

    fetch(`/api/expenses/${expenseId}`, {
      method: 'DELETE'
    }).catch(err => console.error('Error deleting expense API:', err));
  };

  // Reset demo state
  const handleResetData = () => {
    if (window.confirm('¿Deseas restablecer todos los pedidos y stocks a los valores iniciales en la base de datos?')) {
      fetch('/api/reset', { method: 'POST' })
        .then(() => {
          setOrders(INITIAL_ORDERS);
          setIngredients(INITIAL_INGREDIENTS);
          setRecipes(INITIAL_RECIPES);
          setExpenses(INITIAL_EXPENSES);
          setSearchQuery('');
          alert('¡Base de datos y almacén restablecidos con éxito!');
        })
        .catch(err => {
          console.error('API Error resetting DB:', err);
          setOrders(INITIAL_ORDERS);
          setIngredients(INITIAL_INGREDIENTS);
          setRecipes(INITIAL_RECIPES);
          setExpenses(INITIAL_EXPENSES);
        });
    }
  };

  // Filters by quick search
  const filteredOrders = searchQuery.trim() === ''
    ? orders
    : orders.filter(o => 
        o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const filteredIngredients = searchQuery.trim() === ''
    ? ingredients
    : ingredients.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getChileanDateLabel = () => {
    const d = new Date();
    const formatted = d.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div className="h-screen w-screen bg-[#FAF7F2] text-[#2C2114] flex font-sans overflow-hidden select-none" id="bakery-app-root">
      
      {/* COLLAPSIBLE LEFT NAVIGATION SIDEBAR */}
      <aside className={`${isSidebarCollapsed ? 'w-20 px-3' : 'w-72 p-6'} bg-white border-r-2 border-[#EADEC9] h-full flex flex-col justify-between shrink-0 transition-all duration-300 relative z-20 shadow-xs`}>
        {/* Slide toggle button on border */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#FAF6EE] hover:bg-white text-[#73624E] hover:text-[#00652c] rounded-full border border-[#D0C2AB] flex items-center justify-center cursor-pointer transition-all shadow-xs z-30 focus:outline-none"
          title={isSidebarCollapsed ? "Expandir Menú" : "Contraer Menú"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4 text-[#00652c]" /> : <ChevronLeft className="w-4 h-4 text-[#00652c]" />}
        </button>

        <div className="space-y-8">
          {/* Logo Brand Header */}
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-12 h-12 rounded-2xl bg-[#EAFEEA] border border-[#BFF6C3] flex items-center justify-center text-[#00652c] shrink-0">
              <ChefHat className="w-7 h-7 stroke-[2.2]" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className="font-sans font-extrabold text-base text-[#00652c] leading-none tracking-tight">
                  Artisan Bakehouse
                </h1>
                <span className="text-[10px] uppercase font-bold text-[#8A755D] tracking-wider mt-1 block">
                  Dashboard de Cocina
                </span>
              </div>
            )}
          </div>

          {/* Quick Stats Panel (Hides when collapsed for clean typography) */}
          {!isSidebarCollapsed && (
            <div className="bg-[#FAF6EE] border border-[#ECE0CC] p-4 rounded-xl space-y-2.5">
              <div className="text-[10px] font-bold text-[#8A755D] uppercase tracking-wider flex justify-between">
                <span>Estado Operativo</span>
                <span className="text-[#00652c] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00652c] animate-pulse" /> ACTIVO
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#ECE0CC]">
                <div>
                  <span className="text-xs text-[#8A755D] block">Entregas Hoy</span>
                  <strong className="text-lg font-sans font-bold text-[#2C2114]">
                    {orders.filter(o => o.deliveryDate === getRelativeDateString(0)).length}
                  </strong>
                </div>
                <div>
                  <span className="text-xs text-[#8A755D] block">Bajo Stock</span>
                  <strong className="text-lg font-sans font-bold text-[#A81A1A]">
                    {ingredients.filter(i => i.currentStock < i.criticalLimit).length}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Nav Tabs */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              title={isSidebarCollapsed ? "Dashboard de Cocina" : undefined}
              className={`w-full flex items-center gap-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'
              } ${
                activeTab === 'dashboard'
                  ? 'bg-[#EAFEEA] border-l-4 border-l-[#00652c] text-[#00652c] font-extrabold'
                  : 'text-[#73624E] hover:bg-[#FAF6EE] hover:text-[#2C2114]'
              }`}
            >
              <UtensilsCrossed className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Dashboard de Cocina</span>}
            </button>

            <button
              onClick={() => setActiveTab('pedidos')}
              title={isSidebarCollapsed ? "Logística de Pedidos" : undefined}
              className={`w-full flex items-center gap-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'
              } ${
                activeTab === 'pedidos'
                  ? 'bg-[#EAFEEA] border-l-4 border-l-[#00652c] text-[#00652c] font-extrabold'
                  : 'text-[#73624E] hover:bg-[#FAF6EE] hover:text-[#2C2114]'
              }`}
            >
              <Package className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && (
                <>
                  <span>Logística de Pedidos</span>
                  <span className="ml-auto bg-[#ECE0CC] text-[#73624E] text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                    {orders.length}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inventario')}
              title={isSidebarCollapsed ? "Inventario de Insumos" : undefined}
              className={`w-full flex items-center gap-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'
              } ${
                activeTab === 'inventario'
                  ? 'bg-[#EAFEEA] border-l-4 border-l-[#00652c] text-[#00652c] font-extrabold'
                  : 'text-[#73624E] hover:bg-[#FAF6EE] hover:text-[#2C2114]'
              }`}
            >
              <ShoppingCart className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && (
                <>
                  <span>Inventario de Insumos</span>
                  <span className="ml-auto bg-[#FEE2E2] text-[#A81A1A] text-[10px] font-bold px-2 py-0.5 rounded-full font-mono font-bold">
                    {ingredients.filter(i => i.currentStock < i.criticalLimit).length}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={() => setActiveTab('productos')}
              title={isSidebarCollapsed ? "Catálogo de Productos" : undefined}
              className={`w-full flex items-center gap-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'
              } ${
                activeTab === 'productos'
                  ? 'bg-[#EAFEEA] border-l-4 border-l-[#00652c] text-[#00652c] font-extrabold'
                  : 'text-[#73624E] hover:bg-[#FAF6EE] hover:text-[#2C2114]'
              }`}
            >
              <Tag className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && (
                <>
                  <span>Catálogo de Productos</span>
                  <span className="ml-auto bg-[#EAFEEA] text-[#00652c] text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                    {products.length}
                  </span>
                </>
              )}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-4 pt-4 border-t border-[#EADEC9]">
          <div className={`flex gap-2 ${isSidebarCollapsed ? 'flex-col items-center' : ''}`}>
            <button
              onClick={handleResetData}
              className={`${isSidebarCollapsed ? 'p-2' : 'flex-1 px-3 py-2 border border-[#ECE0CC] bg-[#FAF6EE] text-[#73624E]'} flex items-center justify-center gap-1 rounded-lg hover:text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer`}
              title="Restablecer base de datos inicial para demostración"
            >
              <Undo2 className="w-4 h-4" />
              {!isSidebarCollapsed && <span>Restablecer</span>}
            </button>
            <button
              onClick={() => alert('Información: El color verde representa ingresos confirmados de venta. El color rojo destaca los insumos críticos en el almacén o egresos financieros. Selecciona entre las vistas Semanal y Mensual del Dashboard para alternar enfoques operativos y contables.')}
              className="p-2 border border-[#ECE0CC] bg-[#FAF6EE] hover:bg-white text-[#73624E] hover:text-[#2C2114] rounded-lg transition-all flex items-center justify-center cursor-pointer"
              title="Información"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className="text-[11px] text-[#A18A68] text-center">
              <p>Tablet OS v1.6 • FullStack</p>
              <p className="font-mono mt-0.5">PostgreSQL / JSON</p>
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TOP SYSTEM NAV BAR */}
        <header className="bg-white border-b-2 border-[#EADEC9] h-20 px-8 flex justify-between items-center shrink-0">
          {/* Left quick search */}
          <div className="flex-1 max-w-md">
            <div className="relative flex items-center w-full h-11 bg-[#FAF6EE] rounded-xl border border-[#D0C2AB] focus-within:border-[#00652c] focus-within:ring-2 focus-within:ring-[#00652c]/10 transition-colors">
              <Search className="absolute left-3.5 text-[#8A755D] w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar clientes, recetas, despacho, insumos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full pl-11 pr-4 bg-transparent outline-none text-sm text-[#2C2114] placeholder-[#8A755D]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-xs bg-[#ECE0CC] text-[#73624E] hover:text-[#2C2114] px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Right quick controls */}
          <div className="flex items-center gap-5">
            <div className="text-right hidden lg:block">
              <span className="text-xs text-[#8A755D] font-bold block uppercase tracking-wider">Hoy en Cocina</span>
              <span className="font-mono font-bold text-xs text-[#2C2114] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#00652c]" /> {getChileanDateLabel()}
              </span>
            </div>

            <div className="h-8 w-px bg-[#EADEC9] hidden md:block" />

            {/* Notification system */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-xl bg-[#FAF6EE] border border-[#ECE0CC] flex items-center justify-center text-[#73624E] hover:text-[#00652c] relative transition-colors cursor-pointer touch-target-min"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#A81A1A] text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3.5 w-80 bg-white border-2 border-[#EADEC9] rounded-2xl shadow-xl p-4 z-50 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-[#EADEC9] mb-2">
                    <strong className="text-xs font-bold text-[#2C2114] uppercase">Campana de Avisos</strong>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] text-[#00652c] font-semibold hover:underline cursor-pointer">Cerrar</button>
                  </div>
                  <div className="space-y-2">
                    {notifications.map(notif => (
                      <div key={notif.id} className="p-2 border border-[#FAF6EE] bg-[#FAF8F5] rounded-lg">
                        <p className="text-xs font-medium text-[#2C2114]">{notif.text}</p>
                        <span className="text-[9px] text-[#8A755D] mt-0.5 block">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chef Profile Avatar */}
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-full bg-[#EAFEEA] border-2 border-[#00652c] overflow-hidden shadow-xs">
                <img 
                  src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=200" 
                  referrerPolicy="no-referrer"
                  alt="Pastelera Chef" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left hidden xl:block">
                <p className="text-xs font-extrabold text-[#2C2114] leading-none">Chef Repostera</p>
                <span className="text-[10px] font-medium text-[#8A755D]">Encargada de Turno</span>
              </div>
            </div>
          </div>
        </header>

        {/* ALERTS MESSAGE STRIP */}
        {showAlert && (
          <div className="bg-[#FFF8E6] border-b border-[#F5E1A4] px-8 py-3 flex justify-between items-center text-xs text-[#854D0E] shrink-0">
            <div className="flex items-center gap-2 pr-4">
              <span className="flex h-2 w-2 rounded-full bg-[#EAB308]" />
              <p className="font-medium text-[11px] leading-relaxed">
                <strong className="font-bold uppercase tracking-wide mr-1.5">Mapeo de Base de Datos PostgreSQL:</strong>
                Este software sincroniza ingresos y egresos al instante. Los despachos de pedidos se calculan con tarifas pre-ingresadas asignadas según zonas.
              </p>
            </div>
            <button 
              onClick={() => setShowAlert(false)}
              className="text-[#854D00] hover:text-[#2C2114] uppercase text-[10px] font-bold border-l border-[#F5E1A4] pl-3 shrink-0 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        )}

        {/* MAIN BODY CONTAINER WITH BENTO BOXES */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* SERCHING AD-HOC ACTIVE NOTIFIER */}
            {searchQuery && (
              <div className="p-3 bg-[#EAFEEA] border border-[#BFF6C3] rounded-xl text-[#00652c] text-xs flex items-center justify-between shadow-xs">
                <span>Filtro activo para "{searchQuery}". Mostrando coincidencias encontradas.</span>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="underline font-bold text-xs cursor-pointer ml-4 hover:text-[#005123]"
                >
                  Restablecer
                </button>
              </div>
            )}

            {/* DASHBOARD HEADER BANNER WITH SUB-VIEW CHANNELS */}
            {activeTab === 'dashboard' && (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#FDFBF7] p-5 rounded-3xl border border-[#EADEC9] gap-4 shadow-3xs">
                <div>
                  <h2 className="font-sans font-black text-xl text-[#2C2114] tracking-tight flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-[#00652c]" /> Ficha Resumen Administrativo
                  </h2>
                  <p className="text-xs text-[#73624E]">Cambie entre la agenda semanal de horno y la contabilidad fiscal mensual</p>
                </div>
                <div className="flex bg-[#FAF6EE] p-1 border border-[#ECE0CC] rounded-xl shrink-0 self-stretch md:self-auto justify-center">
                  <button
                    onClick={() => setDashboardStatus('semanal')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      dashboardStatus === 'semanal'
                        ? 'bg-[#00652c] text-white shadow-xs font-extrabold'
                        : 'text-[#73624E] hover:text-[#2C2114]'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" /> Agenda Semanal
                  </button>
                  <button
                    onClick={() => setDashboardStatus('mensual')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      dashboardStatus === 'mensual'
                        ? 'bg-[#00652c] text-white shadow-xs font-extrabold'
                        : 'text-[#73624E] hover:text-[#2C2114]'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" /> Balance Mensual
                  </button>
                </div>
              </div>
            )}

            {/* DYNAMIC VIEWS EXECUTION CORE */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* DASHBOARD SPLIT 1: WEEKLY OPERATIONALS */}
                {dashboardStatus === 'semanal' ? (
                  <div className="space-y-6">
                    {/* A. Collapsible Accordion view of critical stock is placed prominent to immediately warn cooks */}
                    <CriticalIngredientsAccordion 
                      ingredients={ingredients}
                      onRestock={handleRestockIngredient}
                    />

                    {/* B. Core deliveries map (Today & Anticipation in columns) */}
                    <div className="space-y-3">
                      <span className="text-[10px] bg-[#00652c]/10 text-[#00652c] border border-[#00652c]/20 rounded px-2 py-0.5 font-bold uppercase tracking-wide">
                        Pedidos del Día y de la Semana (Toque un pedido para ver detalle)
                      </span>
                      <LogisticsModule 
                        orders={filteredOrders}
                        onUpdateOrderStatus={handleUpdateOrderStatus}
                        onOpenQuickOrder={() => setIsQuickOrderOpen(true)}
                        onSelectOrder={(order) => setSelectedOrder(order)}
                        hideUpcoming={false} // Show both today's deliveries AND weekly anticipation
                      />
                    </div>
                  </div>
                ) : (
                  /* DASHBOARD SPLIT 2: MONTHLY BUSINESS CONTROL */
                  <div className="space-y-3">
                    <span className="text-[10px] bg-[#8A755D]/15 text-[#8A755D] border border-[#8A755D]/25 rounded px-2 py-0.5 font-bold uppercase tracking-wide">
                      Resumen Empresarial y Financiero Mensual
                    </span>
                    {/* Comprehensive accounting module replace simple card */}
                    <FinancialModule 
                      orders={orders}
                      expenses={expenses}
                      onAddExpense={handleAddExpense}
                      onDeleteExpense={handleDeleteExpense}
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: EXHAUSTIVE LOGISTICS (Anticipation is hidden internally, full list width) */}
            {activeTab === 'pedidos' && (
              <div className="bg-[#FDFBF7] rounded-3xl border border-[#EADEC9] p-6 space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EADEC9] pb-4">
                  <div>
                    <h3 className="font-sans font-bold text-lg text-[#2C2114]">Control de Entregas y Despacho Físico</h3>
                    <p className="text-xs text-[#73624E] mt-0.5">Control de rutas para hoy. Ocupa ancho completo. No muestra la anticipación semanal. Toque un pedido para inspeccionar.</p>
                  </div>
                  <button
                    onClick={() => setIsQuickOrderOpen(true)}
                    className="px-4 py-2 bg-[#00652c] text-white rounded-xl hover:bg-[#005123] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm touch-target-min cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Ingresar Pedido
                  </button>
                </div>

                <LogisticsModule 
                  orders={filteredOrders} 
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onOpenQuickOrder={() => setIsQuickOrderOpen(true)}
                  onSelectOrder={(order) => setSelectedOrder(order)}
                  hideUpcoming={true} // Strict hide anticipation as requested!
                />
              </div>
            )}

            {/* TAB 3: PROCUREMENT & RAW STOCKS */}
            {activeTab === 'inventario' && (
              <div className="bg-[#FDFBF7] rounded-3xl border border-[#EADEC9] p-6 space-y-6 shadow-xs">
                <div className="border-b border-[#EADEC9] pb-4">
                  <h3 className="font-sans font-bold text-lg text-[#2C2114]">Fórmulas de Recetas y Control de Suministros</h3>
                  <p className="text-xs text-[#73624E] mt-0.5">Ajusta los stocks de mantecas, harinas y fermentos para recalcular automáticamente la lista de aprovisionamiento.</p>
                </div>

                <InventoryModule 
                  ingredients={filteredIngredients}
                  recipes={recipes}
                  onUpdateStock={handleUpdateStock}
                  onRestock={handleRestockIngredient}
                  onToggleRecipeActive={handleToggleRecipeActive}
                />
              </div>
            )}

            {/* TAB 4: PRODUCTS CATALOG EDITOR */}
            {activeTab === 'productos' && (
              <div className="bg-[#FDFBF7] rounded-3xl border border-[#EADEC9] p-6 space-y-6 shadow-xs">
                <div className="border-b border-[#EADEC9] pb-4">
                  <h3 className="font-sans font-bold text-lg text-[#2C2114]">Catálogo y Lista de Precios de Venta (Tarifas CLP)</h3>
                  <p className="text-xs text-[#73624E] mt-0.5">Administre los productos horneados ofrecidos en la pastelería, agregue nuevos panes o modifique precios de venta.</p>
                </div>

                <ProductsModule
                  products={products}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* NEW PRE-ORDER ENTRY MODAL BLOCK */}
      <AddOrderModal 
        isOpen={isQuickOrderOpen}
        onClose={() => setIsQuickOrderOpen(false)}
        onAddOrder={handleAddOrder}
        products={products}
      />

      {/* NEW ORDER DETAIL OVERVIEW SHEET Modal */}
      <OrderDetailModal
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onUpdateStatus={handleUpdateOrderStatus}
      />

    </div>
  );
}
