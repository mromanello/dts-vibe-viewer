/**
 * DTS Application State Context
 * Manages global state for DTS endpoint configuration and current selections
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import type {
  EntryPoint,
  EndpointTemplates,
  Collection,
  Resource,
  CitableUnit,
  DTSError,
  Navigation,
} from '@/types/dts';
import type { ValidationResult, ValidationMode } from '@/types/validation';
import type { DocumentResponse } from '@/services/dts/document';
import { buildNavigationHierarchy } from '@/services/dts/navigation';
import type { ToastMessage } from '@/components/common/ToastContainer';
import type { ToastType } from '@/components/common/Toast';

// ============================================================================
// State Interface
// ============================================================================

export interface DTSState {
  // Endpoint configuration
  entryPointURL: string | null;
  entryPoint: EntryPoint | null;
  endpoints: EndpointTemplates;

  // Current selections
  currentCollection: Collection | Resource | null;
  currentResource: Resource | null;
  currentCitation: CitableUnit | null;

  // Navigation state
  currentNavigation: Navigation | null;
  navigationHierarchy: Map<string, CitableUnit[]> | null;

  // Document state
  currentDocument: DocumentResponse | null;
  documentLoading: boolean;

  // Validation state
  validationResult: ValidationResult | null;
  validationMode: ValidationMode;

  // UI state
  sidebarOpen: boolean;
  validationReportOpen: boolean;
  toasts: ToastMessage[];

  // Loading & error states
  isLoading: boolean;
  error: DTSError | null;
}

export interface DTSActions {
  setEntryPoint: (url: string, entryPoint: EntryPoint) => void;
  setEndpoints: (endpoints: EndpointTemplates) => void;
  setCurrentCollection: (collection: Collection | Resource | null) => void;
  setCurrentResource: (resource: Resource | null) => void;
  setCurrentCitation: (citation: CitableUnit | null) => void;
  setCurrentNavigation: (navigation: Navigation | null) => void;
  setCurrentDocument: (document: DocumentResponse | null) => void;
  setDocumentLoading: (loading: boolean) => void;
  setValidationResult: (result: ValidationResult | null) => void;
  setValidationMode: (mode: ValidationMode) => void;
  toggleSidebar: () => void;
  toggleValidationReport: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: DTSError | null) => void;
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  resetState: () => void;
}

export interface DTSContextValue extends DTSState, DTSActions {}

// ============================================================================
// Context Creation
// ============================================================================

const DTSContext = createContext<DTSContextValue | undefined>(undefined);

// ============================================================================
// Initial State
// ============================================================================

const initialState: DTSState = {
  entryPointURL: null,
  entryPoint: null,
  endpoints: {
    entry: '',
    collection: null,
    navigation: null,
    document: null,
  },
  currentCollection: null,
  currentResource: null,
  currentCitation: null,
  currentNavigation: null,
  navigationHierarchy: null,
  currentDocument: null,
  documentLoading: false,
  validationResult: null,
  validationMode: 'permissive',
  sidebarOpen: true,
  validationReportOpen: false,
  toasts: [],
  isLoading: false,
  error: null,
};

// ============================================================================
// Provider Component
// ============================================================================

export function DTSProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DTSState>(initialState);

  // Actions
  const setEntryPoint = (url: string, entryPoint: EntryPoint) => {
    setState((prev) => ({
      ...prev,
      entryPointURL: url,
      entryPoint,
      error: null,
    }));
  };

  const setEndpoints = (endpoints: EndpointTemplates) => {
    setState((prev) => ({
      ...prev,
      endpoints,
    }));
  };

  const setCurrentCollection = (collection: Collection | Resource | null) => {
    setState((prev) => ({
      ...prev,
      currentCollection: collection,
    }));
  };

  const setCurrentResource = (resource: Resource | null) => {
    setState((prev) => ({
      ...prev,
      currentResource: resource,
    }));
  };

  const setCurrentCitation = (citation: CitableUnit | null) => {
    setState((prev) => ({
      ...prev,
      currentCitation: citation,
    }));
  };

  const setCurrentNavigation = (navigation: Navigation | null) => {
    setState((prev) => ({
      ...prev,
      currentNavigation: navigation,
      navigationHierarchy: navigation
        ? buildNavigationHierarchy(navigation.member)
        : null,
    }));
  };

  const setCurrentDocument = (document: DocumentResponse | null) => {
    setState((prev) => ({
      ...prev,
      currentDocument: document,
    }));
  };

  const setDocumentLoading = (loading: boolean) => {
    setState((prev) => ({
      ...prev,
      documentLoading: loading,
    }));
  };

  const toggleSidebar = () => {
    setState((prev) => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen,
    }));
  };

  const toggleValidationReport = () => {
    setState((prev) => ({
      ...prev,
      validationReportOpen: !prev.validationReportOpen,
    }));
  };

  const setLoading = (loading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading: loading,
    }));
  };

  const setError = (error: DTSError | null) => {
    setState((prev) => ({
      ...prev,
      error,
      isLoading: false,
    }));
  };

  const setValidationResult = (result: ValidationResult | null) => {
    setState((prev) => ({
      ...prev,
      validationResult: result,
    }));
  };

  const setValidationMode = (mode: ValidationMode) => {
    setState((prev) => ({
      ...prev,
      validationMode: mode,
    }));
  };

  const resetState = () => {
    setState(initialState);
  };

  const showToast = (
    type: ToastType,
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, type, title, message, duration };

    setState((prev) => ({
      ...prev,
      toasts: [...prev.toasts, newToast],
    }));
  };

  const removeToast = (id: string) => {
    setState((prev) => ({
      ...prev,
      toasts: prev.toasts.filter((toast) => toast.id !== id),
    }));
  };

  const value: DTSContextValue = {
    ...state,
    setEntryPoint,
    setEndpoints,
    setCurrentCollection,
    setCurrentResource,
    setCurrentCitation,
    setCurrentNavigation,
    setCurrentDocument,
    setDocumentLoading,
    setValidationResult,
    setValidationMode,
    toggleSidebar,
    toggleValidationReport,
    setLoading,
    setError,
    showToast,
    removeToast,
    resetState,
  };

  return <DTSContext.Provider value={value}>{children}</DTSContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useDTS(): DTSContextValue {
  const context = useContext(DTSContext);

  if (context === undefined) {
    throw new Error('useDTS must be used within a DTSProvider');
  }

  return context;
}
