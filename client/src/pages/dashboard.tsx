import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/app-header";
import LeadTable from "@/components/lead-table";
import LeadForm from "@/components/lead-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { apiRequest } from "@/lib/queryClient";
import type { Lead } from "@shared/schema";

export default function Dashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    status: [] as string[],
    category: "",
    city: "",
  });

  // Get current user data
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Load user preferences from server
  const { data: userPreferences, refetch: refetchPreferences } = useQuery({
    queryKey: ['userPreferences', currentUser.id],
    queryFn: async () => {
      if (!currentUser.id) return null;
      const response = await apiRequest('GET', `/api/user/preferences/${currentUser.id}`);
      const data = await response.json();
      return data || {
        defaultView: 'table',
        itemsPerPage: '20',
        autoSave: true,
        compactMode: false,
        exportFormat: 'csv',
        exportNotes: true
      };
    },
    enabled: !!currentUser.id,
    placeholderData: {
      defaultView: 'table',
      itemsPerPage: '20',
      autoSave: true,
      compactMode: false,
      exportFormat: 'csv',
      exportNotes: true
    }
  });

  // Refresh preferences when component mounts (in case user just updated settings)
  useEffect(() => {
    if (currentUser.id) {
      refetchPreferences();
    }
  }, [currentUser.id, refetchPreferences]);



  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingLead(null);
  };

  const handleFiltersChange = (newFilters: { search: string; status: string | string[]; category: string; city: string; }) => {
    const normalizedStatus = Array.isArray(newFilters.status) ? newFilters.status : newFilters.status ? [newFilters.status] : [];
    
    // Only update if there's an actual change
    if (
      filters.search !== newFilters.search ||
      JSON.stringify(filters.status) !== JSON.stringify(normalizedStatus) ||
      filters.category !== newFilters.category ||
      filters.city !== newFilters.city
    ) {
      setFilters({
        ...newFilters,
        status: normalizedStatus
      });
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <LeadTable 
          filters={filters} 
          onFiltersChange={handleFiltersChange}
          onEditLead={handleEditLead}
          userPreferences={userPreferences}
          onAddNewLead={() => {
            setEditingLead(null);
            setIsFormOpen(true);
          }}
          exportFilters={filters}
        />

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
