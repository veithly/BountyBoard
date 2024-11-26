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

  // 添加新的状态
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

  // 在组件中使用 useWaitForTransactionReceipt
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error,
  } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  // 修改 useEffect 处理确认状态
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

  // 处理图片上传
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

  // 当 modal 打开或 initialData 变化时，更新表单数据
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    } else if (!isOpen) {
      setFormData({}); // 关闭时清空表单
    }
  }, [isOpen, initialData]);

  // 获取按钮文本和状态
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {config.title === "Review Submission" && selectedSubmission && (
            <div className="w-full">
              <p className="font-bold">Submission Details:</p>
              <p className="mt-2">
                <span className="font-semibold">Proof:</span>
                <Textarea
                  value={selectedSubmission.proof}
                  readOnly
                  className="mt-1 resize-none bg-gray-50"
                  rows={3}
                />
              </p>
            </div>
          )}
          {config.fields.map((field: ModalField) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                {field.label}
              </label>
              {field.type === "image" ? (
                <div className="mt-2">
                  <div className="flex items-center gap-4">
                    {formData[field.name] && (
                      <Image
                        src={formData[field.name]}
                        alt={field.label}
                        width={100}
                        height={100}
                      />
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() =>
                        document.getElementById(`file-${field.name}`)?.click()
                      }
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
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-medium",
                        !formData[field.name] && "text-muted-foreground"
                      )}
                    >
                      {formData[field.name]
                        ? format(new Date(formData[field.name]), "PPP")
                        : "Select Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
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
                    />
                  </PopoverContent>
                </Popover>
              ) : field.type === "textarea" ? (
                <Textarea
                  placeholder={field.label}
                  name={field.name}
                  onChange={handleChange}
                  className="mt-2"
                />
              ) : field.type === "checkbox" ? (
                <Checkbox
                  id={field.name}
                  name={field.name}
                  checked={formData[field.name] || false} // 设置默认值为 false
                  onCheckedChange={(checked: boolean) =>
                    handleChange({
                      target: { name: field.name, type: "checkbox", checked },
                    })
                  }
                >
                  {field.label}
                </Checkbox>
              ) : (
                <Input
                  type={field.type}
                  placeholder={field.label}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  className="mt-2"
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
            className="min-w-[120px]" // 确保按钮宽度一致
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
