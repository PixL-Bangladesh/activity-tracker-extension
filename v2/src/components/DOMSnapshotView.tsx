import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Info } from 'lucide-react';
import { Skeleton } from '~/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog';

interface DOMSnapshotViewProps {
  snapshots: any[];
  loading: boolean;
}

const DOMSnapshotView: React.FC<DOMSnapshotViewProps> = ({ snapshots, loading }) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const viewSnapshot = (snapshot: any) => {
    setSelectedSnapshot(snapshot);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>DOM Snapshots</CardTitle>
          <CardDescription>DOM state at various points during the session</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No DOM snapshots available for this session</div>
          ) : (
            <div className="space-y-4">
              {snapshots.map((snapshot, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">
                      {snapshot.type === 'initial' ? 'Initial DOM Snapshot' : 'Click DOM Snapshot'}
                    </CardTitle>
                    <CardDescription>
                      {new Date(snapshot.timestamp).toLocaleTimeString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 truncate max-w-md">
                        {snapshot.url || 'Unknown URL'}
                        {snapshot.target && ` - Clicked: ${snapshot.target}`}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => viewSnapshot(snapshot)}
                        className="flex items-center gap-1"
                      >
                        <Info size={14} />
                        View Snapshot
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>DOM Snapshot Details</DialogTitle>
          </DialogHeader>
          {selectedSnapshot && (
            <div className="mt-4">
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Timestamp: {new Date(selectedSnapshot.timestamp).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  URL: {selectedSnapshot.url || 'Unknown URL'}
                </p>
                {selectedSnapshot.target && (
                  <p className="text-sm text-gray-500">
                    Clicked Element: {selectedSnapshot.target}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[60vh]">
                <pre className="text-xs">
                  {JSON.stringify(selectedSnapshot.snapshot, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DOMSnapshotView;
