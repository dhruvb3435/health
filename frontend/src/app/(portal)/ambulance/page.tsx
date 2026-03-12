'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import {
    Truck, Plus, X, MapPin, Phone, Clock, AlertTriangle, Wrench, CheckCircle2, Navigation,
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import toast from 'react-hot-toast';

type VehicleType = 'basic_life_support' | 'advanced_life_support' | 'patient_transport' | 'neonatal';
type AmbulanceStatus = 'available' | 'on_trip' | 'maintenance' | 'out_of_service';
type TripType = 'emergency' | 'scheduled' | 'inter_facility' | 'dead_body';
type TripStatus = 'dispatched' | 'en_route_pickup' | 'patient_picked' | 'en_route_hospital' | 'completed' | 'cancelled';
type TripPriority = 'normal' | 'urgent' | 'critical';

interface Ambulance {
    id: string;
    vehicleNumber: string;
    vehicleType: VehicleType;
    driverName: string;
    driverPhone: string;
    status: AmbulanceStatus;
    currentLocation?: string;
    equipmentList?: string;
    isActive: boolean;
}

interface AmbulanceTrip {
    id: string;
    tripNumber: string;
    ambulance?: Ambulance;
    patientName: string;
    patientContact?: string;
    pickupLocation: string;
    dropLocation: string;
    tripType: TripType;
    status: TripStatus;
    priority: TripPriority;
    dispatchTime: string;
    pickupTime?: string;
    completionTime?: string;
    fare?: number;
    distance?: number;
}

const AMBULANCE_STATUS: Record<AmbulanceStatus, { label: string; badge: string; icon: any }> = {
    available: { label: 'Available', badge: 'badge-success', icon: CheckCircle2 },
    on_trip: { label: 'On Trip', badge: 'badge-primary', icon: Navigation },
    maintenance: { label: 'Maintenance', badge: 'badge-warning', icon: Wrench },
    out_of_service: { label: 'Out of Service', badge: 'badge-error', icon: AlertTriangle },
};

const TRIP_STATUS: Record<TripStatus, { label: string; badge: string }> = {
    dispatched: { label: 'Dispatched', badge: 'badge-primary' },
    en_route_pickup: { label: 'En Route Pickup', badge: 'bg-amber-100 text-amber-700' },
    patient_picked: { label: 'Patient Picked', badge: 'bg-sky-100 text-sky-700' },
    en_route_hospital: { label: 'En Route Hospital', badge: 'bg-indigo-100 text-indigo-700' },
    completed: { label: 'Completed', badge: 'badge-success' },
    cancelled: { label: 'Cancelled', badge: 'badge-error' },
};

const PRIORITY_BADGE: Record<TripPriority, string> = {
    normal: 'bg-slate-100 text-slate-600',
    urgent: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
};

const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
    basic_life_support: 'BLS',
    advanced_life_support: 'ALS',
    patient_transport: 'Patient Transport',
    neonatal: 'Neonatal',
};

