"use client"

import * as React from "react"
import { Archive, ArchiveX, ArrowLeft, File, Inbox, Send, Users2, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { MailDisplay } from "@/components/mail/mail-display"
import { MailList } from "@/components/mail/mail-list"
import { Nav } from "@/components/nav"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { mails } from "@/lib/mail-data"
import { Search } from "lucide-react"

interface Mail {
  id: string
  name: string
  email: string
  subject: string
  text: string
  date: string
  read: boolean
  labels: string[]
}


export default function InboxPage() {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [selectedMail, setSelectedMail] = React.useState<Mail | null>(null)
  const [showMailView, setShowMailView] = React.useState(false)
  
  const defaultLayout = [20, 32, 48]
  const navCollapsedSize = 4

  const handleMailSelect = (mail: Mail) => {
    setSelectedMail(mail)
    setShowMailView(true)
  }

  const handleBackToList = () => {
    setShowMailView(false)
    setSelectedMail(null)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-full flex flex-col">
        
        {/* Mobile View */}
        <div className="flex flex-col h-full md:hidden">
          {!showMailView ? (
            // Mobile Mail List View
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                      <SheetTitle className="sr-only">
                        Mail Navigation
                      </SheetTitle>
                      <Nav
                        isCollapsed={false}
                        links={[
                          {
                            title: "Inbox",
                            label: "128",
                            icon: Inbox,
                            variant: "default",
                          },
                          {
                            title: "Drafts",
                            label: "9",
                            icon: File,
                            variant: "ghost",
                          },
                          {
                            title: "Sent",
                            label: "",
                            icon: Send,
                            variant: "ghost",
                          },
                          {
                            title: "Junk",
                            label: "23",
                            icon: ArchiveX,
                            variant: "ghost",
                          },
                          {
                            title: "Archive",
                            label: "",
                            icon: Archive,
                            variant: "ghost",
                          },
                          {
                            title: "Social",
                            label: "972",
                            icon: Users2,
                            variant: "ghost",
                          },
                        ]}
                      />
                    </SheetContent>
                  </Sheet>
                  <h1 className="text-xl font-bold">Inbox</h1>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="all" className="flex-1 flex flex-col">
                <div className="px-4 py-2 border-b">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">All mail</TabsTrigger>
                    <TabsTrigger value="unread">Unread</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="flex-1 m-0">
                  <MailList 
                    items={mails} 
                    selectedMail={selectedMail} 
                    onMailSelect={handleMailSelect} 
                  />
                </TabsContent>
                <TabsContent value="unread" className="flex-1 m-0">
                  <MailList 
                    items={mails.filter(mail => !mail.read)} 
                    selectedMail={selectedMail} 
                    onMailSelect={handleMailSelect} 
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            // Mobile Mail Detail View
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 p-6 border-b">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-medium truncate">
                  {selectedMail?.subject}
                </h1>
              </div>
              <div className="flex-1">
                <MailDisplay mail={selectedMail} />
              </div>
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex h-full">
          <ResizablePanelGroup
            direction="horizontal"
            onLayout={(sizes: number[]) => {
              document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
                sizes
              )}`
            }}
            className="h-full items-stretch"
          >
            <ResizablePanel
              defaultSize={defaultLayout[0]}
              collapsedSize={navCollapsedSize}
              collapsible={true}
              minSize={15}
              maxSize={20}
              onCollapse={() => {
                setIsCollapsed(true)
                document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                  true
                )}`
              }}
              onResize={() => {
                setIsCollapsed(false)
                document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                  false
                )}`
              }}
              className={cn(
                isCollapsed &&
                  "min-w-[50px] transition-all duration-300 ease-in-out"
              )}
            >
              <Nav
                isCollapsed={isCollapsed}
                links={[
                  {
                    title: "Inbox",
                    label: "128",
                    icon: Inbox,
                    variant: "default",
                  },
                  {
                    title: "Drafts",
                    label: "9",
                    icon: File,
                    variant: "ghost",
                  },
                  {
                    title: "Sent",
                    label: "",
                    icon: Send,
                    variant: "ghost",
                  },
                  {
                    title: "Junk",
                    label: "23",
                    icon: ArchiveX,
                    variant: "ghost",
                  },
                  {
                    title: "Archive",
                    label: "",
                    icon: Archive,
                    variant: "ghost",
                  },
                  {
                    title: "Social",
                    label: "972",
                    icon: Users2,
                    variant: "ghost",
                  },
                ]}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
              <Tabs defaultValue="all" className="h-full flex flex-col">
                <div className="flex items-center px-4 py-2">
                  <h1 className="text-xl font-bold">Inbox</h1>
                  <TabsList className="ml-auto">
                    <TabsTrigger value="all">All mail</TabsTrigger>
                    <TabsTrigger value="unread">Unread</TabsTrigger>
                  </TabsList>
                </div>
                <Separator />
                <div className="bg-background/95 p-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <form>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search" className="pl-8" />
                    </div>
                  </form>
                </div>
                <TabsContent value="all" className="m-0 flex-1">
                  <MailList items={mails} selectedMail={selectedMail} onMailSelect={setSelectedMail} />
                </TabsContent>
                <TabsContent value="unread" className="m-0 flex-1">
                  <MailList items={mails.filter(mail => !mail.read)} selectedMail={selectedMail} onMailSelect={setSelectedMail} />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={defaultLayout[2]} className="hidden lg:block">
              <MailDisplay mail={selectedMail} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        
      </div>
    </TooltipProvider>
  )
}