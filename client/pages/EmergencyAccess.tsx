import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Unlock, RefreshCw } from "lucide-react";

export default function EmergencyAccess() {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleEmergencyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      
      if (response.ok && data.user.username === 'rona') {
        setIsLoggedIn(true);
        setResult({ message: "Emergency admin access granted", user: data.user });
      } else {
        setResult({ error: "Invalid emergency admin credentials" });
      }
    } catch (error) {
      setResult({ error: error.message });
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
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
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
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-800">Emergency Admin Access</CardTitle>
            <p className="text-red-600 text-sm">
              This is for emergency account recovery only
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmergencyLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Emergency Username</Label>
                <Input
                  id="username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="Enter emergency username"
                  className="border-red-300 focus:border-red-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Emergency Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="Enter emergency password"
                  className="border-red-300 focus:border-red-500"
                  required
                />
              </div>

              {result && (
                <Alert variant={result.error ? "destructive" : "default"}>
                  <AlertDescription>
                    <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700" 
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Emergency Access"}
              </Button>
            </form>
            
            <div className="mt-4 pt-4 border-t text-center">
              <a href="/" className="text-sm text-gray-600 hover:text-gray-800">
                ← Back to Normal Login
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-red-200 mb-6">
          <CardHeader className="bg-red-100">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Emergency Admin Panel - Account Recovery
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Button 
                onClick={unlockAllAccounts} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 h-16"
              >
                <Unlock className="mr-2 h-5 w-5" />
                {loading ? "Unlocking..." : "Unlock All Accounts"}
              </Button>
              
              <Button 
                onClick={fixAllPasswords} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 h-16"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                {loading ? "Fixing..." : "Fix All Passwords"}
              </Button>
            </div>

            {result && (
              <Alert className={`${result.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <AlertDescription>
                  <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
              <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Click "Unlock All Accounts" to remove all account locks</li>
                <li>Click "Fix All Passwords" to reset all passwords to defaults</li>
                <li>After fixing, you can login with: vinesh/vinesh123</li>
                <li>Go back to normal login page once accounts are recovered</li>
              </ol>
            </div>

            <div className="mt-4 text-center">
              <a href="/" className="text-red-600 hover:text-red-800 font-medium">
                ← Return to Normal Login
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
