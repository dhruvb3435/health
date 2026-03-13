'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Package, AlertTriangle, TrendingDown, Search, Filter, MoreHorizontal, Plus, X, Trash2, Calendar, IndianRupee, Layers } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { InventoryItem } from '@/types';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState({ lowStock: 0, expired: 0, stockValue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    itemName: '',
    itemCode: `SKU-${Math.floor(Math.random() * 100000)}`,
    itemCategory: 'Medicine',
    quantity: 100,
    unit: 'vials',
    unitPrice: 15.5,
    supplier: 'PharmaCore Labs',
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    minStockLevel: 20,
    location: 'Main Pharmacy Shelf A1',
    status: 'in_stock'
  });

  const limit = 10;

  const fetchInventory = useCallback(async (searchQuery = '', pageNumber = 1) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/inventory', {
        params: {
          search: searchQuery,
          page: pageNumber,
          limit
        }
      });
      setInventory(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
      setTotalItems(res.data.meta?.total || 0);
    } catch {
      // handled by global interceptor
    }

    try {
      const [low, expired, value] = await Promise.all([
        apiClient.get('/inventory/low-stock'),
        apiClient.get('/inventory/expired'),
        apiClient.get('/inventory/stock-value')
      ]);
      setStats({
        lowStock: (low.data || []).length,
        expired: (expired.data || []).length,
        stockValue: value.data?.stockValue || 0,
      });
    } catch {
      // handled by global interceptor
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchInventory(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchInventory]);

  useEffect(() => {
    if (page > 1) {
      fetchInventory(search, page);
    }
  }, [page, fetchInventory]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/inventory', formData);
      toast.success('Stock item added successfully');
      setIsModalOpen(false);
      setFormData({
        itemName: '',
        itemCode: `SKU-${Math.floor(Math.random() * 100000)}`,
        itemCategory: 'Medicine',
        quantity: 100,
        unit: 'vials',
        unitPrice: 15.5,
        supplier: 'PharmaCore Labs',
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        minStockLevel: 20,
        location: 'Main Pharmacy Shelf A1',
        status: 'in_stock'
      });
      fetchInventory(search, page);
    } catch {
      // handled by global interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this item from inventory?')) return;
    try {
      await apiClient.delete(`/inventory/${id}`);
      toast.success('Inventory item removed');
      fetchInventory(search, page);
    } catch {
      // handled by global interceptor
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Inventory Management</h1>
          <p className="mt-1 text-sm md:text-base text-slate-500">Track medical supplies, equipment, and pharmacy stock</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary gap-2 w-full sm:w-auto justify-center h-11 shadow-indigo-100"
        >
          <Plus size={18} />
          <span>Add Stock Item</span>
        </button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card shadow-sm border-slate-200 p-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
              <Package size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Inventory Value</p>
              <p className="text-2xl font-bold text-slate-900 font-display">${stats.stockValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200 p-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm">
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-slate-900 font-display">{stats.lowStock}</p>
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-slate-200 p-6 bg-white sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shadow-sm">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expired Products</p>
              <p className="text-2xl font-bold text-slate-900 font-display">{stats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by item name, SKU or category..."
            className="input pl-10 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary gap-2 h-11 justify-center sm:px-6 font-bold">
          <Filter size={18} />
          Filters
        </button>
      </div>

      <div className="card overflow-hidden !p-0 shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] sm:min-w-0">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Item / Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Stock / Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Unit Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Expiry Date</th>
                <th className="px-4 sm:px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 sm:px-6 py-4"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="px-4 sm:px-6 py-4 text-right" />
                  </tr>
                ))
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group border-b border-slate-50 last:border-0">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                          <Package size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm sm:text-base">
                            {item.itemName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.itemCode}</span>
                            <span className="h-3 w-[1px] bg-slate-200"></span>
                            <span className="text-[10px] text-slate-500 font-medium">{item.category}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-700 mb-1">
                          {item.quantity} <span className="text-slate-400 font-medium text-[10px] uppercase">{item.unit}</span>
                        </p>
                        <span className={`badge ${item.status === 'in_stock' ? 'badge-success' : item.status === 'low_stock' ? 'badge-warning' : 'badge-error'} font-bold text-[10px]`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      ${item.unitCost?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                      {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 sm:p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button className="p-1.5 sm:p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!isLoading && inventory.length === 0 && (
            <div className="py-20 text-center bg-white space-y-3">
              <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Package size={24} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700">No inventory items found</p>
              <p className="text-sm text-slate-500">
                {search ? `No results for "${search}".` : 'Add your first stock item to get started.'}
              </p>
            </div>
          )}
        </div>

        {!isLoading && totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-slate-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={totalItems}
              limit={limit}
            />
          </div>
        )}
      </div>


      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Add Stock Item</h2>
                <p className="text-sm text-slate-500">Register new medical supply or equipment</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Item Name</label>
                  <input required className="input h-11" placeholder="e.g. Insulin Vials" value={formData.itemName} onChange={e => setFormData({ ...formData, itemName: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">SKU / Code</label>
                  <input className="input h-11 bg-slate-50" readOnly value={formData.itemCode} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Layers size={14} /> Category</label>
                  <select required className="input h-11" value={formData.itemCategory} onChange={e => setFormData({ ...formData, itemCategory: e.target.value })}>
                    <option value="Medicine">Medicine</option>
                    <option value="Surgical">Surgical Supply</option>
                    <option value="Lab">Laboratory Reagents</option>
                    <option value="Equipment">Medical Equipment</option>
                    <option value="Consumables">Consumables (Gloves, etc.)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Initial Quantity</label>
                  <input type="number" required className="input h-11" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Unit (e.g. vials, boxes)</label>
                  <input required className="input h-11" placeholder="vials" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><IndianRupee size={14} /> Unit Price (&#8377;)</label>
                  <input type="number" step="0.01" required className="input h-11" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Supplier Name</label>
                  <input className="input h-11" placeholder="Main Supplier" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Calendar size={14} /> Expiry Date</label>
                  <input type="date" className="input h-11" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Min Stock Level</label>
                  <input type="number" required className="input h-11" value={formData.minStockLevel} onChange={e => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) })} />
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <label className="text-sm font-bold text-slate-700">Storage Location</label>
                  <input className="input h-11" placeholder="Shelf A, Row 2" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                </div>
              </div>
            </form>

            <div className="px-6 sm:px-8 py-5 border-t border-slate-100 bg-white flex gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1 h-12 font-bold">Cancel</button>
              <button
                type="submit"
                onClick={handleAddItem}
                disabled={isSubmitting}
                className="btn btn-primary flex-1 h-12 shadow-indigo-100 font-bold disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Stock Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

