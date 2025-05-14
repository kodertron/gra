import React, { useState, useEffect } from 'react';
import { 
  Container,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Typography,
  Button,
  Box,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/system';
import { useAuth } from '../contexts/AuthContext';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import CalendarToday from '@mui/icons-material/CalendarToday';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Styled component for the gradient card
const GradientCard = styled(Card)({
  background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
  marginBottom: '20px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  borderRadius: '8px'
});

const TableContainer = styled(Paper)({
  overflowX: 'auto',
  overflowY: 'auto',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  margin: '16px 0',
  maxHeight: 'calc(100vh - 250px)', // Limit height to enable vertical scrolling
  '& .MuiTable-root': {
    borderCollapse: 'separate',
    borderSpacing: 0,
    width: 'max-content', // Allow table to be as wide as needed
    minWidth: '100%'
  }
});

const HeaderCell = styled(TableCell)({
  fontWeight: 'bold',
  backgroundColor: '#f0f0f0',
  borderRight: '1px solid #c0c0c0',
  borderBottom: '2px solid #1976d2',
  padding: '12px 8px',
  position: 'sticky',
  top: 0,
  zIndex: 2,
  whiteSpace: 'nowrap',
  fontSize: '0.75rem',
  textAlign: 'center',
  '&:hover': {
    backgroundColor: '#e8e8e8'
  }
});

const StyledTableCell = styled(TableCell)({
  borderRight: '1px solid #e0e0e0',
  borderBottom: '1px solid #e0e0e0',
  padding: '6px 8px',
  fontSize: '0.75rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '&:last-child': {
    borderRight: '1px solid #e0e0e0'
  },
  '&[align="right"]': {
    backgroundColor: '#fafffe'
  }
});

const StyledTableRow = styled(TableRow)({
  '&:nth-of-type(odd)': {
    backgroundColor: '#fafafa'
  },
  '&:nth-of-type(even)': {
    backgroundColor: '#ffffff'
  },
  '&:hover': {
    backgroundColor: '#e6f2ff'
  },
  // Fix height to make rows consistent
  height: '36px'
});

const SortIconContainer = styled(Box)({
  display: 'inline-flex',
  marginLeft: '4px',
  alignItems: 'center'
});

