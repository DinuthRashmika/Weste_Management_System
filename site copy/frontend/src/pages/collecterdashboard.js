import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix marker icons for Leaflet (optional)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
    iconUrl: require('leaflet/dist/images/marker-icon.png').default,
    shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
});

const CollectorDashboard = () => {
    const [requests, setRequests] = useState([]); // Store confirmed requests
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConfirmedRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };

                // Fetch confirmed requests from the backend
                const response = await axios.get('http://localhost:4000/api/collector/requests/confirmed', config);
                setRequests(response.data); // Set the confirmed requests
                setIsLoading(false);
            } catch (error) {
                setError('Error fetching confirmed requests: ' + (error.response?.data?.message || error.message));
                setIsLoading(false);
            }
        };

        fetchConfirmedRequests();
    }, []);

    // Function to handle navigating to the map view of a specific request
    const handleRequestClick = (requestId) => {
        navigate(`/collector/request/${requestId}/map`); // Navigate to the request's map view
    };

    // Function to handle completing the request
    const handleCompleteRequest = async (requestId) => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            // Mark the request as completed
            await axios.put(`http://localhost:4000/api/collector/requests/${requestId}/complete`, {}, config);
            alert('Request marked as complete');

            // Refresh confirmed requests after completing one
            const updatedRequests = requests.filter(request => request._id !== requestId);
            setRequests(updatedRequests);
        } catch (error) {
            setError('Error completing request: ' + (error.response?.data?.message || error.message));
        }
    };

    // Function to handle logout
    const handleLogout = () => {
        localStorage.removeItem('token'); // Remove the token from localStorage
        navigate('/login'); // Redirect to the login page
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-3xl font-bold mb-4">Collector Dashboard</h1>
            <h2 className="text-xl text-blue-500 mb-6">Welcome, [Collector's Name]</h2>

            {/* Real Leaflet Map */}
            <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-lg mb-6">
                <h3 className="text-lg font-semibold mb-2">Ongoing Requests Map</h3>
                <MapContainer
                    center={[51.505, -0.09]} // Center of the map (you can update the coordinates)
                    zoom={13}
                    style={{ height: '400px', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* Add markers dynamically based on requests */}
                    {requests.map(request => {
                        // Check if latitude and longitude exist
                        const lat = request.addressLat;
                        const lng = request.addressLng;

                        if (lat && lng) {
                            return (
                                <Marker key={request._id} position={[lat, lng]}>
                                    <Popup>
                                        <div>
                                            <p><strong>User:</strong> {request.user.name}</p>
                                            <p><strong>Address:</strong> {request.address}</p>
                                            <p><strong>Status:</strong> {request.status}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        } else {
                            console.warn(`Invalid coordinates for request ID: ${request._id}`);
                            return null;
                        }
                    })}
                </MapContainer>
            </div>

            {isLoading ? (
                <p>Loading...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-lg mt-4">
                    <h3 className="text-lg font-semibold mb-2">Confirmed Requests</h3>
                    {requests.length === 0 ? (
                        <p>No confirmed requests available.</p>
                    ) : (
                        requests.map(request => (
                            <div
                                key={request._id}
                                className="mb-4 p-4 border rounded shadow-sm cursor-pointer hover:bg-gray-100"
                                onClick={() => handleRequestClick(request._id)}
                            >
                                <p><strong>User:</strong> {request.user.name}</p>
                                <p><strong>Address:</strong> {request.address}</p> {/* Displaying the address */}
                                <p><strong>Status:</strong> {request.status}</p>

                                <div className="flex justify-between text-gray-500 mt-2">
                                    <span>Address: {request.address}</span>
                                    <span>User: {request.user.name}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Weight</span>
                                    <span>{request.weight || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Recycle Weight</span>
                                    <span>{request.recycleWeight || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Refund</span>
                                    <span>{request.refund || 'N/A'}</span>
                                </div>

                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex items-center">
                                        <span className="mr-2">Complete</span>
                                        <input type="checkbox" className="toggle-checkbox" disabled={request.status === 'Completed'} />
                                    </div>
                                    <button
                                        className="bg-green-500 text-white px-4 py-2 rounded-lg"
                                        onClick={() => handleCompleteRequest(request._id)}
                                        disabled={request.status === 'Completed'}
                                    >
                                        Mark Complete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Logout Button */}
            <button className="mt-6 text-red-500" onClick={handleLogout}>
                Logout
            </button>

            <p className="mt-6 text-sm text-gray-500">Smart Waste Management System.</p>
        </div>
    );
};

export default CollectorDashboard;