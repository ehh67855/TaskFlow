import React from "react";
import { RotateCcw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_NETWORK_SETTINGS,
  SETTINGS_SCHEMA,
  SETTINGS_TABS,
  getPath,
  setPath,
} from "@/lib/network-settings";

function Field({ field, settings, onChange }) {
  const value = getPath(settings, field.path);

  if (field.type === "checkbox") {
    return (
      <div className="flex items-center justify-between gap-3 py-1.5">
        <Label htmlFor={field.path} className="text-sm font-normal">
          {field.label}
        </Label>
        <Checkbox
          id={field.path}
          checked={!!value}
          onCheckedChange={(checked) => onChange(field.path, !!checked)}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="flex items-center justify-between gap-3 py-1.5">
        <Label className="text-sm font-normal">{field.label}</Label>
        <Select value={String(value)} onValueChange={(v) => onChange(field.path, v)}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === "text") {
    return (
      <div className="flex items-center justify-between gap-3 py-1.5">
        <Label htmlFor={field.path} className="text-sm font-normal">
          {field.label}
        </Label>
        <Input
          id={field.path}
          className="w-40 h-8 text-xs"
          placeholder={field.placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(field.path, e.target.value)}
        />
      </div>
    );
  }

  // range
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={field.path} className="text-sm font-normal">
          {field.label}
        </Label>
        <span className="text-xs text-muted-foreground tabular-nums">{value}</span>
      </div>
      <input
        id={field.path}
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value ?? 0}
        onChange={(e) => onChange(field.path, parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

export default function NetworkSettingsDialog({ open, onOpenChange, settings, onChange, onReset }) {
  const handleFieldChange = (path, value) => {
    onChange(setPath(settings, path, value));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Network Display Settings</DialogTitle>
          <DialogDescription>
            Customize how this graph looks and behaves - node styling, edge styling, physics
            simulation, layout, and interaction. Changes apply live and are saved for this
            network.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="nodes" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-5 w-full">
            {SETTINGS_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {SETTINGS_TABS.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className="overflow-y-auto flex-1 px-1 divide-y divide-border"
            >
              {SETTINGS_SCHEMA.filter((f) => f.tab === tab.id)
                .filter((f) => !f.showIf || f.showIf(settings))
                .map((field) => (
                  <Field
                    key={field.path}
                    field={field}
                    settings={settings}
                    onChange={handleFieldChange}
                  />
                ))}
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter className="pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => onReset(DEFAULT_NETWORK_SETTINGS)}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