function Dash() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Get JWT token from localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  }

  // Handle token refresh when the current token expires
  const refreshToken = async () => {
    try {
      const refreshToken = getToken();
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch('http://localhost:8000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({refresh_token: refreshToken})
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return true;
    } catch (error) {
      console.error('Token refesh failed:', error);
      return false;
    }
  };

  // Handle auth error including token expiration
  const handleAuthError = async () => {
    // Try to refresh then token first
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


  // Handle data refresh
  const handleRefreshData = async () => {
    if (!user) {
      setError("Authentication required. Please log in.");
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      let url = `http://localhost:8000/api/entries/all?year=${year}`;
      
      // Add month and day to URL if they exist
      if (month && month.length > 0) {
        url += `&month=${month}`;
      }
      
      if (day && day.length > 0) {
        url += `&day=${day}`;
      }
      
      const response = await fetch(url, {
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

  // Function to handle login button click
  const handleLoginRedirect = () => {
    // Save the current path before redirecting
    localStorage.setItem('lastVisitedPath', window.location.pathname);
    window.location.href = '/login';
  }

  

  // Fetch data when component mounts or user changes
  useEffect(() => {
    if (user && !authLoading) {
      handleRefreshData();
    }
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Optimized data filtering with performance improvements
  const getFilteredData = (sourceData) => {
    if (!sourceData || sourceData.length === 0) return [];
    
    // First check if we need to do any filtering at all
    const hasDateFilter = (year && year.length === 4) || (month && month.length > 0) || (day && day.length > 0);
    const hasBranchFilter = !!branchFilter;
    const hasSearchFilter = !!searchTerm;
    
    // If no filters, return all data (improves performance)
    if (!hasDateFilter && !hasBranchFilter && !hasSearchFilter && !sortConfig.key) {
      return sourceData;
    }
    
    // Apply filters in stages for better performance
    let filteredData = sourceData;
    
    // Branch filter (fastest, do first)
    if (hasBranchFilter) {
      filteredData = filteredData.filter(item => item.branch === branchFilter);
    }
    
    // Date filter (next fastest) - with optimized date parsing
    if (hasDateFilter) {
      // Pre-parse the filter values once, not for every item
      const yearValue = year && year.length === 4 ? parseInt(year) : null;
      const monthValue = month && /^\d{1,2}$/.test(month) ? parseInt(month) - 1 : null;
      const dayValue = day && /^\d{1,2}$/.test(day) ? parseInt(day) : null;
      
      // Create a date cache to avoid reparsing the same dates
      const dateCache = new Map();
      
      filteredData = filteredData.filter(item => {
        // Skip date filtering if item has no date
        if (!item.date) return false;
        
        // Use cached date if available
        let itemDate;
        if (dateCache.has(item.date)) {
          itemDate = dateCache.get(item.date);
        } else {
          try {
            // Instead of parsing the full date string each time, extract just the parts we need
            const dateParts = item.date.split(/[\/,:\s]/); // Split by /, comma, colon or whitespace
            
            // Simpler approach - still use Date but cache the result
            itemDate = new Date(item.date);
            dateCache.set(item.date, itemDate);
          } catch (e) {
            return false;
          }
        }
        
        // Apply all date filters together with pre-parsed values
        if (yearValue !== null && itemDate.getFullYear() !== yearValue) {
          return false;
        }
        
        if (monthValue !== null && itemDate.getMonth() !== monthValue) {
          return false;
        }
        
        if (dayValue !== null && itemDate.getDate() !== dayValue) {
          return false;
        }
        
        return true;
      });
    }
    
    // Search filter (most expensive, do last)
    if (hasSearchFilter) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = filteredData.filter(item => {
        return Object.values(item).some(value => 
          value && typeof value === 'string' && value.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply sorting if a sort configuration exists
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        // Handle numeric values
        if (typeof a[sortConfig.key] === 'number' && typeof b[sortConfig.key] === 'number') {
          return sortConfig.direction === 'asc' 
            ? a[sortConfig.key] - b[sortConfig.key] 
            : b[sortConfig.key] - a[sortConfig.key];
        }
        
        // Handle string values
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      });
    }
    
    return filteredData;
  };
  
  // Get the unique branches from the data
  const getBranches = () => {
    if (!data || data.length === 0) return [];
    return [...new Set(data.map(item => item.branch))].filter(Boolean).sort();
  };

  // Handle year input change with optimized performance
  const handleYearChange = (e) => {
    const newYear = e.target.value;
    if (/^\d{0,4}$/.test(newYear)) { // Only allow up to 4 digits
      // Use requestAnimationFrame to defer state update to next frame for better UI responsiveness
      window.requestAnimationFrame(() => {
        setYear(newYear);
      });
    }
  };

  // Function to format numbers with 2 decimal places
  const formatNumber = (value) => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'number') {
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return value;
  };
  
  // Handle CSV download
  const handleDownloadCSV = () => {
    if (filteredData.length === 0) return;
    
    // Define columns to include in the CSV
    const columnsToInclude = {
      'date': 'Date',
      'branch': 'Branch',
      'opening_meter_reading_ago': 'Opening Meter AGO',
      'closing_meter_reading_ago': 'Closing Meter AGO',
      'opening_meter_reading_pms': 'Opening Meter PMS',
      'closing_meter_reading_pms': 'Closing Meter PMS',
      'opening_tank_reading_ago': 'Opening Tank AGO',
      'closing_tank_reading_ago': 'Closing Tank AGO',
      'opening_tank_reading_pms': 'Opening Tank PMS',
      'closing_tank_reading_pms': 'Closing Tank PMS',
      'pump_test_ago': 'Pump Test AGO',
      'pump_test_pms': 'Pump Test PMS',
      'total_pump_test': 'Total Pump Test',
      'received_ago': 'Received AGO',
      'received_pms': 'Received PMS',
      'total_received': 'Total Received',
      'sales_ago': 'Sales AGO',
      'sales_pms': 'Sales PMS',
      'total_sales': 'Total Sales',
      'actuals_ago': 'Actuals AGO',
      'actuals_pms': 'Actuals PMS',
      'total_actuals': 'Total Actuals',
      'variation_ago': 'Variation AGO',
      'variation_pms': 'Variation PMS',
      'total_variation': 'Total Variation',
      'unit_price_ago': 'Unit Price AGO',
      'unit_price_pms': 'Unit Price PMS',
      'sales_in_cedis_ago': 'Sales in Cedis AGO',
      'sales_in_cedis_pms': 'Sales in Cedis PMS',
      'total_sales_in_cedis': 'Total Sales in Cedis',
      'actuals_in_cedis_ago': 'Actuals in Cedis AGO',
      'actuals_in_cedis_pms': 'Actuals in Cedis PMS',
      'total_actuals_in_cedis': 'Total Actuals in Cedis',
      'variation_in_cedis_ago': 'Variation in Cedis AGO',
      'variation_in_cedis_pms': 'Variation in Cedis PMS',
      'total_variation_in_cedis': 'Total Variation in Cedis',
      'collections_cash': 'Collections Cash',
      'collections_cheque': 'Collections Cheque',
      'total_collections': 'Total Collections',
      'credit_ago': 'Credit AGO',
      'credit_pms': 'Credit PMS',
      'total_credit': 'Total Credit',
      'expenditure': 'Expenditure',
      'comment': 'Comment',
      'net_sales': 'Net Sales'
    };
    
    // Get headers and their corresponding keys
    const headers = Object.values(columnsToInclude);
    const keys = Object.keys(columnsToInclude);
    
    // Format data as CSV
    const csvContent = [
      // Header row
      headers.join(','),
      // Data rows
      ...filteredData.map(item => {
        return keys.map(key => {
          const value = item[key];
          // Format numbers for CSV
          if (typeof value === 'number') {
            return value.toString();
          }
          // Handle strings, escape quotes and wrap in quotes
          else if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;  // Escape quotes
          }
          // Handle dates
          else if (key === 'date' && value instanceof Date) {
            return value.toISOString().split('T')[0];
          }
          // Handle undefined/null
          return '';
        }).join(',');
      })
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set up and trigger download
    let dateStr = year;
    if (month && month.length > 0) {
      dateStr += `-${month.padStart(2, '0')}`;
      if (day && day.length > 0) {
        dateStr += `-${day.padStart(2, '0')}`;
      }
    }
    const fileName = `sales_data_${dateStr}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cache parsed data once it's loaded to improve performance
  const [parsedData, setParsedData] = useState([]);
  
  // When raw data changes, preprocess and cache date values
  useEffect(() => {
    if (data && data.length > 0) {
      // Pre-parse dates for better performance
      const processed = data.map(item => {
        if (item.date) {
          try {
            // Store pre-computed date parts for efficient filtering
            const dateObj = new Date(item.date);
            return {
              ...item,
              _dateYear: dateObj.getFullYear(),
              _dateMonth: dateObj.getMonth(),
              _dateDay: dateObj.getDate()
            };
          } catch (e) {
            return item;
          }
        }
        return item;
      });
      setParsedData(processed);
    } else {
      setParsedData([]);
    }
  }, [data]);
  
  // Use useMemo with the preprocessed data for better performance
  const filteredData = React.useMemo(
    () => getFilteredData(parsedData), 
    [parsedData, year, month, day, branchFilter, searchTerm, sortConfig]
  );
  const branches = React.useMemo(() => getBranches(), [data]);

  // Function to handle column sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Function to render sort icon based on current sort state
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <SortIconContainer>
          <SwapVertIcon fontSize="small" sx={{ opacity: 0.3, fontSize: '0.875rem' }} />
        </SortIconContainer>
      );
    }
    
    return (
      <SortIconContainer>
        {sortConfig.direction === 'asc' ? (
          <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.875rem' }} color="primary" />
        ) : (
          <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.875rem' }} color="primary" />
        )}
      </SortIconContainer>
    );
  };

  return (
    <Container maxWidth="xl" className="mt-4">
      <GradientCard>
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 500 }}>Sales Data Dashboard</Typography>
        </Box>
        
        {/* Compact Filters Section */}
        <Box px={2} pb={2}>
          <Box 
            display="flex" 
            flexWrap="wrap" 
            alignItems="center"
            sx={{ 
              backgroundColor: '#f5f5f5', 
              borderRadius: '8px',
              padding: '12px',
              gap: '12px'
            }}
          >
            <TextField
              variant="outlined"
              size="small"
              label="Search"
              placeholder="Search by invoice, customer, product"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: '200px', backgroundColor: 'white' }}
            />
            
            <TextField
              select
              variant="outlined"
              size="small"
              label="Branch"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              sx={{ width: '150px', backgroundColor: 'white' }}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map(branch => (
                <MenuItem key={branch} value={branch}>{branch}</MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ mr: 1 }}>
                <CalendarToday fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} /> 
                Date Filters:
              </Typography>
              
              <TextField
                label="Year"
                size="small"
                value={year}
                onChange={handleYearChange}
                onBlur={() => {
                  // Only fetch data when focus leaves the field and year is complete
                  if (year.length === 4) {
                    handleRefreshData();
                  }
                }}
                // Prevent default behavior to improve responsiveness
                onKeyDown={(e) => {
                  // Prevent form submission
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                  }
                }}
                inputProps={{ 
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  maxLength: 4
                }}
                sx={{ width: '100px', backgroundColor: 'white' }}
                placeholder="YYYY"
              />
              
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
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
                  sx={{ width: '80px', backgroundColor: 'white' }}
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
                  sx={{ width: '80px', backgroundColor: 'white' }}
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
              
              <Tooltip title="Refresh data">
                <IconButton 
                  onClick={handleRefreshData}
                  disabled={loading}
                  size="small"
                  sx={{ 
                    borderRadius: '4px', 
                    p: 0.5,
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon sx={{ fontSize: '20px' }} />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Download as CSV">
                <IconButton 
                  onClick={handleDownloadCSV}
                  disabled={loading || filteredData.length === 0}
                  size="small"
                  sx={{ 
                    borderRadius: '4px', 
                    p: 0.5,
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    bgcolor: 'success.main',
                    color: 'white',
                    ml: 1,
                    '&:hover': {
                      bgcolor: 'success.dark'
                    }
                  }}
                >
                  <FileDownloadIcon sx={{ fontSize: '20px' }} />
                </IconButton>
              </Tooltip>
            </Box>
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
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : filteredData.length > 0 ? (
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <HeaderCell onClick={() => handleSort('branch')} sx={{ cursor: 'pointer', width: '120px', minWidth: '120px' }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    Branch {renderSortIcon('branch')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('date')} sx={{ cursor: 'pointer', width: '150px', minWidth: '150px' }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    Date {renderSortIcon('date')}
                  </Box>
                </HeaderCell>
                {/* AGO Meter Readings */}
                <HeaderCell onClick={() => handleSort('opening_meter_reading_ago')} sx={{ cursor: 'pointer', width: '100px', minWidth: '100px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Opening Meter AGO {renderSortIcon('opening_meter_reading_ago')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('closing_meter_reading_ago')} sx={{ cursor: 'pointer', width: '100px', minWidth: '100px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Closing Meter AGO {renderSortIcon('closing_meter_reading_ago')}
                  </Box>
                </HeaderCell>
                {/* PMS Meter Readings */}
                <HeaderCell onClick={() => handleSort('opening_meter_reading_pms')} sx={{ cursor: 'pointer', width: '100px', minWidth: '100px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Opening Meter PMS {renderSortIcon('opening_meter_reading_pms')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('closing_meter_reading_pms')} sx={{ cursor: 'pointer', width: '100px', minWidth: '100px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Closing Meter PMS {renderSortIcon('closing_meter_reading_pms')}
                  </Box>
                </HeaderCell>
                {/* AGO Tank Readings */}
                <HeaderCell onClick={() => handleSort('opening_tank_reading_ago')} sx={{ cursor: 'pointer', width: '100px', minWidth: '100px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Opening Tank AGO {renderSortIcon('opening_tank_reading_ago')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('closing_tank_reading_ago')} sx={{ cursor: 'pointer', width: '100px', minWidth: '100px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Closing Tank AGO {renderSortIcon('closing_tank_reading_ago')}
                  </Box>
                </HeaderCell>
                {/* PMS Tank Readings */}
                <HeaderCell onClick={() => handleSort('opening_tank_reading_pms')} sx={{ cursor: 'pointer', width: '100px', minWidth: '100px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Opening Tank PMS {renderSortIcon('opening_tank_reading_pms')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('closing_tank_reading_pms')} sx={{ cursor: 'pointer', width: '100px', minWidth: '100px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Closing Tank PMS {renderSortIcon('closing_tank_reading_pms')}
                  </Box>
                </HeaderCell>
                {/* Pump Tests */}
                <HeaderCell onClick={() => handleSort('pump_test_ago')} sx={{ cursor: 'pointer', width: '100px', minWidth: '100px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Pump Test AGO {renderSortIcon('pump_test_ago')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('pump_test_pms')} sx={{ cursor: 'pointer', width: '100px', minWidth: '100px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Pump Test PMS {renderSortIcon('pump_test_pms')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('total_pump_test')} sx={{ cursor: 'pointer', width: '100px', minWidth: '100px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Total Pump Test {renderSortIcon('total_pump_test')}
                  </Box>
                </HeaderCell>
                {/* Received */}
                <HeaderCell onClick={() => handleSort('received_ago')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Received AGO {renderSortIcon('received_ago')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('received_pms')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Received PMS {renderSortIcon('received_pms')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('total_received')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Total Received {renderSortIcon('total_received')}
                  </Box>
                </HeaderCell>
                {/* Sales */}
                <HeaderCell onClick={() => handleSort('sales_ago')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Sales AGO {renderSortIcon('sales_ago')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('sales_pms')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Sales PMS {renderSortIcon('sales_pms')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('total_sales')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Total Sales {renderSortIcon('total_sales')}
                  </Box>
                </HeaderCell>
                {/* Actuals */}
                <HeaderCell onClick={() => handleSort('actuals_ago')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Actuals AGO {renderSortIcon('actuals_ago')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('actuals_pms')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Actuals PMS {renderSortIcon('actuals_pms')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('total_actuals')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Total Actuals {renderSortIcon('total_actuals')}
                  </Box>
                </HeaderCell>
                {/* Variations */}
                <HeaderCell onClick={() => handleSort('variation_ago')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Variation AGO {renderSortIcon('variation_ago')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('variation_pms')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Variation PMS {renderSortIcon('variation_pms')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('total_variation')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Total Variation {renderSortIcon('total_variation')}
                  </Box>
                </HeaderCell>
                {/* Unit Prices */}
                <HeaderCell onClick={() => handleSort('unit_price_ago')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Unit Price AGO {renderSortIcon('unit_price_ago')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('unit_price_pms')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Unit Price PMS {renderSortIcon('unit_price_pms')}
                  </Box>
                </HeaderCell>
                {/* Sales in Cedis */}
                <HeaderCell onClick={() => handleSort('sales_in_cedis_ago')} sx={{ cursor: 'pointer', minWidth: '150px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Sales (GHS) AGO {renderSortIcon('sales_in_cedis_ago')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('sales_in_cedis_pms')} sx={{ cursor: 'pointer', minWidth: '150px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Sales (GHS) PMS {renderSortIcon('sales_in_cedis_pms')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('total_sales_in_cedis')} sx={{ cursor: 'pointer', minWidth: '150px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Total Sales (GHS) {renderSortIcon('total_sales_in_cedis')}
                  </Box>
                </HeaderCell>
                {/* Actuals in Cedis */}
                <HeaderCell onClick={() => handleSort('actuals_in_cedis_ago')} sx={{ cursor: 'pointer', minWidth: '150px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Actuals (GHS) AGO {renderSortIcon('actuals_in_cedis_ago')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('actuals_in_cedis_pms')} sx={{ cursor: 'pointer', minWidth: '150px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Actuals (GHS) PMS {renderSortIcon('actuals_in_cedis_pms')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('total_actuals_in_cedis')} sx={{ cursor: 'pointer', minWidth: '150px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Total Actuals (GHS) {renderSortIcon('total_actuals_in_cedis')}
                  </Box>
                </HeaderCell>
                {/* Variations in Cedis */}
                <HeaderCell onClick={() => handleSort('variation_in_cedis_ago')} sx={{ cursor: 'pointer', minWidth: '150px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Variation (GHS) AGO {renderSortIcon('variation_in_cedis_ago')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('variation_in_cedis_pms')} sx={{ cursor: 'pointer', minWidth: '150px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Variation (GHS) PMS {renderSortIcon('variation_in_cedis_pms')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('total_variation_in_cedis')} sx={{ cursor: 'pointer', minWidth: '150px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Total Variation (GHS) {renderSortIcon('total_variation_in_cedis')}
                  </Box>
                </HeaderCell>
                {/* Collections */}
                <HeaderCell onClick={() => handleSort('collections_cash')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Cash Collections {renderSortIcon('collections_cash')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('collections_cheque')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Cheque Collections {renderSortIcon('collections_cheque')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('total_collections')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Total Collections {renderSortIcon('total_collections')}
                  </Box>
                </HeaderCell>
                {/* Credit */}
                <HeaderCell onClick={() => handleSort('credit_ago')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Credit AGO {renderSortIcon('credit_ago')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('credit_pms')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Credit PMS {renderSortIcon('credit_pms')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('total_credit')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Total Credit {renderSortIcon('total_credit')}
                  </Box>
                </HeaderCell>
                {/* Other Fields */}
                <HeaderCell onClick={() => handleSort('expenditure')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Expenditure {renderSortIcon('expenditure')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('comment')} sx={{ cursor: 'pointer', minWidth: '200px' }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    Comment {renderSortIcon('comment')}
                  </Box>
                </HeaderCell>
                <HeaderCell onClick={() => handleSort('net_sales')} sx={{ cursor: 'pointer', minWidth: '130px' }} align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Net Sales {renderSortIcon('net_sales')}
                  </Box>
                </HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, index) => (
                <StyledTableRow key={index}>
                  <StyledTableCell>{row.branch}</StyledTableCell>
                  <StyledTableCell>{new Date(row.date).toLocaleString()}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.opening_meter_reading_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.closing_meter_reading_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.opening_meter_reading_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.closing_meter_reading_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.opening_tank_reading_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.closing_tank_reading_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.opening_tank_reading_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.closing_tank_reading_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.pump_test_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.pump_test_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.total_pump_test)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.received_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.received_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.total_received)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.sales_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.sales_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.total_sales)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.actuals_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.actuals_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.total_actuals)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.variation_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.variation_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.total_variation)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.unit_price_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.unit_price_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.sales_in_cedis_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.sales_in_cedis_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.total_sales_in_cedis)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.actuals_in_cedis_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.actuals_in_cedis_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.total_actuals_in_cedis)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.variation_in_cedis_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.variation_in_cedis_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.total_variation_in_cedis)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.collections_cash)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.collections_cheque)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.total_collections)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.credit_ago)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.credit_pms)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.total_credit)}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.expenditure)}</StyledTableCell>
                  <StyledTableCell>{row.comment}</StyledTableCell>
                  <StyledTableCell align="right">{formatNumber(row.net_sales)}</StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
          <Box p={2} textAlign="right" sx={{ borderTop: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
            <Typography variant="body2" color="textSecondary">
              Showing {filteredData.length} of {data.length} entries
            </Typography>
          </Box>
        </TableContainer>
      ) : (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="200px"
          border="1px dashed grey"
          borderRadius="4px"
          mt={3}
        >
          <Typography variant="h6" color="text.secondary">
            No data available. Try adjusting your filters or year selection.
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default Dash;
