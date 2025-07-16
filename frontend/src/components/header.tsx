"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setAuthHeader } from "@/services/BackendService";
import logo from "@/../public/logo.svg";
import { siteConfig } from "@/config/site";

export function Header(props: { isAuthed: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await setAuthHeader(null);
    router.refresh();
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto py-4 px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src={logo || "/placeholder.svg"}
            alt="Logo"
            width={40}
            height={40}
          />
          <span className="text-xl font-bold">{siteConfig.name}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <Tabs defaultValue="my-projects">
            <TabsList>
              <TabsTrigger value="my-projects" asChild>
                <Link href="/my-projects">My Projects</Link>
              </TabsTrigger>
              <TabsTrigger value="new-project" asChild>
                <Link href="/new-project">New Project</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <NavItems isAuthed={props.isAuthed} />
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <nav className="flex flex-col space-y-4">
              <Link href="/my-projects" className="text-lg font-semibold">
                My Projects
              </Link>
              <Link href="/new-project" className="text-lg font-semibold">
                New Project
              </Link>
              <NavItems isAuthed={props.isAuthed} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function NavItems({ isAuthed }: { isAuthed: boolean }) {
  const router = useRouter();

  const handleLogout = async () => {
    await setAuthHeader(null);
    router.refresh();
  };

  return (
    <>
      {isAuthed ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/edit-profile">Edit Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger className="w-full text-left">
                  Logout
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to logout?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. You will need to log in
                      again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/register">Sign Up</Link>
          </Button>
        </>
      )}
    </>
  );
}
