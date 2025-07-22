import { Brain, Search, Save, Plus } from "lucide-react";
import { useCartridges } from "@/hooks/use-cartridges";

export function SystemMonitor() {
  const { activeCartridge } = useCartridges();

  const recentOperations = [
    {
      icon: Search,
      text: "Query analyzed (92% match)",
      time: "2:34 PM",
      color: "text-warning",
    },
    {
      icon: Save,
      text: "Cartridge updated",
      time: "2:30 PM",
      color: "text-accent",
    },
    {
      icon: Plus,
      text: "New node created",
      time: "2:28 PM",
      color: "text-primary",
    },
  ];

  const graphDensity = activeCartridge ? 
    Math.min(100, (activeCartridge.metadata.nodeCount / 5000) * 100) : 0;

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100">System Monitor</h3>
      </div>

      {/* Agent Activity */}
      <div className="p-4 border-b border-slate-700">
        <h4 className="text-sm font-medium text-slate-200 mb-3">
          Agent Activity
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
            <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
            <div>
              <div className="text-sm text-slate-200">Cartridge Selector</div>
              <div className="text-xs text-slate-400">
                Analyzing query similarity...
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <div>
              <div className="text-sm text-slate-200">Main Agent</div>
              <div className="text-xs text-slate-400">Ready for response</div>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Graph Visualization */}
      <div className="p-4 border-b border-slate-700">
        <h4 className="text-sm font-medium text-slate-200 mb-3">
          Memory Graph
        </h4>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Active Nodes</span>
            <span className="text-xs text-accent">
              {activeCartridge?.metadata.nodeCount.toLocaleString() || "0"}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${graphDensity}%` }}
            ></div>
          </div>
          <div className="text-xs text-slate-500">
            Graph density: {graphDensity.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Recent Operations */}
      <div className="flex-1 p-4">
        <h4 className="text-sm font-medium text-slate-200 mb-3">
          Recent Operations
        </h4>
        <div className="space-y-2">
          {recentOperations.map((op, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs text-slate-400"
            >
              <op.icon className={`w-3 h-3 ${op.color}`} />
              <span>{op.text}</span>
              <span className="ml-auto">{op.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
