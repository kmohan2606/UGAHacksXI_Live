import { Sparkles, Shield, Leaf, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { GeminiRecommendation as GeminiRecommendationType } from "../../../../backend/src/types";

interface GeminiRecommendationProps {
  recommendation: GeminiRecommendationType;
  className?: string;
}

export function GeminiRecommendation({
  recommendation,
  className,
}: GeminiRecommendationProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden bg-emerald-500/5 border-emerald-500/20",
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />
      </div>

      <CardHeader className="relative pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md shadow-emerald-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">Gemini Recommends</h3>
            <p className="text-xs text-emerald-400">AI-powered route analysis</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <p className="text-foreground/80 leading-relaxed">{recommendation.reasoning}</p>

        {recommendation.healthAdvisory && (
          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-400 text-sm">Health Advisory</p>
              <p className="text-sm text-amber-400/80 mt-0.5">
                {recommendation.healthAdvisory}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
          <ScoreMeter
            icon={<Shield className="h-4 w-4" />}
            label="Safety Score"
            score={recommendation.safetyScore}
            colorClass="from-emerald-500 to-green-500"
            bgColorClass="bg-emerald-500/20"
            textColorClass="text-emerald-400"
          />
          <ScoreMeter
            icon={<Leaf className="h-4 w-4" />}
            label="Eco Score"
            score={recommendation.ecoScore}
            colorClass="from-teal-500 to-cyan-500"
            bgColorClass="bg-teal-500/20"
            textColorClass="text-teal-400"
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface ScoreMeterProps {
  icon: React.ReactNode;
  label: string;
  score: number;
  colorClass: string;
  bgColorClass: string;
  textColorClass: string;
}

function ScoreMeter({ icon, label, score, colorClass, bgColorClass, textColorClass }: ScoreMeterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-md", bgColorClass, textColorClass)}>{icon}</div>
        <span className={cn("text-sm font-medium", textColorClass)}>{label}</span>
      </div>
      <div className="relative">
        <Progress
          value={score}
          className="h-2 bg-secondary/50"
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-500",
            colorClass
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className={cn("text-right text-sm font-semibold", textColorClass)}>{score}%</p>
    </div>
  );
}
