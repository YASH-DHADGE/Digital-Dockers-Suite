const asyncHandler = require('express-async-handler');
const Space = require('../models/Space');
const SpaceContent = require('../models/SpaceContent');
const SpaceMember = require('../models/SpaceMember');
const SpaceActivity = require('../models/SpaceActivity');

/**
 * Space Content Controller
 * Manages content updates with versioning and conflict resolution
 */

// @desc    Update space content
// @route   PATCH /api/spaces/:spaceId/content
// @access  Private
exports.updateContent = asyncHandler(async (req, res) => {
  const { spaceId } = req.params;
  const { contentType, contentJson, textContent, drawingData, mindmapData, editSummary, isMajorVersion = false } = req.body;
  const userId = req.user._id;

  // Check permissions
  const member = await SpaceMember.findOne({ space: spaceId, user: userId });
  if (!member || !member.permissions?.canChangeContent) {
    res.status(403);
    throw new Error('You do not have permission to edit content');
  }

  // Get current version
  const currentContent = await SpaceContent.findOne({ space: spaceId }).sort({ version: -1 });
  if (!currentContent) {
    res.status(404);
    throw new Error('Space content not found');
  }

  // Create new version
  const newVersion = await SpaceContent.create({
    space: spaceId,
    contentType: contentType || currentContent.contentType,
    contentJson: contentJson || currentContent.contentJson,
    textContent: textContent !== undefined ? textContent : currentContent.textContent,
    drawingData: drawingData !== undefined ? drawingData : currentContent.drawingData,
    mindmapData: mindmapData !== undefined ? mindmapData : currentContent.mindmapData,
    version: currentContent.version + 1,
    previousVersion: currentContent._id,
    updatedBy: userId,
    editSummary: editSummary || 'Content updated',
    isMajorVersion,
    isAutoSave: !isMajorVersion
  });

  // Update space stats
  await Space.findByIdAndUpdate(spaceId, {
    versionCount: currentContent.version + 1,
    updatedBy: userId
  });

  // Update member contribution
  await SpaceMember.findOneAndUpdate(
    { space: spaceId, user: userId },
    {
      lastEditedAt: new Date(),
      $inc: { contributionCount: 1 }
    }
  );

  // Log activity
  await SpaceActivity.create({
    space: spaceId,
    activityType: 'CONTENT_EDITED',
    actor: userId,
    description: editSummary || 'Content updated',
    contentVersion: newVersion._id,
    metadata: { 
      contentType: newVersion.contentType,
      isMajorVersion,
      version: newVersion.version
    }
  });

  res.json({
    success: true,
    data: {
      ...newVersion.toObject(),
      previousVersion: currentContent.version
    }
  });
});

// @desc    Get content changes between versions
// @route   GET /api/spaces/:spaceId/content/diff/:v1/:v2
// @access  Private
exports.getContentDiff = asyncHandler(async (req, res) => {
  const { spaceId, v1, v2 } = req.params;
  const userId = req.user._id;

  // Check access
  const member = await SpaceMember.findOne({ space: spaceId, user: userId });
  if (!member) {
    res.status(403);
    throw new Error('You do not have access to this space');
  }

  const version1 = await SpaceContent.findOne({ space: spaceId, version: v1 });
  const version2 = await SpaceContent.findOne({ space: spaceId, version: v2 });

  if (!version1 || !version2) {
    res.status(404);
    throw new Error('Version not found');
  }

  // Simple diff (for complex diff, use diff-match-patch library)
  const diff = {
    v1: parseInt(v1),
    v2: parseInt(v2),
    changes: {
      textContent: {
        from: version1.textContent,
        to: version2.textContent
      },
      editSummary: version2.editSummary,
      editedBy: version2.updatedBy,
      editedAt: version2.createdAt
    }
  };

  res.json({
    success: true,
    data: diff
  });
});

// @desc    Autosave content
// @route   POST /api/spaces/:spaceId/autosave
// @access  Private
exports.autosaveContent = asyncHandler(async (req, res) => {
  const { spaceId } = req.params;
  const { contentJson, textContent, drawingData, mindmapData } = req.body;
  const userId = req.user._id;

  // Check permissions
  const member = await SpaceMember.findOne({ space: spaceId, user: userId });
  if (!member || !member.permissions?.canChangeContent) {
    res.status(403);
    throw new Error('You do not have permission to edit content');
  }

  // Get current version
  const currentContent = await SpaceContent.findOne({ space: spaceId }).sort({ version: -1 });
  if (!currentContent) {
    res.status(404);
    throw new Error('Space content not found');
  }

  // Create autosave version
  const newVersion = await SpaceContent.create({
    space: spaceId,
    contentType: currentContent.contentType,
    contentJson: contentJson || currentContent.contentJson,
    textContent: textContent !== undefined ? textContent : currentContent.textContent,
    drawingData: drawingData !== undefined ? drawingData : currentContent.drawingData,
    mindmapData: mindmapData !== undefined ? mindmapData : currentContent.mindmapData,
    version: currentContent.version + 1,
    previousVersion: currentContent._id,
    updatedBy: userId,
    editSummary: 'Autosave',
    isAutoSave: true,
    isMajorVersion: false
  });

  // Update member last edited
  await SpaceMember.findOneAndUpdate(
    { space: spaceId, user: userId },
    { lastEditedAt: new Date() }
  );

  res.json({
    success: true,
    data: {
      version: newVersion.version,
      savedAt: newVersion.createdAt,
      isMajorVersion: false
    }
  });
});

module.exports = exports;
