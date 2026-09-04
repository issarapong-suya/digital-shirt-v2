import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cid = searchParams.get('cid');

  if (!cid || cid.length !== 13) {
    return NextResponse.json({ found: false, message: 'Invalid CID' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('cid', cid)
      .eq('round_no', 2)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ found: false, error: error.message }, { status: 500 });
    }

    if (data) {
      return NextResponse.json({
        found: true,
        order: {
          cid: data.cid,
          firstName: data.first_name,
          lastName: data.last_name,
          agency: data.agency,
          cut: data.cut,
          size: data.size,
          customChest: data.custom_chest,
          qty: data.qty,
          totalPrice: data.total_price,
          paymentStatus: data.payment_status
        }
      });
    }

    return NextResponse.json({ found: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ found: false, error: message }, { status: 500 });
  }
}
