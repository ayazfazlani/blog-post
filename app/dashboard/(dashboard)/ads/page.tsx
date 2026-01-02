// app/dashboard/ads/page.tsx
import { getAds } from "@/app/actions/dashboard/ads/ad-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toggleAdActive, deleteAd } from "@/app/actions/dashboard/ads/ad-actions";
import { AdsTableClient } from "./components/ads-table-client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdsPage() {
  const ads = await getAds();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ads Management</h1>
          <p className="text-muted-foreground">Manage advertisements and ad placements</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/ads/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Ad
          </Link>
        </Button>
      </div>

      <AdsTableClient initialAds={ads} />
    </div>
  );
}

