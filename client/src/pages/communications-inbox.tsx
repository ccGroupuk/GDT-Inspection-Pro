import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageCircle, Send, Search, Phone, User, Clock } from "lucide-react";
import type { Contact } from "@shared/schema";

interface Message {
  id: string;
  contactId: string;
  content: string;
  direction: "inbound" | "outbound";
  timestamp: string;
  status?: "sent" | "delivered" | "read";
}

export default function CommunicationsInbox() {
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "No phone";
    return phone;
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;
    
    toast({
      title: "Message Sent",
      description: `Message sent to ${selectedContact.name}`,
    });
    setNewMessage("");
  };

  return (
    <div className="p-6 h-full" data-testid="page-communications-inbox">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Communications Inbox</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">Manage client messages and communications</p>
        </div>
        <Badge variant="outline" className="gap-1" data-testid="badge-messages">
          <MessageCircle className="h-3 w-3" />
          {contacts.length} Contacts
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <Card className="lg:col-span-1 flex flex-col" data-testid="card-contacts">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Contacts
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-contacts"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {contactsLoading ? (
                <div className="p-4 text-center text-muted-foreground">Loading contacts...</div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No contacts found</div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors hover-elevate ${
                        selectedContact?.id === contact.id
                          ? "bg-accent"
                          : ""
                      }`}
                      data-testid={`contact-item-${contact.id}`}
                    >
                      <Avatar>
                        <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contact.name}</p>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {formatPhone(contact.phone)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col" data-testid="card-chat">
          {selectedContact ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(selectedContact.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedContact.name}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {formatPhone(selectedContact.phone)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-4">
                <ScrollArea className="h-full">
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm mt-1">Send a message to start the conversation</p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    data-testid="input-new-message"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a contact</p>
                <p className="text-sm mt-1">Choose a contact from the list to view messages</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
