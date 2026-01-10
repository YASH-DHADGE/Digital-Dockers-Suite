const asyncHandler = require('express-async-handler');
const Space = require('../models/Space');
const SpaceContent = require('../models/SpaceContent');
const SpaceMember = require('../models/SpaceMember');
const SpaceActivity = require('../models/SpaceActivity');
const Project = require('../models/Project');
const User = require('../models/User');

/**
 * Space Controller
 * Manages CRUD operations for Spaces
 */

// @desc    Create a new space in a project
// @route   POST /api/spaces
// @access  Private
exports.createSpace = asyncHandler(async (req, res) => {
  const { projectId, title, description, defaultContentType = 'TEXT' } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (!projectId || !title) {
    res.status(400);
    throw new Error('Project ID and title are required');
  }

  // Verify project exists and user has access
  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is project member
  const isMember = project.members?.includes(userId);
  if (!isMember) {
    res.status(403);
    throw new Error('You do not have access to this project');
  }

  // Create space
  const space = await Space.create({
    project: projectId,
    title,
    description,
    defaultContentType,
    createdBy: userId,
    updatedBy: userId
  });

  // Add creator as owner
  await SpaceMember.create({
    space: space._id,
    user: userId,
    role: 'OWNER',
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canManageMembers: true,
      canComment: true,
      canChangeContent: true
    },
    acceptedAt: new Date()
  });

  // Create initial content
  const initialContent = await SpaceContent.create({
    space: space._id,
    contentType: defaultContentType,
    contentJson: defaultContentType === 'TEXT' ? { blocks: [] } : {},
    version: 1,
    updatedBy: userId
  });

  // Log activity
  await SpaceActivity.create({
    space: space._id,
    activityType: 'SPACE_CREATED',
    actor: userId,
    description: `Created new space: ${title}`,
    metadata: { contentType: defaultContentType }
  });

  // Populate and return
  await space.populate([
    { path: 'createdBy', select: 'name email avatar' },
    { path: 'project', select: 'name' }
  ]);

  res.status(201).json({
    success: true,
    data: {
      ...space.toObject(),
      content: initialContent,
      currentMembers: 1
    }
  });
});

// @desc    Get all spaces in a project
// @route   GET /api/spaces/project/:projectId
// @access  Private
exports.getProjectSpaces = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;
  const { archived = false, sort = '-createdAt' } = req.query;

  // Verify project exists
  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Fetch spaces - allow access if user is space member, even if not project member
  const userSpaces = await SpaceMember.find({ user: userId }).distinct('space');
  
  const spaces = await Space.find({
    project: projectId,
    isArchived: archived === 'true',
    $or: [
      { _id: { $in: userSpaces } },  // User is a space member
      { createdBy: userId }           // User created the space
    ]
  })
    .sort(sort)
    .populate('createdBy', 'name email avatar')
    .populate('updatedBy', 'name email avatar')
    .lean();

  // Enrich with member info
  const enrichedSpaces = await Promise.all(
    spaces.map(async (space) => {
      const members = await SpaceMember.find({ space: space._id })
        .populate('user', 'name email avatar')
        .lean();
      
      const currentMemberRole = members.find(m => m.user._id.toString() === userId.toString());
      
      return {
        ...space,
        members: members.map(m => ({
          id: m.user._id,
          name: m.user.name,
          email: m.user.email,
          avatar: m.user.avatar,
          role: m.role
        })),
        userRole: currentMemberRole?.role || null,
        canEdit: ['OWNER', 'EDITOR'].includes(currentMemberRole?.role)
      };
    })
  );

  res.json({
    success: true,
    data: enrichedSpaces,
    total: enrichedSpaces.length
  });
});

// @desc    Get a single space with content
// @route   GET /api/spaces/:spaceId
// @access  Private
exports.getSpace = asyncHandler(async (req, res) => {
  const { spaceId } = req.params;
  const userId = req.user._id;

  const space = await Space.findById(spaceId)
    .populate('createdBy', 'name email avatar')
    .populate('updatedBy', 'name email avatar');

  if (!space) {
    res.status(404);
    throw new Error('Space not found');
  }

  // Check permissions
  const member = await SpaceMember.findOne({ space: spaceId, user: userId });
  if (!member) {
    res.status(403);
    throw new Error('You do not have access to this space');
  }

  // Get current content
  const content = await SpaceContent.findOne({ space: spaceId })
    .sort({ version: -1 })
    .populate('updatedBy', 'name email avatar');

  // Get members
  const members = await SpaceMember.find({ space: spaceId })
    .populate('user', 'name email avatar')
    .lean();

  // Update access tracking
  await SpaceMember.findByIdAndUpdate(member._id, {
    lastAccessedAt: new Date()
  });

  // Track view
  space.viewCount = (space.viewCount || 0) + 1;
  await space.save();

  res.json({
    success: true,
    data: {
      ...space.toObject(),
      content,
      members: members.map(m => ({
        id: m.user._id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar,
        role: m.role,
        lastAccessedAt: m.lastAccessedAt
      })),
      userRole: member.role,
      userPermissions: member.permissions
    }
  });
});

