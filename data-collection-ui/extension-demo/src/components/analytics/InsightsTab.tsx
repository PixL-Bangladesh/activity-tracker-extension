import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { AdvancedAnalytics } from "./types";

interface InsightsTabProps {
  analytics: AdvancedAnalytics | null;
}

const InsightsTab: React.FC<InsightsTabProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">
              No advanced analytics available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Advanced Interaction Insights</CardTitle>
          <CardDescription>
            Detailed analysis of user behavior patterns
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timing Metrics */}
          <div>
            <h3 className="text-lg font-medium mb-2">
              Timing Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">
                    Avg. Time Between Clicks
                  </div>
                  <div className="text-2xl font-bold">
                    {(
                      analytics.timingMetrics
                        .averageTimeBetweenClicks / 1000
                    ).toFixed(2)}
                    s
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">
                    Avg. Time Between Keypresses
                  </div>
                  <div className="text-2xl font-bold">
                    {(
                      analytics.timingMetrics
                        .averageTimeBetweenKeypresses / 1000
                    ).toFixed(2)}
                    s
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">
                    Total Active Time
                  </div>
                  <div className="text-2xl font-bold">
                    {(
                      analytics.timingMetrics
                        .totalActiveTime / 1000
                    ).toFixed(0)}
                    s
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">
                    Total Idle Time
                  </div>
                  <div className="text-2xl font-bold">
                    {(
                      analytics.timingMetrics
                        .totalIdleTime / 1000
                    ).toFixed(0)}
                    s
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <h3 className="text-lg font-medium mb-2">
              Top Focus Areas
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Element</TableHead>
                  <TableHead>Interactions</TableHead>
                  <TableHead>Time Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.focusAreas.map(
                  (area, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {area.element}
                      </TableCell>
                      <TableCell>
                        {area.interactionCount}
                      </TableCell>
                      <TableCell>
                        {(area.timeSpent / 1000).toFixed(1)}s
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>

          {/* Interaction Patterns */}
          <div>
            <h3 className="text-lg font-medium mb-2">
              Common Interaction Patterns
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Avg. Time Between</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.interactionPatterns
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((pattern, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {pattern.pattern}
                      </TableCell>
                      <TableCell>{pattern.count}</TableCell>
                      <TableCell>
                        {(
                          pattern.averageTimeBetween / 1000
                        ).toFixed(2)}
                        s
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Navigation Flow */}
          {analytics.navigationFlow.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">
                Navigation Flow
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.navigationFlow.map(
                    (flow, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {flow.from || "(start)"}
                        </TableCell>
                        <TableCell>{flow.to}</TableCell>
                        <TableCell>{flow.count}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightsTab;