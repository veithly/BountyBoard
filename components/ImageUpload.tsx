import { Button } from "./ui/button";
import { Upload, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "./ui/use-toast";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export default function ImageUpload({ value, onChange, label, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      if (Math.abs(img.width - img.height) > 100) {
        toast({
          title: "Warning",
          description: "Please upload a square image for best results",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("https://api.img2ipfs.org/api/v0/add", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        onChange(data.Url);
        toast({
          title: "Success",
          description: "Logo uploaded successfully"
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Error",
          description: "Failed to upload logo",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };

    img.src = objectUrl;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const input = document.getElementById('image-upload') as HTMLInputElement;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleImageUpload({ target: { files: dataTransfer.files } } as any);
      }
    }
  };

  return (
    <div className={className}>
      <AnimatePresence>
        <motion.div
          className={`relative aspect-square rounded-2xl overflow-hidden transition-all duration-300
            ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-purple-500/30 bg-black/20'}
            border-2 border-dashed backdrop-blur-sm
            hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {value ? (
            <div className="relative group aspect-square">
              <Image
                src={value}
                alt={label || "Board logo"}
                fill
                className="object-cover p-2"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <p className="text-sm text-white/80">Click to change logo</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-white border-white hover:bg-white/20"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change Logo
                </Button>
              </div>
            </div>
          ) : (
            <div className="aspect-square flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-purple-300 font-medium mb-2">
                {isUploading ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  "Drop your logo here"
                )}
              </p>
              <p className="text-purple-400/60 text-sm mb-4">
                Recommended: Square image (1:1 ratio)
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => document.getElementById('image-upload')?.click()}
                className="bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Logo
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}