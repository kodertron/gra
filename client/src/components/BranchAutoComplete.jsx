import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const BranchAutocomplete = ({ value, onChange }) => {
  const { setFormData } = useAuth();
  const branches = [
    "All Branches", "Asankragua", "Ayiem", "Assin Fosu", "Atta ne Atta", "Atebubu",
    "Bepong", "Bongo", "Camp 15", "Dadieso", "Damango",
    "Dormaa", "Dunkwa", "Feyiase", "Mamaso", "Medie",
    "Nkruma Nkwanta", "Obuasi", "Oseikrom", "Suma Ahenkro",
    "Tarkwa", "Tema", "Tepa", "Tinga", "Tumu", "Tutuka", "Wa"
  ];

  const [inputValue, setInputValue] = useState('');
  const [filteredBranches, setFilteredBranches] = useState(branches);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Filter branches based on input
    const filtered = branches.filter(branch =>
      branch.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredBranches(filtered);
    setShowDropdown(true);
  };

  const handleSelect = (branch) => {
    setInputValue(branch);
    setFilteredBranches(branches);
    onChange(branch);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <label htmlFor="branch" className="sr-only">Branch</label>
      <input
        id="branch"
        name="branch"
        required
        type="text"
        value={value} // Controlled by parent
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value); // Immediate updates
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-dark text-dark rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
        placeholder="Type to search branches..."
      />
      
      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {filteredBranches.length > 0 ? (
            filteredBranches.map((branch) => (
              <div
                key={branch}
                className="cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600"
                onClick={() => handleSelect(branch)}
              >
                {branch}
              </div>
            ))
          ) : (
            <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-dark">
              No branches found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BranchAutocomplete;