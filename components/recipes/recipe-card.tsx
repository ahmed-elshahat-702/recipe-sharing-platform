"use client";
import React from "react";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { type Recipe } from "@/lib/types/recipe";
import { useEffect, useState } from "react";
import axios from "axios";
import { Skeleton } from "../ui/skeleton";
import { useSession } from "next-auth/react";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useRecipeStore } from "@/store/use-recipe-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
interface RecipeCardProps {
  recipe: Recipe;
}

interface RecipeAuthor {
  _id: string;
  name: string;
  image: string;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [recipeAuthor, setRecipeAuthor] = useState<RecipeAuthor | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: session } = useSession();
  const { deleteRecipe } = useRecipeStore();
  const { toast } = useToast();
  const router = useRouter();

  // Only show edit/delete if:
  // 1. User is logged in
  // 2. Recipe has an author (not anonymous)
  // 3. Current user is the author
  const isAuthor =
    session?.user?.id &&
    recipe.author?._id &&
    session.user.id === recipe.author._id;

  const fetchRecipeAuthor = async () => {
    try {
      if (!recipe.author?._id) {
        setRecipeAuthor(null);
        return;
      }

      const response = await axios.get(`/api/user/${recipe.author._id}`);
      setRecipeAuthor(response.data.user);
    } catch (error) {
      console.error("Error fetching recipe author:", error);
    }
  };

  const handleDelete = async () => {
    await deleteRecipe(recipe._id);
    setShowDeleteDialog(false);
    toast({
      title: "Recipe deleted",
      description: "Your recipe has been deleted successfully.",
    });
    router.refresh();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    router.push(`/recipes/${recipe._id}/edit`);
  };

  useEffect(() => {
    fetchRecipeAuthor();
  }, [recipe.author?._id]);

  return (
    <>
      <Link href={`/recipes/${recipe._id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow relative">
          {isAuthor && (
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="aspect-video relative">
            <Image
              src={recipe.images?.[0] || "/recipe-placeholder.jpg"}
              alt={recipe.title}
              fill
              className="object-cover"
            />
          </div>
          <CardContent className="p-4 ">
            <h3 className="font-semibold text-lg line-clamp-1">
              {recipe.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {recipe.description}
            </p>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <div className="flex items-center space-x-2">
              <div className="relative h-6 w-6 rounded-full overflow-hidden border-2 border-main">
                <Image
                  src={
                    recipe.isAnonymous
                      ? "/anonymous-user.jpg"
                      : recipeAuthor?.image || "/anonymous-user.jpg"
                  }
                  alt={
                    recipe.isAnonymous
                      ? "/anonymous-user.jpg"
                      : recipeAuthor?.name || "Anonymous"
                  }
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {recipe.isAnonymous
                  ? "Anonymous"
                  : recipeAuthor?.name === session?.user?.name
                  ? "You"
                  : recipeAuthor?.name || "Anonymous"}
              </span>
            </div>
          </CardFooter>
        </Card>
      </Link>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this recipe? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleDelete();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
