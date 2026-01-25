import React, { useState, useEffect } from "react";
import api from "../services/api";
import GatekeeperStream from "../components/GatekeeperStream";
import CodebaseMRI from "../components/CodebaseMRI";
import ActionsBacklog from "../components/ActionsBacklog";
import TopKPIs from "../components/TopKPIs";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";

const TechDebtPage = () => {
  const [isTechDebtMode, setIsTechDebtMode] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await api.get("/tech-debt/summary");
        setMetrics(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch metrics", error);
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="h-full rounded-lg p-2 bg-transparent">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900">
            Code Health & Debt
          </h1>
          <p className="text-gray-600">
            Gatekeeper AI & Debt Visualization Dashboard
          </p>
        </div>

        <button
          onClick={() => setIsTechDebtMode(!isTechDebtMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all ${isTechDebtMode ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50" : "bg-white text-gray-700 shadow"}`}
        >
          {isTechDebtMode ? (
            <FaToggleOn size={20} />
          ) : (
            <FaToggleOff size={20} />
          )}
          <span>
            {isTechDebtMode ? "Tech Debt Mode: ON" : "Tech Debt Mode: OFF"}
          </span>
        </button>
      </div>

      {/* Mode Banner */}
      {isTechDebtMode && (
        <div className="mb-6 bg-indigo-50 border border-indigo-200 p-4 rounded-lg text-indigo-800 flex items-center justify-center animate-pulse">
          <span className="font-mono text-sm">Tech Debt Mode Active</span>
        </div>
      )}

      {/* 1. Top KPI Row */}
      <TopKPIs metrics={metrics} loading={loading} isDarkMode={false} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 min-h-[500px]">
        {/* 2. Gatekeeper Feed (Left) */}
        <GatekeeperStream isDarkMode={false} />

        {/* 3. Codebase MRI (Right) */}
        <CodebaseMRI isDarkMode={false} />
      </div>

      {/* 4. Actions & Backlog (Bottom) */}
      <div className="w-full">
        <ActionsBacklog isDarkMode={false} />
      </div>
    </div>
  );
};

export default TechDebtPage;
