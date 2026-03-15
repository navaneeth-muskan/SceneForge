"use client";

import { useCallback, useEffect, useState } from "react";
import {
  compileCode as compile,
  type CompilationResult,
} from "../remotion/compiler";

export interface AnimationState {
  code: string;
  Component: React.ComponentType | null;
  error: string | null;
  isCompiling: boolean;
}

export function useAnimationState(initialCode: string = "") {
  const [state, setState] = useState<AnimationState>({
    code: initialCode,
    Component: null,
    error: null,
    isCompiling: false,
  });

  // Compile code when it changes (with debouncing handled by caller)
  const compileCode = useCallback((code: string) => {
    // If we're already compiling this exact code, or if it's already the active component, skip
    // We don't have access to current state here easily without adding it to deps, 
    // but we can use the functional update pattern or just let the compiler decide.
    
    // Better: Perform the sync compilation and only update state if the result differs.
    // since compile() is synchronous, we don't necessarily NEED the loading state 
    // for every tiny update, especially if it's cached.
    
    const result: CompilationResult = compile(code);

    setState((prev) => {
      if (
        prev.Component === result.Component && 
        prev.error === result.error && 
        prev.code === code && 
        prev.isCompiling === false
      ) {
        return prev;
      }
      return {
        ...prev,
        code,
        Component: result.Component,
        error: result.error,
        isCompiling: false,
      };
    });
  }, []);

  // Update code and trigger compilation
  const setCode = useCallback((newCode: string) => {
    setState((prev) => (prev.code === newCode ? prev : { ...prev, code: newCode }));
  }, []);

  // Auto-compile when component mounts with initial code
  useEffect(() => {
    if (initialCode) {
      compileCode(initialCode);
    }
  }, []);

  return {
    ...state,
    setCode,
    compileCode,
  };
}
