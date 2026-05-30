"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface PrintInvoiceButtonProps {
  order: any;
  settings: any;
  translations: {
    print: string;
  };
}

export function PrintInvoiceButton({ order, settings, translations }: PrintInvoiceButtonProps) {
  const symbol = settings.currency_symbol || "৳";
  const appName = settings.app_name || "Enterprize Invoice";

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Button 
        onClick={handlePrint}
        variant="outline" 
        className="w-full sm:w-auto border-slate-200 dark:border-emerald-700 text-slate-600 dark:text-emerald-300 hover:bg-slate-50 dark:hover:bg-emerald-900/50 h-11 sm:h-10"
      >
        <Printer className="h-4 w-4 mr-2" />
        {translations.print}
      </Button>

      {/* Hidden print stylesheet to only show invoice on print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print-container, #invoice-print-container * {
            visibility: visible;
          }
          #invoice-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />

      {/* Invoice Container - Hidden on screen, shown in print via CSS */}
      <div id="invoice-print-container" className="hidden print:block bg-white text-black p-8 font-sans w-full max-w-full m-0">
        <div className="flex justify-between items-center border-b-2 border-black pb-6 mb-8">
          <div className="flex items-center gap-6">
            <img src="/icon.svg" alt="Logo" className="w-20 h-20 object-contain shrink-0" />
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-wider">{appName}</h1>
              <p className="text-gray-600 mt-1 text-sm max-w-[300px] leading-relaxed">{settings.company_address || "Address not configured"}</p>
              <p className="text-gray-600 text-sm font-medium mt-1">Phone: {settings.company_phone || "Not configured"}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-light text-gray-400 uppercase tracking-widest mb-2">Invoice</h2>
            <div className="flex justify-end gap-4 text-sm mt-4">
              <div className="text-gray-500 font-semibold">Date:</div>
              <div className="w-24 font-medium">{format(new Date(), "dd MMM yyyy")}</div>
            </div>
            <div className="flex justify-end gap-4 text-sm mt-1">
              <div className="text-gray-500 font-semibold">Invoice #:</div>
              <div className="w-24 font-mono font-medium">{order.id.split("-")[0].toUpperCase()}</div>
            </div>
          </div>
        </div>

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
                  <span>Print: {order.print_color_config?.color || order.print_color_config?.name || '-'}</span>
                </div>
              </td>
              <td className="py-4 px-2 text-right font-medium">{order.qty?.toLocaleString('en-IN') || 0}</td>
              <td className="py-4 px-2 text-right font-medium">{symbol}{Number(order.rate_per_piece).toFixed(2) || 0}</td>
              <td className="py-4 px-2 text-right font-bold">{symbol}{Number(order.total_amount).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end mb-16">
          <div className="w-1/3">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="font-medium">{symbol}{Number(order.total_amount).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-500 font-medium">Paid/Advance</span>
              <span className="font-medium">{symbol}{Number(order.paid_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-4 border-b-2 border-black">
              <span className="font-bold text-lg">Total Due</span>
              <span className="font-bold text-xl">{symbol}{(Number(order.total_amount) - Number(order.paid_amount || 0)).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {(order.notes || settings.invoice_terms) && (
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Notes & Terms</h3>
            {order.notes && <p className="text-sm text-gray-600 mb-2"><span className="font-semibold text-black">Order Note:</span> {order.notes}</p>}
            {settings.invoice_terms && <p className="text-sm text-gray-600 mt-4 whitespace-pre-wrap">{settings.invoice_terms}</p>}
          </div>
        )}
      </div>
    </>
  );
}
