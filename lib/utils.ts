import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWatchStatus(status: string) {
  switch (status) {
    case "planned":
      return "Planned";
    case "watching":
      return "Watching";
    case "watched":
      return "Watched";
    case "dropped":
      return "Abandoned";
    default:
      return status;
  }
}
