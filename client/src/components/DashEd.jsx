import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { 
  Container,
  Card,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Typography,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { 
  ArrowUpward, 
  ArrowDownward,
  CalendarToday,
  AttachMoney,
  Assessment,
  AccountBalance,
  CreditCard,
  BarChart,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { useAuth } from '../contexts/AuthContext'; 
import BranchAutocomplete from './BranchAutoComplete';

// Styled components for beautiful UI elements
const GradientCard = styled(Card)({
  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  marginBottom: '24px',
  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08)',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  backdropFilter: 'blur(8px)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-5px)'
  }
});

const MetricCard = styled(Card)({
  height: '100%',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '16px',
  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease',
  background: 'white',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.12)'
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
  }
});

const DailyCard = styled(MetricCard)({
  position: 'relative',
  '&::before': {
    background: 'linear-gradient(90deg, #43cea2 0%, #185a9d 100%)'
  }
});



const MonthlyCard = styled(MetricCard)({
  position: 'relative',
  '&::before': {
    background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)'
  }
});

const FilterContainer = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  padding: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  borderRadius: '12px',
  marginBottom: '20px',
  alignItems: 'center',
  boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.1)'
});

const ProgressBar = styled(LinearProgress)(({ value, color }) => ({
  height: '8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(0,0,0,0.05)',
  margin: '8px 0',
  '& .MuiLinearProgress-bar': {
    backgroundColor: color || '#4caf50'
  }
}));

