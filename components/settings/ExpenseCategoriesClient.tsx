"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { addExpenseCategory, deleteExpenseCategory } from "@/lib/actions/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-hot-toast";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional()
});

export default function ExpenseCategoriesClient({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" }
  });

  const onSubmit = async (data: z.infer<typeof categorySchema>) => {
    try {
      await addExpenseCategory(data.name, data.description || "");
      toast.success("Category added successfully");
      reset();
      // Optimistic update
      setCategories(prev => [...prev, { id: 'temp-' + Date.now(), name: data.name, description: data.description }]);
      // Real refresh handled by server action revalidation, but a window reload or router refresh works too.
      window.location.reload(); 
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setIsDeleting(id);
    try {
      await deleteExpenseCategory(id);
      toast.success("Category deleted");
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1 h-fit shadow-sm border-slate-200 dark:border-emerald-900/50 bg-white dark:bg-[#0a0f0a]">
        <CardHeader>
          <CardTitle className="text-lg">Add Category</CardTitle>
          <CardDescription>Create a new custom expense category.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input {...register("name")} placeholder="e.g. Marketing" />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...register("description")} placeholder="Optional description" />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Adding..." : "Add Category"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 shadow-sm border-slate-200 dark:border-emerald-900/50 bg-white dark:bg-[#0a0f0a]">
        <CardHeader>
          <CardTitle className="text-lg">Existing Categories</CardTitle>
          <CardDescription>Manage your expense categories here.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{cat.description || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(cat.id)}
                      disabled={isDeleting === cat.id || cat.id.startsWith('temp')}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      {isDeleting === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-slate-500">
                    No expense categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
