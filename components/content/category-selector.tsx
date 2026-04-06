import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type CategoryOption = {
  id: string;
  name: string;
};

type CategorySelectorProps = {
  categories: CategoryOption[];
  value: string;
  onValueChange: (value: string) => void;
};

export function CategorySelector({ categories, value, onValueChange }: CategorySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="categoryId">Category</Label>
      <Select
        value={value}
        onValueChange={(nextValue) => onValueChange(nextValue ?? "none")}
      >
        <SelectTrigger id="categoryId" className="w-full">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No category</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
