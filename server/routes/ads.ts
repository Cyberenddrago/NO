import { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Advertisement } from "../models";

// Ensure uploads directory exists
const uploadsDir = "uploads/ads/";
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true);
    return cb(new Error("Only image files are allowed for advertisements"));
  }
});

function isSuperAdmin(user: any) { return user && user.role === "super_admin"; }
function isAdmin(user: any) { return user && (user.role === "admin" || user.role === "super_admin"); }

// Create/upload advertisement (super admin global or company admin scoped)
export const uploadAdMiddleware = upload.single("media");
export const handleCreateAd: RequestHandler = async (req: any, res) => {
  try {
    const currentUser = req.user;
    if (!isAdmin(currentUser)) return res.status(403).json({ error: "Admin access required" });

    const { placement, mediaUrl, orientation, companyId, startAt, endAt, isActive } = req.body;
    if (!placement) return res.status(400).json({ error: "placement is required" });

    let finalMediaUrl = mediaUrl as string | undefined;
    if (!finalMediaUrl && req.file) {
      finalMediaUrl = `/${uploadsDir}${req.file.filename}`.replace(/\\/g, "/");
    }
    if (!finalMediaUrl) return res.status(400).json({ error: "mediaUrl or uploaded media is required" });

    // Company admins can only create company-scoped ads; super admin may set global
    const adCompanyId = isSuperAdmin(currentUser) ? (companyId || undefined) : currentUser.companyId;

    const ad = await Advertisement.create({
      id: `ad-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      placement,
      mediaType: "image",
      mediaUrl: finalMediaUrl,
      orientation: orientation || "auto",
      companyId: adCompanyId,
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      isActive: typeof isActive === "boolean" ? isActive : true,
      createdBy: currentUser.id,
    });

    res.status(201).json(ad);
  } catch (error) {
    console.error("Create ad error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get active ads (login: global only unless super admin filters)
export const handleGetActiveAds: RequestHandler = async (req: any, res) => {
  try {
    const currentUser = req.user;
    const { placement } = req.query as { placement?: string };
    const now = new Date();

    const filter: any = { isActive: true };
    if (placement) filter.placement = placement;

    // For login placement, show only global ads unless super admin requests otherwise
    if (placement === "login") {
      filter.$or = [{ companyId: { $exists: false } }, { companyId: null }];
    } else if (currentUser && currentUser.companyId) {
      // In-app banners: prefer company-scoped and global
      filter.$or = [{ companyId: currentUser.companyId }, { companyId: { $exists: false } }, { companyId: null }];
    }

    const ads = await Advertisement.find(filter).sort({ createdAt: -1 });
    const active = ads.filter((ad: any) => {
      const startOk = !ad.startAt || new Date(ad.startAt) <= now;
      const endOk = !ad.endAt || new Date(ad.endAt) >= now;
      return startOk && endOk;
    });

    res.json(active);
  } catch (error) {
    console.error("Get active ads error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update ad
export const handleUpdateAd: RequestHandler = async (req: any, res) => {
  try {
    const currentUser = req.user;
    if (!isAdmin(currentUser)) return res.status(403).json({ error: "Admin access required" });

    const { id } = req.params;
    const updates = req.body;
    const ad = await Advertisement.findOne({ id });
    if (!ad) return res.status(404).json({ error: "Ad not found" });

    if (!isSuperAdmin(currentUser)) {
      if (String(ad.companyId || "") !== String(currentUser.companyId || "")) {
        return res.status(403).json({ error: "You can only update your company's ads" });
      }
    }

    Object.assign(ad, { ...updates, updatedAt: new Date() });
    await ad.save();
    res.json(ad);
  } catch (error) {
    console.error("Update ad error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete ad
export const handleDeleteAd: RequestHandler = async (req: any, res) => {
  try {
    const currentUser = req.user;
    if (!isAdmin(currentUser)) return res.status(403).json({ error: "Admin access required" });

    const { id } = req.params;
    const ad = await Advertisement.findOne({ id });
    if (!ad) return res.status(404).json({ error: "Ad not found" });

    if (!isSuperAdmin(currentUser)) {
      if (String(ad.companyId || "") !== String(currentUser.companyId || "")) {
        return res.status(403).json({ error: "You can only delete your company's ads" });
      }
    }

    await Advertisement.deleteOne({ id });
    res.status(204).send();
  } catch (error) {
    console.error("Delete ad error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
