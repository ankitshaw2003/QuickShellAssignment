import React from 'react';

/**
 * Search bar component with placeholder for search functionality
 * @param {string} searchTerm - Current search term
 * @param {function} onSearchChange - Callback when search term changes
 */
const SearchBar = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search by name, email, or phone..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
      />
      <span className="search-icon">🔍</span>
    </div>
  );
};

export default SearchBar;
