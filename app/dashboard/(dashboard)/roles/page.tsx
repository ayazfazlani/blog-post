import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getAllRoles } from "@/app/actions/permissions/role-actions";
import { Shield } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RolesPage() {
  // Check if user has permission to view roles
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const canView = await hasPermission(user.id, 'view_roles');
  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to view roles.
          </p>
        </div>
      </div>
    );
  }

  const result = await getAllRoles();
  const roles = result.roles || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="text-muted-foreground">Manage user roles and their permissions</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/roles/create">
            <Shield className="mr-2 h-4 w-4" />
            Create Role
          </Link>
        </Button>
      </div>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground">No roles yet.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/roles/create">Create First Role</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {role.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Permissions ({role.permissions.length})</p>
                    {role.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((perm: { id: string | number; name: string }) => (
                          <span
                            key={perm.id}
                            className="text-xs bg-muted px-2 py-1 rounded"
                          >
                            {perm.name}
                          </span>
                        ))}
                        {role.permissions.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{role.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No permissions assigned</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/roles/${role.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

