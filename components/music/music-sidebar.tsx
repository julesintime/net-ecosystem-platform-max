import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { playlists } from "@/lib/music-data"

interface MusicSidebarProps {
  className?: string
}

export function MusicSidebar({ className }: MusicSidebarProps) {
  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Discover
          </h2>
          <div className="space-y-1">
            <Button variant="secondary" className="w-full justify-start">
              Listen Now
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Browse
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Radio
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Library
          </h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              Recently Added
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Recently Played
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Top Songs
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Top Albums
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Top Artists
            </Button>
          </div>
        </div>
        <div className="py-2">
          <h2 className="relative px-7 text-lg font-semibold tracking-tight">
            Playlists
          </h2>
          <ScrollArea className="h-[300px] px-1">
            <div className="space-y-1 p-2">
              {playlists?.map((playlist, i) => (
                <Button
                  key={`${playlist.name}-${i}`}
                  variant="ghost"
                  className="w-full justify-start font-normal"
                >
                  {playlist.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}