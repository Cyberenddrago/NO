import React, { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Float, Text3D, Center } from "@react-three/drei";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import * as THREE from "three";

// Product interface
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  inStock: boolean;
}

// Cart item interface
interface CartItem extends Product {
  quantity: number;
}

// Sample plumbing products data
const PLUMBING_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Professional Pipe Wrench Set",
    price: 450.00,
    image: "https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg",
    category: "Tools",
    description: "Heavy-duty pipe wrench set for professional plumbers",
    inStock: true
  },
  {
    id: "2", 
    name: "Copper Pipe Fittings Kit",
    price: 285.50,
    image: "https://images.pexels.com/photos/1093038/pexels-photo-1093038.jpeg",
    category: "Fittings",
    description: "Complete copper pipe fitting kit with joints and connections",
    inStock: true
  },
  {
    id: "3",
    name: "High-Pressure Water Pump",
    price: 1250.00,
    image: "https://images.pexels.com/photos/159160/gear-machine-mechanical-engine-159160.jpeg",
    category: "Pumps",
    description: "Industrial grade water pump for high-pressure applications",
    inStock: true
  },
  {
    id: "4",
    name: "PVC Pipe Bundle - 4 inch",
    price: 185.75,
    image: "https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg",
    category: "Pipes",
    description: "4-inch PVC pipes, 6-meter length bundle",
    inStock: true
  },
  {
    id: "5",
    name: "Emergency Leak Repair Kit",
    price: 95.00,
    image: "https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg",
    category: "Repair",
    description: "Emergency leak repair kit with sealants and patches",
    inStock: true
  },
  {
    id: "6",
    name: "Digital Water Flow Meter",
    price: 320.00,
    image: "https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg",
    category: "Meters",
    description: "Digital water flow meter with LCD display",
    inStock: true
  },
  {
    id: "7",
    name: "Toilet Installation Kit",
    price: 145.25,
    image: "https://images.pexels.com/photos/6419121/pexels-photo-6419121.jpeg",
    category: "Installation",
    description: "Complete toilet installation kit with all hardware",
    inStock: true
  },
  {
    id: "8",
    name: "Professional Drain Snake",
    price: 275.00,
    image: "https://images.pexels.com/photos/8101965/pexels-photo-8101965.jpeg",
    category: "Tools",
    description: "50-foot professional drain snake for blockage removal",
    inStock: true
  }
];

