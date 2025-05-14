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
  Box,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/system';
import { useAuth } from '../contexts/AuthContext';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Styled component for the gradient card
const GradientCard = styled(Card)({
  background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
  marginBottom: '20px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  borderRadius: '8px',
  padding: '16px'
});

const TableContainer = styled(Paper)({
  overflowX: 'auto',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  margin: '16px 0'
});

const HeaderCell = styled(TableCell)({
  fontWeight: 'bold',
  backgroundColor: '#f5f5f5'
});

const StyledTextField = styled(TextField)({
  marginBottom: '16px',
  marginRight: '16px'
});

function DashTrucks() {
  const { user, loading: authLoading } = useAuth();
  const [truckData, setTruckData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // Get JWT token from localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  }

  // Handle authentication errors
  const handleAuthError = async () => {
    // Save current path for redirection after login
    localStorage.setItem('lastVisitedPath', window.location.pathname);
    setError("Your session has expired. Please log in again.");
  };

  // Fetch trucks data from backend
  useEffect(() => {
    const fetchTrucksData = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        // Include year parameter if present
        let url = "http://localhost:8000/api/entries/all-trucks";
        if (year && year.length === 4) {
          url += `?year=${year}`;
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

        const jsonData = await response.json();
        
        // Format date for display
        const formattedData = jsonData.map(truck => ({
          ...truck,
          date: new Date(truck.date).toLocaleDateString(),
          formattedAgo: truck.ago.toFixed(2),
          formattedPms: truck.pms.toFixed(2),
          totalFuel: (truck.ago + truck.pms).toFixed(2)
        }));

        setTruckData(formattedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching truck data:", err);
        setError(err.message || "Failed to load truck data");
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data if user is authenticated
    if (user && !authLoading) {
      fetchTrucksData();
    }
  }, [user, authLoading, refreshTrigger]);

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle CSV download
  const handleDownloadCSV = () => {
    if (filteredTruckData.length === 0) return;
    
    // Format data as CSV
    const headers = ['Date', 'Branch', 'Truck Number', 'Driver', 'Destination', 'AGO', 'PMS', 'Total'];
    const csvContent = [
      // Header row
      headers.join(','),
      // Data rows
      ...filteredTruckData.map(truck => [
        truck.date,
        `"${truck.branch?.replace(/"/g, '""') || ''}"`, // Escape quotes in strings
        `"${truck.truck_number?.replace(/"/g, '""') || ''}"`,
        `"${truck.driver?.replace(/"/g, '""') || ''}"`,
        `"${truck.destination?.replace(/"/g, '""') || ''}"`,
        truck.formattedAgo,
        truck.formattedPms,
        truck.totalFuel
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set up and trigger download
    let dateStr = year;
    // Note: In DashTrucks.jsx we don't have month and day state variables
    // If you add these variables in the future, uncomment the code below
    /*
    if (month && month.length > 0) {
      dateStr += `-${month.padStart(2, '0')}`;
      if (day && day.length > 0) {
        dateStr += `-${day.padStart(2, '0')}`;
      }
    }
    */
    const fileName = `truck_data_${dateStr}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle year input change
  const handleYearChange = (e) => {
    const newYear = e.target.value;
    if (/^\d*$/.test(newYear)) { // Only allow digits
      setYear(newYear);
    }
  };

  // Filter truck data based on search term, branch filter, and date filters
  const filteredTruckData = truckData.filter(truck => {
    // Search filter
    const matchesSearch = 
      searchTerm === "" ||
      truck.truck_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.driver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Branch filter
    const matchesBranch =
      branchFilter === "" ||
      truck.branch === branchFilter;
    
    // No client-side date filtering - let the API handle it
    
    return matchesSearch && matchesBranch;
  });

  // Extract unique branch names for filter dropdown
  const branches = [...new Set(truckData.map(truck => truck.branch))].sort();

  return (
    <Container maxWidth="xl" sx={{ marginTop: 4 }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Trucks Management
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <GradientCard>
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
          <StyledTextField
            variant="outlined"
            size="small"
            label="Search"
            placeholder="Search by truck #, driver, destination"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <StyledTextField
            select
            variant="outlined"
            size="small"
            label="Branch Filter"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Branches</MenuItem>
            {branches.map(branch => (
              <MenuItem key={branch} value={branch}>{branch}</MenuItem>
            ))}
          </StyledTextField>
          
          <TextField
            label="Year"
            size="small"
            value={year}
            onChange={handleYearChange}
            onBlur={() => {
              if (year.length === 4) {
                handleRefresh();
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
          
          <Tooltip title="Refresh data">
            <IconButton 
              onClick={handleRefresh}
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
                },
                mr: 1
              }}
            >
              {loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon sx={{ fontSize: '20px' }} />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download as CSV">
            <IconButton 
              onClick={handleDownloadCSV}
              disabled={loading || filteredTruckData.length === 0}
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
                '&:hover': {
                  bgcolor: 'success.dark'
                }
              }}
            >
              <FileDownloadIcon sx={{ fontSize: '20px' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </GradientCard>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : filteredTruckData.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <HeaderCell>Date</HeaderCell>
                <HeaderCell>Branch</HeaderCell>
                <HeaderCell>Truck Number</HeaderCell>
                <HeaderCell>Driver</HeaderCell>
                <HeaderCell>Destination</HeaderCell>
                <HeaderCell align="right">AGO</HeaderCell>
                <HeaderCell align="right">PMS</HeaderCell>
                <HeaderCell align="right">Total</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTruckData.map((truck) => (
                <TableRow key={truck.id} hover>
                  <TableCell>{truck.date}</TableCell>
                  <TableCell>{truck.branch}</TableCell>
                  <TableCell>{truck.truck_number}</TableCell>
                  <TableCell>{truck.driver}</TableCell>
                  <TableCell>{truck.destination}</TableCell>
                  <TableCell align="right">{truck.formattedAgo}</TableCell>
                  <TableCell align="right">{truck.formattedPms}</TableCell>
                  <TableCell align="right">{truck.totalFuel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            No truck data available
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default DashTrucks;
