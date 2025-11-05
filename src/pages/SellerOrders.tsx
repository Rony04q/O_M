// src/pages/SellerOrders.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// This type matches the JSON object we built in the SQL function
type SellerOrder = {
  order_id: string;
  created_at: string;
  payment_mode: string;
  payment_status: string;
  delivery_status: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  price: number;
};

export default function SellerOrders() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH ORDERS ---
  async function fetchOrders() {
    setLoading(true);
    // Call the database function
    const { data, error } = await supabase.rpc('get_seller_orders');

    if (error) {
      console.error('Error fetching seller orders:', error.message);
    } else if (data) {
      // The function returns a single JSON array, so we use data
      setOrders(data as SellerOrder[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- 2. HANDLE STATUS UPDATE ---
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // Update the local state immediately for a fast UI
    setOrders(currentOrders =>
      currentOrders.map(order =>
        order.order_id === orderId
          ? { ...order, delivery_status: newStatus }
          : order
      )
    );

    // Update the database in the background
    const { error } = await supabase
      .from('orders')
      .update({ delivery_status: newStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating status:', error.message);
      // Revert state if db update fails
      fetchOrders(); // Easiest way to re-sync
    }
  };

  if (loading) {
    return <h1 className="text-2xl font-bold">Loading your orders...</h1>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold">No orders found.</h2>
          <p className="text-gray-500 mt-2">
            When a customer buys one of your products, it will show up here.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {orders.map((order) => (
              <li key={`${order.order_id}-${order.product_name}`} className="p-4 grid grid-cols-6 gap-4 items-center">
                
                <div className="col-span-2">
                  <p className="font-semibold text-gray-800">{order.product_name}</p>
                  <p className="text-sm text-gray-500">Customer: {order.customer_name}</p>
                  <p className="text-sm text-gray-500">Qty: {order.quantity}</p>
                </div>

                <div className="text-sm">
                  <p className="font-medium">Payment</p>
                  <p className="text-gray-600">{order.payment_mode}</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.payment_status}
                  </span>
                </div>

                <div className="col-span-2">
                  <p className="font-medium mb-1">Delivery Status</p>
                  <Select
                    value={order.delivery_status}
                    onValueChange={(newStatus: string) => handleStatusChange(order.order_id, newStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Set status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-800">
                    ${(order.price * order.quantity).toFixed(2)}
                  </p>
                </div>

              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}