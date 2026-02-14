'use client';


import Image from 'next/image';
import Link from 'next/link';

export default function CTABanner() {
    return (
        <section className="bg-white dark:bg-black py-16 px-4">
            <div className="max-w-5xl mx-auto">
               <Link href={'/courses'}>
               <Image src="/ban2.png" alt="Banner" width={1000} height={1000}  className='rounded-2xl'/></Link>
            </div>
        </section>
    );
}

