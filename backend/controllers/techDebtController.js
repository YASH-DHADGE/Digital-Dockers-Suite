const PullRequest = require('../models/PullRequest');
const CodebaseFile = require('../models/File');
const RefactorTask = require('../models/RefactorTask');
const MetricsCalculator = require('../services/metricsCalculator');

// @desc    Get all Pull Requests for Feed
// @route   GET /api/tech-debt/prs
const getPullRequests = async (req, res) => {
    try {
        const { repoId, status } = req.query;

        const query = {};
        if (repoId) query.repoId = repoId;
        if (status) query.status = status;

        let prs = await PullRequest.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(prs);
    } catch (error) {
        console.error("Error fetching PRs:", error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Hotspot Data for MRI
// @route   GET /api/tech-debt/hotspots
const getHotspots = async (req, res) => {
    try {
        const { repoId } = req.query;

        const query = {};
        if (repoId) query.repoId = repoId;

        let files = await CodebaseFile.find(query)
            .sort({ risk: -1 })
            .limit(100);

        res.status(200).json(files);
    } catch (error) {
        console.error("Error fetching hotspots:", error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Refactor Backlog
// @route   GET /api/tech-debt/tasks
const getRefactorTasks = async (req, res) => {
    try {
        const { status } = req.query;

        const query = {};
        if (status) query.status = status;

        let tasks = await RefactorTask.find(query)
            .sort({ priority: 1, createdAt: -1 });

        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Summary Metrics
// @route   GET /api/tech-debt/summary
const getSummary = async (req, res) => {
    try {
        const { repoId } = req.query;

        const calculator = new MetricsCalculator();
        const metrics = await calculator.getAllMetrics(repoId);

        res.status(200).json(metrics);
    } catch (error) {
        console.error('Summary Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Create Refactor Task
// @route   POST /api/tech-debt/tasks
const createRefactorTask = async (req, res) => {
    try {
        const { digitalDockersTaskId, fileId, priority, sla, assignee, riskScoreAtCreation } = req.body;

        const task = await RefactorTask.create({
            digitalDockersTaskId,
            fileId,
            priority: priority || 'MEDIUM',
            sla,
            assignee,
            riskScoreAtCreation
        });

        // Emit WebSocket event
        const io = req.app.get('io');
        if (io) {
            io.emit('task:created', task);
        }

        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Update Refactor Task
// @route   PUT /api/tech-debt/tasks/:id
const updateRefactorTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const task = await RefactorTask.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.status(200).json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Delete Refactor Task
// @route   DELETE /api/tech-debt/tasks/:id
const deleteRefactorTask = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await RefactorTask.findByIdAndDelete(id);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Gatekeeper Feed Data
// @route   GET /api/tech-debt/gatekeeper-feed
const getGatekeeperFeed = async (req, res) => {
    try {
        // Get recent pull requests with risk analysis
        const recentPRs = await PullRequest.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        // Get high-risk files
        const highRiskFiles = await CodebaseFile.find({ 
            risk: { $gte: 70 } 
        })
        .sort({ risk: -1 })
        .limit(10)
        .lean();

        // Get pending refactor tasks
        const pendingTasks = await RefactorTask.find({ 
            status: { $in: ['pending', 'in_progress'] } 
        })
        .sort({ priority: -1, createdAt: -1 })
        .limit(15)
        .lean();

        // Format the feed data
        const feedItems = [];

        // Add PR items
        recentPRs.forEach(pr => {
            feedItems.push({
                id: `pr-${pr._id}`,
                type: 'pull_request',
                title: pr.title || 'Untitled PR',
                description: `PR #${pr.number || 'Unknown'} - ${pr.status || 'Unknown'}`,
                timestamp: pr.createdAt,
                severity: pr.risk_score ? (pr.risk_score > 70 ? 'high' : pr.risk_score > 40 ? 'medium' : 'low') : 'low',
                data: pr
            });
        });

        // Add high-risk file items
        highRiskFiles.forEach(file => {
            feedItems.push({
                id: `file-${file._id}`,
                type: 'high_risk_file',
                title: `High Risk: ${file.path || 'Unknown file'}`,
                description: `Risk score: ${file.risk || 'Unknown'} - ${file.issues?.length || 0} issues detected`,
                timestamp: file.updatedAt || file.createdAt,
                severity: file.risk > 80 ? 'high' : 'medium',
                data: file
            });
        });

        // Add refactor task items
        pendingTasks.forEach(task => {
            feedItems.push({
                id: `task-${task._id}`,
                type: 'refactor_task',
                title: task.title || 'Untitled Task',
                description: `Priority: ${task.priority || 'Unknown'} - ${task.status || 'pending'}`,
                timestamp: task.createdAt,
                severity: task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'medium' : 'low',
                data: task
            });
        });

        // Sort by timestamp (newest first)
        feedItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.status(200).json(feedItems);
    } catch (error) {
        console.error('Error fetching gatekeeper feed:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPullRequests,
    getHotspots,
    getRefactorTasks,
    getSummary,
    createRefactorTask,
    updateRefactorTask,
    deleteRefactorTask,
    getGatekeeperFeed
};
