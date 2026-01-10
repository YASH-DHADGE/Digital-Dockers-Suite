const mongoose = require('mongoose');

/**
 * SpaceContent Model
 * Stores the actual content of a Space
 * Supports multiple content types with version control
 */
const spaceContentSchema = new mongoose.Schema(
  {
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Space',
      required: true,
      index: true
    },
    
    // Content type
    contentType: {
      type: String,
      enum: ['TEXT', 'WHITEBOARD', 'MINDMAP'],
      required: true,
      index: true
    },
    
    // Content storage
    contentJson: {
      type: mongoose.Schema.Types.Mixed, // Flexible for different content types
      default: {}
    },
    
    // For TEXT: rich text (HTML/JSON format)
    textContent: String,
    
    // For WHITEBOARD: drawing data (canvas JSON)
    drawingData: mongoose.Schema.Types.Mixed,
    
    // For MINDMAP: node/edge structure
    mindmapData: mongoose.Schema.Types.Mixed,
    
    // Version control
    version: {
      type: Number,
      default: 1,
      index: true
    },
    previousVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SpaceContent'
    },
    
    // Tracking
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    editSummary: String, // User's description of changes
    
    // Collaboration metadata
    collaborativeId: String, // For conflict-free collaborative editing (CRDT)
    isAutoSave: {
      type: Boolean,
      default: false
    },
    isMajorVersion: {
      type: Boolean,
      default: false // User explicitly saved vs autosave
    }
  },
  {
    timestamps: true,
    collection: 'space_contents'
  }
);

// Indexes
spaceContentSchema.index({ space: 1, contentType: 1, version: -1 });
spaceContentSchema.index({ space: 1, updatedAt: -1 });
spaceContentSchema.index({ updatedBy: 1 });

module.exports = mongoose.model('SpaceContent', spaceContentSchema);
