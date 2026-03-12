'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import {
    Droplets,
    Search,
    Plus,
    X,
    Package,
    AlertTriangle,
    Check,
    Clock,
    FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
type BloodComponent = 'whole_blood' | 'packed_rbc' | 'platelets' | 'plasma' | 'cryoprecipitate';
type InventoryStatus = 'available' | 'reserved' | 'issued' | 'expired' | 'discarded';
type RequestStatus = 'pending' | 'approved' | 'issued' | 'cancelled' | 'completed';
type RequestPriority = 'routine' | 'urgent' | 'emergency';

interface BloodInventory {
    id: string;
    bloodGroup: BloodGroup;
    component: BloodComponent;
    units: number;
    bagNumber: string;
    collectedDate: string;
    expiryDate: string;
    status: InventoryStatus;
    donorName: string;
    donorContact?: string;
    storageLocation?: string;
}

interface BloodRequest {
    id: string;
    patientId: string;
    patient?: { user?: { firstName?: string; lastName?: string }; patientId?: string };
    doctorId: string;
    doctor?: { user?: { firstName?: string; lastName?: string } };
    bloodGroup: BloodGroup;
    component: BloodComponent;
    unitsRequested: number;
    unitsIssued: number;
    priority: RequestPriority;
    status: RequestStatus;
    requestDate: string;
    reason: string;
}

