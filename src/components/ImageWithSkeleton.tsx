import React, { useState, useEffect } from "react"

interface ImageWithSkeletonProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
}

export default function ImageWithSkeleton({
  className = "",
  src,
  alt,
  onClick,
  style,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!src) return
    setIsLoaded(false)
  }, [src])

  return (
    <div
      className={`relative overflow-hidden shrink-0 inline-block ${className}`}
      style={style}
      onClick={onClick}
    >
      {!isLoaded && src && (
        <div
          className="absolute inset-0 bg-slate-200 animate-pulse"
          style={{ zIndex: 0 }}
        />
      )}

      {src && (
        <img
          src={src}
          alt={alt || "Image"}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ position: "relative", zIndex: 1 }}
          onLoad={(e) => {
            setIsLoaded(true)
            if (props.onLoad) props.onLoad(e)
          }}
          {...props}
        />
      )}
    </div>
  )
}
