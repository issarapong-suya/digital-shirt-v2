'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Users, 
  Shirt, 
  DollarSign, 
  Download, 
  Search, 
  RefreshCw, 
  Eye, 
  Building2, 
  Sparkles,
  X,
  Filter,
  ArrowLeft
} from 'lucide-react';

interface OrderItem {
  timestamp: string;
  cid: string;
  firstName: string;
  lastName: string;
  agency: string;
  cut: string;
  size: string;
  qty: number;
  totalPrice: number;
  slipUrl: string;
  paymentStatus: string;
}

export default function Round2Dashboard() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [cutFilter, setCutFilter] = useState('');
  const [viewSlipUrl, setViewSlipUrl] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(item => {
    const matchSearch = search === '' || 
      `${item.firstName} ${item.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      item.cid.includes(search) ||
      item.agency.toLowerCase().includes(search.toLowerCase());
    
    const matchAgency = agencyFilter === '' || item.agency === agencyFilter;
    const matchCut = cutFilter === '' || item.cut === cutFilter;

    return matchSearch && matchAgency && matchCut;
  });

  const totalOrdersCount = filteredOrders.length;
  const totalShirtsQty = filteredOrders.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalRevenue = filteredOrders.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  const specialSizesCount = filteredOrders.filter(item => item.size.includes('พิเศษ')).length;

  const exportCSV = () => {
    const headers = ['Timestamp', 'CID', 'ชื่อ', 'นามสกุล', 'หน่วยงาน', 'ทรง', 'ไซส์', 'จำนวน', 'ยอดรวม', 'สถานะ'];
    const rows = filteredOrders.map(o => [
      `"${o.timestamp}"`,
      `"${o.cid}"`,
      `"${o.firstName}"`,
      `"${o.lastName}"`,
      `"${o.agency}"`,
      `"${o.cut}"`,
      `"${o.size}"`,
      o.qty,
      o.totalPrice,
      `"${o.paymentStatus}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Round2_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const agenciesList = Array.from(new Set(orders.map(o => o.agency))).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      
      {/* Header Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Dashboard รอบที่ 2 (Orders_2)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            ระบบรายงานสรุปยอดการสั่งจองเสื้อ
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-200 text-xs sm:text-sm font-semibold transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" /> กลับหน้าสั่งจองเสื้อ
          </Link>

          <button
            onClick={fetchOrders}
            className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-200 text-xs sm:text-sm font-semibold transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> รีเฟรชข้อมูล
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-extrabold transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Download className="w-4 h-4" /> ส่งออกไฟล์ Excel / CSV
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">จำนวนผู้สั่งจอง</p>
              <p className="text-2xl font-black text-slate-100">{totalOrdersCount} <span className="text-xs text-slate-400 font-normal">รายการ</span></p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Shirt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">จำนวนเสื้อรวม</p>
              <p className="text-2xl font-black text-slate-100">{totalShirtsQty} <span className="text-xs text-slate-400 font-normal">ตัว</span></p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium"> ยอดเงินรวมสุทธิ</p>
              <p className="text-2xl font-black text-amber-400">{totalRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-normal">บาท</span></p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">ยอดสั่งไซส์พิเศษ</p>
              <p className="text-2xl font-black text-pink-400">{specialSizesCount} <span className="text-xs text-slate-400 font-normal">รายการ</span></p>
            </div>
          </div>

        </div>

        {/* Filter Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาตาม ชื่อ, CID หรือหน่วยงาน..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" /> กรองข้อมูล:
            </div>

            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-sans"
            >
              <option value="">-- หน่วยงานทั้งหมด --</option>
              {agenciesList.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            <select
              value={cutFilter}
              onChange={(e) => setCutFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-sans"
            >
              <option value="">-- ทรงทั้งหมด --</option>
              <option value="ชาย">ทรงชาย</option>
              <option value="หญิง">ทรงหญิง</option>
            </select>
          </div>

        </div>

        {/* Data Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">วัน-เวลา</th>
                  <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3.5 px-4">หน่วยงาน</th>
                  <th className="py-3.5 px-4 text-center">ทรง</th>
                  <th className="py-3.5 px-4 text-center">ไซส์</th>
                  <th className="py-3.5 px-4 text-center">จำนวน</th>
                  <th className="py-3.5 px-4 text-right">ยอดเงิน</th>
                  <th className="py-3.5 px-4 text-center">สลิป</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-xs sm:text-sm">
                      {isLoading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบรายการสั่งจองในระบบ'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">{item.timestamp}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-100">{item.firstName} {item.lastName}</td>
                      <td className="py-3.5 px-4 text-slate-300">{item.agency}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${item.cut === 'ชาย' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' : 'bg-pink-500/10 text-pink-400 border border-pink-500/30'}`}>
                          {item.cut}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-300">{item.size}</td>
                      <td className="py-3.5 px-4 text-center font-semibold">{item.qty}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-amber-400">{item.totalPrice?.toLocaleString()} ฿</td>
                      <td className="py-3.5 px-4 text-center">
                        {item.slipUrl ? (
                          <button
                            onClick={() => setViewSlipUrl(item.slipUrl)}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition"
                            title="ดูสลิป"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* View Slip Modal */}
      {viewSlipUrl && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden p-3 shadow-2xl">
            <button
              onClick={() => setViewSlipUrl(null)}
              className="absolute top-4 right-4 bg-slate-800 text-slate-200 p-2 rounded-full hover:bg-slate-700 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="text-xs font-semibold text-slate-400 mb-2 px-2">สลิปโอนเงิน</p>
            <Image src={viewSlipUrl} alt="Slip" width={500} height={700} className="w-full h-auto rounded-2xl object-contain max-h-[75vh]" />
          </div>
        </div>
      )}

    </div>
  );
}
