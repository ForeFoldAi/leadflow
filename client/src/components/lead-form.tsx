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
import { ButtonLoader } from "@/components/ui/loader";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertLeadSchema, type Lead, type InsertLead } from "./shared/schema";
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
  const [customReferralCount, setCustomReferralCount] = useState(lead?.customReferralSource?.length || 0);
  const [customGeneratedByCount, setCustomGeneratedByCount] = useState(lead?.customGeneratedBy?.length || 0);
  const [customCommChannelCount, setCustomCommChannelCount] = useState(lead?.customCommunicationChannel?.length || 0);
  const [leadCreatedByCount, setLeadCreatedByCount] = useState(lead?.leadCreatedBy?.length || 0);

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
      preferredCommunicationChannel: (lead?.preferredCommunicationChannel as "email" | "phone" | "whatsapp" | "sms" | "in-person" | "linkedin" | "other") || undefined,
      customCommunicationChannel: lead?.customCommunicationChannel || "",
      leadSource: (lead?.leadSource as "website" | "referral" | "linkedin" | "facebook" | "twitter" | "campaign" | "instagram" | "generated_by" | "on_field" | "other") || undefined,
      customLeadSource: lead?.customLeadSource || "",
      customReferralSource: lead?.customReferralSource || "",
      customGeneratedBy: lead?.customGeneratedBy || "",
      leadStatus: (lead?.leadStatus as "new" | "followup" | "qualified" | "hot" | "converted" | "lost") || "new",
      leadCreatedBy: lead?.leadCreatedBy || "",
      additionalNotes: lead?.additionalNotes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertLead) => apiRequest("POST", "/api/leads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/stats/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.refetchQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead Added Successfully",
        description: "The new lead has been saved to your database.",
      });
      onClose();
    },
    onError: (error: any) => {
      let errorMessage = "We couldn't save this lead. Please check your information and try again.";
      
      // Extract user-friendly message from error response
      if (error?.message) {
        // Remove HTTP status codes and technical details
        let message = error.message.replace(/^\d+:\s*/, ''); // Remove status codes like "400: "
        
        // Remove JSON formatting if present
        if (message.includes('{"error":') || message.includes('{"message":')) {
          try {
            const parsed = JSON.parse(message);
            message = parsed.error || parsed.message || message;
          } catch {
            // If JSON parsing fails, use the original message
          }
        }
        
        if (!message.includes('Failed to fetch') && !message.includes('NetworkError')) {
          errorMessage = message;
        }
      }
      
      toast({
        title: "Unable to Save Lead",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertLead) => apiRequest("PUT", `/api/leads/${lead?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/stats/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.refetchQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead Updated Successfully",
        description: "The lead information has been updated in your database.",
      });
      onClose();
    },
    onError: (error: any) => {
      let errorMessage = "We couldn't update this lead. Please check your information and try again.";
      
      // Extract user-friendly message from error response
      if (error?.message) {
        // Remove HTTP status codes and technical details
        let message = error.message.replace(/^\d+:\s*/, ''); // Remove status codes like "400: "
        
        // Remove JSON formatting if present
        if (message.includes('{"error":') || message.includes('{"message":')) {
          try {
            const parsed = JSON.parse(message);
            message = parsed.error || parsed.message || message;
          } catch {
            // If JSON parsing fails, use the original message
          }
        }
        
        if (!message.includes('Failed to fetch') && !message.includes('NetworkError')) {
          errorMessage = message;
        }
      }
      
      toast({
        title: "Unable to Update Lead",
        description: errorMessage,
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
      <DialogHeader className="flex flex-row items-center justify-between">
        <DialogTitle data-testid="form-title">{lead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
        <div className="flex space-x-2 mr-8">
          <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel" size="sm">
            Cancel
          </Button>
          <Button type="submit" form="lead-form" disabled={isPending} data-testid="button-save" size="sm">
            {isPending ? (
              <div className="flex items-center">
                <ButtonLoader size={14} color="#ffffff" />
                <span className="ml-2">Saving...</span>
              </div>
            ) : (
              lead ? "Update Lead" : "Save Lead"
            )}
          </Button>
        </div>
      </DialogHeader>

      <Form {...form}>
        <form id="lead-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {/* Personal Information Section */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-gray-900">Personal Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
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
                    <FormLabel className="text-xs">
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
                    <FormLabel className="text-xs">Email Address</FormLabel>
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
                    <FormLabel className="text-xs">Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-dob" />
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
                    <FormLabel className="text-xs">
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
                    <FormLabel className="text-xs">
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

              <FormField
                control={form.control}
                name="leadCreatedBy"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs">Lead Created By</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter creator name (max 50 characters)"
                        maxLength={50}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setLeadCreatedByCount(e.target.value.length);
                        }}
                        data-testid="input-lead-created-by"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-0.5" data-testid="text-lead-created-by-count">
                      {leadCreatedByCount}/50 characters
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator className="my-2" />

          {/* Address Information Section */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-gray-900">Address Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">City</FormLabel>
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
                    <FormLabel className="text-xs">State</FormLabel>
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
                    <FormLabel className="text-xs">Country</FormLabel>
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
                    <FormLabel className="text-xs">Pincode/Zipcode</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} data-testid="input-pincode" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator className="my-2" />

          {/* Company Information Section */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Building className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-gray-900">Company Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Company Name</FormLabel>
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
                    <FormLabel className="text-xs">Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter designation" {...field} data-testid="input-designation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerInterestedIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Customer Interested in</FormLabel>
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
                    <p className="text-xs text-gray-500 mt-0.5" data-testid="text-interested-in-count">
                      {interestedInCount}/100 characters
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator className="my-2" />

          {/* Communication & Follow-up Section */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-gray-900">Communication & Follow-up</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <FormField
                control={form.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Lead Source <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-lead-source">
                          <SelectValue placeholder="Select lead source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="website">Website/Internet</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="campaign">Campaign/Roadshow</SelectItem>
                        <SelectItem value="generated_by">Generated By</SelectItem>
                        <SelectItem value="on_field">On Field</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredCommunicationChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Preferred Communication Channel</FormLabel>
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
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastContactedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Last Contacted Date</FormLabel>
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
                    <FormLabel className="text-xs">Last Contacted By</FormLabel>
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
                    <p className="text-xs text-gray-500 mt-0.5" data-testid="text-last-contacted-by-count">
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
                    <FormLabel className="text-xs">Next Followup Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-next-followup-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Lead Source Fields */}
              {form.watch("leadSource") === "other" && (
                <FormField
                  control={form.control}
                  name="customLeadSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Custom Lead Source</FormLabel>
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
                      <p className="text-xs text-gray-500 mt-0.5" data-testid="text-custom-source-count">
                        {customSourceCount}/50 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("leadSource") === "referral" && (
                <FormField
                  control={form.control}
                  name="customReferralSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Referral Source</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter referral source (max 50 characters)"
                          maxLength={50}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setCustomReferralCount(e.target.value.length);
                          }}
                          data-testid="input-custom-referral-source"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-0.5" data-testid="text-custom-referral-count">
                        {customReferralCount}/50 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("leadSource") === "generated_by" && (
                <FormField
                  control={form.control}
                  name="customGeneratedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Generated By</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter generated by (max 50 characters)"
                          maxLength={50}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setCustomGeneratedByCount(e.target.value.length);
                          }}
                          data-testid="input-custom-generated-by"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-0.5" data-testid="text-custom-generated-by-count">
                        {customGeneratedByCount}/50 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("preferredCommunicationChannel") === "other" && (
                <FormField
                  control={form.control}
                  name="customCommunicationChannel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Custom Communication Channel</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter custom channel (max 50 characters)"
                          maxLength={50}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setCustomCommChannelCount(e.target.value.length);
                          }}
                          data-testid="input-custom-communication-channel"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-0.5" data-testid="text-custom-comm-channel-count">
                        {customCommChannelCount}/50 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel className="text-xs">Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes (max 100 characters)"
                        maxLength={100}
                        rows={1}
                        className="min-h-[32px] resize-none"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setNotesCount(e.target.value.length);
                        }}
                        data-testid="textarea-additional-notes"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-0.5" data-testid="text-notes-count">
                      {notesCount}/100 characters
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
