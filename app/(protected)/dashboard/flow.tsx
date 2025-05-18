'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  KeyboardEvent as ReactKeyboardEvent,
  CSSProperties,
} from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Position,
  ReactFlowProvider,
  ReactFlowInstance,
  Handle,
  Panel,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  NodeProps,
} from 'reactflow';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"; // Corrected path back to context-menu
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X, Palette, Undo2, Redo2, Trash2, RectangleHorizontal, Circle } from 'lucide-react';
import 'reactflow/dist/style.css';
import { nanoid } from 'nanoid';
import ReactMarkdown from 'react-markdown';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';

type NodeCategoryType = 'rectangle' | 'circle';

interface NodeData {
  label: string;
  nodeCategory: NodeCategoryType;
  color: string;
  content: string;
  customHandles?: {
    type: 'source' | 'target';
    position: Position;
    id: string;
    style?: CSSProperties;
  }[];
}

interface FlowState {
  nodes: Node<NodeData>[];
  edges: Edge[];
}

const COLORS = [
  '#2563eb',
  '#16a34a', '#dc2626', '#ca8a04',
  '#9333ea', '#0891b2', '#ea580c', '#be185d'
];

const getDefaultHandlesForShape = (shapeType: NodeCategoryType, nodeId: string): NodeData['customHandles'] => {
  const baseId = nodeId || nanoid();
  switch (shapeType) {
    case 'rectangle':
      return [
        { type: 'target', position: Position.Left, id: `${baseId}-left-target`, style: { top: '50%' } },
        { type: 'source', position: Position.Right, id: `${baseId}-right-source`, style: { top: '50%' } },
      ];
    case 'circle': // Handles for circle
      return [
        { type: 'target', position: Position.Top, id: `${baseId}-top-target`, style: { left: '50%' } },
        { type: 'source', position: Position.Bottom, id: `${baseId}-bottom-source`, style: { left: '50%' } },
        { type: 'target', position: Position.Left, id: `${baseId}-left-target`, style: { top: '50%' } },
        { type: 'source', position: Position.Right, id: `${baseId}-right-source`, style: { top: '50%' } },
      ];
    default:
      return [];
  }
};

const AVAILABLE_SHAPES: NodeCategoryType[] = ['rectangle', 'circle'];

