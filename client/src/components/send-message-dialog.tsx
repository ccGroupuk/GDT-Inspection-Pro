import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageSquare, AlertTriangle, Gift, Megaphone, Tag } from "lucide-react";
import { MESSAGE_TYPES, MESSAGE_URGENCY } from "@shared/schema";

const messageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Message is required"),
  messageType: z.string().default("announcement"),
  urgency: z.string().default("normal"),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface SendMessageDialogProps {
  recipientId: string;
  recipientName: string;
  recipientType: "client" | "partner";
  trigger?: React.ReactNode;
}

const messageTypeIcons: Record<string, React.ReactNode> = {
  warning: <AlertTriangle className="w-4 h-4" />,
  announcement: <Megaphone className="w-4 h-4" />,
  birthday: <Gift className="w-4 h-4" />,
  sales: <Tag className="w-4 h-4" />,
  custom: <MessageSquare className="w-4 h-4" />,
};

const quickTemplates = [
  { type: "birthday", title: "Happy Birthday!", body: "Wishing you a wonderful birthday from the CCC Group team! We hope you have a fantastic day." },
  { type: "sales", title: "Special Offer", body: "As a valued customer, we're pleased to offer you an exclusive discount on your next project. Contact us to learn more!" },
  { type: "warning", title: "Important Notice", body: "We need to bring something important to your attention. Please get in touch with us at your earliest convenience." },
  { type: "announcement", title: "Quick Update", body: "We wanted to share some exciting news with you about your project." },
];

export function SendMessageDialog({ recipientId, recipientName, recipientType, trigger }: SendMessageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      title: "",
      body: "",
      messageType: "announcement",
      urgency: "normal",
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const endpoint = recipientType === "client" 
        ? `/api/contacts/${recipientId}/messages`
        : `/api/partners/${recipientId}/messages`;
      return apiRequest("POST", endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: `Your message has been sent to ${recipientName}.`,
      });
      setIsOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/${recipientType === "client" ? "contacts" : "partners"}/${recipientId}/messages`] });
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MessageFormData) => {
    sendMutation.mutate(data);
  };

  const applyTemplate = (template: typeof quickTemplates[0]) => {
    form.setValue("title", template.title);
    form.setValue("body", template.body);
    form.setValue("messageType", template.type);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" data-testid={`button-send-message-${recipientId}`}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Message to {recipientName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {quickTemplates.map((template) => (
                <Button
                  key={template.type}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => applyTemplate(template)}
                  data-testid={`button-template-${template.type}`}
                >
                  {messageTypeIcons[template.type]}
                  <span className="ml-1">{MESSAGE_TYPES.find(t => t.value === template.type)?.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="messageType">Type</Label>
                <Select
                  value={form.watch("messageType")}
                  onValueChange={(val) => form.setValue("messageType", val)}
                >
                  <SelectTrigger data-testid="select-message-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {messageTypeIcons[type.value]}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="urgency">Urgency</Label>
                <Select
                  value={form.watch("urgency")}
                  onValueChange={(val) => form.setValue("urgency", val)}
                >
                  <SelectTrigger data-testid="select-message-urgency">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_URGENCY.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Message title"
                data-testid="input-message-title"
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                {...form.register("body")}
                placeholder="Write your message here..."
                rows={4}
                data-testid="input-message-body"
              />
              {form.formState.errors.body && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.body.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                data-testid="button-cancel-message"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendMutation.isPending}
                data-testid="button-submit-message"
              >
                {sendMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