export default function DashEd() { 
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date filters
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  
  // Search and visualization settings
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [xAxis, setXAxis] = useState("product");
  const [yAxis, setYAxis] = useState("amount");
  const [graphType, setGraphType] = useState("pie");
  const [plotData, setPlotData] = useState([]);
  const [layout, setLayout] = useState({
    title: "Data Visualization",
    autosize: true,
    margin: { l: 50, r: 50, b: 100, t: 80, pad: 4 }
  });
  
  // Selected metric for KPIs
  const [selectedMetric, setSelectedMetric] = useState("");
  const metricOptions = [
    { value: "net_sales", label: "Net Sales", icon: <AccountBalance/>, color: "#4caf50" },
    { value: "expenditure", label: "Expenditure", icon: <AttachMoney />, color: "#2196f3" },
    { value: "total_actuals_in_cedis", label: "Actuals", icon: <AttachMoney />, color: "#f44336" },
    { value: "total_credit", label: "Credit", icon: <CreditCard />, color: "#ff9800" },
    { value: "total_collections", label: "Collections", icon: <AttachMoney />, color: "#9c27b0" },
    { value: "total_sales_in_cedis", label: "Sales", icon: <AttachMoney />, color: "#9c27b0"},
    { value: "total_variation_in_cedis", label: "Variation", icon: <AttachMoney />, color: "#9c27b0"}
  ];
  
  // Get the current metric data
  const getCurrentMetric = () => {
    return metricOptions.find(m => m.value === selectedMetric) || metricOptions[0];
  };
  
  // KPI Targets - dynamic based on selected metric
  const getKpiTargets = () => {
    const baseTargets = {
      net_sales: {
        daily: 8000,
        monthly: 160000,
      },
      expenditure: {
        daily: 5000,
        monthly: 100000,
      },
      total_actuals_in_cedis: {
        daily: 5000,
        monthly: 100000,
      },
      total_credit: {
        daily: 7000,
        monthly: 140000,
      },
      total_collections: {
        daily: 9000,
        monthly: 180000,
      },
      total_sales_in_cedis: {
        daily: 9000,
        monthly: 180000,
      },
      total_variation_in_cedis: {
        daily: 9000,
        monthly: 180000,
      }
    };
    
    return baseTargets[selectedMetric] || baseTargets.net_sales;
  };

  // Get JWT token from localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  }

  // Handle token refresh when the current token expires
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('http://localhost:8000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Handle auth errors including token expiration
  const handleAuthError = async () => {
    // Try to refresh the token first
    const refreshSuccessful = await refreshToken();
    
    if (refreshSuccessful) {
      // If token refresh was successful, retry the original operation
      handleRefreshData();
    } else {
      // If refresh failed, clear tokens and show error message
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      // Save current path for redirection after login
      localStorage.setItem('lastVisitedPath', window.location.pathname);
      setError('Your session has expired. Please log in again.');
    }
  }

  // Fetch data based on selected year
    useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const token = getToken();
          if (!token) {
            throw new Error('Not authenticated');
          }
          
          const response = await fetch(`http://localhost:8000/api/entries/all?year=${year}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          if (!response.ok) {
            // Handle 401 Unauthorized specifically for token issues
            if (response.status === 401) {
              await handleAuthError();
              return; // Stop execution since we're handling the auth error
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const fetchedData = await response.json();
          setData(fetchedData);
          setError(null);
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("Failed to fetch stock summary. Please try again.");
        } finally {
          setLoading(false);
        }
      };
  
      if (user && !authLoading && year) {
        fetchData();
      }
    }, [user, authLoading, year]);
  
    // Handle year change from input or select
    const handleYearChange = (event) => {
      const inputYear = event.target.value;
      // Allow any numeric input, including partial numbers while typing
      if (/^\d{0,4}$/.test(inputYear)) {
        setYear(inputYear);
        
        // Only fetch data when a complete 4-digit year is entered
        if (inputYear.length === 4) {
          handleRefreshData();
        }
      }
    };

  /// Handle data refresh
  const handleRefreshData = async () => {
    if (!user) {
      setError("Authentication required. Please log in.");
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:8000/api/entries/all?year=${year}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Handle 401 Unauthorized specifically for token issues
        if (response.status === 401) {
          await handleAuthError();
          return; // Stop execution since we're handling the auth error
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const refreshedData = await response.json();
      setData(refreshedData);
      setError(null);
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError("Failed to refresh data. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // Filter data based on all filter criteria
  const getFilteredData = () => {
    if (!data || data.length === 0) return [];
    
    return data.filter(item => {
      // Branch filter
      const matchesBranch = selectedBranch === "All Branches" || item.branch === selectedBranch;
      
      
      // Date filtering - client-side filtering for dates
      let itemDate = null;
      try {
        if (item.date) {
          itemDate = new Date(item.date);
        }
      } catch (e) {
        console.error("Error parsing date:", item.date, e);
      }
      
      // Only apply date filters if we have a valid date
      let matchesDate = true;
      if (itemDate) {
        // Apply year filter if provided
        if (year && year.length === 4) {
          matchesDate = matchesDate && itemDate.getFullYear() === parseInt(year);
        }
        
        // Apply month filter if provided (JavaScript months are 0-indexed)
        if (month && /^\d{1,2}$/.test(month)) {
          matchesDate = matchesDate && itemDate.getMonth() === parseInt(month) - 1;
        }
        
        // Apply day filter if provided
        if (day && /^\d{1,2}$/.test(day)) {
          matchesDate = matchesDate && itemDate.getDate() === parseInt(day);
        }
      }
      
      return matchesBranch && matchesDate;
    });
  };

  
  
  // Calculate KPI metrics based on filtered data and selected metric
  const calculateKPIs = (filteredData) => {
    // Default values if no data
    if (!filteredData || filteredData.length === 0) {
      return {
        totalValue: 0,
        dailyProgress: 0,
        monthlyProgress: 0,
        dailyValue: 0,
        monthlyValue: 0,
        trend: 'neutral' // can be 'up', 'down', or 'neutral'
      };
    }
    
    // Get current metric configuration
    const currentMetric = getCurrentMetric();
    const metric = currentMetric.value;
    console.log(filteredData);
    
    // Calculate total value for selected metric
    const totalValue = filteredData.reduce((sum, item) => {
      return sum + (parseFloat(item[metric]) || 0);
    }, 0);
    
    
    
    
    {/*
    // Find top branch by metric if not already filtered by branch
    const branchMap = {};
    if (selectedBranch === "All Branches") {
      filteredData.forEach(item => {
        const branch = item.branch || 'Unknown';
        const value = parseFloat(item[metric]) || 0;
        branchMap[branch] = (branchMap[branch] || 0) + value;
      });
    }
    
    
    const topBranch = selectedBranch !== "All Branches" ? selectedBranch : 
      (Object.entries(branchMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None');
    */}

    // Get the current targets for the selected metric
    const targets = getKpiTargets();
    
    // Parse dates for filtering
    const formatDateString = (dateStr) => {
      // Handle different date formats and return a standardized date object
      if (!dateStr) return null;
      
      try {
        // Attempt to parse the date
        return new Date(dateStr);
      } catch (error) {
        console.error('Error parsing date:', dateStr, error);
        return null;
      }
    };
    
    // Get current date information
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based
    const currentYear = parseInt(year) || today.getFullYear();
    
    // Log for debugging
    console.log('Current filters:', { currentDay, currentMonth, currentYear });
    
    // If we have applied date filters through the UI, use those instead of current date
    // Make sure we use the user-selected date filters instead of current date
    let selectedMonth = currentMonth;
    let selectedDay = currentDay;
    
    // Check if month filter is applied
    if (month && month.length > 0) {
      selectedMonth = parseInt(month);
      console.log('Using custom month filter:', selectedMonth);
    }
    
    // Check if day filter is applied
    if (day && day.length > 0) {
      selectedDay = parseInt(day);
      console.log('Using custom day filter:', selectedDay);
    }
    
    // Filter data by day for daily metrics
    const dailyData = filteredData.filter(item => {
      if (!item.date) return false;
      
      const itemDate = formatDateString(item.date);
      if (!itemDate) return false;
      
      const itemDay = itemDate.getDate();
      const itemMonth = itemDate.getMonth() + 1;
      const itemYear = itemDate.getFullYear();
      
      // Match the exact day, month, and year
      return itemDay === selectedDay && 
             itemMonth === selectedMonth && 
             itemYear === currentYear;
    });
    
    // Filter data by month for monthly metrics
    const monthlyData = filteredData.filter(item => {
      if (!item.date) return false;
      
      const itemDate = formatDateString(item.date);
      if (!itemDate) return false;
      
      const itemMonth = itemDate.getMonth() + 1;
      const itemYear = itemDate.getFullYear();
      
      // Match the month and year, regardless of day
      return itemMonth === selectedMonth && 
             itemYear === currentYear;
    });
    
    // Log filtered data counts for debugging
    console.log('Filtered data counts:', { 
      total: filteredData.length,
      daily: dailyData.length, 
      monthly: monthlyData.length 
    });

    // Calculate daily and monthly totals
    const dailyValue = dailyData.reduce((sum, item) => {
      return sum + (parseFloat(item[metric]) || 0);
    }, 0);

    const monthlyValue = monthlyData.reduce((sum, item) => {
      return sum + (parseFloat(item[metric]) || 0);
    }, 0);
    
    // Calculate KPI progress percentages
    const dailyProgress = Math.min(100, (dailyValue / targets.daily) * 100);
    const monthlyProgress = Math.min(100, (monthlyValue / targets.monthly) * 100);
    
    // Determine trend based on current progress
    let trend = 'neutral';
    if (dailyProgress > 50) trend = 'up';
    else if (dailyProgress < 30) trend = 'down';
    
    return {
      totalValue,
      dailyProgress,
      monthlyProgress,
      dailyValue,
      monthlyValue,
      trend
    };
  };

  // Update chart when inputs change
  useEffect(() => {
    if (!data || data.length === 0 || !xAxis || !yAxis || !graphType) {
      return;
    }

    const filteredData = getFilteredData();
    
    // Create plot based on selected graph type
    const newLayout = {
      title: `${yAxis.charAt(0).toUpperCase() + yAxis.slice(1)} by ${xAxis.charAt(0).toUpperCase() + xAxis.slice(1)}`,
      autosize: true,
      font: {
        family: "Arial, sans-serif",
        size: 12
      },
      margin: {
        l: 50,
        r: 50,
        t: 80,
        b: 80
      }
    };

    let newPlotData = [];

    switch (graphType) {
      case 'bar':
        // Sort and limit data for bar chart
        const barData = [...filteredData]
          .sort((a, b) => (b[yAxis] || 0) - (a[yAxis] || 0))
          .slice(0, 10); // Top 10 items
          
        newPlotData = [{
          x: barData.map(row => row[xAxis] || 'Unknown'),
          y: barData.map(row => row[yAxis] || 0),
          type: 'bar',
          marker: {
            color: 'rgb(54, 162, 235)'
          },
          name: yAxis
        }];
        break;
        
      case 'line':
        // For line charts, we need to aggregate by date or another dimension
        const lineData = {};
        filteredData.forEach(row => {
          const key = row[xAxis] ? row[xAxis].toString() : 'Unknown';
          const value = parseFloat(row[yAxis]) || 0;
          
          if (lineData[key]) {
            lineData[key] += value;
          } else {
            lineData[key] = value;
          }
        });
        
        // Sort data by keys (useful for dates)
        const sortedKeys = Object.keys(lineData).sort();
        
        newPlotData = [{
          x: sortedKeys,
          y: sortedKeys.map(key => lineData[key]),
          type: 'scatter',
          mode: 'lines+markers',
          marker: {
            color: 'rgb(75, 192, 192)'
          },
          name: yAxis
        }];
        break;

      case 'pie':
        // For pie charts, aggregate data by the xAxis dimension
        const aggregatedData = {};
        filteredData.forEach(row => {
          const key = row[xAxis] ? row[xAxis].toString() : 'Unknown';
          const value = parseFloat(row[yAxis]) || 0;
          
          if (aggregatedData[key]) {
            aggregatedData[key] += value;
          } else {
            aggregatedData[key] = value;
          }
        });
        
        // Sort by value and limit to top 10 for better visualization
        const pieEntries = Object.entries(aggregatedData)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        newPlotData = [{
          labels: pieEntries.map(entry => entry[0]),
          values: pieEntries.map(entry => entry[1]),
          type: 'pie',
          hole: 0.4,
          marker: {
            colors: [
              '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF',
              '#FF9F40', '#C9CBCF', '#7FC8F8', '#FFADAD', '#FFD6A5'
            ]
          },
          textinfo: "label+percent",
          textposition: "outside",
          automargin: true
        }];
        
        // Adjust layout for pie chart
        newLayout.height = 500;
        break;

      default:
        newPlotData = [];
        newLayout.title = "Please select a graph type";
    }

    setPlotData(newPlotData);
    setLayout(newLayout);
  }, [data, xAxis, yAxis, graphType, selectedBranch, searchTerm]);

  // Get unique branches from the data
  const branches = ["All Branches", ...new Set(data.map(item => item.branch))].filter(Boolean).sort();

  // Get column options for dropdowns
  const getColumnOptions = () => {
    if (!data || data.length === 0) return [];
    
    // Get all keys from the first data item
    const sample = data[0] || {};
    return Object.keys(sample).filter(key => key == 'branch' || key == 'net_sales' || key == 'expenditure' || key == 'sales_ago_in_cedis'
      || key == 'sales_pms_in_cedis' || key == 'total_sales_in_cedis' || key == 'actuals_in_cedis_ago' || key == 'actuals_in_cedis_pms'
      || key == 'total_actuals_in_cedis' || key == 'variation_in_cedis_ago' || key == 'variation_in_cedis_pms' || 
      key == 'total_variation_in_cedis' || key == 'credit_ago' || key == 'credit_pms' || key == 'total_credit' ||
      key == 'collections_cash' || key == 'collections_cheque' || key == 'total_collections'
    );
  };

  const columnOptions = getColumnOptions();
  const filteredData = getFilteredData();
  const kpis = calculateKPIs(filteredData);

  // Get the current metric for display
  const currentMetric = getCurrentMetric();

  // Function to handle login button click
  const handleLoginRedirect = () => {
    window.location.href = '/login';
  }

  return (
    <Container maxWidth="xl" className="mt-4">
      {/* Header Section */}
      <GradientCard>
        <Box p={3}>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <BarChart sx={{ mr: 1, color: '#1976d2' }} /> JusBoard Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Comprehensive view of your business metrics and performance indicators
          </Typography>
          
          {/* Filters Section */}
          <FilterContainer sx={{ mt: 3 }}>
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                <strong>Branch:</strong> Select a specific branch or view all branches
              </Typography>
              <BranchAutocomplete
                value={selectedBranch}
                onChange={(branch) => setSelectedBranch(branch || "All Branches")}
              />
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%', alignItems: 'flex-end' }}>
              {/* Date Filters */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  <CalendarToday fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} /> 
                  Date Filters
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Year"
                    size="small"
                    value={year}
                    onChange={(e) => {
                      const newYear = e.target.value;
                      if (/^\d*$/.test(newYear)) setYear(newYear);
                    }}
                    onBlur={() => {
                      if (year.length === 4) handleRefreshData();
                    }}
                    inputProps={{ 
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      maxLength: 4
                    }}
                    sx={{ width: '100px' }}
                    placeholder="YYYY"
                  />
                  
                  <Box sx={{ position: 'relative', display: 'inline-block', mr: 2 }}>
                    <TextField
                      label="Month"
                      size="small"
                      value={month}
                      onChange={(e) => {
                        const newMonth = e.target.value;
                        if (/^\d*$/.test(newMonth) && parseInt(newMonth) <= 12) setMonth(newMonth);
                      }}
                      onBlur={handleRefreshData}
                      inputProps={{ 
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        maxLength: 2
                      }}
                      sx={{ width: '80px' }}
                      placeholder="MM"
                    />
                    {month && (
                      <Tooltip title="Clear month filter">
                        <IconButton 
                          size="small"
                          sx={{ 
                            position: 'absolute', 
                            top: '-12px', 
                            right: '-12px', 
                            bgcolor: 'rgba(211, 211, 211, 0.7)',
                            width: '20px', 
                            height: '20px', 
                            p: 0,
                            '&:hover': {
                              bgcolor: 'rgba(211, 211, 211, 0.9)'
                            }
                          }}
                          onClick={() => {
                            setMonth("");
                            handleRefreshData();
                          }}
                        >
                          <CloseIcon sx={{ fontSize: '12px' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <TextField
                      label="Day"
                      size="small"
                      value={day}
                      disabled={!month} // Disable day if month is not selected
                      onChange={(e) => {
                        const newDay = e.target.value;
                        if (/^\d*$/.test(newDay) && parseInt(newDay) <= 31) setDay(newDay);
                      }}
                      onBlur={handleRefreshData}
                      inputProps={{ 
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        maxLength: 2
                      }}
                      sx={{ width: '80px' }}
                      placeholder="DD"
                    />
                    {day && (
                      <Tooltip title="Clear day filter">
                        <IconButton 
                          size="small"
                          sx={{ 
                            position: 'absolute', 
                            top: '-12px', 
                            right: '-12px', 
                            bgcolor: 'rgba(211, 211, 211, 0.7)',
                            width: '20px', 
                            height: '20px', 
                            p: 0,
                            '&:hover': {
                              bgcolor: 'rgba(211, 211, 211, 0.9)'
                            }
                          }}
                          onClick={() => {
                            setDay("");
                            handleRefreshData();
                          }}
                        >
                          <CloseIcon sx={{ fontSize: '12px' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Box>
              
              {/* Metric Selection */}
              <Box sx={{ ml: 'auto' }}>
                <Typography variant="subtitle2" gutterBottom>
                  <Assessment fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} /> 
                  Metric Type
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {metricOptions.map(option => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      icon={React.cloneElement(option.icon, { fontSize: 'small' })}
                      onClick={() => setSelectedMetric(option.value)}
                      color={option.value === selectedMetric ? "primary" : "default"}
                      variant={option.value === selectedMetric ? "filled" : "outlined"}
                      sx={{ 
                        borderWidth: option.value === selectedMetric ? 2 : 1,
                        fontWeight: option.value === selectedMetric ? 'bold' : 'normal',
                        '&:hover': { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </FilterContainer>
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">
                Selected Branch: <Chip label={selectedBranch} size="small" color="primary" />
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Showing data for {filteredData.length} records
              </Typography>
            </Box>
            
            <Tooltip title="Refresh data">
              <IconButton 
                  onClick={handleRefreshData}
                  disabled={loading}
                  size="small"
                  sx={{ 
                      borderRadius: '4px', 
                      p: 0.5,
                      width: '24px',
                      height: '24px',
                      minWidth: '24px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                  }}
              >
                  {loading ? <CircularProgress size={10} color="inherit" /> : <RefreshIcon sx={{ fontSize: '20px' }} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </GradientCard>
      
      {error && (
                <Alert 
                  severity="error" 
                  className="mt-4 mx-6"
                  action={
                    error.includes('session has expired') && (
                      <Button color="inherit" size="small" onClick={handleLoginRedirect}>
                        Log In
                      </Button>
                    )
                  }
                >
                  {error}
                </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={5} flexDirection="column" alignItems="center">
          <CircularProgress size={50} thickness={4} />
          <Typography variant="body1" sx={{ mt: 2 }}>Loading your data...</Typography>
        </Box>
      ) : (
        <>
          {/* KPI Cards Section - Now just 3 cards as requested */}
          <Box mb={4}>
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 3, display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ mr: 1 }} /> Key Performance Indicators
              <Chip 
                label={`Selected Metric: ${currentMetric.label}`} 
                size="small" 
                color="primary" 
                icon={React.cloneElement(currentMetric.icon, { fontSize: 'small' })} 
                sx={{ ml: 2 }}
              />
            </Typography>
            
            <Grid container spacing={3}>
              {/* Daily KPI Card */}
              <Grid item xs={12} md={4}>
                <DailyCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="#185a9d">
                        Daily {currentMetric.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedBranch}
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'absolute', top: '8px', right: '8px' }}>
                      <Tooltip title="Daily Target">
                        <IconButton 
                          size="small" 
                          sx={{ 
                            p: 0.5,
                            bgcolor: 'rgba(67, 206, 162, 0.1)', 
                            color: '#43cea2',
                            width: '22px',
                            height: '22px',
                            minWidth: '22px'
                          }}
                        >
                          <CalendarToday sx={{ fontSize: '14px' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>
                      {kpis.dailyValue.toLocaleString('en-US', {style: 'currency', currency: 'GHS'})}
                    </Typography>
                    <Tooltip title={kpis.trend === 'up' ? 'Trending Up' : kpis.trend === 'down' ? 'Trending Down' : 'Neutral Trend'}>
                      <Box component="span">
                        {kpis.trend === 'up' && <ArrowUpward fontSize="small" color="success" />}
                        {kpis.trend === 'down' && <ArrowDownward fontSize="small" color="error" />}
                      </Box>
                    </Tooltip>
                  </Box>
                  
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Progress</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {Math.round(kpis.dailyProgress)}%
                      </Typography>
                    </Box>
                    <ProgressBar 
                      variant="determinate" 
                      value={kpis.dailyProgress} 
                      color="#43cea2"
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Target: {getKpiTargets().daily.toLocaleString('en-US', {style: 'currency', currency: 'GHS'})}
                      </Typography>
                      <Typography variant="body2" color="primary" fontWeight="medium">
                        {Math.round(kpis.dailyValue / getKpiTargets().daily * 100)}% of goal
                      </Typography>
                    </Box>
                  </Box>
                </DailyCard>
              </Grid>
              
              {/* Monthly KPI Card */}
              <Grid item xs={12} md={4}>
                <MonthlyCard>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="#6a11cb">
                        Monthly {currentMetric.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedBranch}
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'absolute', top: '8px', right: '8px' }}>
                      <Tooltip title="Monthly Target">
                        <IconButton 
                          size="small" 
                          sx={{ 
                            p: 0.5,
                            bgcolor: 'rgba(106, 17, 203, 0.1)', 
                            color: '#6a11cb',
                            width: '22px',
                            height: '22px',
                            minWidth: '22px'
                          }}
                        >
                          <CalendarToday sx={{ fontSize: '14px' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>
                      {kpis.monthlyValue.toLocaleString('en-US', {style: 'currency', currency: 'GHS'})}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Progress</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {Math.round(kpis.monthlyProgress)}%
                      </Typography>
                    </Box>
                    <ProgressBar 
                      variant="determinate" 
                      value={kpis.monthlyProgress} 
                      color="#6a11cb"
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Target: {getKpiTargets().monthly.toLocaleString('en-US', {style: 'currency', currency: 'GHS'})}
                      </Typography>
                      <Typography variant="body2" color="primary" fontWeight="medium">
                        {Math.round(kpis.monthlyValue / getKpiTargets().monthly * 100)}% of goal
                      </Typography>
                    </Box>
                  </Box>
                </MonthlyCard>
              </Grid>
            </Grid>
          </Box>
          
          {/* Graph Section with Controls */}
          <GradientCard>
            <Box p={3}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BarChart sx={{ mr: 1 }} /> Advanced Data Visualization
                <Chip 
                  label={`Chart Type: ${graphType.charAt(0).toUpperCase() + graphType.slice(1)}`} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 2 }}
                />
              </Typography>
              
              {/* Chart Controls in Clean Box */}
              <FilterContainer>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      variant="outlined"
                      size="small"
                      label="Search Data"
                      placeholder="Filter by keyword..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      fullWidth
                      InputProps={{
                        sx: { borderRadius: '8px', bgcolor: 'white' }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>X-Axis Dimension</InputLabel>
                      <Select
                        value={xAxis}
                        label="X-Axis Dimension"
                        onChange={(e) => {
                          e.preventDefault();
                          // Prevent scroll jump by setting a timeout
                          setTimeout(() => {
                            setXAxis(e.target.value);
                          }, 0);
                        }}
                        MenuProps={{ 
                          anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                          },
                          transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                          },
                          // Prevent scroll positioning after selection
                          disableScrollLock: true,
                          getContentAnchorEl: null
                        }}
                        sx={{ borderRadius: '8px', bgcolor: 'white' }}
                      >
                        {columnOptions.map(option => (
                          <MenuItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Y-Axis Metric</InputLabel>
                      <Select
                        value={yAxis}
                        label="Y-Axis Metric"
                        onChange={(e) => {
                          e.preventDefault();
                          // Prevent scroll jump by setting a timeout
                          setTimeout(() => {
                            setYAxis(e.target.value);
                          }, 0);
                        }}
                        MenuProps={{ 
                          anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                          },
                          transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                          },
                          // Prevent scroll positioning after selection
                          disableScrollLock: true,
                          getContentAnchorEl: null
                        }}
                        sx={{ borderRadius: '8px', bgcolor: 'white' }}
                      >
                        {columnOptions.map(option => (
                          <MenuItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Visualization Type</InputLabel>
                        <Select
                          value={graphType}
                          label="Visualization Type"
                          onChange={(e) => {
                            e.preventDefault();
                            // Prevent scroll jump by setting a timeout
                            setTimeout(() => {
                              setGraphType(e.target.value);
                            }, 0);
                          }}
                          MenuProps={{ 
                            anchorOrigin: {
                              vertical: 'bottom',
                              horizontal: 'left',
                            },
                            transformOrigin: {
                              vertical: 'top',
                              horizontal: 'left',
                            },
                            // Prevent scroll positioning after selection
                            disableScrollLock: true,
                            getContentAnchorEl: null
                          }}
                          sx={{ borderRadius: '8px', bgcolor: 'white' }}
                        >
                          <MenuItem value="pie">Pie Chart</MenuItem>
                          <MenuItem value="bar">Bar Chart</MenuItem>
                          <MenuItem value="line">Line Chart</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <Tooltip title="Refresh data">
                        <IconButton 
                          onClick={handleRefreshData}
                          disabled={loading}
                          size="small"
                          sx={{ 
                            borderRadius: '4px', 
                            p: 0.5,
                            width: '24px',
                            height: '24px',
                            minWidth: '24px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'primary.dark'
                            }
                          }}
                        >
                          {loading ? <CircularProgress size={10} color="inherit" /> : <RefreshIcon sx={{ fontSize: '20px' }} />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
              </FilterContainer>
              
              {/* The Chart with Beautiful Container */}
              <Card 
                elevation={0}
                sx={{ 
                  backgroundColor: 'white', 
                  padding: '24px',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  borderRadius: '16px',
                  minHeight: '500px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden'
                }}
              >
                <Typography variant="h6" fontWeight="medium" gutterBottom sx={{ color: '#1976d2' }}>
                  {layout.title}
                </Typography>
                
                <Box sx={{ width: '100%', flex: 1, minHeight: '450px', position: 'relative' }}>
                  {plotData.length > 0 ? (
                    <Plot
                      data={plotData}
                      layout={{
                        ...layout,
                        width: '100%',
                        height: 500,
                        autosize: true,
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        font: {
                          family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
                          size: 12,
                          color: 'rgba(0, 0, 0, 0.87)'
                        },
                        margin: {
                          l: 50,
                          r: 30,
                          t: 50,
                          b: 80
                        }
                      }}
                      style={{ width: '100%' }}
                      useResizeHandler={true}
                      config={{
                        displayModeBar: true,
                        displaylogo: false,
                        responsive: true,
                        toImageButtonOptions: {
                          format: 'png',
                          filename: `${currentMetric.label}_chart`,
                          height: 500,
                          width: 800,
                          scale: 2
                        },
                        // Increase tooltip text size and hover time
                        hoverlabel: {
                          font: {
                            size: 16,
                            family: "Arial, sans-serif"
                          },
                          bgcolor: 'rgba(255, 255, 255, 0.95)',
                          bordercolor: '#1976d2',
                          namelength: -1  // Show full text
                        },
                        // Prevent tooltips from being cut off
                        showlegend: true,
                        hovermode: 'closest',
                        hoverdistance: -1
                      }}
                    />
                  ) : (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: '100%',
                        color: 'text.secondary',
                        flexDirection: 'column'
                      }}
                    >
                      <BarChart sx={{ fontSize: 60, color: 'rgba(0,0,0,0.1)', mb: 2 }} />
                      <Typography>Select chart parameters to generate visualization</Typography>
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  width: '100%',
                  mt: 2,
                  borderTop: '1px solid rgba(0,0,0,0.05)',
                  paddingTop: 2
                }}>
                  <Typography variant="body2" color="textSecondary">
                    Showing visualization based on {filteredData.length} data points
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="primary" sx={{ mr: 1 }}>
                      {`X: ${xAxis} • Y: ${yAxis}`}
                    </Typography>
                    <Chip 
                      label={`${selectedBranch}`}
                      size="small" 
                      variant="outlined" 
                      color="primary" 
                    />
                  </Box>
                </Box>
              </Card>
            </Box>
          </GradientCard>
        </>
      )}
    </Container>
  );
}
