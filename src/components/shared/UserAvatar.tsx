import { cn } from "@/lib/utils"

export function UserAvatar({
  name,
  size = "sm",
  className,
}: {
  name: string
  size?: "xs" | "sm" | "md"
  className?: string
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const sizeClasses = {
    xs: "size-5 text-[9px]",
    sm: "size-6 text-[10px]",
    md: "size-8 text-xs",
  }

  // Generate consistent colour from name
  const hue = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-medium text-white shrink-0",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: `oklch(0.55 0.15 ${hue})` }}
      title={name}
    >
      {initials}
    </div>
  )
}
