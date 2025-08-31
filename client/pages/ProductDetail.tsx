import React, { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Product interface (should match the one in Landing.tsx)
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  inStock: boolean;
  featured?: boolean;
  specifications?: Record<string, string>;
  gallery?: string[];
}

// Sample detailed product data
const PRODUCT_DETAILS: Record<string, Product> = {
  "1": {
    id: "1",
    name: "Professional Pipe Wrench Set",
    price: 450.00,
    image: "https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg",
    category: "Tools",
    description: "Heavy-duty pipe wrench set designed for professional plumbers and contractors. This comprehensive set includes multiple sizes to handle various pipe diameters and provides excellent grip and leverage for tough jobs.",
    inStock: true,
    featured: true,
    specifications: {
      "Material": "Forged Steel",
      "Sizes Included": "10\", 14\", 18\", 24\"",
      "Weight": "3.2 kg",
      "Warranty": "2 Years",
      "Country of Origin": "Germany"
    },
    gallery: [
      "https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg",
      "https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg",
      "https://images.pexels.com/photos/8101965/pexels-photo-8101965.jpeg"
    ]
  },
  "2": {
    id: "2",
    name: "Copper Pipe Fittings Kit",
    price: 285.50,
    image: "https://images.pexels.com/photos/1093038/pexels-photo-1093038.jpeg",
    category: "Fittings",
    description: "Complete copper pipe fitting kit with joints, elbows, tees, and connections. Perfect for residential and commercial plumbing installations with superior corrosion resistance.",
    inStock: true,
    featured: true,
    specifications: {
      "Material": "99.9% Pure Copper",
      "Sizes": "15mm, 22mm, 28mm",
      "Pieces": "50 assorted fittings",
      "Pressure Rating": "16 bar",
      "Standard": "SABS approved"
    },
    gallery: [
      "https://images.pexels.com/photos/1093038/pexels-photo-1093038.jpeg",
      "https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg"
    ]
  }
  // Add more products as needed
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (user) return <Navigate to="/dashboard" replace />;

  const product = id ? PRODUCT_DETAILS[id] : null;

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
          <p className="text-slate-300 mb-8">The product you're looking for doesn't exist.</p>
          <Link 
            to="/" 
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const addToCart = () => {
    // In a real app, you'd use a global cart state or context
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} added to cart.`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-cyan-500/20 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-sm">BB</span>
              </div>
              <div>
                <div className="text-white font-bold">BlockBusters and Partners</div>
                <div className="text-cyan-400 text-xs">VRT FLOW.Outsourcing</div>
              </div>
            </Link>
            
            <Link 
              to="/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="bg-slate-800/50 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex text-sm">
            <Link to="/" className="text-cyan-400 hover:text-cyan-300">Home</Link>
            <span className="mx-2 text-slate-400">/</span>
            <Link to="/#products" className="text-cyan-400 hover:text-cyan-300">Products</Link>
            <span className="mx-2 text-slate-400">/</span>
            <span className="text-slate-300">{product.category}</span>
            <span className="mx-2 text-slate-400">/</span>
            <span className="text-white">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-slate-800 rounded-2xl overflow-hidden">
              <img 
                src={product.gallery?.[selectedImage] || product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {product.gallery && product.gallery.length > 1 && (
              <div className="flex gap-4">
                {product.gallery.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-cyan-400' 
                        : 'border-transparent hover:border-slate-600'
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="text-cyan-400 font-medium mb-2">{product.category}</div>
              <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
              <div className="text-3xl font-bold text-cyan-400 mb-6">R{product.price.toFixed(2)}</div>
              
              <div className="flex items-center gap-4 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.inStock 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                {product.featured && (
                  <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-sm font-medium">
                    Featured
                  </span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Description</h3>
              <p className="text-slate-300 leading-relaxed">{product.description}</p>
            </div>

            {product.specifications && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Specifications</h3>
                <div className="bg-slate-800/30 rounded-xl p-4 space-y-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-slate-700/50 last:border-0">
                      <span className="text-slate-400">{key}:</span>
                      <span className="text-white font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-slate-800 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-white font-medium border-x border-slate-700">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-slate-400">
                    Total: <span className="text-cyan-400 font-bold">R{(product.price * quantity).toFixed(2)}</span>
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={addToCart}
                  disabled={!product.inStock}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 disabled:transform-none"
                >
                  Add to Cart
                </button>
                <button className="px-6 py-4 border-2 border-cyan-400/50 hover:border-cyan-400 text-cyan-300 hover:text-white rounded-xl transition-all hover:bg-cyan-400/10">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Additional Actions */}
            <div className="flex gap-4 pt-6 border-t border-slate-700">
              <button className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share Product
              </button>
              <button className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ask Question
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-white mb-8">Related Products</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {Object.values(PRODUCT_DETAILS).filter(p => p.id !== product.id && p.category === product.category).map((relatedProduct) => (
              <Link 
                key={relatedProduct.id}
                to={`/product/${relatedProduct.id}`}
                className="bg-slate-800/30 backdrop-blur border border-cyan-500/20 rounded-xl overflow-hidden hover:border-cyan-400/50 transition-all hover:transform hover:scale-105"
              >
                <img src={relatedProduct.image} alt={relatedProduct.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="text-white font-medium mb-2">{relatedProduct.name}</h3>
                  <div className="text-cyan-400 font-bold">R{relatedProduct.price.toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
