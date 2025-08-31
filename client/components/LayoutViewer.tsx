import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Types (shared with AdminLayoutEditor)
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
}

// Component renderer for viewing (non-editable)
interface ComponentRendererProps {
  component: LayoutComponent;
  viewMode: 'desktop' | 'tablet' | 'mobile';
  onInteraction?: (componentId: string, action: string, data?: any) => void;
}

function ComponentRenderer({ component, viewMode, onInteraction }: ComponentRendererProps) {
  // Check if component should be visible in current view mode
  const isVisible = component.visible && component.responsive[viewMode];

  if (!isVisible) return null;

  const style = {
    position: 'absolute' as const,
    left: component.position.x,
    top: component.position.y,
    width: component.size.width,
    height: component.size.height,
    ...component.styles,
    cursor: component.type === 'button' ? 'pointer' : 'default',
  };

  const handleClick = () => {
    if (component.type === 'button' && onInteraction) {
      onInteraction(component.id, 'click', { text: component.content.text });
    }
  };

  const renderContent = () => {
    switch (component.type) {
      case 'button':
        return (
          <button
            onClick={handleClick}
            style={{
              width: '100%',
              height: '100%',
              background: 'inherit',
              color: 'inherit',
              border: 'none',
              borderRadius: 'inherit',
              fontSize: 'inherit',
              fontWeight: 'inherit',
              cursor: 'pointer',
            }}
          >
            {component.content.text || 'Button'}
          </button>
        );
      case 'card':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '8px', fontWeight: 'bold', fontSize: '14px' }}>
              Card Title
            </div>
            <div style={{ padding: '8px', fontSize: '12px' }}>
              {component.content.text || 'Card content goes here...'}
            </div>
          </div>
        );
      case 'text':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {component.content.text || 'Text'}
          </div>
        );
      case 'container':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Container content can be nested components */}
          </div>
        );
      case 'image':
        return (
          <img
            src={component.content.imageUrl || '/placeholder.svg'}
            alt={component.content.text || 'Image'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        );
      case 'menu':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
            }}
          >
            {/* Menu items would be rendered here */}
            <span>Menu</span>
          </div>
        );
      default:
        return <div>Component</div>;
    }
  };

  return (
    <div style={style} className="select-none">
      {renderContent()}
    </div>
  );
}

// Real-time layout updates using WebSocket (or polling fallback)
class LayoutUpdateService {
  private callbacks: Array<(layout: LayoutConfiguration) => void> = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastVersion: number = 0;

  constructor() {
    // Try WebSocket connection first, fallback to polling
    this.initializeConnection();
  }

  private initializeConnection() {
    // For now, use polling. In production, implement WebSocket
    this.startPolling();
  }

