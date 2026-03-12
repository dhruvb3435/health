'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Pill, Search, Filter, MoreHorizontal, Plus, AlertCircle, ShoppingBag, X, Trash2, Edit } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';
import type { Medicine } from '@/types';

export default function PharmacyPage() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [formulationFilter, setFormulationFilter] = useState('');
    const [stockFilter, setStockFilter] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        medicineCode: '',
        genericName: '',
        strength: '',
        formulation: 'Tablet',
        stock: 0,
        sellingPrice: 0,
        purchasePrice: 0,
        description: ''
    });

    const limit = 12;

    const fetchMedicines = useCallback(async (searchQuery = '', pageNumber = 1) => {
        setIsLoading(true);
        try {
            const params: any = {
                search: searchQuery,
                page: pageNumber,
                limit
            };
            if (formulationFilter) params.formulation = formulationFilter;
            if (stockFilter) params.stockFilter = stockFilter;
            const res = await apiClient.get('/pharmacy/medicines', { params });
            setMedicines(res.data.data);
            setTotalPages(res.data.meta.totalPages);
            setTotalItems(res.data.meta.total);
        } catch (error) {
            console.error('Failed to fetch medicines', error);
        } finally {
            setIsLoading(false);
        }
    }, [formulationFilter, stockFilter]);

    const handleAddMedicine = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/pharmacy/medicines', formData);
            toast.success('Medicine added successfully');
            setIsAddModalOpen(false);
            setFormData({
                name: '',
                medicineCode: `MED-${Math.floor(Math.random() * 10000)}`,
                genericName: '',
                strength: '',
                formulation: 'Tablet',
                stock: 0,
                sellingPrice: 0,
                purchasePrice: 0,
                description: ''
            });
            fetchMedicines(search, page);
        } catch {
            // handled by global interceptor
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this medicine?')) return;
        try {
            await apiClient.delete(`/pharmacy/medicines/${id}`);
            toast.success('Medicine deleted');
            setIsDetailsOpen(false);
            fetchMedicines(search, page);
        } catch {
            // handled by global interceptor
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchMedicines(search, 1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, formulationFilter, stockFilter, fetchMedicines]);

    useEffect(() => {
        if (page > 1) {
            fetchMedicines(search, page);
        }
    }, [page, fetchMedicines]);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Pharmacy</h1>
                    <p className="mt-1 text-sm md:text-base text-slate-500">Manage medicine inventory and dispensing</p>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3">
                    <button className="btn btn-secondary gap-2 flex-1 sm:flex-none justify-center">
                        <ShoppingBag size={18} />
                        <span className="hidden xs:inline">Procurement</span>
                        <span className="xs:hidden">Buy</span>
                    </button>
                    <button
                        className="btn btn-primary gap-2 flex-1 sm:flex-none justify-center"
                        onClick={() => {
                            setFormData(prev => ({ ...prev, medicineCode: `MED-${Math.floor(Math.random() * 10000)}` }));
                            setIsAddModalOpen(true);
                        }}
                    >
                        <Plus size={18} />
                        Add Medicine
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search medicines..."
                            className="input pl-10 h-11"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn btn-secondary gap-2 h-11 justify-center sm:px-6 ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''}`}
                    >
                        <Filter size={18} />
                        Filters
                        {(formulationFilter || stockFilter) && (
                            <span className="h-2 w-2 rounded-full bg-indigo-600" />
                        )}
                    </button>
                </div>

                {showFilters && (
                    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1 flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Formulation</label>
                            <select
                                className="input h-10 text-sm"
                                value={formulationFilter}
                                onChange={(e) => setFormulationFilter(e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="Tablet">Tablet</option>
                                <option value="Capsule">Capsule</option>
                                <option value="Syrup">Syrup</option>
                                <option value="Injection">Injection</option>
                                <option value="Ointment">Ointment</option>
                            </select>
                        </div>
                        <div className="space-y-1 flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Status</label>
                            <select
                                className="input h-10 text-sm"
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="low">Low Stock (&lt; 20)</option>
                                <option value="out">Out of Stock</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => { setFormulationFilter(''); setStockFilter(''); }}
                                className="btn btn-secondary h-10 px-4 text-xs font-bold"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="card h-48 animate-pulse bg-slate-50 border-slate-100" />
                    ))
                ) : (
                    medicines.map((medicine) => (
                        <div key={medicine.id} className="card group hover:border-indigo-200 transition-all hover:shadow-md bg-white border-slate-200 flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                        <Pill size={20} />
                                    </div>
                                    <button className="p-1 rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                                        {medicine.name}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter mt-0.5">
                                        {medicine.genericName || 'Generic'}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-sm">
                                        <span className="text-slate-500">Stock: </span>
                                        <span className={`font-bold ${medicine.stock < 20 ? 'text-red-600' : 'text-slate-900'}`}>
                                            {medicine.stock} units
                                        </span>
                                    </div>
                                    {medicine.stock < 20 && (
                                        <AlertCircle size={16} className="text-red-500 animate-pulse" />
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-lg font-bold text-indigo-600">&#8377;{medicine.sellingPrice || '0.00'}</span>
                                <button
                                    className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                                    onClick={() => {
                                        setSelectedMedicine(medicine);
                                        setIsDetailsOpen(true);
                                    }}
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {!isLoading && medicines.length === 0 && (
                <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm space-y-3">
                    <div className="mx-auto h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                        <Pill size={24} className="text-slate-400" />
                    </div>
                    <p className="font-semibold text-slate-700">No medicines found</p>
                    <p className="text-sm text-slate-500">
                        {search ? `No results for "${search}".` : 'Add your first medicine to get started.'}
                    </p>
                    {search && (
                        <button className="mt-1 text-indigo-600 font-bold hover:underline text-sm" onClick={() => setSearch('')}>
                            Clear Search
                        </button>
                    )}
                </div>
            )}

            {!isLoading && totalPages > 1 && (
                <div className="card !p-0 overflow-hidden shadow-sm border-slate-200 mt-8">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        total={totalItems}
                        limit={limit}
                    />
                </div>
            )}

            {/* Add Medicine Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
                        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Add New Medicine</h2>
                                <p className="text-sm text-slate-500">Register a new item in the pharmacy inventory</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddMedicine} className="px-6 sm:px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Medicine Name</label>
                                    <input required type="text" className="input h-11" placeholder="e.g. Paracetamol" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Medicine Code</label>
                                    <input required type="text" className="input h-11 bg-slate-50" readOnly value={formData.medicineCode} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Generic Name</label>
                                    <input type="text" className="input h-11" placeholder="e.g. Acetaminophen" value={formData.genericName} onChange={e => setFormData({ ...formData, genericName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Strength</label>
                                    <input required type="text" className="input h-11" placeholder="e.g. 500mg" value={formData.strength} onChange={e => setFormData({ ...formData, strength: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Formulation</label>
                                    <select className="input h-11" value={formData.formulation} onChange={e => setFormData({ ...formData, formulation: e.target.value })}>
                                        <option>Tablet</option>
                                        <option>Capsule</option>
                                        <option>Syrup</option>
                                        <option>Injection</option>
                                        <option>Ointment</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Stock Quantity</label>
                                    <input required type="number" className="input h-11" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Purchase Price</label>
                                    <input required type="number" step="0.01" className="input h-11" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Selling Price</label>
                                    <input required type="number" step="0.01" className="input h-11" value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-bold text-slate-700">Description</label>
                                <textarea className="input h-11 min-h-[90px] py-3" placeholder="Add medicine details, indications..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                            </div>
                            <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary flex-1 h-12">Cancel</button>
                                <button type="submit" className="btn btn-primary flex-1 h-12">Save Medicine</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Medicine Details Slide-over */}
            {isDetailsOpen && selectedMedicine && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Medicine Details</h2>
                            <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-slate-50 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                                    <Pill size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">{selectedMedicine.name}</h3>
                                    <p className="text-indigo-600 font-semibold tracking-wide uppercase text-xs">{selectedMedicine.medicineCode}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generic Name</p>
                                    <p className="font-bold text-slate-900">{selectedMedicine.genericName || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Strength</p>
                                    <p className="font-bold text-slate-900">{selectedMedicine.strength}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Formulation</p>
                                    <p className="font-bold text-slate-900">{selectedMedicine.formulation}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stock Level</p>
                                    <p className={`font-bold ${selectedMedicine.stock < 20 ? 'text-red-600' : 'text-slate-900'}`}>
                                        {selectedMedicine.stock} units
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Financials</p>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-slate-500">Selling Price</p>
                                        <p className="text-xl font-bold text-indigo-600">&#8377;{selectedMedicine.sellingPrice}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Purchase Price</p>
                                        <p className="text-lg font-bold text-slate-700">&#8377;{selectedMedicine.purchasePrice}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedMedicine.description && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</p>
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedMedicine.description}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                            <button className="btn btn-secondary flex-1 gap-2">
                                <Edit size={16} />
                                Edit
                            </button>
                            <button onClick={() => handleDelete(selectedMedicine.id)} className="btn bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 flex-1 gap-2">
                                <Trash2 size={16} />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
