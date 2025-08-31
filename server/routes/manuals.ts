import { RequestHandler } from "express";
import { Manual } from "../models";

// Helpers
function isSuperAdmin(user: any) {
  return user && user.role === "super_admin";
}
function isAdmin(user: any) {
  return user && (user.role === "admin" || user.role === "super_admin");
}

// Create manual
export const handleCreateManual: RequestHandler = async (req: any, res) => {
  try {
    const currentUser = req.user;
    if (!isAdmin(currentUser)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { companyId, category, title, content } = req.body;
    if (!category || !title || !content) {
      return res.status(400).json({ error: "category, title and content are required" });
    }

    // Company admins can only create manuals for their own company
    if (currentUser.role === "admin" && companyId && currentUser.companyId && companyId !== currentUser.companyId) {
      return res.status(403).json({ error: "You can only create manuals for your own company" });
    }

    const manual = await Manual.create({
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      companyId: companyId || undefined,
      category,
      title,
      content,
      createdBy: currentUser.id,
    });

    res.status(201).json(manual);
  } catch (error) {
    console.error("Create manual error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// List manuals
export const handleGetManuals: RequestHandler = async (req: any, res) => {
  try {
    const currentUser = req.user;
    const { companyId, category } = req.query as { companyId?: string; category?: string };

    const filter: any = {};

    if (category) filter.category = category;

    if (isSuperAdmin(currentUser)) {
      if (companyId) filter.companyId = companyId;
    } else if (currentUser.role === "admin") {
      // Company admins see their company manuals and default manuals (companyId undefined)
      filter.$or = [{ companyId: currentUser.companyId }, { companyId: { $exists: false } }, { companyId: null }];
    } else {
      // Other roles: only default manuals
      filter.$or = [{ companyId: { $exists: false } }, { companyId: null }];
    }

    const manuals = await Manual.find(filter).sort({ updatedAt: -1 });
    res.json(manuals);
  } catch (error) {
    console.error("Get manuals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update manual
export const handleUpdateManual: RequestHandler = async (req: any, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const updates = req.body;

    const manual = await Manual.findOne({ id });
    if (!manual) return res.status(404).json({ error: "Manual not found" });

    if (!isSuperAdmin(currentUser)) {
      if (currentUser.role !== "admin" || String(manual.companyId || "") !== String(currentUser.companyId || "")) {
        return res.status(403).json({ error: "You can only update manuals for your own company" });
      }
    }

    Object.assign(manual, { ...updates, updatedAt: new Date() });
    await manual.save();

    res.json(manual);
  } catch (error) {
    console.error("Update manual error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete manual
export const handleDeleteManual: RequestHandler = async (req: any, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const manual = await Manual.findOne({ id });
    if (!manual) return res.status(404).json({ error: "Manual not found" });

    if (!isSuperAdmin(currentUser)) {
      if (currentUser.role !== "admin" || String(manual.companyId || "") !== String(currentUser.companyId || "")) {
        return res.status(403).json({ error: "You can only delete manuals for your own company" });
      }
    }

    await Manual.deleteOne({ id });
    res.status(204).send();
  } catch (error) {
    console.error("Delete manual error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
