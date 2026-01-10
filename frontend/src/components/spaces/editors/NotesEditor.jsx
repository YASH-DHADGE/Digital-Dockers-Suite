import React, { useState, useEffect } from 'react';
import { Button, Space, Divider, message } from 'antd';
import { SaveOutlined, BoldOutlined, ItalicOutlined, UnorderedListOutlined, OrderedListOutlined } from '@ant-design/icons';
import './NotesEditor.css';

/**
 * Notes Editor Component
 * Rich text editor for collaborative note-taking
 */
const NotesEditor = ({
  content,
  setContent,
  onSave,
  isConnected,
  activeUsers,
  typingUsers,
  currentUser,
  isSaving
}) => {
  const [text, setText] = useState(content?.textContent || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setText(content?.textContent || '');
  }, [content]);

  const handleChange = (e) => {
    setText(e.target.value);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const updated = {
      ...content,
      textContent: text,
      contentType: 'TEXT'
    };

    await onSave(updated, `Updated notes`);
    setIsEditing(false);
  };

  const insertMarkdown = (before, after = '') => {
    const textarea = document.querySelector('.notes-editor textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);

    setText(newText);
    setIsEditing(true);

    // Move cursor
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  const formatters = [
    {
      icon: <BoldOutlined />,
      title: 'Bold',
      action: () => insertMarkdown('**', '**')
    },
    {
      icon: <ItalicOutlined />,
      title: 'Italic',
      action: () => insertMarkdown('*', '*')
    },
    {
      icon: <UnorderedListOutlined />,
      title: 'Bullet List',
      action: () => insertMarkdown('\n- ', '')
    },
    {
      icon: <OrderedListOutlined />,
      title: 'Numbered List',
      action: () => insertMarkdown('\n1. ', '')
    }
  ];

  return (
    <div className="notes-editor-container">
      <div className="notes-toolbar">
        <Space size="small">
          {formatters.map((formatter, idx) => (
            <Button
              key={idx}
              type="text"
              size="small"
              icon={formatter.icon}
              title={formatter.title}
              onClick={formatter.action}
            />
          ))}
        </Space>

        <Divider type="vertical" />

        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<SaveOutlined />}
            loading={isSaving}
            disabled={!isEditing || !isConnected}
            onClick={handleSave}
          >
            Save
          </Button>

          {isConnected && activeUsers && (
            <span className="collaborators">
              👥 {activeUsers.length} editing
            </span>
          )}
        </Space>
      </div>

      <textarea
        className="notes-editor"
        value={text}
        onChange={handleChange}
        placeholder="Start typing your notes... You can use Markdown syntax!"
        style={{
          width: '100%',
          minHeight: '500px',
          padding: '16px',
          fontFamily: 'monospace',
          fontSize: '14px',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          resize: 'none'
        }}
      />

      <div className="notes-footer">
        <span className="char-count">{text.length} characters</span>
        <span className="line-count">{text.split('\n').length} lines</span>
        {isEditing && <span className="unsaved-indicator">● Unsaved changes</span>}
      </div>

      {/* Typing indicators */}
      {typingUsers.size > 0 && (
        <div className="typing-indicator">
          <span className="typing-dots">
            {Array.from(typingUsers).slice(0, 3).join(', ')} typing...
          </span>
        </div>
      )}
    </div>
  );
};

export default NotesEditor;
