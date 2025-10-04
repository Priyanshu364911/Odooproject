import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Download, Plus } from "lucide-react";

const allExpenses = [
  {
    id: 1,
    description: "Client Dinner at Steakhouse",
    category: "Meals & Entertainment",
    amount: "$250.00",
    date: "2024-01-15",
    status: "approved" as const,
  },
  {
    id: 2,
    description: "Office Supplies - Printer Paper",
    category: "Office Supplies",
    amount: "$75.50",
    date: "2024-01-14",
    status: "pending" as const,
  },
  {
    id: 3,
    description: "Annual Tech Conference Ticket",
    category: "Training & Development",
    amount: "$500.00",
    date: "2024-01-12",
    status: "pending" as const,
  },
  {
    id: 4,
    description: "Business Travel - Flight to NYC",
    category: "Travel",
    amount: "$1,200.00",
    date: "2024-01-10",
    status: "approved" as const,
  },
  {
    id: 5,
    description: "Hotel Accommodation",
    category: "Travel",
    amount: "$450.00",
    date: "2024-01-09",
    status: "approved" as const,
  },
  {
    id: 6,
    description: "Client Gift Basket",
    category: "Client Relations",
    amount: "$125.00",
    date: "2024-01-08",
    status: "rejected" as const,
  },
];

export default function Expenses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredExpenses = allExpenses.filter((expense) => {
    const matchesSearch = expense.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || expense.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout userRole="employee">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Expenses</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your expense reports
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Expense
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Expense History ({filteredExpenses.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {expense.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {expense.category}
                    </TableCell>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell className="font-semibold">
                      {expense.amount}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={expense.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
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
