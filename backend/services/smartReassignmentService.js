const Task = require('../models/Task');
const User = require('../models/User');
const Sprint = require('../models/Sprint');

/**
 * ============================================================================
 * SMART REASSIGNMENT ASSISTANT SERVICE
 * ============================================================================
 * Intelligent task reassignment engine that analyzes workloads and skills
 * to find the optimal employee for task reassignment.
 *
 * Algorithm:
 * 1. Calculate current workloads for all team members
 * 2. Find overloaded employee (>60%)
 * 3. Search for qualified candidates in same team/sprint
 * 4. Score candidates using multi-factor algorithm
 * 5. Return top recommendation with reasoning
 */

class SmartReassignmentService {
    /**
     * DEFAULT CONFIGURATION
     */
    static get CONFIG() {
        return {
            OVERLOAD_THRESHOLD: 60,        // >60% triggers recommendation
            UNDERLOAD_THRESHOLD: 60,       // <60% is acceptable
            DEFAULT_CAPACITY_HOURS: 40,    // hours per sprint
            
            // Scoring weights (must sum to 100)
            SCORING: {
                SKILL_MATCH_WEIGHT: 50,    // 50% weight
                WORKLOAD_WEIGHT: 30,       // 30% weight
                ROLE_MATCH_WEIGHT: 20      // 20% weight
            }
        };
    }

    /**
     * Calculate workload for a single employee in a sprint
     * Workload % = (assigned task hours / capacity hours) * 100
     */
    static async calculateEmployeeWorkload(employeeId, sprintId = null) {
        try {
            let query = {
                assignedTo: employeeId,
                status: { $in: ['todo', 'in_progress', 'review'] }
            };

            if (sprintId) {
                query.sprint = sprintId;
            }

            const assignedTasks = await Task.find(query);

            const totalAssignedHours = assignedTasks.reduce((sum, task) => {
                return sum + (task.estimatedTime || 8); // Default 8 hours if not specified
            }, 0);

            const employee = await User.findById(employeeId);
            const capacityHours = employee?.profileInfo?.capacityHoursPerSprint || 
                                 SmartReassignmentService.CONFIG.DEFAULT_CAPACITY_HOURS;

            const workloadPercentage = (totalAssignedHours / capacityHours) * 100;

            return {
                employeeId,
                assignedHours: totalAssignedHours,
                capacityHours,
                workloadPercentage: Math.round(workloadPercentage),
                assignedTasks: assignedTasks.length,
                isOverloaded: workloadPercentage > SmartReassignmentService.CONFIG.OVERLOAD_THRESHOLD
            };
        } catch (error) {
            console.error('Error calculating employee workload:', error);
            return {
                employeeId,
                assignedHours: 0,
                capacityHours: SmartReassignmentService.CONFIG.DEFAULT_CAPACITY_HOURS,
                workloadPercentage: 0,
                assignedTasks: 0,
                isOverloaded: false
            };
        }
    }

    /**
     * Calculate skill match percentage between task requirements and employee skills
     * Returns 0-100 score
     */
    static calculateSkillMatch(requiredSkills = [], employeeSkills = []) {
        if (!requiredSkills || requiredSkills.length === 0) {
            return 100; // No skills required = perfect match
        }

        if (!employeeSkills || employeeSkills.length === 0) {
            return 0; // No employee skills = no match
        }

        const matchedSkills = requiredSkills.filter(skill =>
            employeeSkills.some(empSkill =>
                empSkill.toLowerCase() === skill.toLowerCase()
            )
        );

        return Math.round((matchedSkills.length / requiredSkills.length) * 100);
    }

    /**
     * Calculate composite score for a candidate
     * Score = (skillMatch * 0.5) + (inverseWorkload * 0.3) + (roleMatch * 0.2)
     */
    static calculateCandidateScore(candidateData) {
        const { skillMatchPercentage, workloadPercentage, isRoleMatch } = candidateData;

        // Inverse workload score: lower workload = higher score
        const inverseWorkloadScore = Math.max(0, 100 - workloadPercentage);

        // Role match score: 100 if match, 50 if different
        const roleMatchScore = isRoleMatch ? 100 : 50;

        // Weighted calculation
        const config = SmartReassignmentService.CONFIG.SCORING;
        const totalScore = 
            (skillMatchPercentage * config.SKILL_MATCH_WEIGHT / 100) +
            (inverseWorkloadScore * config.WORKLOAD_WEIGHT / 100) +
            (roleMatchScore * config.ROLE_MATCH_WEIGHT / 100);

        return Math.round(totalScore);
    }

