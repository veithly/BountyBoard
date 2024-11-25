"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-2xl",
      "bg-black/40 backdrop-blur-sm border border-purple-500/20",
      "p-1.5 text-purple-200/70",
      "shadow-lg shadow-purple-500/10",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap",
      "rounded-xl px-4 py-2 text-sm font-medium",
      "relative overflow-hidden",
      "transition-all duration-200",
      // Default state
      "text-purple-200/70 hover:text-purple-100",
      "hover:bg-purple-500/10",
      // Focus state
      "focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-purple-500 focus-visible:ring-offset-2",
      // Disabled state
      "disabled:pointer-events-none disabled:opacity-50",
      // Active state
      "data-[state=active]:bg-purple-500/20",
      "data-[state=active]:text-purple-100",
      "data-[state=active]:shadow-sm",
      "data-[state=active]:backdrop-blur-sm",
      // Active state with glow effect
      "data-[state=active]:after:absolute",
      "data-[state=active]:after:inset-0",
      "data-[state=active]:after:rounded-xl",
      "data-[state=active]:after:bg-purple-500/10",
      "data-[state=active]:after:blur-md",
      "data-[state=active]:after:-z-10",
      // Animation
      "motion-safe:transition-all",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 rounded-xl",
      "ring-offset-background",
      "focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-purple-500 focus-visible:ring-offset-2",
      // Animation
      "motion-safe:animate-in motion-safe:fade-in-50",
      "motion-safe:slide-in-from-bottom-1",
      "data-[state=inactive]:motion-safe:animate-out",
      "data-[state=inactive]:motion-safe:fade-out-0",
      "data-[state=inactive]:motion-safe:slide-out-to-bottom-1",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
