"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSetting } from "@/lib/actions/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

export function GeneralSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    app_name: "Swadhin Enterprize",
    company_address: "",
    company_phone: "",
    low_stock_threshold: "10",
    default_delivery_days: "10",
    currency_symbol: "৳"
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(prev => ({
          ...prev,
          ...data
        }));
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Save each setting sequentially
      await updateSetting('app_name', settings.app_name);
      await updateSetting('company_address', settings.company_address);
      await updateSetting('company_phone', settings.company_phone);
      await updateSetting('low_stock_threshold', settings.low_stock_threshold);
      await updateSetting('default_delivery_days', settings.default_delivery_days);
      await updateSetting('currency_symbol', settings.currency_symbol);

      toast.success("General settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>;
  }

  return (
    <Card className="border-emerald-900/10 shadow-sm max-w-2xl">
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Configure global variables for the application.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <Label>Application Display Name</Label>
            <Input
              value={settings.app_name}
              onChange={e => setSettings({ ...settings, app_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Company Address (Invoice)</Label>
            <Input
              value={settings.company_address || ''}
              onChange={e => setSettings({ ...settings, company_address: e.target.value })}
              placeholder="e.g. 123 Main St, Dhaka"
            />
          </div>

          <div className="space-y-2">
            <Label>Company Phone (Invoice)</Label>
            <Input
              value={settings.company_phone || ''}
              onChange={e => setSettings({ ...settings, company_phone: e.target.value })}
              placeholder="e.g. 01712345678"
            />
          </div>

          <div className="space-y-2">
            <Label>Currency Symbol</Label>
            <Input
              value={settings.currency_symbol}
              onChange={e => setSettings({ ...settings, currency_symbol: e.target.value })}
              required
              className="max-w-[150px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Low Stock Warning Threshold (Quantity)</Label>
            <Input
              type="number"
              value={settings.low_stock_threshold}
              onChange={e => setSettings({ ...settings, low_stock_threshold: e.target.value })}
              required
              className="max-w-[150px]"
            />
            <p className="text-xs text-slate-500">Items below this quantity will be flagged in the Stock Report.</p>
          </div>

          <div className="space-y-2">
            <Label>Default Delivery Lead Time (Days)</Label>
            <Input
              type="number"
              value={settings.default_delivery_days}
              onChange={e => setSettings({ ...settings, default_delivery_days: e.target.value })}
              required
              className="max-w-[150px]"
            />
            <p className="text-xs text-slate-500">Automatically adds these many days to the order creation date for the delivery deadline.</p>
          </div>

          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
