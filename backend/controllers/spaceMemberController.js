const asyncHandler = require('express-async-handler');
const SpaceMember = require('../models/SpaceMember');
const Space = require('../models/Space');
const SpaceActivity = require('../models/SpaceActivity');
const User = require('../models/User');

/**
 * Space Member Controller
 * Manages member access, roles, and permissions
 */

// @desc    Add member to space
// @route   POST /api/spaces/:spaceId/members
// @access  Private
exports.addMember = asyncHandler(async (req, res) => {
  const { spaceId } = req.params;
  const { userId, role = 'EDITOR' } = req.body;
  const requesterId = req.user._id;

  // Check requester permissions
  const requester = await SpaceMember.findOne({ space: spaceId, user: requesterId });
  if (!requester || !requester.permissions?.canManageMembers) {
    res.status(403);
    throw new Error('You do not have permission to manage members');
  }

  // Check if already a member
  const existing = await SpaceMember.findOne({ space: spaceId, user: userId });
  if (existing) {
    res.status(400);
    throw new Error('User is already a member');
  }

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Set permissions based on role
  const permissions = {
    canView: true,
    canComment: true,
    canEdit: ['OWNER', 'EDITOR'].includes(role),
    canDelete: role === 'OWNER',
    canManageMembers: role === 'OWNER',
    canChangeContent: ['OWNER', 'EDITOR'].includes(role)
  };

  const member = await SpaceMember.create({
    space: spaceId,
    user: userId,
    role,
    permissions,
    invitedBy: requesterId,
    invitedAt: new Date(),
    acceptedAt: new Date() // Auto-accept since added by owner
  });

  // Update space contributor count
  const space = await Space.findById(spaceId);
  space.contributorCount = (space.contributorCount || 0) + 1;
  await space.save();

  // Log activity
  await SpaceActivity.create({
    space: spaceId,
    activityType: 'MEMBER_ADDED',
    actor: requesterId,
    affectedUser: userId,
    description: `Added ${user.name} as ${role}`,
    metadata: { role }
  });

  res.status(201).json({
    success: true,
    data: {
      id: member._id,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      role,
      permissions,
      addedAt: member.createdAt
    }
  });
});

// @desc    Update member role
// @route   PATCH /api/spaces/:spaceId/members/:memberId
// @access  Private
exports.updateMemberRole = asyncHandler(async (req, res) => {
  const { spaceId, memberId } = req.params;
  const { role } = req.body;
  const requesterId = req.user._id;

  // Check requester is owner
  const requester = await SpaceMember.findOne({ space: spaceId, user: requesterId });
  if (!requester || requester.role !== 'OWNER') {
    res.status(403);
    throw new Error('Only space owner can change member roles');
  }

  // Get member to update
  const member = await SpaceMember.findById(memberId);
  if (!member || member.space.toString() !== spaceId) {
    res.status(404);
    throw new Error('Member not found');
  }

  // Prevent demoting the last owner
  if (member.role === 'OWNER' && role !== 'OWNER') {
    const ownerCount = await SpaceMember.countDocuments({ space: spaceId, role: 'OWNER' });
    if (ownerCount <= 1) {
      res.status(400);
      throw new Error('Cannot demote the last owner');
    }
  }

  const oldRole = member.role;
  member.role = role;

  // Update permissions based on role
  member.permissions = {
    canView: true,
    canComment: true,
    canEdit: ['OWNER', 'EDITOR'].includes(role),
    canDelete: role === 'OWNER',
    canManageMembers: role === 'OWNER',
    canChangeContent: ['OWNER', 'EDITOR'].includes(role)
  };

  await member.save();

  // Log activity
  await SpaceActivity.create({
    space: spaceId,
    activityType: 'MEMBER_ROLE_CHANGED',
    actor: requesterId,
    affectedUser: member.user,
    description: `Changed role from ${oldRole} to ${role}`,
    metadata: { oldRole, newRole: role }
  });

  res.json({
    success: true,
    data: {
      role: member.role,
      permissions: member.permissions
    }
  });
});

// @desc    Remove member from space
// @route   DELETE /api/spaces/:spaceId/members/:memberId
// @access  Private
exports.removeMember = asyncHandler(async (req, res) => {
  const { spaceId, memberId } = req.params;
  const requesterId = req.user._id;

  // Check requester is owner
  const requester = await SpaceMember.findOne({ space: spaceId, user: requesterId });
  if (!requester || requester.role !== 'OWNER') {
    res.status(403);
    throw new Error('Only space owner can remove members');
  }

  const member = await SpaceMember.findById(memberId);
  if (!member || member.space.toString() !== spaceId) {
    res.status(404);
    throw new Error('Member not found');
  }

  // Check if last owner
  if (member.role === 'OWNER') {
    const ownerCount = await SpaceMember.countDocuments({ space: spaceId, role: 'OWNER' });
    if (ownerCount <= 1) {
      res.status(400);
      throw new Error('Cannot remove the last owner');
    }
  }

  const user = await User.findById(member.user);
  await SpaceMember.findByIdAndDelete(memberId);

  // Update space contributor count
  const space = await Space.findById(spaceId);
  space.contributorCount = Math.max(0, (space.contributorCount || 1) - 1);
  await space.save();

  // Log activity
  await SpaceActivity.create({
    space: spaceId,
    activityType: 'MEMBER_REMOVED',
    actor: requesterId,
    affectedUser: member.user,
    description: `Removed ${user.name} from space`
  });

  res.json({
    success: true,
    message: 'Member removed'
  });
});

// @desc    Get space members
// @route   GET /api/spaces/:spaceId/members
// @access  Private
exports.getMembers = asyncHandler(async (req, res) => {
  const { spaceId } = req.params;
  const userId = req.user._id;

  // Check access
  const member = await SpaceMember.findOne({ space: spaceId, user: userId });
  if (!member) {
    res.status(403);
    throw new Error('You do not have access to this space');
  }

  const members = await SpaceMember.find({ space: spaceId })
    .populate('user', 'name email avatar')
    .populate('invitedBy', 'name email')
    .sort({ role: 1, createdAt: 1 });

  res.json({
    success: true,
    data: members.map(m => ({
      id: m._id,
      user: {
        id: m.user._id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar
      },
      role: m.role,
      permissions: m.permissions,
      lastAccessedAt: m.lastAccessedAt,
      lastEditedAt: m.lastEditedAt,
      contributionCount: m.contributionCount,
      joinedAt: m.acceptedAt || m.createdAt
    })),
    total: members.length
  });
});

module.exports = exports;
