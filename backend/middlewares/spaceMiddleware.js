const asyncHandler = require('express-async-handler');
const SpaceMember = require('../models/SpaceMember');
const Space = require('../models/Space');

/**
 * Space Permission Middleware
 * Checks if user has access to a space
 */

exports.spacePermissionCheck = asyncHandler(async (req, res, next) => {
  const { spaceId } = req.params;
  const userId = req.user._id;

  // Find space
  const space = await Space.findById(spaceId);
  if (!space) {
    res.status(404);
    throw new Error('Space not found');
  }

  // Check membership
  const member = await SpaceMember.findOne({
    space: spaceId,
    user: userId
  });

  if (!member) {
    res.status(403);
    throw new Error('You do not have access to this space');
  }

  // Attach space and member info to request
  req.space = space;
  req.spaceMember = member;

  next();
});

/**
 * Check specific permission
 */
exports.checkSpacePermission = (requiredPermission) => {
  return asyncHandler(async (req, res, next) => {
    const { spaceId } = req.params;
    const userId = req.user._id;

    const member = await SpaceMember.findOne({
      space: spaceId,
      user: userId
    });

    if (!member) {
      res.status(403);
      throw new Error('You do not have access to this space');
    }

    // Check specific permission
    if (!member.permissions[requiredPermission]) {
      res.status(403);
      throw new Error(`You do not have permission to ${requiredPermission}`);
    }

    req.spaceMember = member;
    next();
  });
};

/**
 * Require specific role
 */
exports.requireRole = (role) => {
  return asyncHandler(async (req, res, next) => {
    const { spaceId } = req.params;
    const userId = req.user._id;

    const member = await SpaceMember.findOne({
      space: spaceId,
      user: userId
    });

    if (!member) {
      res.status(403);
      throw new Error('You do not have access to this space');
    }

    const roleHierarchy = { OWNER: 3, EDITOR: 2, COMMENTER: 1, VIEWER: 0 };
    if ((roleHierarchy[member.role] || 0) < (roleHierarchy[role] || 0)) {
      res.status(403);
      throw new Error(`This action requires ${role} role or higher`);
    }

    req.spaceMember = member;
    next();
  });
};

module.exports = exports;
