"use client";

import { useState } from "react";
import { Product, Profile } from "@/types";
import { AddStockDialog } from "./AddStockDialog";
import { RestockDialog } from "./RestockDialog";
import { deleteProduct } from "@/lib/actions/stock";
import { Search, Plus, PackagePlus, Trash2, AlertTriangle, Package, Loader2, Tag } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getColorHex } from "@/lib/utils/colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CATEGORY_LABELS: Record<string, string> = {
  raw_material: "Raw Material",
  ink: "Ink",
  plate: "Plate",
  packaging: "Packaging",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  raw_material: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  ink: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  plate: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  packaging: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  other: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

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
  const filteredProducts = products;

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
          <h2 className="text-2xl font-heading font-bold text-foreground">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              type="text"
              placeholder={t('searchPlaceholder')}
              defaultValue={searchParams.get('search') || ''}
              onChange={(e) => {
                handleSearch(e);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background"
            />
          </div>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap"
          >
            <Plus size={18} /> <span className="hidden sm:inline">{t('newStock')}</span>
          </Button>
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
      <div className="hidden md:block rounded-2xl overflow-hidden border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">{t('columns.size')}</TableHead>
              <TableHead className="font-semibold">Cut</TableHead>
              <TableHead className="font-semibold">{t('columns.color')}</TableHead>
              <TableHead className="font-semibold">{t('columns.gsm')}</TableHead>
              <TableHead className="font-semibold text-right">{t('columns.cost')}</TableHead>
              <TableHead className="font-semibold text-right">{t('columns.qty')}</TableHead>
              <TableHead className="font-semibold text-right">{t('columns.total')}</TableHead>
              <TableHead className="font-semibold text-center">{t('columns.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const isLowStock = product.qty < 10;
              const value = product.qty * product.cost_per_piece;
              const cat = product.category || 'raw_material';
              
              return (
                <TableRow key={product.id} className={cn(
                  "border-b transition-colors",
                  isLowStock && "bg-destructive/5 hover:bg-destructive/10"
                )}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {isLowStock && <AlertTriangle size={16} className="text-destructive" />}
                    {product.bag_size}
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">{product.cutting_type || 'handle'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <div className="w-3.5 h-3.5 rounded-full shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: getColorHex(product.bag_color, []) }} />
                      <span className="text-[13px] text-slate-700 dark:text-slate-300">{product.bag_color}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.gsm}</TableCell>
                  <TableCell className="text-muted-foreground text-right">৳{product.cost_per_piece}</TableCell>
                  <TableCell className={cn(
                    "text-right font-bold",
                    isLowStock ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {product.qty}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ৳{value.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => setRestockProduct(product)}
                        title="Restock"
                      >
                        <PackagePlus size={16} />
                      </Button>
                      {profile?.role === 'admin' && (
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          disabled={isDeleting === product.id}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Delete"
                        >
                          {isDeleting === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {t('noStock')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cards (Mobile) */}
      <div className="md:hidden space-y-4">
        {filteredProducts.map((product) => {
          const isLowStock = product.qty < 10;
          const value = product.qty * product.cost_per_piece;
          const cat = product.category || 'raw_material';
          
          return (
            <Card key={product.id} className={cn(
              "relative overflow-hidden",
              isLowStock && "border-destructive/50"
            )}>
              {isLowStock && (
                <div className="absolute top-0 right-0 w-2 h-full bg-destructive" />
              )}
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {product.bag_size} 
                      <span className="text-sm font-normal text-muted-foreground flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: getColorHex(product.bag_color, []) }} />
                        {product.bag_color}
                      </span>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">Cut: {product.cutting_type || 'handle'}</p>
                    <p className="text-sm text-muted-foreground mt-1">GSM: {product.gsm} | ৳{product.cost_per_piece}/পিস</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t('columns.qty')}</p>
                    <p className={cn(
                      "text-xl font-bold font-sans",
                      isLowStock ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {product.qty}
                    </p>
                  </div>
                </div>
                
                <div className="pt-3 border-t flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('columns.total')}</p>
                    <p className="font-bold">৳{value.toLocaleString('en-IN')}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={() => setRestockProduct(product)}
                      className="text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                    >
                      <PackagePlus size={14} className="mr-1" /> {t('restock')}
                    </Button>
                    {profile?.role === 'admin' && (
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        disabled={isDeleting === product.id}
                      >
                        {isDeleting === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {products.length === 0 && (
          <div className="bg-card border rounded-2xl p-8 text-center text-muted-foreground">
            {t('noStock')}
          </div>
        )}
      </div>

      <AddStockDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <RestockDialog isOpen={!!restockProduct} onClose={() => setRestockProduct(null)} product={restockProduct} />
      
    </div>
  );
}
