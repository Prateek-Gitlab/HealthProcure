"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/contexts/auth-context";
import { type ProcurementRequest, procurementCategories, getItemsForCategory, type ProcurementCategory } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface RequestFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onNewRequest: (request: Omit<ProcurementRequest, 'id' | 'createdAt' | 'auditLog' | 'status' | 'submittedBy'>) => Promise<void>;
}

const formSchema = z.object({
  category: z.enum(procurementCategories, { required_error: "Please select a category." }),
  itemName: z.string().min(1, "Please select an item."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  justification: z.string().min(10, "Justification must be at least 10 characters.").max(500),
});

export function RequestForm({ isOpen, onOpenChange, onNewRequest }: RequestFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<ProcurementCategory | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: "",
      quantity: 1,
      justification: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to submit a request.", variant: "destructive" });
        return;
    }

    await onNewRequest(values);
    
    toast({
        title: "Request Submitted",
        description: `Your request for ${values.quantity}x ${values.itemName} has been submitted for approval.`,
    });
    form.reset();
    setSelectedCategory(null);
    onOpenChange(false);
  }

  const handleCategoryChange = (value: string) => {
    const category = value as ProcurementCategory;
    setSelectedCategory(category);
    form.setValue('category', category);
    form.setValue('itemName', ''); // Reset item when category changes
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset();
        setSelectedCategory(null);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Procurement Request</DialogTitle>
          <DialogDescription>
            Fill out the details below to request medical supplies, personnel, or other items.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={handleCategoryChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a request category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {procurementCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedCategory ? "Select an item" : "Select a category first"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedCategory && getItemsForCategory(selectedCategory).map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justification</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this request is necessary..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
