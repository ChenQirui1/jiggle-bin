import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowUpFromLine, Recycle } from "lucide-react";

// Waste category options
const categories = [
  {
    id: "general",
    label: "General",
  },
  // {
  //   id: "recyclable",
  //   label: "Recyclable",
  // },
  // {
  //   id: "paper",
  //   label: "Paper",
  // },
  // {
  //   id: "plastic",
  //   label: "Plastic",
  // },
];

type CardProps = React.ComponentProps<typeof Card> & {
  onSubmit?: (category: string) => void;
};

export function ChooseModelCard({ className, onSubmit, ...props }: CardProps) {
  const [selectedCategory, setSelectedCategory] = useState("general");

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(selectedCategory);
    }
  };

  return (
    <Card className={cn("w-[380px]", className)} {...props}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center mb-2">
          <CardTitle>Waste Classification</CardTitle>
          <Button
            size="sm"
            onClick={handleSubmit}
            className="flex items-center gap-1"
          >
            <ArrowUpFromLine className="h-4 w-4" />
            <span>Submit</span>
          </Button>
        </div>
        <CardDescription>
          Select the appropriate category for this item
        </CardDescription>
      </CardHeader>

      <CardContent>
        <RadioGroup
          defaultValue="general"
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="grid gap-3"
        >
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-slate-50"
              onClick={() => setSelectedCategory(category.id)}
            >
              <RadioGroupItem value={category.id} id={category.id} />
              <Label
                htmlFor={category.id}
                className="flex flex-1 items-center gap-3 cursor-pointer"
              >
                <Recycle
                  className={cn(
                    "h-5 w-5",
                    category.id === "general"
                      ? "text-gray-500"
                      : category.id === "recyclable"
                      ? "text-green-500"
                      : category.id === "paper"
                      ? "text-blue-500"
                      : "text-yellow-500"
                  )}
                />
                <div className="flex-1 font-medium">{category.label}</div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>

      <CardFooter className="pt-2">
        <p className="text-sm text-muted-foreground">
          Select the appropriate category and submit to record your
          classification
        </p>
      </CardFooter>
    </Card>
  );
}
