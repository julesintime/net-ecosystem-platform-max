"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus, Building2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useOrganization } from "@/lib/auth/organization-context"
import { useRouter } from "next/navigation"

export function OrganizationSwitcher() {
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const { 
    currentOrganization, 
    organizations, 
    isLoading, 
    switchOrganization 
  } = useOrganization()
  const router = useRouter()

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrganization?.id) {
      setOpen(false)
      return
    }
    
    setSwitching(true)
    try {
      await switchOrganization(orgId)
      setOpen(false)
    } catch (error) {
      console.error('Failed to switch organization:', error)
    } finally {
      setSwitching(false)
    }
  }

  const handleCreateOrganization = () => {
    setOpen(false)
    router.push('/onboarding')
  }

  const getOrgInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <Button
        variant="outline"
        role="combobox"
        className="w-[200px] justify-between"
        disabled
        data-testid="organization-switcher"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2">Loading...</span>
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          data-testid="organization-switcher"
        >
          <div className="flex items-center gap-2 truncate">
            <Avatar className="h-5 w-5">
              <AvatarImage 
                src={`https://avatar.vercel.sh/${currentOrganization?.id}.png`} 
                alt={currentOrganization?.name} 
              />
              <AvatarFallback className="text-xs" data-testid="org-avatar">
                {currentOrganization ? getOrgInitials(currentOrganization.name) : <Building2 className="h-3 w-3" />}
              </AvatarFallback>
            </Avatar>
            <span className="truncate" data-testid="current-organization">
              {currentOrganization?.name || "Select organization"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[200px] p-0" 
        data-testid="organization-dropdown"
      >
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandList>
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup heading="Organizations">
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.name}
                  onSelect={() => handleSwitch(org.id)}
                  data-testid="organization-item"
                  disabled={switching}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Avatar className="h-5 w-5">
                      <AvatarImage 
                        src={`https://avatar.vercel.sh/${org.id}.png`} 
                        alt={org.name} 
                      />
                      <AvatarFallback className="text-xs">
                        {getOrgInitials(org.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate flex-1" data-testid="org-name">
                      {org.name}
                    </span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        currentOrganization?.id === org.id 
                          ? "opacity-100" 
                          : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={handleCreateOrganization}
                data-testid="create-organization"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}