"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Building2, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const createOrganizationSchema = z.object({
  organizationName: z.string()
    .min(2, "Organization name must be at least 2 characters")
    .max(50, "Organization name must be less than 50 characters"),
  organizationDescription: z.string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
})


export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingOrganizations, setCheckingOrganizations] = useState(true)

  // Form for creating organization
  const createForm = useForm<z.infer<typeof createOrganizationSchema>>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      organizationName: "",
      organizationDescription: "",
    },
  })

  // Check if user already has organizations
  useEffect(() => {
    checkUserOrganizations()
  }, [])

  const checkUserOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations/check')
      const data = await response.json()
      
      if (data.hasOrganizations) {
        // User already has organizations, redirect to home
        router.push('/')
      } else {
        setCheckingOrganizations(false)
      }
    } catch (error) {
      console.error('Error checking organizations:', error)
      setCheckingOrganizations(false)
    }
  }

  const onCreateOrganization = async (values: z.infer<typeof createOrganizationSchema>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.organizationName,
          description: values.organizationDescription,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create organization')
      }

      const data = await response.json()
      
      // Store the organization in context/session
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentOrganization', JSON.stringify(data.organization))
      }

      // Redirect to home
      router.push('/')
    } catch (error) {
      console.error('Error creating organization:', error)
      setError(error instanceof Error ? error.message : 'Failed to create organization')
    } finally {
      setIsLoading(false)
    }
  }


  if (checkingOrganizations) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to Net Ecosystem Platform</h1>
        <p className="text-muted-foreground">
          Get started by creating your organization or joining an existing one
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create Your First Organization
          </CardTitle>
          <CardDescription>
            Every user needs an organization to get started. Organizations help you manage your team, projects, and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateOrganization)} className="space-y-6">
                  <FormField
                    control={createForm.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Acme Corp" 
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          This is the display name for your organization
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="organizationDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your organization..."
                            className="resize-none"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Brief description of your organization
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Organization...
                      </>
                    ) : (
                      <>
                        Create Organization
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            You'll be the administrator of this organization and can invite team members later.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}