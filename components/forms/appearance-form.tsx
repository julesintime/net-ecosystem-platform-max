"use client"

import { useForm } from "react-hook-form"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type AppearanceFormValues = {
  theme: "light" | "dark" | "system"
  font: "inter" | "manrope" | "system"
}

const defaultValues: AppearanceFormValues = {
  theme: "system",
  font: "inter",
}

export function AppearanceForm() {
  const form = useForm<AppearanceFormValues>({
    defaultValues,
  })

  function onSubmit(data: AppearanceFormValues) {
    console.log("Appearance data:", data)
    alert("Appearance updated successfully!")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Theme</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid max-w-md grid-cols-2 gap-8 pt-2"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="light" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <Label>Light</Label>
                    </div>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="dark" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <Label>Dark</Label>
                    </div>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="system" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <Label>System</Label>
                    </div>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Select the theme for the dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="font"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Font</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid max-w-md grid-cols-2 gap-8 pt-2"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="inter" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <Label>Inter</Label>
                    </div>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="manrope" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <Label>Manrope</Label>
                    </div>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="system" />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <Label>System</Label>
                    </div>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Set the font you want to use in the dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update preferences</Button>
      </form>
    </Form>
  )
}