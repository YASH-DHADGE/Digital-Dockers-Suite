const asyncHandler = require('express-async-handler');
const Sprint = require('../models/Sprint');

// @desc    Create a sprint
// @route   POST /api/sprints
// @access  Private
const createSprint = asyncHandler(async (req, res) => {
    const { name, goal, startDate, endDate, projectId } = req.body;

    const sprint = await Sprint.create({
        name,
        goal,
        startDate,
        endDate,
        project: projectId
    });

    res.status(201).json(sprint);
});

// @desc    Get sprints for a project
// @route   GET /api/sprints/project/:projectId
// @access  Private
const getSprintsByProject = asyncHandler(async (req, res) => {
    const sprints = await Sprint.find({ project: req.params.projectId }).sort({ createdAt: 1 });
    res.json(sprints);
});

// @desc    Update sprint status or details
// @route   PUT /api/sprints/:id
// @access  Private
const updateSprint = asyncHandler(async (req, res) => {
    const sprint = await Sprint.findById(req.params.id);

    if (sprint) {
        sprint.name = req.body.name || sprint.name;
        sprint.goal = req.body.goal || sprint.goal;
        sprint.startDate = req.body.startDate || sprint.startDate;
        sprint.endDate = req.body.endDate || sprint.endDate;
        sprint.status = req.body.status || sprint.status;

        const updatedSprint = await sprint.save();
        res.json(updatedSprint);
    } else {
        res.status(404);
        throw new Error('Sprint not found');
    }
});

const Task = require('../models/Task');

// @desc    Start a sprint
// @route   POST /api/sprints/:id/start
// @access  Private
const startSprint = asyncHandler(async (req, res) => {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
        res.status(404);
        throw new Error('Sprint not found');
    }

    if (sprint.status === 'active') {
        res.status(400);
        throw new Error('Sprint is already active');
    }

    // Check for issues
    const issueCount = await Task.countDocuments({ sprint: sprint._id });
    if (issueCount === 0) {
        res.status(400);
        throw new Error('Cannot start empty sprint');
    }

    // Snapshot committed points
    const tasks = await Task.find({ sprint: sprint._id });
    const committed = tasks.reduce((acc, task) => acc + (task.storyPoints || 0), 0);

    sprint.status = 'active';
    sprint.committedPoints = committed;
    sprint.startDate = new Date(); // Reset start date to actual start? Or keep planned? Let's update.

    await sprint.save();
    res.json(sprint);
});

// @desc    Complete a sprint
// @route   POST /api/sprints/:id/complete
// @access  Private
const completeSprint = asyncHandler(async (req, res) => {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint || sprint.status !== 'active') {
        res.status(400);
        throw new Error('Sprint not active or found');
    }

    const tasks = await Task.find({ sprint: sprint._id });
    const completed = tasks.filter(t => t.status === 'done').reduce((acc, t) => acc + (t.storyPoints || 0), 0);
    const incompleteTasks = tasks.filter(t => t.status !== 'done');

    sprint.status = 'closed';
    sprint.completedPoints = completed;
    sprint.endDate = new Date();
    sprint.velocity = completed; // For this single sprint

    await sprint.save();

    // Move incomplete issues to backlog (null sprint) or next (not impl yet)
    // Default: Backlog
    if (incompleteTasks.length > 0) {
        await Task.updateMany(
            { _id: { $in: incompleteTasks.map(t => t._id) } },
            { $set: { sprint: null } }
        );
    }

    res.json({
        sprint,
        message: `Sprint completed. ${incompleteTasks.length} incomplete issues moved to backlog.`
    });
});

// @desc    Get burndown data for a sprint
// @route   GET /api/sprints/:id/burndown
// @access  Private
const getBurndown = asyncHandler(async (req, res) => {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
        res.status(404);
        throw new Error('Sprint not found');
    }

    console.log(`📊 Getting burndown for sprint: ${sprint.name} (${sprint._id})`);

    // Get tasks in this sprint
    const tasks = await Task.find({ sprint: sprint._id });
    console.log(`📋 Found ${tasks.length} tasks in sprint`);
    
    const totalPoints = tasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
    console.log(`📌 Total story points: ${totalPoints}`);

    // Generate burndown data
    const startDate = new Date(sprint.startDate || sprint.createdAt);
    const endDate = new Date(sprint.endDate || new Date());
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;

    console.log(`📅 Sprint duration: ${totalDays} days (${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()})`);

    const burndownData = {
        labels: [],
        ideal: [],
        actual: []
    };

    // Generate daily labels and ideal burndown
    for (let i = 0; i <= totalDays; i++) {
        const day = new Date(startDate);
        day.setDate(day.getDate() + i);
        burndownData.labels.push(`Day ${i + 1}`);
        burndownData.ideal.push(Math.round(totalPoints * (1 - i / totalDays)));
    }

    // Calculate actual remaining points per day based on completed tasks
    const completedTasks = tasks.filter(t => t.status === 'done' && t.completedAt);
    console.log(`✅ Completed tasks: ${completedTasks.length}`);
    let remainingPoints = totalPoints;

    for (let i = 0; i <= totalDays; i++) {
        const dayEnd = new Date(startDate);
        dayEnd.setDate(dayEnd.getDate() + i);
        dayEnd.setHours(23, 59, 59);

        // Subtract points completed by this day
        const pointsCompletedByDay = completedTasks
            .filter(t => new Date(t.completedAt) <= dayEnd)
            .reduce((acc, t) => acc + (t.storyPoints || 0), 0);

        const actualRemaining = totalPoints - pointsCompletedByDay;

        // Only add actual data up to today
        const today = new Date();
        if (dayEnd <= today) {
            burndownData.actual.push(actualRemaining);
        }
    }

    res.json({
        success: true,
        data: {
            ...burndownData,
            totalPoints,
            sprintName: sprint.name,
            completionPercentage: totalPoints > 0 ? Math.round(((totalPoints - (burndownData.actual[burndownData.actual.length - 1] || totalPoints)) / totalPoints) * 100) : 0
        }
    });
});

module.exports = {
    createSprint,
    getSprintsByProject,
    updateSprint,
    startSprint,
    completeSprint,
    getBurndown
};
