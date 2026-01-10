/**
 * ============================================================================
 * WORK ITEM SERVICE
 * ============================================================================
 * 
 * Handles business logic for work items including:
 * - Parent-child relationships
 * - Status auto-updates based on children
 * - Story points calculation
 * - Cascade operations
 * - Validation rules
 * 
 * Prevents common issues:
 * - N+1 queries (batch operations)
 * - Transaction safety (atomic updates)
 * - Invalid parent-child configurations
 */

const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

class WorkItemService {
    /**
     * Create a sub-task under a parent work item
     * 
     * @param {String} parentId - Parent work item ID
     * @param {Object} subtaskData - Sub-task data { title, description, priority, ... }
     * @param {String} userId - User creating the sub-task
     * @returns {Promise<Object>} Created sub-task
     * @throws {Error} If parent not found, invalid parent, or other validation fails
     */
    static async createSubtask(parentId, subtaskData, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Validate parent exists and is valid
            const parent = await Task.findById(parentId).session(session);
            if (!parent) {
                throw new Error('Parent work item not found');
            }

            // 2. Enforce rules
            if (parent.issueType === 'epic') {
                throw new Error('Cannot create subtasks under Epic items');
            }

            if (parent.parentTask) {
                throw new Error('Cannot create subtasks under a subtask (max nesting depth = 1)');
            }

            // 3. Create subtask
            const subtask = new Task({
                ...subtaskData,
                issueType: 'subtask',
                parentTask: parentId,
                project: parent.project,
                sprint: parent.sprint, // Inherit sprint from parent
                reporter: userId,
                assignedBy: userId
            });

            await subtask.save({ session });

            // 4. Update parent's status to in_progress if it's still todo
            if (parent.status === 'todo') {
                await Task.findByIdAndUpdate(
                    parentId,
                    { status: 'in_progress' },
                    { new: true, session }
                );
            }

            // 5. Log the action
            await this.logAction(
                'SUBTASK_CREATED',
                parentId,
                `Subtask created: ${subtask.title}`,
                userId,
                { subtaskId: subtask._id, subtaskTitle: subtask.title },
                session
            );

            await session.commitTransaction();
            
            // Return populated subtask
            await subtask.populate(['assignedTo', 'reporter', 'assignedBy']);
            return subtask;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Get all children of a work item with pagination
     * 
     * @param {String} parentId - Parent work item ID
     * @param {Object} options - { skip, limit, sortBy, status }
     * @returns {Promise<Object>} { children, total, hasMore }
     */
    static async getChildren(parentId, options = {}) {
        const { skip = 0, limit = 50, sortBy = 'createdAt', status } = options;

        try {
            // Validate parent exists
            const parent = await Task.findById(parentId);
            if (!parent) {
                throw new Error('Parent work item not found');
            }

            // Build query
            const query = { parentTask: parentId };
            if (status) {
                query.status = status;
            }

            // Execute query with pagination
            const [children, total] = await Promise.all([
                Task.find(query)
                    .populate(['assignedTo', 'reporter', 'assignedBy'])
                    .sort({ [sortBy]: 1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Task.countDocuments(query)
            ]);

            return {
                children,
                total,
                skip,
                limit,
                hasMore: skip + children.length < total
            };
        } catch (error) {
            throw new Error(`Failed to fetch children: ${error.message}`);
        }
    }

    /**
     * Update child work item status and auto-update parent if needed
     * 
     * @param {String} childId - Child work item ID
     * @param {String} newStatus - New status
     * @param {String} userId - User performing update
     * @returns {Promise<Object>} Updated child and parent (if modified)
     */
    static async updateChildStatus(childId, newStatus, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Update child status
            const child = await Task.findByIdAndUpdate(
                childId,
                { status: newStatus },
                { new: true, session }
            );

            if (!child) {
                throw new Error('Child work item not found');
            }

            // 2. If child is a subtask, auto-update parent
            if (child.parentTask) {
                const parentUpdate = await this.evaluateParentStatusUpdate(
                    child.parentTask,
                    userId,
                    session
                );

                // 3. Log child status change
                await this.logAction(
                    'CHILD_STATUS_CHANGED',
                    child.parentTask,
                    `Child status updated: ${child.title} → ${newStatus}`,
                    userId,
                    { childId, childTitle: child.title, oldStatus: child.status, newStatus },
                    session
                );

                await session.commitTransaction();

                await child.populate(['assignedTo', 'reporter', 'assignedBy']);
                await parentUpdate.populate(['assignedTo', 'reporter', 'assignedBy']);

                return { child, parent: parentUpdate };
            }

            // 4. Log the action
            await this.logAction(
                'ITEM_STATUS_CHANGED',
                childId,
                `Status changed to ${newStatus}`,
                userId,
                { oldStatus: child.status, newStatus },
                session
            );

            await session.commitTransaction();
            await child.populate(['assignedTo', 'reporter', 'assignedBy']);
            return { child, parent: null };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Evaluate if parent status should be updated based on children's statuses
     * 
     * Rules:
     * - If all children are DONE → parent becomes DONE
     * - If any child is IN_PROGRESS → parent becomes IN_PROGRESS
     * - Otherwise → parent becomes REVIEW
     * 
     * @param {String} parentId - Parent ID
     * @param {String} userId - User performing update
     * @param {Object} session - Mongoose session for transaction
     * @returns {Promise<Object>} Updated parent
     */
    static async evaluateParentStatusUpdate(parentId, userId, session) {
        const children = await Task.find({ parentTask: parentId })
            .session(session);

        if (children.length === 0) {
            return await Task.findById(parentId).session(session);
        }

        let newStatus = 'todo';

        // If all done → mark parent done
        const allDone = children.every(c => c.status === 'done');
        if (allDone) {
            newStatus = 'done';
        } else {
            // If any in progress → mark in progress
            const anyInProgress = children.some(c => c.status === 'in_progress');
            if (anyInProgress) {
                newStatus = 'in_progress';
            } else {
                // Otherwise default to review if any are in review
                const anyInReview = children.some(c => c.status === 'review');
                newStatus = anyInReview ? 'review' : 'todo';
            }
        }

        const parent = await Task.findByIdAndUpdate(
            parentId,
            { status: newStatus },
            { new: true, session }
        );

        return parent;
    }

    /**
     * Move child to a different parent or make it standalone
     * 
     * @param {String} childId - Child work item ID
     * @param {String} newParentId - New parent ID (null to detach)
     * @param {String} userId - User performing operation
     * @returns {Promise<Object>} Updated child
     */
    static async moveChild(childId, newParentId, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const child = await Task.findById(childId).session(session);
            if (!child) {
                throw new Error('Child work item not found');
            }

            const oldParentId = child.parentTask;

            // Validate new parent (if provided)
            if (newParentId) {
                const newParent = await Task.findById(newParentId).session(session);
                if (!newParent) {
                    throw new Error('New parent work item not found');
                }
                if (newParent.issueType === 'epic') {
                    throw new Error('Cannot move child under Epic');
                }
                if (newParent.parentTask) {
                    throw new Error('Cannot move child under a subtask');
                }
            }

            // Update child
            child.parentTask = newParentId || null;
            if (!newParentId) {
                child.issueType = 'task'; // Convert back to task if detached
            }
            await child.save({ session });

            // Auto-update old parent status if it had children
            if (oldParentId) {
                await this.evaluateParentStatusUpdate(oldParentId, userId, session);
            }

            // Auto-update new parent status if assigning to one
            if (newParentId) {
                await this.evaluateParentStatusUpdate(newParentId, userId, session);
            }

            // Log the action
            await this.logAction(
                'CHILD_MOVED',
                childId,
                `Child moved from parent ${oldParentId} to ${newParentId || 'standalone'}`,
                userId,
                { childId, childTitle: child.title, oldParentId, newParentId },
                session
            );

            await session.commitTransaction();
            await child.populate(['assignedTo', 'reporter', 'assignedBy']);
            return child;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Delete work item with cascade safety
     * 
     * Rules:
     * - Can delete child without restriction
     * - Can only delete parent if no children exist
     * 
     * @param {String} itemId - Work item ID
     * @param {String} userId - User performing delete
     * @returns {Promise<Object>} Deleted item
     * @throws {Error} If parent has children
     */
    static async deleteWorkItem(itemId, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const item = await Task.findById(itemId).session(session);
            if (!item) {
                throw new Error('Work item not found');
            }

            // Check if this is a parent with children
            const childCount = await Task.countDocuments({ parentTask: itemId }).session(session);
            if (childCount > 0) {
                throw new Error(
                    `Cannot delete: This work item has ${childCount} child(ren). ` +
                    'Delete or move children first.'
                );
            }

            // Delete the item
            const deletedItem = await Task.findByIdAndDelete(itemId, { session });

            // If it was a subtask, update parent
            if (item.parentTask) {
                await this.evaluateParentStatusUpdate(item.parentTask, userId, session);

                await this.logAction(
                    'CHILD_DELETED',
                    item.parentTask,
                    `Child deleted: ${item.title}`,
                    userId,
                    { childId: itemId, childTitle: item.title },
                    session
                );
            }

            // Log deletion
            await this.logAction(
                'ITEM_DELETED',
                itemId,
                `Work item deleted: ${item.title}`,
                userId,
                { itemTitle: item.title, itemType: item.issueType },
                session
            );

            await session.commitTransaction();
            return deletedItem;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Calculate total story points including children (optional aggregation)
     * 
     * @param {String} itemId - Work item ID
     * @returns {Promise<Object>} { own: Number, children: Number, total: Number }
     */
    static async calculateStoryPoints(itemId) {
        try {
            const item = await Task.findById(itemId);
            if (!item) {
                throw new Error('Work item not found');
            }

            const childrenPoints = await Task.aggregate([
                { $match: { parentTask: mongoose.Types.ObjectId(itemId) } },
                { $group: { _id: null, total: { $sum: '$storyPoints' } } }
            ]);

            const ownPoints = item.storyPoints || 0;
            const childrenTotal = childrenPoints[0]?.total || 0;
            const total = ownPoints + childrenTotal;

            return {
                own: ownPoints,
                children: childrenTotal,
                total,
                hasChildren: childrenTotal > 0
            };
        } catch (error) {
            throw new Error(`Failed to calculate story points: ${error.message}`);
        }
    }

    /**
     * Get work item hierarchy (parent + children)
     * 
     * @param {String} itemId - Work item ID
     * @returns {Promise<Object>} { item, parent, children }
     */
    static async getHierarchy(itemId) {
        try {
            const item = await Task.findById(itemId)
                .populate(['assignedTo', 'reporter', 'assignedBy']);
            
            if (!item) {
                throw new Error('Work item not found');
            }

            let parent = null;
            let children = [];

            if (item.parentTask) {
                parent = await Task.findById(item.parentTask)
                    .populate(['assignedTo', 'reporter', 'assignedBy']);
            } else {
                children = await Task.find({ parentTask: itemId })
                    .populate(['assignedTo', 'reporter', 'assignedBy'])
                    .sort({ createdAt: 1 });
            }

            return { item, parent, children };
        } catch (error) {
            throw new Error(`Failed to get hierarchy: ${error.message}`);
        }
    }

    /**
     * Bulk status update for children (used in automation)
     * 
     * @param {String} parentId - Parent ID
     * @param {String} newStatus - New status for all children
     * @param {String} userId - User performing update
     * @returns {Promise<Object>} { updated, total }
     */
    static async bulkUpdateChildrenStatus(parentId, newStatus, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const result = await Task.updateMany(
                { parentTask: parentId },
                { status: newStatus },
                { session }
            );

            // Auto-update parent
            await this.evaluateParentStatusUpdate(parentId, userId, session);

            // Log bulk action
            await this.logAction(
                'BULK_CHILDREN_STATUS_UPDATED',
                parentId,
                `${result.modifiedCount} children status updated to ${newStatus}`,
                userId,
                { count: result.modifiedCount, newStatus },
                session
            );

            await session.commitTransaction();
            return { updated: result.modifiedCount, total: result.matchedCount };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Log an action (audit trail)
     * 
     * @private
     * @param {String} actionType - Type of action (e.g., SUBTASK_CREATED)
     * @param {String} itemId - Item ID affected
     * @param {String} description - Human-readable description
     * @param {String} userId - User who performed action
     * @param {Object} metadata - Additional data
     * @param {Object} session - Mongoose session
     */
    static async logAction(actionType, itemId, description, userId, metadata, session) {
        try {
            if (!ActivityLog) return; // Skip if ActivityLog not available

            await ActivityLog.create(
                [
                    {
                        actionType,
                        itemId,
                        itemType: 'Task',
                        description,
                        userId,
                        metadata,
                        timestamp: new Date()
                    }
                ],
                { session }
            );
        } catch (error) {
            console.error('Failed to log action:', error.message);
            // Don't throw - logging failure shouldn't break the operation
        }
    }

    /**
     * Validate parent-child assignment
     * 
     * @param {String} parentId - Parent ID
     * @param {String} childId - Child ID
     * @returns {Promise<Object>} { valid: Boolean, errors: String[] }
     */
    static async validateParentChildRelationship(parentId, childId) {
        const errors = [];

        try {
            const parent = await Task.findById(parentId);
            if (!parent) {
                errors.push('Parent work item not found');
                return { valid: false, errors };
            }

            if (parentId === childId) {
                errors.push('Work item cannot be its own parent');
            }

            if (parent.issueType === 'epic') {
                errors.push('Epics cannot have children');
            }

            if (parent.parentTask) {
                errors.push('Subtasks cannot have children (max nesting = 1)');
            }

            // Check for circular references
            if (!parentId === childId) {
                let current = parent.parentTask;
                while (current) {
                    if (current.toString() === childId) {
                        errors.push('Creating this relationship would create a circular reference');
                        break;
                    }
                    const ancestor = await Task.findById(current);
                    current = ancestor?.parentTask;
                }
            }

            return { valid: errors.length === 0, errors };
        } catch (error) {
            errors.push(`Validation error: ${error.message}`);
            return { valid: false, errors };
        }
    }
}

module.exports = WorkItemService;
