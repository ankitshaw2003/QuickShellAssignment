import React, { useState } from 'react';

/**
 * Dummy filter dropdown component (non-functional as per requirements)
 * Displays filter options but doesn't apply any filtering logic
 */
const FilterDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="filter-dropdown">
      <button className="filter-button" onClick={toggleDropdown}>
        Filters ▼
      </button>
      {isOpen && (
        <div className="filter-menu">
          <div className="filter-section">
            <h4>Score Range</h4>
            <label>
              <input type="checkbox" /> 0-25
            </label>
            <label>
              <input type="checkbox" /> 26-50
            </label>
            <label>
              <input type="checkbox" /> 51-75
            </label>
            <label>
              <input type="checkbox" /> 76-100
            </label>
          </div>
          <div className="filter-section">
            <h4>Date Added</h4>
            <label>
              <input type="checkbox" /> Last 7 days
            </label>
            <label>
              <input type="checkbox" /> Last 30 days
            </label>
            <label>
              <input type="checkbox" /> Last 3 months
            </label>
            <label>
              <input type="checkbox" /> Last year
            </label>
          </div>
          <div className="filter-actions">
            <button className="filter-clear">Clear All</button>
            <button className="filter-apply">Apply Filters</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
