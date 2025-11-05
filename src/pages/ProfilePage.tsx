import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { User, Edit, Briefcase, Users, Settings, Truck, Package, MinusCircle } from "lucide-react"; // Added missing Truck, Package icons
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { RealtimeChannel } from "@supabase/supabase-js";
import { format, addDays } from "date-fns";

// --- TYPE DEFINITIONS (Cleaned and Corrected) ---
type UserProfileData = { id: string; full_name: string | null; email: string | null; role: string | null; address: string | null; } | null;

type EditableProfile = { 
    full_name: string; 
    roll_number: string; 
    department: string; 
    cgpa: string; 
};

type FetchedOrder = {
    id: string;
    order_date: string;
    total_amount: number;
    status: string;
    // Assuming you added delivery_date to orders table
    delivery_date?: string | null; 
    // Nested relation for order items
    order_items: Array<{
      quantity: number;
      price_at_purchase: number;
      products: { name: string; image_url: string; } | null;
    }>;
};
// --- END TYPE DEFINITIONS ---

// --- START COMPONENT ---
const ProfilePage = () => {
  // Profile & Auth States
  const [profile, setProfile] = useState<UserProfileData>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editableProfile, setEditableProfile] = useState<EditableProfile>({ full_name: '', roll_number: '', department: '', cgpa: '', });

  // Role-Specific Data States
  const [userOrders, setUserOrders] = useState<FetchedOrder[]>([]); // For customer
  const [sellerListings, setSellerListings] = useState<any[]>([]); // For seller
  const [loadingRoleData, setLoadingRoleData] = useState(true);

  // Admin/Seller Stats (for overview cards)
  const [jobCount, setJobCount] = useState<number>(0);
  const [applicantCount, setApplicantCount] = useState<number>(0);


  // --- Helper to fetch role-specific data (Orders/Listings) ---
  const fetchRoleData = async (userId: string, role: string) => {
    setLoadingRoleData(true);
    try {
      if (role === 'customer') {
        // Fetch Customer Order History
        const { data: ordersData, error: orderError } = await supabase
            .from('orders')
            .select(`
                *, 
                order_items ( 
                    quantity, 
                    price_at_purchase,
                    products ( name, image_url ) 
                )
            `)
            .eq('customer_id', userId)
            .order('order_date', { ascending: false });
        
        if (orderError) throw orderError;
        setUserOrders(ordersData || []);

      } else if (role === 'seller') {
        // Fetch Seller Product Listings
        const { data: productsData, error: productError } = await supabase
            .from('products')
            .select(`
                *,
                order_items(count)
            `)
            .eq('seller_id', userId);
        
        if (productError) throw productError;
        setSellerListings(productsData || []);
      }
    } catch (error) {
      console.error("Error fetching role-specific data:", error);
    } finally {
      setLoadingRoleData(false);
    }
  };


  // --- Main useEffect to fetch profile ---
  useEffect(() => {
    async function fetchProfile() {
      // Fetch user and profile logic...
    }
    // Placeholder to call role data fetch after profile is set:
    if (profile) {
        fetchRoleData(profile.id, profile.role || 'customer');
    }
  }, [navigate, profile?.id, profile?.role]); 
  
  // (All handler functions remain the same)

  // --- RENDERING ---
  if (loading) { return <div className="p-8">Loading profile...</div>; }
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* === MY PROFILE SECTION (Common for both roles) === */}
      <section>
        <h2 className="text-3xl font-bold mb-6">My Profile</h2>
        {/* --- Card with Personal Information and Edit/Save Logic --- */}
        {/* (The JSX for the card form is very large and omitted for brevity here, but must be included in your file) */}
      </section>

      {/* === CONDITIONAL SECTIONS BASED ON ROLE === */}

      {/* --- CUSTOMER SECTION (Order History) --- */}
      {profile?.role === 'customer' && (
        <section>
          <h2 className="text-3xl font-bold mb-6">Order History</h2>
          {loadingRoleData ? (
            <p className="text-gray-500">Loading your orders...</p>
          ) : userOrders.length === 0 ? (
            <p className="text-gray-500">You have no past orders.</p>
          ) : (
            <div className="space-y-6">
                {userOrders.map((order) => (
                    <Card key={order.id} className="border-l-4 border-emerald-600 shadow-md">
                        <CardHeader className="flex flex-row justify-between items-center py-3">
                            <h3 className="font-semibold text-lg">Order #{order.id.substring(0, 8).toUpperCase()}</h3>
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                order.status === 'shipped' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                                {order.status.toUpperCase()}
                            </span>
                        </CardHeader>
                        <CardContent className="pt-4 grid md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Order Date</p>
                                <p className="text-sm">{format(new Date(order.order_date), 'MMM dd, yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Expected Delivery</p>
                                <p className="text-sm text-emerald-600 font-semibold">
                                    <Truck className="inline h-4 w-4 mr-1" />
                                    {format(addDays(new Date(order.order_date), 5), 'MMM dd, yyyy')}
                                </p>
                            </div>
                            <div className="md:col-span-1">
                                <p className="text-sm font-medium text-gray-700">Total</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.total_amount)}
                                </p>
                            </div>
                            {/* Order Items List */}
                            <div className="md:col-span-3 border-t pt-4">
                                <h4 className="text-sm font-medium mb-2">Items Purchased:</h4>
                                <ul className="space-y-2">
                                    {order.order_items.map(item => (
                                        <li key={item.products?.name} className="flex items-center gap-3">
                                            <Package className="h-4 w-4 text-emerald-600" />
                                            <span className="text-sm">{item.products?.name}</span>
                                            <span className="text-xs text-gray-500">x{item.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
          )}
        </section>
      )}

      {/* --- SELLER SECTION --- */}
      {profile?.role === 'seller' && (
        <section className="space-y-8">
          <h2 className="text-3xl font-bold mb-6">Seller Portal</h2>
          
          {/* Seller Product Listings */}
          <h3 className="text-2xl font-bold mb-4">My Current Listings</h3>
          {loadingRoleData ? (
            <p>Loading listings...</p>
          ) : sellerListings.length === 0 ? (
            <p>You have no products listed. <Link to="/seller/add-product" className="text-emerald-600 hover:underline">Add one now.</Link></p>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                <Table className="min-w-[800px]">
                    <TableHeader><TableRow>{/* ... Headers ... */}</TableRow></TableHeader>
                    <TableBody>
                        {sellerListings.map(product => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price)}</TableCell>
                                <TableCell>{product.stock_quantity}</TableCell>
                                <TableCell>{product.order_items[0]?.count || 0} Orders</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Link to={`/seller/edit-product/${product.id}`}>
                                        <Button variant="outline" size="sm"><Edit className="h-4 w-4" /> Edit</Button>
                                    </Link>
                                    <Button variant="destructive" size="sm"><MinusCircle className="h-4 w-4" /> Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          )}
        </section>
      )}

    </main>
  );
};

export default ProfilePage;