    /**
     * Get all team members (for sprint or general team)
     */
    static async getTeamMembers(sprintId = null, currentEmployeeId = null) {
        try {
            let query = {
                isActive: true,
                'profileInfo.isOnLeave': { $ne: true }
            };

            // If sprintId provided, get team members in that sprint
            if (sprintId) {
                const sprint = await Sprint.findById(sprintId).populate('project');
                if (sprint) {
                    const teamMemberIds = new Set();
                    
                    // First, get members from assigned tasks in this sprint
                    if (sprint.tasks && sprint.tasks.length > 0) {
                        const tasksInSprint = await Task.find({ _id: { $in: sprint.tasks } });
                        for (const task of tasksInSprint) {
                            if (task.assignedTo) {
                                const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
                                assignees.forEach(id => teamMemberIds.add(id.toString()));
                            }
                        }
                    }
                    
                    // If no team members found in tasks, get from project team
                    if (teamMemberIds.size === 0 && sprint.project) {
                        if (sprint.project.team && sprint.project.team.length > 0) {
                            sprint.project.team.forEach(member => teamMemberIds.add(member.toString()));
                        }
                    }
                    
                    if (teamMemberIds.size > 0) {
                        query._id = { $in: Array.from(teamMemberIds) };
                    }
                }
            }

            // Exclude current employee
            if (currentEmployeeId) {
                query._id = { ...query._id, $ne: currentEmployeeId };
            }

            const teamMembers = await User.find(query);
            return teamMembers;
        } catch (error) {
            console.error('Error getting team members:', error);
            return [];
        }
    }

    /**
     * Get task details including required skills
     */
    static async getTaskDetails(taskId) {
        try {
            const task = await Task.findById(taskId)
                .populate('assignedTo', 'fullName email profileInfo')
                .populate('sprint', 'name');

            if (!task) {
                throw new Error('Task not found');
            }

            // Extract required skills from task tags or description
            const requiredSkills = task.tags || [];

            return {
                ...task.toObject(),
                requiredSkills
            };
        } catch (error) {
            console.error('Error getting task details:', error);
            throw error;
        }
    }

