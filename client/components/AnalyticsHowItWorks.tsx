import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Building2, Users, Key, Workflow, UserCheck, Eye } from "lucide-react";

export function AnalyticsHowItWorks() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Multi-tenant model: God Company, Sub Companies, and Staff
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-700">
          <div className="space-y-2">
            <div className="font-medium">Key concepts</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>God Company (host) manages the platform and onboards client companies (organizations).</li>
              <li>Each client company is an organization with its own staff, schedules, forms, and settings.</li>
              <li>Host support staff can be assigned to specific client organizations without exposing unrelated data.</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-purple-600"/>Super Admin</CardTitle></CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-2">
                <div>Role: <Badge variant="outline">super_admin</Badge></div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Oversees all companies and users</li>
                  <li>Creates companies and assigns host staff</li>
                  <li>Can impersonate users for support</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-green-600"/>Company Admin</CardTitle></CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-2">
                <div>Role: <Badge variant="outline">admin</Badge> (scoped to org)</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Manages only their company data</li>
                  <li>Creates staff, shifts, forms</li>
                  <li>No access to other companies</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><UserCheck className="h-4 w-4 text-blue-600"/>Staff</CardTitle></CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-2">
                <div>Role: <Badge variant="outline">staff</Badge> / <Badge variant="outline">supervisor</Badge> / <Badge variant="outline">apollo</Badge></div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Sees only assigned jobs/schedules/forms</li>
                  <li>Authenticated per company context</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <div className="font-medium flex items-center gap-2"><Key className="h-4 w-4 text-orange-600"/>Login & access</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>All users log in via the same page; JWT stores role and organization IDs.</li>
              <li>UI and API are tenant-aware: every request is scoped by the user's organizations.</li>
              <li>Company switching is available only to Super Admins.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-medium flex items-center gap-2"><Workflow className="h-4 w-4 text-teal-600"/>Data separation</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Every entity stores organization IDs to isolate data.</li>
              <li>Backend middleware enforces tenant scoping for all endpoints.</li>
              <li>Host staff marked <span className="inline-block align-middle"><Badge variant="secondary">god_staff</Badge></span> are excluded from cross-tenant lists like Typo Work.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-medium flex items-center gap-2"><Eye className="h-4 w-4 text-indigo-600"/>Usage summary</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Super Admin: create organizations, assign modules, manage host support staff.</li>
              <li>Company Admin: manage only their org's staff, schedules, forms.</li>
              <li>Staff: view tasks/schedules assigned to them; no global visibility.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default AnalyticsHowItWorks;
