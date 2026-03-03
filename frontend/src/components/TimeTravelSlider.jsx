import React, { useState, useEffect, useCallback } from "react";
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaCalendarAlt } from "react-icons/fa";
import { format } from "date-fns";
import api from "../services/api";

/**
 * TimeTravelSlider - Navigate through analysis snapshots
 * Enables viewing historical codebase health data by sprint
 */
const TimeTravelSlider = ({ repoId, onSnapshotChange, isDarkMode = false }) => {
    const [snapshots, setSnapshots] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch snapshots
    useEffect(() => {
        if (!repoId) return;

        const fetchSnapshots = async () => {
            try {
                setLoading(true);
                const { data } = await api.get("/tech-debt/snapshots", {
                    params: { repoId, limit: 24 }
                });
                setSnapshots(data || []);
                // Default to latest snapshot
                if (data && data.length > 0) {
                    setCurrentIndex(data.length - 1);
                }
            } catch (err) {
                console.error("Failed to fetch snapshots:", err);
                setSnapshots([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSnapshots();
    }, [repoId]);

    // Notify parent of snapshot changes
    useEffect(() => {
        if (currentIndex >= 0 && snapshots[currentIndex]) {
            onSnapshotChange?.(snapshots[currentIndex]);
        }
    }, [currentIndex, snapshots, onSnapshotChange]);

    // Playback effect
    useEffect(() => {
        if (!isPlaying || snapshots.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                if (prev >= snapshots.length - 1) {
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, 1500);

        return () => clearInterval(interval);
    }, [isPlaying, snapshots.length]);

    const handleSliderChange = useCallback((e) => {
        setCurrentIndex(parseInt(e.target.value, 10));
        setIsPlaying(false);
    }, []);

    const stepBack = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        setIsPlaying(false);
    };

    const stepForward = () => {
        setCurrentIndex((prev) => Math.min(snapshots.length - 1, prev + 1));
        setIsPlaying(false);
    };

    const togglePlay = () => {
        if (currentIndex >= snapshots.length - 1) {
            setCurrentIndex(0);
        }
        setIsPlaying(!isPlaying);
    };

    if (loading) {
        return (
            <div className={`p-4 rounded-lg ${isDarkMode ? "bg-slate-700" : "bg-gray-100"}`}>
                <div className="animate-pulse flex items-center gap-4">
                    <div className={`h-4 w-24 rounded ${isDarkMode ? "bg-slate-600" : "bg-gray-300"}`} />
                    <div className={`flex-1 h-2 rounded ${isDarkMode ? "bg-slate-600" : "bg-gray-300"}`} />
                </div>
            </div>
        );
    }

    if (snapshots.length === 0) {
        return null; // Don't show if no snapshots
    }

    const currentSnapshot = snapshots[currentIndex] || {};
    const healthScore = currentSnapshot.aggregateMetrics?.healthScore || 0;

    return (
        <div
            className={`p-4 rounded-xl border ${isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-gray-200 shadow-sm"
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <FaCalendarAlt
                        className={isDarkMode ? "text-indigo-400" : "text-indigo-600"}
                    />
                    <span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                        Time Travel
                    </span>
                </div>
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Sprint {currentSnapshot.sprint || "—"} of {snapshots.length}
                </div>
            </div>

            {/* Slider */}
            <div className="mb-3">
                <input
                    type="range"
                    min={0}
                    max={snapshots.length - 1}
                    value={currentIndex}
                    onChange={handleSliderChange}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, 
              ${isDarkMode ? "#6366f1" : "#4f46e5"} 0%, 
              ${isDarkMode ? "#6366f1" : "#4f46e5"} ${(currentIndex / (snapshots.length - 1)) * 100}%, 
              ${isDarkMode ? "#4b5563" : "#e5e7eb"} ${(currentIndex / (snapshots.length - 1)) * 100}%, 
              ${isDarkMode ? "#4b5563" : "#e5e7eb"} 100%)`
                    }}
                />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={stepBack}
                        disabled={currentIndex <= 0}
                        className={`p-2 rounded-lg transition ${currentIndex <= 0
                                ? "opacity-50 cursor-not-allowed"
                                : isDarkMode
                                    ? "hover:bg-slate-700"
                                    : "hover:bg-gray-100"
                            } ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                        <FaStepBackward size={12} />
                    </button>
                    <button
                        onClick={togglePlay}
                        className={`p-2 rounded-lg transition ${isDarkMode
                                ? "bg-indigo-600 hover:bg-indigo-700"
                                : "bg-indigo-600 hover:bg-indigo-700"
                            } text-white`}
                    >
                        {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
                    </button>
                    <button
                        onClick={stepForward}
                        disabled={currentIndex >= snapshots.length - 1}
                        className={`p-2 rounded-lg transition ${currentIndex >= snapshots.length - 1
                                ? "opacity-50 cursor-not-allowed"
                                : isDarkMode
                                    ? "hover:bg-slate-700"
                                    : "hover:bg-gray-100"
                            } ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                        <FaStepForward size={12} />
                    </button>
                </div>

                {/* Current Snapshot Info */}
                <div className="flex items-center gap-4 text-sm">
                    {currentSnapshot.createdAt && (
                        <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                            {format(new Date(currentSnapshot.createdAt), "MMM d, yyyy")}
                        </span>
                    )}
                    <div className="flex items-center gap-2">
                        <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                            Health:
                        </span>
                        <span
                            className="font-bold"
                            style={{
                                color:
                                    healthScore > 70
                                        ? "#22c55e"
                                        : healthScore > 40
                                            ? "#f59e0b"
                                            : "#ef4444"
                            }}
                        >
                            {healthScore.toFixed(0)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                            Hotspots:
                        </span>
                        <span className="font-bold text-red-500">
                            {currentSnapshot.aggregateMetrics?.hotspotCount || 0}
                        </span>
                    </div>
                </div>
            </div>

            {/* Comparison Delta */}
            {currentSnapshot.comparison && (
                <div
                    className={`mt-3 pt-3 border-t flex items-center gap-4 text-xs ${isDarkMode ? "border-slate-700 text-gray-400" : "border-gray-200 text-gray-500"
                        }`}
                >
                    <span>vs previous sprint:</span>
                    <span
                        className={
                            currentSnapshot.comparison.riskDelta < 0
                                ? "text-green-500"
                                : currentSnapshot.comparison.riskDelta > 0
                                    ? "text-red-500"
                                    : ""
                        }
                    >
                        Risk: {currentSnapshot.comparison.riskDelta >= 0 ? "+" : ""}
                        {currentSnapshot.comparison.riskDelta?.toFixed(1) || 0}
                    </span>
                    {currentSnapshot.comparison.hotspotsResolved > 0 && (
                        <span className="text-green-500">
                            -{currentSnapshot.comparison.hotspotsResolved} hotspots
                        </span>
                    )}
                    {currentSnapshot.comparison.hotspotsAdded > 0 && (
                        <span className="text-red-500">
                            +{currentSnapshot.comparison.hotspotsAdded} hotspots
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default TimeTravelSlider;
