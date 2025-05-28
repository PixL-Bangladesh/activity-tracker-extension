import type React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface EnvironmentTabProps {
  metadata: any;
  mouseClickTargetData: { name: string; value: number }[];
}

const EnvironmentTab: React.FC<EnvironmentTabProps> = ({
  metadata,
  mouseClickTargetData,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Information</CardTitle>
        <CardDescription>Browser and system details</CardDescription>
      </CardHeader>
      <CardContent>
        {metadata ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Browser</h3>
              <p>
                <strong>Name:</strong> {metadata.browser?.name}
              </p>
              <p>
                <strong>Version:</strong> {metadata.browser?.version}
              </p>
              <p>
                <strong>User Agent:</strong> {metadata.userAgent}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">System</h3>
              <p>
                <strong>Platform:</strong> {metadata.platform}
              </p>
              <p>
                <strong>Screen Resolution:</strong>{" "}
                {metadata.screenWidth}x{metadata.screenHeight}
              </p>
              <p>
                <strong>Window Size:</strong> {metadata.windowWidth}x
                {metadata.windowHeight}
              </p>
            </div>

            {mouseClickTargetData.length > 0 && (
              <div className="col-span-2">
                <h3 className="text-sm font-medium mb-2">
                  Most Clicked Elements
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={mouseClickTargetData}
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
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">
              No environment data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnvironmentTab;