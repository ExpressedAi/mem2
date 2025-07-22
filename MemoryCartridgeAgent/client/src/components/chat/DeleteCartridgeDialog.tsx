import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCartridges } from "@/hooks/use-cartridges";
import { useToast } from "@/hooks/use-toast";
import { Cartridge } from "@shared/schema";
import { useState } from "react";

interface DeleteCartridgeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: Cartridge | null;
}

export function DeleteCartridgeDialog({ isOpen, onClose, cartridge }: DeleteCartridgeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteCartridge } = useCartridges();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!cartridge) return;

    setIsDeleting(true);
    try {
      await deleteCartridge(cartridge.id);
      toast({
        title: "Success",
        description: "Cartridge deleted successfully",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete cartridge",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-slate-800 border-slate-700 text-slate-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Delete Cartridge
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            Are you sure you want to delete "{cartridge?.name}"? This action cannot be undone.
            All memory data in this cartridge will be permanently lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-300 border-slate-600"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}