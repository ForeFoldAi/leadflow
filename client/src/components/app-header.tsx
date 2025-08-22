import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Users, Search, BarChart3, Settings, LogOut, Menu, X, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";


export default function AppHeader() {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr || userStr === "undefined" || userStr === "null") {
        return null;
      }
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      localStorage.removeItem("user");
      return null;
    }
  };

  // Load user data on mount and listen for storage changes
  useEffect(() => {
    const loadUser = () => {
      const user = getUserFromStorage();
      setCurrentUser(user);
    };

    // Load initial user data
    loadUser();

    // Listen for storage changes (when user data is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        loadUser();
      }
    };

    // Listen for custom events when user data is updated
    const handleUserUpdate = () => {
      loadUser();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userUpdated", handleUserUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast({
      title: "Success",
      description: "Logged out successfully",
    });
    setLocation("/login");
  };

  const navItems = [
    { path: "/", label: "Leads", icon: UserCheck },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo, Brand and Welcome Section */}
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src="/logo.png" 
                    alt="ForeFold AI Logo" 
                    className="h-12 w-12 object-contain filter drop-shadow-lg"
                  />
                  <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl"></div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                    LeadsFlow
                  </h1>
                  <p className="text-sm text-slate-400 font-medium tracking-wide">
                    powered by <span className="text-purple-400">ForeFoldAI</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="hidden md:flex flex-col border-l border-slate-600 pl-6">
              <p className="text-slate-300 text-sm font-medium">Welcome,</p>
              <p className="text-white text-base font-semibold">
                {currentUser?.companyName || currentUser?.name || "User"}
              </p>
            </div>
          </div>

          {/* Right side - Navigation and User Menu */}
          <div className="flex items-center space-x-6">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="default"
                  onClick={() => setLocation(item.path)}
                  className="flex items-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 px-4 py-2 rounded-lg border border-transparent hover:border-slate-600"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-slate-300 hover:text-white hover:bg-slate-700/50"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="mobile-menu-button"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>

              {/* User Profile Section */}
              <div className="hidden md:flex items-center space-x-3 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{currentUser?.name || "User"}</p>
                  <p className="text-xs text-slate-400 truncate max-w-[120px]">
                    {currentUser?.email}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-purple-500/30 hover:border-purple-400 transition-colors" data-testid="user-menu">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white font-semibold">
                          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-3 bg-slate-900/50">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-white">{currentUser?.name || "User"}</p>
                        <p className="w-[200px] truncate text-sm text-slate-400">
                          {currentUser?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem onClick={() => setLocation("/settings")} data-testid="menu-settings" className="text-slate-300 hover:text-white hover:bg-slate-700">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout" className="text-slate-300 hover:text-white hover:bg-slate-700">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile User Menu */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-slate-600" data-testid="mobile-user-menu">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-sm">
                          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-3 bg-slate-900/50">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-white">{currentUser?.name || "User"}</p>
                        <p className="w-[200px] truncate text-sm text-slate-400">
                          {currentUser?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem onClick={() => setLocation("/settings")} data-testid="mobile-menu-settings" className="text-slate-300 hover:text-white hover:bg-slate-700">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem onClick={handleLogout} data-testid="mobile-menu-logout" className="text-slate-300 hover:text-white hover:bg-slate-700">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-4 pt-4 pb-4 space-y-2 border-t border-slate-700 bg-slate-800/30">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                  onClick={() => {
                    setLocation(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}