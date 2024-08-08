// components/DynamicModal.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DynamicModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: {
    title: string;
    description: string;
    fields: { name: string; label: string; type: string }[];
  };
  boardId: string;
  bountyId?: string;
  selectedBounty?: any;
  onSubmit: (data: any) => void; // Function to handle form submission
}

export default function DynamicModal({ isOpen, onClose, config, boardId, bountyId, selectedBounty, onSubmit }: DynamicModalProps) {
  const [formData, setFormData] = useState({});

  const handleChange = (event: any) => {
    const { name, value, type, checked } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
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
        <form onSubmit={handleSubmit} className="grid gap-4 py-4"> {/* Wrap fields in a form */}
          {config.fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium leading-6 text-gray-900">
                {field.label}
              </label>
              {field.type === 'date' ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[240px] justify-start text-left font-medium',
                        !formData[field.name] && 'text-muted-foreground'
                      )}
                    >
                      {formData[field.name]
                        ? format(new Date(formData[field.name]), 'PPP')
                        : 'Select Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData[field.name] ? new Date(formData[field.name]) : undefined}
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
                  value={formData[field.name] || ''} // Set value for controlled input
                  onChange={handleChange}
                />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="submit">Submit</Button> {/* Submit button within the form */}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
