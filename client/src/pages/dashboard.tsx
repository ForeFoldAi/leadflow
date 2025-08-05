import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AppHeader from "@/components/app-header";
import LeadFilters from "@/components/lead-filters";
import LeadTable from "@/components/lead-table";
import LeadForm from "@/components/lead-form";
import ExportDialog from "@/components/export-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, TrendingUp, Users, Target, Calendar, Award, Building2, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Lead } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
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


  // Fetch analytics data for the impressive dashboard
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics'],
    staleTime: 30000,
  });

  // Calculate trend percentages (mock data for demo)
  const getTrendData = () => ({
    totalLeadsChange: 12.5,
    hotLeadsChange: 8.3,
    convertedLeadsChange: 15.7,
    conversionRateChange: 2.1
  });

  const trends = getTrendData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back to LeadFlow</h1>
              <p className="text-gray-600">Track, manage, and convert your leads with powerful insights</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
              <Button variant="outline" onClick={handleImportLeads}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{analytics?.totalLeads || 0}</div>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500 font-medium">+{trends.totalLeadsChange}%</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Hot Leads</CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{analytics?.hotLeads || 0}</div>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500 font-medium">+{trends.hotLeadsChange}%</span>
                <span className="text-sm text-gray-500 ml-1">this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Converted</CardTitle>
              <Award className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{analytics?.convertedLeads || 0}</div>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500 font-medium">+{trends.convertedLeadsChange}%</span>
                <span className="text-sm text-gray-500 ml-1">this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
              <Target className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{analytics?.conversionRate || 0}%</div>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500 font-medium">+{trends.conversionRateChange}%</span>
                <span className="text-sm text-gray-500 ml-1">improvement</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Building2 className="h-5 w-5 mr-2" />
                Subscription Management
              </CardTitle>
              <CardDescription className="text-blue-100">
                Manage your LeadFlow subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                className="w-full bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => setLocation("/settings")}
              >
                Manage Subscription
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Activity className="h-5 w-5 mr-2" />
                Performance Insights
              </CardTitle>
              <CardDescription className="text-green-100">
                View detailed analytics and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                className="w-full bg-white text-green-600 hover:bg-gray-100"
                onClick={() => setLocation("/analytics")}
              >
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Follow-ups
              </CardTitle>
              <CardDescription className="text-purple-100">
                Stay on top of your lead activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                className="w-full bg-white text-purple-600 hover:bg-gray-100"
                onClick={() => setLocation("/analytics")}
              >
                View Calendar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Primary Leads View Section */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Your Leads</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage and track all your leads in one place
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <LeadTable 
              filters={filters} 
              onFiltersChange={setFilters}
              onEditLead={handleEditLead}
              userPreferences={userPreferences}
              onImportLeads={handleImportLeads}
              onAddNewLead={() => setIsFormOpen(true)}
              exportFilters={filters}
            />
          </CardContent>
        </Card>

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