// @desc    Update space metadata
// @route   PATCH /api/spaces/:spaceId
// @access  Private
exports.updateSpace = asyncHandler(async (req, res) => {
  const { spaceId } = req.params;
  const { title, description, isArchived, allowComments } = req.body;
  const userId = req.user._id;

  const space = await Space.findById(spaceId);
  if (!space) {
    res.status(404);
    throw new Error('Space not found');
  }

  // Check permissions
  const member = await SpaceMember.findOne({ space: spaceId, user: userId });
  if (!member || !['OWNER', 'EDITOR'].includes(member.role)) {
    res.status(403);
    throw new Error('You do not have permission to edit this space');
  }

  const changes = {};
  if (title !== undefined && title !== space.title) changes.title = { old: space.title, new: title };
  if (description !== undefined && description !== space.description) changes.description = { old: space.description, new: description };
  if (isArchived !== undefined && isArchived !== space.isArchived) changes.isArchived = { old: space.isArchived, new: isArchived };
  if (allowComments !== undefined && allowComments !== space.allowComments) changes.allowComments = { old: space.allowComments, new: allowComments };

  // Update space
  if (title !== undefined) space.title = title;
  if (description !== undefined) space.description = description;
  if (isArchived !== undefined) space.isArchived = isArchived;
  if (allowComments !== undefined) space.allowComments = allowComments;
  space.updatedBy = userId;

  await space.save();

  // Log activity
  await SpaceActivity.create({
    space: spaceId,
    activityType: 'SPACE_UPDATED',
    actor: userId,
    description: `Updated space: ${title || space.title}`,
    changes
  });

  res.json({
    success: true,
    data: space
  });
});

// @desc    Delete/archive a space
// @route   DELETE /api/spaces/:spaceId
// @access  Private
exports.deleteSpace = asyncHandler(async (req, res) => {
  const { spaceId } = req.params;
  const userId = req.user._id;

  const space = await Space.findById(spaceId);
  if (!space) {
    res.status(404);
    throw new Error('Space not found');
  }

  // Check permissions - only owner can delete
  const member = await SpaceMember.findOne({ space: spaceId, user: userId });
  if (!member || member.role !== 'OWNER') {
    res.status(403);
    throw new Error('Only space owner can delete');
  }

  // Soft delete (archive)
  space.isArchived = true;
  space.updatedBy = userId;
  await space.save();

  // Log activity
  await SpaceActivity.create({
    space: spaceId,
    activityType: 'SPACE_ARCHIVED',
    actor: userId,
    description: `Archived space: ${space.title}`
  });

  res.json({
    success: true,
    message: 'Space archived successfully',
    data: space
  });
});

// @desc    Get space version history
// @route   GET /api/spaces/:spaceId/versions
// @access  Private
exports.getVersionHistory = asyncHandler(async (req, res) => {
  const { spaceId } = req.params;
  const userId = req.user._id;
  const { limit = 50, skip = 0 } = req.query;

  // Check access
  const member = await SpaceMember.findOne({ space: spaceId, user: userId });
  if (!member) {
    res.status(403);
    throw new Error('You do not have access to this space');
  }

  const versions = await SpaceContent.find({ space: spaceId })
    .sort({ version: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .populate('updatedBy', 'name email avatar');

  const total = await SpaceContent.countDocuments({ space: spaceId });

  res.json({
    success: true,
    data: versions,
    pagination: {
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      hasMore: parseInt(skip) + parseInt(limit) < total
    }
  });
});

// @desc    Revert to a specific version
// @route   POST /api/spaces/:spaceId/versions/:versionId/revert
// @access  Private
exports.revertToVersion = asyncHandler(async (req, res) => {
  const { spaceId, versionId } = req.params;
  const userId = req.user._id;

  // Check permissions
  const member = await SpaceMember.findOne({ space: spaceId, user: userId });
  if (!member || !['OWNER', 'EDITOR'].includes(member.role)) {
    res.status(403);
    throw new Error('You do not have permission to revert changes');
  }

  // Get target version
  const targetVersion = await SpaceContent.findById(versionId);
  if (!targetVersion || targetVersion.space.toString() !== spaceId) {
    res.status(404);
    throw new Error('Version not found');
  }

  // Create new version with reverted content
  const newVersion = await SpaceContent.create({
    space: spaceId,
    contentType: targetVersion.contentType,
    contentJson: targetVersion.contentJson,
    textContent: targetVersion.textContent,
    drawingData: targetVersion.drawingData,
    mindmapData: targetVersion.mindmapData,
    version: (await SpaceContent.countDocuments({ space: spaceId })) + 1,
    updatedBy: userId,
    editSummary: `Reverted to version ${targetVersion.version}`,
    isMajorVersion: true
  });

  // Log activity
  await SpaceActivity.create({
    space: spaceId,
    activityType: 'CONTENT_REVERTED',
    actor: userId,
    description: `Reverted to version ${targetVersion.version}`,
    contentVersion: versionId,
    metadata: { fromVersion: targetVersion.version, toVersion: newVersion.version }
  });

  res.json({
    success: true,
    data: newVersion
  });
});

module.exports = exports;
