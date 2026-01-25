import React from "react";
import {
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaChartLine,
  FaShieldAlt,
  FaFire,
  FaBroom,
} from "react-icons/fa";

const TopKPIs = ({ metrics, loading, isDarkMode }) => {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`rounded-lg shadow p-4 h-24 animate-pulse ${isDarkMode ? "bg-slate-800" : "bg-white"}`}
          ></div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: "Avg Debt Ratio (Risk)",
      value: `${metrics.debtRatio}/100`,
      trend: "neutral",
      color: metrics.debtRatio > 50 ? "red" : "green",
      icon: <FaChartLine />,
    },
    {
      label: "PR Block Rate (7d)",
      value: `${metrics.blockRate}%`,
      trend: metrics.blockRate > 20 ? "up" : "down",
      color: metrics.blockRate > 20 ? "red" : "green",
      icon: <FaShieldAlt />,
    },
    {
      label: "Critical Hotspots",
      value: metrics.hotspotCount,
      trend: "neutral",
      color: metrics.hotspotCount > 0 ? "red" : "yellow",
      icon: <FaFire />,
    },
    {
      label: "Risk Reduced (Sprint)",
      value: `${metrics.riskReduced}pts`,
      trend: "up",
      color: "green",
      icon: <FaBroom />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className={`rounded-lg shadow p-4 flex flex-col justify-between transition-colors ${isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-white"}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-700 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}
            >
              {kpi.icon}
            </div>
            <span
              className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              {kpi.label}
            </span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span
              className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              {kpi.value}
            </span>
            <div
              className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full 
                            ${
                              kpi.color === "red"
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                                : kpi.color === "green"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}
            >
              {kpi.trend === "up" && kpi.color === "red" ? (
                <FaArrowUp className="mr-1" />
              ) : null}
              {kpi.trend === "down" && kpi.color === "green" ? (
                <FaArrowDown className="mr-1" />
              ) : null}
              {kpi.trend === "neutral" ? <FaMinus className="mr-1" /> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopKPIs;
