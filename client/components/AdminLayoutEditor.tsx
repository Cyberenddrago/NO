import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
  SortableContext as SortableContextType,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  Undo,
  Redo,
  Save,
  Download,
  Upload,
  Monitor,
  Tablet,
  Smartphone,
  Palette,
  Type,
  Layout,
  Move,
  Grip,
} from 'lucide-react';

// Types for layout components
export interface LayoutComponent {
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

export interface LayoutConfiguration {
  id: string;
  name: string;
  components: LayoutComponent[];
  version: number;
  lastModified: string;
  createdBy: string;
}

// Default component templates
const componentTemplates: Omit<LayoutComponent, 'id' | 'position'>[] = [
  {
    type: 'button',
    size: { width: 120, height: 40 },
    styles: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      borderRadius: '8px',
      padding: '8px 16px',
    },
    content: { text: 'Click Me' },
    visible: true,
    responsive: { desktop: true, tablet: true, mobile: true },
  },
  {
    type: 'card',
    size: { width: 300, height: 200 },
    styles: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '16px',
    },
    content: { text: 'Card Content', children: [] },
    visible: true,
    responsive: { desktop: true, tablet: true, mobile: true },
  },
  {
    type: 'text',
    size: { width: 200, height: 30 },
    styles: {
      fontSize: '16px',
      color: '#374151',
    },
    content: { text: 'Sample Text' },
    visible: true,
    responsive: { desktop: true, tablet: true, mobile: true },
  },
  {
    type: 'container',
    size: { width: 400, height: 300 },
    styles: {
      backgroundColor: '#f9fafb',
      border: '2px dashed #d1d5db',
      borderRadius: '8px',
      padding: '16px',
    },
    content: { children: [] },
    visible: true,
    responsive: { desktop: true, tablet: true, mobile: true },
  },
];

// Sortable component wrapper
interface SortableComponentProps {
  component: LayoutComponent;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<LayoutComponent>) => void;
  viewMode: 'desktop' | 'tablet' | 'mobile';
  previewMode?: boolean;
}

function SortableComponent({
  component,
  isSelected,
  onSelect,
  onUpdate,
  viewMode,
  previewMode = false,
}: SortableComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'absolute' as const,
    left: component.position.x,
    top: component.position.y,
    width: component.size.width,
    height: component.size.height,
    ...component.styles,
    cursor: previewMode ? 'default' : (isDragging ? 'grabbing' : 'grab'),
    border: (isSelected && !previewMode) ? '2px solid #3b82f6' : component.styles.border,
    outline: (isSelected && !previewMode) ? '2px solid #3b82f6' : 'none',
    outlineOffset: (isSelected && !previewMode) ? '2px' : '0',
  };

  // Check if component should be visible in current view mode
  const isVisible = component.visible && component.responsive[viewMode];

  if (!isVisible) return null;

  const renderContent = () => {
    switch (component.type) {
      case 'button':
        return (
          <button
            style={{
              width: '100%',
              height: '100%',
              background: 'inherit',
              color: 'inherit',
              border: 'none',
              borderRadius: 'inherit',
              fontSize: 'inherit',
              fontWeight: 'inherit',
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
            {component.content.children?.length === 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#9ca3af',
                  fontSize: '14px',
                }}
              >
                Drop components here
              </div>
            )}
          </div>
        );
      default:
        return <div>Component</div>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(previewMode ? {} : { ...attributes, ...listeners })}
      onClick={(e) => {
        if (!previewMode) {
          e.stopPropagation();
          onSelect(component.id);
        }
      }}
      className="select-none"
    >
      {isSelected && !previewMode && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            zIndex: 1000,
          }}
        >
          <Grip size={12} />
        </div>
      )}
      {renderContent()}
    </div>
  );
}

// Component Properties Panel
interface ComponentPropertiesPanelProps {
  component: LayoutComponent | null;
  onUpdate: (id: string, updates: Partial<LayoutComponent>) => void;
  onDelete: (id: string) => void;
}

