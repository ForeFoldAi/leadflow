import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Phone, Mail, Trash2 } from "lucide-react";
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

  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.status && filters.status !== "all") queryParams.append("status", filters.status);
  if (filters.category && filters.category !== "all") queryParams.append("category", filters.category);
  if (filters.city && filters.city !== "all") queryParams.append("city", filters.city);

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", queryParams.toString()],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/stats/summary"] });
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: "New Lead", className: "bg-blue-100 text-blue-800" },
      followup: { label: "Follow-up", className: "bg-yellow-100 text-yellow-800" },
      qualified: { label: "Qualified", className: "bg-purple-100 text-purple-800" },
      hot: { label: "Hot Lead", className: "bg-orange-100 text-orange-800" },
      converted: { label: "Converted to Customer", className: "bg-green-100 text-green-800" },
      lost: { label: "Lost", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    return category === "existing" ? "Existing Customer" : "Potential Customer";
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
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Leads</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Company</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Next Followup</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead: Lead) => (
                <TableRow key={lead.id} className="hover:bg-gray-50" data-testid={`row-lead-${lead.id}`}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700" data-testid={`text-initials-${lead.id}`}>
                            {getInitials(lead.name)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900" data-testid={`text-name-${lead.id}`}>
                          {lead.name}
                        </div>
                        <div className="text-sm text-gray-500" data-testid={`text-category-${lead.id}`}>
                          {getCategoryLabel(lead.customerCategory)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900" data-testid={`text-email-${lead.id}`}>{lead.email}</div>
                    <div className="text-sm text-gray-500" data-testid={`text-phone-${lead.id}`}>{lead.phoneNumber}</div>
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
                    {getStatusBadge(lead.leadStatus)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500" data-testid={`text-last-contacted-${lead.id}`}>
                    {formatDate(lead.lastContactedDate)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500" data-testid={`text-next-followup-${lead.id}`}>
                    {formatDate(lead.nextFollowupDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditLead(lead)}
                        data-testid={`button-edit-${lead.id}`}
                      >
                        <Edit size={16} className="text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" data-testid={`button-phone-${lead.id}`}>
                        <Phone size={16} className="text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="sm" data-testid={`button-email-${lead.id}`}>
                        <Mail size={16} className="text-gray-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(lead.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${lead.id}`}
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
