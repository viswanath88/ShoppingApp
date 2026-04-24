import { useState } from "react";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ProductImage({ src, alt, className = "" }: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center ${className}`}>
        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