function ComponentPropertiesPanel({
  component,
  onUpdate,
  onDelete,
}: ComponentPropertiesPanelProps) {
  if (!component) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Select a component to edit its properties</p>
        </CardContent>
      </Card>
    );
  }

  const handleStyleChange = (property: string, value: string) => {
    onUpdate(component.id, {
      styles: { ...component.styles, [property]: value },
    });
  };

  const handleContentChange = (property: string, value: string) => {
    onUpdate(component.id, {
      content: { ...component.content, [property]: value },
    });
  };

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    onUpdate(component.id, {
      position: { ...component.position, [axis]: value },
    });
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    onUpdate(component.id, {
      size: { ...component.size, [dimension]: value },
    });
  };

  const handleResponsiveChange = (device: 'desktop' | 'tablet' | 'mobile', value: boolean) => {
    onUpdate(component.id, {
      responsive: { ...component.responsive, [device]: value },
    });
  };

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Properties: {component.type}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(component.id)}
          >
            <Trash2 size={14} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="responsive">Responsive</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-3">
            {/* Content */}
            {(component.type === 'button' || component.type === 'text' || component.type === 'card') && (
              <div>
                <Label className="text-xs">Content</Label>
                <Input
                  value={component.content.text || ''}
                  onChange={(e) => handleContentChange('text', e.target.value)}
                  placeholder="Enter text content"
                  className="text-xs"
                />
              </div>
            )}

            {/* Position */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X Position</Label>
                <Input
                  type="number"
                  value={component.position.x}
                  onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Y Position</Label>
                <Input
                  type="number"
                  value={component.position.y}
                  onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Size */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Width</Label>
                <Input
                  type="number"
                  value={component.size.width}
                  onChange={(e) => handleSizeChange('width', parseInt(e.target.value) || 0)}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Height</Label>
                <Input
                  type="number"
                  value={component.size.height}
                  onChange={(e) => handleSizeChange('height', parseInt(e.target.value) || 0)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Visibility */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="visible"
                checked={component.visible}
                onChange={(e) => onUpdate(component.id, { visible: e.target.checked })}
              />
              <Label htmlFor="visible" className="text-xs">Visible</Label>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-3">
            {/* Background Color */}
            <div>
              <Label className="text-xs">Background Color</Label>
              <Input
                type="color"
                value={component.styles.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="h-8"
              />
            </div>

            {/* Text Color */}
            <div>
              <Label className="text-xs">Text Color</Label>
              <Input
                type="color"
                value={component.styles.color || '#000000'}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="h-8"
              />
            </div>

            {/* Font Size */}
            <div>
              <Label className="text-xs">Font Size</Label>
              <Input
                value={component.styles.fontSize || '16px'}
                onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                placeholder="16px"
                className="text-xs"
              />
            </div>

            {/* Border Radius */}
            <div>
              <Label className="text-xs">Border Radius</Label>
              <Input
                value={component.styles.borderRadius || '0px'}
                onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                placeholder="8px"
                className="text-xs"
              />
            </div>

            {/* Padding */}
            <div>
              <Label className="text-xs">Padding</Label>
              <Input
                value={component.styles.padding || '0px'}
                onChange={(e) => handleStyleChange('padding', e.target.value)}
                placeholder="16px"
                className="text-xs"
              />
            </div>
          </TabsContent>

          <TabsContent value="responsive" className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Visible on:</Label>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="desktop"
                  checked={component.responsive.desktop}
                  onChange={(e) => handleResponsiveChange('desktop', e.target.checked)}
                />
                <Label htmlFor="desktop" className="text-xs flex items-center">
                  <Monitor size={14} className="mr-1" />
                  Desktop
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="tablet"
                  checked={component.responsive.tablet}
                  onChange={(e) => handleResponsiveChange('tablet', e.target.checked)}
                />
                <Label htmlFor="tablet" className="text-xs flex items-center">
                  <Tablet size={14} className="mr-1" />
                  Tablet
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="mobile"
                  checked={component.responsive.mobile}
                  onChange={(e) => handleResponsiveChange('mobile', e.target.checked)}
                />
                <Label htmlFor="mobile" className="text-xs flex items-center">
                  <Smartphone size={14} className="mr-1" />
                  Mobile
                </Label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Main Admin Layout Editor Component
interface AdminLayoutEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentLayout?: LayoutConfiguration;
  onSave: (layout: LayoutConfiguration) => void;
}

export function AdminLayoutEditor({
  isOpen,
  onClose,
  currentLayout,
  onSave,
}: AdminLayoutEditorProps) {
  const [components, setComponents] = useState<LayoutComponent[]>(
    currentLayout?.components || []
  );
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<LayoutComponent | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [history, setHistory] = useState<LayoutComponent[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showGridLines, setShowGridLines] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  // Update components when currentLayout changes
  useEffect(() => {
    if (currentLayout?.components) {
      setComponents(currentLayout.components);
      console.log(`📐 Layout Editor: Loaded ${currentLayout.components.length} components from "${currentLayout.name}"`);
    }
  }, [currentLayout]);

  // Early return after all hooks are declared to comply with Rules of Hooks
  if (!isOpen) return null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Save current state to history
  const saveToHistory = useCallback((newComponents: LayoutComponent[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newComponents]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setComponents([...history[historyIndex - 1]]);
    }
  }, [history, historyIndex]);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setComponents([...history[historyIndex + 1]]);
    }
  }, [history, historyIndex]);

  // Add new component
  const addComponent = (templateIndex: number) => {
    const template = componentTemplates[templateIndex];
    const newComponent: LayoutComponent = {
      ...template,
      id: `component-${Date.now()}`,
      position: { x: 50, y: 50 },
    };

    const newComponents = [...components, newComponent];
    setComponents(newComponents);
    saveToHistory(newComponents);
    setSelectedComponentId(newComponent.id);
  };

  // Update component
  const updateComponent = (id: string, updates: Partial<LayoutComponent>) => {
    const newComponents = components.map((comp) =>
      comp.id === id ? { ...comp, ...updates } : comp
    );
    setComponents(newComponents);
    saveToHistory(newComponents);
  };

  // Delete component
  const deleteComponent = (id: string) => {
    const newComponents = components.filter((comp) => comp.id !== id);
    setComponents(newComponents);
    saveToHistory(newComponents);
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    if (delta) {
      const componentId = active.id as string;
      const component = components.find(c => c.id === componentId);
      
      if (component) {
        updateComponent(componentId, {
          position: {
            x: component.position.x + delta.x,
            y: component.position.y + delta.y,
          },
        });
      }
    }
    
    setDraggedComponent(null);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const component = components.find(c => c.id === event.active.id);
    setDraggedComponent(component || null);
  };

  // Save layout
  const handleSave = () => {
    const layout: LayoutConfiguration = {
      id: currentLayout?.id || `layout-${Date.now()}`,
      name: currentLayout?.name || 'New Layout',
      components,
      version: (currentLayout?.version || 0) + 1,
      lastModified: new Date().toISOString(),
      createdBy: 'admin', // This should come from auth context
    };
    onSave(layout);
  };

  const selectedComponent = components.find(c => c.id === selectedComponentId);

  const getViewportSize = () => {
    switch (viewMode) {
      case 'tablet': return { width: 768, height: 1024 };
      case 'mobile': return { width: 375, height: 667 };
      default: return { width: 1200, height: 800 };
    }
  };

  const viewportSize = getViewportSize();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen-xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Admin Layout Editor</DialogTitle>
          <DialogDescription>
            Drag and drop components to design your layout. Changes are auto-saved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-full">
          {/* Component Palette */}
          <div className="w-64 border-r p-4 overflow-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Add Components</h3>
                <div className="space-y-2">
                  {componentTemplates.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => addComponent(index)}
                      className="w-full text-xs h-auto p-3 flex items-center justify-start"
                    >
                      <div className="flex items-center space-x-2">
                        {template.type === 'button' && <Settings size={16} className="text-blue-600" />}
                        {template.type === 'card' && <Layout size={16} className="text-green-600" />}
                        {template.type === 'text' && <Type size={16} className="text-purple-600" />}
                        {template.type === 'container' && <Move size={16} className="text-orange-600" />}
                        <div className="text-left">
                          <div className="capitalize font-medium">{template.type}</div>
                          <div className="text-xs text-gray-500">
                            {template.type === 'button' && 'Interactive button element'}
                            {template.type === 'card' && 'Content container with styling'}
                            {template.type === 'text' && 'Simple text display'}
                            {template.type === 'container' && 'Layout container for grouping'}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Actions</h3>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="w-full text-xs"
                  >
                    <Undo size={14} className="mr-1" />
                    Undo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="w-full text-xs"
                  >
                    <Redo size={14} className="mr-1" />
                    Redo
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="w-full text-xs"
                  >
                    <Save size={14} className="mr-1" />
                    Save Layout
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Preview Mode</h3>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant={viewMode === 'desktop' ? 'default' : 'outline'}
                    onClick={() => setViewMode('desktop')}
                    className="w-full text-xs"
                  >
                    <Monitor size={14} className="mr-1" />
                    Desktop
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'tablet' ? 'default' : 'outline'}
                    onClick={() => setViewMode('tablet')}
                    className="w-full text-xs"
                  >
                    <Tablet size={14} className="mr-1" />
                    Tablet
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'mobile' ? 'default' : 'outline'}
                    onClick={() => setViewMode('mobile')}
                    className="w-full text-xs"
                  >
                    <Smartphone size={14} className="mr-1" />
                    Mobile
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {viewMode} - {viewportSize.width}x{viewportSize.height}
                </Badge>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant={previewMode ? "default" : "outline"}
                    onClick={() => setPreviewMode(!previewMode)}
                    className="text-xs"
                  >
                    {previewMode ? "Edit Mode" : "Preview Mode"}
                  </Button>
                  <Button
                    size="sm"
                    variant={showGridLines ? "default" : "outline"}
                    onClick={() => setShowGridLines(!showGridLines)}
                    className="text-xs"
                    disabled={previewMode}
                  >
                    Grid
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div>
                  Layout: {currentLayout?.name || 'New Layout'} v{currentLayout?.version || 1}
                </div>
                <div>
                  Components: {components.length} | Selected: {selectedComponent?.type || 'None'}
                </div>
              </div>
              {components.length === 0 && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  💡 Tip: Click on component types in the left panel to add them to your layout
                </div>
              )}
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div
                className={`relative mx-auto ${previewMode ? 'bg-white border border-gray-200' : 'bg-white border-2 border-dashed border-gray-300'}`}
                style={{
                  width: viewportSize.width,
                  height: viewportSize.height,
                  minHeight: viewportSize.height,
                  backgroundImage: showGridLines && !previewMode
                    ? 'radial-gradient(circle, #d1d5db 1px, transparent 1px)'
                    : 'none',
                  backgroundSize: showGridLines && !previewMode ? '20px 20px' : 'auto',
                }}
                onClick={() => setSelectedComponentId(null)}
              >
                <SortableContext
                  items={components.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {components.map((component) => (
                    <SortableComponent
                      key={component.id}
                      component={component}
                      isSelected={selectedComponentId === component.id}
                      onSelect={setSelectedComponentId}
                      onUpdate={updateComponent}
                      viewMode={viewMode}
                      previewMode={previewMode}
                    />
                  ))}
                </SortableContext>

                <DragOverlay>
                  {draggedComponent ? (
                    <div
                      style={{
                        width: draggedComponent.size.width,
                        height: draggedComponent.size.height,
                        ...draggedComponent.styles,
                        opacity: 0.8,
                      }}
                    >
                      {draggedComponent.content.text || draggedComponent.type}
                    </div>
                  ) : null}
                </DragOverlay>

                {components.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Layout size={48} className="mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Start Building Your Layout</h3>
                      <p className="text-sm mb-4">Click the component buttons on the left to add them to this canvas</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>• Components will appear at position (50, 50)</p>
                        <p>• Drag components to reposition them</p>
                        <p>• Click components to edit their properties</p>
                        <p>• Use the preview mode to see the final result</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DndContext>
          </div>

          {/* Properties Panel */}
          <div className="w-80 border-l">
            <ComponentPropertiesPanel
              component={selectedComponent || null}
              onUpdate={updateComponent}
              onDelete={deleteComponent}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AdminLayoutEditor;