export default function AmbulancePage() {
    const [activeTab, setActiveTab] = useState<'fleet' | 'trips'>('fleet');
    const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
    const [trips, setTrips] = useState<AmbulanceTrip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [ambulanceForm, setAmbulanceForm] = useState({
        vehicleNumber: '', vehicleType: 'basic_life_support' as VehicleType,
        driverName: '', driverPhone: '', equipmentList: '',
    });

    const [dispatchForm, setDispatchForm] = useState({
        ambulanceId: '', patientName: '', patientContact: '',
        pickupLocation: '', dropLocation: '',
        tripType: 'emergency' as TripType, priority: 'normal' as TripPriority,
    });

    const limit = 15;

    const fetchAmbulances = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (statusFilter) params.status = statusFilter;
            const res = await apiClient.get('/ambulance/fleet', { params });
            setAmbulances(res.data.data || res.data || []);
        } catch {} finally { setIsLoading(false); }
    }, [statusFilter]);

    const fetchTrips = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = { page, limit };
            if (statusFilter) params.status = statusFilter;
            const res = await apiClient.get('/ambulance/trips', { params });
            setTrips(res.data.data || []);
            setTotalPages(res.data.meta?.totalPages || 1);
            setTotalItems(res.data.meta?.total || 0);
        } catch {} finally { setIsLoading(false); }
    }, [page, statusFilter]);

    useEffect(() => {
        if (activeTab === 'fleet') fetchAmbulances();
        else fetchTrips();
    }, [activeTab, fetchAmbulances, fetchTrips]);

    // Auto-refresh active trips every 15 seconds
    useEffect(() => {
        if (activeTab !== 'trips') return;
        const interval = setInterval(fetchTrips, 15000);
        return () => clearInterval(interval);
    }, [activeTab, fetchTrips]);

    const handleAddAmbulance = async () => {
        if (!ambulanceForm.vehicleNumber || !ambulanceForm.driverName) {
            toast.error('Vehicle number and driver name required');
            return;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post('/ambulance/fleet', ambulanceForm);
            toast.success('Ambulance registered');
            setShowAddModal(false);
            setAmbulanceForm({ vehicleNumber: '', vehicleType: 'basic_life_support', driverName: '', driverPhone: '', equipmentList: '' });
            fetchAmbulances();
        } catch {} finally { setIsSubmitting(false); }
    };

    const handleDispatch = async () => {
        if (!dispatchForm.ambulanceId || !dispatchForm.patientName || !dispatchForm.pickupLocation || !dispatchForm.dropLocation) {
            toast.error('Ambulance, patient name, pickup and drop locations required');
            return;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post('/ambulance/trips/dispatch', dispatchForm);
            toast.success('Ambulance dispatched');
            setShowDispatchModal(false);
            setDispatchForm({ ambulanceId: '', patientName: '', patientContact: '', pickupLocation: '', dropLocation: '', tripType: 'emergency', priority: 'normal' });
            fetchTrips(); fetchAmbulances();
        } catch {} finally { setIsSubmitting(false); }
    };

    const updateTripStatus = async (id: string, status: TripStatus) => {
        try {
            await apiClient.patch(`/ambulance/trips/${id}/status`, { status });
            toast.success(`Trip ${TRIP_STATUS[status]?.label || status}`);
            fetchTrips(); fetchAmbulances();
        } catch {}
    };

    const availableCount = ambulances.filter(a => a.status === 'available').length;
    const onTripCount = ambulances.filter(a => a.status === 'on_trip').length;
    const maintenanceCount = ambulances.filter(a => a.status === 'maintenance').length;

    const availableAmbulances = ambulances.filter(a => a.status === 'available');

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Ambulance Management</h1>
                    <p className="mt-1 text-sm md:text-base text-slate-500">Fleet tracking and trip dispatch</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowAddModal(true)} className="btn btn-secondary h-10 gap-2">
                        <Plus size={18} /> Add Vehicle
                    </button>
                    <button onClick={() => { setActiveTab('trips'); setShowDispatchModal(true); }} className="btn btn-primary h-10 gap-2">
                        <Navigation size={18} /> Dispatch
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card bg-white border-slate-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Fleet</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{ambulances.length}</p>
                </div>
                <div className="card bg-white border-emerald-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Available</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{availableCount}</p>
                </div>
                <div className="card bg-white border-blue-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">On Trip</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{onTripCount}</p>
                </div>
                <div className="card bg-white border-amber-200 shadow-sm p-5">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Maintenance</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{maintenanceCount}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => { setActiveTab('fleet'); setStatusFilter(''); setPage(1); }} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'fleet' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>
                        <Truck size={16} className="inline mr-2" />Fleet ({ambulances.length})
                    </button>
                    <button onClick={() => { setActiveTab('trips'); setStatusFilter(''); setPage(1); }} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'trips' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>
                        <Navigation size={16} className="inline mr-2" />Trips
                    </button>
                </div>
                {activeTab === 'fleet' && (
                    <select className="input h-10 text-sm sm:w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); }}>
                        <option value="">All Statuses</option>
                        {Object.entries(AMBULANCE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                )}
                {activeTab === 'trips' && (
                    <select className="input h-10 text-sm sm:w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">All Statuses</option>
                        {Object.entries(TRIP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                )}
            </div>

            {/* Fleet Tab */}
            {activeTab === 'fleet' && (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="card bg-white shadow-sm animate-pulse p-6">
                            <div className="h-6 w-32 bg-slate-100 rounded mb-3" />
                            <div className="h-4 w-24 bg-slate-100 rounded mb-2" />
                            <div className="h-4 w-40 bg-slate-100 rounded" />
                        </div>
                    )) : ambulances.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <Truck size={40} className="mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500 font-medium">No ambulances registered</p>
                        </div>
                    ) : ambulances.map(amb => {
                        const stCfg = AMBULANCE_STATUS[amb.status];
                        const StatusIcon = stCfg.icon;
                        return (
                            <div key={amb.id} className="card bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                                            amb.status === 'available' ? 'bg-emerald-50 text-emerald-600' :
                                            amb.status === 'on_trip' ? 'bg-blue-50 text-blue-600' :
                                            'bg-amber-50 text-amber-600'
                                        }`}>
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{amb.vehicleNumber}</p>
                                            <p className="text-xs text-slate-400">{VEHICLE_TYPE_LABEL[amb.vehicleType]}</p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${stCfg.badge}`}>
                                        <StatusIcon size={12} />{stCfg.label}
                                    </span>
                                </div>
                                <div className="space-y-1.5 text-sm">
                                    <p className="flex items-center gap-2 text-slate-600">
                                        <Phone size={14} className="text-slate-400" />
                                        {amb.driverName} — {amb.driverPhone}
                                    </p>
                                    {amb.currentLocation && (
                                        <p className="flex items-center gap-2 text-slate-500">
                                            <MapPin size={14} className="text-slate-400" />
                                            {amb.currentLocation}
                                        </p>
                                    )}
                                </div>
                                {amb.equipmentList && (
                                    <p className="mt-2 text-xs text-slate-400 truncate" title={amb.equipmentList}>
                                        Equipment: {amb.equipmentList}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Trips Tab */}
            {activeTab === 'trips' && (
                <div className="card overflow-hidden !p-0 shadow-sm border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trip #</th>
                                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                                    <th className="hidden sm:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Route</th>
                                    <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle</th>
                                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 sm:px-6 py-4"><div className="h-6 w-28 bg-slate-100 rounded" /></td>
                                        <td className="px-4 sm:px-6 py-4"><div className="h-6 w-32 bg-slate-100 rounded" /></td>
                                        <td className="hidden sm:table-cell px-6 py-4"><div className="h-6 w-40 bg-slate-100 rounded" /></td>
                                        <td className="hidden md:table-cell px-6 py-4"><div className="h-6 w-24 bg-slate-100 rounded" /></td>
                                        <td className="px-4 sm:px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded" /></td>
                                        <td className="px-4 sm:px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded float-right" /></td>
                                    </tr>
                                )) : trips.length === 0 ? (
                                    <tr><td colSpan={6} className="py-20 text-center">
                                        <Navigation size={40} className="mx-auto mb-4 text-slate-300" />
                                        <p className="text-slate-500 font-medium">No trips found</p>
                                    </td></tr>
                                ) : trips.map(trip => {
                                    const stCfg = TRIP_STATUS[trip.status] || { label: trip.status, badge: '' };
                                    return (
                                        <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 sm:px-6 py-4">
                                                <p className="font-mono font-bold text-sm text-slate-900">{trip.tripNumber}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${PRIORITY_BADGE[trip.priority]}`}>{trip.priority}</span>
                                                    <span className="text-[10px] text-slate-400 capitalize">{trip.tripType.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <p className="font-bold text-sm text-slate-900">{trip.patientName}</p>
                                                {trip.patientContact && <p className="text-xs text-slate-400">{trip.patientContact}</p>}
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4">
                                                <p className="text-xs text-slate-600 truncate max-w-[180px]" title={trip.pickupLocation}>
                                                    <MapPin size={12} className="inline mr-1 text-emerald-500" />{trip.pickupLocation}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate max-w-[180px] mt-0.5" title={trip.dropLocation}>
                                                    <MapPin size={12} className="inline mr-1 text-red-400" />{trip.dropLocation}
                                                </p>
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-4 text-sm text-slate-600">{trip.ambulance?.vehicleNumber || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${stCfg.badge}`}>{stCfg.label}</span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {trip.status === 'dispatched' && (
                                                        <button onClick={() => updateTripStatus(trip.id, 'en_route_pickup')} className="btn btn-primary h-8 px-3 text-xs">En Route</button>
                                                    )}
                                                    {trip.status === 'en_route_pickup' && (
                                                        <button onClick={() => updateTripStatus(trip.id, 'patient_picked')} className="btn btn-primary h-8 px-3 text-xs">Picked Up</button>
                                                    )}
                                                    {trip.status === 'patient_picked' && (
                                                        <button onClick={() => updateTripStatus(trip.id, 'en_route_hospital')} className="btn btn-primary h-8 px-3 text-xs">To Hospital</button>
                                                    )}
                                                    {trip.status === 'en_route_hospital' && (
                                                        <button onClick={() => updateTripStatus(trip.id, 'completed')} className="btn btn-success h-8 px-3 text-xs">Complete</button>
                                                    )}
                                                    {!['completed', 'cancelled'].includes(trip.status) && (
                                                        <button onClick={() => updateTripStatus(trip.id, 'cancelled')} className="btn btn-danger h-8 px-3 text-xs">Cancel</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {!isLoading && totalPages > 1 && (
                        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={totalItems} limit={limit} />
                    )}
                </div>
            )}

            {/* Add Vehicle Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">Register Ambulance</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Vehicle Number *</label>
                                    <input className="input h-11 w-full" placeholder="MH-12-AB-1234" value={ambulanceForm.vehicleNumber} onChange={e => setAmbulanceForm(f => ({ ...f, vehicleNumber: e.target.value }))} /></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Vehicle Type</label>
                                    <select className="input h-11 w-full" value={ambulanceForm.vehicleType} onChange={e => setAmbulanceForm(f => ({ ...f, vehicleType: e.target.value as VehicleType }))}>
                                        <option value="basic_life_support">Basic Life Support (BLS)</option>
                                        <option value="advanced_life_support">Advanced Life Support (ALS)</option>
                                        <option value="patient_transport">Patient Transport</option>
                                        <option value="neonatal">Neonatal</option>
                                    </select></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Driver Name *</label>
                                    <input className="input h-11 w-full" value={ambulanceForm.driverName} onChange={e => setAmbulanceForm(f => ({ ...f, driverName: e.target.value }))} /></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Driver Phone</label>
                                    <input className="input h-11 w-full" value={ambulanceForm.driverPhone} onChange={e => setAmbulanceForm(f => ({ ...f, driverPhone: e.target.value }))} /></div>
                            </div>
                            <div><label className="block text-sm font-semibold text-slate-700 mb-2">Equipment List</label>
                                <textarea className="input w-full min-h-[80px] py-3" placeholder="Defibrillator, Oxygen, ECG monitor..." value={ambulanceForm.equipmentList} onChange={e => setAmbulanceForm(f => ({ ...f, equipmentList: e.target.value }))} /></div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
                            <button onClick={() => setShowAddModal(false)} className="btn btn-secondary h-11 px-6">Cancel</button>
                            <button onClick={handleAddAmbulance} disabled={isSubmitting} className="btn btn-primary h-11 px-6">{isSubmitting ? 'Registering...' : 'Register'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dispatch Modal */}
            {showDispatchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">Dispatch Ambulance</h2>
                            <button onClick={() => setShowDispatchModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-sm font-semibold text-slate-700 mb-2">Ambulance *</label>
                                <select className="input h-11 w-full" value={dispatchForm.ambulanceId} onChange={e => setDispatchForm(f => ({ ...f, ambulanceId: e.target.value }))}>
                                    <option value="">Select available ambulance</option>
                                    {availableAmbulances.map(a => <option key={a.id} value={a.id}>{a.vehicleNumber} — {a.driverName}</option>)}
                                </select>
                                {availableAmbulances.length === 0 && <p className="text-xs text-amber-600 mt-1">No ambulances currently available</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Patient Name *</label>
                                    <input className="input h-11 w-full" value={dispatchForm.patientName} onChange={e => setDispatchForm(f => ({ ...f, patientName: e.target.value }))} /></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Contact</label>
                                    <input className="input h-11 w-full" placeholder="Phone" value={dispatchForm.patientContact} onChange={e => setDispatchForm(f => ({ ...f, patientContact: e.target.value }))} /></div>
                            </div>
                            <div><label className="block text-sm font-semibold text-slate-700 mb-2">Pickup Location *</label>
                                <input className="input h-11 w-full" placeholder="Address" value={dispatchForm.pickupLocation} onChange={e => setDispatchForm(f => ({ ...f, pickupLocation: e.target.value }))} /></div>
                            <div><label className="block text-sm font-semibold text-slate-700 mb-2">Drop Location *</label>
                                <input className="input h-11 w-full" placeholder="Hospital / Destination" value={dispatchForm.dropLocation} onChange={e => setDispatchForm(f => ({ ...f, dropLocation: e.target.value }))} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Trip Type</label>
                                    <select className="input h-11 w-full" value={dispatchForm.tripType} onChange={e => setDispatchForm(f => ({ ...f, tripType: e.target.value as TripType }))}>
                                        <option value="emergency">Emergency</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="inter_facility">Inter-Facility</option>
                                        <option value="dead_body">Dead Body</option>
                                    </select></div>
                                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                                    <select className="input h-11 w-full" value={dispatchForm.priority} onChange={e => setDispatchForm(f => ({ ...f, priority: e.target.value as TripPriority }))}>
                                        <option value="normal">Normal</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="critical">Critical</option>
                                    </select></div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
                            <button onClick={() => setShowDispatchModal(false)} className="btn btn-secondary h-11 px-6">Cancel</button>
                            <button onClick={handleDispatch} disabled={isSubmitting} className="btn btn-primary h-11 px-6">{isSubmitting ? 'Dispatching...' : 'Dispatch'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
