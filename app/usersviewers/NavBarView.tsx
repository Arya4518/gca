"use client";

import Link from 'next/link';

const NavBarView = () => {
  return (
    <div className="flex gap-20 w-full items-center justify-center  bg-black p-4">
      
      <Link href="/usersviewers" className="text-white hover:underline">
        Users
      </Link>
      <Link href="/viewer" className="text-white hover:underline">
        Viewer
      </Link>
      <Link href="/rankings" className="text-white hover:underline">
        Rankings
      </Link>
    </div>
  );
};

export default NavBarView;