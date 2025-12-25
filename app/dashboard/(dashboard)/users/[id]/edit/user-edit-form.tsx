'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  assignRoleToUser,
  removeRoleFromUser,
  syncUserPermissions,
} from '@/app/actions/permissions/user-actions';
import { toast } from 'sonner';
import { Shield, Key, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserEditFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: { id: string; name: string } | null;
    permissions: Array<{ id: string; name: string }>;
  };
  allRoles: Array<{ id: string; name: string; permissions: Array<{ id: string; name: string }> }>;
  allPermissions: Array<{ id: string; name: string }>;
}

export default function UserEditForm({ user, allRoles, allPermissions }: UserEditFormProps) {
  const [selectedRole, setSelectedRole] = useState<string>(user.role?.id || 'none');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    user.permissions.map((p) => p.id)
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRoleChange = async (roleId: string) => {
    setSelectedRole(roleId);
    setLoading(true);

    try {
      if (roleId === 'none') {
        const result = await removeRoleFromUser(user.id);
        if (result.success) {
          toast.success('Role removed successfully');
        } else {
          toast.error(result.error || 'Failed to remove role');
          setSelectedRole(user.role?.id || 'none');
        }
      } else {
        const result = await assignRoleToUser(user.id, roleId);
        if (result.success) {
          toast.success('Role assigned successfully');
        } else {
          toast.error(result.error || 'Failed to assign role');
          setSelectedRole(user.role?.id || 'none');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
      setSelectedRole(user.role?.id || 'none');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = async () => {
    setLoading(true);

    try {
      const result = await syncUserPermissions(user.id, selectedPermissions);
      
      if (result.success) {
        toast.success('Permissions updated successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update permissions');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Manage User</h1>
          <p className="text-muted-foreground">{user.name} ({user.email})</p>
        </div>
      </div>

      {/* Role Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assign Role
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={handleRoleChange}
              disabled={loading}
            >
              <SelectTrigger id="role" className="mt-2">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Role</SelectItem>
                {allRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              Roles automatically grant all permissions assigned to them.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Direct Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Direct Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Permissions</Label>
            <div className="mt-2 space-y-2 max-h-96 overflow-y-auto border rounded-md p-4">
              {allPermissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No permissions available</p>
              ) : (
                allPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                      disabled={loading}
                    />
                    <label
                      htmlFor={permission.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {permission.name}
                    </label>
                  </div>
                ))
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Direct permissions are in addition to role permissions.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSavePermissions}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Permissions'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/users')}
              disabled={loading}
            >
              Back to Users
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

