import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Search, CheckSquare, Calendar, Trash2, AlertCircle, Clock } from "lucide-react";
import type { Task, Job, InsertTask } from "@shared/schema";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";
import { Link } from "wouter";

const formSchema = insertTaskSchema.extend({
  title: z.string().min(1, "Title is required"),
});

type FormData = z.infer<typeof formSchema>;

interface TasksData {
  tasks: Task[];
  jobs: Job[];
}

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<TasksData>({
    queryKey: ["/api/tasks"],
  });

  const tasks = data?.tasks || [];
  const jobs = data?.jobs || [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      jobId: null,
      dueDate: null,
      priority: "medium",
      status: "pending",
      assignedTo: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormData) => {
      return apiRequest("POST", "/api/tasks", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Task created" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      toast({ title: "Error updating task", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Task deleted" });
    },
    onError: () => {
      toast({ title: "Error deleting task", variant: "destructive" });
    },
  });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getJob = (jobId: string | null) => jobId ? jobs.find(j => j.id === jobId) : null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20";
      case "medium": return "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "low": return "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20";
      default: return "";
    }
  };

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-task">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  {...form.register("title")}
                  placeholder="Task title"
                  data-testid="input-task-title"
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  {...form.register("description")}
                  placeholder="Task description..."
                  data-testid="textarea-task-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={form.watch("priority") || "medium"}
                    onValueChange={(value) => form.setValue("priority", value)}
                  >
                    <SelectTrigger data-testid="select-task-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobId">Link to Job</Label>
                  <Select
                    value={form.watch("jobId") || "none"}
                    onValueChange={(value) => form.setValue("jobId", value === "none" ? null : value)}
                  >
                    <SelectTrigger data-testid="select-task-job">
                      <SelectValue placeholder="No job" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No job</SelectItem>
                      {jobs.map(job => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.jobNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-task">
                  {createMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-tasks"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={searchQuery || filterStatus !== "all" 
            ? "Try adjusting your filters" 
            : "Create your first task to get started"
          }
          action={!searchQuery && filterStatus === "all" ? { 
            label: "Add Task", 
            onClick: () => setIsDialogOpen(true) 
          } : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredTasks.map(task => {
                const job = getJob(task.jobId);
                const overdue = task.status === "pending" && isOverdue(task.dueDate);
                
                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-4 p-4 ${task.status === "completed" ? "opacity-60" : ""}`}
                    data-testid={`task-row-${task.id}`}
                  >
                    <Checkbox
                      checked={task.status === "completed"}
                      onCheckedChange={(checked) => {
                        updateStatusMutation.mutate({
                          id: task.id,
                          status: checked ? "completed" : "pending",
                        });
                      }}
                      data-testid={`checkbox-task-${task.id}`}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium text-sm ${task.status === "completed" ? "line-through" : ""}`}>
                          {task.title}
                        </span>
                        <Badge variant="outline" className={getPriorityColor(task.priority || "medium")}>
                          {task.priority}
                        </Badge>
                        {overdue && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {job && (
                          <Link href={`/jobs/${job.id}`} className="hover:underline">
                            Job: {job.jobNumber}
                          </Link>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Delete this task?")) {
                          deleteMutation.mutate(task.id);
                        }
                      }}
                      data-testid={`button-delete-task-${task.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
