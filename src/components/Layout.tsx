import { Outlet, Link, useLocation } from 'react-router-dom';
import { Ship, BarChart3, Upload, BookOpen } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Cruises', icon: Ship },
    { path: '/analysis', label: 'Analysis', icon: BarChart3 },
    { path: '/import', label: 'Import', icon: Upload },
    { path: '/docs', label: 'Docs', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Ship className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">IceBox</h1>
                <p className="text-sm text-blue-100">Sea Ice Observation Software</p>
              </div>
            </div>
            <nav className="flex space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            IceBox - British Antarctic Survey
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Modernized version of ASPeCt sea ice observation software
          </p>
        </div>
      </footer>
    </div>
  );
}
