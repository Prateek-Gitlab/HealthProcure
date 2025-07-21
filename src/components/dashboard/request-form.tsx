
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  procurementCategories,
  getItemsForCategory,
  type ProcurementCategory,
} from "@/lib/data";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { MultiSelectItem } from "./multi-select-item";

interface RequestFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onItemsSelected: (items: string[], category: ProcurementCategory) => void;
}

const formSchema = z.object({
  category: z.enum(procurementCategories, {
    required_error: "Please select a category.",
  }),
  items: z.array(z.string()).min(1, "Please select at least one item."),
});

export function RequestForm({
  isOpen,
  onOpenChange,
  onItemsSelected,
}: RequestFormProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<ProcurementCategory | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [],
    },
  });

  function handleFormSubmit(values: z.infer<typeof formSchema>) {
    onItemsSelected(values.items, values.category);
    form.reset();
    setSelectedCategory(null);
    onOpenChange(false);
  }

  const handleCategoryChange = (value: string) => {
    const category = value as ProcurementCategory;
    setSelectedCategory(category);
    form.setValue("category", category);
    form.setValue("items", []); // Reset items when category changes
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
          setSelectedCategory(null);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Items to Request</DialogTitle>
          <DialogDescription>
            Select a category, then choose one or more items to add to your new
            request list.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={handleCategoryChange}
                    defaultValue={field.value}
                  >
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
              name="items"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Items</FormLabel>
                  <MultiSelectItem
                    options={
                      selectedCategory
                        ? getItemsForCategory(selectedCategory)
                        : []
                    }
                    selected={field.value}
                    onChange={field.onChange}
                    disabled={!selectedCategory}
                    placeholder={
                      selectedCategory
                        ? "Select items..."
                        : "Select a category first"
                    }
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Selected Items</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
