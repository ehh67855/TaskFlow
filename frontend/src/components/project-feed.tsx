"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/project";
import { formatOwnerName } from "@/lib/utils";

export function ProjectFeed({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const [projects] = useState(initialProjects);

  if (projects.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No projects have been uploaded yet. Be the first to upload one!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id}>
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>
              Posted by {formatOwnerName(project.owner) || "Unknown user"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{project.description}</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href={`/project/${project.id}`}>View More</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
