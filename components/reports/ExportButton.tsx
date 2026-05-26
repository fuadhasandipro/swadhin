"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
  data: any[];
  filename: string;
}

export function ExportButton({ data, filename }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Basic flattening of objects for CSV
    const headers = Object.keys(data[0]).filter(key => typeof data[0][key] !== 'object');
    
    let csvContent = headers.join(",") + "\n";
    
    data.forEach(row => {
      const values = headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) val = '';
        // Escape quotes and wrap in quotes if there is a comma
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      });
      csvContent += values.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="print:hidden">
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  );
}
