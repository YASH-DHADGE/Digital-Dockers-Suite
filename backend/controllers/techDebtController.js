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

module.exports = {
    getPullRequests,
    getHotspots,
    getRefactorTasks,
    getSummary,
    createRefactorTask,
    updateRefactorTask,
    deleteRefactorTask
};
