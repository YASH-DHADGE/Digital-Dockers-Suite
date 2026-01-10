const mongoose = require('mongoose');

/**
 * WorkLog Schema
 * Tracks time spent on work items
 * Supports both manual entries and timer-based logging
 */
const workLogSchema = new mongoose.Schema({
  // References
  workItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Time tracking
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    default: null // null when timer is running
  },
  durationMinutes: {
    type: Number,
    default: 0,
    min: 0,
    max: 1440 // Max 24 hours
  },

  // Metadata
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  logType: {
    type: String,
    enum: ['MANUAL', 'TIMER'],
    default: 'MANUAL',
    required: true
  },
  isTemporary: {
    type: Boolean,
    default: false, // true when timer running
    index: true
  },

  // Status & Approval
  status: {
    type: String,
    enum: ['RUNNING', 'STOPPED', 'FINALIZED', 'APPROVED'],
    default: 'STOPPED',
    index: true
  },

  // Approval tracking (for enterprise)
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  approvalNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Audit trail
  editedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    previousDuration: Number,
    previousDescription: String,
    editedAt: {
      type: Date,
      default: () => new Date()
    },
    reason: String
  }],

  // Metadata
  tags: [String],
  billable: {
    type: Boolean,
    default: true
  },
  roundingRule: {
    type: String,
    enum: ['NONE', 'ROUND_5', 'ROUND_15', 'ROUND_30'],
    default: 'NONE'
  },

  createdAt: {
    type: Date,
    default: () => new Date(),
    index: true
  },
  updatedAt: {
    type: Date,
    default: () => new Date()
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: Calculate display duration
workLogSchema.virtual('displayDuration').get(function() {
  if (this.isTemporary && !this.endTime) {
    const elapsed = new Date() - this.startTime;
    return Math.floor(elapsed / 60000); // Convert ms to minutes
  }
  return this.durationMinutes;
});

// Indexes for performance
workLogSchema.index({ workItemId: 1, createdAt: -1 });
workLogSchema.index({ userId: 1, createdAt: -1 });
workLogSchema.index({ workItemId: 1, userId: 1 });
workLogSchema.index({ isTemporary: 1, status: 1 });
workLogSchema.index({ createdAt: 1, status: 1 });

// Compound index for queries
workLogSchema.index({ 
  workItemId: 1, 
  createdAt: -1,
  status: 1
});

/**
 * Pre-save middleware
 * Validates and processes work log before saving
 */
workLogSchema.pre('save', async function(next) {
  try {
    // Validate times if both exist
    if (this.startTime && this.endTime) {
      if (this.endTime <= this.startTime) {
        throw new Error('End time must be after start time');
      }

      // Calculate duration if not provided
      if (!this.durationMinutes || this.durationMinutes === 0) {
        const durationMs = this.endTime - this.startTime;
        this.durationMinutes = Math.floor(durationMs / 60000); // Convert to minutes
      }

      // Apply rounding rule
      if (this.roundingRule && this.roundingRule !== 'NONE') {
        const rules = {
          'ROUND_5': 5,
          'ROUND_15': 15,
          'ROUND_30': 30
        };
        const roundTo = rules[this.roundingRule];
        if (roundTo) {
          this.durationMinutes = Math.ceil(this.durationMinutes / roundTo) * roundTo;
        }
      }

      // Update temporary flag
      this.isTemporary = false;
      this.status = 'STOPPED';
    }

    // When stopping a timer
    if (!this.isTemporary && this.endTime) {
      this.status = 'STOPPED';
    }

    // Validate max duration (12 hours)
    if (this.durationMinutes > 12 * 60) {
      throw new Error('Work log duration cannot exceed 12 hours');
    }

    // Check for overlaps only if this is not a temporary timer
    if (!this.isTemporary || !this.isNew) {
      const WorkLog = this.constructor;
      const overlap = await WorkLog.findOne({
        _id: { $ne: this._id },
        userId: this.userId,
        startTime: { $lt: this.endTime || new Date() },
        endTime: { 
          $exists: true,
          $gt: this.startTime
        },
        status: { $in: ['RUNNING', 'STOPPED', 'FINALIZED'] }
      });

      if (overlap) {
        throw new Error('Work logs cannot overlap for the same user');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance methods
 */

// Stop a running timer
workLogSchema.methods.stopTimer = function() {
  if (this.isTemporary && !this.endTime) {
    this.endTime = new Date();
    this.isTemporary = false;
    
    // Calculate duration
    const durationMs = this.endTime - this.startTime;
    this.durationMinutes = Math.floor(durationMs / 60000);
    
    this.status = 'STOPPED';
    return this.save();
  }
  throw new Error('Cannot stop a timer that is not running');
};

// Mark as approved
workLogSchema.methods.approve = function(approverId, notes = '') {
  if (this.status === 'APPROVED') {
    throw new Error('WorkLog is already approved');
  }
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  this.approvalNotes = notes;
  this.status = 'APPROVED';
  return this.save();
};

// Record edit in audit trail
workLogSchema.methods.recordEdit = function(userId, previousDuration, previousDescription, reason = '') {
  this.editedBy.push({
    userId,
    previousDuration,
    previousDescription,
    reason,
    editedAt: new Date()
  });
  this.updatedAt = new Date();
  return this.save();
};

// Format for display
workLogSchema.methods.toDisplay = function() {
  return {
    _id: this._id,
    workItemId: this.workItemId,
    userId: this.userId,
    startTime: this.startTime,
    endTime: this.endTime,
    durationMinutes: this.durationMinutes,
    displayDuration: this.displayDuration,
    description: this.description,
    logType: this.logType,
    isTemporary: this.isTemporary,
    status: this.status,
    billable: this.billable,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

/**
 * Static methods
 */

// Get running timer for user
workLogSchema.statics.getRunningTimer = function(userId) {
  return this.findOne({
    userId,
    isTemporary: true,
    status: 'RUNNING'
  });
};

// Stop any running timers for user
workLogSchema.statics.stopUserTimers = async function(userId) {
  const runningLogs = await this.find({
    userId,
    isTemporary: true,
    status: 'RUNNING'
  });

  const results = [];
  for (const log of runningLogs) {
    await log.stopTimer();
    results.push(log);
  }
  return results;
};

// Get total time for work item
workLogSchema.statics.getTotalTime = function(workItemId) {
  return this.aggregate([
    {
      $match: {
        workItemId: mongoose.Types.ObjectId(workItemId),
        status: { $in: ['STOPPED', 'FINALIZED', 'APPROVED'] }
      }
    },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: '$durationMinutes' },
        count: { $sum: 1 },
        avgDuration: { $avg: '$durationMinutes' }
      }
    }
  ]);
};

// Get work logs by user
workLogSchema.statics.getUserLogs = function(userId, startDate, endDate) {
  return this.find({
    userId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    },
    status: { $in: ['STOPPED', 'FINALIZED', 'APPROVED'] }
  }).populate('workItemId', 'title issueKey');
};

module.exports = mongoose.model('WorkLog', workLogSchema);
