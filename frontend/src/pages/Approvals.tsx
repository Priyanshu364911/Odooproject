import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const pendingApprovals = [
  {
    id: 1,
    employee: "Sarah Johnson",
    initials: "SJ",
    description: "Client Lunch Meeting",
    category: "Meals & Entertainment",
    amount: "$185.50",
    date: "2024-01-18",
    priority: "high",
  },
  {
    id: 2,
    employee: "Mike Chen",
    initials: "MC",
    description: "Conference Ticket",
    category: "Training",
    amount: "$650.00",
    date: "2024-01-17",
    priority: "medium",
  },
  {
    id: 3,
    employee: "Emma Davis",
    initials: "ED",
    description: "Office Supplies",
    category: "Supplies",
    amount: "$95.25",
    date: "2024-01-16",
    priority: "low",
  },
];

export default function Approvals() {
  const { toast } = useToast();

  const handleApprove = (id: number) => {
    toast({
      title: "Expense Approved",
      description: "The expense has been approved successfully.",
    });
  };

  const handleReject = (id: number) => {
    toast({
      title: "Expense Rejected",
      description: "The expense has been rejected.",
      variant: "destructive",
    });
  };

  return (
    <AppLayout userRole="manager">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Approval Center</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve team expense reports
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-status-pending/10 rounded-lg">
                  <Clock className="h-6 w-6 text-status-pending" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-status-approved/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-status-approved" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approved Today</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">$930.75</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Approval Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingApprovals.map((expense) => (
              <Card key={expense.id} className="hover-scale">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {expense.initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{expense.employee}</h3>
                        {expense.priority === "high" && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive rounded">
                            High Priority
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground">{expense.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>{expense.category}</span>
                        <span>•</span>
                        <span>{expense.date}</span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">
                          {expense.amount}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        className="flex-1 sm:flex-none gap-2"
                        onClick={() => handleReject(expense.id)}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        className="flex-1 sm:flex-none gap-2"
                        onClick={() => handleApprove(expense.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  No approved expenses to display
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  No rejected expenses to display
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