// --- Shared Node UI Logic ---
const NodeControls = React.memo(({ data, nodeId }: { data: NodeData, nodeId: string }) => {
  const currentShapeIcon = data.nodeCategory === 'rectangle' ? <RectangleHorizontal size={12} /> : <Circle size={12} />;

  const handleColorChange = useCallback((color: string) => {
    const event = new CustomEvent('updateNodeData', { detail: { nodeId, newData: { color } } });
    window.dispatchEvent(event);
  }, [nodeId]);

  const handleDelete = useCallback(() => {
    const event = new CustomEvent('deleteNode', { detail: { nodeId } });
    window.dispatchEvent(event);
  }, [nodeId]);

  const handleShapeChange = useCallback((newType: NodeCategoryType) => {
    const event = new CustomEvent('changeNodeType', { detail: { nodeId, newType } });
    window.dispatchEvent(event);
  }, [nodeId]);

  return (
    <div className="absolute -bottom-3 -right-3 flex gap-1 nodrag">
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="outline" className="rounded-full w-6 h-6 bg-background">
            {currentShapeIcon}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex flex-col gap-1">
            {AVAILABLE_SHAPES.map((shapeKey) => (
              <Button
                key={shapeKey}
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => handleShapeChange(shapeKey)}
                disabled={data.nodeCategory === shapeKey}
              >
                {shapeKey === 'rectangle' ? <RectangleHorizontal className="mr-2 h-4 w-4" /> : <Circle className="mr-2 h-4 w-4" />}
                {shapeKey.charAt(0).toUpperCase() + shapeKey.slice(1)}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="outline" className="rounded-full w-6 h-6 bg-background">
            <Palette size={12} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-32 p-2">
          <div className="grid grid-cols-4 gap-1">
            {COLORS.map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Button
        size="icon"
        variant="destructive"
        className="rounded-full w-6 h-6 p-0"
        onClick={handleDelete}
      >
        <X size={12} />
      </Button>
    </div>
  );
});
NodeControls.displayName = 'NodeControls';


// Custom component to render code blocks with syntax highlighting (using direct style import)
const MarkdownCodeBlock = ({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');

  // Use the directly imported style
  const codeStyle = dracula;

  // Render SyntaxHighlighter for code blocks (not inline code)
  return !inline && match ? (
    <SyntaxHighlighter
      style={codeStyle} // Use the directly available style
      language={match[1]} // Extract language from className
      PreTag="div" // Use a div for the code block wrapper
      {...props}
    >
      {String(children).replace(/\n$/, '')} {/* Render children, removing trailing newline */}
    </SyntaxHighlighter>
  ) : (
    // Render inline code using a standard code tag
    <code className={className} {...props}>
      {children}
    </code>
  );
};


const NodeMainContent = React.memo(({ data, nodeId, isEditingLabel, setIsEditingLabel, localLabel, setLocalLabel, localContent, setLocalContent }: {
    data: NodeData;
    nodeId: string;
    isEditingLabel: boolean;
    setIsEditingLabel: (isEditing: boolean) => void;
    localLabel: string;
    setLocalLabel: (label: string) => void;
    localContent: string;
    setLocalContent: (content: string) => void;
}) => {
  const handleDoubleClickLabel = useCallback(() => setIsEditingLabel(true), [setIsEditingLabel]);

  const handleLabelBlur = useCallback(() => {
    setIsEditingLabel(false);
    const event = new CustomEvent('updateNodeData', { detail: { nodeId, newData: { label: localLabel } } });
    window.dispatchEvent(event);
  }, [setIsEditingLabel, nodeId, localLabel]);

  const handleLabelKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingLabel(false);
      const event = new CustomEvent('updateNodeData', { detail: { nodeId, newData: { label: localLabel } } });
      window.dispatchEvent(event);
    }
  }, [setIsEditingLabel, nodeId, localLabel]);

  const [isContentEditing, setIsContentEditing] = useState(false);
  const contentAreaRef = useRef<HTMLDivElement | HTMLTextAreaElement>(null);

  const handleDoubleClickContent = useCallback(() => setIsContentEditing(true), []);

  const handleContentBlur = useCallback(() => {
    setIsContentEditing(false);
    const event = new CustomEvent('updateNodeData', { detail: { nodeId, newData: { content: localContent } } });
    window.dispatchEvent(event);
  }, [nodeId, localContent]);

  const handleContentKeyPress = useCallback((e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setIsContentEditing(false);
      const event = new CustomEvent('updateNodeData', { detail: { nodeId, newData: { content: localContent } } });
      window.dispatchEvent(event);
    }
  }, [nodeId, localContent]);

  useEffect(() => {
    if (isContentEditing && contentAreaRef.current && contentAreaRef.current instanceof HTMLTextAreaElement) {
      contentAreaRef.current.focus();
    }
  }, [isContentEditing]);

  return (
    <div className="min-w-[160px] max-w-[220px] p-1 flex flex-col justify-center h-full">
      {isEditingLabel ? (
        <Input
          type="text" value={localLabel} onChange={(e) => setLocalLabel(e.target.value)}
          onBlur={handleLabelBlur} onKeyPress={handleLabelKeyPress} autoFocus
          className="text-base font-semibold bg-transparent nodrag w-full text-center"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div onDoubleClick={handleDoubleClickLabel} className="text-base font-semibold cursor-text text-foreground break-words text-center">
          {localLabel}
        </div>
      )}
      <div className="text-xs text-muted-foreground uppercase text-center mt-0.5">
        {data.nodeCategory}
      </div>
      <div className="mt-1 w-full flex flex-col nodrag flex-grow">
        {isContentEditing ? (
          <Textarea
            ref={contentAreaRef as React.RefObject<HTMLTextAreaElement>}
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleContentBlur}
            onKeyPress={handleContentKeyPress}
            placeholder="Content (Markdown supported)..."
            className="min-h-[60px] text-xs nodrag w-full"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            ref={contentAreaRef as React.RefObject<HTMLDivElement>}
            onDoubleClick={handleDoubleClickContent}
            className="cursor-text text-xs text-muted-foreground break-words w-full react-flow__node-content overflow-y-auto"
            style={{ textAlign: 'left' }}
          >
            <div className="markdown-content-wrapper">
              <ReactMarkdown components={{ code: MarkdownCodeBlock }}>
                {localContent || ''}
              </ReactMarkdown>
            </div>
            {!localContent && <span className="text-xs text-muted-foreground/70">Double-click to add content...</span>}
          </div>
        )}
      </div>
    </div>
  );
});
NodeMainContent.displayName = 'NodeMainContent';