    /**
     * MAIN FUNCTION: Get smart recommendation for task reassignment
     * 
     * @param {String} taskId - The task to reassign
     * @returns {Object} Recommendation object with recommended employee and reasoning
     */
    static async getReassignmentRecommendation(taskId) {
        try {
            console.log(`\n🔍 Analyzing task for reassignment: ${taskId}`);

            // Step 1: Get task details
            const task = await this.getTaskDetails(taskId);
            const currentAssignee = task.assignedTo?.[0];

            if (!currentAssignee) {
                return {
                    success: false,
                    recommendation: null,
                    reason: 'Task has no assigned employee',
                    score: 0
                };
            }

            // Step 2: Calculate current assignee's workload
            const currentWorkload = await this.calculateEmployeeWorkload(
                currentAssignee._id,
                task.sprint?._id
            );

            console.log(`📊 Current assignee workload: ${currentWorkload.workloadPercentage}%`);

            // Step 3: Check if reassignment is needed
            if (currentWorkload.workloadPercentage <= SmartReassignmentService.CONFIG.OVERLOAD_THRESHOLD) {
                return {
                    success: false,
                    recommendation: null,
                    currentAssignee: {
                        id: currentAssignee._id,
                        name: currentAssignee.fullName,
                        workloadPercentage: currentWorkload.workloadPercentage
                    },
                    reason: `Current assignee's workload (${currentWorkload.workloadPercentage}%) is acceptable. No reassignment needed.`,
                    score: 0
                };
            }

            // Step 4: Get team members in same sprint
            const teamMembers = await this.getTeamMembers(task.sprint?._id, currentAssignee._id);

            if (teamMembers.length === 0) {
                return {
                    success: false,
                    recommendation: null,
                    currentAssignee: {
                        id: currentAssignee._id,
                        name: currentAssignee.fullName,
                        workloadPercentage: currentWorkload.workloadPercentage
                    },
                    reason: 'No other team members available in this sprint',
                    score: 0
                };
            }

            console.log(`👥 Evaluating ${teamMembers.length} team members...`);

            // Step 5: Score all candidates
            const candidates = [];

            for (const member of teamMembers) {
                // Skip if on leave
                if (member.profileInfo?.isOnLeave) continue;

                // Calculate member workload
                const memberWorkload = await this.calculateEmployeeWorkload(
                    member._id,
                    task.sprint?._id
                );

                // Skip if workload is too high
                if (memberWorkload.workloadPercentage >= SmartReassignmentService.CONFIG.UNDERLOAD_THRESHOLD) {
                    continue;
                }

                // Calculate skill match
                const skillMatch = this.calculateSkillMatch(
                    task.requiredSkills,
                    member.profileInfo?.skills || []
                );

                // Check if same role
                const isRoleMatch = currentAssignee.role === member.role;

                // Calculate composite score
                const score = this.calculateCandidateScore({
                    skillMatchPercentage: skillMatch,
                    workloadPercentage: memberWorkload.workloadPercentage,
                    isRoleMatch
                });

                candidates.push({
                    employee: member,
                    workload: memberWorkload,
                    skillMatch,
                    isRoleMatch,
                    score
                });

                console.log(`  • ${member.fullName}: Score=${score} | Skills=${skillMatch}% | Workload=${memberWorkload.workloadPercentage}%`);
            }

            if (candidates.length === 0) {
                return {
                    success: false,
                    recommendation: null,
                    currentAssignee: {
                        id: currentAssignee._id,
                        name: currentAssignee.fullName,
                        workloadPercentage: currentWorkload.workloadPercentage
                    },
                    reason: 'No suitable employee found. All team members are overloaded or unavailable.',
                    score: 0
                };
            }

            // Step 6: Select top candidate
            const topCandidate = candidates.sort((a, b) => b.score - a.score)[0];

            console.log(`\n✅ Top recommendation: ${topCandidate.employee.fullName} (Score: ${topCandidate.score})`);

            // Step 7: Build human-readable reason
            const reason = this._buildRecommendationReason(
                topCandidate,
                currentAssignee,
                currentWorkload,
                task
            );

            return {
                success: true,
                recommendation: {
                    employeeId: topCandidate.employee._id,
                    name: topCandidate.employee.fullName,
                    email: topCandidate.employee.email,
                    role: topCandidate.employee.role,
                    currentWorkloadPercentage: topCandidate.workload.workloadPercentage,
                    skills: topCandidate.employee.profileInfo?.skills || [],
                    departureScore: topCandidate.score,
                    skillMatchPercentage: topCandidate.skillMatch,
                    isRoleMatch: topCandidate.isRoleMatch
                },
                currentAssignee: {
                    id: currentAssignee._id,
                    name: currentAssignee.fullName,
                    workloadPercentage: currentWorkload.workloadPercentage
                },
                reason,
                score: topCandidate.score,
                allCandidates: candidates.map(c => ({
                    employeeId: c.employee._id,
                    name: c.employee.fullName,
                    score: c.score,
                    workloadPercentage: c.workload.workloadPercentage,
                    skillMatch: c.skillMatch
                }))
            };
        } catch (error) {
            console.error('Error getting reassignment recommendation:', error);
            return {
                success: false,
                recommendation: null,
                reason: `Error analyzing task: ${error.message}`,
                score: 0
            };
        }
    }

