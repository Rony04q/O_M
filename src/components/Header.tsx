import { useNavigate, Link } from 'react-router-dom'; // <-- Added Link
import { ShoppingCart, Search, Menu, LogOut, User, Archive, LayoutDashboard } from 'lucide-react'; // <-- Added LogOut, User
import { Button } from '@/components/ui/button'; // Assuming Button component exists
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Assuming Avatar components exist
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// --- Define UserProfile Type (or import from AppRouter/types) ---
// Make sure this matches the structure provided by AppRouter
type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
} | null;

// --- Update HeaderProps ---
interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userProfile: UserProfile; // <-- Added user profile prop
  onLogout: () => void;     // <-- Added logout handler prop
}

export function Header({
  cartCount,
  onCartClick,
  searchQuery,
  onSearchChange,
  userProfile, // <-- Destructure new props
  onLogout      // <-- Destructure new props
}: HeaderProps) {
  const navigate = useNavigate();

  // Helper to get initials
  const getInitials = (name: string | null | undefined): string => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title Link */}
          <div className="flex items-center gap-8">
            <Link // <-- Changed button to Link for semantic correctness
              to="/" // Link to home page
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <ShoppingCart className="w-8 h-8 text-emerald-600" />
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 whitespace-nowrap">MarketPlace</h1>
            </Link>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right Section: Auth & Cart */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* --- Conditional Rendering for Auth --- */}
            {userProfile ? (
              // If logged in, show user info and logout
              // --- 3. REPLACED LINK/BUTTON WITH DROPDOWN ---
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                        {getInitials(userProfile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userProfile.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* These are the new links */}
                  <DropdownMenuItem onSelect={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate('/profile')}>
                    <Archive className="mr-2 h-4 w-4" />
                    <span>My Orders</span>
                  </DropdownMenuItem>
                  
                  {userProfile.role === 'seller' && (
                    <DropdownMenuItem onSelect={() => navigate('/seller')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Seller Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // If not logged in, show Sign In link
              <Link
                to="/login"
                className="hidden md:block px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors rounded-md hover:bg-emerald-50"
              >
                Sign In
              </Link>
            )}
            {/* --- End Conditional Rendering --- */}

            {/* Cart Button */}
            <button
              onClick={onCartClick}
              className="relative p-2 text-gray-700 hover:text-emerald-600 transition-colors rounded-full hover:bg-emerald-50"
              aria-label="Open cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center pointer-events-none">
                  {cartCount}
                </span>
              )}
            </button>
            {/* Mobile Menu Button (functionality not implemented) */}
            <button className="md:hidden p-2 text-gray-700 hover:text-emerald-600">
              <Menu className="w-6 h-6" />
              <span className="sr-only">Open menu</span>
            </button>
          </div>
        </div>

        {/* Search Bar (Mobile) */}
        <div className="md:hidden pb-3 px-1"> {/* Added padding */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          {/* Add Mobile Sign In/User Info if Menu isn't functional */}
          {!userProfile && (
             <Link to="/login" className="block text-center mt-2 text-sm font-medium text-emerald-600 hover:underline">
                 Sign In
             </Link>
          )}
           {userProfile && (
             <div className="flex justify-between items-center mt-2 px-1">
                 <span className="text-sm text-gray-600">Welcome, {userProfile.full_name}!</span>
                 <Button variant="ghost" size="sm" onClick={onLogout} className="text-xs">Logout</Button>
             </div>
          )}
        </div>
      </div>
    </header>
  );
}