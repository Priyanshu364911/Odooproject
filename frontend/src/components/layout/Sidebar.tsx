import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Receipt,
    CheckSquare,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
    userRole: "employee" | "manager" | "admin";
}

const employeeNavItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { title: "My Expenses", icon: Receipt, path: "/expenses" },
    { title: "Submit Expense", icon: FileText, path: "/expenses/new" },
];

const managerNavItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { title: "Approvals", icon: CheckSquare, path: "/approvals" },
    { title: "Team Expenses", icon: Receipt, path: "/expenses" },
];

const adminNavItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { title: "All Expenses", icon: Receipt, path: "/expenses" },
    { title: "Approvals", icon: CheckSquare, path: "/approvals" },
    { title: "Users", icon: Users, path: "/users" },
    { title: "Settings", icon: Settings, path: "/settings" },
];

export function Sidebar({ userRole }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);

    const navItems =
        userRole === "admin"
            ? adminNavItems
            : userRole === "manager"
                ? managerNavItems
                : employeeNavItems;

    return (
        <aside
            className={cn(
                "bg-sidebar border-r border-sidebar-border transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            <div className="flex flex-col h-full">
                {/* Logo and Toggle */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
                    {!collapsed && (
                        <h1 className="text-xl font-bold text-primary">ExpenseFlow</h1>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className="ml-auto"
                    >
                        {collapsed ? (
                            <ChevronRight className="h-5 w-5" />
                        ) : (
                            <ChevronLeft className="h-5 w-5" />
                        )}
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                    "hover:bg-sidebar-accent",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                        : "text-sidebar-foreground"
                                )
                            }
                        >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User Role Badge */}
                {!collapsed && (
                    <div className="p-4 border-t border-sidebar-border">
                        <div className="px-3 py-2 bg-accent rounded-lg">
                            <p className="text-xs text-muted-foreground">Current Role</p>
                            <p className="text-sm font-medium capitalize">{userRole}</p>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
