import { RequestHandler } from "express";
import fs from "fs";
import path from "path";

// Layout Configuration Interface
interface LayoutComponent {
  id: string;
  type: 'button' | 'card' | 'text' | 'image' | 'container' | 'menu';
  position: { x: number; y: number };
  size: { width: number; height: number };
  styles: {
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    fontWeight?: string;
    border?: string;
    borderRadius?: string;
    padding?: string;
    margin?: string;
  };
  content: {
    text?: string;
    imageUrl?: string;
    children?: string[];
  };
  visible: boolean;
  responsive: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
}

interface LayoutConfiguration {
  id: string;
  name: string;
  components: LayoutComponent[];
  version: number;
  lastModified: string;
  createdBy: string;
  isActive?: boolean;
}

// In-memory storage for layouts (in production, use database)
let layouts: LayoutConfiguration[] = [];
let activeLayout: LayoutConfiguration | null = null;

// File paths for persistence
const LAYOUTS_DIR = path.join(process.cwd(), 'data', 'layouts');
const LAYOUTS_FILE = path.join(LAYOUTS_DIR, 'layouts.json');
const ACTIVE_LAYOUT_FILE = path.join(LAYOUTS_DIR, 'active-layout.json');

// Ensure data directory exists
function ensureDataDirectory() {
  if (!fs.existsSync(LAYOUTS_DIR)) {
    fs.mkdirSync(LAYOUTS_DIR, { recursive: true });
  }
}

