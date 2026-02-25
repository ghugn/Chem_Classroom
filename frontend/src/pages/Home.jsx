import { useEffect, useState } from 'react';
import axios from 'axios';

const Home = () => {
    const [health, setHealth] = useState('Loading backend status...');

    useEffect(() => {
        // Basic test of the backend /api/health route
        axios.get('http://localhost:5000/api/health')
            .then(res => setHealth(res.data.message))
            .catch(err => setHealth('Backend is not running or unreachable.'));
    }, []);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Welcome to the Dashboard</h2>
            <p className="text-gray-600 mb-4">Frontend is successfully created with Vite, React, and Tailwind CSS.</p>

            <div className="p-4 bg-slate-50 rounded border border-slate-200">
                <h3 className="font-semibold text-slate-700 mb-2">System Status</h3>
                <p className="text-sm">
                    <span className="font-medium text-slate-600">Backend API:</span>{' '}
                    <span className={health.includes('unreachable') ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
                        {health}
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Home;
