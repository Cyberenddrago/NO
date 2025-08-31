import type { RequestHandler } from "express";
import { Organization } from "@shared/types";

// In-memory organizations (tenant companies using the system)
export let organizations: Organization[] = [];
let orgCounter = 1;

export const handleCreateOrganization: RequestHandler = (req, res) => {
  try {
    const { name, logoUrl, settings } = req.body || {};
    if (!name) return res.status(400).json({ error: "Organization name is required" });

    const newOrg: Organization = {
      id: `org-${Date.now()}-${orgCounter++}`,
      name: String(name),
      createdAt: new Date().toISOString(),
      ...(logoUrl ? { logoUrl: String(logoUrl) } : {}),
      ...(settings ? { settings } : {}),
    };
    organizations.push(newOrg);
    res.status(201).json(newOrg);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetOrganizations: RequestHandler = (req: any, res) => {
  try {
    const currentUser = req.user;
    if (currentUser?.role === 'super_admin') {
      return res.json(organizations);
    }
    const uOrgs: string[] = Array.isArray(currentUser?.organizations) ? currentUser.organizations : [];
    const scoped = organizations.filter(org => uOrgs.includes(org.id));
    res.json(scoped);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateOrganization: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const idx = organizations.findIndex(o => o.id === id);
    if (idx === -1) return res.status(404).json({ error: "Organization not found" });

    const updated: Organization = {
      ...organizations[idx],
      ...(updates.name ? { name: String(updates.name) } : {}),
      ...(updates.logoUrl ? { logoUrl: String(updates.logoUrl) } : {}),
      ...(updates.settings ? { settings: updates.settings } : {}),
    };
    organizations[idx] = updated;
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteOrganization: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const idx = organizations.findIndex(o => o.id === id);
    if (idx === -1) return res.status(404).json({ error: "Organization not found" });
    organizations.splice(idx, 1);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
};
