import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import type { Session } from '~/types';
import { getSession, getEvents } from '~/utils/storage';
import { Skeleton } from '~/components/ui/skeleton';
import { Badge } from '~/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';

// Define colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Analytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Data structures for analytics
  const [networkData, setNetworkData] = useState<any[]>([]);
  const [consoleData, setConsoleData] = useState<any[]>([]);
  const [mouseClickData, setMouseClickData] = useState<any[]>([]);
  const [keypressData, setKeypressData] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        const sessionData = await getSession(id);
        const eventsData = await getEvents(id);
        
        setSession(sessionData as Session);
        
        // Find the start and end timestamps from events
        if (eventsData && eventsData.length > 0) {
          const startTime = eventsData[0].timestamp;
          const endTime = eventsData[eventsData.length - 1].timestamp;
          setRecordingStartTime(startTime);
          setRecordingDuration(Math.round((endTime - startTime) / 1000));
        }
        
        // Process events to extract different data types
        processEvents(eventsData);
        
        setLoading(false);
      } catch (error) {
        window.console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const processEvents = (events: any[]) => {
    const networkRequests: any[] = [];
    const consoleLogs: any[] = [];
    const mouseClicks: any[] = [];
    const keypresses: any[] = [];
    let metadataEvent = null;

    if (!events || events.length === 0) {
      window.console.log("No events to process");
      return;
    }

    window.console.log(`Processing ${events.length} events`);

    events.forEach((event, index) => {
      // Debug first few events to see their structure
      if (index < 5) {
        window.console.log(`Event ${index}:`, event);
      }

      // Process rrweb custom events (type 5 with custom tag)
      if (event.type === 5 && event.data?.tag === 'custom') {
        const payload = event.data.payload;
        window.console.log('Found custom event:', payload);
        
        if (payload.type === 'network') {
          networkRequests.push({
            ...payload.data,
            timestamp: event.timestamp
          });
        } else if (payload.type === 'consoleLog') {
          consoleLogs.push({
            ...payload.data,
            timestamp: event.timestamp
          });
        } else if (payload.type === 'mouseClick') {
          mouseClicks.push({
            ...payload.data,
            timestamp: event.timestamp
          });
        } else if (payload.type === 'keypress') {
          keypresses.push({
            ...payload.data,
            timestamp: event.timestamp
          });
        } else if (payload.type === 'metadata') {
          metadataEvent = payload.data;
        }
      }
      
      // Process console logs from rrweb plugin
      if (event.type === 6) { // Console plugin event type
        if (event.data?.plugin === 'rrweb/console') {
          consoleLogs.push({
            level: event.data.payload.level,
            message: JSON.stringify(event.data.payload.payload),
            timestamp: event.timestamp
          });
        }
      }
    });

    window.console.log(`Processed data:
      Network requests: ${networkRequests.length}
      Console logs: ${consoleLogs.length}
      Mouse clicks: ${mouseClicks.length}
      Keypresses: ${keypresses.length}
      Metadata: ${metadataEvent ? 'Yes' : 'No'}
    `);

    setNetworkData(networkRequests);
    setConsoleData(consoleLogs);
    setMouseClickData(mouseClicks);
    setKeypressData(keypresses);
    setMetadata(metadataEvent);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <div className="container mx-auto p-4">Session not found</div>;
  }

  // Prepare data for charts
  const networkStatusData = networkData.reduce((acc: { name: string, value: number }[], curr) => {
    const status = typeof curr.status === 'number' 
      ? curr.status >= 200 && curr.status < 300 ? '2xx' 
        : curr.status >= 300 && curr.status < 400 ? '3xx'
        : curr.status >= 400 && curr.status < 500 ? '4xx'
        : curr.status >= 500 ? '5xx' : 'Other'
      : 'Error';
    
    const existingItem = acc.find(item => item.name === status);
    if (existingItem) {
      existingItem.value += 1;
    } else {
      acc.push({ name: status, value: 1 });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  const consoleTypeData = consoleData.reduce((acc: { name: string, value: number }[], curr) => {
    const level = curr.level || 'unknown';
    
    const existingItem = acc.find(item => item.name === level);
    if (existingItem) {
      existingItem.value += 1;
    } else {
      acc.push({ name: level, value: 1 });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  const mouseClickTargetData = mouseClickData.reduce((acc: { name: string, value: number }[], curr) => {
    const target = curr.target || 'unknown';
    
    const existingItem = acc.find(item => item.name === target);
    if (existingItem) {
      existingItem.value += 1;
    } else {
      acc.push({ name: target, value: 1 });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Session Analytics: {session.name}</h1>
        <p className="text-muted-foreground">
          Recorded on {new Date(session.createTimestamp).toLocaleString()} • 
          Duration: {recordingDuration}s
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="network">Network ({networkData.length})</TabsTrigger>
            <TabsTrigger value="console">Console ({consoleData.length})</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Network Requests</CardTitle>
                  <CardDescription>Distribution of network request statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  {networkStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={networkStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {networkStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px]">
                      <p className="text-muted-foreground">No network data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Console Logs</CardTitle>
                  <CardDescription>Distribution of console log types</CardDescription>
                </CardHeader>
                <CardContent>
                  {consoleTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={consoleTypeData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px]">
                      <p className="text-muted-foreground">No console data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Interactions</CardTitle>
                  <CardDescription>Mouse clicks and keypresses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Mouse Clicks</h3>
                      <div className="text-3xl font-bold">{mouseClickData.length}</div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Keypresses</h3>
                      <div className="text-3xl font-bold">{keypressData.length}</div>
                    </div>
                  </div>

                  {mouseClickTargetData.length > 0 ? (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Most Clicked Elements</h3>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart
                          data={mouseClickTargetData.slice(0, 5)}
                          layout="vertical"
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={80} />
                          <RechartsTooltip />
                          <Bar dataKey="value" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Environment</CardTitle>
                  <CardDescription>Browser and system information</CardDescription>
                </CardHeader>
                <CardContent>
                  {metadata ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Browser:</span>
                        <span>{metadata.userAgent?.split(' ').slice(-1)[0] || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform:</span>
                        <span>{metadata.platform || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Screen:</span>
                        <span>{metadata.screenWidth}x{metadata.screenHeight}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Window:</span>
                        <span>{metadata.windowWidth}x{metadata.windowHeight}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pixel Ratio:</span>
                        <span>{metadata.devicePixelRatio}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No environment data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network">
            <Card>
              <CardHeader>
                <CardTitle>Network Requests</CardTitle>
                <CardDescription>All captured network requests during the session</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {networkData.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>URL</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {networkData.map((request, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs truncate max-w-[300px]">
                              {request.url}
                            </TableCell>
                            <TableCell>
                              <Badge variant={request.method === 'GET' ? 'default' : 'secondary'}>
                                {request.method}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {typeof request.status === 'number' ? (
                                <Badge
                                  variant={
                                    request.status >= 200 && request.status < 300 ? 'default' :
                                      request.status >= 300 && request.status < 400 ? 'secondary' :
                                        'destructive'
                                  }
                                >
                                  {request.status}
                                </Badge>
                              ) : (
                                <Badge variant="outline">{request.status}</Badge>
                              )}
                            </TableCell>
                            <TableCell>{request.type}</TableCell>
                            <TableCell>
                              {request.duration ? `${request.duration}ms` : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">No network requests captured</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Console Tab */}
          <TabsContent value="console">
            <Card>
              <CardHeader>
                <CardTitle>Console Logs</CardTitle>
                <CardDescription>All captured console logs during the session</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {consoleData.length > 0 ? (
                    <div className="space-y-2">
                      {consoleData.map((log, index) => (
                        <div key={index} className="p-2 border rounded-md">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                log.level === 'error' ? 'destructive' :
                                  log.level === 'warn' ? 'secondary' :
                                    'default'
                              }
                            >
                              {log.level}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                            {log.message}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">No console logs captured</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interactions Tab */}
          <TabsContent value="interactions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mouse Clicks</CardTitle>
                  <CardDescription>All captured mouse clicks during the session</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {mouseClickData.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Element</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Button</TableHead>
                            <TableHead>Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mouseClickData.map((click, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Badge variant="outline">{click.target}</Badge>
                              </TableCell>
                              <TableCell>
                                {click.x}, {click.y}
                              </TableCell>
                              <TableCell>
                                {click.button === 0 ? 'Left' :
                                  click.button === 1 ? 'Middle' :
                                    click.button === 2 ? 'Right' : click.button}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(click.timestamp).toLocaleTimeString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex items-center justify-center h-[300px]">
                        <p className="text-muted-foreground">No mouse clicks captured</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Keypresses</CardTitle>
                  <CardDescription>All captured keypresses during the session</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {keypressData.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Modifier</TableHead>
                            <TableHead>Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {keypressData.map((keypress, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Badge>{keypress.key}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{keypress.target}</Badge>
                              </TableCell>
                              <TableCell>
                                {keypress.isMetaKey ? 'Yes' : 'No'}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(keypress.timestamp).toLocaleTimeString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex items-center justify-center h-[300px]">
                        <p className="text-muted-foreground">No keypresses captured</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Environment Tab */}
          <TabsContent value="environment">
            <Card>
              <CardHeader>
                <CardTitle>Environment Details</CardTitle>
                <CardDescription>Browser and system information</CardDescription>
              </CardHeader>
              <CardContent>
                {metadata ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Browser Information</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">User Agent</h4>
                          <p className="font-mono text-xs mt-1 break-all">{metadata.userAgent}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Language</h4>
                          <p>{metadata.language}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Platform</h4>
                          <p>{metadata.platform}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Display Information</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Screen Resolution</h4>
                          <p>{metadata.screenWidth} × {metadata.screenHeight} pixels</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Window Size</h4>
                          <p>{metadata.windowWidth} × {metadata.windowHeight} pixels</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Device Pixel Ratio</h4>
                          <p>{metadata.devicePixelRatio}</p>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <h3 className="text-lg font-medium mb-4">Visual Representation</h3>
                      <div className="border rounded-md p-4 bg-muted/30">
                        <div
                          className="relative mx-auto border-2 border-primary rounded-md overflow-hidden"
                          style={{
                            width: `${Math.min(metadata.windowWidth / 2, 600)}px`,
                            height: `${Math.min(metadata.windowHeight / 2, 400)}px`,
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Window Size</p>
                          </div>
                        </div>
                        <div className="mt-4 text-center text-xs text-muted-foreground">
                          <p>This represents the user's browser window at {Math.round(50)}% scale</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No environment data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
