"use client"

import { useState } from 'react'
import { Check, ChevronsUpDown, Plus, Building, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { Badge } from '@/components/ui/badge'

interface OrganizationSelectorProps {
  className?: string
  size?: "default" | "sm" | "lg"
  showCreateButton?: boolean
}

export function OrganizationSelector({ 
  className, 
  size = "default", 
  showCreateButton = true 
}: OrganizationSelectorProps) {
  const {
    currentOrganization,
    userOrganizations,
    isLoading,
    switchOrganization,
    createOrganization,
  } = useOrganizationContext()
  
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState<string | null>(null)
  
  // Create organization form state
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    isSubmitting: false
  })
  
  const handleSwitch = async (organizationId: string) => {
    if (organizationId === currentOrganization?.id || isSwitching) return
    
    setIsSwitching(organizationId)
    try {
      await switchOrganization(organizationId)
      setOpen(false)
    } catch (error) {
      console.error('Switch failed:', error)
    } finally {
      setIsSwitching(null)
    }
  }
  
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (createForm.isSubmitting || !createForm.name.trim()) return
    
    setCreateForm(prev => ({ ...prev, isSubmitting: true }))
    try {
      const newOrg = await createOrganization({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined
      })
      
      // Switch to new organization
      await switchOrganization(newOrg.id)
      
      setCreateOpen(false)
      setCreateForm({ name: '', description: '', isSubmitting: false })
    } catch (error) {
      console.error('Create organization failed:', error)
      setCreateForm(prev => ({ ...prev, isSubmitting: false }))
    }
  }
  
  const buttonSizeClass = {
    sm: "h-8 px-2 text-sm",
    default: "h-10 px-3",
    lg: "h-11 px-4"
  }[size]
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            data-testid="organization-selector"
            className={cn(
              "justify-between min-w-0 max-w-[280px]",
              buttonSizeClass
            )}
            disabled={isLoading}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {isLoading ? 'Loading...' : currentOrganization?.name || 'Select organization'}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search organizations..." />
            <CommandList>
              <CommandEmpty>No organizations found.</CommandEmpty>
              <CommandGroup>
                {userOrganizations.map((org) => {
                  const isCurrentOrg = org.id === currentOrganization?.id
                  const isSwitchingToThis = isSwitching === org.id
                  
                  return (
                    <CommandItem
                      key={org.id}
                      value={org.name}
                      onSelect={() => handleSwitch(org.id)}
                      disabled={isSwitchingToThis}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building className="h-4 w-4 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{org.name}</div>
                            {org.description && (
                              <div className="text-sm text-muted-foreground truncate">
                                {org.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSwitchingToThis && <Loader2 className="h-4 w-4 animate-spin" />}
                          {isCurrentOrg && <Check className="h-4 w-4" />}
                          {isCurrentOrg && <Badge variant="secondary" className="text-xs">Current</Badge>}
                        </div>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              
              {showCreateButton && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                      <DialogTrigger asChild>
                        <CommandItem
                          onSelect={() => {
                            setCreateOpen(true)
                            setOpen(false)
                          }}
                          className="cursor-pointer"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create new organization
                        </CommandItem>
                      </DialogTrigger>
                    </Dialog>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Create Organization Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to manage your team and projects.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateOrganization} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter organization name"
                disabled={createForm.isSubmitting}
                autoFocus
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="org-description">Description (Optional)</Label>
              <Textarea
                id="org-description"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter organization description"
                disabled={createForm.isSubmitting}
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={createForm.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createForm.isSubmitting || !createForm.name.trim()}
              >
                {createForm.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Organization'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}