"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Supplier } from "@/types";
import { recordSupplierPayment } from "@/lib/actions/suppliers";
import { useRouter } from "@/routing";
import { ArrowLeft, Truck, Phone, MapPin, FileText, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/routing";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { SupplierBalanceAdjustDialog } from "./SupplierBalanceAdjustDialog";
import { ArrowRightLeft } from "lucide-react";

export function SupplierProfileClient({
  supplier,
  transactions,
}: {
  supplier: Supplier;
  transactions: any[];
}) {
  const router = useRouter();
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDesc, setPayDesc] = useState("");
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    setPaying(true);
    try {
      await recordSupplierPayment({ supplier_id: supplier.id, amount, description: payDesc || "Payment to supplier" });
      toast.success("Payment recorded!");
      setIsPayOpen(false);
      setPayAmount("");
      setPayDesc("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPaying(false);
    }
  };

  const balance = Number(supplier.balance);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/suppliers">
          <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold text-foreground">{supplier.name}</h1>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck size={16} className="text-emerald-500" />
                <span className="font-semibold text-foreground">Supplier Profile</span>
              </div>
              {supplier.phone && (
                <p className="flex items-center gap-2 text-sm"><Phone size={14} className="text-muted-foreground" />{supplier.phone}</p>
              )}
              {supplier.address && (
                <p className="flex items-center gap-2 text-sm"><MapPin size={14} className="text-muted-foreground" />{supplier.address}</p>
              )}
              {supplier.notes && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><FileText size={14} />{supplier.notes}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Balance</p>
              <p className={cn("text-3xl font-bold font-mono", balance > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400")}>
                ৳{Math.abs(balance).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {balance > 0 ? "We owe them" : balance < 0 ? "They owe us" : "Clear"}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAdjustOpen(true)}
                >
                  <ArrowRightLeft size={14} className="mr-1" /> Adjust
                </Button>
                {balance > 0 && (
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => setIsPayOpen(true)}>
                    <CreditCard size={14} className="mr-1" /> Pay Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-emerald-900/30">
            {transactions.length === 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">No transactions yet.</p>
            )}
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-emerald-900/10">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-emerald-100">{tx.description || "Transaction"}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), "MMM dd, yyyy h:mm a")}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={cn("text-[10px] uppercase", tx.type === 'debit' ? "text-orange-600 border-orange-200" : "text-emerald-600 border-emerald-200")}>
                    {tx.type}
                  </Badge>
                  <p className={cn("font-mono font-bold mt-0.5", tx.type === 'debit' ? "text-orange-600" : "text-emerald-600")}>
                    {tx.type === 'debit' ? '-' : '+'}৳{Number(tx.amount).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay {supplier.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Amount (৳)</Label>
              <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={payDesc} onChange={(e) => setPayDesc(e.target.value)} placeholder="e.g. Payment for ink batch" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayOpen(false)}>Cancel</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handlePay} disabled={paying}>
              {paying && <Loader2 size={14} className="animate-spin mr-2" />}
              Pay ৳{Number(payAmount || 0).toLocaleString()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SupplierBalanceAdjustDialog 
        isOpen={isAdjustOpen} 
        onClose={() => setIsAdjustOpen(false)} 
        supplier={supplier} 
      />
    </div>
  );
}
