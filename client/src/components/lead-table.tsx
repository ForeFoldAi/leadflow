import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Phone, Mail, Trash2, MessageCircle, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Lead } from "@shared/schema";
import { format } from "date-fns";

interface LeadTableProps {
  filters: {
    search: string;
    status: string;
    category: string;
    city: string;
  };
  onEditLead: (lead: Lead) => void;
}

export default function LeadTable({ filters, onEditLead }: LeadTableProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showInterestedColumn, setShowInterestedColumn] = useState(false);
  const [showNotesColumn, setShowNotesColumn] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.status && filters.status !== "all") queryParams.append("status", filters.status);
  if (filters.category && filters.category !== "all") queryParams.append("category", filters.category);
  if (filters.city && filters.city !== "all") queryParams.append("city", filters.city);

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", queryParams.toString()],
    queryFn: async () => {
      const url = queryParams.toString() ? `/api/leads?${queryParams.toString()}` : '/api/leads';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/stats/summary"] });
      setDeletingId(null);
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    },
    onError: () => {
      setDeletingId(null);
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: "New Lead", className: "bg-blue-100 text-blue-800 border-blue-200" },
      followup: { label: "Follow-up", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      qualified: { label: "Qualified", className: "bg-purple-100 text-purple-800 border-purple-200" },
      hot: { label: "Hot Lead", className: "bg-orange-100 text-orange-800 border-orange-200" },
      converted: { label: "Converted", className: "bg-green-100 text-green-800 border-green-200" },
      lost: { label: "Lost", className: "bg-red-100 text-red-800 border-red-200" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return (
      <Badge variant="outline" className={`${config.className} font-medium px-2 py-1 text-xs rounded-full border`}>
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    return category === "existing" ? "Existing Customer" : "Potential Customer";
  };

  const getCommunicationIcon = (channel: string) => {
    switch (channel) {
      case "phone":
        return <Phone className="h-4 w-4 text-blue-600" />;
      case "email":
        return <Mail className="h-4 w-4 text-green-600" />;
      case "whatsapp":
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-400" />;
    }
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "-";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-500" data-testid="text-no-leads">No leads found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Leads</CardTitle>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInterestedColumn(!showInterestedColumn)}
                    data-testid="toggle-interested-column"
                  >
                    {showInterestedColumn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    Interested In
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
                  >
                    {showNotesColumn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    Notes
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showNotesColumn ? "Hide" : "Show"} Additional Notes column
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`${showInterestedColumn || showNotesColumn ? 'overflow-x-auto' : ''} w-full`}>
          <Table className={`w-full ${!showInterestedColumn && !showNotesColumn ? 'table-fixed' : ''}`}>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider w-12 text-center">Expand</TableHead>
                <TableHead className={`text-xs font-medium text-gray-500 uppercase tracking-wider ${!showInterestedColumn && !showNotesColumn ? 'w-[18%]' : ''}`}>Lead</TableHead>
                <TableHead className={`text-xs font-medium text-gray-500 uppercase tracking-wider ${!showInterestedColumn && !showNotesColumn ? 'w-[15%]' : ''}`}>Contact</TableHead>
                <TableHead className={`text-xs font-medium text-gray-500 uppercase tracking-wider ${!showInterestedColumn && !showNotesColumn ? 'w-[15%]' : ''}`}>Company</TableHead>
                <TableHead className={`text-xs font-medium text-gray-500 uppercase tracking-wider ${!showInterestedColumn && !showNotesColumn ? 'w-[10%]' : ''}`}>Status</TableHead>
                <TableHead className={`text-xs font-medium text-gray-500 uppercase tracking-wider ${!showInterestedColumn && !showNotesColumn ? 'w-[12%]' : ''}`}>Last Contact</TableHead>
                <TableHead className={`text-xs font-medium text-gray-500 uppercase tracking-wider ${!showInterestedColumn && !showNotesColumn ? 'w-[12%]' : ''}`}>Last Contacted By</TableHead>
                <TableHead className={`text-xs font-medium text-gray-500 uppercase tracking-wider ${!showInterestedColumn && !showNotesColumn ? 'w-[10%]' : ''}`}>Next Followup</TableHead>
                {showInterestedColumn && (
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Interested In</TableHead>
                )}
                <TableHead className={`text-xs font-medium text-gray-500 uppercase tracking-wider text-center ${!showInterestedColumn && !showNotesColumn ? 'w-[8%]' : ''}`}>Channel</TableHead>
                {showNotesColumn && (
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Additional Notes</TableHead>
                )}
                <TableHead className={`text-xs font-medium text-gray-500 uppercase tracking-wider ${!showInterestedColumn && !showNotesColumn ? 'w-[10%]' : ''}`}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead: Lead) => (
                <React.Fragment key={lead.id}>
                  <TableRow className="hover:bg-gray-50" data-testid={`row-lead-${lead.id}`}>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(lead.id)}
                        data-testid={`button-expand-${lead.id}`}
                      >
                        {expandedRows.has(lead.id) ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-gray-900" data-testid={`text-name-${lead.id}`}>
                          {lead.name}
                        </div>
                        <div className="text-sm text-gray-500" data-testid={`text-category-${lead.id}`}>
                          {getCategoryLabel(lead.customerCategory)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900" data-testid={`text-phone-${lead.id}`}>{lead.phoneNumber}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900" data-testid={`text-company-${lead.id}`}>
                        {lead.companyName || "-"}
                      </div>
                      <div className="text-sm text-gray-500" data-testid={`text-designation-${lead.id}`}>
                        {lead.designation || "-"}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`status-${lead.id}`}>
                      <div className="flex justify-start">
                        {getStatusBadge(lead.leadStatus)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500" data-testid={`text-last-contacted-${lead.id}`}>
                      {formatDate(lead.lastContactedDate)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500" data-testid={`text-last-contacted-by-${lead.id}`}>
                      {lead.lastContactedBy || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500" data-testid={`text-next-followup-${lead.id}`}>
                      {formatDate(lead.nextFollowupDate)}
                    </TableCell>
                    {showInterestedColumn && (
                      <TableCell className="text-sm text-gray-500" data-testid={`text-customer-interested-${lead.id}`}>
                        <div className="max-w-xs truncate" title={lead.customerInterestedIn || ""}>
                          {lead.customerInterestedIn || "-"}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-center" data-testid={`preferred-channel-${lead.id}`}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex justify-center">
                              {getCommunicationIcon(lead.preferredCommunicationChannel || 'email')}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            Preferred: {lead.preferredCommunicationChannel || 'email'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    {showNotesColumn && (
                      <TableCell className="text-sm text-gray-500" data-testid={`text-additional-notes-${lead.id}`}>
                        <div className="max-w-xs truncate" title={lead.additionalNotes || ""}>
                          {lead.additionalNotes || "-"}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditLead(lead)}
                          data-testid={`button-edit-${lead.id}`}
                        >
                          <Edit size={16} className="text-blue-600 hover:text-blue-800" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deleteMutation.isPending && deletingId === lead.id}
                              data-testid={`button-delete-${lead.id}`}
                            >
                              <Trash2 size={16} className="text-red-500 hover:text-red-700" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{lead.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid={`button-cancel-delete-${lead.id}`}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(lead.id)}
                                className="bg-red-600 hover:bg-red-700"
                                data-testid={`button-confirm-delete-${lead.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(lead.id) && (
                    <TableRow key={`expanded-${lead.id}`} className="bg-gray-50" data-testid={`expanded-row-${lead.id}`}>
                      <TableCell colSpan={showInterestedColumn && showNotesColumn ? 12 : showInterestedColumn || showNotesColumn ? 11 : 10} className="p-0 border-t">
                        <div className="p-6 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 text-base border-b border-gray-200 pb-2">Personal Information</h4>
                              <div className="text-sm text-gray-600 space-y-2">
                                <p><span className="font-medium text-gray-800">Email:</span> <span className="ml-2">{lead.email}</span></p>
                                <p><span className="font-medium text-gray-800">Date of Birth:</span> <span className="ml-2">{lead.dateOfBirth || "Not provided"}</span></p>
                                <p><span className="font-medium text-gray-800">Location:</span> <span className="ml-2">{lead.city}, {lead.state}, {lead.country}</span></p>
                                <p><span className="font-medium text-gray-800">Pincode:</span> <span className="ml-2">{lead.pincode}</span></p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 text-base border-b border-gray-200 pb-2">Lead Details</h4>
                              <div className="text-sm text-gray-600 space-y-2">
                                <p><span className="font-medium text-gray-800">Lead Status:</span> <span className="ml-2">{lead.leadStatus}</span></p>
                                <p><span className="font-medium text-gray-800">Category:</span> <span className="ml-2">{getCategoryLabel(lead.customerCategory)}</span></p>
                                <p><span className="font-medium text-gray-800">Company:</span> <span className="ml-2">{lead.companyName || "Not specified"}</span></p>
                                <p><span className="font-medium text-gray-800">Designation:</span> <span className="ml-2">{lead.designation || "Not specified"}</span></p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 text-base border-b border-gray-200 pb-2">Interest & Notes</h4>
                              <div className="text-sm text-gray-600 space-y-2">
                                <div>
                                  <p className="font-medium text-gray-800 mb-1">Interested In:</p>
                                  <p className="pl-2 italic text-gray-600">{lead.customerInterestedIn || "Not specified"}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 mb-1">Additional Notes:</p>
                                  <p className="pl-2 italic text-gray-600">{lead.additionalNotes || "No additional notes"}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
