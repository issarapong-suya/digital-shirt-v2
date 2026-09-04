'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { 
  Sparkles, 
  CreditCard, 
  UserCheck, 
  CheckCircle2, 
  Upload, 
  Ruler, 
  Shirt, 
  Building2, 
  FileText,
  AlertCircle,
  Loader2,
  ZoomIn,
  X
} from 'lucide-react';

const AGENCIES = [
  "สสจ.ลำปาง",
  "รพ.ลำปาง",
  "รพ.เกาะคา",
  "รพ.งาว",
  "รพ.แจ้ห่ม",
  "รพ.เถิน",
  "รพ.แม่พริก",
  "รพ.แม่ทะ",
  "รพ.แม่เมาะ",
  "รพ.วังเหนือ",
  "รพ.สบปราบ",
  "รพ.ห้างฉัตร",
  "รพ.เสริมงาม",
  "สสอ.เมืองลำปาง",
  "สสอ.เกาะคา",
  "สสอ.งาว",
  "สสอ.แจ้ห่ม",
  "สสอ.เถิน",
  "สสอ.แม่พริก",
  "สสอ.แม่ทะ",
  "สสอ.แม่เมาะ",
  "สสอ.วังเหนือ",
  "สสอ.สบปราบ",
  "สสอ.ห้างฉัตร",
  "สสอ.เสริมงาม",
  "สมาชิกทั่วไป/อื่นๆ"
];

