import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isToday, isTomorrow, addDays, startOfDay } from "date-fns";
import { 
  Droplet, 
  Activity, 
  Utensils, 
  Clock, 
  Timer,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Settings,
  Target,
  Sun,
  MapPin,
  Bell,
  Sparkles,
  Heart
} from "lucide-react";
import type { OwnerWellbeingSettings, PersonalTask, DailyFocusTask, Task, Job } from "@shared/schema";

const personalTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  taskType: z.string().default("personal"),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  location: z.string().optional(),
  isMorningTask: z.boolean().default(false),
  reminderMinutesBefore: z.number().optional(),
});

const dailyFocusSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.number().min(1).max(3).default(1),
  taskId: z.string().optional(),
  jobId: z.string().optional(),
});

export default function WellbeingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showPersonalTaskDialog, setShowPersonalTaskDialog] = useState(false);
  const [showFocusTaskDialog, setShowFocusTaskDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const { data: dashboardData, isLoading } = useQuery<{
    settings: OwnerWellbeingSettings | null;
    morningTasks: PersonalTask[];
    dailyFocus: DailyFocusTask[];
    upcomingTasks: PersonalTask[];
    nextAppointment: PersonalTask | null;
  }>({
    queryKey: ["/api/wellbeing/dashboard"],
  });

  const { data: allPersonalTasks } = useQuery<PersonalTask[]>({
    queryKey: ["/api/wellbeing/personal-tasks"],
  });

  const { data: allTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const settings = dashboardData?.settings;
  const morningTasks = dashboardData?.morningTasks || [];
  const dailyFocus = dashboardData?.dailyFocus || [];
  const upcomingTasks = dashboardData?.upcomingTasks || [];

  const saveSettingsMutation = useMutation({
    mutationFn: (data: Partial<OwnerWellbeingSettings>) =>
      apiRequest("POST", "/api/wellbeing/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellbeing/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wellbeing/settings"] });
      toast({ title: "Settings saved" });
      setShowSettingsDialog(false);
    },
  });

  const createPersonalTaskMutation = useMutation({
    mutationFn: (data: z.infer<typeof personalTaskSchema>) =>
      apiRequest("POST", "/api/wellbeing/personal-tasks", {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellbeing"] });
      toast({ title: "Personal task created" });
      setShowPersonalTaskDialog(false);
    },
  });

  const completePersonalTaskMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/wellbeing/personal-tasks/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellbeing"] });
      toast({ title: "Task completed" });
    },
  });

  const deletePersonalTaskMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/wellbeing/personal-tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellbeing"] });
      toast({ title: "Task deleted" });
    },
  });

  const createFocusTaskMutation = useMutation({
    mutationFn: (data: z.infer<typeof dailyFocusSchema>) =>
      apiRequest("POST", "/api/wellbeing/daily-focus", {
        ...data,
        focusDate: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellbeing"] });
      toast({ title: "Focus task added" });
      setShowFocusTaskDialog(false);
    },
  });

  const completeFocusTaskMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/wellbeing/daily-focus/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellbeing"] });
      toast({ title: "Focus task completed" });
    },
  });

  const deleteFocusTaskMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/wellbeing/daily-focus/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellbeing"] });
    },
  });

  const personalTaskForm = useForm<z.infer<typeof personalTaskSchema>>({
    resolver: zodResolver(personalTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      taskType: "personal",
      isMorningTask: false,
      reminderMinutesBefore: 15,
    },
  });

  const focusTaskForm = useForm<z.infer<typeof dailyFocusSchema>>({
    resolver: zodResolver(dailyFocusSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: 1,
    },
  });

  const formatDueDate = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE, MMM d");
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "appointment": return <Calendar className="h-4 w-4" />;
      case "morning_routine": return <Sun className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const completedFocusCount = dailyFocus.filter(t => t.isCompleted).length;
  const completedMorningCount = morningTasks.filter(t => t.isCompleted).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading wellbeing data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-500" />
            Work-Life Balance
          </h1>
          <p className="text-muted-foreground">
            Taking care of yourself helps you take care of business
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowSettingsDialog(true)} data-testid="button-wellbeing-settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="personal" data-testid="tab-personal">Personal Tasks</TabsTrigger>
          <TabsTrigger value="focus" data-testid="tab-focus">Daily Focus</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Daily Focus</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedFocusCount}/{dailyFocus.length || 3}</div>
                <p className="text-xs text-muted-foreground">Top 3 tasks completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Morning Routine</CardTitle>
                <Sun className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedMorningCount}/{morningTasks.length}</div>
                <p className="text-xs text-muted-foreground">Personal tasks before work</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Work Cutoff</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{settings?.workCutoffTime || "18:30"}</div>
                <p className="text-xs text-muted-foreground">
                  {settings?.workCutoffEnabled ? "Active" : "Disabled"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {dashboardData?.nextAppointment ? (
                  <>
                    <div className="text-lg font-medium truncate">{dashboardData.nextAppointment.title}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatDueDate(dashboardData.nextAppointment.dueDate)}
                      {dashboardData.nextAppointment.dueTime && ` at ${dashboardData.nextAppointment.dueTime}`}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">No upcoming appointments</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Today's Top 3
                  </CardTitle>
                  <CardDescription>Your most important work tasks for today</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowFocusTaskDialog(true)} data-testid="button-add-focus-task">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {dailyFocus.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Add up to 3 focus tasks for today
                  </p>
                ) : (
                  dailyFocus.map((task, index) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-md ${
                        task.isCompleted ? "bg-muted/50" : "bg-muted"
                      }`}
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                        )}
                      </div>
                      {task.isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => completeFocusTaskMutation.mutate(task.id)}
                          data-testid={`button-complete-focus-${task.id}`}
                        >
                          <Circle className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5" />
                    Morning Personal Tasks
                  </CardTitle>
                  <CardDescription>Complete these before starting work</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    personalTaskForm.setValue("isMorningTask", true);
                    setShowPersonalTaskDialog(true);
                  }}
                  data-testid="button-add-morning-task"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {morningTasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No morning tasks set - add personal tasks you want to complete before work
                  </p>
                ) : (
                  morningTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-md ${
                        task.isCompleted ? "bg-muted/50" : "bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={!!task.isCompleted}
                        onCheckedChange={() => {
                          if (!task.isCompleted) {
                            completePersonalTaskMutation.mutate(task.id);
                          }
                        }}
                        data-testid={`checkbox-morning-${task.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Personal Events
              </CardTitle>
              <CardDescription>Appointments and personal tasks for the next few days</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No upcoming personal tasks or appointments
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-md bg-muted"
                    >
                      {getTaskTypeIcon(task.taskType || "personal")}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{task.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatDueDate(task.dueDate)}</span>
                          {task.dueTime && <span>at {task.dueTime}</span>}
                          {task.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {task.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">{task.taskType || "personal"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Personal Tasks & Appointments</h2>
            <Button onClick={() => setShowPersonalTaskDialog(true)} data-testid="button-add-personal-task">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>

          <div className="space-y-4">
            {!allPersonalTasks || allPersonalTasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No personal tasks yet</p>
                  <p className="text-sm">Add appointments, personal tasks, or morning routine items</p>
                </CardContent>
              </Card>
            ) : (
              allPersonalTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={!!task.isCompleted}
                        onCheckedChange={() => {
                          if (!task.isCompleted) {
                            completePersonalTaskMutation.mutate(task.id);
                          }
                        }}
                        className="mt-1"
                        data-testid={`checkbox-personal-${task.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-medium ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {task.taskType || "personal"}
                          </Badge>
                          {task.isMorningTask && (
                            <Badge variant="outline" className="text-xs">
                              <Sun className="h-3 w-3 mr-1" />
                              Morning
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDueDate(task.dueDate)}
                            </span>
                          )}
                          {task.dueTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.dueTime}
                            </span>
                          )}
                          {task.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {task.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deletePersonalTaskMutation.mutate(task.id)}
                        data-testid={`button-delete-personal-${task.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="focus" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Daily Top 3</h2>
              <p className="text-muted-foreground">Focus on your 3 most important work tasks each day</p>
            </div>
            {dailyFocus.length < 3 && (
              <Button onClick={() => setShowFocusTaskDialog(true)} data-testid="button-add-focus-task-tab">
                <Plus className="h-4 w-4 mr-2" />
                Add Focus Task
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            {[1, 2, 3].map((priority) => {
              const task = dailyFocus.find(t => t.priority === priority);
              return (
                <Card key={priority} className={!task ? "border-dashed" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                        task?.isCompleted 
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-primary text-primary-foreground"
                      }`}>
                        {priority}
                      </div>
                      {task ? (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!task.isCompleted && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => completeFocusTaskMutation.mutate(task.id)}
                                data-testid={`button-complete-focus-tab-${task.id}`}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Complete
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteFocusTaskMutation.mutate(task.id)}
                              data-testid={`button-delete-focus-${task.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 text-muted-foreground">
                          <p>Priority {priority} - Not set</p>
                          <Button 
                            variant="ghost" 
                            className="p-0 h-auto text-primary underline-offset-4 hover:underline"
                            onClick={() => {
                              focusTaskForm.setValue("priority", priority);
                              setShowFocusTaskDialog(true);
                            }}
                          >
                            Add a focus task
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showPersonalTaskDialog} onOpenChange={setShowPersonalTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Personal Task</DialogTitle>
            <DialogDescription>
              Add a personal task, appointment, or morning routine item
            </DialogDescription>
          </DialogHeader>
          <Form {...personalTaskForm}>
            <form onSubmit={personalTaskForm.handleSubmit((data) => createPersonalTaskMutation.mutate(data))} className="space-y-4">
              <FormField
                control={personalTaskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dentist appointment" {...field} data-testid="input-personal-task-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalTaskForm.control}
                name="taskType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-personal-task-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="personal">Personal Task</SelectItem>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="morning_routine">Morning Routine</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalTaskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add details..." {...field} data-testid="input-personal-task-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={personalTaskForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-personal-task-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={personalTaskForm.control}
                  name="dueTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-personal-task-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={personalTaskForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 High Street" {...field} data-testid="input-personal-task-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalTaskForm.control}
                name="isMorningTask"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Morning Routine</FormLabel>
                      <FormDescription>
                        Add to your morning tasks before work
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-morning-task"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowPersonalTaskDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPersonalTaskMutation.isPending} data-testid="button-save-personal-task">
                  Add Task
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showFocusTaskDialog} onOpenChange={setShowFocusTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Focus Task</DialogTitle>
            <DialogDescription>
              Add one of your top 3 work priorities for today
            </DialogDescription>
          </DialogHeader>
          <Form {...focusTaskForm}>
            <form onSubmit={focusTaskForm.handleSubmit((data) => createFocusTaskMutation.mutate(data))} className="space-y-4">
              <FormField
                control={focusTaskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Complete Smith kitchen quote" {...field} data-testid="input-focus-task-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={focusTaskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add details..." {...field} data-testid="input-focus-task-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={focusTaskForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger data-testid="select-focus-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - Most Important</SelectItem>
                        <SelectItem value="2">2 - Important</SelectItem>
                        <SelectItem value="3">3 - Should Do</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={focusTaskForm.control}
                name="jobId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Job (optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-focus-job">
                          <SelectValue placeholder="Select a job" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {jobs?.slice(0, 20).map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.jobNumber} - {job.description?.substring(0, 30) || "No description"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowFocusTaskDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createFocusTaskMutation.isPending} data-testid="button-save-focus-task">
                  Add Focus Task
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Wellbeing Settings</DialogTitle>
            <DialogDescription>
              Configure your work-life balance reminders and preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Droplet className="h-4 w-4 text-blue-500" />
                Water Reminders
              </h3>
              <div className="flex items-center justify-between">
                <Label>Enable water reminders</Label>
                <Switch
                  checked={settings?.waterReminderEnabled ?? true}
                  onCheckedChange={(checked) => saveSettingsMutation.mutate({ waterReminderEnabled: checked })}
                  data-testid="switch-water-reminder"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32">Interval (mins)</Label>
                <Input
                  type="number"
                  defaultValue={settings?.waterReminderIntervalMinutes ?? 60}
                  className="w-24"
                  onBlur={(e) => saveSettingsMutation.mutate({ waterReminderIntervalMinutes: parseInt(e.target.value) || 60 })}
                  data-testid="input-water-interval"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Stretch Reminders
              </h3>
              <div className="flex items-center justify-between">
                <Label>Enable stretch reminders</Label>
                <Switch
                  checked={settings?.stretchReminderEnabled ?? true}
                  onCheckedChange={(checked) => saveSettingsMutation.mutate({ stretchReminderEnabled: checked })}
                  data-testid="switch-stretch-reminder"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32">Interval (mins)</Label>
                <Input
                  type="number"
                  defaultValue={settings?.stretchReminderIntervalMinutes ?? 90}
                  className="w-24"
                  onBlur={(e) => saveSettingsMutation.mutate({ stretchReminderIntervalMinutes: parseInt(e.target.value) || 90 })}
                  data-testid="input-stretch-interval"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Work Cutoff Time
              </h3>
              <div className="flex items-center justify-between">
                <Label>Enable work cutoff reminder</Label>
                <Switch
                  checked={settings?.workCutoffEnabled ?? true}
                  onCheckedChange={(checked) => saveSettingsMutation.mutate({ workCutoffEnabled: checked })}
                  data-testid="switch-work-cutoff"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32">Cutoff time</Label>
                <Input
                  type="time"
                  defaultValue={settings?.workCutoffTime ?? "18:30"}
                  className="w-32"
                  onBlur={(e) => saveSettingsMutation.mutate({ workCutoffTime: e.target.value || "18:30" })}
                  data-testid="input-cutoff-time"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32">Message</Label>
                <Input
                  defaultValue={settings?.workCutoffMessage ?? "Time to switch to family mode!"}
                  className="flex-1"
                  onBlur={(e) => saveSettingsMutation.mutate({ workCutoffMessage: e.target.value })}
                  data-testid="input-cutoff-message"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Timer className="h-4 w-4 text-purple-500" />
                Session Tracking
              </h3>
              <div className="flex items-center justify-between">
                <Label>Track time online</Label>
                <Switch
                  checked={settings?.sessionTrackingEnabled ?? true}
                  onCheckedChange={(checked) => saveSettingsMutation.mutate({ sessionTrackingEnabled: checked })}
                  data-testid="switch-session-tracking"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32">Warn after (mins)</Label>
                <Input
                  type="number"
                  defaultValue={settings?.sessionWarningMinutes ?? 120}
                  className="w-24"
                  onBlur={(e) => saveSettingsMutation.mutate({ sessionWarningMinutes: parseInt(e.target.value) || 120 })}
                  data-testid="input-session-warning"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
