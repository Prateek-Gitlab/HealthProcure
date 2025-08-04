
"use client";

import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ProcurementRequest, User } from '@/lib/data';
import { useAuth } from '@/contexts/auth-context';
import { useHierarchy } from '@/hooks/use-hierarchy';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download } from 'lucide-react';
import { generateRequestsPdf } from '@/lib/pdf-generator';

interface PdfDownloadDialogProps {
  allRequests: ProcurementRequest[];
}

const formSchema = z.object({
  selectedUsers: z.array(z.string()).refine(value => value.length > 0, {
    message: "Please select at least one facility to generate a report.",
  }),
});

export function PdfDownloadDialog({ allRequests }: PdfDownloadDialogProps) {
  const { user, allUsers } = useAuth();
  const { getDirectSubordinates } = useHierarchy();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedUsers: [],
    },
  });

  const subordinateUsers = useMemo(() => {
    if (!user) return [];
    return getDirectSubordinates(user.id).filter(u => u.role === 'base');
  }, [user, getDirectSubordinates]);

  const handleDownload = (values: z.infer<typeof formSchema>) => {
    const { selectedUsers } = values;
    
    const requestsToDownload = allRequests.filter(req => selectedUsers.includes(req.submittedBy));
    const totalBudget = requestsToDownload
        .filter(req => req.status === 'Approved')
        .reduce((sum, req) => sum + ((req.pricePerUnit || 0) * req.quantity), 0);

    let reportTitle = user?.name || "Taluka Report";
    if (selectedUsers.length === 1) {
        const selectedUserName = subordinateUsers.find(u => u.id === selectedUsers[0])?.name;
        reportTitle = selectedUserName || reportTitle;
    } else if (selectedUsers.length < subordinateUsers.length) {
        reportTitle += ` (Partial Report)`;
    }

    generateRequestsPdf(requestsToDownload, totalBudget, allUsers, reportTitle);
    
    setIsOpen(false);
    form.reset();
  };

  if (user?.role !== 'taluka') return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download PDF Report</DialogTitle>
          <DialogDescription>
            Select the facilities to include in the PDF report.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleDownload)} className="space-y-4">
            <FormField
                control={form.control}
                name="selectedUsers"
                render={() => (
                    <FormItem>
                        <div className="mb-4">
                            <FormLabel className="text-base">Base-Level Facilities</FormLabel>
                        </div>
                        <ScrollArea className="h-40 w-full rounded-md border p-4">
                            {subordinateUsers.map((item) => (
                                <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="selectedUsers"
                                    render={({ field }) => {
                                    return (
                                        <FormItem
                                            key={item.id}
                                            className="flex flex-row items-start space-x-3 space-y-0 mb-4"
                                        >
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                        return checked
                                                        ? field.onChange([...(field.value || []), item.id])
                                                        : field.onChange(
                                                            field.value?.filter(
                                                                (value) => value !== item.id
                                                            )
                                                            );
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                {item.name}
                                            </FormLabel>
                                        </FormItem>
                                    );
                                    }}
                                />
                            ))}
                        </ScrollArea>
                    </FormItem>
                )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">Download</Button>
            </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
