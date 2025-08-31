import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Database, 
  Users, 
  Briefcase, 
  Building2, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle 
} from "lucide-react";

interface MongoData {
  jobs: any[];
  users: any[];
  companies: any[];
  submissions: any[];
  syncStatus: any;
}

export function MongoDebugPanel() {
  const { user } = useAuth();
  const [data, setData] = useState<MongoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMongoData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [jobsRes, usersRes, companiesRes, submissionsRes, statusRes] = await Promise.allSettled([
        fetch("/api/jobs", { headers }),
        fetch("/api/auth/users", { headers }),
        fetch("/api/companies", { headers }),
        fetch("/api/form-submissions", { headers }),
        fetch("/api/mongo/status", { headers })
      ]);

      const results = {
        jobs: [],
        users: [],
        companies: [],
        submissions: [],
        syncStatus: null
      };

      // Handle jobs
      if (jobsRes.status === 'fulfilled' && jobsRes.value.ok) {
        results.jobs = await jobsRes.value.json();
      }

      // Handle users
      if (usersRes.status === 'fulfilled') {
        if (usersRes.value.ok) {
          results.users = await usersRes.value.json();
        } else {
          const errorText = await usersRes.value.text();
          setError(`Users API failed: ${errorText}`);
        }
      }

      // Handle companies
      if (companiesRes.status === 'fulfilled' && companiesRes.value.ok) {
        results.companies = await companiesRes.value.json();
      }

      // Handle submissions
      if (submissionsRes.status === 'fulfilled' && submissionsRes.value.ok) {
        results.submissions = await submissionsRes.value.json();
      }

      // Handle sync status
      if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
        results.syncStatus = await statusRes.value.json();
      }

      setData(results);
    } catch (error) {
      setError(`Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerManualSync = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/mongo/sync", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        alert("Manual sync triggered successfully! 🌺");
        fetchMongoData(); // Refresh data
      } else {
        alert("Failed to trigger manual sync");
      }
    } catch (error) {
      alert("Error triggering manual sync");
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchMongoData();
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
        <h2 className="text-2xl font-bold">MongoDB Debug Panel 🌺</h2>
        <div className="space-x-2">
          <Button 
            onClick={fetchMongoData} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button 
            onClick={triggerManualSync}
            variant="default"
          >
            <Database className="h-4 w-4 mr-2" />
            Manual Sync
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sync Status */}
      {data?.syncStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              MongoDB Sync Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="flex items-center gap-2">
                  {data.syncStatus.isRunning ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>{data.syncStatus.isRunning ? 'Running' : 'Stopped'}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Sync</p>
                <p className="font-medium">
                  {data.syncStatus.lastSync 
                    ? new Date(data.syncStatus.lastSync).toLocaleString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jobs</p>
                <p className="text-2xl font-bold">{data?.jobs?.length || 0}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Users/Staff</p>
                <p className="text-2xl font-bold">{data?.users?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Companies</p>
                <p className="text-2xl font-bold">{data?.companies?.length || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Form Submissions</p>
                <p className="text-2xl font-bold">{data?.submissions?.length || 0}</p>
              </div>
              <Database className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users & Staff ({data.users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.users.length === 0 ? (
                  <p className="text-gray-500">No users found or authentication failed</p>
                ) : (
                  data.users.map((user: any) => (
                    <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.username} ({user.email})</p>
                      </div>
                      <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'staff' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Jobs Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Jobs ({data.jobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.jobs.length === 0 ? (
                  <p className="text-gray-500">No jobs found</p>
                ) : (
                  data.jobs.slice(0, 10).map((job: any) => (
                    <div key={job.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-gray-600">{job.insuredName || job.InsuredName || 'No client'}</p>
                      </div>
                      <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  ))
                )}
                {data.jobs.length > 10 && (
                  <p className="text-sm text-gray-500 text-center">... and {data.jobs.length - 10} more</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Authentication Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Current User</p>
              <p className="font-medium">{user?.name} ({user?.role})</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Token Status</p>
              <p className="font-medium">
                {localStorage.getItem("auth_token") ? "Token Present" : "No Token"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Users API Response</p>
              <p className="text-sm">
                {data?.users?.length ? 
                  `✅ Success: ${data.users.length} users loaded` : 
                  "❌ Failed to load users (check authentication)"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
