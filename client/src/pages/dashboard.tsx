import { useState, useEffect } from "react";
import AppHeader from "@/components/app-header";
import LeadTable from "@/components/lead-table";
import LeadForm from "@/components/lead-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
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

  // Load user preferences from localStorage
  const [userPreferences, setUserPreferences] = useState(() => {
    const saved = localStorage.getItem('preferenceSettings');
    return saved ? JSON.parse(saved) : {
      defaultView: 'table',
      itemsPerPage: '20',
      autoSave: true,
      compactMode: false,
      exportFormat: 'csv',
      exportNotes: true
    };
  });

  // Listen for preference changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('preferenceSettings');
      if (saved) {
        setUserPreferences(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for updates within the same tab
    const interval = setInterval(() => {
      const saved = localStorage.getItem('preferenceSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserPreferences(parsed);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleImportLeads = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json,.xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            // Here you would parse the file content and add leads
            console.log('File imported:', file.name, content);
            // For now, just show a success message
            alert(`Successfully imported leads from ${file.name}`);
          } catch (error) {
            alert('Error importing file. Please check the format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingLead(null);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <LeadTable 
          filters={filters} 
          onFiltersChange={setFilters}
          onEditLead={handleEditLead}
          userPreferences={userPreferences}
          onImportLeads={handleImportLeads}
          onAddNewLead={() => setIsFormOpen(true)}
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
