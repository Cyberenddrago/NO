import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface EndpointStatus {
  endpoint: string;
  status: 'checking' | 'success' | 'error' | 'timeout';
  responseTime?: number;
  errorMessage?: string;
  statusCode?: number;
}

export function NetworkDiagnostics() {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { endpoint: '/api/ping', status: 'checking' },
    { endpoint: '/api/auth/users', status: 'checking' },
    { endpoint: '/api/jobs', status: 'checking' },
    { endpoint: '/api/forms', status: 'checking' },
    { endpoint: '/api/companies', status: 'checking' },
    { endpoint: '/api/mongo/status', status: 'checking' },
  ]);
  
  const [testing, setTesting] = useState(false);
  const [lastTest, setLastTest] = useState<Date | null>(null);

  const checkEndpoint = async (endpoint: string): Promise<EndpointStatus> => {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await fetch(endpoint, {
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint,
        status: response.ok ? 'success' : 'error',
        responseTime,
        statusCode: response.status,
        errorMessage: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          endpoint,
          status: 'timeout',
          responseTime,
          errorMessage: 'Request timed out (>5s)'
        };
      }
      
      return {
        endpoint,
        status: 'error',
        responseTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runDiagnostics = async () => {
    setTesting(true);
    setLastTest(new Date());
    
    // Reset all to checking state
    setEndpoints(prev => prev.map(ep => ({ ...ep, status: 'checking' as const })));
    
    // Test all endpoints
    const results = await Promise.all(
      endpoints.map(ep => checkEndpoint(ep.endpoint))
    );
    
    setEndpoints(results);
    setTesting(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusBadge = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'timeout':
        return <Badge className="bg-orange-100 text-orange-800">Timeout</Badge>;
    }
  };

  const allSuccess = endpoints.every(ep => ep.status === 'success');
  const anyError = endpoints.some(ep => ep.status === 'error' || ep.status === 'timeout');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {allSuccess ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
            Network Diagnostics
          </CardTitle>
          <Button 
            onClick={runDiagnostics} 
            disabled={testing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            Test Again
          </Button>
        </div>
        {lastTest && (
          <p className="text-sm text-gray-500">
            Last tested: {lastTest.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {anyError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some API endpoints are not responding. This may indicate server issues or network connectivity problems.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div key={ep.endpoint} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(ep.status)}
                <div>
                  <p className="font-medium">{ep.endpoint}</p>
                  {ep.errorMessage && (
                    <p className="text-sm text-red-600">{ep.errorMessage}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ep.responseTime && (
                  <span className="text-sm text-gray-500">{ep.responseTime}ms</span>
                )}
                {getStatusBadge(ep.status)}
              </div>
            </div>
          ))}
        </div>
        
        {allSuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All API endpoints are responding normally. Network connectivity is good! 🌺
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Environment:</strong> {window.location.hostname}</p>
          <p><strong>Protocol:</strong> {window.location.protocol}</p>
          <p><strong>Current URL:</strong> {window.location.href}</p>
        </div>
      </CardContent>
    </Card>
  );
}
