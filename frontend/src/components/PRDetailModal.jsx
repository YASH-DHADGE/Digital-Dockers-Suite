import React, { useState } from "react";
import {
  FaTimes,
  FaExternalLinkAlt,
  FaCode,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import { format } from "date-fns";

const PRDetailModal = ({ pr, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!pr) return null;

  const getSeverityColor = (severity) => {
    if (severity >= 8) return "text-red-600 bg-red-100";
    if (severity >= 5) return "text-yellow-600 bg-yellow-100";
    return "text-blue-600 bg-blue-100";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold">#{pr.prNumber}</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    pr.status === "PASS"
                      ? "bg-green-500"
                      : pr.status === "BLOCK"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                  }`}
                >
                  {pr.status}
                </span>
              </div>
              <h2 className="text-xl font-semibold mb-2">{pr.title}</h2>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <span>@{pr.author}</span>
                <span>•</span>
                <span>{pr.branch}</span>
                <span>•</span>
                <span>
                  {pr.createdAt
                    ? format(new Date(pr.createdAt), "MMM d, yyyy")
                    : "Now"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {["overview", "analysis", "files"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium capitalize transition ${
                  activeTab === tab
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Health Score */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Health Score</h3>
                <div className="flex items-center gap-4">
                  <div
                    className="text-4xl font-bold"
                    style={{
                      color:
                        pr.healthScore?.current > 70
                          ? "#10b981"
                          : pr.healthScore?.current > 40
                            ? "#f59e0b"
                            : "#ef4444",
                    }}
                  >
                    {pr.healthScore?.current || 0}
                  </div>
                  <div>
                    <div
                      className={`text-lg font-semibold ${
                        pr.healthScore?.delta >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {pr.healthScore?.delta >= 0 ? "+" : ""}
                      {pr.healthScore?.delta || 0}
                    </div>
                    <div className="text-sm text-gray-500">Delta</div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {pr.analysisResults?.lint?.errors || 0}
                  </div>
                  <div className="text-sm text-gray-600">Lint Errors</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {pr.analysisResults?.lint?.warnings || 0}
                  </div>
                  <div className="text-sm text-gray-600">Warnings</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {pr.filesChanged?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Files Changed</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {pr.url && (
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <FaExternalLinkAlt />
                    View in GitHub
                  </a>
                )}
              </div>
            </div>
          )}

          {activeTab === "analysis" && (
            <div className="space-y-6">
              {/* AI Findings */}
              {pr.analysisResults?.aiScan?.findings?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FaExclamationTriangle className="text-yellow-600" />
                    AI Findings
                  </h3>
                  <div className="space-y-3">
                    {pr.analysisResults.aiScan.findings.map((finding, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(finding.severity || 5)}`}
                          >
                            {finding.confidence || "medium"}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium mb-1">
                              {finding.message}
                            </p>
                            {finding.suggestion && (
                              <div className="mt-2 flex items-center justify-between bg-yellow-50 p-2 rounded border border-yellow-100">
                                <p className="text-sm text-gray-700">
                                  💡 {finding.suggestion}
                                </p>
                                <button
                                  onClick={() =>
                                    alert(
                                      `Applying AI Fix via GitHub API...\n\nCommit: "Fix: ${finding.message}"`,
                                    )
                                  }
                                  className="flex-shrink-0 ml-4 text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition font-medium shadow-sm"
                                >
                                  Apply Fix
                                </button>
                              </div>
                            )}
                            {finding.file && (
                              <p className="text-xs text-gray-500 mt-2">
                                <FaCode className="inline mr-1" />
                                {finding.file}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complexity Changes */}
              {pr.analysisResults?.complexity?.fileChanges?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Complexity Changes</h3>
                  <div className="space-y-2">
                    {pr.analysisResults.complexity.fileChanges.map(
                      (change, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded"
                        >
                          <span className="text-sm font-mono">
                            {change.file}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">
                              Complexity: {change.complexity}
                            </span>
                            <span
                              className={`text-sm font-semibold ${
                                change.delta >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {change.delta >= 0 ? "+" : ""}
                              {change.delta}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "files" && (
            <div>
              <h3 className="font-semibold mb-3">
                Files Changed ({pr.filesChanged?.length || 0})
              </h3>
              <div className="space-y-2">
                {pr.filesChanged?.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded hover:bg-gray-100 transition"
                  >
                    <FaCode className="text-gray-400" />
                    <span className="font-mono text-sm">{file}</span>
                  </div>
                ))}
                {(!pr.filesChanged || pr.filesChanged.length === 0) && (
                  <p className="text-gray-500 text-center py-8">
                    No files changed
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PRDetailModal;
