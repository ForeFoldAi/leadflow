import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Phone, Mail, Trash2, MessageCircle, ChevronDown, ChevronRight, Eye, EyeOff, ChevronLeft, ChevronRight as ChevronRightIcon, Upload, Plus, Download, MoreHorizontal, X, ArrowUpDown, ArrowUp, ArrowDown, Grid3X3, List, Table as TableIcon, User } from "lucide-react";
import LeadFilters from "./lead-filters";
import LeadGrid from "./lead-grid";
import LeadList from "./lead-list";
import ExportDialog from "./export-dialog";
import ImportDialog from "./import-dialog";
import { InlineLoader } from "./ui/loader";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Lead } from "../../shared/schema";
import { format } from "date-fns";

interface LeadTableProps {
  filters: {
    search: string;
    status: string | string[];
    category: string;
    city: string;
  };
  onFiltersChange?: (filters: { search: string; status: string | string[]; category: string; city: string; }) => void;
  onEditLead: (lead: Lead) => void;
  userPreferences?: {
    defaultView: string;
    itemsPerPage: string;
    autoSave: boolean;
    compactMode: boolean;
    exportFormat: string;
    exportNotes: boolean;
  };
  onAddNewLead?: () => void;
  exportFilters?: {
    search: string;
    status: string | string[];
    category: string;
    city: string;
  };
}

