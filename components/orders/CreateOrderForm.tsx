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
import { Loader2 } from "lucide-react";

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

  const SINGLE_COLORS = ["লাল", "সবুজ", "নীল", "সাদা", "হলুদ", "কালো", "কমলা", "খয়েরি", "গোলাপি", "ছাই", "বেগুনী"];
  const MULTI_COLORS = ["লাল-নীল", "লাল-সবুজ", "নীল-সাদা", "কালো-লাল", "সবুজ-হলুদ"];

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
      const [custRes, prodRes] = await Promise.all([
        supabase.from("customers").select("*").order("name"),
        supabase.from("products").select("*").gt("qty", 0).order("bag_size")
      ]);
      if (custRes.data) setCustomers(custRes.data);
      if (prodRes.data) setProducts(prodRes.data);
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
      <Card>
        <CardHeader>
          <CardTitle>{t("form.customerSection")}</CardTitle>
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
            <div className="space-y-3">
              <Label>{t("form.selectCustomer")}</Label>
              <Select 
                value={formData.customer_id} 
                onValueChange={(v: any) => {
                  const cust = customers.find(c => c.id === v);
                  setFormData({ ...formData, customer_id: v, location: cust?.address || formData.location });
                }}
                required={!isNewCustomer}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t("form.selectCustomer")}>
                    {formData.customer_id && customers.find(c => c.id === formData.customer_id) 
                      ? `${customers.find(c => c.id === formData.customer_id)?.name} (${customers.find(c => c.id === formData.customer_id)?.phone})` 
                      : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Name</Label>
                <Input 
                  required={isNewCustomer}
                  value={formData.new_customer.name}
                  onChange={(e: any) => setFormData({ ...formData, new_customer: { ...formData.new_customer, name: e.target.value }})}
                  className="h-11"
                />
              </div>
              <div className="space-y-3">
                <Label>Phone</Label>
                <Input 
                  required={isNewCustomer}
                  value={formData.new_customer.phone}
                  onChange={(e: any) => setFormData({ ...formData, new_customer: { ...formData.new_customer, phone: e.target.value }})}
                  className="h-11"
                />
              </div>
              <div className="space-y-3 md:col-span-2">
                <Label>Address</Label>
                <Input 
                  value={formData.new_customer.address}
                  className="h-11"
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
      <Card>
        <CardHeader>
          <CardTitle>{t("form.orderDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <Label>{t("form.orderDate")}</Label>
            <Input 
              type="date"
              required
              value={formData.order_date}
              onChange={(e: any) => setFormData({ ...formData, order_date: e.target.value })}
              className="h-11"
            />
          </div>
          <div className="space-y-3">
            <Label>{t("form.deliveryDate")}</Label>
            <Input 
              type="date"
              required
              min={formData.order_date}
              value={formData.delivery_date}
              onChange={(e: any) => setFormData({ ...formData, delivery_date: e.target.value })}
              className="h-11"
            />
          </div>
          <div className="space-y-3 md:col-span-2">
            <Label>{t("form.location")}</Label>
            <Input 
              value={formData.location}
              onChange={(e: any) => setFormData({ ...formData, location: e.target.value })}
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bag Specification Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("form.bagSpec")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3 md:col-span-2 pb-4 border-b">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox 
                id="from_stock" 
                checked={formData.from_stock} 
                onCheckedChange={(c: boolean) => setFormData({...formData, from_stock: !!c})} 
              />
              <Label htmlFor="from_stock" className="font-semibold text-emerald-600 dark:text-emerald-400">
                {t("form.fromStock")}
              </Label>
            </div>

            {formData.from_stock ? (
              <Select 
                value={formData.product_id} 
                onValueChange={(v: any) => {
                  const prod = products.find(p => p.id === v);
                  if (prod) {
                    setFormData(prev => ({ 
                      ...prev, 
                      product_id: v,
                      manual_bag_size: prod.bag_size,
                      body_color: prod.bag_color,
                      gsm: prod.gsm
                    }));
                  } else {
                    setFormData(prev => ({ ...prev, product_id: v }));
                  }
                }}
                required={formData.from_stock}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select Stock Product">
                    {formData.product_id && products.find(p => p.id === formData.product_id)
                      ? (() => {
                          const p = products.find(prod => prod.id === formData.product_id);
                          return `${p?.bag_size} - ${p?.bag_color} (${p?.gsm} GSM) - ${p?.qty} available`;
                        })()
                      : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.bag_size} - {p.bag_color} ({p.gsm} GSM) - {p.qty} available
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-3">
                <Label>Manual Bag Size (e.g. 13x15)</Label>
                <Input 
                  placeholder="e.g. 13x15"
                  required={!formData.from_stock}
                  value={formData.manual_bag_size}
                  onChange={(e: any) => setFormData({ ...formData, manual_bag_size: e.target.value })}
                  className="h-11"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>{t("form.cuttingType")}</Label>
            <Select 
              value={formData.cutting_type} 
              onValueChange={(v: any) => setFormData({ ...formData, cutting_type: v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="handle">Handle Cut</SelectItem>
                <SelectItem value="d-cut">D-Cut</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label>{t("form.gsm")}</Label>
            <Input 
              type="number"
              required
              value={formData.gsm || ''}
              onChange={(e: any) => setFormData({ ...formData, gsm: Number(e.target.value) })}
              className="h-11"
            />
            <div className="flex gap-2 mt-1">
              {[70, 80, 90, 100].map(val => (
                <button 
                  type="button" 
                  key={val}
                  onClick={() => setFormData({ ...formData, gsm: val })}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${formData.gsm === val ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("form.bodyColor")}</Label>
            <Input 
              required
              list="body_colors"
              value={formData.body_color}
              onChange={(e: any) => setFormData({ ...formData, body_color: e.target.value })}
              className="h-11"
            />
            <datalist id="body_colors">
              {SINGLE_COLORS.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {formData.cutting_type === 'handle' && (
            <div className="space-y-3">
              <Label>{t("form.handleColor")}</Label>
              <Input 
                required
                list="handle_colors"
                value={formData.handle_color}
                onChange={(e: any) => setFormData({ ...formData, handle_color: e.target.value })}
                className="h-11"
              />
              <datalist id="handle_colors">
                {SINGLE_COLORS.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          )}

          <div className="space-y-3">
            <Label>{t("form.printColorType")}</Label>
            <Select 
              value={formData.print_color_type} 
              onValueChange={(v: any) => setFormData({ ...formData, print_color_type: v, print_color_config: null })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">এক কালার (Single Color)</SelectItem>
                <SelectItem value="double">মাল্টি কালার (Multi Color)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Print Color (প্রিন্ট কালার)</Label>
            <Input 
              required
              list="print_colors"
              value={formData.print_color_config?.color || ""}
              onChange={(e: any) => setFormData({ ...formData, print_color_config: { color: e.target.value } })}
              className="h-11"
              placeholder={formData.print_color_type === 'single' ? "e.g. লাল" : "e.g. লাল-নীল"}
            />
            <datalist id="print_colors">
              {(formData.print_color_type === 'single' ? SINGLE_COLORS : MULTI_COLORS).map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("form.pricing")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-3">
            <Label>{t("form.qty")}</Label>
            <Input 
              type="number"
              min="1"
              required
              className="h-12 text-lg font-bold"
              value={formData.qty || ''}
              onChange={(e: any) => setFormData({ ...formData, qty: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-3">
            <Label>{t("form.ratePerPiece")}</Label>
            <Input 
              type="number"
              step="0.01"
              min="0"
              required
              className="h-12 text-lg font-bold"
              value={formData.rate_per_piece || ''}
              onChange={(e: any) => setFormData({ ...formData, rate_per_piece: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-3">
            <Label>{t("form.total")}</Label>
            <div className="h-12 flex items-center px-3 bg-muted border rounded-md text-foreground text-xl font-bold font-mono">
              ৳{totalAmount.toFixed(2)}
            </div>
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label>{t("form.notes")}</Label>
            <Textarea 
              value={formData.notes}
              onChange={(e: any) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Button 
        type="submit" 
        disabled={loading}
        className="w-full py-6 text-lg"
      >
        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {loading ? t("form.creating") : t("form.submit")}
      </Button>

    </form>
  );
}
