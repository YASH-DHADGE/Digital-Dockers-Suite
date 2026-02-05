const mongoose = require("mongoose");
const dotenv = require("dotenv");

console.log("Starting seed script...");

const path = require("path");
// Try loading env
try {
  const envPath = path.resolve(__dirname, "../.env");
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn("Dotenv error:", result.error.message);
  } else {
    console.log("Dotenv loaded from:", envPath);
  }
} catch (e) {
  console.error("Failed to load dotenv", e);
}

const CodebaseFile = require("../models/CodebaseFile");
const PullRequest = require("../models/PullRequest");
const RefactorTask = require("../models/RefactorTask");

const seedData = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("MONGO_URI is missing from env");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("MongoDB Connected");

    // Cleanup
    console.log("Deleting old data...");
    await CodebaseFile.deleteMany({});
    await PullRequest.deleteMany({});
    await RefactorTask.deleteMany({});

    // Create CodebaseFiles (hotspots)
    const files = [];
    const fileNames = [
      "src/context/ChatContext.jsx",
      "src/components/GatekeeperStream.jsx",
      "src/pages/TechDebtPage.jsx",
      "backend/controllers/techDebtController.js",
      "src/components/CodebaseMRI.jsx",
      "backend/server.js",
      "src/context/AuthContext.jsx",
      "backend/services/analysisOrchestrator.js",
      "frontend/src/hooks/useGatekeeperFeed.js",
      "backend/models/PullRequest.js",
      "src/components/ActionsBacklog.jsx",
      "backend/routes/githubIntegrationRoutes.js",
      "src/components/PRDetailModal.jsx",
      "backend/services/metricsCalculator.js",
      "src/App.jsx",
    ];

    for (let i = 0; i < fileNames.length; i++) {
      const complexity = Math.floor(Math.random() * 30) + 5;
      const churnRate = Math.floor(Math.random() * 15) + 1;
      const risk = complexity * churnRate;

      files.push({
        path: fileNames[i],
        repoId: "siddh/Digital-Dockers-Suite",
        loc: Math.floor(Math.random() * 500) + 50,
        complexity,
        churnRate,
        risk,
        dependencies: [],
        historicalMetrics: [
          {
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            complexity: complexity - 2,
            loc: Math.floor(Math.random() * 400) + 50,
            risk: risk - 10,
          },
        ],
      });
    }

    const insertedFiles = await CodebaseFile.insertMany(files);
    console.log(`Seeded ${insertedFiles.length} CodebaseFiles`);

    // Create Pull Requests
    const prs = [
      {
        prNumber: 101,
        repoId: "siddh/Digital-Dockers-Suite",
        author: "siddh",
        title: "Refactor ChatContext State Logic",
        url: "https://github.com/siddh/Digital-Dockers-Suite/pull/101",
        branch: "feature/refactor-chat-context",
        status: "BLOCK",
        healthScore: { current: 45, delta: -15 },
        filesChanged: ["src/context/ChatContext.jsx", "src/App.jsx"],
        analysisResults: {
          lint: { errors: 5, warnings: 3, rawOutput: "[]" },
          complexity: { healthScoreDelta: -15, fileChanges: [] },
          aiScan: {
            verdict: "BAD",
            findings: [
              {
                message: "Synchronous setState in useEffect detected",
                severity: 8,
                confidence: "high",
              },
            ],
            categories: {
              security: 70,
              correctness: 40,
              maintainability: 50,
              performance: 60,
              testing: 55,
            },
          },
        },
        blockReasons: [
          "5 syntax errors found",
          "Complexity increased (delta: -15)",
          "AI detected critical issues",
        ],
      },
      {
        prNumber: 102,
        repoId: "siddh/Digital-Dockers-Suite",
        author: "ai_bot",
        title: "Optimize Gatekeeper Stream Rendering",
        url: "https://github.com/siddh/Digital-Dockers-Suite/pull/102",
        branch: "feature/optimize-gatekeeper",
        status: "PASS",
        healthScore: { current: 92, delta: 5 },
        filesChanged: ["src/components/GatekeeperStream.jsx"],
        analysisResults: {
          lint: { errors: 0, warnings: 1, rawOutput: "[]" },
          complexity: { healthScoreDelta: 5, fileChanges: [] },
          aiScan: {
            verdict: "GOOD",
            findings: [],
            categories: {
              security: 90,
              correctness: 95,
              maintainability: 88,
              performance: 92,
              testing: 85,
            },
          },
        },
        blockReasons: [],
      },
      {
        prNumber: 103,
        repoId: "siddh/Digital-Dockers-Suite",
        author: "senior_dev",
        title: "Update Auth Middleware",
        url: "https://github.com/siddh/Digital-Dockers-Suite/pull/103",
        branch: "feature/auth-update",
        status: "WARN",
        healthScore: { current: 78, delta: 0 },
        filesChanged: ["backend/middlewares/authMiddleware.js"],
        analysisResults: {
          lint: { errors: 1, warnings: 2, rawOutput: "[]" },
          complexity: { healthScoreDelta: 0, fileChanges: [] },
          aiScan: {
            verdict: "RISKY",
            findings: [
              {
                message: "Check for potential auth bypass in edge cases",
                severity: 5,
                confidence: "medium",
              },
            ],
            categories: {
              security: 75,
              correctness: 80,
              maintainability: 75,
              performance: 85,
              testing: 70,
            },
          },
        },
        blockReasons: ["1 syntax error found"],
      },
    ];

    const insertedPRs = await PullRequest.insertMany(prs);
    console.log(`Seeded ${insertedPRs.length} Pull Requests`);

    // Create Refactor Tasks
    const tasks = [
      {
        digitalDockersTaskId: "REFACTOR-001",
        fileId: insertedFiles[0]._id,
        status: "OPEN",
        priority: "HIGH",
        sla: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignee: "siddh",
        riskScoreAtCreation: insertedFiles[0].risk,
      },
      {
        digitalDockersTaskId: "REFACTOR-002",
        fileId: insertedFiles[3]._id,
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        sla: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        assignee: "team_lead",
        riskScoreAtCreation: insertedFiles[3].risk,
      },
      {
        digitalDockersTaskId: "REFACTOR-003",
        fileId: insertedFiles[5]._id,
        status: "OPEN",
        priority: "LOW",
        sla: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        assignee: null,
        riskScoreAtCreation: insertedFiles[5].risk,
      },
    ];

    const insertedTasks = await RefactorTask.insertMany(tasks);
    console.log(`Seeded ${insertedTasks.length} Refactor Tasks`);

    console.log("\n✅ Seed completed successfully!");
    console.log(`- ${insertedFiles.length} files`);
    console.log(`- ${insertedPRs.length} PRs`);
    console.log(`- ${insertedTasks.length} tasks`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error("Seeding Error:", e);
    process.exit(1);
  }
};

seedData();