const BaseNodeComponent = ({ data, id, isConnectable, children, specificShapeStyle, nodeColor }:
  NodeProps<NodeData> & { children: React.ReactNode, specificShapeStyle: CSSProperties, nodeColor: string }
) => {
  const defaultHandleStyle: CSSProperties = {
    background: '#555', width: '10px', height: '10px',
    border: '1.5px solid #fff', borderRadius: '3px', zIndex: 10,
  };

  return (
    <div style={{ position: 'relative' }}>
      {data.customHandles?.map(handle => (
        <Handle
          key={handle.id} type={handle.type} position={handle.position} id={handle.id}
          style={{ ...defaultHandleStyle, ...handle.style }} isConnectable={isConnectable}
        />
      ))}
      <div
        className="shadow-md bg-background border-2 flex flex-col items-center justify-center text-center"
        style={{ borderColor: nodeColor, ...specificShapeStyle }}
      >
        {children}
      </div>
      <NodeControls data={data} nodeId={id} />
    </div>
  );
};

// --- Node Components ---
const NodeRenderer = ({ data, id, isConnectable, ...props }: NodeProps<NodeData>, NodeType: 'rectangle' | 'circle') => {
  // Use local state in NodeRenderer which is the actual node component wrapper
  // This local state is kept in sync with the data prop via useEffect
  const [localLabel, setLocalLabel] = useState(data.label);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [localContent, setLocalContent] = useState(data.content || '');
  // Node color state should also be managed here
  const [nodeColor, setNodeColor] = useState(data.color || COLORS[0]);


  // Keep local state in sync with data prop changes from React Flow
  useEffect(() => {
      setLocalLabel(data.label);
      setLocalContent(data.content || '');
      setNodeColor(data.color || COLORS[0]);
  }, [data.label, data.content, data.color]);


  const specificShapeStyle = NodeType === 'rectangle' ? {
    borderRadius: '1rem',
    padding: '8px 10px',
    minWidth: '180px',
  } : { // Circle style
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    padding: '10px'
  };

  return (
    <BaseNodeComponent
      data={data} id={id} isConnectable={isConnectable} {...props}
      nodeColor={nodeColor}
      specificShapeStyle={specificShapeStyle}
    >
      {/* Pass down state and setters to NodeMainContent */}
      <NodeMainContent
        data={data} // Pass data for category display etc.
        nodeId={id}
        isEditingLabel={isEditingLabel}
        setIsEditingLabel={setIsEditingLabel}
        localLabel={localLabel}
        setLocalLabel={setLocalLabel}
        localContent={localContent}
        setLocalContent={setLocalContent}
      />
    </BaseNodeComponent>
  );
};

const RectangleNode = React.memo((props: NodeProps<NodeData>) => NodeRenderer(props, 'rectangle'));
RectangleNode.displayName = 'RectangleNode';

