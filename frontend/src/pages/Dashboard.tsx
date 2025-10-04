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
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const recentExpenses = [
  {
    id: 1,
    description: "Client Dinner",
    amount: "$250.00",
    date: "2024-01-15",
    status: "approved" as const,
  },
  {
    id: 2,
    description: "Office Supplies",
    amount: "$75.50",
    date: "2024-01-14",
    status: "pending" as const,
  },
  {
    id: 3,
    description: "Conference Ticket",
    amount: "$500.00",
    date: "2024-01-12",
    status: "pending" as const,
  },
  {
    id: 4,
    description: "Travel Expenses",
    amount: "$1,200.00",
    date: "2024-01-10",
    status: "approved" as const,
  },
];

export default function Dashboard() {
  return (
    <AppLayout userRole="employee">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your expense overview.
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Submit Expense
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Submitted"
            value="$2,025.50"
            icon={DollarSign}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Pending Approval"
            value="$575.50"
            icon={Clock}
          />
          <StatCard
            title="Approved"
            value="$1,450.00"
            icon={CheckCircle}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Total Expenses"
            value="8"
            icon={Receipt}
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="h-24 justify-start gap-4">
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
            <Button variant="outline" className="h-24 justify-start gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <Upload className="h-6 w-6 text-secondary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Quick OCR Upload</p>
                <p className="text-sm text-muted-foreground">
                  Scan receipt instantly
                </p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
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
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {expense.description}
                    </TableCell>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>{expense.amount}</TableCell>
                    <TableCell>
                      <StatusBadge status={expense.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