  private startPolling() {
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/layouts/active');
        if (response.ok) {
          const layout: LayoutConfiguration = await response.json();
          
          // Only notify if version changed
          if (layout.version !== this.lastVersion) {
            this.lastVersion = layout.version;
            this.notifyCallbacks(layout);
          }
        }
      } catch (error) {
        console.error('Error polling for layout updates:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  private notifyCallbacks(layout: LayoutConfiguration) {
    this.callbacks.forEach(callback => {
      try {
        callback(layout);
      } catch (error) {
        console.error('Error in layout update callback:', error);
      }
    });
  }

  subscribe(callback: (layout: LayoutConfiguration) => void) {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  destroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.callbacks = [];
  }
}

// Singleton instance for layout updates
const layoutUpdateService = new LayoutUpdateService();

// Main Layout Viewer Component
interface LayoutViewerProps {
  className?: string;
  onComponentInteraction?: (componentId: string, action: string, data?: any) => void;
}

export function LayoutViewer({ 
  className = '', 
  onComponentInteraction 
}: LayoutViewerProps) {
  const { user } = useAuth();
  const [layout, setLayout] = useState<LayoutConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Detect screen size and set appropriate view mode
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setViewMode('mobile');
      } else if (width < 1024) {
        setViewMode('tablet');
      } else {
        setViewMode('desktop');
      }
    };

    handleResize(); // Set initial view mode
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load initial layout
  useEffect(() => {
    const loadLayout = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/layouts/active');
        
        if (response.ok) {
          const layoutData = await response.json();
          setLayout(layoutData);
          setError(null);
        } else if (response.status === 404) {
          // No active layout set
          setLayout(null);
          setError('No layout configuration found');
        } else {
          setError('Failed to load layout');
        }
      } catch (err) {
        console.error('Error loading layout:', err);
        setError('Failed to load layout');
      } finally {
        setLoading(false);
      }
    };

    loadLayout();
  }, []);

  // Subscribe to real-time layout updates
  useEffect(() => {
    const unsubscribe = layoutUpdateService.subscribe((updatedLayout) => {
      setLayout(updatedLayout);
      console.log('Layout updated in real-time:', updatedLayout.name);
    });

    return unsubscribe;
  }, []);

  // Handle component interactions
  const handleComponentInteraction = useCallback((componentId: string, action: string, data?: any) => {
    console.log('Component interaction:', { componentId, action, data });
    
    // Log interaction for analytics
    if (user) {
      // In production, send to analytics service
      console.log(`User ${user.username} interacted with component ${componentId}: ${action}`);
    }
    
    // Call parent handler if provided
    if (onComponentInteraction) {
      onComponentInteraction(componentId, action, data);
    }
  }, [user, onComponentInteraction]);

  const getViewportSize = () => {
    switch (viewMode) {
      case 'tablet': return { width: '100%', maxWidth: '768px', height: 'auto' };
      case 'mobile': return { width: '100%', maxWidth: '375px', height: 'auto' };
      default: return { width: '100%', height: 'auto' };
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading layout...</p>
        </div>
      </div>
    );
  }

  if (error || !layout) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            {error || 'No layout available'}
          </p>
          {user?.role === 'admin' && (
            <p className="text-xs text-blue-600">
              Configure a layout in the Admin Layout Editor
            </p>
          )}
        </div>
      </div>
    );
  }

  const viewportStyle = getViewportSize();

  return (
    <div className={`layout-viewer ${className}`}>
      {/* Debug info (only show for admins) */}
      {user?.role === 'admin' && (
        <div className="mb-2 p-2 bg-gray-100 rounded text-xs">
          <span className="font-medium">Layout:</span> {layout.name} v{layout.version} 
          <span className="ml-2 font-medium">View:</span> {viewMode}
          <span className="ml-2 font-medium">Components:</span> {layout.components.length}
        </div>
      )}

      {/* Layout Canvas */}
      <div
        className="relative mx-auto bg-white overflow-hidden"
        style={{
          ...viewportStyle,
          minHeight: layout.components.length > 0 ? '400px' : '200px',
          border: '1px solid #e5e7eb',
        }}
      >
        {layout.components.map((component) => (
          <ComponentRenderer
            key={component.id}
            component={component}
            viewMode={viewMode}
            onInteraction={handleComponentInteraction}
          />
        ))}

        {layout.components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p>No components configured in this layout</p>
              {user?.role === 'admin' && (
                <p className="text-xs mt-1">Add components using the Layout Editor</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Layout info footer */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Last updated: {new Date(layout.lastModified).toLocaleString()}
      </div>
    </div>
  );
}

// Hook for using layout viewer functionality
export function useActiveLayout() {
  const [layout, setLayout] = useState<LayoutConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLayout = async () => {
      try {
        const response = await fetch('/api/layouts/active');
        if (response.ok) {
          setLayout(await response.json());
        }
      } catch (error) {
        console.error('Error loading active layout:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLayout();

    // Subscribe to updates
    const unsubscribe = layoutUpdateService.subscribe(setLayout);
    return unsubscribe;
  }, []);

  return { layout, loading };
}

export default LayoutViewer;

// Cleanup on module unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    layoutUpdateService.destroy();
  });
}
