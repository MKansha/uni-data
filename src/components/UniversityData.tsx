'use client';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

interface University {
    institutionName: string;
    courses: string[];
}

export default function UniversityData() {
    const [universities, setUniversities] = useState<University[]>([]);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [expandedUniversities, setExpandedUniversities] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        const fetchExcelData = async () => {
            try {
                console.log('Fetching Excel file...');
                const response = await fetch('/aus-uni.xlsx');
                if (!response.ok) {
                    throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
                }
                
                console.log('File fetched, reading content...');
                const arrayBuffer = await response.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                
                console.log('Available sheets:', workbook.SheetNames);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                console.log('Worksheet loaded:', worksheet['!ref']); // Shows the range of cells
                
                // Get the headers from the first row
                const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
                const headers: string[] = [];
                
                // Read the headers from the first row
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: C })];
                    headers[C] = cell?.v || '';
                }
                
                console.log('Excel Headers:', headers); // Debug the actual headers
                
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                    raw: false,
                    defval: ''
                });
                
                console.log('Excel Data:', jsonData); // Debug the parsed data
                
                // Process the data to group courses by institution
                const universityMap = new Map<string, string[]>();
                
                // Skip the first two rows (header rows)
                jsonData.slice(2).forEach((row: any) => {
                    // Log each row to debug
                    console.log('Processing row:', row);
                    
                    const institutionName = row['__EMPTY']; // Institution Name
                    const courseName = row['__EMPTY_2']; // Course Name
                    const courseCode = row['__EMPTY_1']; // CRICOS Course Code
                    const providerCode = row['Courses']; // Provider Code
                    
                    if (institutionName && courseName) {
                        console.log('Found valid data:', { institutionName, courseName, courseCode, providerCode });
                        
                        const fullInstitutionName = `${institutionName} (${providerCode})`;
                        if (!universityMap.has(fullInstitutionName)) {
                            universityMap.set(fullInstitutionName, []);
                        }
                        // Include course code in the display
                        const courseInfo = `${courseName} (${courseCode})`;
                        universityMap.get(fullInstitutionName)?.push(courseInfo);
                    } else {
                        console.log('Skipping row due to missing data:', { institutionName, courseName });
                    }
                });
                
                // Convert map to array of University objects
                const universitiesData: University[] = Array.from(universityMap).map(([name, courses]) => ({
                    institutionName: name,
                    courses: courses
                }));
                
                setUniversities(universitiesData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred while loading the data');
                console.error('Error loading Excel file:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchExcelData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <div className="text-lg">Loading university data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-600 p-4 border border-red-300 rounded-lg">
                <h3 className="font-semibold">Error Loading Data</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (universities.length === 0) {
        return (
            <div className="text-amber-600 p-4 border border-amber-300 rounded-lg">
                <h3 className="font-semibold mb-2">No University Data Found</h3>
                <p>Please check:</p>
                <ul className="list-disc pl-6 mt-2">
                    <li>Excel file is named &apos;aus-uni.xlsx&apos; in the public folder</li>
                    <li>Excel file has the correct column headers:</li>
                    <ul className="list-circle pl-6 mt-1 text-sm">
                        <li>Institution Name</li>
                        <li>Course Name</li>
                        <li>CRICOS Course Code</li>
                    </ul>
                </ul>
                <p className="mt-2 text-sm">Check the browser console (F12) for more details.</p>
            </div>
        );
    }

    const toggleUniversity = (universityName: string) => {
        setExpandedUniversities(prev => ({
            ...prev,
            [universityName]: !prev[universityName]
        }));
    };

    return (
        <div className="space-y-8">
            <div className="mb-4">
                <p className="text-gray-600">Total Universities: {universities.length}</p>
            </div>
            {universities.map((uni, index) => (
                <div key={index} className="border rounded-lg p-6 shadow-sm bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-blue-900">{uni.institutionName}</h3>
                        <button
                            onClick={() => toggleUniversity(uni.institutionName)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm flex items-center gap-2"
                        >
                            Courses
                            <span className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                {uni.courses.length}
                            </span>
                        </button>
                    </div>
                    {expandedUniversities[uni.institutionName] && (
                        <div className="bg-gray-50 rounded-lg p-4 mt-4 transition-all">
                            <ul className="list-disc pl-6 space-y-2">
                                {uni.courses.map((course, courseIndex) => (
                                    <li key={courseIndex} className="text-gray-700">{course}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
