"use client"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  progress?: number;
  avatar?: string;
}

interface UserManagementTableProps {
  users?: User[];
}

export function UserManagementTable({ users }: UserManagementTableProps) {
  const router = useRouter();
  // Initialize local state with props, but allow it to drift for optimistic updates
  const [localUsers, setLocalUsers] = useState<User[]>(users || []);
  const { toast } = useToast()

  // We need state to track which user is being deleted to open the dialog for the correct one 
  // OR we can just wrap the delete button in the alert dialog logic.
  // Since the delete button is inside a dropdown, it's cleaner to handle state or use a separate component.
  // However, simpler is often better: we can put the alert dialog at the top level and control it with state.
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Sync local state when server props update (e.g. after refresh completes)
  // This ensures if other changes happen we get them, but our optimistic delete persists if confirmed
  // if (users && users !== localUsers && users.length !== localUsers.length) {
  //    // careful with infinite loops here. 
  //    // A better pattern is to key the component or just use useEffect.
  //    // Let's use useEffect to sync only when props significantly change or just rely on state.
  // }

  // Actually, standard pattern: 
  // 1. Initial state = props.users
  // 2. Optimistic delete: setLocalUsers(filtered)
  // 3. router.refresh() -> re-renders parent -> re-renders this component with NEW props.users
  // 4. We need to respect new props. 
  // Let's use useEffect to update localUsers when users prop changes.

  useEffect(() => {
    if (users) {
      setLocalUsers(users);
    }
  }, [users]);

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;

    // 1. Optimistic Update: Immediately remove from UI
    const previousUsers = [...localUsers];
    setLocalUsers(prev => prev.filter(u => u.id !== userToDelete.id));
    setIsDeleteDialogOpen(false); // Close dialog immediately

    try {
      // 2. Perform API Call
      const response = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast({
        title: "User deleted",
        description: `${userToDelete.name} has been removed successfully.`,
        variant: "default",
      })

      // 3. Refresh Server Data
      router.refresh();
    } catch (error) {
      // Revert optimistic update on error
      setLocalUsers(previousUsers);
      toast({
        title: "Error",
        description: "Failed to delete user. The action has been undone.",
        variant: "destructive",
      })
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <>
      <Card className="border-border shadow-sm">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[250px] font-semibold">User</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Progress</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              localUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-secondary/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarFallback className="font-medium text-xs bg-primary/10 text-primary uppercase">
                          {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal bg-background">{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.department}</TableCell>
                  <TableCell>
                    <Badge className={
                      user.status === 'Active'
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200"
                    }>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {user.progress !== undefined ? `${user.progress}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive cursor-pointer group hover:text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDelete(user)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete
            <span className="font-medium text-foreground"> {userToDelete?.name}</span>'s account
            and remove their data from our servers.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
