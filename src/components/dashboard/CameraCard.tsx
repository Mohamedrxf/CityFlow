import { useState, useRef, DragEvent } from "react";
import { Upload, X, Camera, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CameraCardProps {
  direction: "North" | "South" | "East" | "West";
  onImageChange?: (file: File | null) => void;
  className?: string;
}

export const CameraCard = ({ direction, onImageChange, className }: CameraCardProps) => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageChange?.(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageChange?.(null);
  };

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "group relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl p-4 transition-all duration-300",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        "hover:scale-[1.02]",
        isDragging && "border-primary ring-2 ring-primary/20 bg-primary/5",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Camera className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">{direction} Camera</h3>
        </div>
        {image && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
            onClick={handleRemove}
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Image Preview or Upload Area */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/30 border border-border/50">
        {preview ? (
          <>
            <img
              src={preview}
              alt={`${direction} camera view`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReplace}
                className="backdrop-blur-sm bg-card/80"
              >
                <Upload className="w-4 h-4 mr-2" />
                Replace
              </Button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground mb-1">
                Drop image here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, WEBP
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        aria-label={`Upload image for ${direction} camera`}
      />

      {/* Status Badge */}
      {image && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {image.name.length > 20 ? `${image.name.substring(0, 20)}...` : image.name}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-success/20 text-success font-medium">
            Active
          </span>
        </div>
      )}
    </div>
  );
};
