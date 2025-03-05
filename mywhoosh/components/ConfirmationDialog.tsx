"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Continue",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmationDialogProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md p-4">
        <Card className={`w-full ${isOpen ? "animate-in fade-in zoom-in-95" : "animate-out fade-out zoom-out-95"}`}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{description}</p>
            {variant === "destructive" && (
              <p className="mt-2 text-sm font-semibold text-destructive">Warning: This action cannot be undone!</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {cancelText}
            </Button>
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={() => {
                onConfirm()
                onClose()
              }}
            >
              {confirmText}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

