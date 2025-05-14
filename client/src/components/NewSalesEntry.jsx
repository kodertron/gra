import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

export default function EditedSalesEntry() {
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      branch: "",
      date: new Date().toISOString().split('T')[0],
      ago: 0,
      pms: 0,
      destination: "",
      driver: "",
      truckNumber: ""
    }
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncMessage, setSyncMessage] = useState('');
  
  // Add event listeners to track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check in case we're online and have data to sync
    if (navigator.onLine) {
      syncOfflineData();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Function to sync offline data when connection is restored
  const syncOfflineData = async () => {
    const storedData = JSON.parse(localStorage.getItem('offlineSalesData') || '[]');
    
    if (storedData.length === 0) return;
    
    setSyncMessage('Syncing offline data...');
    
    let syncedCount = 0;
    let failedCount = 0;
    
    for (const data of storedData) {
      try {
        // Ensure data follows the TrucksCreate schema
        const truckEntry = {
          id: 0, // Required by schema, will be assigned by server
          branch: data.branch,
          ago: parseFloat(data.ago) || 0,
          pms: parseFloat(data.pms) || 0,
          date: data.date,
          driver: data.driver || "",
          destination: data.destination || "",
          truck_number: data.truck_number || data.truckNumber || "", // Handle both naming conventions
          user_id: user?.id || 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Syncing truck entry:', truckEntry);
        
        const response = await fetch('http://localhost:8000/api/entries/truck-new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(truckEntry)
        });
        
        const responseData = await response.json();
        console.log('Sync response:', response.status, responseData);
        
        if (response.ok) {
          syncedCount++;
        } else {
          console.error('Sync failed:', responseData);
          failedCount++;
        }
      } catch (error) {
        console.error('Error syncing item:', error);
        failedCount++;
      }
    }
    
    if (syncedCount > 0) {
      // Only remove successfully synced items
      if (failedCount === 0) {
        localStorage.removeItem('offlineSalesData');
        setSyncMessage(`Successfully synced ${syncedCount} offline entries.`);
      } else {
        // Keep failed entries in localStorage
        const remainingData = storedData.slice(syncedCount);
        localStorage.setItem('offlineSalesData', JSON.stringify(remainingData));
        setSyncMessage(`Synced ${syncedCount} entries. ${failedCount} entries failed and will retry later.`);
      }
    }
  };
  
  const branchOptions = [
    "Asankragua", "Ayiem", "Assin Fosu", "Atta ne Atta", "Atebubu", 
    "Bepong", "Bongo", "Camp 15", "Dadieso", "Damango", "Dormaa", 
    "Dunkwa", "Feyiase", "Mamaso", "Medie", "Nkruma Nkwanta", 
    "Obuasi", "Oseikrom", "Suma Ahenkro", "Tarkwa", "Tema", 
    "Tepa", "Tinga", "Tumu", "Tutuka", "Wa"
  ];

  const onSubmit = async (data) => {
    // Get the authenticated user ID safely
    const userId = user?.id || 1;
    
    // Format truck data for the TrucksCreate schema
    // The schema requires ALL these fields to be present
    const truckData = {
      id: 0, // Placeholder ID required by schema validation
      branch: data.branch,
      date: new Date(data.date).toISOString(),
      ago: parseFloat(data.ago) || 0,
      pms: parseFloat(data.pms) || 0,
      destination: data.destination || "",
      driver: data.driver || "",
      truck_number: data.truckNumber || "", // API expects snake_case (truck_number)
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log(truckData);

    if (!isOnline) {
      const storedData = JSON.parse(localStorage.getItem('offlineSalesData') || '[]');
      storedData.push(truckData);
      localStorage.setItem('offlineSalesData', JSON.stringify(storedData));
      alert('Data saved offline. Will sync when connection is restored.');
      setSyncMessage('Saved offline. Will sync when online.');
      return;
    }

    try {
      // Copy truckData directly - avoid reconstructing to prevent any format changes
      // The requestData object must exactly match the expected TrucksCreate schema
      const requestData = { ...truckData };
      
      console.log('Sending data to API:', requestData);
      const response = await fetch('http://localhost:8000/api/entries/truck-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });
      
      const responseData = await response.json();
      console.log('API Response:', response.status, responseData);
      
      if (!response.ok) {
        // Handle validation errors (422 status)
        if (response.status === 422 && responseData.detail) {
          // Format FastAPI validation errors which are typically nested
          const errorDetails = Array.isArray(responseData.detail) 
            ? responseData.detail.map(err => `${err.loc.join('.')} - ${err.msg}`).join('\n')
            : responseData.detail;
          
          console.error('Validation error:', errorDetails);
          throw new Error(`Validation Error: ${errorDetails}`);
        } else {
          throw new Error(responseData.message || responseData.detail || 'Failed to submit sales data');
        }
      }
      
      alert('Sales data submitted successfully');
      setSyncMessage('Data submitted successfully');
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gradient-to-r from-green-50 to-green-100">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-8 text-center text-green-700 tracking-tight">
          Trucks Account Sheet
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block text-lg font-semibold text-gray-700">Branch Name</label>
              <select
                {...register('branch', { required: true })}
                className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
              >
                <option value="">Select your branch</option>
                {branchOptions.map((branch, index) => (
                  <option key={index} value={branch} className="text-gray-700">{branch}</option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              <label className="block text-lg font-semibold text-gray-700">Date</label>
              <input
                type="date"
                {...register('date', { required: true })}
                className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
              />
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="text-xl font-semibold text-green-700 mb-4">Products</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Product</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">AGO</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('ago', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">PMS</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('pms', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="text-xl font-semibold text-green-700 mb-4">Driver</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Driver</label>
                  <input
                    type="text"
                    {...register('driver', { required: true })}
                    className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="text-xl font-semibold text-green-700 mb-4">Destination</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Destination</label>
                  <input
                    type="text"
                    {...register('destination')}
                    className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="text-xl font-semibold text-green-700 mb-4">Truck Number</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Truck Number</label>
                  <input
                    type="text"
                    {...register('truckNumber')}
                    className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>
          {syncMessage && (
            <div className={`mt-4 p-4 rounded-lg text-white font-medium ${syncMessage.includes('Successfully') || syncMessage.includes('submitted successfully') ? 'bg-green-600' : syncMessage.includes('Syncing') ? 'bg-blue-600' : syncMessage.includes('Saved offline') ? 'bg-yellow-600' : 'bg-gray-600'}`}>
              {syncMessage}
            </div>
          )}
          <div className="mt-8">
            <button
              type="submit"
              className="w-full md:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Submit Entry</span>
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}