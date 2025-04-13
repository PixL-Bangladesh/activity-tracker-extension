import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { EventWithScreenshots } from "./types";
import { CHART_COLORS } from "./utils";

interface OverviewTabProps {
  networkStatusData: { name: string; value: number }[];
  consoleTypeData: { name: string; value: number }[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  networkStatusData,
  consoleTypeData,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Network Requests</CardTitle>
          <CardDescription>
            Distribution of network request statuses
          </CardDescription>
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
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {networkStatusData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px]">
              <p className="text-muted-foreground">
                No network data available
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Console Logs</CardTitle>
          <CardDescription>
            Distribution of console log types
          </CardDescription>
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
              <p className="text-muted-foreground">
                No console data available
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;