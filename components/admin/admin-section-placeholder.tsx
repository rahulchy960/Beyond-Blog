import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { buttonVariants } from "@/lib/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdminSectionPlaceholderProps = {
  title: string;
  description: string;
};

export function AdminSectionPlaceholder({
  title,
  description,
}: AdminSectionPlaceholderProps) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This section is scaffolded for the upcoming CRUD and moderation workflows.
          </p>
          <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Back to dashboard
            <ArrowRightIcon className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
