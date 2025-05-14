import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

export default function EditedSalesEntry() {
  const { user } = useAuth();
  

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      branch: "",
      date: new Date().toISOString().split('T')[0],
      opening_meter_reading_ago: 0,
      closing_meter_reading_ago: 0,
      opening_meter_reading_pms: 0,
      closing_meter_reading_pms: 0,
      opening_tank_reading_ago: 0,
      closing_tank_reading_ago: 0,
      opening_tank_reading_pms: 0,
      closing_tank_reading_pms: 0,
      pump_test_ago: 0,
      pump_test_pms: 0,
      total_pump_test: 0,
      received_ago: 0,
      received_pms: 0,
      total_received: 0,
      sales_ago: 0,
      sales_pms: 0,
      total_sales: 0,
      actuals_ago: 0,
      actuals_pms: 0,
      total_actuals: 0,
      variation_ago: 0,
      variation_pms: 0,
      total_variation: 0,
      unit_price_ago: 0,
      unit_price_pms: 0,
      sales_in_cedis_ago: 0,
      sales_in_cedis_pms: 0,
      total_sales_in_cedis: 0,
      actuals_in_cedis_ago: 0,
      actuals_in_cedis_pms: 0,
      total_actuals_in_cedis: 0,
      variation_in_cedis_ago: 0,
      variation_in_cedis_pms: 0,
      total_variation_in_cedis: 0,
      collections_cash: 0,
      collections_cheque: 0,
      total_collections: 0,
      credit_ago: 0,
      credit_pms: 0,
      total_credit: 0,
      expenditure: 0,
      comment: "",
      net_sales: 0,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
      user_id: 0
      
      
    }
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const branchOptions = [
    "Asankragua", "Ayiem", "Assin Fosu", "Atta ne Atta", "Atebubu", 
    "Bepong", "Bongo", "Camp 15", "Dadieso", "Damango", "Dormaa", 
    "Dunkwa", "Feyiase", "Mamaso", "Medie", "Nkruma Nkwanta", 
    "Obuasi", "Oseikrom", "Suma Ahenkro", "Tarkwa", "Tema", 
    "Tepa", "Tinga", "Tumu", "Tutuka", "Wa"
  ];



  const onSubmit = async (data) => {
    const salesData = {
      ...data,
      branch: data.branch,
      date: new Date(data.date).toISOString(),
      opening_meter_reading_ago: parseFloat(data.opening_meter_reading_ago),
      closing_meter_reading_ago: parseFloat(data.closing_meter_reading_ago),
      opening_meter_reading_pms: parseFloat(data.opening_meter_reading_pms),
      closing_meter_reading_pms: parseFloat(data.closing_meter_reading_pms),
      opening_tank_reading_ago: parseFloat(data.opening_tank_reading_ago),
      closing_tank_reading_ago: parseFloat(data.closing_tank_reading_ago),
      opening_tank_reading_pms: parseFloat(data.opening_tank_reading_pms),
      closing_tank_reading_pms: parseFloat(data.closing_tank_reading_pms),
      pump_test_ago: parseFloat(data.pump_test_ago),
      pump_test_pms: parseFloat(data.pump_test_pms),
      total_pump_test: parseFloat(data.total_pump_test),
      received_ago: parseFloat(data.received_ago),
      received_pms: parseFloat(data.received_pms),
      total_received: parseFloat(data.total_received),
      sales_ago: parseFloat(data.sales_ago),
      sales_pms: parseFloat(data.sales_pms),
      total_sales: parseFloat(data.total_sales),
      actuals_ago: parseFloat(data.actuals_ago),
      actuals_pms: parseFloat(data.actuals_pms),
      total_actuals: parseFloat(data.total_actuals),
      variation_ago: parseFloat(data.variation_ago),
      variation_pms: parseFloat(data.variation_pms),
      total_variation: parseFloat(data.total_variation),
      unit_price_ago: parseFloat(data.unit_price_ago),
      unit_price_pms: parseFloat(data.unit_price_pms),
      sales_in_cedis_ago: parseFloat(data.sales_in_cedis_ago),
      sales_in_cedis_pms: parseFloat(data.sales_in_cedis_pms),
      total_sales_in_cedis: parseFloat(data.total_sales_in_cedis),
      actuals_in_cedis_ago: parseFloat(data.actuals_in_cedis_ago),
      actuals_in_cedis_pms: parseFloat(data.actuals_in_cedis_pms),
      total_actuals_in_cedis: parseFloat(data.total_actuals_in_cedis),
      variation_in_cedis_ago: parseFloat(data.variation_in_cedis_ago),
      variation_in_cedis_pms: parseFloat(data.variation_in_cedis_pms),
      total_variation_in_cedis: parseFloat(data.total_variation_in_cedis),
      collections_cash: parseFloat(data.collections_cash),
      collections_cheque: parseFloat(data.collections_cheque),
      total_collections: parseFloat(data.total_collections),
      credit_ago: parseFloat(data.credit_ago),
      credit_pms: parseFloat(data.credit_pms),
      total_credit: parseFloat(data.total_credit),
      comment: data.comment,
      expenditure: parseFloat(data.expenditure),
      net_sales: parseFloat(data.net_sales),
      created_at: new Date(data.created_at).toISOString(),
      updated_at: new Date(data.updated_at).toISOString(),
      user_id: data.user_id 
      
    };
    console.log(salesData);



    if (!isOnline) {
      const storedData = JSON.parse(localStorage.getItem('offlineSalesData') || '[]');
      storedData.push(salesData);
      localStorage.setItem('offlineSalesData', JSON.stringify(storedData));
      alert('Data saved offline. Will sync when connection is restored.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/entries/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(salesData)
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to submit sales data');
      }
      alert('Sales data submitted successfully');
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gradient-to-r from-green-50 to-green-100">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-8 text-center text-green-700 tracking-tight">
          Daily Account Sheet
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
              <h3 className="text-xl font-semibold text-green-700 mb-4">Meter Readings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Opening Meter Readings</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">AGO</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('opening_meter_reading_ago', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">PMS</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('opening_meter_reading_pms', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Closing Meter Readings</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">AGO</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('closing_meter_reading_ago', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">PMS</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('closing_meter_reading_pms', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="text-xl font-semibold text-green-700 mb-4">Tank Readings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Opening Tank</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">AGO</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('opening_tank_reading_ago', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">PMS</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('opening_tank_reading_pms', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Closing Tank</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">AGO</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('closing_tank_reading_ago', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">PMS</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('closing_tank_reading_pms', { required: true, min: 0 })}
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
              <h3 className="text-xl font-semibold text-green-700 mb-4">Pump Test (in litres)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Pump Test</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">AGO</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('pump_test_ago', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">PMS</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('pump_test_pms', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="text-xl font-semibold text-green-700 mb-4">Receipts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Receipts</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">AGO</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('received_ago', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">PMS</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('received_pms', { required: true, min: 0 })}
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
              <h3 className="text-xl font-semibold text-green-700 mb-4">Unit Price (in GHS)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Unit Price</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">AGO</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('unit_price_ago', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">PMS</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('unit_price_pms', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="text-xl font-semibold text-green-700 mb-4">Credit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Credit</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">AGO</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('credit_ago', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">PMS</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('credit_pms', { required: true, min: 0 })}
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
              <h3 className="text-xl font-semibold text-green-700 mb-4">Collections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Collections</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">Cash</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('collections_cash', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">Cheque</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('collections_cheque', { required: true, min: 0 })}
                        className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="text-xl font-semibold text-green-700 mb-4">Expenditure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Expenditure</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('expenditure', { required: true, min: 0 })}
                    className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="text-xl font-semibold text-green-700 mb-4">Comment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Comment</label>
                  <input
                    type="text"
                    {...register('comment')}
                    className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="text-xl font-semibold text-green-700 mb-4">Net Sales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">Net Sales</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('net_sales', { required: true, min: 0 })}
                    className="w-full px-4 py-3 rounded-lg border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500 bg-white text-gray-900 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

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