    /**
     * Build human-readable recommendation reason
     */
    static _buildRecommendationReason(topCandidate, currentAssignee, currentWorkload, task) {
        const { employee, workload, skillMatch, score } = topCandidate;

        const reasons = [];

        // Workload reason
        const workloadDiff = currentWorkload.workloadPercentage - workload.workloadPercentage;
        reasons.push(
            `Workload difference: ${currentAssignee.fullName} is at ${currentWorkload.workloadPercentage}% ` +
            `while ${employee.fullName} is at ${workload.workloadPercentage}% (${workloadDiff}% difference)`
        );

        // Skill reason
        if (skillMatch === 100) {
            reasons.push(`Perfect skill match: ${employee.fullName} has all required skills (${task.requiredSkills?.join(', ') || 'any'}).`);
        } else if (skillMatch >= 75) {
            reasons.push(`Excellent skill match: ${employee.fullName} has ${skillMatch}% of required skills.`);
        } else if (skillMatch >= 50) {
            reasons.push(`Good skill match: ${employee.fullName} has ${skillMatch}% of required skills.`);
        } else {
            reasons.push(`Adequate skill match: ${employee.fullName} has ${skillMatch}% of required skills.`);
        }

        // Role reason
        if (topCandidate.isRoleMatch) {
            reasons.push(`Same role: Both employees have the ${currentAssignee.role} role.`);
        }

        // Overall score
        reasons.push(`Overall recommendation score: ${score}/100`);

        return reasons.join(' ');
    }

    /**
     * Execute reassignment (approve recommendation)
     */
    static async executeReassignment(taskId, newAssigneeId, approvedBy = null) {
        try {
            console.log(`\n🔄 Executing reassignment: Task=${taskId} → ${newAssigneeId}`);

            const task = await Task.findById(taskId);
            if (!task) {
                throw new Error('Task not found');
            }

            const oldAssignee = task.assignedTo?.[0];
            const oldAssigneeId = oldAssignee?._id || oldAssignee;

            // Perform reassignment
            await Task.findByIdAndUpdate(
                taskId,
                {
                    assignedTo: [newAssigneeId],
                    $push: {
                        history: {
                            field: 'assignedTo',
                            oldValue: oldAssigneeId.toString(),
                            newValue: newAssigneeId.toString(),
                            updatedBy: approvedBy || null,
                            timestamp: new Date(),
                            reason: 'Smart Reassignment (Workload Balancing)'
                        }
                    }
                },
                { new: true }
            );

            console.log(`✅ Task reassigned successfully`);

            return {
                success: true,
                message: `Task reassigned from ${oldAssigneeId} to ${newAssigneeId}`,
                taskId,
                fromAssignee: oldAssigneeId,
                toAssignee: newAssigneeId
            };
        } catch (error) {
            console.error('Error executing reassignment:', error);
            return {
                success: false,
                message: `Reassignment failed: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Get team workload summary with overloaded employees highlighted
     */
    static async getTeamWorkloadAnalysis(sprintId = null) {
        try {
            const teamMembers = await this.getTeamMembers(sprintId);
            const workloads = [];

            for (const member of teamMembers) {
                const workload = await this.calculateEmployeeWorkload(member._id, sprintId);
                workloads.push({
                    employeeId: member._id,
                    name: member.fullName,
                    role: member.role,
                    ...workload,
                    needsReassignment: workload.isOverloaded
                });
            }

            // Group by status
            const overloaded = workloads.filter(w => w.isOverloaded);
            const balanced = workloads.filter(w => 
                !w.isOverloaded && w.workloadPercentage >= 35
            );
            const underutilized = workloads.filter(w => w.workloadPercentage < 35);

            return {
                summary: {
                    totalEmployees: workloads.length,
                    overloadedCount: overloaded.length,
                    balancedCount: balanced.length,
                    underutilizedCount: underutilized.length,
                    avgWorkload: Math.round(
                        workloads.reduce((sum, w) => sum + w.workloadPercentage, 0) / workloads.length
                    )
                },
                details: {
                    overloaded: overloaded.sort((a, b) => b.workloadPercentage - a.workloadPercentage),
                    balanced,
                    underutilized: underutilized.sort((a, b) => a.workloadPercentage - b.workloadPercentage)
                },
                allEmployees: workloads
            };
        } catch (error) {
            console.error('Error getting team workload analysis:', error);
            throw error;
        }
    }
}

module.exports = SmartReassignmentService;
