"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSettings } from "@/lib/actions/settings";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function PrintInvoicePage() {
  const params = useParams();
  const id = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoiceData() {
      const supabase = createClient();
      
      try {
        const [orderRes, appSettings] = await Promise.all([
          supabase
            .from("orders")
            .select(`
              *,
              customer:customers(name, phone, address),
              product:products(bag_size)
            `)
            .eq("id", id)
            .single(),
          getSettings()
        ]);
        
        if (orderRes.data) setOrder(orderRes.data);
        if (appSettings) setSettings(appSettings);
        
      } catch (err) {
        console.error("Failed to load invoice data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      loadInvoiceData();
    }
  }, [id]);

  useEffect(() => {
    if (!loading && order) {
      // Small timeout to allow images/fonts to render
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, order]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-red-500">Order not found</div>;
  }

  const symbol = settings.currency_symbol || "৳";
  const appName = settings.app_name || "Enterprise Invoice";

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto font-sans print:p-0 print:max-w-full">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-wider">{appName}</h1>
          <p className="text-gray-600 mt-2 text-sm max-w-[250px]">{settings.company_address || "Address not configured"}</p>
          <p className="text-gray-600 text-sm">Phone: {settings.company_phone || "Not configured"}</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-light text-gray-400 uppercase tracking-widest mb-2">Invoice</h2>
          <div className="flex justify-end gap-4 text-sm mt-4">
            <div className="text-gray-500 font-semibold">Date:</div>
            <div className="w-24 font-medium">{format(new Date(), "dd MMM yyyy")}</div>
          </div>
          <div className="flex justify-end gap-4 text-sm mt-1">
            <div className="text-gray-500 font-semibold">Invoice #:</div>
            <div className="w-24 font-mono font-medium">{order.id.split("-")[0]}</div>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="flex justify-between mb-12">
        <div className="w-1/2 pr-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
          <p className="font-bold text-lg mb-1">{order.customer?.name || "Cash Customer"}</p>
          <p className="text-gray-600 text-sm mb-1">{order.customer?.phone}</p>
          <p className="text-gray-600 text-sm">{order.location || order.customer?.address}</p>
        </div>
        <div className="w-1/3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Details</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500">Order Date:</span>
            <span className="font-medium">{format(new Date(order.order_date), "dd MMM yyyy")}</span>
            <span className="text-gray-500">Delivery By:</span>
            <span className="font-medium">{format(new Date(order.delivery_date), "dd MMM yyyy")}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left mb-12 border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-3 px-2 text-sm font-bold uppercase tracking-wider text-gray-500">Description</th>
            <th className="py-3 px-2 text-sm font-bold uppercase tracking-wider text-gray-500 text-right">Qty</th>
            <th className="py-3 px-2 text-sm font-bold uppercase tracking-wider text-gray-500 text-right">Rate</th>
            <th className="py-3 px-2 text-sm font-bold uppercase tracking-wider text-gray-500 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-4 px-2">
              <div className="font-bold mb-1">
                {order.product?.bag_size || order.notes?.match(/Size: (.*)/)?.[1] || "Custom Bag"} 
                <span className="text-gray-500 font-normal ml-2">({order.gsm} GSM)</span>
              </div>
              <div className="text-sm text-gray-600 flex gap-4 mt-1">
                <span>Color: {order.body_color || '-'}</span>
                <span>Type: {order.cutting_type === 'handle' ? 'Handle' : 'D-Cut'}</span>
                <span>Print: {order.print_color_config?.color || '-'}</span>
              </div>
            </td>
            <td className="py-4 px-2 text-right font-medium">{order.qty?.toLocaleString('en-IN') || 0}</td>
            <td className="py-4 px-2 text-right font-medium">{symbol}{order.rate_per_piece?.toFixed(2) || 0}</td>
            <td className="py-4 px-2 text-right font-bold">{symbol}{order.total_amount?.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-16">
        <div className="w-1/3">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-500 font-medium">Subtotal</span>
            <span className="font-medium">{symbol}{order.total_amount?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-500 font-medium">Paid/Advance</span>
            <span className="font-medium">{symbol}{(order.paid_amount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between py-4 border-b-2 border-black">
            <span className="font-bold text-lg">Total Due</span>
            <span className="font-bold text-xl">{symbol}{(order.total_amount - (order.paid_amount || 0)).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Notes / Footer */}
      {(order.notes || settings.invoice_terms) && (
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Notes & Terms</h3>
          {order.notes && <p className="text-sm text-gray-600 mb-2"><span className="font-semibold text-black">Order Note:</span> {order.notes}</p>}
          {settings.invoice_terms && <p className="text-sm text-gray-600 mt-4 whitespace-pre-wrap">{settings.invoice_terms}</p>}
        </div>
      )}
    </div>
  );
}
