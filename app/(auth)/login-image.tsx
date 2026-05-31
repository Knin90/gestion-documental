import Image from "next/image";

const BLUR_DATA_URL = "data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAADQAQCdASoKAAYAAkA4JZQCdAEO/gHOAAD++P/YAAAA";

export function LoginBackground() {
  return (
    <Image
      src="/login-bg.webp"
      alt=""
      fill
      priority
      quality={85}
      sizes="100vw"
      className="object-cover object-left"
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
    />
  );
}
