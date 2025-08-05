import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface LeadFiltersProps {
  filters: {
    search: string;
    status: string;
    category: string;
    city: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function LeadFilters({ filters, onFiltersChange }: LeadFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Update local search value when filters change externally
  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  const updateFilter = (key: string, value: string) => {
    const newValue = value === "all" ? "" : value;
    onFiltersChange({ ...filters, [key]: newValue });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        <Select value={filters.status || "all"} onValueChange={(value) => updateFilter("status", value)}>
          <SelectTrigger data-testid="select-status">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New Lead</SelectItem>
            <SelectItem value="followup">Follow-up</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="hot">Hot Lead</SelectItem>
            <SelectItem value="converted">Converted to Customer</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.category || "all"} onValueChange={(value) => updateFilter("category", value)}>
          <SelectTrigger data-testid="select-category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="existing">Existing Customer</SelectItem>
            <SelectItem value="potential">Potential Customer</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.city || "all"} onValueChange={(value) => updateFilter("city", value)}>
          <SelectTrigger data-testid="select-city">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            <SelectItem value="New York">New York</SelectItem>
            <SelectItem value="Los Angeles">Los Angeles</SelectItem>
            <SelectItem value="Chicago">Chicago</SelectItem>
            <SelectItem value="Houston">Houston</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
