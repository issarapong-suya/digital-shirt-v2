import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Option to bypass SlipOK check during testing (Set to false for production real slip checking)
const BYPASS_SLIP_CHECK = false;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const cid = (formData.get('cid') as string || '').trim();
    const firstName = (formData.get('firstName') as string || '').trim();
    const lastName = (formData.get('lastName') as string || '').trim();
    const agency = (formData.get('agency') as string || '').trim();
    const cut = (formData.get('cut') as string || 'ชาย').trim();
    const size = (formData.get('size') as string || '').trim();
    const customChestStr = formData.get('customChest') as string;
    const customChest = customChestStr ? parseFloat(customChestStr) : null;
    const qty = parseInt(formData.get('qty') as string || '1');
    const slipFile = formData.get('slip') as File | null;

    if (!cid || cid.length !== 13) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกเลขบัตรประชาชน 13 หลักให้ถูกต้อง' }, { status: 400 });
    }
    if (!firstName || !lastName || !agency || !size) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    // Calculate Expected Total Price
    let basePrice = 350;
    if (['2XL', '3XL', '4XL'].includes(size)) {
      basePrice = 360;
    } else if (size === '5XL' || size === 'พิเศษ') {
      basePrice = 370;
    }
    const totalPrice = basePrice * qty;

    let slipUrl = '';
    let paymentStatus = 'ชำระเงินเรียบร้อย';

    // Handle File Upload to Supabase Storage if file is present
    if (slipFile && slipFile.size > 0) {
      const fileExt = slipFile.name.split('.').pop() || 'jpg';
      const fileName = `slip_${cid}_${Date.now()}.${fileExt}`;
      const bytes = await slipFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('slips')
        .upload(fileName, buffer, {
          contentType: slipFile.type || 'image/jpeg',
          upsert: true
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase
          .storage
          .from('slips')
          .getPublicUrl(fileName);

        slipUrl = publicUrlData.publicUrl;
      } else if (uploadError) {
        console.warn('Storage upload error (continuing without slip storage):', uploadError.message);
      }
    }

    // Optional SlipOK Payment Verification
    if (!BYPASS_SLIP_CHECK && slipFile) {
      const slipOkApiKey = process.env.SLIPOK_API_KEY || '71396';
      const slipOkBranchId = process.env.SLIPOK_BRANCH_ID || 'SLIPOK488ZMLE';

      const slipFormData = new FormData();
      slipFormData.append('files', slipFile);
      slipFormData.append('log', 'true');

      const slipRes = await fetch(`https://api.slipok.com/api/line/apikey/${slipOkApiKey}`, {
        method: 'POST',
        headers: {
          'x-authorization': slipOkBranchId
        },
        body: slipFormData
      });

      const slipResult = await slipRes.json();
      if (!slipResult.success) {
        return NextResponse.json({
          success: false,
          message: 'ไม่สามารถตรวจสอบสลิปได้: ' + (slipResult.data?.message || 'QR Code ไม่ถูกต้อง')
        }, { status: 400 });
      }
    }

    // Check if CID already exists in Round 2
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('cid', cid)
      .eq('round_no', 2)
      .maybeSingle();

    let dbError = null;

    if (existingOrder) {
      // Update existing record
      const { error } = await supabase
        .from('orders')
        .update({
          first_name: firstName,
          last_name: lastName,
          agency: agency,
          cut: cut,
          size: size,
          custom_chest: customChest,
          qty: qty,
          total_price: totalPrice,
          slip_url: slipUrl || undefined,
          payment_status: paymentStatus
        })
        .eq('id', existingOrder.id);
      dbError = error;
    } else {
      // Insert new record
      const { error } = await supabase
        .from('orders')
        .insert({
          cid: cid,
          first_name: firstName,
          last_name: lastName,
          agency: agency,
          cut: cut,
          size: size,
          custom_chest: customChest,
          qty: qty,
          total_price: totalPrice,
          slip_url: slipUrl,
          payment_status: paymentStatus,
          round_no: 2
        });
      dbError = error;
    }

    if (dbError) {
      console.error('Supabase Database write error:', dbError);
      return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกลงฐานข้อมูล: ' + dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: existingOrder ? 'อัปเดตข้อมูลการสั่งจองรอบที่ 2 เรียบร้อยแล้ว' : 'บันทึกการสั่งจองรอบที่ 2 เรียบร้อยแล้ว'
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('API Orders POST error:', err);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาด: ' + message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('round_no', 2)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const formatted = (data || []).map(item => ({
      timestamp: new Date(item.created_at).toLocaleString('th-TH'),
      cid: item.cid,
      firstName: item.first_name,
      lastName: item.last_name,
      agency: item.agency,
      cut: item.cut,
      size: item.size === 'พิเศษ' && item.custom_chest ? `พิเศษ (รอบอก ${item.custom_chest}")` : item.size,
      qty: item.qty,
      totalPrice: item.total_price,
      slipUrl: item.slip_url,
      paymentStatus: item.payment_status
    }));

    return NextResponse.json(formatted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