export default function LeadTable({ filters, onFiltersChange, onEditLead, userPreferences, onAddNewLead, exportFilters }: LeadTableProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showInterestedColumn, setShowInterestedColumn] = useState(false);
  const [showNotesColumn, setShowNotesColumn] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => 
    parseInt(userPreferences?.itemsPerPage || '20')
  );

  // Update items per page when user preferences change
  React.useEffect(() => {
    if (userPreferences?.itemsPerPage) {
      setItemsPerPage(parseInt(userPreferences.itemsPerPage));
    }
  }, [userPreferences?.itemsPerPage]);
  
  // View mode state - use user preference or default to table
  const [currentView, setCurrentView] = useState(() => 
    userPreferences?.defaultView || 'table'
  );

  // Update current view when user preferences change
  React.useEffect(() => {
    if (userPreferences?.defaultView) {
      setCurrentView(userPreferences.defaultView);
    }
  }, [userPreferences?.defaultView]);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc'
  });

  // Handler for page size change
  const handlePageSizeChange = (newSize: string) => {
    setItemsPerPage(parseInt(newSize));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handler for sorting
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Sort function
  const sortData = (data: Lead[]) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Lead];
      const bValue = b[sortConfig.key as keyof Lead];

      // Handle null/undefined values
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      // Convert to strings for comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-3 w-3 md:h-4 md:w-4 text-gray-900" /> : 
      <ArrowDown className="h-3 w-3 md:h-4 md:w-4 text-gray-900" />;
  };

  // Fetch leads data
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          filters.status.forEach(s => params.append('status', s));
        } else {
          params.append('status', filters.status);
        }
      }
      if (filters.category) params.append('category', filters.category);
      if (filters.city) params.append('city', filters.city);

      const response = await apiRequest('GET', `/api/leads?${params.toString()}`);
      return response.json();
    },
  });

  // Delete lead mutation
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/leads/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    },
  });

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let filtered: Lead[] = leads;
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((lead: Lead) => 
        lead.name.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.phoneNumber.toLowerCase().includes(searchLower) ||
        lead.companyName?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
      filtered = filtered.filter((lead: Lead) => statusArray.includes(lead.leadStatus));
    }
    
    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter((lead: Lead) => lead.customerCategory === filters.category);
    }
    
    // Apply city filter
    if (filters.city) {
      filtered = filtered.filter((lead: Lead) => 
        lead.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    
    // Apply sorting
    return sortData(filtered);
  }, [leads, filters, sortConfig]);

  // Toggle row expansion
  const toggleRowExpansion = (leadId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  // Handle delete lead
  const handleDeleteLead = (id: string) => {
    setDeletingId(id);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (deletingId) {
      await deleteLeadMutation.mutateAsync(deletingId);
      setDeletingId(null);
    }
  };

  // Helper functions for status colors and followup status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'followup': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'hot': return 'bg-red-100 text-red-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFollowupStatus = (followupDate: string | null) => {
    if (!followupDate) return { status: 'none', className: '', bgClassName: '' };
    
    try {
      const today = new Date();
      const followup = new Date(followupDate);
      const diffInDays = Math.ceil((followup.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays < 0) {
        return { 
          status: 'overdue', 
          className: 'text-red-800 font-medium', 
          bgClassName: 'bg-red-100 border-l-4 border-red-500' 
        };
      } else if (diffInDays <= 7) {
        return { 
          status: 'approaching', 
          className: 'text-yellow-800 font-medium', 
          bgClassName: 'bg-yellow-100 border-l-4 border-yellow-500' 
        };
      } else {
        return { 
          status: 'future', 
          className: 'text-green-800 font-medium', 
          bgClassName: 'bg-green-100 border-l-4 border-green-500' 
        };
      }
    } catch {
      return { status: 'none', className: '', bgClassName: '' };
    }
  };

  const getCommunicationIcon = (channel: string | null) => {
    switch (channel) {
      case 'email': return <Mail className="h-3 w-3 md:h-4 md:w-4" />;
      case 'phone': return <Phone className="h-3 w-3 md:h-4 md:w-4" />;
      case 'whatsapp': return <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />;
      case 'sms': return <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />;
      case 'in-person': return <User className="h-3 w-3 md:h-4 md:w-4" />;
      case 'linkedin': return <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />;
      default: return <Mail className="h-3 w-3 md:h-4 md:w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 md:p-6">
          <InlineLoader text="Loading leads..." />
        </CardContent>
      </Card>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="px-3 md:px-6 py-3 md:py-4 border-b border-gray-200">
        {/* Action Buttons Row */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle className="text-base md:text-lg font-semibold text-gray-900">Leads View</CardTitle>
          <div className="flex flex-row space-x-2 sm:space-x-3">
            <ImportDialog onImportSuccess={() => {
              console.log("ImportDialog onImportSuccess called - invalidating queries");
              // Invalidate all leads-related queries
              queryClient.invalidateQueries({ 
                predicate: (query) => query.queryKey[0] === "/api/leads" 
              });
              queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
              // Refetch the current query
              queryClient.refetchQueries({ queryKey: ["/api/leads", filters] });
            }} />
            {exportFilters && <ExportDialog currentFilters={exportFilters} />}
            {onAddNewLead && (
              <Button 
                className="btn-impressive-primary text-xs sm:text-sm flex-1 sm:flex-none"
                onClick={onAddNewLead}
                data-testid="button-add-lead"
              >
                <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4 icon" />
                <span className="hidden xs:inline">Add New Lead</span>
                <span className="xs:hidden">Add Lead</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        {onFiltersChange && (
          <div className="mb-3 md:mb-4">
            <LeadFilters filters={filters} onFiltersChange={onFiltersChange} />
          </div>
        )}

        {/* Legend and Column Toggles Row */}
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex flex-col space-y-2">
            <div className="text-xs md:text-sm font-medium text-gray-700">Next Followup Date</div>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-red-100 border-l-4 border-red-500 rounded-sm shadow-sm"></div>
                <span className="text-red-800 font-medium">Overdue</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-sm shadow-sm"></div>
                <span className="text-yellow-800 font-medium">Due Soon</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-green-100 border-l-4 border-green-500 rounded-sm shadow-sm"></div>
                <span className="text-green-800 font-medium">Future</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 border border-gray-200 rounded-md p-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentView === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentView('table')}
                      className="h-6 md:h-7 px-1 md:px-2"
                    >
                      <TableIcon className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Table View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentView === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentView('grid')}
                      className="h-6 md:h-7 px-1 md:px-2"
                    >
                      <Grid3X3 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Grid View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentView === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentView('list')}
                      className="h-6 md:h-7 px-1 md:px-2"
                    >
                      <List className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>List View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Column Toggles - Only show for table view */}
            {currentView === 'table' && (
              <div className="flex flex-row space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInterestedColumn(!showInterestedColumn)}
                        data-testid="toggle-interested-column"
                        className="text-xs h-7 md:h-8 flex-1 sm:flex-none"
                      >
                        {showInterestedColumn ? <Eye className="h-3 w-3 md:h-4 md:w-4" /> : <EyeOff className="h-3 w-3 md:h-4 md:w-4" />}
                        <span className="hidden sm:inline ml-1">Interested In</span>
                        <span className="sm:hidden ml-1">Interest</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {showInterestedColumn ? "Hide" : "Show"} Customer Interested In column
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNotesColumn(!showNotesColumn)}
                        data-testid="toggle-notes-column"
                        className="text-xs h-7 md:h-8 flex-1 sm:flex-none"
                      >
                        {showNotesColumn ? <Eye className="h-3 w-3 md:h-4 md:w-4" /> : <EyeOff className="h-3 w-3 md:h-4 md:w-4" />}
                        <span className="ml-1">Notes</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {showNotesColumn ? "Hide" : "Show"} Additional Notes column
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Conditional View Rendering */}
        {currentView === 'table' && (
          <div className="w-full overflow-x-auto">
            <Table className={`w-full ${(!showInterestedColumn && !showNotesColumn) ? '' : 'min-w-max'}`}>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider w-12 md:w-16 text-center">Expand</TableHead>
                  <TableHead 
                    className={`text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${
                      !showInterestedColumn && !showNotesColumn ? 'w-32 md:w-48' : 'w-28 md:w-40'
                    }`}
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Lead</span>
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${
                      !showInterestedColumn && !showNotesColumn ? 'w-28 md:w-40' : 'w-24 md:w-32'
                    }`}
                    onClick={() => handleSort('phoneNumber')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Contact</span>
                      {getSortIcon('phoneNumber')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${
                      !showInterestedColumn && !showNotesColumn ? 'w-28 md:w-40' : 'w-24 md:w-32'
                    }`}
                    onClick={() => handleSort('companyName')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Company</span>
                      {getSortIcon('companyName')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${
                      !showInterestedColumn && !showNotesColumn ? 'w-20 md:w-24' : 'w-16 md:w-20'
                    }`}
                    onClick={() => handleSort('leadStatus')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      {getSortIcon('leadStatus')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${
                      !showInterestedColumn && !showNotesColumn ? 'w-24 md:w-32' : 'w-20 md:w-28'
                    }`}
                    onClick={() => handleSort('lastContactedDate')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="hidden sm:inline">Last Contacted Date</span>
                      <span className="sm:hidden">Last Contact</span>
                      {getSortIcon('lastContactedDate')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${
                      !showInterestedColumn && !showNotesColumn ? 'w-24 md:w-32' : 'w-20 md:w-28'
                    }`}
                    onClick={() => handleSort('lastContactedBy')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="hidden sm:inline">Last Contacted By</span>
                      <span className="sm:hidden">Contacted By</span>
                      {getSortIcon('lastContactedBy')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className={`text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${
                      !showInterestedColumn && !showNotesColumn ? 'w-24 md:w-32' : 'w-20 md:w-28'
                    }`}
                    onClick={() => handleSort('nextFollowupDate')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="hidden sm:inline">Next Followup Date</span>
                      <span className="sm:hidden">Next Followup</span>
                      {getSortIcon('nextFollowupDate')}
                    </div>
                  </TableHead>
                  {showInterestedColumn && (
                    <TableHead 
                      className="text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('customerInterestedIn')}
                    >
                      <div className="flex items-center justify-between">
                        <span className="hidden sm:inline">Customer Interested In</span>
                        <span className="sm:hidden">Interested In</span>
                        {getSortIcon('customerInterestedIn')}
                      </div>
                    </TableHead>
                  )}
                  <TableHead 
                    className={`text-xs font-medium text-gray-500 uppercase tracking-wider text-center cursor-pointer hover:bg-gray-100 select-none ${
                      !showInterestedColumn && !showNotesColumn ? 'w-12 md:w-16' : 'w-10 md:w-12'
                    }`}
                    onClick={() => handleSort('preferredCommunicationChannel')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Channel</span>
                      {getSortIcon('preferredCommunicationChannel')}
                    </div>
                  </TableHead>
                  {showNotesColumn && (
                    <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Additional Notes</TableHead>
                  )}
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider w-16 md:w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showInterestedColumn && showNotesColumn ? 12 : showInterestedColumn || showNotesColumn ? 11 : 10} className="text-center py-6 md:py-8">
                      <div className="text-gray-500">
                        <p className="text-base md:text-lg font-medium">No leads found</p>
                        <p className="text-xs md:text-sm">Try adjusting your filters or add a new lead.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLeads.map((lead) => (
                    <React.Fragment key={lead.id}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(lead.id)}
                            className="h-5 w-5 md:h-6 md:w-6 p-0"
                          >
                            {expandedRows.has(lead.id) ? (
                              <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                            ) : (
                              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold text-gray-900 text-sm md:text-base">{lead.name}</div>
                            <div className="text-xs md:text-sm text-gray-500">
                              {lead.customerCategory === 'existing' ? 'Existing Customer' : 'Potential Customer'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs md:text-sm text-gray-900">{lead.phoneNumber}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900 text-xs md:text-sm">{lead.companyName || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{lead.designation || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(lead.leadStatus)} text-xs`}>
                            {lead.leadStatus.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs md:text-sm text-gray-900">
                          {lead.lastContactedDate ? format(new Date(lead.lastContactedDate), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm text-gray-900">{lead.lastContactedBy || 'N/A'}</TableCell>
                        <TableCell>
                          <div className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm font-medium ${getFollowupStatus(lead.nextFollowupDate).bgClassName}`}>
                            {lead.nextFollowupDate ? format(new Date(lead.nextFollowupDate), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                        </TableCell>
                        {showInterestedColumn && (
                          <TableCell className="text-xs md:text-sm text-gray-900 max-w-xs truncate">
                            {lead.customerInterestedIn || 'N/A'}
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex justify-center">
                                  {getCommunicationIcon(lead.preferredCommunicationChannel)}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Preferred: {lead.preferredCommunicationChannel || 'Not specified'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        {showNotesColumn && (
                          <TableCell className="text-xs md:text-sm text-gray-900 max-w-xs truncate">
                            {lead.additionalNotes || 'N/A'}
                          </TableCell>
                        )}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 md:h-8 md:w-8 p-0">
                                <MoreHorizontal className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditLead(lead)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteLead(lead.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(lead.id) && (
                        <TableRow>
                          <TableCell colSpan={showInterestedColumn && showNotesColumn ? 12 : showInterestedColumn || showNotesColumn ? 11 : 10}>
                            <div className="bg-gray-50 p-3 md:p-4 rounded-md">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                <div>
                                  <p className="font-medium text-gray-800 mb-1 text-sm">Contact Information:</p>
                                  <p className="pl-2 text-gray-600 text-xs md:text-sm">Phone: {lead.phoneNumber}</p>
                                  {lead.email && <p className="pl-2 text-gray-600 text-xs md:text-sm">Email: {lead.email}</p>}
                                  {lead.dateOfBirth && <p className="pl-2 text-gray-600 text-xs md:text-sm">Date of Birth: {format(new Date(lead.dateOfBirth), 'MMM dd, yyyy')}</p>}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 mb-1 text-sm">Location:</p>
                                  {lead.city && <p className="pl-2 text-gray-600 text-xs md:text-sm">City: {lead.city}</p>}
                                  {lead.state && <p className="pl-2 text-gray-600 text-xs md:text-sm">State: {lead.state}</p>}
                                  {lead.country && <p className="pl-2 text-gray-600 text-xs md:text-sm">Country: {lead.country}</p>}
                                  {lead.pincode && <p className="pl-2 text-gray-600 text-xs md:text-sm">Pincode: {lead.pincode}</p>}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 mb-1 text-sm">Company Details:</p>
                                  {lead.companyName && <p className="pl-2 text-gray-600 text-xs md:text-sm">Company: {lead.companyName}</p>}
                                  {lead.designation && <p className="pl-2 text-gray-600 text-xs md:text-sm">Designation: {lead.designation}</p>}
                                  <p className="pl-2 text-gray-600 text-xs md:text-sm">Category: {lead.customerCategory === 'existing' ? 'Existing Customer' : 'Potential Customer'}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 mb-1 text-sm">Lead Information:</p>
                                  <p className="pl-2 text-gray-600 text-xs md:text-sm">Source: {lead.leadSource}</p>
                                  {lead.customLeadSource && <p className="pl-2 text-gray-600 text-xs md:text-sm">Custom Source: {lead.customLeadSource}</p>}
                                  {lead.leadCreatedBy && <p className="pl-2 text-gray-600 text-xs md:text-sm">Created By: {lead.leadCreatedBy}</p>}
                                </div>
                                {showInterestedColumn && (
                                  <div>
                                    <p className="font-medium text-gray-800 mb-1 text-sm">Interested In:</p>
                                    <p className="pl-2 text-gray-600 text-xs md:text-sm">{lead.customerInterestedIn || "Not specified"}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-800 mb-1 text-sm">Additional Notes:</p>
                                  <p className="pl-2 italic text-gray-600 text-xs md:text-sm">{lead.additionalNotes || "No additional notes"}</p>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Grid View */}
        {currentView === 'grid' && (
          <div className="p-3 md:p-6">
            {paginatedLeads.length === 0 ? (
              <div className="text-center py-6 md:py-8">
                <div className="text-gray-500">
                  <p className="text-base md:text-lg font-medium">No leads found</p>
                  <p className="text-xs md:text-sm">Try adjusting your filters or add a new lead.</p>
                </div>
              </div>
            ) : (
              <LeadGrid 
                leads={paginatedLeads} 
                onEditLead={onEditLead}
                onDeleteLead={handleDeleteLead}
                compactMode={userPreferences?.compactMode || false}
              />
            )}
          </div>
        )}

        {/* List View */}
        {currentView === 'list' && (
          <div className="p-3 md:p-6">
            {paginatedLeads.length === 0 ? (
              <div className="text-center py-6 md:py-8">
                <div className="text-gray-500">
                  <p className="text-base md:text-lg font-medium">No leads found</p>
                  <p className="text-xs md:text-sm">Try adjusting your filters or add a new lead.</p>
                </div>
              </div>
            ) : (
              <LeadList 
                leads={paginatedLeads} 
                onEditLead={onEditLead}
                onDeleteLead={handleDeleteLead}
                compactMode={userPreferences?.compactMode || false}
                onLeadClick={onEditLead}
              />
            )}
          </div>
        )}
        
        {/* Pagination Controls */}
        {leads.length > 0 && (
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0 px-3 md:px-6 py-3 md:py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-4">
              <div className="text-xs md:text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, leads.length)} of {leads.length} leads
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm text-gray-600">Show:</span>
                <Select value={itemsPerPage.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-16 md:w-20 h-7 md:h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs md:text-sm text-gray-600">per page</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
                className="h-7 md:h-8 text-xs"
              >
                <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      data-testid={`button-page-${pageNum}`}
                      className="w-6 h-7 md:w-8 md:h-8 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                data-testid="button-next-page"
                className="h-7 md:h-8 text-xs"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRightIcon className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
