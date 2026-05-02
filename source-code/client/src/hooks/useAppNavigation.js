import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { useCallback } from "react";
import { sectionConfig } from "../features/navigation/sectionCatalog";
import { buildPortPath, buildSectionPath, PAGE_PATHS, resolveSectionActionPath } from "../router";

// ============================================================================
// useAppNavigation Hook
// ============================================================================
// Provides a unified navigation API that replaces the old navStack pattern.
// All components can use this hook instead of receiving onBack/onHome props.
// ============================================================================

export function useAppNavigation() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const goBack = useCallback(() => {
    // Use browser history if available, otherwise go home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const goHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const goToSection = useCallback((sectionId) => {
    navigate(buildSectionPath(sectionId));
  }, [navigate]);

  const goToPort = useCallback((portId, view, formType, queryParams = {}) => {
    let path = buildPortPath(portId, view, formType);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    }
    const queryString = params.toString();
    if (queryString) path += `?${queryString}`;
    navigate(path);
  }, [navigate]);

  const goToPage = useCallback((pageKey) => {
    const path = PAGE_PATHS[pageKey];
    if (path) {
      navigate(path);
    }
  }, [navigate]);

  const handleSectionAction = useCallback((sectionId, action) => {
    const path = resolveSectionActionPath(sectionId, action, sectionConfig);
    if (path) {
      navigate(path);
    }
  }, [navigate]);

  return {
    navigate,
    goBack,
    goHome,
    goToSection,
    goToPort,
    goToPage,
    handleSectionAction,
    // Current route info
    params,
    searchParams,
    location,
    // Helper to get port context from URL
    portContext: {
      portId: params.portId,
      view: params.view,
      formType: params.formType ? Number(params.formType) : undefined,
      accountType: searchParams.get("accountType") || undefined,
      portName: searchParams.get("name") ? decodeURIComponent(searchParams.get("name")) : undefined,
    },
  };
}
