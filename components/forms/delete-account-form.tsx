"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, AlertTriangle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

const deleteAccountSchema = z.object({
  confirmation: z.string().refine(
    (val) => val === "DELETE",
    {
      message: "Please type DELETE to confirm",
    }
  ),
})

export function DeleteAccountForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof deleteAccountSchema>>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      confirmation: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof deleteAccountSchema>) => {
    if (values.confirmation !== "DELETE") {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete account")
      }

      // Account deleted successfully
      // The API will handle signing out and cleanup
      router.push("/")
    } catch (error) {
      console.error("Error deleting account:", error)
      setError(error instanceof Error ? error.message : "Failed to delete account")
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Irreversible and destructive actions
        </p>
      </div>
      <Separator />
      
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Delete Account</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Once you delete your account, there is no going back. This action will:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Permanently delete all your personal data</li>
            <li>Remove you from all organizations</li>
            <li>Revoke access to all ecosystem applications</li>
            <li>Cancel any active subscriptions</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" data-testid="delete-account-button">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription className="space-y-2">
              <p className="font-semibold text-destructive">
                This action cannot be undone.
              </p>
              <p>
                This will permanently delete your account and remove all your data
                from our servers.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <FormField
                control={form.control}
                name="confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type DELETE to confirm</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Type DELETE"
                        {...field}
                        disabled={isDeleting}
                        data-testid="delete-confirmation-input"
                        className="font-mono"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>
                      This action is permanent and cannot be reversed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false)
                    form.reset()
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isDeleting || form.watch("confirmation") !== "DELETE"}
                  data-testid="confirm-delete-button"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}