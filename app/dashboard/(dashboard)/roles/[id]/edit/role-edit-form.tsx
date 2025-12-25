'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { updateRole, assignPermissionsToRole } from '@/app/actions/permissions/role-actions';
import { toast } from 'sonner';

interface RoleEditFormProps {
  role: {
    id: string;
    name: string;
    permissions: Array<{ id: string; name: string }>;
  };
  allPermissions: Array<{ id: string; name: string }>;
}

export default function RoleEditForm({ role, allPermissions }: RoleEditFormProps) {
  const [name, setName] = useState(role.name);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role.permissions.map((p) => p.id)
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update role name if changed
      if (name !== role.name) {
        await updateRole(role.id, name);
      }

      // Update permissions
      const result = await assignPermissionsToRole(role.id, selectedPermissions);
      
      if (result.success) {
        toast.success('Role updated successfully!');
        router.push('/dashboard/roles');
      } else {
        toast.error(result.error || 'Failed to update role');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Role</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., admin, editor, author"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-md p-4">
                {allPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                    />
                    <label
                      htmlFor={permission.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {permission.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Updating...' : 'Update Role'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/roles')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

