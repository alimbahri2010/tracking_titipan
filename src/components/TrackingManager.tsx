import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  Mail,
  Search,
  SlidersHorizontal,
  Copy,
  Check,
  Plus,
  Compass,
  Navigation,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  Download,
  X,
  MessageSquare,
  Send,
  User,
  Shield,
  CornerDownRight,
} from 'lucide-react';
import { TrackingCustomerOrder, TrackingOrderStatus } from '../types';
import { formatRupiah } from '../utils/formatters';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

const INITIAL_ORDERS: TrackingCustomerOrder[] = [];

export const TrackingManager: React.FC = () => {
  const [orders, setOrders] = useState<TrackingCustomerOrder[]>(() => {
    try {
      const saved = localStorage.getItem('titipan_customer_tracking_orders');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_ORDERS;
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'split' | 'table'>('split');
  const [statusFilter, setStatusFilter] = useState<'all' | TrackingOrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(128);
  const [isActivityOpen, setIsActivityOpen] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Real-time Firestore Sync for tracking_orders
  useEffect(() => {
    try {
      const q = query(collection(db, 'tracking_orders'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: TrackingCustomerOrder[] = [];
            snapshot.forEach((docSnap) => {
              fetched.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
            setOrders(fetched);
            if (fetched.length > 0 && !selectedOrderId) {
              setSelectedOrderId(fetched[0].id);
            }
          }
        },
        (err) => {
          console.info('Firestore offline/fallback mode active:', err?.message || err);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.info('Firestore listener initialized with local cache');
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('titipan_customer_tracking_orders', JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  // Form state for creating new order
  const [formOrderNumber, setFormOrderNumber] = useState<string>(`#${Math.floor(1000000 + Math.random() * 9000000)}`);
  const [formCustomerName, setFormCustomerName] = useState<string>('');
  const [formCustomerEmail, setFormCustomerEmail] = useState<string>('');
  const [formCustomerPhone, setFormCustomerPhone] = useState<string>('');
  const [formOrigin, setFormOrigin] = useState<string>('');
  const [formDestination, setFormDestination] = useState<string>('');
  const [formStatus, setFormStatus] = useState<TrackingOrderStatus>('Delivery');
  const [formServiceType, setFormServiceType] = useState<string>('Pindahan Rumah Standar');
  const [formAmount, setFormAmount] = useState<number>(3500000);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || (orders.length > 0 ? orders[0] : null);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.originAddress.toLowerCase().includes(q) ||
      order.destinationAddress.toLowerCase().includes(q) ||
      order.driver.name.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedOrder) return;

    const newActivity = {
      id: `act_${Date.now()}`,
      location: selectedOrder.destinationAddress,
      time: 'Baru saja',
      completed: true,
      note: newComment.trim(),
    };

    const updatedActivities = [newActivity, ...(selectedOrder.activities || [])];

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === selectedOrder.id) {
          return {
            ...o,
            activities: updatedActivities,
          };
        }
        return o;
      })
    );

    setNewComment('');

    // Persist comment to Firestore
    try {
      await updateDoc(doc(db, 'tracking_orders', selectedOrder.id), {
        activities: updatedActivities,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.info('Saved locally. Firestore sync pending online connection:', err);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerName.trim() || !formOrigin.trim() || !formDestination.trim()) return;

    const orderId = `ord_${Date.now()}`;
    const newOrder: TrackingCustomerOrder = {
      id: orderId,
      orderNumber: formOrderNumber.startsWith('#') ? formOrderNumber : `#${formOrderNumber}`,
      customerName: formCustomerName,
      customerRole: 'Customer',
      customerEmail: formCustomerEmail || `${formCustomerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      customerPhone: formCustomerPhone || '(0812) 555-8899',
      originAddress: formOrigin,
      originCity: formOrigin.split(',')[1]?.trim() || formOrigin,
      destinationAddress: formDestination,
      destinationCity: formDestination.split(',')[1]?.trim() || formDestination,
      status: formStatus,
      progressPercent: formStatus === 'Completed' ? 100 : formStatus === 'Delivery' ? 65 : formStatus === 'Transit' ? 40 : 10,
      estimatedArrival: formStatus === 'Completed' ? 'Selesai' : 'Besok, 15:00 WIB',
      serviceType: formServiceType,
      totalAmount: formAmount,
      driver: {
        name: 'Philip Osborne',
        role: 'Driver · Fleet Titipan',
        email: 'philiposborne@gmail.com',
        phone: '(208) 555-0112',
        avatar: 'PO',
        plateNumber: 'B 9281 UXT',
        truckType: 'Truk Box CBM-14',
        currentSpeed: '55 km/jam',
        remainingDistance: '32 km',
      },
      activities: [
        {
          id: `act_${Date.now()}_1`,
          location: formOrigin,
          time: 'Baru Saja',
          completed: true,
          note: 'Order baru dicatat & jadwal pengiriman dibuat',
        },
      ],
      routeCoordinates: {
        pickup: { lat: 35, lng: 30, label: 'Pickup' },
        dropoff: { lat: 80, lng: 70, label: 'Dropoff' },
        currentPosition: { lat: 55, lng: 45 },
      },
    };

    setOrders([newOrder, ...orders]);
    setSelectedOrderId(newOrder.id);
    setIsAddModalOpen(false);

    // Save directly to Firestore tracking_orders
    try {
      await setDoc(doc(db, 'tracking_orders', newOrder.id), {
        ...newOrder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByUid: auth.currentUser?.uid || 'system',
      });
    } catch (err) {
      console.info('Saved locally. Firestore sync pending online connection:', err);
    }

    // Reset form
    setFormCustomerName('');
    setFormCustomerEmail('');
    setFormCustomerPhone('');
    setFormOrigin('');
    setFormDestination('');
    setFormOrderNumber(`#${Math.floor(1000000 + Math.random() * 9000000)}`);
  };

  const handleExportCSV = () => {
    const headers = [
      'No Order',
      'Nama Konsumen',
      'Email',
      'Telepon',
      'Alamat Asal',
      'Alamat Tujuan',
      'Status',
      'Progress %',
      'Driver',
      'Total Biaya',
    ];

    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      `"${o.customerName}"`,
      o.customerEmail,
      o.customerPhone,
      `"${o.originAddress}"`,
      `"${o.destinationAddress}"`,
      o.status,
      `${o.progressPercent}%`,
      `"${o.driver.name}"`,
      o.totalAmount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Titipan_Customer_Tracking_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: TrackingOrderStatus) => {
    switch (status) {
      case 'Delivery':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-[#E7F7ED] text-[#1E824C] border border-[#C6EFD5]">
            Delivery
          </span>
        );
      case 'Transit':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-[#F2EAFA] text-[#7E4BC3] border border-[#E1D1F6]">
            Transit
          </span>
        );
      case 'Pending':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-[#FFF4E5] text-[#D97706] border border-[#FDE0B6]">
            Pending
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-[#E6F4F6] text-[#0e6e7d] border border-[#BCE1E7]">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar with Title, Search, and Toggle Modes */}
      <div className="bg-[#FFFDFA] p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0e6e7d] text-white flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">
                Tracking Delivery
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                LIVE GPS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Monitoring langsung armada, rute peta GPS & data pesanan konsumen
            </p>
          </div>
        </div>

        {/* Right: Search, Filter, Toggle View, and New Order */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari resi, nama, kota..."
              className="pl-8 pr-3 py-2 text-xs bg-[#FAF9F5] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e6e7d] w-44 sm:w-56 text-slate-700"
            />
          </div>

          {/* Toggle between Split View (Map+Cards) and Full Table List */}
          <div className="bg-[#F2F6F9] p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white text-[#0e6e7d] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Peta & Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#0e6e7d] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel List Data</span>
            </button>
          </div>

          {/* Add Order Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#0e6e7d] hover:bg-[#0c4f5b] text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Order Baru</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      {viewMode === 'split' ? (
        /* ================= SPLIT VIEW: CARDS (LEFT) + INTERACTIVE MAP (RIGHT) ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT COLUMN: Tracking Delivery Card List (Matches Screenshot) */}
          <div className="lg:col-span-4 space-y-3 max-h-[820px] overflow-y-auto pr-1">
            {/* Header of Cards */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Daftar Pesanan ({filteredOrders.length})
              </span>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                <span>Klik kartu untuk melihat rute di peta</span>
              </div>
            </div>

            {/* List of Cards */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">
                    {searchQuery ? 'Tidak ada order yang cocok' : 'Daftar Order Kosong'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {searchQuery
                      ? 'Coba ubah kata kunci pencarian'
                      : 'Data seed telah dibersihkan. Silakan catat pesanan baru.'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#0e6e7d] bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer inline-flex items-center gap-1 mx-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Order</span>
                  </button>
                )}
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = order.id === selectedOrderId;

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`bg-white rounded-2xl p-4 sm:p-4.5 border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'border-2 border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/15 bg-[#FAFCFF]'
                        : 'border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Top Row: Icon + Order Number & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-700">
                          <span className="text-[11px] font-black">☰</span>
                        </div>
                        <span className="text-sm font-extrabold text-slate-900 tracking-tight font-mono">
                          {order.orderNumber}
                        </span>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Progress Tracker Line: Dot --- Line with Truck Icon ---> Dot */}
                    <div className="my-3.5 relative flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
                      <div className="flex-1 h-1 bg-slate-100 mx-1.5 relative rounded-full overflow-visible">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${order.progressPercent}%` }}
                        />
                        {/* Moving truck icon indicator */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 p-1 rounded-full bg-slate-700 text-white shadow-xs"
                          style={{ left: `${order.progressPercent}%` }}
                        >
                          <Truck className="w-3 h-3" />
                        </div>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                    </div>

                    {/* Address Row: Origin on left, Destination on right */}
                    <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600 leading-tight">
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Pickup</p>
                        <p className="line-clamp-2 font-medium">{order.originAddress}</p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Dropoff</p>
                        <p className="line-clamp-2 font-medium text-slate-800">{order.destinationAddress}</p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-100 my-3" />

                    {/* Customer Info Footer: Avatar + Name + Role & Contact Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {order.customerAvatar ? (
                          <img
                            src={order.customerAvatar}
                            alt={order.customerName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                            {order.customerName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {order.customerName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {order.customerRole}
                          </p>
                        </div>
                      </div>

                      {/* Phone & Message Actions */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={`tel:${order.customerPhone}`}
                          title={`Hubungi ${order.customerPhone}`}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#0e6e7d] hover:bg-slate-50 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`mailto:${order.customerEmail}`}
                          title={`Kirim email ke ${order.customerEmail}`}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#0e6e7d] hover:bg-slate-50 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT COLUMN: Interactive High-Fidelity Styled Map View */}
          <div className="lg:col-span-8 bg-[#EBF2F7] rounded-3xl border border-slate-300/80 shadow-md relative overflow-hidden min-h-[580px] lg:min-h-[760px] flex flex-col justify-between">
            {/* Styled Background Map Canvas (SVG Vector Map Matching Screenshot Aesthetic) */}
            <div className="absolute inset-0 z-0 select-none overflow-hidden bg-[#ECE8E1]">
              <svg
                className="w-full h-full object-cover transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
                viewBox="0 0 1000 800"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background Landfill */}
                <rect width="1000" height="800" fill="#EFECE6" />

                {/* Urban Blocks & Parks */}
                <path d="M 50,20 L 350,15 L 360,180 L 70,190 Z" fill="#E8E5DD" stroke="#DFDBD0" strokeWidth="2" />
                <path d="M 400,30 L 780,25 L 820,240 L 410,210 Z" fill="#E8E5DD" stroke="#DFDBD0" strokeWidth="2" />
                <path d="M 120,220 L 380,220 L 370,480 L 100,450 Z" fill="#E8E5DD" stroke="#DFDBD0" strokeWidth="2" />
                <path d="M 550,260 L 920,280 L 950,560 L 520,530 Z" fill="#E8E5DD" stroke="#DFDBD0" strokeWidth="2" />
                <path d="M 150,520 L 450,510 L 430,760 L 120,740 Z" fill="#E8E5DD" stroke="#DFDBD0" strokeWidth="2" />
                <path d="M 580,580 L 950,590 L 920,780 L 610,770 Z" fill="#E8E5DD" stroke="#DFDBD0" strokeWidth="2" />

                {/* River / Water Channel in Light Blue */}
                <path
                  d="M 440,0 C 430,120 400,240 370,360 C 340,480 320,580 430,690 C 490,750 560,780 620,800 L 700,800 C 650,750 580,720 520,650 C 450,560 460,460 480,360 C 510,240 540,120 540,0 Z"
                  fill="#CEE4F2"
                  opacity="0.9"
                />

                {/* Secondary Street Grid lines (Light gray & white) */}
                <g stroke="#FFFFFF" strokeWidth="3" opacity="0.9" strokeLinecap="round">
                  <line x1="80" y1="90" x2="330" y2="90" />
                  <line x1="80" y1="140" x2="340" y2="140" />
                  <line x1="160" y1="30" x2="160" y2="180" />
                  <line x1="260" y1="30" x2="260" y2="180" />

                  <line x1="130" y1="280" x2="360" y2="280" />
                  <line x1="120" y1="340" x2="350" y2="340" />
                  <line x1="110" y1="400" x2="340" y2="400" />
                  <line x1="190" y1="230" x2="190" y2="460" />
                  <line x1="280" y1="230" x2="280" y2="470" />

                  <line x1="450" y1="80" x2="770" y2="80" />
                  <line x1="450" y1="140" x2="780" y2="140" />
                  <line x1="580" y1="40" x2="580" y2="200" />
                  <line x1="680" y1="40" x2="680" y2="210" />

                  <line x1="560" y1="340" x2="900" y2="340" />
                  <line x1="550" y1="420" x2="910" y2="420" />
                  <line x1="540" y1="480" x2="930" y2="480" />
                  <line x1="660" y1="270" x2="660" y2="540" />
                  <line x1="770" y1="270" x2="770" y2="550" />
                  <line x1="860" y1="280" x2="860" y2="560" />
                </g>

                {/* Primary Yellow Avenues / Highways */}
                <g stroke="#FED786" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 0,220 L 380,220 C 440,220 480,200 520,180 L 1000,160" />
                  <path d="M 220,0 L 220,500 C 220,570 260,620 330,650 L 520,700 L 1000,690" />
                  <path d="M 520,180 L 580,320 L 760,540 L 980,620" />
                  <path d="M 440,580 L 640,780" />
                </g>

                {/* White Inner Highway Centerline */}
                <g stroke="#FFFDF8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 0,220 L 380,220 C 440,220 480,200 520,180 L 1000,160" />
                  <path d="M 220,0 L 220,500 C 220,570 260,620 330,650 L 520,700 L 1000,690" />
                  <path d="M 520,180 L 580,320 L 760,540 L 980,620" />
                  <path d="M 440,580 L 640,780" />
                </g>

                {/* Soft Bridge Shadow over River */}
                <line x1="435" y1="220" x2="505" y2="200" stroke="#718096" strokeWidth="12" opacity="0.25" strokeLinecap="butt" />
                <line x1="435" y1="220" x2="505" y2="200" stroke="#FED786" strokeWidth="10" strokeLinecap="butt" />

                {/* ACTIVE ROUTE LINE (Vivid Blue matching screenshot!) */}
                {selectedOrder && (
                  <>
                    <g stroke="#2563EB" strokeLinecap="round" strokeLinejoin="round">
                      {/* Outer glow */}
                      <path
                        d="M 538,150 L 568,150 L 570,265 L 555,310 L 550,390 L 580,480 L 660,560 L 650,680"
                        strokeWidth="10"
                        stroke="#93C5FD"
                        opacity="0.5"
                        fill="none"
                      />
                      {/* Core Blue Route */}
                      <path
                        d="M 538,150 L 568,150 L 570,265 L 555,310 L 550,390 L 580,480 L 660,560 L 650,680"
                        strokeWidth="5"
                        fill="none"
                      />
                    </g>

                    {/* Alternative / Secondary Route (Light dashed blue) */}
                    <path
                      d="M 550,390 L 520,440 L 530,520 L 610,610 L 650,680"
                      stroke="#93C5FD"
                      strokeWidth="3.5"
                      strokeDasharray="6 4"
                      fill="none"
                      opacity="0.8"
                    />

                    {/* START / PICKUP PIN (Blue Marker with 'Pickup' speech label) */}
                    <g transform="translate(538, 150)">
                      <circle cx="0" cy="0" r="14" fill="#2563EB" opacity="0.2" className="animate-ping" />
                      <circle cx="0" cy="0" r="6.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
                      {/* Pickup Label Bubble */}
                      <g transform="translate(-26, -34)">
                        <rect width="52" height="22" rx="6" fill="#FFFFFF" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))" />
                        <text x="26" y="15" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1E293B">
                          Pickup
                        </text>
                      </g>
                    </g>

                    {/* LIVE TRUCK / VEHICLE ICON ON ROUTE (Matching Screenshot!) */}
                    <g transform="translate(552, 315)">
                      {/* Radar Pulse Rings */}
                      <circle cx="0" cy="0" r="28" fill="#2563EB" opacity="0.12" className="animate-ping" />
                      <circle cx="0" cy="0" r="20" fill="#2563EB" opacity="0.2" />
                      <circle cx="0" cy="0" r="15" fill="#FFFFFF" filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.25))" />

                      {/* Top-Down Delivery Truck Shape */}
                      <g transform="rotate(15)">
                        {/* Truck Cabin & Wheels */}
                        <rect x="-6" y="-11" width="12" height="22" rx="3" fill="#1E293B" />
                        <rect x="-5" y="-10" width="10" height="7" rx="2" fill="#3B82F6" />
                        <rect x="-4" y="-2" width="8" height="11" rx="1" fill="#94A3B8" />
                        {/* Headlights */}
                        <circle cx="-3" cy="-11" r="1" fill="#FEF08A" />
                        <circle cx="3" cy="-11" r="1" fill="#FEF08A" />
                      </g>
                    </g>

                    {/* END / DROPOFF PIN (Blue Marker with 'Dropoff' speech label) */}
                    <g transform="translate(650, 680)">
                      <circle cx="0" cy="0" r="14" fill="#2563EB" opacity="0.2" className="animate-ping" />
                      <circle cx="0" cy="0" r="6.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
                      {/* Dropoff Label Bubble */}
                      <g transform="translate(-28, 14)">
                        <rect width="56" height="22" rx="6" fill="#FFFFFF" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))" />
                        <text x="28" y="15" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1E293B">
                          Dropoff
                        </text>
                      </g>
                    </g>
                  </>
                )}
              </svg>
            </div>

            {/* TOP RIGHT FLOATING CARD: Driver Information (Matches Screenshot!) */}
            {selectedOrder ? (
              <div className="relative z-10 m-3 sm:m-5 self-end w-full max-w-[280px] sm:max-w-[310px] space-y-3 pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-lg space-y-3">
                  {/* Driver Profile Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-slate-300 text-slate-700 font-extrabold text-sm flex items-center justify-center shrink-0">
                      {selectedOrder.driver.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-extrabold text-slate-900 leading-tight truncate">
                        {selectedOrder.driver.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {selectedOrder.driver.role}
                      </p>
                    </div>
                  </div>

                  {/* Email with copy */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-[11px] font-medium">{selectedOrder.driver.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedOrder.driver.email, 'email')}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                      title="Salin Email"
                    >
                      {copiedField === 'email' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Phone with copy */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-[11px] font-medium font-mono">{selectedOrder.driver.phone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedOrder.driver.phone, 'phone')}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                      title="Salin Telepon"
                    >
                      {copiedField === 'phone' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* FLOATING ACTIVITY / TIMELINE PANEL (Matches Screenshot!) */}
                {isActivityOpen && (
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-lg space-y-3 animate-in fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-extrabold text-slate-800">Activity</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                          esc
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsActivityOpen(false)}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
                          title="Tutup Activity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Comment Input */}
                    <form onSubmit={handleAddComment} className="relative">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Leave a comment..."
                        className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e6e7d] text-slate-700 placeholder-slate-400"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0e6e7d] disabled:opacity-30 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    {/* Milestones list */}
                    <div className="space-y-3 pt-1 text-left max-h-48 overflow-y-auto pr-1">
                      {selectedOrder.activities.map((act) => (
                        <div key={act.id} className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0 mt-1" />
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-800 leading-tight">
                              {act.location}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {act.time}
                            </p>
                            {act.note && (
                              <p className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 mt-1">
                                {act.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Button to reopen activity if closed */}
                {!isActivityOpen && (
                  <button
                    type="button"
                    onClick={() => setIsActivityOpen(true)}
                    className="bg-white text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 shadow-md text-xs font-bold flex items-center gap-2 hover:bg-slate-50 cursor-pointer ml-auto"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#0e6e7d]" />
                    <span>Buka Log Aktivitas</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="relative z-10 m-auto p-6 max-w-sm bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-xl text-center space-y-3 pointer-events-auto">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0e6e7d] flex items-center justify-center mx-auto shadow-xs border border-teal-100">
                  <Compass className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-800">
                    Belum Ada Data Order Aktif
                  </h4>
                  <p className="text-xs text-slate-500">
                    Semua data seed pengiriman telah dibersihkan. Anda dapat menambahkan order pengiriman baru untuk memantau armada secara live.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#0e6e7d] hover:bg-[#0c4f5b] text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Buat Order Baru</span>
                </button>
              </div>
            )}

            {/* BOTTOM BAR: Live Status Strip & Map Controls */}
            <div className="relative z-10 p-3 sm:p-5 flex items-center justify-between gap-3 pointer-events-auto">
              {/* Order quick info chip */}
              {selectedOrder ? (
                <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-md flex items-center gap-3 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-extrabold text-slate-900 font-mono">
                    {selectedOrder.orderNumber}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="font-medium text-slate-600 hidden sm:inline">
                    Truk: {selectedOrder.driver.plateNumber} ({selectedOrder.driver.currentSpeed})
                  </span>
                  <span className="font-bold text-emerald-700">
                    {selectedOrder.driver.remainingDistance} tersisa
                  </span>
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-md text-xs text-slate-500 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span>Peta Siap · Tidak ada armada aktif</span>
                </div>
              )}

              {/* Bottom Right Map Zoom & Target Controls (Matches Screenshot!) */}
              <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-md flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  title="Target Ulang Lokasi"
                >
                  <Navigation className="w-3.5 h-3.5 rotate-45" />
                </button>
                <div className="w-[1px] h-4 bg-slate-200" />
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
                  className="px-2 py-1 text-xs font-black text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-700 px-1 select-none">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                  className="px-2 py-1 text-xs font-black text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Zoom In"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= FULL TABLE LIST VIEW: Customer Tracking Data ================= */
        <div className="bg-[#FFFDFA] rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          {/* Table Header Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Filter Status:
              </span>
              <div className="flex items-center gap-1">
                {(['all', 'Delivery', 'Transit', 'Pending', 'Completed'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#0e6e7d] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'all' ? 'Semua' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: Export to CSV */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">No. Order</th>
                  <th className="py-3 px-4">Konsumen</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Alamat Penjemputan</th>
                  <th className="py-3 px-4">Alamat Tujuan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Driver & Armada</th>
                  <th className="py-3 px-4 text-right">Biaya</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Tidak ada data pesanan yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={`hover:bg-teal-50/20 transition-colors ${
                        order.id === selectedOrderId ? 'bg-teal-50/30' : ''
                      }`}
                    >
                      {/* Order Number */}
                      <td className="py-3 px-4 font-mono font-extrabold text-slate-900">
                        {order.orderNumber}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {order.customerName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{order.customerName}</div>
                            <div className="text-[10px] text-slate-400">{order.customerEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {order.customerPhone}
                      </td>

                      {/* Origin */}
                      <td className="py-3 px-4 max-w-[180px] truncate text-slate-600" title={order.originAddress}>
                        {order.originAddress}
                      </td>

                      {/* Destination */}
                      <td className="py-3 px-4 max-w-[180px] truncate font-medium text-slate-800" title={order.destinationAddress}>
                        {order.destinationAddress}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Driver & Truck */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{order.driver.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {order.driver.plateNumber} · {order.driver.truckType}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(order.totalAmount)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setViewMode('split');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#0e6e7d] hover:bg-[#0c4f5b] text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Lihat Peta
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3.5 px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Menampilkan {filteredOrders.length} dari {orders.length} total pesanan konsumen</span>
            <span className="font-bold text-[#0e6e7d]">Sistem Pelacakan Titipan Realtime</span>
          </div>
        </div>
      )}

      {/* 3. MODAL: Tambah Order Tracking Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0e6e7d] flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Tambah Order Tracking Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3.5 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nomor Resi / Order</label>
                  <input
                    type="text"
                    required
                    value={formOrderNumber}
                    onChange={(e) => setFormOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e6e7d] font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Status Awal</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TrackingOrderStatus)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e6e7d]"
                  >
                    <option value="Delivery">Delivery (Di Perjalanan)</option>
                    <option value="Transit">Transit (Transit/Gudang)</option>
                    <option value="Pending">Pending (Menunggu Antrian)</option>
                    <option value="Completed">Completed (Selesai)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nama Lengkap Konsumen</label>
                <input
                  type="text"
                  required
                  value={formCustomerName}
                  onChange={(e) => setFormCustomerName(e.target.value)}
                  placeholder="Contoh: Rian Pratama"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e6e7d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Email Konsumen</label>
                  <input
                    type="email"
                    value={formCustomerEmail}
                    onChange={(e) => setFormCustomerEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e6e7d]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={formCustomerPhone}
                    onChange={(e) => setFormCustomerPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e6e7d]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Alamat Penjemputan (Pickup)</label>
                <input
                  type="text"
                  required
                  value={formOrigin}
                  onChange={(e) => setFormOrigin(e.target.value)}
                  placeholder="Alamat lengkap asal penjemputan barang..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e6e7d]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Alamat Tujuan Pengantaran (Dropoff)</label>
                <input
                  type="text"
                  required
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value)}
                  placeholder="Alamat lengkap lokasi tujuan barang..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e6e7d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Jenis Layanan</label>
                  <select
                    value={formServiceType}
                    onChange={(e) => setFormServiceType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e6e7d]"
                  >
                    <option value="Pindahan Rumah Standar">Pindahan Rumah Standar</option>
                    <option value="Pindahan Rumah Full Service">Pindahan Rumah Full Service</option>
                    <option value="Pindahan Kantor & Bisnis">Pindahan Kantor & Bisnis</option>
                    <option value="Pindahan Kost & Ekspedisi">Pindahan Kost & Ekspedisi</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Estimasi Biaya (Rp)</label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0e6e7d] font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold bg-[#0e6e7d] hover:bg-[#0c4f5b] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan & Buat Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
