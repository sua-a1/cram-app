const mockToast = jest.fn();

// Export the mock function for direct usage
export const toast = mockToast;

// Export the hook that returns the same mock function
export const useToast = () => ({ toast: mockToast });

// Export mockToast for test assertions
export { mockToast }; 
