import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getAllPermissions } from "@/app/actions/permissions/permission-actions";
import { Key } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PermissionsPage() {
  // Check if user has permission to view permissions
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const canView = await hasPermission(user.id, 'view_permissions');
  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to view permissions.
          </p>
        </div>
      </div>
    );
  }

  const result = await getAllPermissions();
  const permissions = result.permissions || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Permissions</h1>
          <p className="text-muted-foreground">Manage system permissions</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/permissions/create">
            <Key className="mr-2 h-4 w-4" />
            Create Permission
          </Link>
        </Button>
      </div>

      {permissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground">No permissions yet.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/permissions/create">Create First Permission</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {permissions.map((permission) => (
            <Card key={permission.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  {permission.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/permissions/${permission.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

