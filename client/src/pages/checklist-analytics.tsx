import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/empty-state";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ClipboardList,
  Target,
  Timer,
  BarChart3,
} from "lucide-react";

type BottleneckItem = {
  itemId: string;
  label: string;
  completionRate: number;
  completed: number;
  total: number;
};

type TemplateAnalytics = {
  templateId: string;
  templateName: string;
  templateCode: string;
  targetType: string;
  totalInstances: number;
  completedInstances: number;
  overdueInstances: number;
  completionRate: number;
  bottleneckItems: BottleneckItem[];
};

type DailyTrend = {
  date: string;
  completed: number;
  created: number;
};

type TargetTypeBreakdown = {
  targetType: string;
  total: number;
  completed: number;
  completionRate: number;
};

type ChecklistAnalyticsData = {
  overview: {
    totalInstances: number;
    completedInstances: number;
    pendingInstances: number;
    inProgressInstances: number;
    overdueInstances: number;
    overallCompletionRate: number;
    avgCompletionTimeHours: number;
  };
  templateAnalytics: TemplateAnalytics[];
  dailyTrends: DailyTrend[];
  targetTypeBreakdown: TargetTypeBreakdown[];
};

const targetTypeLabels: Record<string, string> = {
  job: "Jobs",
  job_emergency: "Emergency Call-outs",
  asset_tool: "Tool Checks",
  asset_vehicle: "Vehicle Checks",
  payroll: "Payroll",
  team_paid: "Team Paid",
  general: "General",
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function ChecklistAnalytics() {
  const { data, isLoading, error } = useQuery<ChecklistAnalyticsData>({
    queryKey: ["/api/checklist-analytics"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Checklist Analytics</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <EmptyState
          title="Unable to load analytics"
          description="There was an error loading the checklist analytics data."
          icon={BarChart3}
        />
      </div>
    );
  }

  const { overview, templateAnalytics, dailyTrends, targetTypeBreakdown } = data;

  const pieData = [
    { name: "Completed", value: overview.completedInstances, color: "hsl(var(--chart-2))" },
    { name: "In Progress", value: overview.inProgressInstances, color: "hsl(var(--chart-1))" },
    { name: "Pending", value: overview.pendingInstances, color: "hsl(var(--chart-4))" },
    { name: "Overdue", value: overview.overdueInstances, color: "hsl(var(--destructive))" },
  ].filter(d => d.value > 0);

  const recentTrends = dailyTrends.slice(-14);

  return (
    <div className="p-6 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold" data-testid="page-title-checklist-analytics">Checklist Analytics</h1>
        </div>
        <Badge variant="outline" className="text-xs">
          Last 30 Days
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-checklists">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Checklists</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-total-checklists">{overview.totalInstances}</div>
            <p className="text-xs text-muted-foreground">
              {overview.completedInstances} completed
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-completion-rate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-completion-rate">{overview.overallCompletionRate}%</div>
            <Progress value={overview.overallCompletionRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card data-testid="card-avg-time">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Completion Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-avg-time">
              {overview.avgCompletionTimeHours < 24 
                ? `${overview.avgCompletionTimeHours}h` 
                : `${Math.round(overview.avgCompletionTimeHours / 24)}d`}
            </div>
            <p className="text-xs text-muted-foreground">
              From creation to completion
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-overdue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="value-overdue">{overview.overdueInstances}</div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" data-testid="card-completion-trends">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Completion Trends
            </CardTitle>
            <CardDescription>Last 14 days of checklist activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTrends.length > 0 && recentTrends.some(d => d.created > 0 || d.completed > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={recentTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    className="text-xs"
                  />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip 
                    labelFormatter={(val) => new Date(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="created" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    name="Created"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Completed"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No activity data for this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-status-breakdown">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Status Breakdown
            </CardTitle>
            <CardDescription>Current checklist statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {targetTypeBreakdown.length > 0 && (
        <Card data-testid="card-target-type-breakdown">
          <CardHeader>
            <CardTitle>Completion by Category</CardTitle>
            <CardDescription>How different checklist types are performing</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={targetTypeBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => `${val}%`} className="text-xs" />
                <YAxis 
                  type="category" 
                  dataKey="targetType" 
                  width={120}
                  tickFormatter={(val) => targetTypeLabels[val] || val}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                  labelFormatter={(val) => targetTypeLabels[val] || val}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="completionRate" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-template-analytics">
        <CardHeader>
          <CardTitle>Template Performance</CardTitle>
          <CardDescription>Completion rates and bottlenecks by template</CardDescription>
        </CardHeader>
        <CardContent>
          {templateAnalytics.length > 0 ? (
            <div className="space-y-4">
              {templateAnalytics.map((template) => (
                <div key={template.templateId} className="border rounded-lg p-4" data-testid={`template-row-${template.templateId}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="font-medium">{template.templateName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {targetTypeLabels[template.targetType] || template.targetType}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{template.totalInstances}</div>
                        <div className="text-muted-foreground text-xs">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600 dark:text-green-400">{template.completedInstances}</div>
                        <div className="text-muted-foreground text-xs">Completed</div>
                      </div>
                      {template.overdueInstances > 0 && (
                        <div className="text-center">
                          <div className="font-semibold text-destructive">{template.overdueInstances}</div>
                          <div className="text-muted-foreground text-xs">Overdue</div>
                        </div>
                      )}
                      <div className="text-center min-w-[60px]">
                        <div className="font-semibold">{template.completionRate}%</div>
                        <Progress value={template.completionRate} className="h-1 w-12 mt-1" />
                      </div>
                    </div>
                  </div>

                  {template.bottleneckItems.length > 0 && template.totalInstances > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Potential Bottlenecks (lowest completion)</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {template.bottleneckItems.map((item) => (
                          <Badge 
                            key={item.itemId} 
                            variant={item.completionRate < 50 ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {item.label}: {item.completionRate}%
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No checklist templates with instances yet</p>
              <p className="text-sm">Create checklists and assign them to jobs to see analytics</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
