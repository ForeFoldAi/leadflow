import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users, Target, Calendar, Download, FileText, Clock, CheckCircle, XCircle, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader } from "@/components/ui/loader";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LeadForm from "@/components/lead-form";
import { apiRequest } from "@/lib/queryClient";
import type { Lead } from "../../shared/schema";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7675'];

interface AnalyticsProps {
  onAddNewLead?: () => void;
}

export default function Analytics({ onAddNewLead }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState("30");
  const [, setLocation] = useLocation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Fetch comprehensive analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics", timeRange],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/analytics?days=${timeRange}`);
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <Loader text="Loading analytics..." />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-red-600">Failed to load analytics data</div>
        </div>
      </div>
    );
  }

  // Prepare chart data from analytics
  const statusData = [
    { name: 'New', value: analytics.leadsByStatus?.new || 0, color: '#0088FE' },
    { name: 'Follow-up', value: analytics.leadsByStatus?.followup || 0, color: '#00C49F' },
    { name: 'Qualified', value: analytics.leadsByStatus?.qualified || 0, color: '#FFBB28' },
    { name: 'Hot', value: analytics.leadsByStatus?.hot || 0, color: '#FF8042' },
    { name: 'Converted', value: analytics.leadsByStatus?.converted || 0, color: '#82ca9d' },
    { name: 'Lost', value: analytics.leadsByStatus?.lost || 0, color: '#ff7675' },
  ].filter(item => item.value > 0);

  const leadSourceData = [
    { name: 'Website', value: analytics.leadSourceBreakdown?.website || 0, color: '#0088FE' },
    { name: 'Referral', value: analytics.leadSourceBreakdown?.referral || 0, color: '#00C49F' },
    { name: 'LinkedIn', value: analytics.leadSourceBreakdown?.linkedin || 0, color: '#FFBB28' },
    { name: 'Facebook', value: analytics.leadSourceBreakdown?.facebook || 0, color: '#FF8042' },
    { name: 'Twitter', value: analytics.leadSourceBreakdown?.twitter || 0, color: '#8884d8' },
    { name: 'Campaign', value: analytics.leadSourceBreakdown?.campaign || 0, color: '#82ca9d' },
    { name: 'Other', value: analytics.leadSourceBreakdown?.other || 0, color: '#ff7675' },
  ].filter(item => item.value > 0);

  const categoryData = [
    { name: 'Potential', value: analytics.leadsByCategory?.potential || 0, color: '#0088FE' },
    { name: 'Existing', value: analytics.leadsByCategory?.existing || 0, color: '#00C49F' },
  ].filter(item => item.value > 0);

  // Export functionality
  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange: `${timeRange} days`,
      summary: {
        totalLeads: analytics.totalLeads,
        convertedLeads: analytics.convertedLeads,
        conversionRate: `${analytics.conversionRate}%`,
        hotLeads: analytics.hotLeads,
        qualifiedLeads: analytics.qualifiedLeads,
        lostLeads: analytics.lostLeads,
        followupPending: analytics.followupPending,
        newLeadsThisWeek: analytics.newLeadsThisWeek,
        newLeadsThisMonth: analytics.newLeadsThisMonth,
        averageTimeToConvert: `${analytics.averageTimeToConvert} days`
      },
      leadSourceBreakdown: analytics.leadSourceBreakdown,
      leadsByStatus: analytics.leadsByStatus,
      next7DaysFollowups: analytics.next7DaysFollowups
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" data-testid="text-analytics-title">
              Analytics Dashboard
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Comprehensive insights into your lead management performance</p>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-40 text-sm" data-testid="select-time-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7" data-testid="option-7-days">Last 7 days</SelectItem>
                <SelectItem value="30" data-testid="option-30-days">Last 30 days</SelectItem>
                <SelectItem value="90" data-testid="option-90-days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={exportReport} 
              variant="outline"
              size="sm"
              className="text-sm"
              data-testid="button-export-report"
            >
              <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button 
              className="btn-impressive-primary text-sm"
              size="sm"
              onClick={() => {
                setEditingLead(null);
                setIsFormOpen(true);
              }}
              data-testid="button-add-lead"
            >
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 icon" />
              <span className="hidden sm:inline">Add New Lead</span>
              <span className="sm:hidden">Add Lead</span>
            </Button>
          </div>
        </div>

        {/* Lead Management Overview */}
        <div className="mb-4 sm:mb-6">
          {/* Header */}
          <div className="mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Lead Management Overview</h1>
            <p className="text-xs sm:text-sm text-gray-600">Track and manage your sales pipeline with real-time insights</p>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Potential Customers Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
              <CardContent className="p-3 sm:p-4 relative">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 opacity-5">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 transform rotate-12 translate-x-4 sm:translate-x-6 -translate-y-4 sm:-translate-y-6">
                    <Users size={64} className="sm:w-24 sm:h-24" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs font-semibold text-gray-700 leading-tight">Potential Customers</h3>
                  <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  </div>
                </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-end justify-between">
                    <div className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">
                      {(analytics.leadsByCategory?.potential || 0).toLocaleString()}
              </div>
                    <div className="flex items-center space-x-1 text-xs font-medium text-green-600">
                      <TrendingUp size={8} className="sm:w-2.5 sm:h-2.5" />
                      <span>12%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                    <span className="text-xs font-medium text-blue-700">New This Week</span>
                    <span className="text-xs font-bold text-blue-600">
                      {(analytics.leadsByStatus?.new || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Follow-ups Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l-xl"></div>
              <CardContent className="p-3 sm:p-4 relative">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 opacity-5">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 transform rotate-12 translate-x-4 sm:translate-x-6 -translate-y-4 sm:-translate-y-6">
                    <Clock size={64} className="sm:w-24 sm:h-24" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs font-semibold text-gray-700 leading-tight">Pending Follow-ups</h3>
                  <div className="p-1.5 sm:p-2 bg-amber-50 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                  </div>
                </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-end justify-between">
                    <div className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">
                      {(analytics.followupPending || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-1 text-xs font-medium text-red-600">
                      <TrendingDown size={8} className="sm:w-2.5 sm:h-2.5" />
                      <span>5%</span>
                    </div>
                      </div>
                  
                  <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                    <span className="text-xs font-medium text-amber-700">Due This Week</span>
                    <span className="text-xs font-bold text-amber-600">
                      {analytics.next7DaysFollowups?.filter((f: any) => {
                        const date = new Date(f.nextFollowupDate);
                        const today = new Date();
                        const diffTime = date.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays >= 0 && diffDays <= 7;
                      }).length || 0}
                      </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Qualified Leads Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-xl"></div>
              <CardContent className="p-3 sm:p-4 relative">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 opacity-5">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 transform rotate-12 translate-x-4 sm:translate-x-6 -translate-y-4 sm:-translate-y-6">
                    <Target size={64} className="sm:w-24 sm:h-24" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs font-semibold text-gray-700 leading-tight">Qualified Leads</h3>
                  <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                  </div>
                </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-end justify-between">
                    <div className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">
                      {(analytics.qualifiedLeads || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-1 text-xs font-medium text-green-600">
                      <TrendingUp size={8} className="sm:w-2.5 sm:h-2.5" />
                      <span>8%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                    <span className="text-xs font-medium text-purple-700">Ready to Convert</span>
                    <span className="text-xs font-bold text-purple-600">
                      {(analytics.qualifiedLeads || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hot Leads Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 rounded-l-xl"></div>
              <CardContent className="p-3 sm:p-4 relative">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 opacity-5">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 transform rotate-12 translate-x-4 sm:translate-x-6 -translate-y-4 sm:-translate-y-6">
                    <TrendingUp size={64} className="sm:w-24 sm:h-24" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs font-semibold text-gray-700 leading-tight">Hot Leads</h3>
                  <div className="p-1.5 sm:p-2 bg-orange-50 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                  </div>
                      </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-end justify-between">
                    <div className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">
                      {(analytics.hotLeads || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-1 text-xs font-medium text-green-600">
                      <TrendingUp size={8} className="sm:w-2.5 sm:h-2.5" />
                      <span>15%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                    <span className="text-xs font-medium text-orange-700">High Priority</span>
                    <span className="text-xs font-bold text-orange-600">
                      {(analytics.hotLeads || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Converted Customers Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-xl"></div>
              <CardContent className="p-3 sm:p-4 relative">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 opacity-5">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 transform rotate-12 translate-x-4 sm:translate-x-6 -translate-y-4 sm:-translate-y-6">
                    <CheckCircle size={64} className="sm:w-24 sm:h-24" />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs font-semibold text-gray-700 leading-tight">Converted Customers</h3>
                  <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-end justify-between">
                    <div className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">
                      {(analytics.convertedLeads || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-1 text-xs font-medium text-green-600">
                      <TrendingUp size={8} className="sm:w-2.5 sm:h-2.5" />
                      <span>22%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                    <span className="text-xs font-medium text-emerald-700">This Month</span>
                    <span className="text-xs font-bold text-emerald-600">
                      {(analytics.convertedLeads || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lost Opportunities Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-xl"></div>
              <CardContent className="p-3 sm:p-4 relative">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 opacity-5">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 transform rotate-12 translate-x-4 sm:translate-x-6 -translate-y-4 sm:-translate-y-6">
                    <XCircle size={64} className="sm:w-24 sm:h-24" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs font-semibold text-gray-700 leading-tight">Lost Opportunities</h3>
                  <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  </div>
                      </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-end justify-between">
                    <div className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">
                      {(analytics.lostLeads || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-1 text-xs font-medium text-red-600">
                      <TrendingDown size={8} className="sm:w-2.5 sm:h-2.5" />
                      <span>18%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                    <span className="text-xs font-medium text-red-700">Closed Lost</span>
                    <span className="text-xs font-bold text-red-600">
                      {(analytics.lostLeads || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rate Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 rounded-l-xl"></div>
              <CardContent className="p-3 sm:p-4 relative">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 opacity-5">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 transform rotate-12 translate-x-4 sm:translate-x-6 -translate-y-4 sm:-translate-y-6">
                    <TrendingUp size={64} className="sm:w-24 sm:h-24" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs font-semibold text-gray-700 leading-tight">Conversion Rate</h3>
                  <div className="p-1.5 sm:p-2 bg-teal-50 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600" />
                  </div>
                      </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-end justify-between">
                    <div className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">
                      {`${analytics.conversionRate || 0}%`}
                    </div>
                    <div className="flex items-center space-x-1 text-xs font-medium text-green-600">
                      <TrendingUp size={8} className="sm:w-2.5 sm:h-2.5" />
                      <span>7%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                    <span className="text-xs font-medium text-teal-700">Success Rate</span>
                    <span className="text-xs font-bold text-teal-600">
                      {`${analytics.conversionRate || 0}%`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avg. Conversion Time Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
              <CardContent className="p-3 sm:p-4 relative">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 opacity-5">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 transform rotate-12 translate-x-4 sm:translate-x-6 -translate-y-4 sm:-translate-y-6">
                    <Clock size={64} className="sm:w-24 sm:h-24" />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs font-semibold text-gray-700 leading-tight">Avg. Conversion Time</h3>
                  <div className="p-1.5 sm:p-2 bg-indigo-50 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-end justify-between">
                    <div className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">
                      {`${analytics.averageTimeToConvert || 0}`}
                    </div>
                    <div className="flex items-center space-x-1 text-xs font-medium text-red-600">
                      <TrendingDown size={8} className="sm:w-2.5 sm:h-2.5" />
                      <span>12%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                    <span className="text-xs font-medium text-indigo-700">Days Average</span>
                    <span className="text-xs font-bold text-indigo-600">
                      {`${analytics.averageTimeToConvert || 0}d`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Follow-up Timeline Card */}
          <Card className="hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 rounded-l-xl"></div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Follow-up Timeline</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Manage your upcoming and overdue follow-ups</p>
                </div>
                <div className="p-2 sm:p-3 bg-cyan-50 rounded-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
                </div>
                      </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Overdue */}
                <div className="text-center group">
                  <div className="bg-red-50 rounded-xl p-3 sm:p-4 group-hover:bg-red-100 transition-colors duration-200">
                    <div className="text-xl sm:text-2xl font-bold text-red-600 mb-1 sm:mb-2">
                        {analytics.next7DaysFollowups?.filter((f: any) => {
                          const date = new Date(f.nextFollowupDate);
                          return date < new Date();
                        }).length || 0}
                    </div>
                    <div className="text-xs font-semibold text-red-700 mb-1">Overdue</div>
                    <div className="text-xs text-red-600">Requires immediate attention</div>
                  </div>
                      </div>
                
                {/* Due Soon */}
                <div className="text-center group">
                  <div className="bg-amber-50 rounded-xl p-3 sm:p-4 group-hover:bg-amber-100 transition-colors duration-200">
                    <div className="text-xl sm:text-2xl font-bold text-amber-600 mb-1 sm:mb-2">
                        {analytics.next7DaysFollowups?.filter((f: any) => {
                          const date = new Date(f.nextFollowupDate);
                          const today = new Date();
                          const diffTime = date.getTime() - today.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays >= 0 && diffDays <= 7;
                        }).length || 0}
                    </div>
                    <div className="text-xs font-semibold text-amber-700 mb-1">Due This Week</div>
                    <div className="text-xs text-amber-600">Plan your outreach</div>
                  </div>
                      </div>
                
                {/* Future */}
                <div className="text-center group">
                  <div className="bg-blue-50 rounded-xl p-3 sm:p-4 group-hover:bg-blue-100 transition-colors duration-200">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1 sm:mb-2">
                        {analytics.next7DaysFollowups?.filter((f: any) => {
                          const date = new Date(f.nextFollowupDate);
                          const today = new Date();
                          const diffTime = date.getTime() - today.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays > 7;
                        }).length || 0}
                    </div>
                    <div className="text-xs font-semibold text-blue-700 mb-1">Future</div>
                    <div className="text-xs text-blue-600">Scheduled ahead</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Lead Source Breakdown */}
          <Card data-testid="card-lead-source-chart">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Lead Source Breakdown</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Where your leads are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leadSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Leads by Status */}
          <Card data-testid="card-status-chart">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Leads by Status</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Current distribution of lead statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <div className="grid grid-cols-1 mb-4 sm:mb-6">
          <Card data-testid="card-monthly-trends">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Monthly Trends</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Leads added and converted over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.monthlyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="leads" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Leads Added"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="converted" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Converted Leads"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

       
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <LeadForm 
            lead={editingLead} 
            onClose={() => {
              setIsFormOpen(false);
              setEditingLead(null);
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}