// Mouse-following 3D model component
function MouseFollowingModel() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, mouse } = useThree();
  
  useFrame(() => {
    if (meshRef.current) {
      // Follow mouse position
      meshRef.current.position.x = (mouse.x * viewport.width) / 4;
      meshRef.current.position.y = (mouse.y * viewport.height) / 4;
      
      // Add rotation based on mouse movement
      meshRef.current.rotation.y = mouse.x * 0.5;
      meshRef.current.rotation.x = mouse.y * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <dodecahedronGeometry args={[0.8]} />
      <meshStandardMaterial 
        color="#00d4ff" 
        metalness={0.8} 
        roughness={0.2}
        emissive="#001a33"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// Grid background component
function GridBackground() {
  return (
    <div className="fixed inset-0 z-0 opacity-20">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900" />
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  if (user) return <Navigate to="/dashboard" replace />;

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const submitCart = async () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (!customerInfo.name || !customerInfo.email) {
      toast({
        title: "Missing information",
        description: "Please fill in your name and email address.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Prepare email data
      const cartData = {
        customer: customerInfo,
        items: cart,
        total: getTotalPrice(),
        timestamp: new Date().toISOString()
      };

      // Send email to admin (you'll need to implement the email endpoint)
      const response = await fetch('/api/send-cart-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'admin@bbplumbing.co.za',
          subject: 'New Cart Submission - BlockBusters Plumbing',
          cartData
        }),
      });

      if (response.ok) {
        toast({
          title: "Cart submitted!",
          description: "Your cart has been sent to our team. We'll contact you soon.",
        });
        setCart([]);
        setCustomerInfo({ name: '', email: '', phone: '', address: '' });
        setIsCartOpen(false);
      } else {
        throw new Error('Failed to submit cart');
      }
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "There was an error submitting your cart. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
      <GridBackground />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-lg">BB</span>
              </div>
              <div>
                <div className="text-white font-bold text-xl">BlockBusters and Partners</div>
                <div className="text-cyan-400 text-sm font-medium">VRT FLOW.Outsourcing</div>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-slate-300 hover:text-cyan-400 transition-colors">Home</a>
              <a href="#products" className="text-slate-300 hover:text-cyan-400 transition-colors">Products</a>
              <a href="#about" className="text-slate-300 hover:text-cyan-400 transition-colors">About</a>
              <a href="#contact" className="text-slate-300 hover:text-cyan-400 transition-colors">Contact</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l1.5-6M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                <span>Cart ({cart.length})</span>
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
              <Link 
                to="/login" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center">
        {/* 3D Canvas Background */}
        <div className="absolute inset-0 z-10">
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} color="#00d4ff" />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#0099cc" />
            
            <Suspense fallback={null}>
              <Environment preset="night" />
              <MouseFollowingModel />
              
              {/* Floating background elements */}
              <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
                <mesh position={[-4, 2, -3]}>
                  <sphereGeometry args={[0.4, 32, 32]} />
                  <meshStandardMaterial color="#0099cc" metalness={0.8} roughness={0.2} />
                </mesh>
              </Float>
              
              <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
                <mesh position={[4, -1, -2]}>
                  <octahedronGeometry args={[0.3]} />
                  <meshStandardMaterial color="#00d4ff" metalness={0.7} roughness={0.3} />
                </mesh>
              </Float>
            </Suspense>
            
            <OrbitControls 
              enablePan={false} 
              enableZoom={false} 
              enableRotate={false}
            />
          </Canvas>
        </div>

        {/* Content Overlay */}
        <div className="relative z-20 text-center px-6 max-w-5xl mx-auto">
          <div className="mb-6">
            <span className="inline-block px-6 py-3 bg-cyan-500/20 backdrop-blur border border-cyan-400/30 text-cyan-300 rounded-full text-sm font-medium mb-6">
              You're Shopping South Africa Plumbing Suppliers 24/7 JHB Delivery. Tcs.
            </span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              Your plumbing,
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              built better
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            We transform your plumbing vision into tangible solutions with professional-grade supplies 
            that keep your projects flowing smoothly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a 
              href="#products"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Shop Now
            </a>
            <a 
              href="#about" 
              className="border-2 border-cyan-400/50 hover:border-cyan-400 text-cyan-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:bg-cyan-400/10"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 z-5">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="relative py-20 z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-6 py-3 bg-cyan-500/20 backdrop-blur border border-cyan-400/30 text-cyan-300 rounded-full text-sm font-medium mb-6">
              PROFESSIONAL SUPPLIES
            </span>
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                Premium Plumbing Products
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Quality tools and supplies for professional plumbers and contractors across South Africa.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PLUMBING_PRODUCTS.map((product) => (
              <div key={product.id} className="group bg-slate-800/50 backdrop-blur border border-cyan-500/20 rounded-2xl overflow-hidden hover:border-cyan-400/50 transition-all hover:transform hover:scale-105">
                <div className="relative overflow-hidden h-48">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      In Stock
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="text-cyan-400 text-sm font-medium mb-2">{product.category}</div>
                  <h3 className="text-white font-semibold text-lg mb-3">{product.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{product.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-cyan-400">
                      R{product.price.toFixed(2)}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-20 z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-6 py-3 bg-cyan-500/20 backdrop-blur border border-cyan-400/30 text-cyan-300 rounded-full text-sm font-medium mb-6">
                ABOUT US
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                <span className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                  South Africa's Premier Plumbing Supply
                </span>
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                With over two decades of experience, BlockBusters and Partners has been the trusted 
                partner for professional plumbers across Johannesburg and South Africa. We provide 
                24/7 delivery service and maintain the largest inventory of quality plumbing supplies.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-800/30 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">24/7</div>
                  <div className="text-slate-300">Delivery Service</div>
                </div>
                <div className="bg-slate-800/30 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">10K+</div>
                  <div className="text-slate-300">Products Available</div>
                </div>
              </div>
              
              <Link 
                to="/login"
                className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105"
              >
                Get Professional Access
              </Link>
            </div>
            
            <div className="relative">
              <div className="h-96 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl backdrop-blur border border-cyan-400/20 shadow-2xl overflow-hidden">
                <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                  <ambientLight intensity={0.6} />
                  <directionalLight position={[5, 5, 5]} intensity={0.8} color="#00d4ff" />
                  <Suspense fallback={null}>
                    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
                      <mesh>
                        <torusKnotGeometry args={[1, 0.3, 100, 16]} />
                        <meshStandardMaterial color="#00d4ff" metalness={0.8} roughness={0.2} />
                      </mesh>
                    </Float>
                  </Suspense>
                  <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={2} />
                </Canvas>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative bg-slate-900/50 backdrop-blur border-t border-cyan-500/20 py-16 z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-slate-900 font-bold text-lg">BB</span>
                </div>
                <div>
                  <div className="text-white font-bold text-xl">BlockBusters and Partners</div>
                  <div className="text-cyan-400 text-sm font-medium">VRT FLOW.Outsourcing</div>
                </div>
              </div>
              <p className="text-slate-300 mb-8 max-w-md">
                Your trusted partner for professional plumbing supplies across South Africa. 
                Quality products, reliable service, delivered 24/7.
              </p>
              <button
                onClick={() => setIsCartOpen(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                View Cart & Checkout
              </button>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-cyan-400">Products</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Pipes & Fittings</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Tools & Equipment</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Pumps & Motors</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Repair Kits</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-cyan-400">Support</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Delivery Info</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Technical Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-cyan-500/20 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} BlockBusters and Partners. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Shopping Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative bg-slate-800 rounded-2xl border border-cyan-500/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-cyan-500/20">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Shopping Cart</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-400 mb-4">Your cart is empty</div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{item.name}</h3>
                          <div className="text-cyan-400 font-bold">R{item.price.toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="bg-slate-600 hover:bg-slate-500 text-white w-8 h-8 rounded-lg flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="bg-slate-600 hover:bg-slate-500 text-white w-8 h-8 rounded-lg flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-cyan-500/20 pt-6">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xl font-semibold text-white">Total:</span>
                      <span className="text-2xl font-bold text-cyan-400">R{getTotalPrice().toFixed(2)}</span>
                    </div>
                    
                    {/* Customer Information Form */}
                    <div className="space-y-4 mb-6">
                      <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                          className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400"
                        />
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                          className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400"
                        />
                      </div>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400"
                      />
                      <textarea
                        placeholder="Delivery Address"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 h-20 resize-none"
                      />
                    </div>
                    
                    <button
                      onClick={submitCart}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
                    >
                      Submit Cart & Get Quote
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
