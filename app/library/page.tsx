"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { AlbumArtwork } from "@/components/music/album-artwork"
import { MusicSidebar } from "@/components/music/music-sidebar"
import { PodcastEmptyPlaceholder } from "@/components/music/podcast-empty-placeholder"
import { listenNowAlbums, madeForYouAlbums } from "@/lib/music-data"
import { Menu, PlusCircle } from "lucide-react"

export default function LibraryPage() {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b md:hidden flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">
                Music Library Navigation
              </SheetTitle>
              <MusicSidebar />
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold truncate">Library</h1>
        </div>
        <Button size="sm" className="flex-shrink-0">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 border-r flex-shrink-0">
          <MusicSidebar />
        </div>
        
        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Tabs defaultValue="music" className="flex-1 flex flex-col overflow-hidden">
            
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between p-6 pb-4 border-b flex-shrink-0">
              <TabsList>
                <TabsTrigger value="music">Music</TabsTrigger>
                <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
                <TabsTrigger value="live" disabled>Live</TabsTrigger>
              </TabsList>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add music
              </Button>
            </div>

            {/* Mobile Tabs */}
            <div className="md:hidden px-3 sm:px-4 py-2 border-b flex-shrink-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="music">Music</TabsTrigger>
                <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
                <TabsTrigger value="live" disabled>Live</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Tab Contents */}
            <div className="flex-1 overflow-hidden">
              <TabsContent value="music" className="h-full m-0 border-none p-0 outline-none">
                <div className="h-full overflow-y-auto overflow-x-hidden">
                  <div className="px-3 sm:px-4 md:px-6 pb-4 space-y-8">
                    
                    {/* Listen Now Section */}
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                          Listen Now
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Top picks for you. Updated daily.
                        </p>
                      </div>
                      <Separator />
                      
                      <div className="relative w-full overflow-hidden">
                        <ScrollArea className="w-full">
                          <div className="flex space-x-4 pb-4">
                            {listenNowAlbums.map((album) => (
                              <div key={album.name} className="flex-shrink-0">
                                <AlbumArtwork
                                  album={album}
                                  className="w-[150px] sm:w-[180px] md:w-[250px]"
                                  aspectRatio="portrait"
                                  width={250}
                                  height={330}
                                />
                              </div>
                            ))}
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      </div>
                    </div>

                    {/* Made for You Section */}
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                          Made for You
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Your personal playlists. Updated daily.
                        </p>
                      </div>
                      <Separator />
                      
                      <div className="relative w-full overflow-hidden">
                        <ScrollArea className="w-full">
                          <div className="flex space-x-4 pb-4">
                            {madeForYouAlbums.map((album) => (
                              <div key={album.name} className="flex-shrink-0">
                                <AlbumArtwork
                                  album={album}
                                  className="w-[120px] sm:w-[130px] md:w-[150px]"
                                  aspectRatio="square"
                                  width={150}
                                  height={150}
                                />
                              </div>
                            ))}
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="podcasts" className="h-full m-0 border-none p-0 outline-none">
                <div className="h-full overflow-y-auto">
                  <div className="px-3 sm:px-4 md:px-6 pb-4 space-y-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                        New Episodes
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Your favorite podcasts. Updated daily.
                      </p>
                    </div>
                    <Separator />
                    <PodcastEmptyPlaceholder />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="live" className="h-full m-0 border-none p-0 outline-none">
                <div className="h-full overflow-y-auto">
                  <div className="px-3 sm:px-4 md:px-6 pb-4 space-y-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                        Live
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Coming soon.
                      </p>
                    </div>
                    <Separator />
                    <div className="flex h-[200px] shrink-0 items-center justify-center rounded-md border border-dashed">
                      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                        <h3 className="mt-4 text-lg font-semibold">Live content coming soon</h3>
                        <p className="mb-4 mt-2 text-sm text-muted-foreground">
                          Stay tuned for live streaming content.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
            
          </Tabs>
        </div>
        
      </div>
    </div>
  )
}