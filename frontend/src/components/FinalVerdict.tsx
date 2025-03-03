import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, RefreshCw } from "lucide-react";

type CardProps = React.ComponentProps<typeof Card>;

export function FinalVerdict({
  className,
  confidence = "0.0024",
  classLabel = "1",
  imageUrl = "https://picsum.photos/200",
  ...props
}: CardProps & {
  confidence?: string;
  classLabel?: string;
  imageUrl?: string;
}) {
  return (
    <Card className={cn("w-[300px]", className)} {...props}>
      <CardHeader>
        <CardTitle>Final Decision</CardTitle>
        <CardDescription>Decision based on the 5 frames</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex justify-center">
          <div className="relative w-40 h-40 rounded-md overflow-hidden border">
            <img
              src={imageUrl}
              alt="Prediction image"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex-1">
              <p className="text-sm font-medium">AVG Confidence:</p>
            </div>
            <div className="text-sm font-bold">{confidence}</div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex-1">
              <p className="text-sm font-medium">Class:</p>
            </div>
            <div className="text-sm font-bold">{classLabel}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="w-1/2" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
        <Button className="w-1/2">
          <CheckCircle className="h-4 w-4 mr-2" /> Accept
        </Button>
      </CardFooter>
    </Card>
  );
}
