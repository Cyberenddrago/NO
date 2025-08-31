import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User as UserIcon, Building2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Company, Organization } from "@shared/types";
import { useAuth } from "@/contexts/AuthContext";

interface CreateStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStaffCreated: () => void;
}

export function CreateStaffModal({ open, onOpenChange, onStaffCreated }: CreateStaffModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const allowedCompanies = useMemo(() => {
    const uCompanyId = user?.companyId;
    const orgNames = new Set((orgs || []).map(o => (o.name || '').trim().toLowerCase()));
    return (companies || []).filter(c => {
      if (uCompanyId && c.id === uCompanyId) return true; // creator's company
      const cname = (c.name || '').trim().toLowerCase();
      // treat companies matching organizations as "new companies using the system"
      if (orgNames.has(cname)) return true;
      return false;
    });
  }, [companies, orgs, user?.companyId]);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "staff" as "staff" | "supervisor" | "apollo",
    companyId: "",
    organizations: [] as string[],
  });

  useEffect(() => {
    if (!open) return;
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [resCompanies, resOrgs] = await Promise.all([
          fetch("/api/companies", { headers }),
          fetch("/api/organizations", { headers }),
        ]);
        if (resCompanies.ok) {
          const data = await resCompanies.json();
          setCompanies(Array.isArray(data) ? data : []);
        }
        if (resOrgs.ok) {
          const data = await resOrgs.json();
          setOrgs(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchCompanies();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
          companyId: form.companyId || undefined,
          organizations: form.organizations,
        }),
      });

      if (res.ok) {
        onStaffCreated();
        onOpenChange(false);
        setForm({ name: "", username: "", email: "", password: "", role: "staff", companyId: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create staff member");
      }
    } catch (e) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">Add New Staff Member</DialogTitle>
          <DialogDescription className="text-center">
            Create a staff account and optionally link to a company
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} placeholder="e.g. jdoe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase() })} placeholder="name@example.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" required />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(value: any) => setForm({ ...form, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="apollo">Apollo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Company (job insurer - optional)</Label>
            <Select value={form.companyId || "none"} onValueChange={(value) => setForm({ ...form, companyId: value === "none" ? "" : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {allowedCompanies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span>{c.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assign to Companies Using System (organizations)</Label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
              {orgs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">No organizations available</p>
              ) : (
                orgs.map((org) => {
                  const selected = form.organizations.includes(org.id);
                  return (
                    <button
                      key={org.id}
                      type="button"
                      className={`text-left p-2 rounded border ${selected ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'}`}
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          organizations: selected ? prev.organizations.filter(id => id !== org.id) : [...prev.organizations, org.id]
                        }));
                      }}
                    >
                      <div className="font-medium">{org.name}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Staff"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
