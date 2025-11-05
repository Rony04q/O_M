// src/pages/ProfilePage.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Type for the user's profile
type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

// Type for a single item in an order
type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  image_url: string | null;
};

// Type for a full order, matching our SQL function
type Order = {
  id: string;
  created_at: string;
  total_price: number;
  payment_mode: string;
  payment_status: string;
  delivery_status: string;
  items: OrderItem[];
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Get the user's profile data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) console.error('Error fetching profile:', profileError);
        else setProfile(profileData);
      }

      // 2. Get the user's order history
      // (This requires the 'get_my_orders' SQL function)
      const { data: ordersData, error: ordersError } = await supabase.rpc('get_my_orders');
      
      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else if (ordersData) {
        setOrders(ordersData);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4">Loading your profile...</div>;
  }

  if (!profile) {
    return <div className="container mx-auto p-4">Could not load profile. Are you logged in?</div>;
  }

  // Helper function to format the date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper to format delivery status with colors
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shipped':
        return <Badge variant="default" className="bg-blue-500 text-white">{status}</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-600 text-white">{status}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{status}</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Column 1: Profile Details */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>View and manage your account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={profile.full_name || ''} readOnly />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile.email || ''} readOnly />
              </div>
              <div>
                <Label htmlFor="role">Account Type</Label>
                <Input id="role" value={profile.role || 'customer'} readOnly 
                  className="capitalize"
                />
              </div>
              <Button className="w-full" variant="outline" disabled>Edit Profile</Button>
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Order History */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold mb-4">My Order History</h2>
          {orders.length === 0 ? (
            <p>You haven't placed any orders yet.</p>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.split('-')[0]}</CardTitle>
                      <CardDescription>Placed on {formatDate(order.created_at)}</CardDescription>
                    </div>
                    {getStatusBadge(order.delivery_status)}
                  </CardHeader>
                  <CardContent>
                    <ul className="divide-y divide-gray-200">
                      {order.items.map((item) => (
                        <li key={item.name} className="py-4 flex">
                          <img 
                            src={item.image_url || 'https://via.placeholder.com/64'} 
                            alt={item.name} 
                            className="h-16 w-16 rounded-md object-cover mr-4"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t pt-4 mt-4 flex justify-between items-center">
                      <div className="text-sm">
                        <span className="text-gray-500">Payment Status: </span>
                        <span className="font-medium capitalize">{order.payment_status}</span>
                      </div>
                      <div className="text-lg font-bold">
                        Total: ${order.total_price.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}