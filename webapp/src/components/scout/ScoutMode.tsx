import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ReportForm } from "./ReportForm";
import { ReportsList } from "./ReportsList";
import { Binoculars, PlusCircle, List, Leaf } from "lucide-react";

export function ScoutMode() {
  const [activeTab, setActiveTab] = useState("new");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 py-6 pb-12">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-orange-500/20 p-2">
              <Binoculars className="h-6 w-6 text-orange-400" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Scout Mode</h1>
          </div>
          <p className="text-orange-300/70 text-sm leading-relaxed">
            Help improve Atlanta's green infrastructure by reporting issues you
            encounter. Your reports help the community and earn you eco-points!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 -mt-6">
        <Card className="p-1 shadow-lg border-border/50 bg-card/80 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2 bg-secondary/50">
              <TabsTrigger
                value="new"
                className={cn(
                  "gap-2 data-[state=active]:bg-card data-[state=active]:text-orange-400",
                  "data-[state=active]:shadow-sm"
                )}
              >
                <PlusCircle className="h-4 w-4" />
                New Report
              </TabsTrigger>
              <TabsTrigger
                value="recent"
                className={cn(
                  "gap-2 data-[state=active]:bg-card data-[state=active]:text-orange-400",
                  "data-[state=active]:shadow-sm"
                )}
              >
                <List className="h-4 w-4" />
                Recent Reports
              </TabsTrigger>
            </TabsList>

            <div className="p-4">
              <TabsContent value="new" className="mt-0">
                <ReportForm
                  onSuccess={() => {
                    // Optionally switch to recent tab after submission
                  }}
                />
              </TabsContent>

              <TabsContent value="recent" className="mt-0">
                <ReportsList />
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Eco Impact Footer */}
        <div className="mt-6 mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Leaf className="h-4 w-4 text-orange-400" />
            <span>Every report helps build a greener Atlanta</span>
          </div>
        </div>
      </div>
    </div>
  );
}
