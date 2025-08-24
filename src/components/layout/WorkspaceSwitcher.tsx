import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";
import { useState } from "react";

export const WorkspaceSwitcher = () => {
  const [open, setOpen] = useState(false);
  const { currentWorkspace, workspaces } = useWorkspaceContext();
  const { switchToWorkspace } = useWorkspaceNavigation();

  if (!currentWorkspace) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select workspace"
          className="w-[200px] justify-between"
        >
          <div className="flex items-center truncate">
            <div className="flex h-5 w-5 items-center justify-center rounded border bg-background text-xs font-medium">
              {currentWorkspace.name.charAt(0).toUpperCase()}
            </div>
            <span className="ml-2 truncate">{currentWorkspace.name}</span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search workspace..." />
          <CommandList>
            <CommandEmpty>No workspace found.</CommandEmpty>
            <CommandGroup heading="Workspaces">
              {workspaces.map((workspace) => (
                <CommandItem
                  key={workspace.id}
                  value={workspace.name}
                  onSelect={() => {
                    switchToWorkspace(workspace.id);
                    setOpen(false);
                  }}
                  className="text-sm"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded border bg-background text-xs font-medium">
                    {workspace.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="ml-2 truncate">{workspace.name}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      currentWorkspace.id === workspace.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  // TODO: Implement create workspace functionality
                }}
              >
                <Plus className="h-4 w-4" />
                <span className="ml-2">Create Workspace</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  // TODO: Implement workspace settings
                }}
              >
                <Settings className="h-4 w-4" />
                <span className="ml-2">Workspace Settings</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};