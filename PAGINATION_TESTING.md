# Price Movement Table Pagination Testing Guide

This guide outlines the testing procedures for the pagination functionality in the Price Movement Table component.

## Prerequisites

1. Ensure the backend server is running
2. Ensure the frontend development server is running
3. Navigate to a Bot Details page with sufficient price comparison data

## Test Cases

### Basic Pagination Functionality

1. **Page Navigation**
   - Verify "Previous" button is disabled on the first page
   - Click "Next" button to navigate to the second page
   - Verify the data changes and page indicator updates to "2"
   - Click "Previous" button to return to the first page
   - Verify the data changes back and page indicator updates to "1"
   - Navigate to the last page and verify "Next" button is disabled

2. **Rows Per Page**
   - Select "5 rows" from the dropdown
   - Verify that only 5 rows are displayed in the table
   - Check that the page indicator and total pages recalculate correctly
   - Repeat with 10, 25, and 50 rows options
   - Verify the "Showing X to Y of Z entries" text updates correctly with each change

### Data Loading and Refresh

1. **Data Loading**
   - Observe network requests during page navigation
   - Confirm API calls include correct page and limit parameters
   - Verify loading state appears during page transitions (if implemented)

2. **Auto-refresh Behavior**
   - Enable auto-refresh toggle
   - Wait for the auto-refresh interval to trigger (approx. 60 seconds)
   - Verify data refreshes while maintaining current page number
   - Navigate to a different page and wait for auto-refresh
   - Verify the current page data refreshes without changing page number

3. **Manual Refresh**
   - Click "Refresh" button on any page
   - Verify data reloads and maintains the same page number
   - Click "Quick Refresh" button
   - Verify data reloads without showing loading indicator

### Edge Cases and Error Handling

1. **Empty Results**
   - Apply a filter that results in no data
   - Verify appropriate "No data available" message is displayed
   - Verify pagination controls handle zero results gracefully

2. **Changing View Modes**
   - Navigate to page 2 in table view
   - Switch to chart or cards view mode
   - Switch back to table view
   - Verify the component maintains the page 2 state

3. **Applying Filters**
   - Apply a coin filter while on page 2
   - Verify page resets to 1 when filter is applied
   - Verify data is correctly filtered

## Expected Results

- Pagination controls should be visible only when in table view
- Page navigation should update the displayed data without full page reloads
- Rows per page changes should persist during the session
- Page number should reset to 1 when changing rows per page
- The displayed entry range and total count should be accurate
- All pagination controls should work correctly with keyboard and mouse navigation

## Reporting Issues

If you encounter any issues, please document:
1. The steps to reproduce the issue
2. The expected behavior
3. The actual behavior observed
4. Any error messages in the browser console
5. Screenshots if applicable
