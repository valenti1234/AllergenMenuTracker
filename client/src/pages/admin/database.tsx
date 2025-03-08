import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Table as TableIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface CollectionStats {
  name: string;
  count: number;
  size: number;
  avgObjSize: number;
  lastModified: string;
}

export default function DatabaseManagement() {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: collections, isLoading: isLoadingCollections } = useQuery<CollectionStats[]>({
    queryKey: ["/api/admin/database/collections"],
  });

  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["/api/admin/database/collections", selectedCollection],
    enabled: !!selectedCollection,
  });

  const dropCollectionMutation = useMutation({
    mutationFn: async (collectionName: string) => {
      await apiRequest("DELETE", `/api/admin/database/collections/${collectionName}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Collection dropped successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/database/collections"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to drop collection",
      });
    },
  });

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  if (isLoadingCollections) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <div className="flex items-center gap-4 mb-8">
            <Database className="h-8 w-8" />
            <h1 className="text-4xl font-bold">Database Management</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <Database className="h-8 w-8" />
          <h1 className="text-4xl font-bold">Database Management</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TableIcon className="h-5 w-5" />
                Collections Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collection Name</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Avg. Document Size</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections?.map((collection) => (
                    <TableRow key={collection.name}>
                      <TableCell className="font-medium">{collection.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{collection.count}</Badge>
                      </TableCell>
                      <TableCell>{formatBytes(collection.size)}</TableCell>
                      <TableCell>{formatBytes(collection.avgObjSize)}</TableCell>
                      <TableCell>
                        {new Date(collection.lastModified).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCollection(collection.name)}
                              >
                                View Documents
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>
                                  Collection: {collection.name}
                                </DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                                {isLoadingDocuments ? (
                                  <div>Loading documents...</div>
                                ) : (
                                  <pre className="text-sm">
                                    {JSON.stringify(documents, null, 2)}
                                  </pre>
                                )}
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-1"
                              >
                                <Trash2 className="h-4 w-4" />
                                Drop
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Drop Collection</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to drop the collection "{collection.name}"?
                                  This action cannot be undone and will permanently delete all documents
                                  in this collection.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => dropCollectionMutation.mutate(collection.name)}
                                >
                                  Drop Collection
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}