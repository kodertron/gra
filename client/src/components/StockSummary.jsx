import React, { useState, useEffect } from 'react';
import { 
  AppBar,
  Toolbar,
  Container,
  Grid,
  Card,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/system';
import { useAuth } from '../contexts/AuthContext';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import CalendarToday from '@mui/icons-material/CalendarToday';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Styled component for the gradient card
const GradientCard = styled(Card)({
  background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
  marginBottom: '20px',
});

function StockSummary() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  
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
        
        const response = await fetch(`http://localhost:8000/api/entries/stock-summary?year=${year}`, {
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

  // Handle data refresh
  const handleRefreshData = async () => {
    if (!user) {
      setError("Authentication required. Please log in.");
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:8000/api/entries/stock-summary?year=${year}`, {
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
    window.location.href = '/login';
  }
  
  // Handle CSV download
  const handleDownloadCSV = () => {
    // Apply filters to get the data we want to export
    let filteredData = [...data];
    
    // Filter by branch
    if (branchFilter) {
      filteredData = filteredData.filter(item => item.branch === branchFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = filteredData.filter(item => {
        return (
          (item.branch && item.branch.toLowerCase().includes(searchLower)) ||
          (item.year && item.year.toString().includes(searchLower))
        );
      });
    }
    
    if (filteredData.length === 0) return;
    
    // Format data as CSV
    const headers = ['Branch', 'AGO', 'PMS', 'Year'];
    const csvContent = [
      // Header row
      headers.join(','),
      // Data rows
      ...filteredData.map(item => [
        `"${item.branch?.replace(/"/g, '""') || ''}"`, // Escape quotes in strings
        typeof item.total_ago === 'number' ? item.total_ago.toString() : '',
        typeof item.total_pms === 'number' ? item.total_pms.toString() : '',
        item.year
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set up and trigger download
    let dateStr = year;
    // Note: In StockSummary.jsx we don't have month and day state variables by default
    // If you add these variables in the future, uncomment the code below
    /*
    if (month && month.length > 0) {
      dateStr += `-${month.padStart(2, '0')}`;
      if (day && day.length > 0) {
        dateStr += `-${day.padStart(2, '0')}`;
      }
    }
    */
    const fileName = `stock_summary_${dateStr}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen">
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'blue' }}>
            JusBoard
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" className="mt-4">
        <GradientCard>
          <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Stock Summary</Typography>
          </Box>
          
          {/* Compact Filter Bar */}
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
                placeholder="Search branch or year"
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
                {data && [...new Set(data.map(item => item.branch))].sort().map(branch => (
                  <MenuItem key={branch} value={branch}>{branch}</MenuItem>
                ))}
              </TextField>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ mr: 1 }}>
                  <CalendarToday fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} /> 
                  Year:
                </Typography>
                
                <TextField
                  label="Year"
                  value={year}
                  onChange={(e) => {
                    const newYear = e.target.value;
                    if (/^\d{0,4}$/.test(newYear)) { // Only allow up to 4 digits
                      window.requestAnimationFrame(() => {
                        setYear(newYear);
                      });
                    }
                  }}
                  onBlur={() => {
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
                  size="small"
                  inputMode="numeric"
                  inputProps={{ 
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    maxLength: 4
                  }}
                  sx={{ width: '100px', backgroundColor: 'white' }}
                  placeholder="YYYY"
                />
                
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
                    disabled={loading || data.length === 0}
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
          <Box className="text-center my-8">
            <CircularProgress />
            <Typography className="mt-4">Loading stock summary data...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3} className="p-4" justifyContent="center">
            <Grid item xs={12} md={10} lg={8}>
              {(() => {
                // Apply filters
                let filteredData = [...data];
                
                // Filter by branch
                if (branchFilter) {
                  filteredData = filteredData.filter(item => item.branch === branchFilter);
                }
                
                // Filter by search term
                if (searchTerm) {
                  const searchLower = searchTerm.toLowerCase();
                  filteredData = filteredData.filter(item => {
                    // Search in all relevant text fields
                    return (
                      // Check branch name
                      (item.branch && item.branch.toLowerCase().includes(searchLower)) ||
                      // Check year
                      (item.year && item.year.toString().includes(searchLower))
                    );
                  });
                }
                
                if (data.length === 0) {
                  return (
                    <Box className="mt-4 mx-4 p-6 text-center rounded-lg border border-gray-300">
                      <Typography variant="h6">No stock summary data available for {year}</Typography>
                    </Box>
                  );
                }
                
                // If no results after filtering
                if (filteredData.length === 0) {
                  return (
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
                        No matching stock data found. Try adjusting your filters.
                      </Typography>
                    </Box>
                  );
                }
                
                return (
                <div className="overflow-x-auto shadow rounded-lg mx-auto">
                  <Typography variant="h6" className="p-4">Stock Summary for {year}</Typography>
                  <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Branch</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>AGO</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>PMS</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Year</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredData.map((row, index) => (
                        <TableRow key={index} sx={{ 
                          backgroundColor: row.branch === 'Total' ? '#f8f8f8' : 'white'
                        }}>
                          <TableCell sx={{ fontWeight: row.branch === 'Total' ? 'bold' : 'normal' }}>
                            {row.branch}
                          </TableCell>
                          <TableCell sx={{ fontWeight: row.branch === 'Total' ? 'bold' : 'normal' }}>
                            {typeof row.total_ago === 'number' ? row.total_ago.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : row.total_ago}
                          </TableCell>
                          <TableCell sx={{ fontWeight: row.branch === 'Total' ? 'bold' : 'normal' }}>
                            {typeof row.total_pms === 'number' ? row.total_pms.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : row.total_pms}
                          </TableCell>
                          <TableCell sx={{ fontWeight: row.branch === 'Total' ? 'bold' : 'normal' }}>
                            {row.year}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredData.length > 0 && (
                    <Typography className="text-gray-500 text-center p-2">
                      Showing {filteredData.length} records
                    </Typography>
                  )}
                </div>
              );
            })()}
            </Grid>
          </Grid>
        )}
      </Container>
    </div>
  );
}

export default StockSummary;