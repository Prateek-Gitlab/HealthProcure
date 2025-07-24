
"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  procurementCategories,
  categorizedItems,
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
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RequestFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onItemsSelected: (items: string[], category: ProcurementCategory) => void;
}

const formSchema = z.object({
  items: z.array(z.string()).min(1, "Please select at least one item."),
});

type ItemWithCategory = {
  name: string;
  category: ProcurementCategory;
};

export function RequestForm({
  isOpen,
  onOpenChange,
  onItemsSelected,
}: RequestFormProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [],
    },
  });

  const allItemsWithCategory = useMemo(() => {
    return procurementCategories.flatMap((category) =>
      categorizedItems[category].map((name) => ({ name, category }))
    );
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchTerm) {
      return categorizedItems;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    const result: { [key in ProcurementCategory]?: string[] } = {};

    for (const category of procurementCategories) {
      const matchingItems = categorizedItems[category].filter((item) =>
        item.toLowerCase().includes(lowercasedTerm)
      );
      if (matchingItems.length > 0) {
        result[category] = matchingItems;
      }
    }
    return result;
  }, [searchTerm]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    // This logic needs to be smarter; it should group by category
    const selectedItemsMap: { [key in ProcurementCategory]?: string[] } = {};

    values.items.forEach(itemName => {
      const item = allItemsWithCategory.find(i => i.name === itemName);
      if (item) {
        if (!selectedItemsMap[item.category]) {
            selectedItemsMap[item.category] = [];
        }
        selectedItemsMap[item.category]!.push(item.name);
      }
    });

    // Call onItemsSelected for each category
    for (const category in selectedItemsMap) {
        onItemsSelected(selectedItemsMap[category as ProcurementCategory]!, category as ProcurementCategory);
    }
    
    form.reset();
    setSearchTerm("");
    onOpenChange(false);
  };

  const onDialogChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setSearchTerm("");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onDialogChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Items to Request</DialogTitle>
          <DialogDescription>
            Select one or more items from the list below to add to your new request list.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <Input 
                placeholder="Search for an item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-72 w-full rounded-md border p-4">
              <FormField
                control={form.control}
                name="items"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    {Object.entries(filteredItems).map(([category, items]) => (
                      <div key={category}>
                        <FormLabel className="text-base font-semibold">{category}</FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {items.map((item) => (
                          <FormField
                            key={item}
                            control={form.control}
                            name="items"
                            render={({ field: itemField }) => {
                              return (
                                <FormItem
                                  key={item}
                                  className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={itemField.value?.includes(item)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? itemField.onChange([
                                              ...(itemField.value || []),
                                              item,
                                            ])
                                          : itemField.onChange(
                                            itemField.value?.filter(
                                                (value) => value !== item
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                        </div>
                      </div>
                    ))}
                  </FormItem>
                )}
              />
            </ScrollArea>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onDialogChange(false)}
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
