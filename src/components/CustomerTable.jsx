import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CustomerTable.css';

/**
 * RESPONSIVE HIGH-PERFORMANCE CUSTOMER TABLE
 * 
 * Features:
 * - Virtual scrolling for 1M+ records
 * - Fully responsive (desktop, tablet, mobile)
 * - Touch-optimized for mobile devices
 * - Adaptive layout based on screen size
 * - Performance optimized with GPU acceleration
 */
const CustomerTable = ({ data, searchTerm, onSortChange, sortConfig }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [scrollTop, setScrollTop] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const containerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  
  const ROW_HEIGHT = isMobile ? 120 : isTablet ? 80 : 60; // Adaptive row height
  const VIEWPORT_BUFFER = 20;

  /**
   * RESPONSIVE BREAKPOINT DETECTION
   * Detects device type and updates layout accordingly
   */
  useEffect(() => {
    const checkResponsive = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkResponsive();
    window.addEventListener('resize', checkResponsive);
    
    return () => window.removeEventListener('resize', checkResponsive);
  }, []);
  
  /**
   * Format date to readable string
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  /**
   * Optimized scroll handler with throttling
   */
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const viewportHeight = containerRef.current.clientHeight;

    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - VIEWPORT_BUFFER);
    const endIndex = Math.min(
      data.length,
      Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + VIEWPORT_BUFFER
    );

    if (Math.abs(startIndex - visibleRange.start) > 5 || Math.abs(endIndex - visibleRange.end) > 5) {
      setVisibleRange({ start: startIndex, end: endIndex });
    }
    
    setScrollTop(scrollTop);
    isScrollingRef.current = true;
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  }, [data.length, visibleRange.start, visibleRange.end, ROW_HEIGHT]);

  /**
   * Set up scroll listener
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  /**
   * Reset scroll on search
   */
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setVisibleRange({ start: 0, end: 50 });
    }
  }, [searchTerm]);

  /**
   * Handle column sorting
   */
  const handleSort = (column) => {
    const direction = (sortConfig.column === column && sortConfig.direction === 'asc') 
      ? 'desc' 
      : 'asc';
    
    onSortChange({ column, direction });
  };

  /**
   * Render sort indicator
   */
  const renderSortIndicator = (column) => {
    if (sortConfig.column !== column) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  const totalHeight = data.length * ROW_HEIGHT;
  const visibleData = data.slice(visibleRange.start, visibleRange.end);
  const offsetY = visibleRange.start * ROW_HEIGHT;

  /**
   * MOBILE CARD VIEW
   * Stack information vertically for better mobile UX
   */
  if (isMobile) {
    return (
      <div className="table-wrapper mobile">
        {/* Mobile sort controls */}
        <div className="mobile-sort-controls">
          <select 
            className="mobile-sort-select"
            value={`${sortConfig.column}-${sortConfig.direction}`}
            onChange={(e) => {
              const [column, direction] = e.target.value.split('-');
              onSortChange({ column, direction });
            }}
          >
            <option value="id-asc">ID (Ascending)</option>
            <option value="id-desc">ID (Descending)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="score-asc">Score (Low to High)</option>
            <option value="score-desc">Score (High to Low)</option>
            <option value="email-asc">Email (A-Z)</option>
            <option value="email-desc">Email (Z-A)</option>
            <option value="lastMessageAt-asc">Last Message (Oldest)</option>
            <option value="lastMessageAt-desc">Last Message (Newest)</option>
          </select>
        </div>

        {/* Scrollable card list */}
        <div className="mobile-card-container" ref={containerRef}>
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            <div style={{ position: 'absolute', top: `${offsetY}px`, width: '100%' }}>
              {visibleData.map((customer) => (
                <div key={customer.id} className="mobile-card">
                  <div className="mobile-card-header">
                    <div 
                      className="avatar" 
                      style={{ backgroundColor: customer.avatar.color }}
                    >
                      {customer.avatar.initials}
                    </div>
                    <div className="mobile-card-title">
                      <h3>{customer.name}</h3>
                      <span className="mobile-id">ID: {customer.id}</span>
                    </div>
                    <span className={`score-badge score-${Math.floor(customer.score / 25)}`}>
                      {customer.score}
                    </span>
                  </div>
                  
                  <div className="mobile-card-body">
                    <div className="mobile-info-row">
                      <span className="mobile-label">📧 Email:</span>
                      <span className="mobile-value">{customer.email}</span>
                    </div>
                    <div className="mobile-info-row">
                      <span className="mobile-label">📞 Phone:</span>
                      <span className="mobile-value">{customer.phone}</span>
                    </div>
                    <div className="mobile-info-row">
                      <span className="mobile-label">💬 Last Message:</span>
                      <span className="mobile-value">{formatDate(customer.lastMessageAt)}</span>
                    </div>
                    <div className="mobile-info-row">
                      <span className="mobile-label">👤 Added By:</span>
                      <span className="mobile-value">{customer.addedBy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * TABLET VIEW
   * Show essential columns only, hide less important ones
   */
  if (isTablet) {
    return (
      <div className="table-wrapper tablet">
        <div className="table-header-container">
          <table className="customer-table header-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} className="sortable">
                  ID{renderSortIndicator('id')}
                </th>
                <th onClick={() => handleSort('name')} className="sortable">
                  Name{renderSortIndicator('name')}
                </th>
                <th onClick={() => handleSort('email')} className="sortable">
                  Email{renderSortIndicator('email')}
                </th>
                <th onClick={() => handleSort('score')} className="sortable">
                  Score{renderSortIndicator('score')}
                </th>
                <th onClick={() => handleSort('lastMessageAt')} className="sortable">
                  Last Message{renderSortIndicator('lastMessageAt')}
                </th>
              </tr>
            </thead>
          </table>
        </div>

        <div className="table-body-container" ref={containerRef}>
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            <table 
              className="customer-table body-table" 
              style={{ position: 'absolute', top: `${offsetY}px`, width: '100%' }}
            >
              <tbody>
                {visibleData.map((customer) => (
                  <tr key={customer.id} className="table-row">
                    <td>{customer.id}</td>
                    <td>
                      <div className="name-cell">
                        <div 
                          className="avatar" 
                          style={{ backgroundColor: customer.avatar.color }}
                        >
                          {customer.avatar.initials}
                        </div>
                        <span>{customer.name}</span>
                      </div>
                    </td>
                    <td className="email-cell">{customer.email}</td>
                    <td>
                      <span className={`score-badge score-${Math.floor(customer.score / 25)}`}>
                        {customer.score}
                      </span>
                    </td>
                    <td>{formatDate(customer.lastMessageAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /**
   * DESKTOP VIEW (DEFAULT)
   * Full table with all columns
   */
  return (
    <div className="table-wrapper desktop">
      <div className="table-header-container">
        <table className="customer-table header-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} className="sortable" style={{ width: '80px' }}>
                ID{renderSortIndicator('id')}
              </th>
              <th onClick={() => handleSort('name')} className="sortable" style={{ width: '200px' }}>
                Name{renderSortIndicator('name')}
              </th>
              <th onClick={() => handleSort('phone')} className="sortable" style={{ width: '180px' }}>
                Phone{renderSortIndicator('phone')}
              </th>
              <th onClick={() => handleSort('email')} className="sortable" style={{ width: '250px' }}>
                Email{renderSortIndicator('email')}
              </th>
              <th onClick={() => handleSort('score')} className="sortable" style={{ width: '100px' }}>
                Score{renderSortIndicator('score')}
              </th>
              <th onClick={() => handleSort('lastMessageAt')} className="sortable" style={{ width: '150px' }}>
                Last Message{renderSortIndicator('lastMessageAt')}
              </th>
              <th onClick={() => handleSort('addedBy')} className="sortable" style={{ width: '180px' }}>
                Added By{renderSortIndicator('addedBy')}
              </th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="table-body-container" ref={containerRef}>
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          <table 
            className="customer-table body-table" 
            style={{ position: 'absolute', top: `${offsetY}px`, width: '100%' }}
          >
            <tbody>
              {visibleData.map((customer) => (
                <tr key={customer.id} className="table-row">
                  <td style={{ width: '80px' }}>{customer.id}</td>
                  <td style={{ width: '200px' }}>
                    <div className="name-cell">
                      <div 
                        className="avatar" 
                        style={{ backgroundColor: customer.avatar.color }}
                      >
                        {customer.avatar.initials}
                      </div>
                      <span>{customer.name}</span>
                    </div>
                  </td>
                  <td style={{ width: '180px' }}>{customer.phone}</td>
                  <td className="email-cell" style={{ width: '250px' }}>{customer.email}</td>
                  <td style={{ width: '100px' }}>
                    <span className={`score-badge score-${Math.floor(customer.score / 25)}`}>
                      {customer.score}
                    </span>
                  </td>
                  <td style={{ width: '150px' }}>{formatDate(customer.lastMessageAt)}</td>
                  <td style={{ width: '180px' }}>{customer.addedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerTable;