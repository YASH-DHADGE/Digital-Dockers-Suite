import React, { useState, useEffect } from 'react';
import { Button, Space, Input, Divider, message } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons';
import './MindMapEditor.css';

/**
 * Mind Map Editor Component
 * Create and edit mind maps collaboratively
 * Uses hierarchical node structure
 */
const MindMapEditor = ({
  content,
  setContent,
  onSave,
  isConnected,
  activeUsers,
  currentUser,
  isSaving
}) => {
  const [nodes, setNodes] = useState(content?.mindmapData?.nodes || [
    { id: 'root', label: 'Main Topic', x: 400, y: 200, children: [] }
  ]);
  const [edges, setEdges] = useState(content?.mindmapData?.edges || []);
  const [selectedNodeId, setSelectedNodeId] = useState('root');
  const [newNodeLabel, setNewNodeLabel] = useState('');

  const getNode = (id) => nodes.find(n => n.id === id);
  const selectedNode = getNode(selectedNodeId);

  const handleAddNode = () => {
    if (!newNodeLabel.trim()) {
      message.warning('Please enter a node label');
      return;
    }

    const parentNode = getNode(selectedNodeId);
    if (!parentNode) return;

    const newNodeId = `node-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      label: newNodeLabel,
      x: parentNode.x + 150,
      y: parentNode.y + 50,
      children: []
    };

    // Update parent to include child
    const updatedParent = {
      ...parentNode,
      children: [...(parentNode.children || []), newNodeId]
    };

    // Create edge
    const newEdge = {
      id: `edge-${parentNode.id}-${newNodeId}`,
      from: parentNode.id,
      to: newNodeId
    };

    setNodes([
      ...nodes.map(n => n.id === parentNode.id ? updatedParent : n),
      newNode
    ]);
    setEdges([...edges, newEdge]);
    setNewNodeLabel('');
    setSelectedNodeId(newNodeId);
  };

  const handleDeleteNode = (nodeId) => {
    if (nodeId === 'root') {
      message.error('Cannot delete root node');
      return;
    }

    // Find parent
    const parentNode = nodes.find(n => n.children?.includes(nodeId));
    if (!parentNode) return;

    // Update parent
    const updatedParent = {
      ...parentNode,
      children: parentNode.children.filter(id => id !== nodeId)
    };

    // Remove node and its edges
    const newNodes = nodes.filter(n => n.id !== nodeId).map(n => n.id === parentNode.id ? updatedParent : n);
    const newEdges = edges.filter(e => e.from !== nodeId && e.to !== nodeId);

    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNodeId('root');
  };

  const handleUpdateNodeLabel = (label) => {
    if (!selectedNode) return;

    setNodes(nodes.map(n =>
      n.id === selectedNode.id ? { ...n, label } : n
    ));
  };

  const handleSave = async () => {
    const updated = {
      ...content,
      mindmapData: {
        nodes,
        edges
      },
      contentType: 'MINDMAP'
    };

    await onSave(updated, 'Updated mind map');
  };

  const renderMindMap = () => {
    return (
      <svg className="mindmap-canvas" width="100%" height="600">
        {/* Draw edges */}
        {edges.map(edge => {
          const fromNode = getNode(edge.from);
          const toNode = getNode(edge.to);
          if (!fromNode || !toNode) return null;

          return (
            <line
              key={edge.id}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke="#ddd"
              strokeWidth="2"
            />
          );
        })}

        {/* Draw nodes */}
        {nodes.map(node => (
          <g
            key={node.id}
            onClick={() => setSelectedNodeId(node.id)}
            className={`mindmap-node ${selectedNodeId === node.id ? 'selected' : ''}`}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r="40"
              fill={selectedNodeId === node.id ? '#0052cc' : '#f5f5f5'}
              stroke={selectedNodeId === node.id ? '#0052cc' : '#ddd'}
              strokeWidth="2"
              style={{ cursor: 'pointer' }}
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="mindmap-text"
              fill={selectedNodeId === node.id ? '#fff' : '#000'}
              style={{ pointerEvents: 'none', fontSize: '12px' }}
            >
              {node.label.slice(0, 8)}...
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="mindmap-container">
      <div className="mindmap-canvas-area">
        {renderMindMap()}
      </div>

      <Divider />

      <div className="mindmap-editor">
        <h4>📝 Edit Node</h4>

        {selectedNode && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="Node label"
              value={selectedNode.label}
              onChange={(e) => handleUpdateNodeLabel(e.target.value)}
            />

            <Space>
              <Button
                icon={<PlusOutlined />}
                onClick={handleAddNode}
              >
                Add Child Node
              </Button>
              {selectedNode.id !== 'root' && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteNode(selectedNode.id)}
                >
                  Delete
                </Button>
              )}
            </Space>

            <Input
              placeholder="New node label"
              value={newNodeLabel}
              onChange={(e) => setNewNodeLabel(e.target.value)}
              onPressEnter={handleAddNode}
            />

            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={isSaving}
              disabled={!isConnected}
              onClick={handleSave}
              block
            >
              Save Mind Map
            </Button>
          </Space>
        )}

        {isConnected && (
          <div className="collaborators">
            👥 {activeUsers?.length || 0} editing
          </div>
        )}
      </div>
    </div>
  );
};

export default MindMapEditor;
