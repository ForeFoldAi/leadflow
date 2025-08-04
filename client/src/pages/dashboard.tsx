import { useState } from "react";
import AppHeader from "@/components/app-header";
import StatsCards from "@/components/stats-cards";
import LeadFilters from "@/components/lead-filters";
import LeadTable from "@/components/lead-table";
import LeadForm from "@/components/lead-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import type { Lead } from "@shared/schema";

export default function Dashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    category: "",
    city: "",
  });

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingLead(null);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export functionality to be implemented");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" data-testid="page-title">Lead Management</h2>
              <p className="mt-1 text-sm text-gray-600">Track and manage your sales leads efficiently</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleExport}
                data-testid="button-export"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button 
                onClick={() => setIsFormOpen(true)}
                data-testid="button-add-lead"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Lead
              </Button>
            </div>
          </div>
        </div>

        <StatsCards />
        <LeadFilters filters={filters} onFiltersChange={setFilters} />
        <LeadTable filters={filters} onEditLead={handleEditLead} />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <LeadForm 
              lead={editingLead} 
              onClose={handleCloseForm} 
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
