import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="bg-gradient-to-r from-[#112444] to-[#1a365d] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/" className="inline-block">
          <div className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <Image
              src="https://cdn.haitrieu.com/wp-content/uploads/2021/12/Logo-DH-Quoc-Te-Mien-Dong-EIU.png"
              alt="Logo EIU"
              width={140}
              height={35}
              className="h-[35px] w-auto flex-shrink-0"
              priority
            />
            <h1 className="text-2xl font-bold">EIU TestLab</h1>
          </div>
        </Link>
      </div>
    </header>
  );
}
