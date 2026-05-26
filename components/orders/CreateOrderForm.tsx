"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/routing";
import { createOrder } from "@/lib/actions/orders";
import { Customer, Product, PrintColorConfig } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";

export function CreateOrderForm({ 
  preselectedCustomerId 
}: { 
  preselectedCustomerId?: string 
}) {
  const t = useTranslations("orders");
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [printConfigs, setPrintConfigs] = useState<PrintColorConfig[]>([]);

  const [isNewCustomer, setIsNewCustomer] = useState(!preselectedCustomerId);
  
  // Form State
  const [formData, setFormData] = useState({
    customer_id: preselectedCustomerId || "",
    new_customer: { name: "", phone: "", address: "" },
    order_date: new Date().toISOString().split("T")[0],
    delivery_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // +10 days
    location: "",
    cutting_type: "handle" as "handle" | "d-cut",
    gsm: 80,
    body_color: "",
    handle_color: "",
    print_color_type: "single" as "single" | "double",
    print_color_config: null as any,
    from_stock: false,
    product_id: "",
    manual_bag_size: "",
    qty: 0,
    rate_per_piece: 0,
    notes: ""
  });

  useEffect(() => {
    async function fetchData() {
      const [custRes, prodRes, printRes] = await Promise.all([
        supabase.from("customers").select("*").order("name"),
        supabase.from("products").select("*").gt("qty", 0).order("bag_size"),
        supabase.from("print_color_configs").select("*").eq("is_active", true)
      ]);
      if (custRes.data) setCustomers(custRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      if (printRes.data) setPrintConfigs(printRes.data);
    }
    fetchData();
  }, [supabase]);

  // When existing customer selected, try auto-populating location
  useEffect(() => {
    if (!isNewCustomer && formData.customer_id) {
      const cust = customers.find(c => c.id === formData.customer_id);
      if (cust && !formData.location) {
        setFormData(prev => ({ ...prev, location: cust.address || "" }));
      }
    }
  }, [formData.customer_id, customers, isNewCustomer, formData.location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        ...formData,
        product_id: formData.from_stock ? formData.product_id : null,
        qty: Number(formData.qty),
        rate_per_piece: Number(formData.rate_per_piece)
      };

      if (isNewCustomer) {
        payload.customer_id = null;
      } else {
        payload.new_customer = null;
      }

      const order = await createOrder(payload);
      toast.success(t("form.creating").replace("...", " Success!"));
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = (Number(formData.qty) || 0) * (Number(formData.rate_per_piece) || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto pb-20">
      
      {/* Customer Section */}
      <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/30 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-emerald-400 font-bold">{t("form.customerSection")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!preselectedCustomerId && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_new_customer" 
                checked={isNewCustomer} 
                onCheckedChange={(c: boolean) => setIsNewCustomer(!!c)} 
              />
              <Label htmlFor="is_new_customer" className="text-emerald-100">{t("form.newCustomer")}</Label>
            </div>
          )}

          {!isNewCustomer ? (
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.selectCustomer")}</Label>
              <Select 
                value={formData.customer_id} 
                onValueChange={(v: string) => setFormData({ ...formData, customer_id: v })}
                required={!isNewCustomer}
              >
                <SelectTrigger className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100">
                  <SelectValue placeholder={t("form.selectCustomer")} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-emerald-950 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100">
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-emerald-300 font-medium">Name</Label>
                <Input 
                  required={isNewCustomer}
                  className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100"
                  value={formData.new_customer.name}
                  onChange={(e: any) => setFormData({ ...formData, new_customer: { ...formData.new_customer, name: e.target.value }})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-emerald-300 font-medium">Phone</Label>
                <Input 
                  required={isNewCustomer}
                  className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100"
                  value={formData.new_customer.phone}
                  onChange={(e: any) => setFormData({ ...formData, new_customer: { ...formData.new_customer, phone: e.target.value }})}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-700 dark:text-emerald-300 font-medium">Address</Label>
                <Input 
                  className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100"
                  value={formData.new_customer.address}
                  onChange={(e: any) => {
                    setFormData({ 
                      ...formData, 
                      new_customer: { ...formData.new_customer, address: e.target.value },
                      location: e.target.value // auto update delivery location
                    })
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Section */}
      <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/30 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-emerald-400 font-bold">{t("form.orderDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.orderDate")}</Label>
            <Input 
              type="date"
              required
              className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100"
              value={formData.order_date}
              onChange={(e: any) => setFormData({ ...formData, order_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.deliveryDate")}</Label>
            <Input 
              type="date"
              required
              min={formData.order_date}
              className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100"
              value={formData.delivery_date}
              onChange={(e: any) => setFormData({ ...formData, delivery_date: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.location")}</Label>
            <Input 
              className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100"
              value={formData.location}
              onChange={(e: any) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bag Specification Section */}
      <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/30 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-emerald-400 font-bold">{t("form.bagSpec")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.cuttingType")}</Label>
            <Select 
              value={formData.cutting_type} 
              onValueChange={(v: "handle" | "d-cut") => setFormData({ ...formData, cutting_type: v })}
            >
              <SelectTrigger className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-emerald-950 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100">
                <SelectItem value="handle">Handle Cut</SelectItem>
                <SelectItem value="d-cut">D-Cut</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.gsm")}</Label>
            <Input 
              type="number"
              required
              className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100"
              value={formData.gsm || ''}
              onChange={(e: any) => setFormData({ ...formData, gsm: Number(e.target.value) })}
            />
            <div className="flex gap-2 mt-1">
              {[70, 80, 90, 100].map(val => (
                <button 
                  type="button" 
                  key={val}
                  onClick={() => setFormData({ ...formData, gsm: val })}
                  className={`text-xs px-2 py-1 rounded border ${formData.gsm === val ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-emerald-800 text-slate-700 dark:text-emerald-300 font-medium hover:bg-emerald-900/50'}`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.bodyColor")}</Label>
            <Input 
              required
              className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100"
              value={formData.body_color}
              onChange={(e: any) => setFormData({ ...formData, body_color: e.target.value })}
            />
          </div>

          {formData.cutting_type === 'handle' && (
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.handleColor")}</Label>
              <Input 
                required
                className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100"
                value={formData.handle_color}
                onChange={(e: any) => setFormData({ ...formData, handle_color: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.printColorType")}</Label>
            <Select 
              value={formData.print_color_type} 
              onValueChange={(v: "single" | "double") => setFormData({ ...formData, print_color_type: v })}
            >
              <SelectTrigger className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-emerald-950 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100">
                <SelectItem value="single">{t("form.singleColor")}</SelectItem>
                <SelectItem value="double">{t("form.doubleColor")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.print_color_type === 'double' && (
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.printColorConfig")}</Label>
              <Select 
                value={formData.print_color_config?.id || ""} 
                onValueChange={(v: string) => {
                  const config = printConfigs.find(c => c.id === v);
                  setFormData({ ...formData, print_color_config: config || null })
                }}
              >
                <SelectTrigger className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100">
                  <SelectValue placeholder="Select Config" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-emerald-950 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100">
                  {printConfigs.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.colors.join(' & ')})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2 md:col-span-2 pt-4 border-t border-emerald-900/30">
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox 
                id="from_stock" 
                checked={formData.from_stock} 
                onCheckedChange={(c: boolean) => setFormData({...formData, from_stock: !!c})} 
              />
              <Label htmlFor="from_stock" className="text-emerald-100">{t("form.fromStock")}</Label>
            </div>

            {formData.from_stock ? (
              <Select 
                value={formData.product_id} 
                onValueChange={(v: string) => setFormData({ ...formData, product_id: v })}
                required={formData.from_stock}
              >
                <SelectTrigger className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100">
                  <SelectValue placeholder="Select Stock Product" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-emerald-950 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100">
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.bag_size} - {p.bag_color} ({p.gsm} GSM) - {p.qty} available
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input 
                placeholder="Manual Bag Size (e.g. 13x15)"
                required={!formData.from_stock}
                className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100"
                value={formData.manual_bag_size}
                onChange={(e: any) => setFormData({ ...formData, manual_bag_size: e.target.value })}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Section */}
      <Card className="bg-white dark:bg-[#0a0f0a] border-slate-200 dark:border-emerald-900/30 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-emerald-400 font-bold">{t("form.pricing")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.qty")}</Label>
            <Input 
              type="number"
              min="1"
              required
              className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100 text-lg font-bold"
              value={formData.qty || ''}
              onChange={(e: any) => setFormData({ ...formData, qty: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.ratePerPiece")}</Label>
            <Input 
              type="number"
              step="0.01"
              min="0"
              required
              className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100 text-lg font-bold"
              value={formData.rate_per_piece || ''}
              onChange={(e: any) => setFormData({ ...formData, rate_per_piece: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.total")}</Label>
            <div className="h-10 flex items-center px-3 bg-emerald-900/20 border border-emerald-800 rounded-md text-emerald-100 text-xl font-bold font-mono">
              ৳{totalAmount.toFixed(2)}
            </div>
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label className="text-slate-700 dark:text-emerald-300 font-medium">{t("form.notes")}</Label>
            <Textarea 
              className="bg-slate-50 dark:bg-emerald-950/50 border-slate-200 dark:border-emerald-800 text-slate-800 dark:text-emerald-100"
              value={formData.notes}
              onChange={(e: any) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Button 
        type="submit" 
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)]"
      >
        {loading ? t("form.creating") : t("form.submit")}
      </Button>

    </form>
  );
}
