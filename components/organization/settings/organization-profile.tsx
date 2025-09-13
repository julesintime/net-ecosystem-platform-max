"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Building2, Save, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { 
  OrganizationWithStats,
  OrganizationProfileFormData,
  isValidOrganizationName,
} from "@/lib/types/organization"

// Form validation schema
const organizationProfileSchema = z.object({
  name: z.string()
    .min(2, "Organization name must be at least 2 characters")
    .max(128, "Organization name must be less than 128 characters")
    .refine(isValidOrganizationName, "Invalid organization name format"),
  description: z.string()
    .max(512, "Description must be less than 512 characters")
    .optional(),
  isPublic: z.boolean().default(false),
  allowPublicJoin: z.boolean().default(false),
  isMfaRequired: z.boolean().default(false),
})

type OrganizationProfileFormValues = z.infer<typeof organizationProfileSchema>

interface OrganizationProfileProps {
  organization: OrganizationWithStats
  onUpdate: (data: OrganizationProfileFormData) => Promise<void>
  isLoading?: boolean
}

export function OrganizationProfile({
  organization,
  onUpdate,
  isLoading = false,
}: OrganizationProfileProps) {
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const form = useForm<OrganizationProfileFormValues>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: {
      name: organization.name || "",
      description: organization.description || "",
      isPublic: organization.customData?.isPublic as boolean || false,
      allowPublicJoin: organization.customData?.allowPublicJoin as boolean || false,
      isMfaRequired: organization.isMfaRequired || false,
    },
  })

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        form.setError("root", { message: "Logo file must be less than 2MB" })
        return
      }

      if (!file.type.startsWith('image/')) {
        form.setError("root", { message: "Please select a valid image file" })
        return
      }

      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const onSubmit = async (values: OrganizationProfileFormValues) => {
    try {
      // In a real implementation, you'd upload the logo first if present
      let logoUrl = logoPreview
      
      if (logoFile) {
        // Upload logo to your storage service
        // logoUrl = await uploadLogo(logoFile)
        console.log("Logo upload would happen here:", logoFile.name)
      }

      await onUpdate({
        name: values.name,
        description: values.description,
        isPublic: values.isPublic,
        allowPublicJoin: values.allowPublicJoin,
        isMfaRequired: values.isMfaRequired,
        customData: {
          ...organization.customData,
          logo: logoUrl,
          isPublic: values.isPublic,
          allowPublicJoin: values.allowPublicJoin,
        },
      })
    } catch (error) {
      console.error('Failed to update organization:', error)
    }
  }

  const hasChanges = form.formState.isDirty || logoFile !== null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">Organization Profile</h3>
        <p className="text-sm text-muted-foreground">
          Update your organization's public information and settings.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Logo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Organization Logo</span>
              </CardTitle>
              <CardDescription>
                Upload a logo to represent your organization. Recommended size: 256x256 pixels, max 2MB.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage 
                    src={logoPreview || organization.customData?.logo as string} 
                    alt={organization.name} 
                  />
                  <AvatarFallback className="text-lg">
                    {organization.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {logoFile ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    {(logoPreview || logoFile) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={removeLogo}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                  {logoFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {logoFile.name} ({Math.round(logoFile.size / 1024)}KB)
                    </p>
                  )}
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your organization's name and description.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your organization's display name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder="Tell people about your organization..."
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of your organization (optional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Privacy & Access Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Access</CardTitle>
              <CardDescription>
                Control who can see and join your organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Public Organization</FormLabel>
                      <FormDescription>
                        Make your organization visible in public directories and search results.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowPublicJoin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Allow Public Join</FormLabel>
                      <FormDescription>
                        Let anyone request to join your organization without an invitation.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!form.watch("isPublic")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("allowPublicJoin") && !form.watch("isPublic") && (
                <Alert>
                  <AlertDescription>
                    Public join requires the organization to be public.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security requirements for organization members.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isMfaRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Require Multi-Factor Authentication</FormLabel>
                      <FormDescription>
                        Require all organization members to enable MFA on their accounts.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("isMfaRequired") && (
                <Alert>
                  <AlertDescription>
                    <strong>Note:</strong> Existing members will be prompted to enable MFA 
                    the next time they sign in. New members will be required to set up MFA 
                    before they can access organization resources.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Organization Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Stats</CardTitle>
              <CardDescription>
                Current organization information and usage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{organization.memberCount}</div>
                  <div className="text-sm text-muted-foreground">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{organization.pendingInvitations}</div>
                  <div className="text-sm text-muted-foreground">Pending Invitations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {organization.createdAtDate.getFullYear()}
                  </div>
                  <div className="text-sm text-muted-foreground">Year Created</div>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-sm">
                    {organization.customData?.plan as string || 'Free'}
                  </Badge>
                  <div className="text-sm text-muted-foreground">Plan</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {hasChanges ? "You have unsaved changes" : "All changes saved"}
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  removeLogo()
                }}
                disabled={!hasChanges || isLoading}
              >
                Discard Changes
              </Button>
              <Button 
                type="submit" 
                disabled={!hasChanges || isLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {form.formState.errors.root && (
            <Alert variant="destructive">
              <AlertDescription>
                {form.formState.errors.root.message}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Form>
    </div>
  )
}