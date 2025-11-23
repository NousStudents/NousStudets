import { BackButton } from "@/components/BackButton";
import BulkUserImport from "@/components/admin/BulkUserImport";
import { Users } from "lucide-react";

export default function BulkUsersPage() {
  return (
    <div className="container mx-auto p-6">
      <BackButton />
      <div className="flex items-center gap-3 mb-6 mt-4">
        <Users className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bulk User Import</h1>
          <p className="text-muted-foreground">Import multiple users efficiently using CSV files</p>
        </div>
      </div>
      <BulkUserImport />
    </div>
  );
}
