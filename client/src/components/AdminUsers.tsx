import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, UserX, RotateCcw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, UserRole } from "@shared/schema";

export function AdminUsers() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("user");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/users", { name, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setName("");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, disabled }: { id: string; disabled: boolean }) => {
      await apiRequest("PATCH", `/api/users/${id}`, { disabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Add User</h3>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[150px]">
            <Label className="text-xs mb-1 block">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="User name"
              className="h-9"
              data-testid="input-admin-user-name"
            />
          </div>
          <div className="w-[120px]">
            <Label className="text-xs mb-1 block">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="h-9" data-testid="select-admin-user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            data-testid="button-admin-add-user"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Add
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Role</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">Loading...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No users yet</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                  <TableCell className="text-sm font-medium">{user.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.disabled ? "destructive" : "secondary"} className="text-[10px]">
                      {user.disabled ? "Disabled" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleMutation.mutate({ id: user.id, disabled: !user.disabled })}
                      data-testid={`button-toggle-user-${user.id}`}
                    >
                      {user.disabled ? <RotateCcw className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
