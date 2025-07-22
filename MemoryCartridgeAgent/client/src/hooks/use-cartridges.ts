import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Cartridge, InsertCartridge, UpdateCartridge } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useCartridges() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all cartridges
  const { data: cartridges = [], isLoading } = useQuery<Cartridge[]>({
    queryKey: ["/api/cartridges"],
  });

  // Get active cartridge
  const activeCartridge = cartridges.find(c => c.isActive) || null;

  // Create cartridge mutation
  const createCartridgeMutation = useMutation({
    mutationFn: async (cartridge: InsertCartridge): Promise<Cartridge> => {
      const response = await apiRequest("POST", "/api/cartridges", cartridge);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cartridges"] });
      toast({
        title: "Success",
        description: "Cartridge created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create cartridge",
        variant: "destructive",
      });
    },
  });

  // Update cartridge mutation
  const updateCartridgeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateCartridge }): Promise<Cartridge> => {
      const response = await apiRequest("PATCH", `/api/cartridges/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cartridges"] });
      toast({
        title: "Success",
        description: "Cartridge updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update cartridge",
        variant: "destructive",
      });
    },
  });

  // Delete cartridge mutation
  const deleteCartridgeMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiRequest("DELETE", `/api/cartridges/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cartridges"] });
      toast({
        title: "Success",
        description: "Cartridge deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete cartridge",
        variant: "destructive",
      });
    },
  });

  // Activate cartridge mutation
  const activateCartridgeMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiRequest("POST", `/api/cartridges/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cartridges"] });
      toast({
        title: "Success",
        description: "Cartridge activated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate cartridge",
        variant: "destructive",
      });
    },
  });

  return {
    cartridges,
    activeCartridge,
    isLoading,
    createCartridge: createCartridgeMutation.mutateAsync,
    updateCartridge: updateCartridgeMutation.mutateAsync,
    deleteCartridge: deleteCartridgeMutation.mutateAsync,
    activateCartridge: activateCartridgeMutation.mutateAsync,
    isCreating: createCartridgeMutation.isPending,
    isUpdating: updateCartridgeMutation.isPending,
    isDeleting: deleteCartridgeMutation.isPending,
    isActivating: activateCartridgeMutation.isPending,
  };
}
