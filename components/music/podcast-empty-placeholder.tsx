import { Button } from "@/components/ui/button"
import { Podcast } from "lucide-react"

export function PodcastEmptyPlaceholder() {
  return (
    <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <Podcast className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No podcasts added</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          You have not added any podcasts. Add one below.
        </p>
        <Button size="sm" className="relative">
          Add Podcast
        </Button>
      </div>
    </div>
  )
}