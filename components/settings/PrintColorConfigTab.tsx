"use client";

import { useEffect, useState } from "react";
import { getPrintColorConfigs, addPrintColorConfig, togglePrintColorConfig } from "@/lib/actions/settings";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

export function PrintColorConfigTab() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New config form state
  const [name, setName] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await getPrintColorConfigs();
      setConfigs(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleAddColor = () => {
    if (colorInput.trim() && !colors.includes(colorInput.trim()) && colors.length < 3) {
      setColors([...colors, colorInput.trim()]);
      setColorInput("");
    }
  };

  const handleRemoveColor = (c: string) => {
    setColors(colors.filter(col => col !== c));
  };

  const handleAddConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || colors.length === 0) {
      toast.error("Please provide a name and at least one color.");
      return;
    }
    setSaving(true);
    try {
      await addPrintColorConfig(name, colors);
      toast.success("Print color config added!");
      setName("");
      setColors([]);
      fetchConfigs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await togglePrintColorConfig(id, !currentStatus);
      toast.success(currentStatus ? "Deactivated" : "Activated");
      fetchConfigs();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-emerald-900/10 shadow-sm">
        <CardHeader>
          <CardTitle>Add Print Color Config</CardTitle>
          <CardDescription>Create combinations of colors used for bag printing (e.g., "Black & Navy"). Maximum 3 colors per config.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddConfig} className="flex flex-col md:flex-row items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label>Config Name</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Red-Black Combo"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label>Colors (Add up to 3)</Label>
              <div className="flex gap-2">
                <Input
                  value={colorInput}
                  onChange={e => setColorInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddColor();
                    }
                  }}
                  placeholder="e.g. Red"
                  disabled={colors.length >= 3}
                />
                <Button type="button" variant="secondary" onClick={handleAddColor} disabled={colors.length >= 3}>Add</Button>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] border rounded-md p-2 min-h-[40px] flex items-center flex-wrap gap-2">
              {colors.length === 0 && <span className="text-sm text-slate-400">No colors added</span>}
              {colors.map(c => (
                <Badge key={c} variant="default" className="bg-slate-800 text-white">
                  {c}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleRemoveColor(c)} />
                </Badge>
              ))}
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Save Config
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-emerald-900/10 shadow-sm">
        <CardHeader>
          <CardTitle>Existing Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Config Name</TableHead>
                    <TableHead>Colors Included</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No configs found.</TableCell>
                    </TableRow>
                  ) : (
                    configs.map(config => (
                      <TableRow key={config.id} className={!config.is_active ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{config.name}</TableCell>
                        <TableCell className="space-x-1">
                          {config.colors.map((c: string) => (
                            <Badge key={c} variant="outline" className="bg-slate-100">{c}</Badge>
                          ))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={config.is_active}
                            onCheckedChange={() => handleToggle(config.id, config.is_active)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
