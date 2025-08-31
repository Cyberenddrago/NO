import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface AuthCheckerProps {
  children: React.ReactNode;
}

export function AuthChecker({ children }: AuthCheckerProps) {
  const { user, isLoading } = useAuth();
  const [authValid, setAuthValid] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkAuth = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.log('🔐 No auth token found');
      setAuthValid(false);
      return;
    }

    setChecking(true);
    try {
      console.log('🔍 Checking authentication...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch("/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`🔐 Auth check response: ${response.status} ${response.statusText}`);
      setAuthValid(response.ok);

    } catch (error) {
      console.error('❌ Auth check failed:', error);

      // Don't immediately fail on network errors - could be temporary
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⏱️ Auth check timed out');
      }

      // For network errors, don't immediately invalidate auth
      // The user might still be logged in, just having connectivity issues
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('🌐 Network error during auth check - assuming valid for now');
        setAuthValid(null); // Unknown state
      } else {
        setAuthValid(false);
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!isLoading && user) {
      checkAuth();
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please log in to access the admin dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  if (authValid === false) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Authentication failed. Please refresh or log in again.</span>
          <Button variant="outline" size="sm" onClick={checkAuth} disabled={checking}>
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
