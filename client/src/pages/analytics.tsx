import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Calendar, Filter, Download, FileText, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7675'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30");

  // Fetch comprehensive analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?days=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600">Loading analytics...</div>
        </div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-analytics-title">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-gray-600">Comprehensive insights into your lead management performance</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40" data-testid="select-time-range">
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
              data-testid="button-export-report"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Leads */}
          <Card data-testid="card-total-leads">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.totalLeads}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-gray-600">Active leads in system</span>
              </div>
            </CardContent>
          </Card>

          {/* New Leads This Week */}
          <Card data-testid="card-new-leads-week">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Leads (Week)</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.newLeadsThisWeek}</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-gray-600">This month: {analytics.newLeadsThisMonth}</span>
              </div>
            </CardContent>
          </Card>

          {/* Follow-up Pending */}
          <Card data-testid="card-followup-pending">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Follow-up Pending</p>
                  <p className="text-3xl font-bold text-red-600">{analytics.followupPending}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-red-600">Requires immediate attention</span>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card data-testid="card-conversion-rate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-3xl font-bold text-green-600">{analytics.conversionRate}%</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-4 flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-gray-600">{analytics.convertedLeads} converted</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Qualified Leads */}
          <Card data-testid="card-qualified-leads">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Qualified Leads</p>
                  <p className="text-3xl font-bold text-yellow-600">{analytics.qualifiedLeads}</p>
                </div>
                <Target className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-gray-600">Ready for conversion</span>
              </div>
            </CardContent>
          </Card>

          {/* Hot Leads */}
          <Card data-testid="card-hot-leads">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hot Leads</p>
                  <p className="text-3xl font-bold text-orange-600">{analytics.hotLeads}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-gray-600">High conversion potential</span>
              </div>
            </CardContent>
          </Card>

          {/* Lost Leads */}
          <Card data-testid="card-lost-leads">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lost Leads</p>
                  <p className="text-3xl font-bold text-red-600">{analytics.lostLeads}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-gray-600">Did not convert</span>
              </div>
            </CardContent>
          </Card>

          {/* Average Time to Convert */}
          <Card data-testid="card-avg-time-convert">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Time to Convert</p>
                  <p className="text-3xl font-bold text-blue-600">{analytics.averageTimeToConvert}</p>
                  <p className="text-sm text-gray-500">days</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-gray-600">Process efficiency</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Lead Source Breakdown */}
          <Card data-testid="card-lead-source-chart">
            <CardHeader>
              <CardTitle>Lead Source Breakdown</CardTitle>
              <CardDescription>Where your leads are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
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
            <CardHeader>
              <CardTitle>Leads by Status</CardTitle>
              <CardDescription>Current distribution of lead statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
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
        <div className="grid grid-cols-1 mb-8">
          <Card data-testid="card-monthly-trends">
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Leads added and converted over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
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

        {/* Next 7 Days Follow-up Calendar */}
        <div className="grid grid-cols-1 mb-8">
          <Card data-testid="card-followup-calendar">
            <CardHeader>
              <CardTitle>Next 7 Days Follow-up Calendar</CardTitle>
              <CardDescription>Upcoming follow-ups scheduled for the next week</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.next7DaysFollowups && analytics.next7DaysFollowups.length > 0 ? (
                <div className="space-y-4">
                  {analytics.next7DaysFollowups.map((followup: any) => (
                    <div 
                      key={followup.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      data-testid={`followup-${followup.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">{followup.name}</p>
                          <p className="text-sm text-gray-600">{followup.companyName || 'No company'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge 
                          variant={followup.leadStatus === 'hot' ? 'destructive' : 'secondary'}
                        >
                          {followup.leadStatus}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {followup.nextFollowupDate ? format(new Date(followup.nextFollowupDate), 'MMM dd') : 'No date'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No follow-ups scheduled for the next 7 days</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}