const MEN_SIZES = ['M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'พิเศษ'];
const WOMEN_SIZES = ['S', 'M', 'L', 'XL', 'พิเศษ'];

export default function Round2OrderForm() {
  const [cid, setCid] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [agency, setAgency] = useState('');
  const [cut, setCut] = useState<'ชาย' | 'หญิง'>('ชาย');
  const [size, setSize] = useState('');
  const [customChest, setCustomChest] = useState('');
  const [qty, setQty] = useState(1);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipFileName, setSlipFileName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [cidFound, setCidFound] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Auto-fill lookup by CID
  useEffect(() => {
    if (cid.length === 13) {
      checkCid(cid);
    } else {
      setCidFound(false);
    }
  }, [cid]);

  // Adjust size if switching cut
  useEffect(() => {
    if (cut === 'หญิง' && ['2XL', '3XL', '4XL', '5XL'].includes(size)) {
      setSize('');
    }
    if (cut === 'ชาย' && size === 'S') {
      setSize('');
    }
  }, [cut, size]);

  const checkCid = async (cidVal: string) => {
    setIsLoading(true);
    setLoadingText('กำลังตรวจสอบข้อมูลรอบที่ 2...');
    try {
      const res = await fetch(`/api/check-cid?cid=${cidVal}`);
      const data = await res.json();

      if (data.found && data.order) {
        setFirstName(data.order.firstName || '');
        setLastName(data.order.lastName || '');
        setAgency(data.order.agency || '');
        setCut(data.order.cut || 'ชาย');

        const rawSize = data.order.size || '';
        if (typeof rawSize === 'string' && rawSize.startsWith('พิเศษ')) {
          setSize('พิเศษ');
          if (data.order.customChest) {
            setCustomChest(String(data.order.customChest));
          }
        } else {
          setSize(rawSize);
          setCustomChest('');
        }

        setQty(data.order.qty || 1);
        setCidFound(true);

        Swal.fire({
          icon: 'info',
          title: 'พบข้อมูลเดิมในระบบรอบที่ 2',
          text: 'คุณสามารถแก้ไขข้อมูลหรือสั่งซื้อเพิ่มเติมได้',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        setCidFound(false);
      }
    } catch (err) {
      console.error('CID lookup error:', err);
      setCidFound(false);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!size) return 0;
    let basePrice = 350;
    if (['2XL', '3XL', '4XL'].includes(size)) {
      basePrice = 360;
    } else if (size === '5XL') {
      basePrice = 370;
    } else if (size === 'พิเศษ') {
      basePrice = 380;
    }
    return basePrice * qty;
  };

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      setSlipFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cid || cid.length !== 13) {
      Swal.fire('ข้อผิดพลาด', 'กรุณากรอกเลขบัตรประชาชน 13 หลักให้ถูกต้อง', 'warning');
      return;
    }
    if (!firstName || !lastName || !agency) {
      Swal.fire('ข้อผิดพลาด', 'กรุณากรอกชื่อ นามสกุล และหน่วยงานให้ครบถ้วน', 'warning');
      return;
    }
    if (!size) {
      Swal.fire('ข้อผิดพลาด', 'กรุณาเลือกขนาดไซส์เสื้อ', 'warning');
      return;
    }
    if (size === 'พิเศษ' && (!customChest || parseFloat(customChest) <= 0)) {
      Swal.fire('ข้อผิดพลาด', 'กรุณาระบุรอบอกจริงสำหรับไซส์พิเศษ', 'warning');
      return;
    }

    setIsLoading(true);
    setLoadingText('กำลังบันทึกข้อมูลและอัปโหลดสลิป...');

    try {
      const formData = new FormData();
      formData.append('cid', cid);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('agency', agency);
      formData.append('cut', cut);
      formData.append('size', size);
      if (customChest) formData.append('customChest', customChest);
      formData.append('qty', String(qty));
      if (slipFile) formData.append('slip', slipFile);

      const res = await fetch('/api/orders', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();

      if (result.success) {
        setIsLoading(false);
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message || 'บันทึกไม่สำเร็จ');
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก';
      Swal.fire('เกิดข้อผิดพลาด', msg, 'error');
    }
  };

  const resetForm = () => {
    setShowSuccessModal(false);
    setCid('');
    setFirstName('');
    setLastName('');
    setAgency('');
    setCut('ชาย');
    setSize('');
    setCustomChest('');
    setQty(1);
    setSlipFile(null);
    setSlipFileName('');
    setCidFound(false);
  };

  const availableSizes = cut === 'ชาย' ? MEN_SIZES : WOMEN_SIZES;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-3 sm:p-6 font-sans">
      
      {/* Fixed Viewport Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl flex flex-col items-center max-w-xs w-full text-center">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 border border-amber-500/20">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
            <p className="text-slate-200 font-semibold animate-pulse text-sm sm:text-base">{loadingText}</p>
          </div>
        </div>
      )}

      {/* Main Container Card */}
      <div className="w-full max-w-3xl bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Header Header Pattern */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-center border-b border-slate-700/80 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> สั่งจองเสื้อรอบที่ 2 (เปิดให้ระบุไซส์พิเศษ)
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200">
            ระบบสั่งจองเสื้อชมรมดิจิทัล สสจ.ลำปาง
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">สำนักงานสาธารณสุขจังหวัดลำปาง</p>
        </div>

        {/* Form Area */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6 sm:space-y-8">
          
          {/* Section 1: CID & Personal Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-amber-400 border-b border-slate-700 pb-2">
              <UserCheck className="w-5 h-5" /> 1. ข้อมูลผู้สั่งจอง
              {cidFound && (
                <span className="ml-auto text-xs font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> พบข้อมูลเดิมในระบบ
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                เลขบัตรประชาชน 13 หลัก <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                maxLength={13}
                required
                value={cid}
                onChange={(e) => setCid(e.target.value.replace(/\D/g, ''))}
                placeholder="กรอกเลขบัตรประชาชน 13 หลักเพื่อค้นหาหรือลงทะเบียนใหม่"
                className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-slate-100 text-sm font-mono tracking-wider focus:outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  ชื่อ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="ชื่อจริง"
                  className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  นามสกุล <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="นามสกุล"
                  className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" /> หน่วยงาน / สังกัด <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none transition"
              >
                <option value="">-- เลือกหน่วยงาน --</option>
                {AGENCIES.map((ag) => (
                  <option key={ag} value={ag}>{ag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Shirt Selection & Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-amber-400 border-b border-slate-700 pb-2">
              <Shirt className="w-5 h-5" /> 2. เลือกทรงและขนาดเสื้อ (รอบที่ 2)
            </div>

            {/* Preview Photos */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div 
                onClick={() => setZoomImage('/img/M.png')}
                className="group relative bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden cursor-pointer hover:border-sky-400 transition"
              >
                <Image src="/img/M.png" alt="ทรงชาย" width={300} height={300} className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition duration-300" />
                <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 backdrop-blur-sm p-2 text-center text-xs font-semibold text-sky-400 flex items-center justify-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5" /> ทรงชาย (คอปก)
                </div>
              </div>

              <div 
                onClick={() => setZoomImage('/img/W.png')}
                className="group relative bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden cursor-pointer hover:border-pink-400 transition"
              >
                <Image src="/img/W.png" alt="ทรงหญิง" width={300} height={300} className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition duration-300" />
                <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 backdrop-blur-sm p-2 text-center text-xs font-semibold text-pink-400 flex items-center justify-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5" /> ทรงหญิง (เข้ารูป)
                </div>
              </div>
            </div>

            {/* Gender Cut Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">เลือกทรงเสื้อ</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCut('ชาย')}
                  className={`py-3 px-4 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-all ${
                    cut === 'ชาย'
                      ? 'bg-sky-600 text-white border-sky-400 shadow-lg shadow-sky-600/30'
                      : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shirt className="w-4 h-4" /> ทรงชาย
                </button>

                <button
                  type="button"
                  onClick={() => setCut('หญิง')}
                  className={`py-3 px-4 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-all ${
                    cut === 'หญิง'
                      ? 'bg-pink-600 text-white border-pink-400 shadow-lg shadow-pink-600/30'
                      : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shirt className="w-4 h-4" /> ทรงหญิง
                </button>
              </div>
            </div>

            {/* Size Chart Button */}
            <button
              type="button"
              onClick={() => setZoomImage('/img/Size.png')}
              className="w-full py-2 px-3 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 hover:border-amber-400 text-amber-400 text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
            >
              <Ruler className="w-4 h-4" /> คลิกเพื่อดูตารางขนาดไซส์เสื้อ (Size Chart)
            </button>

            {/* Size Selection Grid */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                เลือกขนาดไซส์เสื้อ ({cut}) <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {availableSizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSize(sz)}
                    className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition ${
                      size === sz
                        ? cut === 'ชาย'
                          ? 'bg-sky-500 text-white border-sky-300 shadow-md'
                          : 'bg-pink-500 text-white border-pink-300 shadow-md'
                        : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Chest Input for Special Size (>5XL) */}
            {size === 'พิเศษ' && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 animate-fadeIn">
                <label className="block text-xs sm:text-sm font-semibold text-amber-300 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4" /> ระบุรอบอกจริงสำหรับไซส์พิเศษ (นิ้ว) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  max="80"
                  value={customChest}
                  onChange={(e) => setCustomChest(e.target.value)}
                  placeholder="เช่น 52, 54, 56 (นิ้ว)"
                  className="w-full bg-slate-900 border border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none"
                />
                <p className="text-xs text-amber-400/80">* ไซส์พิเศษใหญ่กว่า 5XL คิดราคา 380 บาท/ตัว</p>
              </div>
            )}

            {/* Quantity Input */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">จำนวน (ตัว)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full sm:w-36 bg-slate-900/80 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-bold text-center focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Payment & Slip Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-amber-400 border-b border-slate-700 pb-2">
              <CreditCard className="w-5 h-5" /> 3. ชำระเงิน & แนบสลิปโอนเงิน
            </div>

            {/* Total Price Summary Box */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">ยอดรวมชำระสุทธิ</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-400">{calculateTotal().toLocaleString()} <span className="text-sm font-normal text-slate-300">บาท</span></p>
              </div>
              <button
                type="button"
                onClick={() => setZoomImage('/img/QR_PAY.jpg')}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition flex items-center gap-1.5"
              >
                <ZoomIn className="w-4 h-4" /> ดู QR ชำระเงิน
              </button>
            </div>

            {/* Slip Upload Box */}
            <div className="border-2 border-dashed border-slate-700 hover:border-amber-400/60 rounded-2xl p-4 text-center bg-slate-900/50 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleSlipChange}
                className="hidden"
                id="slip-input"
              />
              <label htmlFor="slip-input" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                <Upload className="w-8 h-8 text-amber-400" />
                <span className="text-xs sm:text-sm font-medium text-slate-300">
                  {slipFileName ? `ไฟล์สลิป: ${slipFileName}` : 'คลิกแนบไฟล์สลิปชำระเงิน (รูปภาพ)'}
                </span>
                <span className="text-xs text-slate-500">รองรับไฟล์ JPG, PNG, WEBP</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-base sm:text-lg shadow-xl shadow-amber-500/20 active:scale-[0.99] transition duration-200"
          >
            {cidFound ? 'อัปเดตข้อมูลการสั่งจองรอบที่ 2' : 'ยืนยันสั่งจองเสื้อรอบที่ 2'}
          </button>

        </form>
      </div>

      {/* Zoom Image Modal */}
      {zoomImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden p-2">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 bg-slate-800 text-slate-200 p-2 rounded-full hover:bg-slate-700 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <Image src={zoomImage} alt="Zoom" width={600} height={600} className="w-full h-auto rounded-2xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-100">บันทึกสำเร็จ!</h2>
            <p className="text-xs sm:text-sm text-slate-300">ระบบบันทึกข้อมูลการสั่งจองเสื้อรอบที่ 2 ของคุณเรียบร้อยแล้ว</p>
            
            <div className="bg-slate-900/80 rounded-2xl p-4 text-left text-xs sm:text-sm space-y-1.5 text-slate-300 border border-slate-700/60">
              <p><strong>ผู้สั่ง:</strong> {firstName} {lastName}</p>
              <p><strong>ไซส์:</strong> {size === 'พิเศษ' ? `พิเศษ (รอบอก ${customChest}")` : size} ({cut})</p>
              <p><strong>จำนวน:</strong> {qty} ตัว</p>
              <p><strong>ยอดรวม:</strong> <span className="text-amber-400 font-bold">{calculateTotal()} บาท</span></p>
            </div>

            <button
              onClick={resetForm}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-bold text-sm transition"
            >
              ตกลง / สั่งรายการใหม่
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
