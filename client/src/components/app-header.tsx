import { Users, Bell, User } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Users className="text-white text-sm" size={16} />
              </div>
              <h1 className="text-xl font-bold text-gray-900" data-testid="app-title">LeadFlow</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a 
                href="#" 
                className="text-primary font-medium border-b-2 border-primary pb-4"
                data-testid="nav-dashboard"
              >
                Dashboard
              </a>
              <a 
                href="#" 
                className="text-gray-600 hover:text-gray-900 pb-4"
                data-testid="nav-leads"
              >
                Leads
              </a>
              <a 
                href="#" 
                className="text-gray-600 hover:text-gray-900 pb-4"
                data-testid="nav-analytics"
              >
                Analytics
              </a>
              <a 
                href="#" 
                className="text-gray-600 hover:text-gray-900 pb-4"
                data-testid="nav-settings"
              >
                Settings
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-900" data-testid="button-notifications">
              <Bell size={18} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="text-gray-600" size={16} />
              </div>
              <span className="text-sm font-medium text-gray-700" data-testid="text-username">John Smith</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
