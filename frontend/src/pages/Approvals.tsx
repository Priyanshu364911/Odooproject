import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Clock, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { expensesApi, Expense } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Approvals() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [approvedExpenses, setApprovedExpenses] = useState<Expense[]>([]);
  const [rejectedExpenses, setRejectedExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    totalAmount: 0,
  });
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState("");

  // Fetch expenses data
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);

      // Fetch pending approvals
      const pendingResponse = await expensesApi.getPendingApprovals();
      if (pendingResponse.success) {
        setPendingExpenses(pendingResponse.data.expenses);
      }

      // Fetch approved and rejected expenses
      const allExpensesResponse = await expensesApi.getAll({
        status: 'approved,rejected',
        limit: 50,
      });
      if (allExpensesResponse.success) {
        const approved = allExpensesResponse.data.expenses.filter(
          (expense) => expense.status === 'approved'
        );
        const rejected = allExpensesResponse.data.expenses.filter(
          (expense) => expense.status === 'rejected'
        );
        setApprovedExpenses(approved);
        setRejectedExpenses(rejected);
      }

      // Calculate stats
      const pendingCount = pendingResponse.success ? pendingResponse.data.expenses.length : 0;
      const totalAmount = pendingResponse.success
        ? pendingResponse.data.expenses.reduce((sum, expense) => sum + expense.amount, 0)
        : 0;

      // Count approved today
      const today = new Date().toDateString();
      const approvedToday = allExpensesResponse.success
        ? allExpensesResponse.data.expenses.filter(
          (expense) =>
            expense.status === 'approved' &&
            new Date(expense.updatedAt).toDateString() === today
        ).length
        : 0;

      setStats({
        pending: pendingCount,
        approvedToday,
        totalAmount,
      });

    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = (expense: Expense, action: 'approve' | 'reject') => {
    setSelectedExpense(expense);
    setActionType(action);
    setComments("");
  };

  const confirmAction = async () => {
    if (!selectedExpense || !actionType) return;

    try {
      setActionLoading(selectedExpense._id);

      const response = await expensesApi.processApproval(selectedExpense._id, {
        action: actionType,
        comments: comments.trim() || undefined,
      });

      if (response.success) {
        // Update local state
        setPendingExpenses(prev =>
          prev.filter(expense => expense._id !== selectedExpense._id)
        );

        if (actionType === 'approve') {
          setApprovedExpenses(prev => [...prev, response.data.expense]);
          setStats(prev => ({
            ...prev,
            pending: prev.pending - 1,
            approvedToday: prev.approvedToday + 1,
            totalAmount: prev.totalAmount - selectedExpense.amount,
          }));
        } else {
          setRejectedExpenses(prev => [...prev, response.data.expense]);
          setStats(prev => ({
            ...prev,
            pending: prev.pending - 1,
            totalAmount: prev.totalAmount - selectedExpense.amount,
          }));
        }

        toast({
          title: actionType === 'approve' ? "Expense Approved" : "Expense Rejected",
          description: `The expense has been ${actionType}d successfully.`,
          variant: actionType === 'approve' ? "default" : "destructive",
        });

        // Close dialog
        setSelectedExpense(null);
        setActionType(null);
        setComments("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || `Failed to ${actionType} expense`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <AppLayout userRole={user?.role || 'manager'}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading approvals...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole={user?.role || 'manager'}>
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
                  <p className="text-2xl font-bold">{stats.pending}</p>
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
                  <p className="text-2xl font-bold">{stats.approvedToday}</p>
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
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
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
            {pendingExpenses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending approvals</p>
                </CardContent>
              </Card>
            ) : (
              pendingExpenses.map((expense) => (
                <Card key={expense._id} className="hover-scale">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {expense.submittedBy.firstName?.[0]}{expense.submittedBy.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{expense.submittedBy.fullName}</h3>
                          {expense.amount > 500 && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive rounded">
                              High Amount
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{expense.title}</p>
                        {expense.description && (
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>{expense.category.name}</span>
                          <span>•</span>
                          <span>{formatDate(expense.expenseDate)}</span>
                          <span>•</span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(expense.amount, expense.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          className="flex-1 sm:flex-none gap-2"
                          onClick={() => handleApprovalAction(expense, 'reject')}
                          disabled={actionLoading === expense._id}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          className="flex-1 sm:flex-none gap-2"
                          onClick={() => handleApprovalAction(expense, 'approve')}
                          disabled={actionLoading === expense._id}
                        >
                          {actionLoading === expense._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedExpenses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No approved expenses</p>
                </CardContent>
              </Card>
            ) : (
              approvedExpenses.map((expense) => (
                <Card key={expense._id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-green-100 text-green-700">
                          {expense.submittedBy.firstName?.[0]}{expense.submittedBy.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold">{expense.submittedBy.fullName}</h3>
                        <p className="text-sm text-foreground">{expense.title}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>{expense.category.name}</span>
                          <span>•</span>
                          <span>{formatDate(expense.expenseDate)}</span>
                          <span>•</span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(expense.amount, expense.currency)}
                          </span>
                        </div>
                      </div>

                      <StatusBadge status="approved" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedExpenses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No rejected expenses</p>
                </CardContent>
              </Card>
            ) : (
              rejectedExpenses.map((expense) => (
                <Card key={expense._id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-red-100 text-red-700">
                          {expense.submittedBy.firstName?.[0]}{expense.submittedBy.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold">{expense.submittedBy.fullName}</h3>
                        <p className="text-sm text-foreground">{expense.title}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>{expense.category.name}</span>
                          <span>•</span>
                          <span>{formatDate(expense.expenseDate)}</span>
                          <span>•</span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(expense.amount, expense.currency)}
                          </span>
                        </div>
                      </div>

                      <StatusBadge status="rejected" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Approval Dialog */}
        <Dialog open={!!selectedExpense} onOpenChange={() => {
          setSelectedExpense(null);
          setActionType(null);
          setComments("");
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Approve' : 'Reject'} Expense
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve'
                  ? 'Are you sure you want to approve this expense?'
                  : 'Please provide a reason for rejecting this expense.'
                }
              </DialogDescription>
            </DialogHeader>

            {selectedExpense && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">{selectedExpense.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedExpense.submittedBy.fullName} • {formatCurrency(selectedExpense.amount, selectedExpense.currency)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments">
                    Comments {actionType === 'reject' ? '(Required)' : '(Optional)'}
                  </Label>
                  <Textarea
                    id="comments"
                    placeholder={
                      actionType === 'approve'
                        ? 'Add any comments about this approval...'
                        : 'Please explain why this expense is being rejected...'
                    }
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedExpense(null);
                  setActionType(null);
                  setComments("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                disabled={actionType === 'reject' && !comments.trim()}
                variant={actionType === 'approve' ? 'default' : 'destructive'}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
