"use client";

import { useState } from "react";
import { Product, Profile } from "@/types";
import { AddStockDialog } from "./AddStockDialog";
import { RestockDialog } from "./RestockDialog";
import { deleteProduct } from "@/lib/actions/stock";
import { Search, Plus, PackagePlus, Trash2, AlertTriangle, Package, Loader2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function StockClient({ products, profile }: { products: Product[], profile: Profile | null }) {
  const t = useTranslations('stock');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const totalValue = products.reduce((acc, p) => acc + (p.qty * p.cost_per_piece), 0);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) {
      params.set('search', e.target.value);
    } else {
      params.delete('search');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setIsDeleting(id);
    setDeleteError(null);
    try {
      await deleteProduct(id);
    } catch (err: any) {
      setDeleteError(err.message);
      alert(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-800 dark:text-emerald-100">{t('title')}</h2>
          <p className="text-sm text-slate-500 dark:text-emerald-500/70">{t('subtitle')}</p>
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={t('searchPlaceholder')}
              defaultValue={searchParams.get('search') || ''}
              onChange={(e) => {
                handleSearch(e);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-900/50 bg-white dark:bg-[#0a0f0a] text-sm text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
            />
          </div>
          
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] whitespace-nowrap"
          >
            <Plus size={18} /> <span className="hidden sm:inline">{t('newStock')}</span>
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white shadow-[0_0_30px_rgba(16,185,129,0.2)] relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-emerald-100/80 font-medium text-sm mb-1 uppercase tracking-wider">{t('totalValue')}</p>
          <h1 className="text-4xl font-bold font-sans">৳ {totalValue.toLocaleString('en-IN')}</h1>
        </div>
        <Package className="absolute -right-6 -bottom-6 w-40 h-40 text-emerald-500/30 opacity-50 rotate-12" />
      </div>

      {/* Table (Desktop) */}
      <div className="hidden md:block bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0d1a0e] border-b border-emerald-100 dark:border-emerald-900/50">
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-emerald-300">{t('columns.size')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-emerald-300">{t('columns.color')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-emerald-300">{t('columns.gsm')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-emerald-300 text-right">{t('columns.cost')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-emerald-300 text-right">{t('columns.qty')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-emerald-300 text-right">{t('columns.total')}</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-emerald-300 text-center">{t('columns.action')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isLowStock = product.qty < 10;
                const value = product.qty * product.cost_per_piece;
                
                return (
                  <tr key={product.id} className={cn(
                    "border-b border-emerald-50 dark:border-emerald-900/20 hover:bg-slate-50 dark:hover:bg-[#0d1a0e] transition-colors",
                    isLowStock && "bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20"
                  )}>
                    <td className="p-4 font-medium text-slate-800 dark:text-emerald-100 flex items-center gap-2">
                      {isLowStock && <AlertTriangle size={16} className="text-red-500" />}
                      {product.bag_size}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-emerald-400">{product.bag_color}</td>
                    <td className="p-4 text-slate-600 dark:text-emerald-400">{product.gsm}</td>
                    <td className="p-4 text-slate-600 dark:text-emerald-400 text-right">৳{product.cost_per_piece}</td>
                    <td className={cn(
                      "p-4 text-right font-bold",
                      isLowStock ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {product.qty}
                    </td>
                    <td className="p-4 text-slate-800 dark:text-emerald-300 text-right font-bold">
                      ৳{value.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setRestockProduct(product)}
                          className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
                          title="Restock"
                        >
                          <PackagePlus size={16} />
                        </button>
                        {profile?.role === 'admin' && (
                          <button 
                            onClick={() => handleDelete(product.id)}
                            disabled={isDeleting === product.id}
                            className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {isDeleting === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-emerald-500/70">
                    {t('noStock')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards (Mobile) */}
      <div className="md:hidden space-y-4">
        {products.map((product) => {
          const isLowStock = product.qty < 10;
          const value = product.qty * product.cost_per_piece;
          
          return (
            <div key={product.id} className={cn(
              "bg-white dark:bg-[#0a0f0a] border rounded-2xl p-4 shadow-sm relative overflow-hidden",
              isLowStock ? "border-red-200 dark:border-red-900/50" : "border-emerald-100 dark:border-emerald-900/50"
            )}>
              {isLowStock && (
                <div className="absolute top-0 right-0 w-2 h-full bg-red-500" />
              )}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-emerald-100 flex items-center gap-2">
                    {product.bag_size} <span className="text-sm font-normal text-slate-500 dark:text-emerald-500/70">({product.bag_color})</span>
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-emerald-500/70 mt-1">GSM: {product.gsm} | ৳{product.cost_per_piece}/পিস</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-emerald-500/70">{t('columns.qty')}</p>
                  <p className={cn(
                    "text-xl font-bold font-sans",
                    isLowStock ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {product.qty}
                  </p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-slate-100 dark:border-emerald-900/30 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500 dark:text-emerald-500/70">{t('columns.total')}</p>
                  <p className="font-bold text-slate-800 dark:text-emerald-300">৳{value.toLocaleString('en-IN')}</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setRestockProduct(product)}
                    className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <PackagePlus size={14} /> {t('restock')}
                  </button>
                  {profile?.role === 'admin' && (
                    <button 
                      onClick={() => handleDelete(product.id)}
                      disabled={isDeleting === product.id}
                      className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                    >
                      {isDeleting === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="bg-white dark:bg-[#0a0f0a] border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-8 text-center text-slate-500 dark:text-emerald-500/70">
            {t('noStock')}
          </div>
        )}
      </div>

      <AddStockDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <RestockDialog isOpen={!!restockProduct} onClose={() => setRestockProduct(null)} product={restockProduct} />
      
    </div>
  );
}
