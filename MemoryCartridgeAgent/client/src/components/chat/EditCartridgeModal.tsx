import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCartridges } from "@/hooks/use-cartridges";
import { useToast } from "@/hooks/use-toast";
import { Cartridge } from "@shared/schema";

interface EditCartridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: Cartridge | null;
}

export function EditCartridgeModal({ isOpen, onClose, cartridge }: EditCartridgeModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { updateCartridge } = useCartridges();
  const { toast } = useToast();

  useEffect(() => {
    if (cartridge) {
      setName(cartridge.name);
      setDescription(cartridge.description);
    }
  }, [cartridge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartridge || !name.trim() || !description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateCartridge({
        id: cartridge.id,
        updates: {
          name: name.trim(),
          description: description.trim(),
        },
      });

      toast({
        title: "Success",
        description: "Cartridge updated successfully",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cartridge",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Edit Cartridge
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-slate-200">
              Cartridge Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Web Development"
              className="bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-primary focus:ring-primary/20"
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-slate-200">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this cartridge contains..."
              rows={3}
              className="bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-primary focus:ring-primary/20"
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-blue-700 text-white"
            >
              {isLoading ? "Updating..." : "Update Cartridge"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}