const CircleNode = React.memo((props: NodeProps<NodeData>) => NodeRenderer(props, 'circle'));
CircleNode.displayName = 'CircleNode';


const nodeTypes = {
  rectangle: RectangleNode,
  circle: CircleNode,
};

// --- Main Flow Component ---
function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const [history, setHistory] = useState<FlowState[]>([{ nodes: [], edges: [] }]);
  const [currentStep, setCurrentStep] = useState(0);

  const isInitialLoadDone = useRef(false);

  // Load from localStorage on initial mount
  useEffect(() => {
    const savedFlow = localStorage.getItem('flow');
    let initialNodes: Node<NodeData>[] = [];
    let initialEdges: Edge[] = [];

    if (savedFlow) {
      try {
        const parsedFlow = JSON.parse(savedFlow);
        initialNodes = (parsedFlow.nodes || []).map((node: Node<any>) => {
          const nodeCategory = AVAILABLE_SHAPES.includes(node.data?.nodeCategory)
            ? node.data.nodeCategory
            : AVAILABLE_SHAPES.includes(node.type as any) ? node.type : 'rectangle';
          return {
            ...node,
            type: nodeCategory,
            data: {
              ...(node.data || {}),
              nodeCategory: nodeCategory,
              customHandles: (Array.isArray(node.data?.customHandles) && node.data.customHandles.length > 0)
                ? node.data.customHandles
                : getDefaultHandlesForShape(nodeCategory, node.id),
              // Ensure color has a fallback on load
              color: node.data?.color || COLORS[0],
              // Ensure content has a fallback on load
              content: node.data?.content || '',
            } as NodeData,
          };
        });
        initialEdges = (parsedFlow.edges || []).map((edge: Edge) => ({
          ...edge,
          type: edge.type || 'bezier',
          animated: edge.animated !== undefined ? edge.animated : true,
          style: edge.style ? { ...edge.style, stroke: edge.style.stroke || '#2563eb', strokeWidth: edge.style.strokeWidth || 2 } : { stroke: '#2563eb', strokeWidth: 2 }
        }));
      } catch (error) {
        console.error("Failed to load flow from localStorage:", error);
        localStorage.removeItem('flow');
      }
    }
    setNodes(initialNodes);
    setEdges(initialEdges);
    const initialState = { nodes: initialNodes, edges: initialEdges };
    setHistory([initialState]);
    setCurrentStep(0);
    isInitialLoadDone.current = true;
  }, []); // Empty dependency array to run only once on mount


  // Save to localStorage and update history when nodes or edges change
  useEffect(() => {
    // Only save/update history after the initial load is done
    if (!isInitialLoadDone.current) return;

    // Create clean copies for saving to avoid saving unnecessary internal React Flow properties
    const nodesToSave = nodes.map(node => ({
        id: node.id,
        position: node.position,
        type: node.type,
        data: { // Only save essential data properties
           label: node.data.label,
           nodeCategory: node.data.nodeCategory,
           color: node.data.color,
           content: node.data.content,
           // customHandles should also be saved if they are part of the node data structure
           customHandles: node.data.customHandles,
        },
        // Add any other necessary top-level node properties here if needed (e.g., parentNode)
    }));

    const edgesToSave = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type,
        animated: edge.animated,
        style: edge.style,
         // Add any other necessary top-level edge properties here if needed
    }));


    localStorage.setItem('flow', JSON.stringify({ nodes: nodesToSave, edges: edgesToSave }));

    const newHistoryEntry: FlowState = { nodes: nodesToSave, edges: edgesToSave };

    // currentStep is the index of the current state. Slice up to currentStep + 1 to get the base.
    const baseHistory = history.slice(0, currentStep + 1);

    // Perform a simple comparison before adding to history to avoid duplicates from rapid changes
    // This is a shallow comparison of the *saved* data structure, not the internal React Flow state.
    const lastSavedEntryInBase = baseHistory.length > 0 ? baseHistory[baseHistory.length - 1] : null;

     // Using a basic JSON stringify comparison for simplicity.
     // A more robust comparison would involve iterating through nodes/edges.
    const isDuplicate = lastSavedEntryInBase &&
                        JSON.stringify(lastSavedEntryInBase.nodes) === JSON.stringify(nodesToSave) &&
                        JSON.stringify(lastSavedEntryInBase.edges) === JSON.stringify(edgesToSave);


    if (!isDuplicate) {
        setHistory([...baseHistory, newHistoryEntry]);
        setCurrentStep(baseHistory.length); // New current step is the index of the newly added entry
    }

  }, [nodes, edges]); // Dependencies reduced to nodes and edges. History and currentStep are accessed via closure/ref where needed or are used in the logic of updating history/step itself.

  const undo = useCallback(() => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      const prevState = history[newStep];
      // When restoring from history, create *new* node and edge objects
      // to ensure React Flow detects the changes and updates correctly.
       setNodes(prevState.nodes.map(n => ({...n, data: {...n.data}})));
       setEdges(prevState.edges.map(e => ({...e})));
      setCurrentStep(newStep);
    }
  }, [currentStep, history, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (currentStep < history.length - 1) {
      const newStep = currentStep + 1;
      const nextState = history[newStep];
      // When restoring from history, create *new* node and edge objects
      // to ensure React Flow detects the changes and updates correctly.
       setNodes(nextState.nodes.map(n => ({...n, data: {...n.data}})));
       setEdges(nextState.edges.map(e => ({...e})));
      setCurrentStep(newStep);
    }
  }, [currentStep, history, setNodes, setEdges]);


  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    // History will be updated by the useEffect
  }, [setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    const newEdge = {
      ...params,
      id: nanoid(), type: 'bezier', animated: true,
      style: { stroke: '#2563eb', strokeWidth: 2 }
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  const createNewNode = useCallback((nodeCat: NodeCategoryType, position: { x: number; y: number }) => {
    const id = nanoid();
    const customHandlesConfig = getDefaultHandlesForShape(nodeCat, id);
    const count = nodes.filter(n => n.data.nodeCategory === nodeCat).length + 1;
    const newNode: Node<NodeData> = {
      id, type: nodeCat, position,
      data: {
        label: `${nodeCat.charAt(0).toUpperCase() + nodeCat.slice(1)} ${count}`,
        nodeCategory: nodeCat, color: COLORS[Math.floor(Math.random() * COLORS.length)],
        content: '', customHandles: customHandlesConfig,
      },
    };
    setNodes(nds => [...nds, newNode]);
  }, [nodes, setNodes]); // `nodes` for count

  // --- Custom Event Handlers ---
  useEffect(() => {
    const handleDeleteNode = (event: Event) => {
      const { nodeId } = (event as CustomEvent<{ nodeId: string }>).detail;
      if (nodeId) {
        setNodes(nds => nds.filter(node => node.id !== nodeId));
        setEdges(eds => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
        if (selectedNode?.id === nodeId) setSelectedNode(null);
      }
    };

    const handleChangeNodeType = (event: Event) => {
      const { nodeId, newType } = (event as CustomEvent<{ nodeId: string; newType: NodeCategoryType }>).detail;
      if (nodeId && newType) {
        setNodes(nds =>
          nds.map(n => {
            if (n.id === nodeId) {
              const newHandles = getDefaultHandlesForShape(newType, n.id);
              const currentCountForNewType = nds.filter(node => node.id !== nodeId && node.data.nodeCategory === newType).length;
              const oldLabelParts = n.data.label.split(' ');
              const oldNumber = parseInt(oldLabelParts[oldLabelParts.length -1]);
              const newLabelNumber = isNaN(oldNumber) ? currentCountForNewType + 1 : oldNumber;

              return {
                ...n, type: newType,
                data: {
                  ...n.data,
                  label: `${newType.charAt(0).toUpperCase() + newType.slice(1)} ${newLabelNumber}`,
                  nodeCategory: newType, customHandles: newHandles,
                },
              };
            }
            return n;
          })
        );
        // No need to update selectedNode separately, it will update if it's the changed node.
      }
    };

    const handleUpdateNodeData = (event: Event) => {
        const { nodeId, newData } = (event as CustomEvent<{ nodeId: string; newData: Partial<NodeData> }>).detail;
        if (nodeId && newData) {
            setNodes(nds =>
                nds.map(n => {
                    if (n.id === nodeId) {
                        // Create a new data object to ensure React Flow detects the change
                        return { ...n, data: { ...n.data, ...newData } };
                    }
                    return n;
                })
            );
        }
    };

    window.addEventListener('deleteNode', handleDeleteNode);
    window.addEventListener('changeNodeType', handleChangeNodeType);
    window.addEventListener('updateNodeData', handleUpdateNodeData);
    return () => {
      window.removeEventListener('deleteNode', handleDeleteNode);
      window.removeEventListener('changeNodeType', handleChangeNodeType);
      window.removeEventListener('updateNodeData', handleUpdateNodeData);
    };
  }, [setNodes, setEdges, selectedNode, nodes]); // `nodes` for label numbering in changeNodeType, `selectedNode` for delete.

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement;
      // Check if the focus is NOT on an input or textarea before handling global shortcuts
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            if (event.shiftKey) redo(); else undo();
          }
           if (event.key === 'Delete' && selectedNode) {
             event.preventDefault();
             const deleteEvent = new CustomEvent('deleteNode', { detail: { nodeId: selectedNode.id } });
             window.dispatchEvent(deleteEvent);
           }
      } else {
           // If focus IS on an input or textarea, only handle Ctrl/Cmd + Z (and Shift)
           if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
                event.preventDefault(); // Prevent browser/input undo/redo
                if (event.shiftKey) redo(); else undo();
           }
           // Allow default behavior for other keys in inputs/textareas
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, undo, redo]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<NodeData>) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  return (
    <div ref={reactFlowWrapper} className="w-screen h-screen bg-background">
      <ContextMenu>
        <ContextMenuTrigger className="h-full w-full">
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onInit={setReactFlowInstance}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: 'bezier', animated: true, style: { stroke: '#2563eb', strokeWidth: 2 } }}
            connectionMode="loose" fitView className="dark:bg-background"
          >
            <Controls className="dark:bg-background dark:border-border" />
            <MiniMap
              className="dark:bg-background"
              nodeColor={(node: Node<NodeData>) => node.data.color || '#ddd'}
              nodeStrokeColor="#fff" // Ensure node outlines are visible in dark minimap
              maskColor="rgba(40, 40, 40, 0.7)" // Darker mask for better contrast in dark mode
            />
            <Background gap={16} size={1} className="dark:bg-background" />
            <Panel position="top-left" className="flex gap-2 p-2">
              <Button variant="outline" size="icon" onClick={undo} disabled={currentStep <= 0}><Undo2 className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={redo} disabled={currentStep >= history.length - 1}><Redo2 className="h-4 w-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Clear All</AlertDialogTitle><AlertDialogDescription>This will permanently delete all nodes and connections.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={clearAll}>Clear All</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Panel>
          </ReactFlow>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {AVAILABLE_SHAPES.map(shapeKey => (
            <ContextMenuItem
              key={`ctx-menu-${shapeKey}`}
              onClick={(e) => {
                if (!reactFlowWrapper.current || !reactFlowInstance) return;
                const rect = reactFlowWrapper.current.getBoundingClientRect();
                const position = reactFlowInstance.screenToFlowPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                createNewNode(shapeKey, position);
              }}
            >
              Add {shapeKey.charAt(0).toUpperCase() + shapeKey.slice(1)} Node
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

export default function FlowPage() {
  return (<ReactFlowProvider><Flow /></ReactFlowProvider>);
}
