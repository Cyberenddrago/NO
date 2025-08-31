import { AdminDebug } from "@/components/AdminDebug";

export default function DebugPage() {
  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        <a 
          href="/" 
          className="bg-blue-500 text-white px-4 py-2 rounded shadow-lg inline-block"
        >
          Go to Login
        </a>
      </div>
      <AdminDebug />
    </div>
  );
}
