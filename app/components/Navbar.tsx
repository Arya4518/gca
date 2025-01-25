"use client";

import Link from 'next/link';

const Navbar = () => {
  return (
    <div className="flex gap-20 w-full items-center justify-center mb-4 bg-black p-4">
      <Link href="/" className="text-white hover:underline">
        Home
      </Link>
      <Link href="/users" className="text-white hover:underline">
        Users
      </Link>
      <Link href="/viewer" className="text-white hover:underline">
        Viewer
      </Link>
    </div>
  );
};

export default Navbar;
