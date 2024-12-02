import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePortfolioStore } from "@/store/use-portfolio-store";
import { TokenGroup } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Trash } from "lucide-react";

export function GroupManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const { createGroup, groups } = usePortfolioStore();

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;
    createGroup(groupName, groupDescription);
    setGroupName("");
    setGroupDescription("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Token Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Group Name</label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Long Term Holdings"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Add a description for this group..."
            />
          </div>
          <Button onClick={handleCreateGroup} className="w-full">
            Create Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TokenGroupSelect({
  tokenAddress,
  onClose,
}: {
  tokenAddress: string;
  onClose: () => void;
}) {
  const { groups, addTokenToGroup } = usePortfolioStore();

  const handleAddToGroup = (groupId: string) => {
    addTokenToGroup(groupId, tokenAddress);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Token to Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {Object.values(groups).length === 0 ? (
            <p className="text-sm text-gray-500">
              No groups available. Please create a group first.
            </p>
          ) : (
            <Select onValueChange={handleAddToGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(groups).map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GroupList() {
  const { groups, tokens, removeTokenFromGroup, removeGroup } = usePortfolioStore();

  return (
    <div className="space-y-4">
      {Object.values(groups).map((group) => (
        <div
          key={group.id}
          className="border rounded-lg p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{group.name}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {group.tokens?.length || 0} tokens
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeGroup(group.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {group.description && (
            <p className="text-sm text-gray-500">{group.description}</p>
          )}
          <div className="space-y-2">
            {group.tokens?.map((tokenAddress) => {
              const token = tokens[tokenAddress];
              if (!token) return null;
              return (
                <div
                  key={tokenAddress}
                  className="flex items-center justify-between bg-secondary/50 rounded-md p-2"
                >
                  <span>{token.baseToken?.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTokenFromGroup(group.id, tokenAddress)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {Object.values(groups).length === 0 && (
        <p className="text-sm text-gray-500 text-center">
          No groups created yet.
        </p>
      )}
    </div>
  );
}
