'use client';
import UniversityData from '../components/UniversityData';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Australian Universities</h1>
      <UniversityData />
    </div>
  );
}
