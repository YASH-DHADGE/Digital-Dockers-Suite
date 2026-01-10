const mongoose = require('mongoose');

/**
 * SpaceComment Model
 * Stores comments/discussions within a Space
 * Supports threading and @mentions
 */
const spaceCommentSchema = new mongoose.Schema(
  {
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Space',
      required: true,
      index: true
    },
    
    // Comment content
    text: {
      type: String,
      required: true,
      maxlength: 5000
    },
    
    // Author
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Threading
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SpaceComment'
    },
    
    // Context (what is this comment on?)
    contentVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SpaceContent'
    },
    contentType: {
      type: String,
      enum: ['SPACE', 'CONTENT_VERSION', 'DRAWING_ELEMENT', 'MINDMAP_NODE']
    },
    
    // Location in content (for whiteboard/mindmap)
    elementId: String, // ID of drawing element or mindmap node
    coordinates: {
      x: Number,
      y: Number
    },
    
    // Mentions
    mentions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    // Reactions (emoji reactions)
    reactions: [{
      emoji: String,
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    
    // Status
    isResolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    
    // Tracking
    editHistory: [{
      editedAt: Date,
      editedBy: mongoose.Schema.Types.ObjectId,
      previousText: String
    }],
    
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'space_comments'
  }
);

// Indexes
spaceCommentSchema.index({ space: 1, createdAt: -1 });
spaceCommentSchema.index({ author: 1 });
spaceCommentSchema.index({ parentComment: 1 });
spaceCommentSchema.index({ isResolved: 1 });

module.exports = mongoose.model('SpaceComment', spaceCommentSchema);
