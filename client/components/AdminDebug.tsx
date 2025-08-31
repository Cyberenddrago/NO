import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminDebug() {
  const [users, setUsers] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testUsername, setTestUsername] = useState("vinesh");
  const [testPassword, setTestPassword] = useState("vinesh123");

  const listUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/debug/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error listing users:", error);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/debug/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: testUsername, password: testPassword }),
      });
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fixAllPasswords = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/debug/fix-passwords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setTestResult(data);
      // Refresh user list
      await listUsers();
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fixAdminPassword = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/debug/fix-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testAdminLogin = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/debug/test-admin");
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const unlockAccount = async (username: string = "vinesh") => {
    try {
      setLoading(true);
      const response = await fetch("/api/debug/unlock-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const unlockAllAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/debug/unlock-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkAccountStatus = async (username: string = "vinesh") => {
    try {
      setLoading(true);
      const response = await fetch(`/api/debug/account-status/${username}`);
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-6">Admin Debug Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Database Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={listUsers} disabled={loading} className="w-full">
              {loading ? "Loading..." : "List All Users"}
            </Button>
            
            {users.length > 0 && (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {users.map((user, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded border">
                    <div className="font-semibold">{user.name} ({user.username})</div>
                    <div className="text-sm text-gray-600">Role: {user.role}</div>
                    <div className="text-sm text-gray-600">Email: {user.email}</div>
                    <div className="text-sm">
                      Password: {user.passwordHashed ? "✅ Hashed" : "❌ Plain text"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Login */}
        <Card>
          <CardHeader>
            <CardTitle>Test Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testUsername">Username</Label>
              <Input
                id="testUsername"
                value={testUsername}
                onChange={(e) => setTestUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="testPassword">Password</Label>
              <Input
                id="testPassword"
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            
            <Button onClick={testLogin} disabled={loading} className="w-full">
              {loading ? "Testing..." : "Test Login"}
            </Button>
            
            {testResult && (
              <div className={`p-3 rounded border ${testResult.passwordValid ? 'bg-green-50 border-green-200' : testResult.error ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <pre className="text-sm">{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Fix Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Password & Account Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button onClick={testAdminLogin} disabled={loading} variant="outline">
                {loading ? "Testing..." : "Test Admin Login"}
              </Button>
              <Button onClick={fixAdminPassword} disabled={loading} variant="destructive">
                {loading ? "Fixing..." : "Fix Admin Password"}
              </Button>
              <Button onClick={() => checkAccountStatus("vinesh")} disabled={loading} variant="secondary">
                {loading ? "Checking..." : "Check Admin Status"}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button onClick={() => unlockAccount("vinesh")} disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? "Unlocking..." : "Unlock Admin Account"}
              </Button>
              <Button onClick={unlockAllAccounts} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                {loading ? "Unlocking..." : "Unlock All Accounts"}
              </Button>
              <Button onClick={fixAllPasswords} disabled={loading} variant="secondary">
                {loading ? "Fixing..." : "Fix All Passwords"}
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Admin tools: Test login, fix passwords, check account status, and unlock locked accounts
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User Credentials Reference */}
      <Card>
        <CardHeader>
          <CardTitle>User Credentials Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-red-50 rounded border">
              <div className="font-semibold">Admin</div>
              <div>vinesh / vinesh123</div>
            </div>
            <div className="p-3 bg-purple-50 rounded border">
              <div className="font-semibold">Supervisor</div>
              <div>shehkira / shehkira123</div>
              <div>frans / frans123</div>
            </div>
            <div className="p-3 bg-blue-50 rounded border">
              <div className="font-semibold">Apollo</div>
              <div>sune / sune123</div>
            </div>
            <div className="p-3 bg-green-50 rounded border">
              <div className="font-semibold">Staff</div>
              <div>lebo / lebo123</div>
              <div>freedom / freedom123</div>
              <div>keenan / keenan123</div>
              <div>zaundre / zaundre123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
