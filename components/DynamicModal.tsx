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
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Submission } from "@/types/types";

interface DynamicModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: any;
  selectedSubmission?: Submission | null;
  onSubmit: (data: any) => void;
}

export default function DynamicModal({
  isOpen,
  onClose,
  config,
  selectedSubmission,
  onSubmit,
}: DynamicModalProps) {
  const [formData, setFormData] = useState({});

  const handleChange = (event: any) => {
    const { name, value, type, checked } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    await onSubmit(formData); // Call the onSubmit function from props
  };

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
          {config.fields.map((field) => (
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
                          [field.name]: date.getTime(),
                        }));
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <Input
                  type={field.type}
                  placeholder={field.label}
                  name={field.name}
                  onChange={handleChange}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
