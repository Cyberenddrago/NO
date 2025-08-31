import React, { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Built-in primitives + custom GLTF
type ModelType = "torus" | "box" | "sphere" | "cone" | "dodeca" | "custom";

function AnimatedPrimitive({ model, color = "#3b82f6" }: { model: Exclude<ModelType, "custom">; color?: string }) {
  const ref = useRef<any>();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const y = typeof window !== "undefined" ? window.scrollY : 0;
    const progress = Math.min(1, Math.max(0, y / 800));
    if (ref.current) {
      ref.current.rotation.x = t * 0.2 + progress * Math.PI * 0.5;
      ref.current.rotation.y = t * 0.3 + progress * Math.PI;
      ref.current.position.z = -progress * 2;
      const s = 1 + progress * 0.3;
      ref.current.scale.set(s, s, s);
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      {model === "torus" && <torusKnotGeometry args={[1.2, 0.4, 150, 20]} />}
      {model === "box" && <boxGeometry args={[2, 2, 2, 2, 2, 2]} />}
      {model === "sphere" && <sphereGeometry args={[1.6, 64, 64]} />}
      {model === "cone" && <coneGeometry args={[1.4, 2.2, 64]} />}
      {model === "dodeca" && <dodecahedronGeometry args={[1.6, 0]} />}
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
    </mesh>
  );
}

function GltfModel({ url }: { url: string }) {
  const group = useRef<any>();
  const { scene } = useGLTF(url, true);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const y = typeof window !== "undefined" ? window.scrollY : 0;
    const progress = Math.min(1, Math.max(0, y / 800));
    if (group.current) {
      group.current.rotation.y = t * 0.4 + progress * Math.PI;
      group.current.position.z = -progress * 2.5;
      const s = 0.9 + progress * 0.4;
      group.current.scale.set(s, s, s);
    }
  });
  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [model, setModel] = useState<ModelType>(() => (localStorage.getItem("landing.model") as ModelType) || "torus");
  const [color, setColor] = useState(() => localStorage.getItem("landing.color") || "#3b82f6");
  const [customUrl, setCustomUrl] = useState<string>("");
  const [customUrlInput, setCustomUrlInput] = useState<string>("");
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => { localStorage.setItem("landing.model", model); }, [model]);
  useEffect(() => { localStorage.setItem("landing.color", color); }, [color]);

  // Minimal IndexedDB helpers for persisting uploaded model blob
  function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("VRTFlowModels", 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("models")) {
          db.createObjectStore("models", { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbPutBlob(id: string, blob: Blob) {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("models", "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      const store = tx.objectStore("models");
      store.put({ id, blob });
    });
  }
  async function idbGetBlob(id: string): Promise<Blob | null> {
    const db = await openDb();
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction("models", "readonly");
      const store = tx.objectStore("models");
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? (req.result as any).blob as Blob : null);
      req.onerror = () => reject(req.error);
    });
  }

  useEffect(() => {
    const type = localStorage.getItem("landing.custom.type");
    if (type === "url") {
      const url = localStorage.getItem("landing.custom.url") || "";
      if (url) { setCustomUrl(url); setModel("custom"); }
    } else if (type === "blob") {
      const id = localStorage.getItem("landing.custom.blobId") || "customModel";
      idbGetBlob(id).then((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = url;
          setCustomUrl(url);
          setModel("custom");
        }
      }).catch(() => {});
    }
    return () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); };
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleFile = async (file?: File) => {
    if (!file) return;
    try {
      await idbPutBlob("customModel", file);
      localStorage.setItem("landing.custom.type", "blob");
      localStorage.setItem("landing.custom.blobId", "customModel");
    } catch {}
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setCustomUrl(url);
    setModel("custom");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold text-xl">VRTFlow</div>
          <Link to="/login" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Login</Link>
        </div>
      </header>

      <section className="relative h-[70vh]">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <Suspense fallback={null}>
            {model === "custom" && customUrl ? (
              <GltfModel url={customUrl} />
            ) : (
              <AnimatedPrimitive model={(model as Exclude<ModelType, "custom">)} color={color} />
            )}
          </Suspense>
          <OrbitControls enablePan={false} enableZoom={false} />
        </Canvas>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900">BB Paper Solution Ops</h1>
            <p className="mt-4 text-gray-600 max-w-xl mx-auto">Assign jobs, track time, complete forms, and generate PDFs with a modern, mobile-first workflow.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <a href="#features" className="px-4 py-2 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50">Explore</a>
              <Link to="/login" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Get Started</Link>
            </div>
          </div>
        </div>
        {/* Model controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-wrap items-center justify-center gap-2 bg-white/85 backdrop-blur px-3 py-2 rounded-full border">
          {(["torus","box","sphere","cone","dodeca"] as Exclude<ModelType, "custom">[]).map((m) => (
            <button
              key={m}
              onClick={() => setModel(m)}
              className={`px-3 py-1 rounded-full text-sm ${model===m? 'bg-blue-600 text-white':'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {m.charAt(0).toUpperCase()+m.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setModel("custom")}
            className={`px-3 py-1 rounded-full text-sm ${model==='custom'? 'bg-purple-600 text-white':'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            title="Load a GLB/GLTF model"
          >
            Custom
          </button>
          <div className="ml-2 hidden sm:flex items-center gap-1">
            <span className="text-xs text-gray-600">Color</span>
            {['#3b82f6','#16a34a','#e11d48','#0ea5e9','#9333ea'].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-5 w-5 rounded-full border ${color===c? 'ring-2 ring-blue-500':''}`}
                style={{ backgroundColor: c }}
                aria-label={`Set color ${c}`}
              />
            ))}
          </div>
          <label className="ml-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200">
            Upload
            <input
              type="file"
              accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          <div className="flex items-center gap-2 ml-2">
            <input
              type="url"
              placeholder="Paste GLB/GLTF URL"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              className="h-8 w-40 sm:w-64 px-2 rounded-md border border-gray-300 text-sm"
            />
            <button
              onClick={() => {
                if (customUrlInput) {
                  setCustomUrl(customUrlInput);
                  setModel("custom");
                  localStorage.setItem("landing.custom.type", "url");
                  localStorage.setItem("landing.custom.url", customUrlInput);
                }
              }}
              className="px-3 py-1 rounded-md bg-gray-800 text-white text-sm hover:bg-black"
            >
              Load
            </button>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-4 py-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border bg-white shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-semibold">Admin Dashboard</h3>
          <p className="text-gray-600 mt-2">Manage jobs, staff, companies, and analytics with powerful tools.</p>
        </div>
        <div className="p-6 rounded-xl border bg-white shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-semibold">Staff Portal</h3>
          <p className="text-gray-600 mt-2">View assignments, check in/out, and submit forms from any device.</p>
        </div>
        <div className="p-6 rounded-xl border bg-white shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-semibold">PDF Automation</h3>
          <p className="text-gray-600 mt-2">Populate and export company PDFs with signatures and data bindings.</p>
        </div>
        <div className="p-6 rounded-xl border bg-white shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-semibold">Time Tracking</h3>
          <p className="text-gray-600 mt-2">Accurate, role-based time logs with weekly exports for payroll.</p>
        </div>
        <div className="p-6 rounded-xl border bg-white shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-semibold">3D Visuals</h3>
          <p className="text-gray-600 mt-2">Delightful 3D touches built with Three.js to enhance UX.</p>
        </div>
        <div className="p-6 rounded-xl border bg-white shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-semibold">Secure</h3>
          <p className="text-gray-600 mt-2">Role-based access control with admin/supervisor/staff segregation.</p>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-gray-500">© {new Date().getFullYear()} VRTFlow</footer>
    </div>
  );
}

// Drei GLTF loader needs this for TS to avoid warnings when importing GLTFs dynamically
useGLTF.preload;
