"use client"

import { RadioGroup, RadioGroupItem } from "@repo/ui"

export default function CommunicationChannelsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Communication Channels</h1>
      <p className="text-muted-foreground mb-4">
        Select your preferred communication channel:
      </p>
      <RadioGroup defaultValue="email">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="email" id="email" />
          <label htmlFor="email" className="cursor-pointer">
            Email
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sms" id="sms" />
          <label htmlFor="sms" className="cursor-pointer">
            SMS
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="push" id="push" />
          <label htmlFor="push" className="cursor-pointer">
            Push Notifications
          </label>
        </div>
      </RadioGroup>
    </div>
  )
}
