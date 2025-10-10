'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
 export default function TipiPage() {
   const router = useRouter();

   return (
     <div className="container">
       <h1>TIPI Test Page</h1>
       <p>This is where the TIPI test would be administered.</p>
       <p>Test completion logic has been moved to onboarding.</p>
     </div>
   );
 }
