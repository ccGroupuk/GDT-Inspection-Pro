import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { 
  MessageSquare, 
  CheckSquare, 
  ClipboardCheck, 
  Activity,
  Send,
  User,
  Briefcase,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Circle,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import type { Employee, Task, InternalMessage, TeamActivityLog, ChecklistInstance } from "@shared/schema";

interface ConversationSummary {
  partnerId: string;
  partnerName: string;
  partnerInitials: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export default function CommunicationsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("messages");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: dashboardData, isLoading } = useQuery<{
    currentEmployeeId: string;
    messages: InternalMessage[];
    unreadCount: number;
    recentActivity: TeamActivityLog[];
    myTasks: Task[];
    myChecklists: ChecklistInstance[];
  }>({
    queryKey: ["/api/communications/dashboard"],
  });
  
  const currentEmployeeId = dashboardData?.currentEmployeeId;

  const { data: conversation } = useQuery<InternalMessage[]>({
    queryKey: ["/api/messages/conversation", selectedConversation],
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { recipientId: string; content: string }) =>
      apiRequest("POST", "/api/messages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communications/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversation", selectedConversation] });
      setNewMessage("");
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const messages = dashboardData?.messages || [];
  const myTasks = dashboardData?.myTasks || [];
  const myChecklists = dashboardData?.myChecklists || [];
  const recentActivity = dashboardData?.recentActivity || [];
  const unreadCount = dashboardData?.unreadCount || 0;

  const getConversationSummaries = (): ConversationSummary[] => {
    if (!currentEmployeeId) return [];
    
    const conversationMap = new Map<string, ConversationSummary>();
    
    messages.forEach(msg => {
      // Determine the "other person" in the conversation
      const isFromMe = msg.senderId === currentEmployeeId;
      const otherPersonId = isFromMe ? msg.recipientId : msg.senderId;
      
      // Skip if other person is somehow the current user
      if (otherPersonId === currentEmployeeId) return;
      
      const otherPerson = employees?.find(e => e.id === otherPersonId);
      if (!otherPerson) return;
      
      const fullName = `${otherPerson.firstName} ${otherPerson.lastName}`;
      const existingEntry = conversationMap.get(otherPersonId);
      
      // Check if this is a newer message than what we have
      const msgTime = new Date(msg.createdAt!);
      const existingTime = existingEntry?.lastMessageTime;
      
      // Calculate if this message is unread (I'm the recipient and it's not read)
      const isUnreadForMe = !isFromMe && !msg.isRead;
      
      if (!existingEntry || msgTime > existingTime!) {
        conversationMap.set(otherPersonId, {
          partnerId: otherPersonId,
          partnerName: fullName,
          partnerInitials: `${otherPerson.firstName[0]}${otherPerson.lastName[0]}`.toUpperCase(),
          lastMessage: msg.content,
          lastMessageTime: msgTime,
          unreadCount: (existingEntry?.unreadCount || 0) + (isUnreadForMe ? 1 : 0),
        });
      } else if (isUnreadForMe) {
        // Just increment unread count for older unread messages
        existingEntry.unreadCount++;
      }
    });
    
    return Array.from(conversationMap.values())
      .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
  };

  const conversationSummaries = getConversationSummaries();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({
      recipientId: selectedConversation,
      content: newMessage.trim(),
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "task_assigned": return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case "checklist_completed": return <ClipboardCheck className="h-4 w-4 text-green-500" />;
      case "job_stage_changed": return <Briefcase className="h-4 w-4 text-orange-500" />;
      case "message_sent": return <MessageCircle className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-orange-500";
      default: return "text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading communications...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Team Hub
          </h1>
          <p className="text-muted-foreground">
            Messages, tasks, and team activity in one place
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="default" className="text-sm">
            {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">My Checklists</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myChecklists.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Team Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentActivity.length}</div>
            <p className="text-xs text-muted-foreground">Recent updates</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages" className="flex items-center gap-2" data-testid="tab-messages">
            <MessageSquare className="h-4 w-4" />
            Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2" data-testid="tab-tasks">
            <CheckSquare className="h-4 w-4" />
            My Tasks
          </TabsTrigger>
          <TabsTrigger value="checklists" className="flex items-center gap-2" data-testid="tab-checklists">
            <ClipboardCheck className="h-4 w-4" />
            Checklists
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2" data-testid="tab-activity">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <Card className="h-[600px]">
            <div className="flex h-full">
              <div className="w-1/3 border-r">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Conversations</h3>
                </div>
                <ScrollArea className="h-[calc(100%-57px)]">
                  {conversationSummaries.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs">Start a new conversation below</p>
                    </div>
                  ) : (
                    conversationSummaries.map((conv) => (
                      <div
                        key={conv.partnerId}
                        className={`p-4 cursor-pointer hover-elevate ${
                          selectedConversation === conv.partnerId ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedConversation(conv.partnerId)}
                        data-testid={`conversation-${conv.partnerId}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{conv.partnerInitials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium truncate">{conv.partnerName}</p>
                              {conv.unreadCount > 0 && (
                                <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(conv.lastMessageTime, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <Separator className="my-2" />
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-2">Start new conversation with:</p>
                    <div className="space-y-1">
                      {employees?.filter(e => !conversationSummaries.find(c => c.partnerId === e.id)).slice(0, 5).map((emp) => (
                        <Button
                          key={emp.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setSelectedConversation(emp.id)}
                          data-testid={`new-conv-${emp.id}`}
                        >
                          <User className="h-4 w-4 mr-2" />
                          {emp.firstName} {emp.lastName}
                        </Button>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>

              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    <div className="p-4 border-b flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {(() => {
                            const emp = employees?.find(e => e.id === selectedConversation);
                            return emp ? `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase() : '?';
                          })()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {(() => {
                            const emp = employees?.find(e => e.id === selectedConversation);
                            return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
                          })()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employees?.find(e => e.id === selectedConversation)?.role || 'Team Member'}
                        </p>
                      </div>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {conversation?.map((msg) => {
                          const isFromMe = msg.senderId === currentEmployeeId;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isFromMe
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 ${
                                  isFromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                }`}>
                                  {msg.createdAt && format(new Date(msg.createdAt), 'HH:mm')}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="min-h-[40px] max-h-[120px] resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          data-testid="input-message"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          data-testid="button-send-message"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a conversation or start a new one</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6 space-y-4">
          {myTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks assigned to you</p>
                <p className="text-sm">Check back later or view all tasks</p>
                <Link href="/tasks">
                  <Button variant="outline" className="mt-4">
                    View All Tasks
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            myTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 ${getPriorityColor(task.priority)}`}>
                      <Circle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </span>
                        )}
                        {task.priority && (
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {task.jobId && (
                      <Link href={`/jobs/${task.jobId}`}>
                        <Button variant="ghost" size="sm">
                          <Briefcase className="h-4 w-4 mr-1" />
                          View Job
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          {myTasks.length > 0 && (
            <div className="text-center">
              <Link href="/tasks">
                <Button variant="outline">
                  View All Tasks
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="checklists" className="mt-6 space-y-4">
          {myChecklists.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No checklists assigned to you</p>
                <p className="text-sm">Check back later or view all checklists</p>
                <Link href="/checklists">
                  <Button variant="outline" className="mt-4">
                    View All Checklists
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            myChecklists.map((checklist) => (
              <Card key={checklist.id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <ClipboardCheck className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Checklist #{checklist.id.slice(0, 8)}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        <Badge variant="outline">{checklist.status}</Badge>
                        {checklist.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {format(new Date(checklist.dueDate), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href="/checklists">
                      <Button variant="ghost" size="sm">
                        View
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          {myChecklists.length > 0 && (
            <div className="text-center">
              <Link href="/checklists">
                <Button variant="outline">
                  View All Checklists
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Team Activity</CardTitle>
              <CardDescription>See what's happening across the team</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const employee = employees?.find(e => e.id === activity.employeeId);
                    const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Someone';
                    return (
                      <div key={activity.id} className="flex items-start gap-4">
                        <div className="mt-1">
                          {getActivityIcon(activity.activityType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{employeeName}</span>
                            {' '}{activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.createdAt && formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
