import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DollarSign,
  Receipt,
  CheckCircle,
  Clock,
  Plus,
  Upload,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { expensesApi, Expense } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState({
    totalSubmitted: 0,
    pendingApproval: 0,
    approved: 0,
    totalCount: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch recent expenses
      const expensesResponse = await expensesApi.getAll({
        limit: 5,
        sort: '-createdAt',
      });

      if (expensesResponse.success) {
        setRecentExpenses(expensesResponse.data.expenses);
      }

      // Fetch stats
      const statsResponse = await expensesApi.getStats();
      if (statsResponse.success) {
        const { summary } = statsResponse.data;
        setStats({
          totalSubmitted: summary.totalAmount,
          pendingApproval: summary.pendingApproval,
          approved: summary.approved,
          totalCount: summary.totalExpenses,
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      <AppLayout userRole={user?.role || 'employee'}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout userRole={user?.role || 'employee'}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.firstName}! Here's your expense overview.
            </p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/expenses/new')}>
            <Plus className="h-4 w-4" />
            Submit Expense
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Submitted"
            value={formatCurrency(stats.totalSubmitted)}
            icon={DollarSign}
          />
          <StatCard
            title="Pending Approval"
            value={stats.pendingApproval.toString()}
            icon={Clock}
          />
          <StatCard
            title="Approved"
            value={stats.approved.toString()}
            icon={CheckCircle}
          />
          <StatCard
            title="Total Expenses"
            value={stats.totalCount.toString()}
            icon={Receipt}
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Button
              variant="outline"
              className="h-24 justify-start gap-4"
              onClick={() => navigate('/expenses/new')}
            >
              <div className="p-3 bg-primary/10 rounded-lg">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Submit New Expense</p>
                <p className="text-sm text-muted-foreground">
                  Create a new expense report
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-24 justify-start gap-4"
              onClick={() => navigate('/expenses')}
            >
              <div className="p-3 bg-secondary/10 rounded-lg">
                <Receipt className="h-6 w-6 text-secondary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">View All Expenses</p>
                <p className="text-sm text-muted-foreground">
                  Manage your expense reports
                </p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Expenses</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/expenses')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No expenses found</p>
                <Button
                  className="mt-4 gap-2"
                  onClick={() => navigate('/expenses/new')}
                >
                  <Plus className="h-4 w-4" />
                  Submit Your First Expense
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExpenses.map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell className="font-medium">
                        {expense.title}
                      </TableCell>
                      <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                      <TableCell>{formatCurrency(expense.amount, expense.currency)}</TableCell>
                      <TableCell>
                        <StatusBadge status={expense.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
