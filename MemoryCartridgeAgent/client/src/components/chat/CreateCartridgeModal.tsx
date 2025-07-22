import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCartridges } from "@/hooks/use-cartridges";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, FileCode, File } from "lucide-react";
import yaml from "js-yaml";

interface CreateCartridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCartridgeModal({ isOpen, onClose }: CreateCartridgeModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const { createCartridge } = useCartridges();
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    
    try {
      const text = await file.text();
      let parsedContent;
      
      if (file.name.endsWith('.json')) {
        parsedContent = JSON.parse(text);
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        parsedContent = yaml.load(text);
      } else if (file.name.endsWith('.txt')) {
        // For text files, create a basic structure
        parsedContent = {
          name: file.name.replace('.txt', ''),
          description: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
          content: text
        };
      } else {
        throw new Error('Unsupported file type');
      }

      setFileContent(parsedContent);
      
      // Auto-populate name and description if available
      if (parsedContent.name) setName(parsedContent.name);
      if (parsedContent.description) setDescription(parsedContent.description);
      
      toast({
        title: "Success",
        description: `File "${file.name}" uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse file. Please check the format.",
        variant: "destructive",
      });
      setUploadedFile(null);
      setFileContent(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let cartridgeData;
      
      if (fileContent) {
        // Use uploaded file content
        cartridgeData = {
          name: name.trim(),
          description: description.trim(),
          episodicMemory: fileContent.episodicMemory || { conversations: [] },
          semanticMemory: fileContent.semanticMemory || { concepts: {} },
          proceduralMemory: fileContent.proceduralMemory || { workflows: [] },
          metadata: {
            version: fileContent.metadata?.version || "1.0.0",
            sizeMb: fileContent.metadata?.sizeMb || 0.1,
            nodeCount: fileContent.metadata?.nodeCount || 0,
            tags: fileContent.metadata?.tags || [],
          },
          isActive: false,
        };
      } else {
        // Default empty cartridge
        cartridgeData = {
          name: name.trim(),
          description: description.trim(),
          episodicMemory: { conversations: [] },
          semanticMemory: { concepts: {} },
          proceduralMemory: { workflows: [] },
          metadata: {
            version: "1.0.0",
            sizeMb: 0.1,
            nodeCount: 0,
            tags: [],
          },
          isActive: false,
        };
      }

      await createCartridge(cartridgeData);

      toast({
        title: "Success",
        description: "Cartridge created successfully",
      });

      setName("");
      setDescription("");
      setUploadedFile(null);
      setFileContent(null);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create cartridge",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setUploadedFile(null);
    setFileContent(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Create New Cartridge
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Section */}
          <div>
            <Label className="text-sm font-medium text-slate-200">
              Import Memory Data (Optional)
            </Label>
            <div className="mt-2">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700 hover:bg-slate-600 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-slate-400" />
                    <p className="mb-2 text-sm text-slate-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">JSON, YAML, or TXT files</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".json,.yaml,.yml,.txt"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </label>
              </div>
              {uploadedFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                  {uploadedFile.name.endsWith('.json') && <FileCode className="w-4 h-4" />}
                  {(uploadedFile.name.endsWith('.yaml') || uploadedFile.name.endsWith('.yml')) && <FileText className="w-4 h-4" />}
                  {uploadedFile.name.endsWith('.txt') && <File className="w-4 h-4" />}
                  <span>{uploadedFile.name}</span>
                </div>
              )}
            </div>
          </div>

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
              placeholder="Describe what this cartridge will contain..."
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
              {isLoading ? "Creating..." : "Create Cartridge"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