interface InventoryStats {
    [bloodGroup: string]: { available: number; reserved: number; total: number };
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const COMPONENTS: { value: BloodComponent; label: string }[] = [
    { value: 'whole_blood', label: 'Whole Blood' },
    { value: 'packed_rbc', label: 'Packed RBC' },
    { value: 'platelets', label: 'Platelets' },
    { value: 'plasma', label: 'Plasma' },
    { value: 'cryoprecipitate', label: 'Cryoprecipitate' },
];

const PRIORITY_CONFIG: Record<RequestPriority, { label: string; color: string }> = {
    routine: { label: 'Routine', color: 'bg-slate-100 text-slate-600' },
    urgent: { label: 'Urgent', color: 'bg-amber-100 text-amber-700' },
    emergency: { label: 'Emergency', color: 'bg-rose-100 text-rose-700' },
};

const REQUEST_STATUS_CONFIG: Record<RequestStatus, { label: string; badge: string }> = {
    pending: { label: 'Pending', badge: 'badge-warning' },
    approved: { label: 'Approved', badge: 'badge-primary' },
    issued: { label: 'Issued', badge: 'badge-success' },
    cancelled: { label: 'Cancelled', badge: 'badge-error' },
    completed: { label: 'Completed', badge: 'badge-success' },
};

export default function BloodBankPage() {
    const [activeTab, setActiveTab] = useState<'inventory' | 'requests'>('inventory');
    const [inventory, setInventory] = useState<BloodInventory[]>([]);
    const [requests, setRequests] = useState<BloodRequest[]>([]);
    const [stats, setStats] = useState<InventoryStats>({});
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [bloodGroupFilter, setBloodGroupFilter] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [addForm, setAddForm] = useState({
        bloodGroup: 'O+' as BloodGroup,
        component: 'whole_blood' as BloodComponent,
        units: 1,
        bagNumber: '',
        donorName: '',
        donorContact: '',
        collectedDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        storageLocation: '',
    });

    const [requestForm, setRequestForm] = useState({
        patientId: '',
        doctorId: '',
        bloodGroup: 'O+' as BloodGroup,
        component: 'whole_blood' as BloodComponent,
        unitsRequested: 1,
        priority: 'routine' as RequestPriority,
        reason: '',
    });

    const fetchInventory = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (bloodGroupFilter) params.bloodGroup = bloodGroupFilter;
            const res = await apiClient.get('/blood-bank/inventory', { params });
            setInventory(res.data.data || res.data || []);
        } catch {
            // handled
        } finally {
            setIsLoading(false);
        }
    }, [bloodGroupFilter]);

    const fetchRequests = useCallback(async () => {
        try {
            const res = await apiClient.get('/blood-bank/requests');
            setRequests(res.data.data || res.data || []);
        } catch {
            // handled
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const res = await apiClient.get('/blood-bank/inventory/stats');
            setStats(res.data || {});
        } catch {
            // handled
        }
    }, []);

    useEffect(() => {
        fetchInventory();
        fetchRequests();
        fetchStats();
    }, [fetchInventory, fetchRequests, fetchStats]);

    const handleAddUnit = async () => {
        if (!addForm.bagNumber || !addForm.donorName) {
            toast.error('Bag number and donor name are required');
            return;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post('/blood-bank/inventory', addForm);
            toast.success('Blood unit added');
            setShowAddModal(false);
            setAddForm({
                bloodGroup: 'O+', component: 'whole_blood', units: 1, bagNumber: '',
                donorName: '', donorContact: '', collectedDate: new Date().toISOString().split('T')[0],
                expiryDate: '', storageLocation: '',
            });
            fetchInventory();
            fetchStats();
        } catch {
            // handled
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateRequest = async () => {
        if (!requestForm.patientId || !requestForm.doctorId || !requestForm.reason) {
            toast.error('Patient, doctor, and reason are required');
            return;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post('/blood-bank/requests', requestForm);
            toast.success('Blood request created');
            setShowRequestModal(false);
            setRequestForm({
                patientId: '', doctorId: '', bloodGroup: 'O+', component: 'whole_blood',
                unitsRequested: 1, priority: 'routine', reason: '',
            });
            fetchRequests();
        } catch {
            // handled
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateRequestStatus = async (id: string, status: RequestStatus) => {
        try {
            await apiClient.patch(`/blood-bank/requests/${id}/status`, { status });
            toast.success(`Request ${status}`);
            fetchRequests();
            fetchInventory();
            fetchStats();
        } catch {
            // handled
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Blood Bank</h1>
                    <p className="mt-1 text-sm md:text-base text-slate-500">Manage blood inventory, donations, and requests</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowRequestModal(true)} className="btn btn-secondary h-10 gap-2">
                        <FileText size={18} />
                        New Request
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="btn btn-primary h-10 gap-2">
                        <Plus size={18} />
                        Add Unit
                    </button>
                </div>
            </div>

            {/* Blood Group Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {BLOOD_GROUPS.map(bg => {
                    const bgStats = stats[bg] || { available: 0, total: 0 };
                    const isLow = bgStats.available < 5;
                    return (
                        <button
                            key={bg}
                            onClick={() => setBloodGroupFilter(bloodGroupFilter === bg ? '' : bg)}
                            className={`card text-center p-3 cursor-pointer transition-all ${bloodGroupFilter === bg ? 'ring-2 ring-rose-500 border-rose-200' : 'border-slate-200'} ${isLow && bgStats.total > 0 ? 'bg-rose-50' : 'bg-white'}`}
                        >
                            <p className="text-lg font-bold text-rose-600">{bg}</p>
                            <p className={`text-xl font-bold mt-1 ${isLow ? 'text-rose-700' : 'text-slate-900'}`}>{bgStats.available}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Units</p>
                            {isLow && bgStats.total > 0 && <AlertTriangle size={12} className="text-rose-500 mx-auto mt-1" />}
                        </button>
                    );
                })}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                <button onClick={() => setActiveTab('inventory')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>
                    <Package size={16} className="inline mr-2" />Inventory ({inventory.length})
                </button>
                <button onClick={() => setActiveTab('requests')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>
                    <FileText size={16} className="inline mr-2" />Requests ({requests.length})
                </button>
            </div>

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
                <div className="card overflow-hidden !p-0 shadow-sm border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bag #</th>
                                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Blood Group</th>
                                    <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Component</th>
                                    <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Donor</th>
                                    <th className="hidden lg:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Expiry</th>
                                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-4 sm:px-6 py-4"><div className="h-6 w-24 bg-slate-100 rounded" /></td>
                                            <td className="px-4 sm:px-6 py-4"><div className="h-6 w-12 bg-slate-100 rounded" /></td>
                                            <td className="hidden sm:table-cell px-6 py-4"><div className="h-6 w-24 bg-slate-100 rounded" /></td>
                                            <td className="hidden md:table-cell px-6 py-4"><div className="h-6 w-32 bg-slate-100 rounded" /></td>
                                            <td className="hidden lg:table-cell px-6 py-4"><div className="h-6 w-24 bg-slate-100 rounded" /></td>
                                            <td className="px-4 sm:px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded" /></td>
                                        </tr>
                                    ))
                                ) : inventory.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <Droplets size={40} className="mx-auto mb-4 text-slate-300" />
                                            <p className="text-slate-500 font-medium">No blood units in inventory</p>
                                        </td>
                                    </tr>
                                ) : (
                                    inventory.map(item => {
                                        const isExpiringSoon = item.expiryDate && new Date(item.expiryDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 sm:px-6 py-4 font-mono text-sm font-bold text-slate-900">{item.bagNumber}</td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-rose-100 text-rose-700 font-bold text-sm">{item.bloodGroup}</span>
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4 text-sm text-slate-600 capitalize">{item.component?.replace(/_/g, ' ')}</td>
                                                <td className="hidden md:table-cell px-6 py-4 text-sm text-slate-600">{item.donorName}</td>
                                                <td className="hidden lg:table-cell px-6 py-4 text-sm">
                                                    <span className={isExpiringSoon ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}
                                                        {isExpiringSoon && <AlertTriangle size={12} className="inline ml-1" />}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <span className={`badge ${item.status === 'available' ? 'badge-success' : item.status === 'expired' || item.status === 'discarded' ? 'badge-error' : 'badge-warning'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
                <div className="card overflow-hidden !p-0 shadow-sm border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Blood Group</th>
                                    <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Units</th>
                                    <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <FileText size={40} className="mx-auto mb-4 text-slate-300" />
                                            <p className="text-slate-500 font-medium">No blood requests</p>
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map(req => {
                                        const prCfg = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.routine;
                                        const stCfg = REQUEST_STATUS_CONFIG[req.status] || { label: req.status, badge: '' };
                                        return (
                                            <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 sm:px-6 py-4">
                                                    <p className="font-bold text-slate-900 text-sm">
                                                        {req.patient?.user?.firstName} {req.patient?.user?.lastName}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{req.reason}</p>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-rose-100 text-rose-700 font-bold text-sm">{req.bloodGroup}</span>
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4 text-sm font-bold text-slate-900">{req.unitsIssued}/{req.unitsRequested}</td>
                                                <td className="hidden md:table-cell px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${prCfg.color}`}>{prCfg.label}</span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <span className={`badge ${stCfg.badge}`}>{stCfg.label}</span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {req.status === 'pending' && (
                                                            <>
                                                                <button onClick={() => updateRequestStatus(req.id, 'approved')} className="btn btn-primary h-8 px-3 text-xs gap-1">
                                                                    <Check size={14} /> Approve
                                                                </button>
                                                                <button onClick={() => updateRequestStatus(req.id, 'cancelled')} className="btn btn-secondary h-8 px-3 text-xs">Cancel</button>
                                                            </>
                                                        )}
                                                        {req.status === 'approved' && (
                                                            <button onClick={() => updateRequestStatus(req.id, 'issued')} className="btn btn-success h-8 px-3 text-xs gap-1">
                                                                <Droplets size={14} /> Issue
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Blood Unit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">Add Blood Unit</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Group *</label>
                                    <select className="input h-11 w-full" value={addForm.bloodGroup} onChange={e => setAddForm(f => ({ ...f, bloodGroup: e.target.value as BloodGroup }))}>
                                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Component *</label>
                                    <select className="input h-11 w-full" value={addForm.component} onChange={e => setAddForm(f => ({ ...f, component: e.target.value as BloodComponent }))}>
                                        {COMPONENTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Bag Number *</label>
                                <input className="input h-11 w-full" placeholder="e.g., BAG-2026-001" value={addForm.bagNumber} onChange={e => setAddForm(f => ({ ...f, bagNumber: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Donor Name *</label>
                                <input className="input h-11 w-full" placeholder="Full name" value={addForm.donorName} onChange={e => setAddForm(f => ({ ...f, donorName: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Collected Date</label>
                                    <input type="date" className="input h-11 w-full" value={addForm.collectedDate} onChange={e => setAddForm(f => ({ ...f, collectedDate: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Expiry Date</label>
                                    <input type="date" className="input h-11 w-full" value={addForm.expiryDate} onChange={e => setAddForm(f => ({ ...f, expiryDate: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Storage Location</label>
                                <input className="input h-11 w-full" placeholder="e.g., Refrigerator A-1" value={addForm.storageLocation} onChange={e => setAddForm(f => ({ ...f, storageLocation: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
                            <button onClick={() => setShowAddModal(false)} className="btn btn-secondary h-11 px-6">Cancel</button>
                            <button onClick={handleAddUnit} disabled={isSubmitting} className="btn btn-primary h-11 px-6 gap-2">
                                {isSubmitting ? 'Adding...' : <><Plus size={18} />Add Unit</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Blood Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">New Blood Request</h2>
                            <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Patient ID *</label>
                                <input className="input h-11 w-full" placeholder="Patient UUID" value={requestForm.patientId} onChange={e => setRequestForm(f => ({ ...f, patientId: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor ID *</label>
                                <input className="input h-11 w-full" placeholder="Doctor UUID" value={requestForm.doctorId} onChange={e => setRequestForm(f => ({ ...f, doctorId: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Group *</label>
                                    <select className="input h-11 w-full" value={requestForm.bloodGroup} onChange={e => setRequestForm(f => ({ ...f, bloodGroup: e.target.value as BloodGroup }))}>
                                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Units *</label>
                                    <input type="number" min={1} className="input h-11 w-full" value={requestForm.unitsRequested} onChange={e => setRequestForm(f => ({ ...f, unitsRequested: parseInt(e.target.value) || 1 }))} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Component</label>
                                    <select className="input h-11 w-full" value={requestForm.component} onChange={e => setRequestForm(f => ({ ...f, component: e.target.value as BloodComponent }))}>
                                        {COMPONENTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                                    <select className="input h-11 w-full" value={requestForm.priority} onChange={e => setRequestForm(f => ({ ...f, priority: e.target.value as RequestPriority }))}>
                                        <option value="routine">Routine</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="emergency">Emergency</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason *</label>
                                <textarea className="input w-full min-h-[80px] py-3" placeholder="e.g., Surgery scheduled, severe anemia" value={requestForm.reason} onChange={e => setRequestForm(f => ({ ...f, reason: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
                            <button onClick={() => setShowRequestModal(false)} className="btn btn-secondary h-11 px-6">Cancel</button>
                            <button onClick={handleCreateRequest} disabled={isSubmitting} className="btn btn-primary h-11 px-6 gap-2">
                                {isSubmitting ? 'Creating...' : <><FileText size={18} />Submit Request</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
