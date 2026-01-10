const mongoose = require('mongoose');

/**
 * SpaceMember Model
 * Defines access control for Spaces
 * Manages roles and permissions for collaborative access
 */
const spaceMemberSchema = new mongoose.Schema(
  {
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Space',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Role-based access control
    role: {
      type: String,
      enum: ['OWNER', 'EDITOR', 'VIEWER', 'COMMENTER'],
      default: 'EDITOR',
      index: true
    },
    
    // Permission flags
    permissions: {
      canView: { type: Boolean, default: true },
      canEdit: { type: Boolean, default: true },
      canDelete: { type: Boolean, default: false },
      canManageMembers: { type: Boolean, default: false },
      canComment: { type: Boolean, default: true },
      canChangeContent: { type: Boolean, default: true }
    },
    
    // Collaboration tracking
    lastAccessedAt: Date,
    lastEditedAt: Date,
    contributionCount: {
      type: Number,
      default: 0
    },
    
    // Status
    isActive: {
      type: Boolean,
      default: true
    },
    invitedAt: Date,
    acceptedAt: Date,
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    collection: 'space_members'
  }
);

// Unique constraint: one member per space
spaceMemberSchema.index({ space: 1, user: 1 }, { unique: true });
spaceMemberSchema.index({ user: 1, space: 1 });
spaceMemberSchema.index({ space: 1, role: 1 });

module.exports = mongoose.model('SpaceMember', spaceMemberSchema);
