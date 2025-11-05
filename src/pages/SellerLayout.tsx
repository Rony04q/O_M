// src/pages/SellerLayout.tsx
import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { LogOut, PlusCircle, Package } from 'lucide-react';

const SellerLayout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (error || !profile) { throw new Error('Could not fetch user profile.'); }

        if (profile.role !== 'seller') {
          navigate('/'); // Redirect non-sellers to home
        } else {
          setUserRole(profile.role);
        }
      } catch (error: any) {
        console.error("Authorization error:", error.message);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    checkUserRole();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) { return <div className="min-h-screen flex items-center justify-center">Checking access...</div>; }
  if (userRole !== 'seller') { return <div className="min-h-screen flex items-center justify-center">Access Denied</div>; }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-60 bg-white border-r flex flex-col shadow-sm">
        <div className="p-4 border-b">
          <Link to="/seller" className="text-lg font-semibold text-emerald-700">Seller Dashboard</Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to="/seller/add-product"
            className={({ isActive }) => 
              `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:text-emerald-700 hover:bg-emerald-50 ${
                isActive ? 'bg-emerald-50 text-emerald-700' : ''
              }`
            }
          >
            <PlusCircle className="h-4 w-4" /> Add New Product
          </NavLink>
          
          {/* --- ADD THIS NEW LINK --- */}
          <NavLink
            to="/seller/orders"
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:text-emerald-700 hover:bg-emerald-50 ${isActive ? 'bg-emerald-50 text-emerald-700' : ''}`}
          >
            <Package className="h-4 w-4" /> My Orders
          </NavLink>
          <Link to="/" className="text-sm text-gray-500 hover:text-emerald-700 pt-4 mt-4 border-t block">View Marketplace</Link>
        </nav>
        <div className="mt-auto p-4 border-t">
            <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
               <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b h-14 flex items-center px-6 justify-end">
            <span className="text-sm text-gray-600">Seller Portal</span>
        </header>
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  );
};
export default SellerLayout;