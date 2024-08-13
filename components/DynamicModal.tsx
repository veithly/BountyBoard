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

interface ModalField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'textarea';
}

interface DynamicModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: any;
  selectedSubmission?: Submission | null;
  onSubmit: (data: any) => Promise<{
    hash?: string;
    error?: string;
  } | undefined>;
  onConfirmed: () => void;
}

export default function DynamicModal({
  isOpen,
  onClose,
  config,
  selectedSubmission,
  onSubmit,
  onConfirmed,
}: DynamicModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);

  const handleChange = (event: any) => {
    const { name, value, type, checked } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result: any = await onSubmit(formData);
      result?.hash && setTransactionHash(result.hash); // 保存交易哈希值
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error submitting form:', error);
    }
  };

  // 在组件中使用 useWaitForTransactionReceipt
  const { isLoading: isConfirming, isSuccess: isConfirmed, error } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  // 在确认或错误发生时关闭模态框
  useEffect(() => {
    if (isConfirmed || error) {
      setIsSubmitting(false);
      onConfirmed();
      onClose();
    }
  }, [isConfirmed, error, onClose, onConfirmed]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {config.title === "Review Submission" && selectedSubmission && (
            <div>
              <p className="font-bold">Submission Details:</p>
              <p>Proof: {selectedSubmission.proof}</p>
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
              {field.type === "date" ? (
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
              )  : field.type === 'textarea' ? (
                <Textarea
                  placeholder={field.label}
                  name={field.name}
                  onChange={handleChange}
                  className="mt-2"
                />
              ) : field.type === 'checkbox' ? (
                <Checkbox
                  id={field.name}
                  name={field.name}
                  checked={formData[field.name] || false} // 设置默认值为 false
                  onCheckedChange={(checked: boolean) => handleChange({ target: { name: field.name, type: 'checkbox', checked } })}
                >
                  {field.label}
                </Checkbox>
              ) : (
                <Input
                  type={field.type}
                  placeholder={field.label}
                  name={field.name}
                  onChange={handleChange}
                  className="mt-2"
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
