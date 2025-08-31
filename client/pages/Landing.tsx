import React, { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Float, Text3D, Center } from "@react-three/drei";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import * as THREE from "three";

// Modern building/pavilion-inspired 3D components
function ModernPavilion() {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.1) * 0.1;
      group.current.position.y = Math.sin(t * 0.2) * 0.1;
    }
  });

  return (
    <group ref={group}>
      {/* Main pavilion structure */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 0.1, 3]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Pillars */}
      {[[-1.2, 0, -1.2], [1.2, 0, -1.2], [-1.2, 0, 1.2], [1.2, 0, 1.2]].map((pos, i) => (
        <mesh key={i} position={[pos[0], 1, pos[2]]}>
          <cylinderGeometry args={[0.1, 0.12, 2]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      
      {/* Roof */}
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[3.5, 0.2, 3.5]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Glass walls */}
      <mesh position={[0, 1, -1.45]}>
        <planeGeometry args={[2.8, 1.8]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 1, 1.45]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.8, 1.8]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function FloatingElements() {
  return (
    <>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[-3, 2, -2]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
        </mesh>
      </Float>
      
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.8}>
        <mesh position={[3, -1, -3]}>
          <dodecahedronGeometry args={[0.4]} />
          <meshStandardMaterial color="#6366f1" metalness={0.7} roughness={0.3} />
        </mesh>
      </Float>
      
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh position={[2, 3, 1]}>
          <octahedronGeometry args={[0.35]} />
          <meshStandardMaterial color="#8b5cf6" metalness={0.6} roughness={0.4} />
        </mesh>
      </Float>
      
      <Float speed={1.8} rotationIntensity={0.6} floatIntensity={0.4}>
        <mesh position={[-2, -2, 2]}>
          <tetrahedronGeometry args={[0.4]} />
          <meshStandardMaterial color="#06b6d4" metalness={0.5} roughness={0.5} />
        </mesh>
      </Float>
    </>
  );
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 100;
  
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#64748b" transparent opacity={0.6} />
    </points>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-800/90 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-white font-semibold text-xl">VRTFlow</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-slate-300 hover:text-white transition-colors">Home</a>
              <a href="#solutions" className="text-slate-300 hover:text-white transition-colors">Solutions</a>
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
            </div>
            
            <Link 
              to="/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center">
        {/* 3D Canvas Background */}
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
            
            <Suspense fallback={null}>
              <Environment preset="city" />
              <ModernPavilion />
              <FloatingElements />
              <ParticleField />
            </Suspense>
            
            <OrbitControls 
              enablePan={false} 
              enableZoom={false} 
              autoRotate 
              autoRotateSpeed={0.5}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 3}
            />
          </Canvas>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-slate-800/80 backdrop-blur text-slate-300 rounded-full text-sm font-medium mb-4">
              DIGITAL WORKFLOW SOLUTIONS
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6 leading-tight">
            <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              VRTFlow
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Modern job management, time tracking, and PDF automation with stunning 3D visuals
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started
            </Link>
            <a 
              href="#features" 
              className="border-2 border-slate-300 hover:border-slate-400 text-slate-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:bg-slate-50"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-slate-400 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-20 bg-white/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-4">
              SOLUTIONS
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Complete Business Operations
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Streamline your workflow with our integrated platform for job management, staff coordination, and automated documentation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group p-8 bg-white/80 backdrop-blur rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Admin Dashboard</h3>
              <p className="text-slate-600">
                Comprehensive management tools for jobs, staff assignments, analytics, and system administration.
              </p>
            </div>
            
            <div className="group p-8 bg-white/80 backdrop-blur rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Staff Portal</h3>
              <p className="text-slate-600">
                Mobile-optimized interface for viewing assignments, time tracking, and form submissions.
              </p>
            </div>
            
            <div className="group p-8 bg-white/80 backdrop-blur rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">PDF Automation</h3>
              <p className="text-slate-600">
                Intelligent form processing and PDF generation with digital signatures and data binding.
              </p>
            </div>
            
            <div className="group p-8 bg-white/80 backdrop-blur rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Time Tracking</h3>
              <p className="text-slate-600">
                Precise time logging with GPS integration and automated payroll-ready reports.
              </p>
            </div>
            
            <div className="group p-8 bg-white/80 backdrop-blur rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-200 transition-colors">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">3D Experiences</h3>
              <p className="text-slate-600">
                Immersive 3D interfaces and visualizations that enhance user experience and engagement.
              </p>
            </div>
            
            <div className="group p-8 bg-white/80 backdrop-blur rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-200 transition-colors">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Enterprise Security</h3>
              <p className="text-slate-600">
                Role-based access control with enterprise-grade security and data protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-slate-800 text-white rounded-full text-sm font-medium mb-4">
              FEATURES
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Built for Modern Teams
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Every feature designed to streamline your operations and enhance productivity.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Lightning Fast</h3>
                  <p className="text-slate-600">Optimized performance with instant loading and real-time updates across all devices.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Mobile First</h3>
                  <p className="text-slate-600">Responsive design ensures perfect functionality on smartphones, tablets, and desktops.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">User Friendly</h3>
                  <p className="text-slate-600">Intuitive interface design that requires minimal training and maximizes productivity.</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl backdrop-blur border border-white/20 shadow-2xl overflow-hidden">
                <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                  <ambientLight intensity={0.6} />
                  <directionalLight position={[5, 5, 5]} intensity={0.8} />
                  <Suspense fallback={null}>
                    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
                      <mesh>
                        <torusKnotGeometry args={[1, 0.3, 100, 16]} />
                        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
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
      <footer id="contact" className="bg-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <span className="text-white font-semibold text-xl">VRTFlow</span>
              </div>
              <p className="text-slate-300 mb-6 max-w-md">
                Transform your business operations with our modern workflow solutions, combining powerful functionality with stunning 3D experiences.
              </p>
              <Link 
                to="/login" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Get Started Today
              </Link>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">Job Management</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Staff Portal</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Time Tracking</a></li>
                <li><a href="#" className="hover:text-white transition-colors">PDF Automation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} VRTFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
