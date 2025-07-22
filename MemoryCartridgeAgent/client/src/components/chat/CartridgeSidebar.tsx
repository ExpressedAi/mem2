import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Brain, Wifi, WifiOff, Edit, Trash2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Cartridge } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CartridgeSidebarProps {
  cartridges: Cartridge[];
  activeCartridge: Cartridge | null;
  onCreateCartridge: () => void;
  onEditCartridge: (cartridge: Cartridge) => void;
  onDeleteCartridge: (cartridge: Cartridge) => void;
}

export function CartridgeSidebar({
  cartridges,
  activeCartridge,
  onCreateCartridge,
  onEditCartridge,
  onDeleteCartridge,
}: CartridgeSidebarProps) {
  const formatSize = (sizeMb: number): string => {
    return `${sizeMb.toFixed(1)}MB`;
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  return (
    <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-100 mb-2">
          Memory Cartridges
        </h2>
        <Button
          onClick={onCreateCartridge}
          className="w-full bg-primary hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Cartridge
        </Button>
      </div>

      {/* Cartridge List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cartridges.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No cartridges created yet</p>
          </div>
        ) : (
          cartridges.map((cartridge) => (
            <div
              key={cartridge.id}
              className={cn(
                "bg-slate-700 rounded-lg p-4 border transition-colors cursor-pointer",
                cartridge.isActive
                  ? "border-primary/50 bg-primary/5"
                  : "border-slate-600 hover:border-slate-500"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-slate-100">{cartridge.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={cartridge.isActive ? "default" : "secondary"}
                    className={cn(
                      "text-xs",
                      cartridge.isActive
                        ? "bg-accent/20 text-accent"
                        : "bg-slate-600 text-slate-400"
                    )}
                  >
                    {cartridge.isActive ? "Active" : "Idle"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCartridge(cartridge);
                        }}
                        className="text-slate-300 hover:text-slate-100 hover:bg-slate-700"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCartridge(cartridge);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                {cartridge.description}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {formatSize(cartridge.metadata.sizeMb)} •{" "}
                  {cartridge.metadata.nodeCount.toLocaleString()} nodes
                </span>
                <span>Updated {formatTimeAgo(cartridge.updatedAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* API Status */}
      <div className="p-4 border-t border-slate-700">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Selector (GPT-4.1-nano)
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-xs text-accent">Connected</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Response (GPT-4o-mini)</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-xs text-accent">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
