// src/pages/SellerDashboard.tsx
import { useState, useEffect } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; 
import { Button } from '@/components/ui/button';
import { Package, Pencil, Trash2, PlusCircle } from 'lucide-react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Type for products fetched (similar to FetchedProduct, but includes seller_id)
type SellerProduct = {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
    seller_id: string;
};

const SellerDashboard = () => {
    const navigate = useNavigate();
    const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // --- Fetch User ID and Products on Load ---
    useEffect(() => {
        const fetchSellerData = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { navigate('/login'); return; }
                setUserId(user.id);

                // Fetch products filtered by the current user's ID
                const { data: productsData, error } = await supabase
                    .from('products')
                    .select('*') 
                    .eq('seller_id', user.id) // CRITICAL FILTER
                    .order('name', { ascending: true });

                if (error) throw error;
                setSellerProducts(productsData || []);

            } catch (error) {
                console.error('Error fetching seller products:', error);
                setSellerProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSellerData();
    }, [navigate]);

    // --- Handler for Deleting a Product ---
    const handleDeleteProduct = async (productId: string, productName: string) => {
        if (!window.confirm(`Are you sure you want to delete the product "${productName}"? This action cannot be undone.`)) {
            return;
        }
        try {
            // Delete product, restricted by both ID and seller_id for security
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId)
                .eq('seller_id', userId); // SECURITY: Ensure only the current seller can delete

            if (error) throw error;

            setSellerProducts(prev => prev.filter(p => p.id !== productId)); // Optimistic update
            alert(`${productName} deleted successfully.`);

        } catch (error: any) {
            console.error('Error deleting product:', error.message);
            alert(`Failed to delete product: ${error.message}`);
        }
    };
    
    // --- Handler for Editing (Placeholder) ---
    const handleEditProduct = (productId: string) => {
        alert("Edit functionality not implemented yet. You can now build the edit form.");
    };


    // --- RENDERING ---
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">My Product Listings</h1>

            {/* Quick Link to Add New Product */}
            <div className="flex justify-between items-center">
                <p className='text-gray-600'>Manage inventory and view product stock levels.</p>
                <Link to="/seller/add-product">
                    <Button>
                        <PlusCircle className="h-5 w-5 mr-2" />
                        List New Product
                    </Button>
                </Link>
            </div>

            {/* Product Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Products</CardTitle>
                </CardHeader>
                <CardContent className='p-0'>
                    {loading ? (
                        <p className='p-6 text-center'>Loading your products...</p>
                    ) : sellerProducts.length === 0 ? (
                        <p className='p-6 text-center'>You have no active listings.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[700px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Product ID (UUID)</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sellerProducts.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <Package className="h-4 w-4 text-emerald-600" />
                                                {product.name}
                                            </TableCell>
                                            <TableCell>
                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price)}
                                            </TableCell>
                                            <TableCell>
                                                <span className={product.stock_quantity <= 5 ? 'text-red-500 font-semibold' : 'text-gray-700'}>
                                                    {product.stock_quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground font-mono">
                                                {product.id.substring(0, 8)}...
                                            </TableCell>
                                            <TableCell className="text-right space-x-2 whitespace-nowrap">
                                                <Button variant="outline" size="sm" onClick={() => handleEditProduct(product.id)}>
                                                    <Pencil className="h-4 w-4 mr-1" /> Edit
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id, product.name)}>
                                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SellerDashboard;