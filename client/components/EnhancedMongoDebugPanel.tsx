import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Database, 
  Users, 
  Briefcase, 
  Building2, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Shield,
  Activity
} from "lucide-react";
import { NetworkDiagnostics } from "./NetworkDiagnostics";
import { MongoDebugPanel } from "./MongoDebugPanel";

interface SecurityEvent {
  timestamp: string;
  username?: string;
  action: string;
  resource: string;
  method: string;
  statusCode?: number;
  suspicious: boolean;
  reason?: string;
  ip: string;
}

interface SecuritySummary {
  totalEvents: number;
  suspiciousEvents: number;
  lastHourEvents: number;
}

export function EnhancedMongoDebugPanel() {
  const { user } = useAuth();
  const [securityData, setSecurityData] = useState<{
    events: SecurityEvent[];
    summary: SecuritySummary;
  } | null>(null);
  const [loadingSecurityData, setLoadingSecurityData] = useState(false);
  const [securityDataError, setSecurityDataError] = useState<string | null>(null);

  const fetchSecurityData = async () => {
    setLoadingSecurityData(true);
    setSecurityDataError(null);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setSecurityDataError("No authentication token found. Please log in again.");
        return;
      }

      const response = await fetch("/api/admin/security-events", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSecurityData(data);
        console.log("✅ Security data loaded successfully");
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        setSecurityDataError(errorMessage);
        console.error("Failed to fetch security data:", {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network error occurred";
      setSecurityDataError(errorMessage);
      console.error("Error fetching security data:", error);
    } finally {
      setLoadingSecurityData(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchSecurityData();
    }
  }, [user]);

  if (user?.role !== "admin") {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This debug panel is only available to administrators.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Debug & Security Panel 🌺</h2>
        <Button 
          onClick={fetchSecurityData} 
          disabled={loadingSecurityData}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingSecurityData ? 'animate-spin' : ''}`} />
          Refresh Security Data
        </Button>
      </div>

      <Tabs defaultValue="network" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="mongodb">MongoDB</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="network">
          <NetworkDiagnostics />
        </TabsContent>

        <TabsContent value="mongodb">
          <MongoDebugPanel />
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4">
            {/* Error Display */}
            {securityDataError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Failed to fetch security data:</strong> {securityDataError}
                </AlertDescription>
              </Alert>
            )}
            {/* Security Summary */}
            {securityData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Events</p>
                        <p className="text-2xl font-bold">{securityData.summary.totalEvents}</p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Suspicious Events</p>
                        <p className="text-2xl font-bold text-red-600">{securityData.summary.suspiciousEvents}</p>
                      </div>
                      <Shield className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Last Hour</p>
                        <p className="text-2xl font-bold">{securityData.summary.lastHourEvents}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Security Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Recent Security Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {securityData ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {securityData.events.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No security events recorded</p>
                    ) : (
                      securityData.events.map((event, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded border ${event.suspicious ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {event.suspicious ? (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                <span className="font-medium">{event.action}</span>
                                <Badge variant={event.suspicious ? "destructive" : "secondary"}>
                                  {event.method}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {event.username || 'Anonymous'} → {event.resource}
                              </p>
                              {event.reason && (
                                <p className="text-sm text-red-600 mt-1">{event.reason}</p>
                              )}
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                              <br />
                              {event.ip}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Button onClick={fetchSecurityData} disabled={loadingSecurityData}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingSecurityData ? 'animate-spin' : ''}`} />
                      Load Security Events
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Environment</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Domain:</strong> {window.location.hostname}</p>
                    <p><strong>Protocol:</strong> {window.location.protocol}</p>
                    <p><strong>Port:</strong> {window.location.port || 'default'}</p>
                    <p><strong>Current Path:</strong> {window.location.pathname}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">User Session</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Username:</strong> {user?.username}</p>
                    <p><strong>Name:</strong> {user?.name}</p>
                    <p><strong>Role:</strong> {user?.role}</p>
                    <p><strong>Auth Token:</strong> {localStorage.getItem("auth_token") ? "Present" : "Missing"}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-2">Security Measures Implemented ✅</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Auth tokens server-side validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Role-based access control</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Data filtering by user role</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Sensitive data protection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Security event monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Rate limiting on sensitive endpoints</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
