"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, set } from "date-fns";
import { Submission } from "@/types/types";
import { useWaitForTransactionReceipt } from "wagmi";
import { Upload, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";

interface ModalField {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "checkbox" | "textarea" | "image";
}

interface DynamicModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: any;
  selectedSubmission?: Submission | null;
  initialData?: Record<string, any>;
  onSubmit: (data: any) => Promise<
    | {
        hash?: string;
        error?: string;
      }
    | undefined
  >;
  onConfirmed: () => void;
}

export default function DynamicModal({
  isOpen,
  onClose,
  config,
  selectedSubmission,
  initialData,
  onSubmit,
  onConfirmed,
}: DynamicModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(
    null
  );
  const { toast } = useToast();

  // Add new status
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'confirming' | 'confirmed'>('idle');

  const handleChange = (event: any) => {
    const { name, value, type, checked } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setSubmitStatus('submitting');
    try {
      const result = await onSubmit(formData);
      if (result?.hash) {
        setTransactionHash(result.hash as `0x${string}`);
        setSubmitStatus('confirming');
        toast({
          title: "Transaction Submitted",
          description: "Please wait for confirmation...",
        });
      } else if (result?.error) {
        setSubmitStatus('idle');
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      setSubmitStatus('idle');
      toast({
        title: "Error",
        description: "Failed to submit transaction",
        variant: "destructive",
      });
      console.error("Error submitting form:", error);
    }
  };

  // Use useWaitForTransactionReceipt in the component
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error,
  } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  // Modify useEffect to handle confirmation status
  useEffect(() => {
    if (isConfirmed && submitStatus !== 'confirmed') {
      setSubmitStatus('confirmed');
      toast({
        title: "Success",
        description: "Transaction confirmed successfully!",
      });
      onConfirmed();
      onClose();
    } else if (error && submitStatus !== 'idle') {
      setSubmitStatus('idle');
      toast({
        title: "Error",
        description: "Transaction failed",
        variant: "destructive",
      });
    }
  }, [isConfirmed, error, onClose, onConfirmed, submitStatus, toast]);

  // Handle image upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("https://api.img2ipfs.org/api/v0/add", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        [fieldName]: data.Url,
      }));

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Update form data when the modal is opened or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    } else if (!isOpen) {
      setFormData({}); // Clear form when closing
    }
  }, [isOpen, initialData]);

  // Get button text and status
  const getButtonState = () => {
    switch (submitStatus) {
      case 'submitting':
        return {
          text: "Submitting...",
          disabled: true,
          icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        };
      case 'confirming':
        return {
          text: "Confirming...",
          disabled: true,
          icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        };
      case 'confirmed':
        return {
          text: "Confirmed",
          disabled: true,
          icon: <CheckCircle className="mr-2 h-4 w-4" />
        };
      default:
        return {
          text: "Submit",
          disabled: isUploading,
          icon: null
        };
    }
  };

  const buttonState = getButtonState();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{config.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {config.description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {config.title === "Review Submission" && selectedSubmission && (
            <div className="w-full space-y-2">
              <p className="font-bold text-foreground">Submission Details:</p>
              <div className="mt-2">
                <span className="text-sm font-medium text-muted-foreground">Proof:</span>
                <Textarea
                  value={selectedSubmission.proof}
                  readOnly
                  className="mt-1 resize-none bg-muted/30 border-input"
                  rows={3}
                />
              </div>
            </div>
          )}
          {config.fields.map((field: ModalField) => (
            <div key={field.name} className="space-y-2">
              <label
                htmlFor={field.name}
                className="text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              {field.type === "image" ? (
                <div className="mt-2">
                  <div className="flex items-center gap-4">
                    {formData[field.name] && (
                      <div className="relative w-24 h-24 rounded-lg border border-border overflow-hidden">
                        <Image
                          src={formData[field.name]}
                          alt={field.label}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() =>
                        document.getElementById(`file-${field.name}`)?.click()
                      }
                      className="hover:bg-accent hover:text-accent-foreground"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? "Uploading..." : "Upload Image"}
                    </Button>
                  </div>
                  <input
                    id={`file-${field.name}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, field.name)}
                  />
                </div>
              ) : field.type === "date" ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-medium",
                        "hover:bg-accent hover:text-accent-foreground",
                        !formData[field.name] && "text-muted-foreground"
                      )}
                    >
                      {formData[field.name]
                        ? format(new Date(formData[field.name]), "PPP")
                        : "Select Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border-border">
                    <Calendar
                      mode="single"
                      selected={
                        formData[field.name]
                          ? new Date(formData[field.name])
                          : undefined
                      }
                      onSelect={(date) => {
                        setFormData((prevData) => ({
                          ...prevData,
                          [field.name]: (date as Date).getTime(),
                        }));
                      }}
                      initialFocus
                      className="bg-background"
                    />
                  </PopoverContent>
                </Popover>
              ) : field.type === "textarea" ? (
                <Textarea
                  placeholder={field.label}
                  name={field.name}
                  onChange={handleChange}
                  className="bg-background border-input focus-visible:ring-ring"
                />
              ) : field.type === "checkbox" ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={field.name}
                    name={field.name}
                    checked={formData[field.name] || false}
                    onCheckedChange={(checked: boolean) =>
                      handleChange({
                        target: { name: field.name, type: "checkbox", checked },
                      })
                    }
                    className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor={field.name}
                    className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {field.label}
                  </label>
                </div>
              ) : (
                <Input
                  type={field.type}
                  placeholder={field.label}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  className="bg-background border-input focus-visible:ring-ring"
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={buttonState.disabled}
            className={cn(
              "min-w-[120px] bg-primary text-primary-foreground",
              "hover:bg-primary/90 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="flex items-center">
              {buttonState.icon}
              {buttonState.text}
            </div>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
