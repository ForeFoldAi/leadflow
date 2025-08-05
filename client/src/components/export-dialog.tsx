import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileText, Filter } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ExportDialogProps {
  currentFilters: {
    search: string;
    status: string;
    category: string;
    city: string;
  };
}

export default function ExportDialog({ currentFilters }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: "csv",
    useCurrentFilters: true,
    includeFields: {
      personalInfo: true,
      contactInfo: true,
      addressInfo: true,
      companyInfo: true,
      followupInfo: true,
    }
  });

  const handleExport = async () => {
    try {
      let queryParams = new URLSearchParams();
      
      if (exportOptions.useCurrentFilters) {
        if (currentFilters.search) queryParams.append("search", currentFilters.search);
        if (currentFilters.status && currentFilters.status !== "all") queryParams.append("status", currentFilters.status);
        if (currentFilters.category && currentFilters.category !== "all") queryParams.append("category", currentFilters.category);
        if (currentFilters.city && currentFilters.city !== "all") queryParams.append("city", currentFilters.city);
      }

      const exportUrl = `/api/leads/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const getFilterSummary = () => {
    const activeFilters = [];
    if (currentFilters.search) activeFilters.push(`Search: "${currentFilters.search}"`);
    if (currentFilters.status) activeFilters.push(`Status: ${currentFilters.status}`);
    if (currentFilters.category) activeFilters.push(`Category: ${currentFilters.category}`);
    if (currentFilters.city) activeFilters.push(`City: ${currentFilters.city}`);
    
    return activeFilters.length > 0 ? activeFilters.join(", ") : "No filters applied";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-export">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Leads
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div>
            <Label className="text-sm font-medium">Export Format</Label>
            <Select value={exportOptions.format} onValueChange={(value) => 
              setExportOptions({...exportOptions, format: value})
            }>
              <SelectTrigger className="mt-2" data-testid="select-export-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Filter Options */}
          <div>
            <Label className="text-sm font-medium">Data Selection</Label>
            <div className="mt-3 space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="use-filters"
                  checked={exportOptions.useCurrentFilters}
                  onCheckedChange={(checked) => 
                    setExportOptions({...exportOptions, useCurrentFilters: checked as boolean})
                  }
                  data-testid="checkbox-use-filters"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="use-filters" className="text-sm font-normal">
                    Use current filters
                  </Label>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Filter className="h-3 w-3" />
                    <span data-testid="text-filter-summary">{getFilterSummary()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              data-testid="button-cancel-export"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              data-testid="button-confirm-export"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}