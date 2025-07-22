import { useState } from "react";
import { CartridgeSidebar } from "./CartridgeSidebar";
import { SystemMonitor } from "./SystemMonitor";
import { CreateCartridgeModal } from "./CreateCartridgeModal";
import { EditCartridgeModal } from "./EditCartridgeModal";
import { DeleteCartridgeDialog } from "./DeleteCartridgeDialog";
import { useChat } from "@/hooks/use-chat";
import { useCartridges } from "@/hooks/use-cartridges";
import { Cartridge } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, Paperclip, Mic, Settings, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatInterface() {
  const [message, setMessage] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCartridge, setSelectedCartridge] = useState<Cartridge | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [forceCartridgeId, setForceCartridgeId] = useState<number | null>(null);
  const [cartridgeLocked, setCartridgeLocked] = useState(false);
  const { messages, sendMessage, isLoading } = useChat();
  const { cartridges, activeCartridge } = useCartridges();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    await sendMessage(message, forceCartridgeId || undefined);
    setMessage("");
    // Reset cartridge selection if not locked
    if (!cartridgeLocked) {
      setForceCartridgeId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEditCartridge = (cartridge: Cartridge) => {
    setSelectedCartridge(cartridge);
    setIsEditModalOpen(true);
  };

  const handleDeleteCartridge = (cartridge: Cartridge) => {
    setSelectedCartridge(cartridge);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedCartridge(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedCartridge(null);
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        leftPanelCollapsed ? "w-0" : "w-80"
      )}>
        <div className={cn(
          "h-full transition-opacity duration-300",
          leftPanelCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
          <CartridgeSidebar
            cartridges={cartridges}
            activeCartridge={activeCartridge}
            onCreateCartridge={() => setIsCreateModalOpen(true)}
            onEditCartridge={handleEditCartridge}
            onDeleteCartridge={handleDeleteCartridge}
          />
        </div>
      </div>

      {/* Left Panel Toggle */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          className="w-8 h-8 hover:bg-slate-700 text-slate-400"
        >
          {leftPanelCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-100">
                Infinite Context Chat
              </h1>
              <p className="text-sm text-slate-400">
                AI assistant with episodic memory cartridges
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isLoading && (
                <div className="flex items-center gap-2 bg-warning/20 border border-warning/30 rounded-lg px-3 py-2">
                  <Brain className="w-4 h-4 text-warning animate-pulse" />
                  <span className="text-sm text-warning">
                    Analyzing cartridges...
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-slate-700"
              >
                <Settings className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Brain className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                Welcome to Infinite Context Chat
              </h3>
              <p className="text-slate-500 max-w-md">
                Ask me anything and I'll use the most relevant memory cartridge
                to provide contextual responses.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "user" ? (
                  <div className="bg-primary max-w-2xl rounded-lg px-4 py-3">
                    <p className="text-white">{msg.content}</p>
                    <div className="text-xs text-blue-200 mt-2">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ) : msg.role === "system" ? (
                  <div className="flex justify-center">
                    <div className="bg-warning/20 border border-warning/30 rounded-lg px-4 py-2 max-w-md">
                      <div className="flex items-center gap-2 text-warning">
                        <Brain className="w-4 h-4" />
                        <span className="text-sm">{msg.content}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-700 max-w-2xl rounded-lg px-4 py-3 border border-slate-600">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-accent" />
                      <span className="text-sm text-accent font-medium">
                        AI Assistant
                      </span>
                    </div>
                    <div className="text-slate-100 prose prose-slate dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    <div className="text-xs text-slate-400 mt-3 flex items-center gap-4">
                      <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      {msg.tokenCount && (
                        <span>Tokens: {msg.tokenCount.toLocaleString()}</span>
                      )}
                      {msg.cost && <span>Cost: ${msg.cost}</span>}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-700 bg-slate-800 px-6 py-4">
          {/* Cartridge Selection */}
          <div className="mb-4 p-3 bg-slate-700 rounded-lg border border-slate-600">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-slate-200">Cartridge Selection</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select
                  value={forceCartridgeId?.toString() || "auto"}
                  onValueChange={(value) => setForceCartridgeId(value === "auto" ? null : parseInt(value))}
                >
                  <SelectTrigger className="bg-slate-600 border-slate-500 text-slate-100">
                    <SelectValue placeholder="Auto-select cartridge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-select cartridge</SelectItem>
                    {cartridges.map((cartridge) => (
                      <SelectItem key={cartridge.id} value={cartridge.id.toString()}>
                        {cartridge.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant={cartridgeLocked ? "default" : "outline"}
                size="sm"
                onClick={() => setCartridgeLocked(!cartridgeLocked)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1",
                  cartridgeLocked 
                    ? "bg-accent text-white hover:bg-accent/80" 
                    : "border-slate-500 text-slate-300 hover:bg-slate-600"
                )}
              >
                <Lock className="w-3 h-3" />
                {cartridgeLocked ? "Locked" : "Lock"}
              </Button>
            </div>
            {forceCartridgeId && (
              <div className="mt-2 text-xs text-slate-400">
                <span className="text-warning">Manual override:</span> Using {cartridges.find(c => c.id === forceCartridgeId)?.name}
                {cartridgeLocked && <span className="text-accent ml-2">• Locked</span>}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-4">
            <div className="flex-1">
              <div className="relative">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your memory cartridges..."
                  className="w-full bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 resize-none focus:border-primary focus:ring-primary/20"
                  rows={3}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-slate-600"
                  >
                    <Paperclip className="w-4 h-4 text-slate-400" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-slate-600"
                  >
                    <Mic className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              </div>
            </div>
            <Button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="bg-primary hover:bg-blue-700 text-white px-6 py-3"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </form>

          <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>•</span>
              <span>
                Current cartridge: {activeCartridge?.name || "None"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel Toggle */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
          className="w-8 h-8 hover:bg-slate-700 text-slate-400"
        >
          {rightPanelCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {/* Right Panel */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        rightPanelCollapsed ? "w-0" : "w-80"
      )}>
        <div className={cn(
          "h-full transition-opacity duration-300",
          rightPanelCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
          <SystemMonitor />
        </div>
      </div>

      {/* Create Cartridge Modal */}
      <CreateCartridgeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Cartridge Modal */}
      <EditCartridgeModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        cartridge={selectedCartridge}
      />

      {/* Delete Cartridge Dialog */}
      <DeleteCartridgeDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        cartridge={selectedCartridge}
      />
    </div>
  );
}
