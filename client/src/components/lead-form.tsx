import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertLeadSchema, type Lead, type InsertLead } from "@shared/schema";
import { User, MapPin, Building, MessageSquare } from "lucide-react";
import { useState } from "react";

interface LeadFormProps {
  lead?: Lead | null;
  onClose: () => void;
}

export default function LeadForm({ lead, onClose }: LeadFormProps) {
  const { toast } = useToast();
  const [lastContactedByCount, setLastContactedByCount] = useState(lead?.lastContactedBy?.length || 0);
  const [interestedInCount, setInterestedInCount] = useState(lead?.customerInterestedIn?.length || 0);
  const [notesCount, setNotesCount] = useState(lead?.additionalNotes?.length || 0);
  const [customSourceCount, setCustomSourceCount] = useState(lead?.customLeadSource?.length || 0);

  const form = useForm<InsertLead>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: lead?.name || "",
      phoneNumber: lead?.phoneNumber || "",
      email: lead?.email || "",
      dateOfBirth: lead?.dateOfBirth || "",
      city: lead?.city || "",
      state: lead?.state || "",
      country: lead?.country || "",
      pincode: lead?.pincode || "",
      companyName: lead?.companyName || "",
      designation: lead?.designation || "",
      customerCategory: (lead?.customerCategory as "existing" | "potential") || "potential",
      lastContactedDate: lead?.lastContactedDate || "",
      lastContactedBy: lead?.lastContactedBy || "",
      nextFollowupDate: lead?.nextFollowupDate || "",
      customerInterestedIn: lead?.customerInterestedIn || "",
      preferredCommunicationChannel: (lead?.preferredCommunicationChannel as "email" | "phone" | "whatsapp" | "sms" | "in-person") || undefined,
      leadSource: (lead?.leadSource as "website" | "referral" | "linkedin" | "facebook" | "twitter" | "campaign" | "other") || undefined,
      customLeadSource: lead?.customLeadSource || "",
      leadStatus: (lead?.leadStatus as "new" | "followup" | "qualified" | "hot" | "converted" | "lost") || "new",
      additionalNotes: lead?.additionalNotes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertLead) => apiRequest("POST", "/api/leads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/stats/summary"] });
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create lead",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertLead) => apiRequest("PUT", `/api/leads/${lead?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/stats/summary"] });
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertLead) => {
    if (lead) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle data-testid="form-title">{lead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h4 className="text-md font-semibold text-gray-900">Personal Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Full Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phone Number <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email Address <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-dob" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Address Information Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h4 className="text-md font-semibold text-gray-900">Address Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      City <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} data-testid="input-city" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      State <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter state" {...field} data-testid="input-state" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Country <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter country" {...field} data-testid="input-country" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Pincode <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} data-testid="input-pincode" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Company Information Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Building className="h-5 w-5 text-primary" />
              <h4 className="text-md font-semibold text-gray-900">Company Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} data-testid="input-company" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter designation" {...field} data-testid="input-designation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Customer Category <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-customer-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="existing">Existing Customer</SelectItem>
                        <SelectItem value="potential">Potential Customer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leadStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Lead Status <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-lead-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New Lead</SelectItem>
                        <SelectItem value="followup">Follow-up</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="hot">Hot Lead</SelectItem>
                        <SelectItem value="converted">Converted to Customer</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Communication & Follow-up Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h4 className="text-md font-semibold text-gray-900">Communication & Follow-up</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastContactedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Contacted Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-last-contacted-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastContactedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Contacted By</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter name (max 50 characters)"
                        maxLength={50}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setLastContactedByCount(e.target.value.length);
                        }}
                        data-testid="input-last-contacted-by"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500 mt-1" data-testid="text-last-contacted-by-count">
                      {lastContactedByCount}/50 characters
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextFollowupDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Followup Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-next-followup-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredCommunicationChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Communication Channel</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-communication-channel">
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="in-person">In Person</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-lead-source">
                          <SelectValue placeholder="Select lead source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="campaign">Campaign</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("leadSource") === "other" && (
                <FormField
                  control={form.control}
                  name="customLeadSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Lead Source</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter custom lead source (max 50 characters)"
                          maxLength={50}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setCustomSourceCount(e.target.value.length);
                          }}
                          data-testid="input-custom-lead-source"
                        />
                      </FormControl>
                      <p className="text-sm text-gray-500 mt-1" data-testid="text-custom-source-count">
                        {customSourceCount}/50 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="customerInterestedIn"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Customer Interested in</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Describe customer interests (max 100 characters)"
                        maxLength={100}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setInterestedInCount(e.target.value.length);
                        }}
                        data-testid="input-customer-interested-in"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500 mt-1" data-testid="text-interested-in-count">
                      {interestedInCount}/100 characters
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes (max 100 characters)"
                        maxLength={100}
                        rows={3}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setNotesCount(e.target.value.length);
                        }}
                        data-testid="textarea-additional-notes"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500 mt-1" data-testid="text-notes-count">
                      {notesCount}/100 characters
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-save">
              {isPending ? "Saving..." : lead ? "Update Lead" : "Save Lead"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
