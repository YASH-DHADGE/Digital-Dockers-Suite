const Task = require('../models/Task');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

/**
 * ============================================================================
 * WORKLOAD BALANCING SERVICE
 * ============================================================================
 * Automatically rebalances tasks between team members based on:
 * - Current workload percentage (tasks assigned vs capacity)
 * - Skill match (assigns tasks to people with matching skills)
 * - Priority (high priority tasks can trigger reassignment)
 *
 * Rules:
 * - If person A has >60% workload and person B with same skills has <35% workload
 * - Then reassign one task from A to B
 */

class WorkloadBalancingService {
    /**
     * Calculate workload percentage for a user
     * Workload = (number of active tasks * estimated time) / (default capacity of 40 hours/week)
     */
    static async calculateUserWorkload(userId) {
        try {
            const activeTasks = await Task.find({
                assignedTo: userId,
                status: { $in: ['todo', 'in_progress', 'review'] }
            });

            // If no estimated time, use story points or default 5 hours per task
            let totalEstimatedHours = 0;
            activeTasks.forEach(task => {
                if (task.estimatedTime && task.estimatedTime > 0) {
                    totalEstimatedHours += task.estimatedTime;
                } else if (task.storyPoints && task.storyPoints > 0) {
                    // Convert story points to hours: 1 point = 2 hours (standard estimate)
                    totalEstimatedHours += task.storyPoints * 2;
                } else {
                    // Default: 5 hours per task if no estimate
                    totalEstimatedHours += 5;
                }
            });

            // Default capacity: 40 hours/week = 8 hours/day
            const defaultCapacity = 40;
            const workloadPercentage = (totalEstimatedHours / defaultCapacity) * 100;

            console.log(`📊 Workload for ${userId}: ${activeTasks.length} tasks, ${totalEstimatedHours}h estimated, ${Math.round(workloadPercentage)}%`);

            return {
                userId,
                activeTasks: activeTasks.length,
                totalEstimatedHours,
                workloadPercentage: Math.round(workloadPercentage),
                capacity: defaultCapacity
            };
        } catch (error) {
            console.error('Error calculating workload:', error);
            return {
                userId,
                activeTasks: 0,
                totalEstimatedHours: 0,
                workloadPercentage: 0,
                capacity: 40
            };
        }
    }

