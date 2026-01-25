import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import api from "../services/api";
import CreateRefactorTaskModal from "./CreateRefactorTaskModal";

const CodebaseMRI = ({ isDarkMode }) => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get("/tech-debt/hotspots");
        // Ensure data is valid for D3
        const validData = data.map((d) => ({ ...d, loc: d.loc || 10 }));
        setData(validData);
      } catch (err) {
        console.error("MRI Fetch Error", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!data.length) return;

    const width = 600;
    const height = 400;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .call(
        d3.zoom().on("zoom", (event) => {
          svg.select("g").attr("transform", event.transform);
        }),
      );

    svg.selectAll("*").remove(); // Clear previous

    const g = svg.append("g");

    // Color Scale: Green (Low Risk) -> Yellow (Med) -> Red (High)
    const colorScale = d3
      .scaleLinear()
      .domain([0, 50, 100])
      .range(["#4ade80", "#facc15", "#ef4444"]);

    // Size Scale: Based on LOC (sqrt)
    const sizeScale = d3.scaleSqrt().domain([0, 1000]).range([5, 25]);

    const simulation = d3
      .forceSimulation(data)
      .force("charge", d3.forceManyBody().strength(-20))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => sizeScale(d.loc) + 1),
      );

    const nodes = g
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("r", (d) => sizeScale(d.loc))
      .attr("fill", (d) => colorScale(d.risk))
      .attr("stroke", isDarkMode ? "#333" : "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("click", (event, d) => setSelectedNode(d));

    simulation.on("tick", () => {
      nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    });

    return () => simulation.stop();
  }, [data, isDarkMode]);

  const handleTaskCreated = (task) => {
    console.log("Task created:", task);
    setShowTaskModal(false);
    setSelectedNode(null);
  };

  return (
    <>
      <div
        className={`shadow rounded-lg p-6 h-full flex flex-col transition-colors ${isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-white"}`}
      >
        <h2
          className={`text-xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}
        >
          Codebase MRI
        </h2>
        <p
          className={`text-xs mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Size = LOC, Color = Risk (Complexity × Churn)
        </p>

        <div
          className={`flex-grow border rounded relative overflow-hidden ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-gray-50"}`}
        >
          <svg ref={svgRef} className="w-full h-full"></svg>

          {selectedNode && (
            <div
              className={`absolute top-2 right-2 backdrop-blur p-4 rounded shadow border max-w-xs ${isDarkMode ? "bg-slate-800/90 text-white border-slate-600" : "bg-white/90 text-gray-800 border-gray-200"}`}
            >
              <button
                onClick={() => setSelectedNode(null)}
                className="absolute top-1 right-2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
              <h3 className="font-bold text-sm truncate mb-2">
                {selectedNode.path}
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Risk Score:</span>{" "}
                  <span className="font-bold">
                    {selectedNode.risk.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Complexity:</span>{" "}
                  <span>{selectedNode.complexity.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Churn (90d):</span>{" "}
                  <span>{selectedNode.churnRate.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>LOC:</span> <span>{selectedNode.loc.toFixed(0)}</span>
                </div>
              </div>
              <button
                onClick={() => setShowTaskModal(true)}
                className="mt-3 w-full bg-indigo-600 text-white py-1 rounded text-xs font-semibold hover:bg-indigo-700"
              >
                Create Refactor Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showTaskModal && selectedNode && (
        <CreateRefactorTaskModal
          file={selectedNode}
          onClose={() => setShowTaskModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </>
  );
};

export default CodebaseMRI;
