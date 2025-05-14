import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import DashboardCard, { StockLevel } from './DashboardCard';
import BranchAutocomplete from './BranchAutoComplete';
import { useAuth } from '../contexts/AuthContext';

import { motion } from 'framer-motion';



// Custom styles inspired by Snapchat's clean UI
const containerStyles = {
    backgroundColor: '#ffffff',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
};

const cardStyles = {
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    borderRadius: '12px',
    transition: 'transform 0.2s ease-in-out',
    padding: '1.5rem',
};

const selectStyles = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '0.5rem',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease-in-out',
};

const labelStyles = {
    color: '#1f2937',
    fontWeight: 500,
    marginBottom: '0.5rem',
    display: 'block',
};

const loadingStyles = {
    color: '#3b82f6',
    fontSize: '1rem',
    fontWeight: 500,
};

export default function WindEd() {
    const [branch, setBranch] = useState(null);
    const [metric, setMetric] = useState("Sales");
    const [dateRange, setDateRange] = useState("This Week");
    const [chartType, setChartType] = useState("Pie");
    const [data, setData] = useState([]);
    const [dailyTarget, setDailyTarget] = useState(null);
    const [weeklyTarget, setWeeklyTarget] = useState(null);
    const [monthlyTarget, setMonthlyTarget] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user, loading: authLoading } = useAuth();

    // Get JWT Token from localStorage
    const getToken = () => {
        return localStorage.getItem('token');
    }
    
    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const token = getToken();
                if (!token) {
                    throw new Error('Not authenticated');
                }

                const response = await fetch("http://localhost:8000/api/entries/all", {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("API Response:", errorText);
                    throw new Error(`API Error: ${response.status} - ${errorText}`);
                }

                let jsonData;
                try {
                    jsonData = await response.json();
                } catch (parseError) {
                    console.error("Error parsing JSON:", parseError);
                    throw new Error("Invalid response from server. Please check if the backend is running.");
                }

                if (!jsonData) {
                    throw new Error("No data received from server");
                }

                // Process date if they exist in the data
                const processData = jsonData.map(item => {
                    if (item.date) {
                        return {
                            ...item, 
                            date: new Date(item.date).toISOString().split("T")[0]
                        };
                    }
                    return item;
                });

                setData(processData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (branch) {
            fetchMetrics();
        }
    }, [branch, metric, dateRange]);

    const renderChart = () => {
        if (loading) {
            return <div className="text-center">Loading chart data...</div>;
        }

        if (error) {
            return <div className="text-red-500 text-center">Error loading data: {error}</div>;
        }

        if (chartType === "Pie") {
            // Process data for pie chart
            const pieData = data.reduce((acc, item) => {
                const key = item[metric];
                if (key) {
                    acc[key] = (acc[key] || 0) + 1;
                }
                return acc;
            }, {});

            const pieValues = Object.entries(pieData).map(([label, value]) => ({
                label,
                value
            }));

            return (
                <Plot
                    data={[{
                        type: "pie",
                        values: pieValues.map(d => d.value),
                        labels: pieValues.map(d => d.label),
                        textinfo: "label+percent",
                        hole: 0.3,
                    }]}
                    layout={{
                        title: `${metric} Distribution`,
                        height: 400,
                        width: 500
                    }}
                />
            );
        } else if (chartType === "Bar") {
            // Process data for bar chart
            const barData = data.reduce((acc, item) => {
                const date = item.date || 'Unknown';
                acc[date] = (acc[date] || 0) + (item[metric] || 0);
                return acc;
            }, {});

            const barValues = Object.entries(barData).map(([date, value]) => ({
                date,
                value
            }));

            return (
                <Plot
                    data={[{
                        type: "bar",
                        x: barValues.map(d => d.date),
                        y: barValues.map(d => d.value),
                        text: barValues.map(d => d.value),
                        textposition: "auto",
                        marker: {
                            color: "#3b82f6",
                            line: {
                                width: 0
                            }
                        }
                    }]}
                    layout={{
                        title: `${metric} Bar Chart`,
                        height: 400,
                        width: 500
                    }}
                />
            );
        }
        return null;
    };

    return (
        <div>
            <div className="w-full">
                <div style={containerStyles} className="max-w-7xl mx-auto">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold mb-8 text-center text-gray-900"
                    >
                        JusBoard
                    </motion.h1>
                    <div className="js-enabled mb-8">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <BranchAutocomplete
                                value={branch}
                                onChange={(branch) => setBranch(branch)}
                                required
                                options={[]}
                                isLoading={false}
                                className="w-full"
                            />
                        </motion.div>
                    </div>

                    <motion.div 
                        style={cardStyles}
                        whileHover={{ scale: 1.02 }}
                        className="p-6"
                    >
                        <h3 className="text-xl font-semibold mb-4 text-gray-900">
                            Daily {metric} Target
                        </h3>
                        {dailyTarget ? (
                            <>
                                <div className="mb-4">
                                    <StockLevel 
                                        label={`${metric} Achieved`} 
                                        level={dailyTarget.level} 
                                        color={dailyTarget.level >= 80 ? "green" : "red"}
                                        className="mb-2"
                                    />
                                    <p className="text-sm text-gray-600">
                                        {dailyTarget.achieved} / {dailyTarget.required}
                                    </p>
                                </div>
                                <div className="text-sm text-gray-600">
                                    Progress: {dailyTarget.level.toFixed(1)}%
                                </div>
                            </>
                        ) : (
                            <div style={loadingStyles} className="text-center">
                                Loading daily metrics...
                            </div>
                        )}
                    </motion.div>

                    <DashboardCard title={`Weekly ${metric} Target`}>
                        {weeklyTarget ? (
                            <>
                                <StockLevel 
                                    label={`${metric} Achieved`} 
                                    level={weeklyTarget.level} 
                                    color={weeklyTarget.level >= 80 ? "green" : "red"}
                                />
                                <p className="text-sm text-gray-600">
                                    {weeklyTarget.achieved} / {weeklyTarget.required}
                                </p>
                            </>
                        ) : (
                            <div className="text-center">Loading...</div>
                        )}
                    </DashboardCard>

                    <DashboardCard title={`Monthly ${metric} Target`}>
                        {monthlyTarget ? (
                            <>
                                <StockLevel 
                                    label={`${metric} Achieved`} 
                                    level={monthlyTarget.level} 
                                    color={monthlyTarget.level >= 80 ? "green" : "red"}
                                />
                                <p className="text-sm text-gray-600">
                                    {monthlyTarget.achieved} / {monthlyTarget.required}
                                </p>
                            </>
                        ) : (
                            <div className="text-center">Loading...</div>
                        )}
                    </DashboardCard>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12"
                >
                    {renderChart()}
                </motion.div>
            </div>
        </div>
    );
}