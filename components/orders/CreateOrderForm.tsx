"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/routing";
import { createOrder } from "@/lib/actions/orders";
import { getCustomers } from "@/lib/actions/customers";
import { Customer, Product, PrintColorConfig } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactSelect from 'react-select';
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { Loader2, Palette, Plus } from "lucide-react";
import { addPrintColorConfig } from "@/lib/actions/settings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

// Helper component for Color Chips
const ColorChips = ({ options, value, onChange }: { options: string[], value: string, onChange: (v: string) => void }) => (
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mt-2 -mx-1 px-1">
    {options.map(c => (
      <button
        key={c}
        type="button"
        onClick={() => onChange(c)}
        className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
          value === c 
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]' 
            : 'bg-white dark:bg-emerald-950/30 text-slate-700 dark:text-emerald-100 border-slate-200 dark:border-emerald-900/50 hover:bg-slate-50'
        }`}
      >
        {c}
      </button>
    ))}
  </div>
);

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
  const [printConfigs, setPrintConfigs] = useState<any[]>([]);

  const BASIC_COLORS = ["লাল", "সবুজ", "নীল", "সাদা", "হলুদ", "কালো", "কমলা", "খয়েরি", "গোলাপি", "ছাই", "বেগুনী"];
  
  const dbSingle = printConfigs.filter(c => !c.colors || (c.colors.length <= 1 && !c.colors.includes("handle") && !c.colors.includes("multi")) || (c.colors.length === 1 && c.colors[0] === c.name)).map(c => c.name);
  const dbMulti = printConfigs.filter(c => c.colors && c.colors.includes("multi")).map(c => c.name);
  const dbHandle = printConfigs.filter(c => c.colors && c.colors.includes("handle")).map(c => c.name);

  const SINGLE_COLORS = dbSingle.length > 0 ? dbSingle : BASIC_COLORS;
  const MULTI_COLORS = dbMulti.length > 0 ? dbMulti : [];
  const HANDLE_COLORS = dbHandle.length > 0 ? dbHandle : BASIC_COLORS;

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

  const fetchData = async () => {
    const [custData, prodRes, colorRes] = await Promise.all([
      getCustomers(),
      supabase.from("products").select("*").gt("qty", 0).order("bag_size"),
      supabase.from("print_color_configs").select("*").eq("is_active", true).order("name")
    ]);
    if (custData) setCustomers(custData);
    if (prodRes.data) setProducts(prodRes.data);
    if (colorRes.data) setPrintConfigs(colorRes.data);
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  // Add Color Dialog State
  const [isAddColorOpen, setIsAddColorOpen] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorType, setNewColorType] = useState<"single" | "multi" | "handle">("single");
  const [addingColor, setAddingColor] = useState(false);

  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName.trim()) {
      toast.error("Please enter a color name.");
      return;
    }
    setAddingColor(true);
    try {
      let colorsToSave = [newColorName];
      if (newColorType === "multi") colorsToSave = [newColorName, "multi"];
      else if (newColorType === "handle") colorsToSave = [newColorName, "handle"];

      await addPrintColorConfig(newColorName, colorsToSave);
      toast.success("Color added successfully!");
      setNewColorName("");
      setIsAddColorOpen(false);
      await fetchData(); // Refresh colors
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingColor(false);
    }
  };

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
    <>
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
              <Label htmlFor="is_new_customer" className="font-semibold text-emerald-600 dark:text-emerald-400">{t("form.newCustomer")}</Label>
            </div>
          )}

          {!isNewCustomer ? (
            <div className="space-y-3">
              <Label>{t("form.selectCustomer")}</Label>
              <ReactSelect 
                options={customers.map(c => ({ value: c.id, label: `${c.name} (${c.phone})` }))}
                value={formData.customer_id ? { value: formData.customer_id, label: customers.find(c => c.id === formData.customer_id)?.name + ' (' + customers.find(c => c.id === formData.customer_id)?.phone + ')' } : null}
                onChange={(option: any) => {
                  const v = option?.value;
                  if (v) {
                    const cust = customers.find(c => c.id === v);
                    setFormData({ ...formData, customer_id: v, location: cust?.address || formData.location });
                  } else {
                    setFormData({ ...formData, customer_id: "" });
                  }
                }}
                isClearable
                placeholder={t("form.selectCustomer")}
                className="text-sm react-select-container"
                classNamePrefix="react-select"
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              />
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
              <div className="space-y-3">
                <ReactSelect 
                  options={products.map(p => ({ value: p.id, label: `${p.bag_size} - ${p.bag_color} (${p.gsm} GSM) - ${p.qty} available` }))}
                  value={formData.product_id ? (() => {
                    const p = products.find(prod => prod.id === formData.product_id);
                    return p ? { value: p.id, label: `${p.bag_size} - ${p.bag_color} (${p.gsm} GSM) - ${p.qty} available` } : null;
                  })() : null}
                  onChange={(option: any) => {
                    const v = option?.value;
                    if (v) {
                      const prod = products.find(p => p.id === v);
                      if (prod) {
                        setFormData(prev => ({ 
                          ...prev, 
                          product_id: v,
                          manual_bag_size: prod.bag_size,
                          body_color: prod.bag_color,
                          gsm: prod.gsm
                        }));
                      }
                    } else {
                      setFormData(prev => ({ ...prev, product_id: "" }));
                    }
                  }}
                  isClearable
                  placeholder="Search and Select Stock Product"
                  className="text-sm react-select-container"
                  classNamePrefix="react-select"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  menuPosition="fixed"
                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                />
              </div>
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
            <select 
              value={formData.cutting_type} 
              onChange={(e: any) => setFormData({ ...formData, cutting_type: e.target.value })}
              className="flex h-11 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-emerald-800/50 dark:bg-[#0a0f0a]"
            >
              <option value="handle">Handle Cut</option>
              <option value="d-cut">D-Cut</option>
            </select>
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

          <div className="space-y-3 md:col-span-2">
            <div className="flex justify-between items-center">
              <Label className="text-emerald-900 dark:text-emerald-100">{t("form.bodyColor")}</Label>
            </div>
            <Input 
              required
              value={formData.body_color}
              onChange={(e: any) => setFormData({ ...formData, body_color: e.target.value })}
              className="h-11 border-slate-200 dark:border-emerald-800/50 focus:ring-emerald-500/20"
              placeholder="Select below or type custom color"
            />
            <ColorChips 
              options={BASIC_COLORS} 
              value={formData.body_color} 
              onChange={(c) => setFormData({ ...formData, body_color: c })} 
            />
          </div>

          {formData.cutting_type === 'handle' && (
            <div className="space-y-3 md:col-span-2">
              <div className="flex justify-between items-center">
                <Label className="text-emerald-900 dark:text-emerald-100">{t("form.handleColor")}</Label>
              </div>
              <Input 
                required
                value={formData.handle_color}
                onChange={(e: any) => setFormData({ ...formData, handle_color: e.target.value })}
                className="h-11 border-slate-200 dark:border-emerald-800/50 focus:ring-emerald-500/20"
                placeholder="Select below or type custom color"
              />
              <ColorChips 
                options={HANDLE_COLORS} 
                value={formData.handle_color} 
                onChange={(c) => setFormData({ ...formData, handle_color: c })} 
              />
            </div>
          )}

          <div className="space-y-3 md:col-span-2">
            <Label className="text-emerald-900 dark:text-emerald-100">{t("form.printColorType")}</Label>
            <select 
              value={formData.print_color_type} 
              onChange={(e: any) => setFormData({ ...formData, print_color_type: e.target.value, print_color_config: null })}
              className="flex h-11 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-emerald-800/50 dark:bg-[#0a0f0a]"
            >
              <option value="single">এক কালার (Single Color)</option>
              <option value="double">মাল্টি কালার (Multi Color)</option>
            </select>
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="flex justify-between items-center">
              <Label className="text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                <Palette size={16} className="text-emerald-600" />
                Print Color (প্রিন্ট কালার)
              </Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                onPointerDown={(e) => e.preventDefault()}
                onClick={(e) => { e.preventDefault(); setIsAddColorOpen(true); }}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Color
              </Button>
            </div>
            <Input 
              required
              value={formData.print_color_config?.color || ""}
              onChange={(e: any) => setFormData({ ...formData, print_color_config: { color: e.target.value } })}
              className="h-11 border-slate-200 dark:border-emerald-800/50 focus:ring-emerald-500/20"
              placeholder={formData.print_color_type === 'single' ? "e.g. লাল" : "e.g. লাল-নীল"}
            />
            <ColorChips 
              options={formData.print_color_type === 'single' ? SINGLE_COLORS : MULTI_COLORS} 
              value={formData.print_color_config?.color || ""} 
              onChange={(c) => setFormData({ ...formData, print_color_config: { color: c } })} 
            />
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

      {/* Inline Add Color Dialog */}
      <Dialog open={isAddColorOpen} onOpenChange={setIsAddColorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Color</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddColor} className="space-y-4">
            <div className="space-y-2">
              <Label>Color Name</Label>
              <Input
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="e.g. Red"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Color Type</Label>
              <select 
                value={newColorType} 
                onChange={(e: any) => setNewColorType(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-emerald-800/50 dark:bg-emerald-950/30"
              >
                <option value="single">Single Print Color</option>
                <option value="multi">Multi Print Color</option>
                <option value="handle">Handle Color</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddColorOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={addingColor}>
                {addingColor ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Color
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
