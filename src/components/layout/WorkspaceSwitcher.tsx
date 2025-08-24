import { Check, ChevronsUpDown, Plus, Search, UserPlus, Building2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useState } from "react";
import { toast } from "sonner";

const WorkspaceAvatar = ({ name, className }: { name: string; className?: string }) => (
  <div className={cn("flex h-6 w-6 items-center justify-center rounded border bg-background text-xs font-medium", className)}>
    {name.charAt(0).toUpperCase()}
  </div>
);

const CreateWorkspaceDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const { createWorkspace } = useWorkspaces();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }

    const workspace = await createWorkspace(name, slug || undefined);
    if (workspace) {
      setOpen(false);
      setName("");
      setSlug("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your documents, templates, and media.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              placeholder="My Workspace"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspace-slug">Workspace Slug (optional)</Label>
            <Input
              id="workspace-slug"
              placeholder="my-workspace"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs. If empty, will be generated from the name.
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            Create Workspace
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const JoinWorkspaceDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      toast.error("Please enter an invite code");
      return;
    }

    // TODO: Implement invite code joining logic
    toast.info("Invite functionality coming soon!");
    setOpen(false);
    setInviteCode("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Workspace</DialogTitle>
          <DialogDescription>
            Enter an invite code to join an existing workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              placeholder="Enter invite code..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleJoin}>
            Join Workspace
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const WorkspaceSwitcher = () => {
  const [open, setOpen] = useState(false);
  const { currentWorkspace, workspaces } = useWorkspaceContext();
  const { switchToWorkspace } = useWorkspaceNavigation();

  if (!currentWorkspace) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-6 w-6 animate-pulse rounded bg-muted" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select workspace"
          className="w-[240px] justify-between bg-background/80 backdrop-blur-sm border-border/50"
        >
          <div className="flex items-center space-x-2 truncate">
            <WorkspaceAvatar name={currentWorkspace.name} />
            <div className="flex flex-col items-start truncate">
              <span className="text-sm font-medium truncate">{currentWorkspace.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{currentWorkspace.role}</span>
            </div>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 bg-background border border-border shadow-lg" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput placeholder="Search workspaces..." className="border-0 focus:ring-0" />
          </div>
          <CommandList>
            <CommandEmpty>No workspace found.</CommandEmpty>
            <CommandGroup heading="Your Workspaces">
              {workspaces.map((workspace) => (
                <CommandItem
                  key={workspace.id}
                  value={workspace.name}
                  onSelect={() => {
                    switchToWorkspace(workspace.id);
                    setOpen(false);
                  }}
                  className="flex items-center space-x-2 p-2"
                >
                  <WorkspaceAvatar name={workspace.name} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{workspace.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{workspace.role}</span>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
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
              <CreateWorkspaceDialog>
                <CommandItem
                  onSelect={() => setOpen(false)}
                  className="flex items-center space-x-2 p-2 cursor-pointer"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded border bg-muted">
                    <Plus className="h-3 w-3" />
                  </div>
                  <span className="text-sm">Create Workspace</span>
                </CommandItem>
              </CreateWorkspaceDialog>
              <JoinWorkspaceDialog>
                <CommandItem
                  onSelect={() => setOpen(false)}
                  className="flex items-center space-x-2 p-2 cursor-pointer"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded border bg-muted">
                    <UserPlus className="h-3 w-3" />
                  </div>
                  <span className="text-sm">Join by Invite</span>
                </CommandItem>
              </JoinWorkspaceDialog>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};