// Load layouts from file system
function loadLayouts() {
  ensureDataDirectory();
  
  try {
    if (fs.existsSync(LAYOUTS_FILE)) {
      const data = fs.readFileSync(LAYOUTS_FILE, 'utf8');
      layouts = JSON.parse(data);
    }
    
    if (fs.existsSync(ACTIVE_LAYOUT_FILE)) {
      const data = fs.readFileSync(ACTIVE_LAYOUT_FILE, 'utf8');
      activeLayout = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading layouts:', error);
    layouts = [];
    activeLayout = null;
  }
}

// Save layouts to file system
function saveLayouts() {
  ensureDataDirectory();
  
  try {
    fs.writeFileSync(LAYOUTS_FILE, JSON.stringify(layouts, null, 2));
    if (activeLayout) {
      fs.writeFileSync(ACTIVE_LAYOUT_FILE, JSON.stringify(activeLayout, null, 2));
    }
  } catch (error) {
    console.error('Error saving layouts:', error);
  }
}

// Initialize layouts on module load
loadLayouts();

// Middleware to check admin permissions
const requireAdmin: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = token ? token.replace("mock-token-", "") : "";

  if (userId !== "admin-1") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

// Get all layouts
export const handleGetLayouts: RequestHandler = async (req, res) => {
  try {
    res.json({
      layouts: layouts.map(layout => ({
        ...layout,
        isActive: activeLayout?.id === layout.id
      })),
      activeLayout
    });
  } catch (error) {
    console.error("Error getting layouts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get specific layout by ID
export const handleGetLayout: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const layout = layouts.find(l => l.id === id);
    
    if (!layout) {
      return res.status(404).json({ error: "Layout not found" });
    }
    
    res.json(layout);
  } catch (error) {
    console.error("Error getting layout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get active layout (public endpoint for all users)
export const handleGetActiveLayout: RequestHandler = async (req, res) => {
  try {
    if (!activeLayout) {
      return res.status(404).json({ error: "No active layout set" });
    }
    
    res.json(activeLayout);
  } catch (error) {
    console.error("Error getting active layout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create or update layout (admin only)
export const handleSaveLayout: RequestHandler = async (req, res) => {
  try {
    const layoutData: LayoutConfiguration = req.body;
    
    // Validate required fields
    if (!layoutData.id || !layoutData.name || !layoutData.components) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Validate components structure
    for (const component of layoutData.components) {
      if (!component.id || !component.type || !component.position || !component.size) {
        return res.status(400).json({ error: "Invalid component structure" });
      }
    }
    
    const existingIndex = layouts.findIndex(l => l.id === layoutData.id);
    
    if (existingIndex >= 0) {
      // Update existing layout
      layouts[existingIndex] = {
        ...layoutData,
        lastModified: new Date().toISOString(),
        version: layouts[existingIndex].version + 1
      };
    } else {
      // Create new layout
      layouts.push({
        ...layoutData,
        lastModified: new Date().toISOString(),
        version: 1
      });
    }
    
    saveLayouts();
    
    res.json({
      message: existingIndex >= 0 ? "Layout updated successfully" : "Layout created successfully",
      layout: layouts[existingIndex >= 0 ? existingIndex : layouts.length - 1]
    });
  } catch (error) {
    console.error("Error saving layout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Set active layout (admin only)
export const handleSetActiveLayout: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const layout = layouts.find(l => l.id === id);
    
    if (!layout) {
      return res.status(404).json({ error: "Layout not found" });
    }
    
    activeLayout = { ...layout, isActive: true };
    saveLayouts();
    
    // Emit real-time update to all connected clients
    // This will be implemented when we add WebSocket support
    
    res.json({
      message: "Active layout updated successfully",
      activeLayout
    });
  } catch (error) {
    console.error("Error setting active layout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete layout (admin only)
export const handleDeleteLayout: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const layoutIndex = layouts.findIndex(l => l.id === id);
    
    if (layoutIndex === -1) {
      return res.status(404).json({ error: "Layout not found" });
    }
    
    // Don't allow deleting the active layout
    if (activeLayout?.id === id) {
      return res.status(400).json({ error: "Cannot delete the active layout" });
    }
    
    layouts.splice(layoutIndex, 1);
    saveLayouts();
    
    res.json({ message: "Layout deleted successfully" });
  } catch (error) {
    console.error("Error deleting layout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Clone layout (admin only)
export const handleCloneLayout: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const sourceLayout = layouts.find(l => l.id === id);
    if (!sourceLayout) {
      return res.status(404).json({ error: "Source layout not found" });
    }
    
    const clonedLayout: LayoutConfiguration = {
      ...sourceLayout,
      id: `layout-${Date.now()}`,
      name: name || `${sourceLayout.name} (Copy)`,
      version: 1,
      lastModified: new Date().toISOString(),
      createdBy: "admin" // Should come from auth context
    };
    
    layouts.push(clonedLayout);
    saveLayouts();
    
    res.json({
      message: "Layout cloned successfully",
      layout: clonedLayout
    });
  } catch (error) {
    console.error("Error cloning layout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Export layout as JSON (admin only)
export const handleExportLayout: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const layout = layouts.find(l => l.id === id);
    
    if (!layout) {
      return res.status(404).json({ error: "Layout not found" });
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="layout-${layout.name.replace(/[^a-zA-Z0-9]/g, '-')}.json"`);
    
    res.json(layout);
  } catch (error) {
    console.error("Error exporting layout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Import layout from JSON (admin only)
export const handleImportLayout: RequestHandler = async (req, res) => {
  try {
    const layoutData: LayoutConfiguration = req.body;
    
    // Validate required fields
    if (!layoutData.components || !Array.isArray(layoutData.components)) {
      return res.status(400).json({ error: "Invalid layout format" });
    }
    
    // Generate new ID to avoid conflicts
    const importedLayout: LayoutConfiguration = {
      ...layoutData,
      id: `imported-layout-${Date.now()}`,
      name: `${layoutData.name || 'Imported Layout'}`,
      version: 1,
      lastModified: new Date().toISOString(),
      createdBy: "admin" // Should come from auth context
    };
    
    layouts.push(importedLayout);
    saveLayouts();
    
    res.json({
      message: "Layout imported successfully",
      layout: importedLayout
    });
  } catch (error) {
    console.error("Error importing layout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Layout Management Routes Configuration
export const layoutRoutes = {
  // Admin routes (require admin access)
  getLayouts: [requireAdmin, handleGetLayouts],
  getLayout: [requireAdmin, handleGetLayout],
  saveLayout: [requireAdmin, handleSaveLayout],
  setActiveLayout: [requireAdmin, handleSetActiveLayout],
  deleteLayout: [requireAdmin, handleDeleteLayout],
  cloneLayout: [requireAdmin, handleCloneLayout],
  exportLayout: [requireAdmin, handleExportLayout],
  importLayout: [requireAdmin, handleImportLayout],
  
  // Public routes (for all users)
  getActiveLayout: [handleGetActiveLayout],
};

// Default layout for new installations
const createDefaultLayout = (): LayoutConfiguration => {
  return {
    id: 'default-layout',
    name: 'Default Layout',
    version: 1,
    lastModified: new Date().toISOString(),
    createdBy: 'system',
    components: [
      {
        id: 'header-component',
        type: 'container',
        position: { x: 0, y: 0 },
        size: { width: 1200, height: 80 },
        styles: {
          backgroundColor: '#1f2937',
          color: '#ffffff',
          padding: '16px',
        },
        content: {
          text: 'Admin Dashboard',
          children: []
        },
        visible: true,
        responsive: {
          desktop: true,
          tablet: true,
          mobile: true
        }
      },
      {
        id: 'main-nav-component',
        type: 'container',
        position: { x: 0, y: 80 },
        size: { width: 1200, height: 60 },
        styles: {
          backgroundColor: '#374151',
          padding: '12px',
        },
        content: {
          children: []
        },
        visible: true,
        responsive: {
          desktop: true,
          tablet: true,
          mobile: true
        }
      },
      {
        id: 'content-area-component',
        type: 'container',
        position: { x: 0, y: 140 },
        size: { width: 1200, height: 600 },
        styles: {
          backgroundColor: '#f9fafb',
          padding: '24px',
        },
        content: {
          children: []
        },
        visible: true,
        responsive: {
          desktop: true,
          tablet: true,
          mobile: true
        }
      }
    ]
  };
};

// Initialize with default layout if none exists
if (layouts.length === 0) {
  const defaultLayout = createDefaultLayout();
  layouts.push(defaultLayout);
  activeLayout = defaultLayout;
  saveLayouts();
}

export {
  LayoutComponent,
  LayoutConfiguration,
  layouts,
  activeLayout
};
