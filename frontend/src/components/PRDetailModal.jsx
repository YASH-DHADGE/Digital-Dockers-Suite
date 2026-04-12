import React, { useState } from "react";
import {
  FaTimes,
  FaExternalLinkAlt,
  FaCode,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaRobot,
  FaGithub,
  FaBrain,
  FaLayerGroup,
  FaCog,
  FaClipboardCheck,
} from "react-icons/fa";
import { format } from "date-fns";
import { useThemeMode } from "../context/ThemeContext";

const PRDetailModal = ({ pr, onClose }) => {
  const { mode } = useThemeMode();
  const isDarkMode = mode === "dark";
  const [activeTab, setActiveTab] = useState("layers");

  if (!pr) return null;

  const dynamicLayers = pr.analysisResults?.dynamicScan?.layers || {};
  const dynamicUnifiedFindings = Array.isArray(pr.analysisResults?.dynamicScan?.unifiedFindings)
    ? pr.analysisResults.dynamicScan.unifiedFindings
    : [];

  const getSeverityColor = (severity) => {
    if (severity >= 8) return isDarkMode ? "text-red-300 bg-red-900/40 border border-red-800/50" : "text-red-700 bg-red-100 border border-red-200";
    if (severity >= 5) return isDarkMode ? "text-amber-300 bg-amber-900/40 border border-amber-800/50" : "text-amber-700 bg-amber-100 border border-amber-200";
    return isDarkMode ? "text-blue-300 bg-blue-900/40 border border-blue-800/50" : "text-blue-700 bg-blue-100 border border-blue-200";
  };

  const getGatekeeperScore = () => {
    const raw = Number(
      pr?.gatekeeperScore?.overall ??
      pr?.healthScore?.current ??
      (100 - Number(pr?.risk_score || pr?.riskScore || 0))
    );
    if (!Number.isFinite(raw)) return 0;
    return Math.max(0, Math.min(100, Math.round(raw)));
  };

  const getLayerScore = (layerId) => {
    const dynamicScore = Number(dynamicLayers?.[layerId]?.score);
    if (Number.isFinite(dynamicScore)) {
      return Math.max(0, Math.min(100, Math.round(dynamicScore)));
    }

    const fromBackend = Number(pr?.gatekeeperScore?.layers?.[layerId]);
    if (Number.isFinite(fromBackend)) {
      return Math.max(0, Math.min(100, Math.round(fromBackend)));
    }

    if (layerId === "syntax") {
      const errors = Number(pr.analysisResults?.lint?.errors || 0);
      const warnings = Number(pr.analysisResults?.lint?.warnings || 0);
      return Math.max(0, Math.min(100, Math.round(100 - (errors * 12) - (warnings * 2))));
    }

    if (layerId === "maintainability") {
      const delta = Number(pr.analysisResults?.complexity?.healthScoreDelta || 0);
      return Math.max(0, Math.min(100, Math.round(100 - Math.max(0, -delta * 4))));
    }

    if (layerId === "semantic") {
      const verdict = String(pr.analysisResults?.aiScan?.verdict || "").toUpperCase();
      if (verdict === "GOOD") return 85;
      if (verdict === "RISKY") return 60;
      if (verdict === "BAD") return 30;
      return 55;
    }

    return 0;
  };

  const getLayerStatus = (layer) => {
    if (!pr.analysisResults) return { status: "pending", icon: FaCog };

    const dynamicStatus = String(dynamicLayers?.[layer]?.status || "").toLowerCase();
    if (dynamicStatus === "pass") return { status: "pass", icon: FaCheckCircle, color: "text-green-600" };
    if (dynamicStatus === "fail") return { status: "fail", icon: FaTimesCircle, color: "text-red-600" };
    if (dynamicStatus === "warn") return { status: "warn", icon: FaExclamationTriangle, color: "text-amber-600" };

    switch (layer) {
      case "syntax": {
        const lintErrors = pr.analysisResults?.lint?.errors || 0;
        return lintErrors === 0
          ? { status: "pass", icon: FaCheckCircle, color: "text-green-600" }
          : { status: "fail", icon: FaTimesCircle, color: "text-red-600" };
      }
      case "maintainability": {
        const score = getLayerScore("maintainability");
        const delta = Number(pr.analysisResults?.complexity?.healthScoreDelta || 0);
        return delta >= 0
          ? { status: "pass", icon: FaCheckCircle, color: "text-green-600" }
          : score >= 60
            ? { status: "warn", icon: FaExclamationTriangle, color: "text-amber-600" }
            : { status: "fail", icon: FaTimesCircle, color: "text-red-600" };
      }
      case "semantic": {
        const verdict = pr.analysisResults?.aiScan?.verdict;
        if (verdict === "GOOD") return { status: "pass", icon: FaCheckCircle, color: "text-green-600" };
        if (verdict === "BAD") return { status: "fail", icon: FaTimesCircle, color: "text-red-600" };
        if (verdict === "RISKY") return { status: "warn", icon: FaExclamationTriangle, color: "text-amber-600" };
        return { status: "warn", icon: FaExclamationTriangle, color: "text-amber-600" };
      }
      default:
        return { status: "pending", icon: FaCog, color: "text-slate-400" };
    }
  };

  const normalizeProviderValue = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized || normalized === "none" || normalized === "unknown" || normalized === "n/a" || normalized === "null") {
      return null;
    }
    return String(value).trim();
  };

  const semanticVerdictLabel = (verdict) => {
    const normalized = String(verdict || "").toUpperCase();
    if (normalized === "GOOD") return "Healthy";
    if (normalized === "BAD") return "High Risk";
    if (normalized === "RISKY") return "Needs Review";
    return "Pending";
  };

  const aiProvider = normalizeProviderValue(pr.analysisResults?.aiScan?.provider);
  const aiModel = normalizeProviderValue(pr.analysisResults?.aiScan?.model);
  const aiEngineLabel = aiProvider || "NVIDIA";

  const analysisLayers = [
    {
      id: "syntax",
      name: "Code Quality",
      icon: FaClipboardCheck,
      details: dynamicLayers.syntax || pr.analysisResults?.lint || {},
    },
    {
      id: "maintainability",
      name: "Maintainability",
      icon: FaLayerGroup,
      details: dynamicLayers.maintainability || pr.analysisResults?.complexity || {},
    },
    {
      id: "semantic",
      name: "AI Risk",
      icon: FaBrain,
      details: dynamicLayers.semantic || pr.analysisResults?.aiScan || {},
    },
  ];

  const fileChangeMetrics = pr.analysisResults?.complexity?.fileChanges || [];

  const tabs = [
    { id: "layers", label: "Layers", icon: FaLayerGroup },
    { id: "findings", label: "Findings", icon: FaRobot },
    { id: "files", label: "Files", icon: FaCode },
  ];

  const overallScore = getGatekeeperScore();
  const overallDelta = Number(pr?.healthScore?.delta ?? pr?.analysisResults?.complexity?.healthScoreDelta ?? 0);

  const unifiedFindings = dynamicUnifiedFindings.length > 0
    ? dynamicUnifiedFindings
    : [
      {
        layer: "syntax",
        message: `Code quality scan: ${pr.analysisResults?.lint?.errors || 0} error(s), ${pr.analysisResults?.lint?.warnings || 0} warning(s).`,
        suggestion: (pr.analysisResults?.lint?.errors || 0) > 0 ? "Resolve lint errors before merge." : "No blocking syntax findings.",
        severity: (pr.analysisResults?.lint?.errors || 0) > 0 ? 7 : 2,
        confidence: "high",
      },
      {
        layer: "maintainability",
        message: `Maintainability scan delta: ${Number(pr.analysisResults?.complexity?.healthScoreDelta || 0) >= 0 ? "+" : ""}${Number(pr.analysisResults?.complexity?.healthScoreDelta || 0)}.`,
        suggestion: Number(pr.analysisResults?.complexity?.healthScoreDelta || 0) < 0
          ? "Reduce complexity in modified files."
          : "Maintainability trend is stable.",
        severity: Number(pr.analysisResults?.complexity?.healthScoreDelta || 0) < 0 ? 6 : 2,
        confidence: "medium",
      },
      {
        layer: "semantic",
        message: `AI risk scan verdict: ${semanticVerdictLabel(pr.analysisResults?.aiScan?.verdict)}.`,
        suggestion: pr.analysisResults?.aiScan?.verdict === "BAD"
          ? "Address semantic risk blockers."
          : "No critical semantic blockers reported.",
        severity: pr.analysisResults?.aiScan?.verdict === "BAD" ? 8 : pr.analysisResults?.aiScan?.verdict === "RISKY" ? 5 : 2,
        confidence: "medium",
      },
      ...(Array.isArray(pr.analysisResults?.aiScan?.findings) ? pr.analysisResults.aiScan.findings.map((finding) => ({
        ...finding,
        layer: "semantic"
      })) : [])
    ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden m-4 border border-blue-100 transition-colors ${isDarkMode ? "bg-slate-900 border-slate-700 shadow-slate-950/50" : "bg-white border-blue-100 shadow-xl"}`}>
        <div className={`p-4 border-b transition-colors ${isDarkMode ? "border-slate-700 bg-slate-800/50" : "border-blue-100 bg-blue-50"}`}>
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-base font-bold ${isDarkMode ? "text-cyan-400" : "text-blue-800"}`}>PR #{pr.prNumber ?? "N/A"}</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${pr.status === "PASS"
                    ? "bg-green-500 text-white"
                    : pr.status === "BLOCK"
                      ? "bg-red-500 text-white"
                      : "bg-amber-500 text-white"
                    }`}
                >
                  {pr.status || "PENDING"}
                </span>
                {pr.status === "PASS" && <FaCheckCircle className="text-green-600" size={16} />}
                {pr.status === "BLOCK" && <FaTimesCircle className="text-red-600" size={16} />}
              </div>

              <h2 className={`text-lg font-semibold truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>{pr.title || "Pull Request Overview"}</h2>
              <div className={`flex items-center gap-3 text-xs mt-1 flex-wrap ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                <span>@{pr.author || "unknown"}</span>
                <span>•</span>
                <span>{pr.branch || pr.repoId || "repository"}</span>
                <span>•</span>
                <span>{pr.createdAt ? format(new Date(pr.createdAt), "MMM d, yyyy HH:mm") : "Just now"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`text-right px-3 py-1.5 rounded-lg border transition-colors ${isDarkMode ? "border-slate-600 bg-slate-800" : "border-blue-200 bg-white"}`}>
                <div className={`text-lg font-bold leading-none ${isDarkMode ? "text-cyan-400" : "text-blue-700"}`}>{overallScore}</div>
                <div className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Δ {overallDelta >= 0 ? "+" : ""}{overallDelta}</div>
              </div>
              <button onClick={onClose} className={`rounded-full p-2 transition flex-shrink-0 ${isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-blue-700 hover:bg-blue-100"}`}>
                <FaTimes size={18} />
              </button>
            </div>
          </div>

          <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-blue-100"}`}>
            <div
              className={`h-full transition-all ${overallScore > 80 ? "bg-green-500" : overallScore > 60 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>

        <div className={`border-b transition-colors ${isDarkMode ? "border-slate-700 bg-slate-800/30" : "border-blue-100 bg-blue-50/40"}`}>
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition ${activeTab === tab.id
                  ? isDarkMode ? "border-b-2 border-cyan-500 text-cyan-400 bg-slate-800/50" : "border-b-2 border-blue-600 text-blue-700 bg-white"
                  : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-blue-700"
                  }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`p-6 overflow-y-auto max-h-[calc(90vh-280px)] transition-colors ${isDarkMode ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}`}>
          {activeTab === "layers" && (
            <div className="space-y-4">
              {analysisLayers.map((layer, idx) => {
                const status = getLayerStatus(layer.id);
                const StatusIcon = status.icon;

                return (
                  <div key={layer.id} className={`border rounded-xl p-5 shadow-sm transition-colors ${isDarkMode ? "border-slate-800 bg-slate-800/40" : "border-blue-100 bg-white"}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold border transition-colors ${isDarkMode ? "bg-slate-700 text-cyan-300 border-slate-600" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                        {idx + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <layer.icon className={isDarkMode ? "text-cyan-400" : "text-blue-600"} />
                          <h3 className={`font-semibold text-lg ${isDarkMode ? "text-white" : "text-slate-900"}`}>{layer.name}</h3>
                          <StatusIcon className={status.color} />
                          <span className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${isDarkMode ? "bg-slate-800 text-cyan-300 border-slate-700" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                            Score: {getLayerScore(layer.id)}
                          </span>
                        </div>

                        {layer.id === "syntax" && (
                          <div className="flex gap-3 text-sm flex-wrap">
                            {(() => {
                              const metrics = layer.details?.metrics || {};
                              const errors = Number(metrics.errors ?? layer.details.errors ?? 0);
                              const warnings = Number(metrics.warnings ?? layer.details.warnings ?? 0);

                              return (
                                <>
                            <span className={`px-3 py-1 rounded-full border ${errors === 0
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-red-100 text-red-700 border-red-200"
                              }`}>
                              Errors: {errors}
                            </span>
                            <span className="px-3 py-1 rounded-full border bg-blue-100 text-blue-700 border-blue-200">
                              Warnings: {warnings}
                            </span>
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {layer.id === "maintainability" && (
                          <div className="flex gap-3 text-sm flex-wrap">
                            {(() => {
                              const metrics = layer.details?.metrics || {};
                              const delta = Number(metrics.delta ?? layer.details.healthScoreDelta ?? 0);
                              const files = Number(metrics.files ?? layer.details.fileChanges?.length ?? 0);

                              return (
                                <>
                            <span className={`px-3 py-1 rounded-full border transition-colors ${delta >= 0
                              ? isDarkMode ? "bg-green-900/30 text-green-300 border-green-800/50" : "bg-green-100 text-green-700 border-green-200"
                              : isDarkMode ? "bg-red-900/30 text-red-300 border-red-800/50" : "bg-red-100 text-red-700 border-red-200"
                              }`}>
                              Delta: {delta >= 0 ? "+" : ""}{delta}
                            </span>
                            <span className={`px-3 py-1 rounded-full border transition-colors ${isDarkMode ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                              Files: {files}
                            </span>
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {layer.id === "semantic" && (
                          <div className="flex gap-3 text-sm flex-wrap">
                            {(() => {
                              const metrics = layer.details?.metrics || {};
                              const verdict = metrics.verdict ?? layer.details.verdict;
                              const findings = Number(metrics.findings ?? layer.details.findings?.length ?? 0);
                              const engine = metrics.engine || aiEngineLabel;
                              const model = metrics.model || aiModel;

                              return (
                                <>
                            <span className={`px-3 py-1 rounded-full border transition-colors ${String(verdict || "").toUpperCase() === "GOOD"
                              ? isDarkMode ? "bg-green-900/30 text-green-300 border-green-800/50" : "bg-green-100 text-green-700 border-green-200"
                              : String(verdict || "").toUpperCase() === "BAD"
                                ? isDarkMode ? "bg-red-900/30 text-red-300 border-red-800/50" : "bg-red-100 text-red-700 border-red-200"
                                : isDarkMode ? "bg-amber-900/30 text-amber-300 border-amber-800/50" : "bg-amber-100 text-amber-700 border-amber-200"
                              }`}>
                              Verdict: {semanticVerdictLabel(verdict)}
                            </span>
                            <span className={`px-3 py-1 rounded-full border transition-colors ${isDarkMode ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                              Findings: {findings}
                            </span>
                            <span className={`px-3 py-1 rounded-full border transition-colors ${isDarkMode ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                              Engine: {engine}{model ? ` / ${model}` : ""}
                            </span>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "findings" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {analysisLayers.map((layer) => {
                  const status = getLayerStatus(layer.id);
                  const score = getLayerScore(layer.id);
                  const metrics = layer.details?.metrics || {};

                  const meta =
                    layer.id === "syntax"
                      ? `${Number(metrics.errors ?? layer.details?.errors ?? 0)} err • ${Number(metrics.warnings ?? layer.details?.warnings ?? 0)} warn`
                      : layer.id === "maintainability"
                        ? `Δ ${Number(metrics.delta ?? layer.details?.healthScoreDelta ?? 0) >= 0 ? "+" : ""}${Number(metrics.delta ?? layer.details?.healthScoreDelta ?? 0)} • Files ${Number(metrics.files ?? layer.details?.fileChanges?.length ?? 0)}`
                        : `${semanticVerdictLabel(metrics.verdict ?? layer.details?.verdict)} • Findings ${Number(metrics.findings ?? layer.details?.findings?.length ?? 0)}`;

                  return (
                    <div key={`finding-summary-${layer.id}`} className={`rounded-xl border p-3 transition-colors ${isDarkMode ? "border-slate-700 bg-slate-800/50" : "border-blue-100 bg-blue-50/60"}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-sm font-semibold ${isDarkMode ? "text-cyan-300" : "text-blue-800"}`}>{layer.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${isDarkMode ? "bg-slate-700 border-slate-600 text-cyan-200" : "bg-white border-blue-200 text-blue-700"}`}>{score}</span>
                      </div>
                      <div className={`text-xs mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{meta}</div>
                      <div className={`text-xs font-semibold ${status.color}`}>{String(status.status || "pending").toUpperCase()}</div>
                    </div>
                  );
                })}
              </div>

              {unifiedFindings.length > 0 ? (
                unifiedFindings.map((finding, idx) => (
                  <div key={`unified-finding-${idx}`} className={`border rounded-lg p-4 shadow-sm transition-colors ${isDarkMode ? "border-slate-800 bg-slate-800/30" : "border-blue-100 bg-white"}`}>
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(finding.severity || 5)}`}>
                        {finding.confidence || "medium"}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors ${isDarkMode ? "border-slate-700 bg-slate-800 text-cyan-300" : "border-blue-200 bg-blue-100 text-blue-700"} uppercase`}>
                            {finding.layer || "semantic"}
                          </span>
                          <p className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>{finding.message}</p>
                        </div>

                        {finding.suggestion && (
                          <div className={`mt-2 p-3 rounded-lg border transition-colors ${isDarkMode ? "bg-slate-900 border-slate-700 text-slate-300" : "bg-blue-50 border-blue-200 text-blue-900"}`}>
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-sm">{finding.suggestion}</p>
                              <button
                                onClick={() =>
                                  alert(
                                    `Applying AI Fix via GitHub API...\n\nCommit: "Fix: ${finding.message}"`
                                  )
                                }
                                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg transition font-medium ${isDarkMode ? "bg-cyan-600 hover:bg-cyan-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                              >
                                Apply Fix
                              </button>
                            </div>
                          </div>
                        )}

                        {finding.file && (
                          <p className="text-xs mt-2 text-slate-500">
                            <FaCode className="inline mr-1" />
                            {finding.file}
                            {Array.isArray(finding.lineRange) && finding.lineRange.length >= 2
                              ? `:${finding.lineRange[0]}-${finding.lineRange[1]}`
                              : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FaCheckCircle className="mx-auto mb-3 text-blue-300" size={48} />
                  <p className="text-slate-500">No scan findings available.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "files" && (
            <div>
              <h3 className={`font-semibold mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Changed Files ({fileChangeMetrics.length || pr.filesChanged?.length || 0})
              </h3>
              <div className="space-y-2">
                {fileChangeMetrics.length > 0
                  ? fileChangeMetrics.map((file, idx) => (
                    <div key={`${file.file || "file"}-${idx}`} className={`p-3 rounded-lg border transition-colors ${isDarkMode ? "border-slate-800 bg-slate-800/40" : "border-blue-100 bg-white shadow-sm"}`}>
                      <div className="flex items-center gap-3">
                        <FaCode className={isDarkMode ? "text-cyan-400" : "text-blue-400"} />
                        <span className={`font-mono text-sm flex-1 truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{file.file}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className={`px-2 py-1 rounded border transition-colors ${isDarkMode ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-blue-100 text-blue-800 border-blue-200"}`}>
                          Complexity: {file.complexity || 0}
                        </span>
                        <span className={`px-2 py-1 rounded border transition-colors ${(file.riskScore || 0) > 70 
                          ? isDarkMode ? "bg-red-900/30 text-red-300 border-red-800/50" : "bg-red-100 text-red-700 border-red-200" 
                          : (file.riskScore || 0) > 40 
                            ? isDarkMode ? "bg-amber-900/30 text-amber-300 border-amber-800/50" : "bg-amber-100 text-amber-700 border-amber-200" 
                            : isDarkMode ? "bg-green-900/30 text-green-300 border-green-800/50" : "bg-green-100 text-green-700 border-green-200"}`}>
                          Risk: {file.riskScore || 0}
                        </span>
                        <span className={`px-2 py-1 rounded border transition-colors ${isDarkMode ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-blue-100 text-blue-800 border-blue-200"}`}>
                          LOC: {file.loc || 0}
                        </span>
                        <span className={`px-2 py-1 rounded border transition-colors ${isDarkMode ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-blue-100 text-blue-800 border-blue-200"}`}>
                          Diff: +{file.additions || 0} / -{file.deletions || 0}
                        </span>
                        <span className={`px-2 py-1 rounded border transition-colors ${(file.lintErrors || 0) > 0 
                          ? isDarkMode ? "bg-red-900/30 text-red-300 border-red-800/50" : "bg-red-100 text-red-700 border-red-200" 
                          : isDarkMode ? "bg-green-900/30 text-green-300 border-green-800/50" : "bg-green-100 text-green-700 border-green-200"}`}>
                          Lint: {file.lintErrors || 0} errors, {file.lintWarnings || 0} warnings
                        </span>
                      </div>
                    </div>
                  ))
                  : pr.filesChanged?.map((file, idx) => (
                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isDarkMode ? "border-slate-800 bg-slate-800/40" : "border-blue-100 bg-white shadow-sm"}`}>
                      <FaCode className={isDarkMode ? "text-cyan-400" : "text-blue-400"} />
                      <span className={`font-mono text-sm flex-1 truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{file}</span>
                    </div>
                  ))}
                {fileChangeMetrics.length === 0 && (!pr.filesChanged || pr.filesChanged.length === 0) && (
                  <p className={`text-center py-8 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>No file metrics available.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={`flex items-center justify-between px-6 py-4 border-t transition-colors ${isDarkMode ? "border-slate-700 bg-slate-800/50" : "border-blue-100 bg-blue-50/40"}`}>
          {pr.url ? (
            <a
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 text-sm transition-colors ${isDarkMode ? "text-cyan-400 hover:text-cyan-300" : "text-blue-700 hover:text-blue-800"}`}
            >
              <FaGithub /> View on GitHub
              <FaExternalLinkAlt size={10} />
            </a>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PRDetailModal;
