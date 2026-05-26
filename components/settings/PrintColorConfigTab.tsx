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
import { Loader2, Plus, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { updatePrintColorConfig, deletePrintColorConfig } from "@/lib/actions/settings";

export function PrintColorConfigTab() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New config form state
  const [name, setName] = useState("");
  const [colorType, setColorType] = useState<"single" | "multi" | "handle">("single");
  const [saving, setSaving] = useState(false);

  // Edit config state
  const [editItem, setEditItem] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editColorType, setEditColorType] = useState<"single" | "multi" | "handle">("single");
  const [editing, setEditing] = useState(false);

  // Delete config state
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleAddConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide a color name.");
      return;
    }
    setSaving(true);
    try {
      let colorsToSave = [name];
      if (colorType === "multi") colorsToSave = [name, "multi"];
      else if (colorType === "handle") colorsToSave = [name, "handle"];
      
      await addPrintColorConfig(name, colorsToSave);
      toast.success("Color added successfully!");
      setName("");
      fetchConfigs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Please provide a color name.");
      return;
    }
    setEditing(true);
    try {
      let colorsToSave = [editName];
      if (editColorType === "multi") colorsToSave = [editName, "multi"];
      else if (editColorType === "handle") colorsToSave = [editName, "handle"];
      
      await updatePrintColorConfig(editItem.id, editName, colorsToSave);
      toast.success("Color updated successfully!");
      setEditItem(null);
      fetchConfigs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deletePrintColorConfig(deleteItem.id);
      toast.success("Color deleted successfully!");
      setDeleteItem(null);
      fetchConfigs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
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
          <CardTitle>Add Print Color</CardTitle>
          <CardDescription>Create a new print color option that will be available in the order form.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddConfig} className="flex flex-col sm:flex-row items-end gap-4">
            <div className="space-y-2 flex-[2] w-full">
              <Label>Color Name</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={colorType === "single" ? "e.g. Red" : "e.g. Red-Black"}
                className="w-full"
              />
            </div>
            <div className="space-y-2 flex-1 w-full">
              <Label>Type</Label>
              <select 
                value={colorType} 
                onChange={(e: any) => setColorType(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800/50 dark:bg-emerald-950/30"
              >
                <option value="single">Single Print Color</option>
                <option value="multi">Multi Print Color</option>
                <option value="handle">Handle Color</option>
              </select>
            </div>
            <Button type="submit" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Save Color
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
                    <TableHead>Color Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell>
                          <Badge variant="outline" className={config.colors?.includes("multi") ? "bg-purple-50 text-purple-700" : config.colors?.includes("handle") ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700"}>
                            {config.colors?.includes("multi") ? "Multi Print" : config.colors?.includes("handle") ? "Handle" : "Single Print"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={config.is_active}
                            onCheckedChange={() => handleToggle(config.id, config.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              setEditItem(config);
                              setEditName(config.name);
                              if (config.colors?.includes("multi")) setEditColorType("multi");
                              else if (config.colors?.includes("handle")) setEditColorType("handle");
                              else setEditColorType("single");
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => setDeleteItem(config)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Color Config</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditConfig} className="space-y-4">
            <div className="space-y-2">
              <Label>Color Name</Label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="e.g. Red"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select 
                value={editColorType} 
                onChange={(e: any) => setEditColorType(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-emerald-800/50 dark:bg-emerald-950/30"
              >
                <option value="single">Single Print Color</option>
                <option value="multi">Multi Print Color</option>
                <option value="handle">Handle Color</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={editing}>
                {editing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Color
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">Are you sure you want to delete the color <strong>{deleteItem?.name}</strong>? This action cannot be undone.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfig} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
