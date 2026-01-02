"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Search, MoreHorizontal, Edit, Trash2, Eye, EyeOff, Calendar } from "lucide-react";
import { toggleAdActive, deleteAd } from "@/app/actions/dashboard/ads/ad-actions";
import { toast } from "sonner";
import { format } from "date-fns";

type Ad = {
  id: string;
  name: string;
  type: string;
  placement: string;
  position: string | null;
  isActive: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  domains: string[];
  pages: string[];
  createdAt: string | null;
};

interface AdsTableClientProps {
  initialAds: Ad[];
}

export function AdsTableClient({ initialAds }: AdsTableClientProps) {
  const [ads, setAds] = useState(initialAds);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<Ad | null>(null);

  const filteredAds = ads.filter(
    (ad) => {
      const searchLower = search.toLowerCase();
      return (
        ad.name.toLowerCase().includes(searchLower) ||
        ad.type.toLowerCase().includes(searchLower) ||
        ad.placement.toLowerCase().includes(searchLower) ||
        (ad.position && ad.position.toLowerCase().includes(searchLower))
      );
    }
  );

  const handleToggleActive = (id: string) => {
    startTransition(async () => {
      try {
        const result = await toggleAdActive(id);
        setAds(ads.map(ad => ad.id === id ? { ...ad, isActive: result.isActive } : ad));
        toast.success(`Ad ${result.isActive ? 'activated' : 'deactivated'}`);
      } catch (error: any) {
        toast.error(error.message || "Failed to toggle ad status");
      }
    });
  };

  const handleDelete = (ad: Ad) => {
    setAdToDelete(ad);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!adToDelete) return;

    startTransition(async () => {
      try {
        await deleteAd(adToDelete.id);
        setAds(ads.filter(ad => ad.id !== adToDelete.id));
        toast.success("Ad deleted successfully");
        setDeleteDialogOpen(false);
        setAdToDelete(null);
      } catch (error: any) {
        toast.error(error.message || "Failed to delete ad");
      }
    });
  };

  const getTypeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      banner: "default",
      sidebar: "secondary",
      inline: "outline",
      popup: "destructive",
      sticky: "default",
    };
    return variants[type] || "outline";
  };

  if (ads.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground mb-4">No ads yet.</p>
          <Button asChild>
            <Link href="/dashboard/ads/create">Create First Ad</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    No ads found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAds.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.name}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeVariant(ad.type)}>
                        {ad.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ad.placement}</Badge>
                    </TableCell>
                    <TableCell>
                      {ad.position ? (
                        <Badge variant="secondary" className="text-xs">
                          {ad.position.replace(/-/g, ' ')}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.isActive ? "default" : "secondary"}>
                        {ad.isActive ? (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{ad.priority}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-0.5">
                        <div className="text-muted-foreground">
                          <span className="font-medium">{ad.impressions}</span> views
                        </div>
                        <div className="text-muted-foreground">
                          <span className="font-medium">{ad.clicks}</span> clicks
                        </div>
                        {ad.impressions > 0 && (
                          <div className="text-xs text-muted-foreground">
                            CTR: {((ad.clicks / ad.impressions) * 100).toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ad.createdAt ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <time dateTime={ad.createdAt}>
                            {format(new Date(ad.createdAt), "MMM d, yyyy")}
                          </time>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/ads/${ad.id}/edit`} className="flex items-center">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(ad.id)}
                            disabled={isPending}
                          >
                            {ad.isActive ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(ad)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the ad "{adToDelete?.name}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setAdToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

