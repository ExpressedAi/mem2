import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Message, ChatRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ChatResponse {
  userMessage: Message;
  aiMessage: Message;
  selection: {
    selectedCartridgeId: number;
    matchScore: number;
    reasoning: string;
  };
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch initial messages
  const { data: initialMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    queryFn: () => 
      fetch("/api/messages?limit=50")
        .then(res => res.json())
        .then(data => data || [])
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, forceCartridgeId }: { message: string; forceCartridgeId?: number }): Promise<ChatResponse> => {
      const response = await apiRequest("POST", "/api/chat", { 
        message, 
        forceCartridgeId 
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Add system message about cartridge selection
      const systemMessage: Message = {
        id: Date.now(), // Temporary ID
        content: `Selected cartridge: ${data.selection.selectedCartridgeId} (${data.selection.matchScore}% match)`,
        role: "system",
        cartridgeId: data.selection.selectedCartridgeId,
        selectedCartridgeId: data.selection.selectedCartridgeId,
        matchScore: data.selection.matchScore,
        tokenCount: 0,
        cost: "0",
        metadata: {},
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, data.userMessage, systemMessage, data.aiMessage]);
      
      // Invalidate cartridges to refresh active status
      queryClient.invalidateQueries({ queryKey: ["/api/cartridges"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const sendMessage = (message: string, forceCartridgeId?: number) => {
    return sendMessageMutation.mutateAsync({ message, forceCartridgeId });
  };

  return {
    messages,
    sendMessage,
    isLoading: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
  };
}
