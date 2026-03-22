"use client";

import { useSession } from "@/components/auth/SessionProvider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Shield, ShieldCheck, User } from "lucide-react";

export function UserAvatar() {
  const { user } = useSession();
  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const isMod = user.role === "MODERATOR";
  const isStaff = isAdmin || isMod;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
        <Avatar className="h-8 w-8 border border-cs-orange/30">
          <AvatarImage src={user.image} alt={user.name} />
          <AvatarFallback className="bg-cs-navy text-cs-orange text-xs">
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline text-sm text-muted-foreground">
          {user.name}
        </span>
        {isAdmin && <Shield className="h-3 w-3 text-cs-orange" />}
        {isMod && <ShieldCheck className="h-3 w-3 text-cs-blue" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-card border-border min-w-[160px]"
      >
        <DropdownMenuItem className="text-muted-foreground" disabled>
          <User className="h-4 w-4 mr-2" />
          {user.name}
        </DropdownMenuItem>
        {isStaff && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => (window.location.href = "/admin")}
              className="cursor-pointer"
            >
              {isAdmin ? (
                <Shield className="h-4 w-4 mr-2" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              {isAdmin ? "Admin Panel" : "Mod Panel"}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            fetch("/api/auth/signout", { method: "POST" }).then(() => {
              window.location.reload();
            });
          }}
          className="cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