    /**
     * Get all team members with same skills as a given user
     */
    static async findTeamMembersWithSameSkills(userId) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.profileInfo || !user.profileInfo.skills) {
                return [];
            }

            const skills = user.profileInfo.skills;

            const teamMembers = await User.find({
                _id: { $ne: userId },
                'profileInfo.skills': { $in: skills },
                isActive: true
            });

            return teamMembers;
        } catch (error) {
            console.error('Error finding team members with same skills:', error);
            return [];
        }
    }

    /**
     * Get tasks that can be reassigned from a user
     * Prioritizes reassigning lower-priority, smaller tasks
     */
    static async getReassignableTasksForUser(userId) {
        try {
            const tasks = await Task.find({
                assignedTo: userId,
                status: { $in: ['todo', 'in_progress'] }
            }).sort({ priority: 1, estimatedTime: 1 }); // Lower priority, smaller tasks first

            return tasks;
        } catch (error) {
            console.error('Error getting reassignable tasks:', error);
            return [];
        }
    }

    /**
     * Find best task to reassign based on skill match
     */
    static async findBestTaskToReassign(overloadedUserId, underutilizedUsers) {
        try {
            const reassignableTasks = await this.getReassignableTasksForUser(overloadedUserId);

            if (reassignableTasks.length === 0) {
                return null;
            }

            // Get skills of overloaded user
            const overloadedUser = await User.findById(overloadedUserId);
            const overloadedSkills = overloadedUser?.profileInfo?.skills || [];

            let bestMatch = null;
            let bestMatchScore = -1;

            // Find task with best skill match among underutilized team members
            for (const task of reassignableTasks) {
                const taskSkillsRequired = task.tags || []; // or extract from description

                for (const underutilizedUser of underutilizedUsers) {
                    const userSkills = underutilizedUser.profileInfo?.skills || [];

                    // Calculate skill match score
                    let matchScore = 0;
                    if (userSkills.length > 0) {
                        const commonSkills = userSkills.filter(skill =>
                            overloadedSkills.includes(skill)
                        );
                        matchScore = commonSkills.length / Math.max(userSkills.length, overloadedSkills.length);
                    }

                    if (matchScore > bestMatchScore) {
                        bestMatchScore = matchScore;
                        bestMatch = {
                            task,
                            targetUser: underutilizedUser,
                            matchScore
                        };
                    }
                }

                // If we found a good match, return early
                if (bestMatchScore > 0.5) {
                    return bestMatch;
                }
            }

            // If no skill match found, return first reassignable task and least loaded user
            if (reassignableTasks.length > 0 && underutilizedUsers.length > 0) {
                return {
                    task: reassignableTasks[0],
                    targetUser: underutilizedUsers[0],
                    matchScore: 0
                };
            }

            return null;
        } catch (error) {
            console.error('Error finding best task to reassign:', error);
            return null;
        }
    }

    /**
     * Rebalance workload across a team
     * Main function to trigger automatic task reassignment
     */
    static async rebalanceTeamWorkload(projectId = null) {
        try {
            const results = {
                processed: 0,
                rebalanced: 0,
                reassignments: []
            };

            console.log('\n🔄 ============ STARTING WORKLOAD REBALANCING ============');

            // Get all users or team members in project
            const users = await User.find({ isActive: true });
            console.log(`📋 Processing ${users.length} active users...`);

            // Calculate workload for all users
            const workloads = [];
            for (const user of users) {
                const workload = await this.calculateUserWorkload(user._id);
                workloads.push(workload);
            }

            results.processed = workloads.length;

            // Find overloaded users (>60%)
            const overloadedUsers = workloads.filter(w => w.workloadPercentage > 60);
            console.log(`⚠️  Found ${overloadedUsers.length} overloaded users (>60%)`);
            overloadedUsers.forEach(u => {
                console.log(`   - ${u.userId}: ${u.workloadPercentage}% (${u.activeTasks} tasks, ${u.totalEstimatedHours}h)`);
            });

            for (const overloadedWorkload of overloadedUsers) {
                const overloadedUserId = overloadedWorkload.userId;
                const overloadedUser = await User.findById(overloadedUserId);

                console.log(`\n🔍 Analyzing ${overloadedUser.fullName} (${overloadedWorkload.workloadPercentage}% workload)...`);

                // Find team members with same skills
                const teamMembers = await this.findTeamMembersWithSameSkills(overloadedUserId);
                console.log(`   Found ${teamMembers.length} team members with same skills: ${teamMembers.map(m => m.fullName).join(', ')}`);

                if (teamMembers.length === 0) {
                    console.log(`   ⏭️  No team members with matching skills, skipping...`);
                    continue;
                }

                // Find underutilized team members (<35%)
                const underutilizedUsers = teamMembers.filter(member => {
                    const memberWorkload = workloads.find(w => w.userId.toString() === member._id.toString());
                    return memberWorkload && memberWorkload.workloadPercentage < 35;
                });

                console.log(`   🟢 Found ${underutilizedUsers.length} underutilized members (<35%):`);
                underutilizedUsers.forEach(u => {
                    const userWorkload = workloads.find(w => w.userId.toString() === u._id.toString());
                    console.log(`      - ${u.fullName}: ${userWorkload.workloadPercentage}% (${userWorkload.activeTasks} tasks)`);
                });

                if (underutilizedUsers.length === 0) {
                    console.log(`   ⏭️  No underutilized members, skipping...`);
                    continue;
                }

                // Find best task to reassign
                const reassignmentData = await this.findBestTaskToReassign(overloadedUserId, underutilizedUsers);

                if (reassignmentData) {
                    const { task, targetUser, matchScore } = reassignmentData;

                    console.log(`   ✅ Reassigning task: "${task.title}"`);
                    console.log(`      From: ${overloadedUser.fullName}`);
                    console.log(`      To: ${targetUser.fullName}`);
                    console.log(`      Skill match score: ${(matchScore * 100).toFixed(0)}%`);

                    // Perform reassignment
                    const updatedTask = await Task.findByIdAndUpdate(
                        task._id,
                        {
                            assignedTo: [targetUser._id],
                            $push: {
                                history: {
                                    field: 'assignedTo',
                                    oldValue: overloadedUserId.toString(),
                                    newValue: targetUser._id.toString(),
                                    updatedBy: null, // System reassignment
                                    timestamp: new Date()
                                }
                            }
                        },
                        { new: true }
                    ).populate('assignedTo', 'fullName email');

                    results.rebalanced++;
                    results.reassignments.push({
                        taskId: task._id,
                        taskTitle: task.title,
                        fromUser: overloadedWorkload.userId.toString(),
                        fromUserName: overloadedUser.fullName,
                        toUser: targetUser._id.toString(),
                        toUserName: targetUser.fullName,
                        reason: `Workload balance: ${overloadedWorkload.workloadPercentage}% → ${(overloadedWorkload.workloadPercentage - 10)}%`,
                        timestamp: new Date(),
                        skillMatchScore: matchScore
                    });

                    console.log(`   ✨ Task successfully reassigned!`);
                } else {
                    console.log(`   ⏭️  No suitable tasks to reassign`);
                }
            }

            console.log(`\n✅ Rebalancing complete. ${results.rebalanced} tasks reassigned across ${results.processed} users`);
            console.log('🔄 ============ END WORKLOAD REBALANCING ============\n');

            return results;
        } catch (error) {
            console.error('Error rebalancing team workload:', error);
            throw error;
        }
    }

    /**
     * Get workload summary for a team/project
     */
    static async getTeamWorkloadSummary(projectId = null) {
        try {
            const users = await User.find({ isActive: true });

            const workloadData = [];
            let totalWorkload = 0;
            let averageWorkload = 0;

            for (const user of users) {
                const workload = await this.calculateUserWorkload(user._id);
                workloadData.push({
                    user: {
                        id: user._id,
                        name: user.fullName,
                        email: user.email,
                        role: user.role
                    },
                    ...workload
                });
                totalWorkload += workload.workloadPercentage;
            }

            averageWorkload = workloadData.length > 0 ? Math.round(totalWorkload / workloadData.length) : 0;

            // Identify overloaded and underutilized
            const overloaded = workloadData.filter(w => w.workloadPercentage > 60);
            const underutilized = workloadData.filter(w => w.workloadPercentage < 35);
            const balanced = workloadData.filter(w => w.workloadPercentage >= 35 && w.workloadPercentage <= 60);

            return {
                summary: {
                    totalUsers: workloadData.length,
                    averageWorkload,
                    overloadedCount: overloaded.length,
                    underutilizedCount: underutilized.length,
                    balancedCount: balanced.length
                },
                details: {
                    overloaded: overloaded.sort((a, b) => b.workloadPercentage - a.workloadPercentage),
                    balanced,
                    underutilized: underutilized.sort((a, b) => a.workloadPercentage - b.workloadPercentage)
                },
                allUsers: workloadData.sort((a, b) => b.workloadPercentage - a.workloadPercentage)
            };
        } catch (error) {
            console.error('Error getting team workload summary:', error);
            throw error;
        }
    }
}

module.exports = WorkloadBalancingService;
