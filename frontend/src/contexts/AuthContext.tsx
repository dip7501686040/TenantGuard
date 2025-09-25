import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react"
import axios from "axios"

// Types
interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  tenantId: string
  mfaEnabled: boolean
}

interface Tenant {
  id: string
  slug: string
  name: string
  status: string
}

interface AuthState {
  user: User | null
  tenant: Tenant | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, tenantSlug: string, mfaCode?: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  clearError: () => void
  refreshAccessToken: () => Promise<boolean>
  setupMfa: () => Promise<MfaSetupResponse>
  verifyMfa: (code: string) => Promise<void>
  disableMfa: () => Promise<void>
}

interface MfaSetupResponse {
  qrCode: string
  secret: string
  backupCodes: string[]
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  tenantSlug: string
}

// Action types
type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: "LOGIN_ERROR"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_TENANT"; payload: Tenant }

// Initial state
const initialState: AuthState = {
  user: null,
  tenant: null,
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  isLoading: false,
  error: null
}

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, isLoading: true, error: null }
    case "LOGIN_SUCCESS":
      return {
        ...state,
        isLoading: false,
        error: null,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken
      }
    case "LOGIN_ERROR":
      return { ...state, isLoading: false, error: action.payload }
    case "LOGOUT":
      return { ...initialState, accessToken: null, refreshToken: null }
    case "CLEAR_ERROR":
      return { ...state, error: null }
    case "SET_TENANT":
      return { ...state, tenant: action.payload }
    default:
      return state
  }
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null)

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001"

// Configure axios
axios.defaults.baseURL = API_BASE_URL

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Refresh access token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    if (!state.refreshToken) return false

    try {
      const response = await axios.post("/auth/refresh", {
        refreshToken: state.refreshToken
      })

      const { user, accessToken, refreshToken } = response.data

      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      localStorage.setItem("user", JSON.stringify(user))

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, accessToken, refreshToken }
      })

      return true
    } catch (error) {
      return false
    }
  }, [state.refreshToken])

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
    dispatch({ type: "LOGOUT" })
  }, [])

  // Set up axios interceptors
  useEffect(() => {
    // Request interceptor to add auth token
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (state.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`
        }
        if (state.tenant) {
          config.headers["x-tenant-slug"] = state.tenant.slug
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle token refresh
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const success = await refreshAccessToken()
            if (success) {
              return axios(originalRequest)
            } else {
              logout()
            }
          } catch (refreshError) {
            logout()
          }
        }

        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.request.eject(requestInterceptor)
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [state.accessToken, state.tenant, refreshAccessToken, logout])

  // Login function
  const login = async (email: string, password: string, tenantSlug: string, mfaCode?: string) => {
    dispatch({ type: "LOGIN_START" })

    try {
      const response = await axios.post("/auth/login", {
        email,
        password,
        tenantSlug,
        mfaCode
      })

      const { user, accessToken, refreshToken } = response.data

      // Store tokens in localStorage
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      localStorage.setItem("user", JSON.stringify(user))

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, accessToken, refreshToken }
      })
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Login failed"
      dispatch({ type: "LOGIN_ERROR", payload: errorMessage })
      throw error
    }
  }

  // Register function
  const register = async (data: RegisterData) => {
    dispatch({ type: "LOGIN_START" })

    try {
      const response = await axios.post("/auth/register", data)
      const { user, accessToken, refreshToken } = response.data

      // Store tokens in localStorage
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      localStorage.setItem("user", JSON.stringify(user))

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, accessToken, refreshToken }
      })
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Registration failed"
      dispatch({ type: "LOGIN_ERROR", payload: errorMessage })
      throw error
    }
  }

  // Clear error function
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" })
  }

  // MFA Setup function
  const setupMfa = async (): Promise<MfaSetupResponse> => {
    try {
      const response = await axios.post("/auth/mfa/setup")
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "MFA setup failed"
      dispatch({ type: "LOGIN_ERROR", payload: errorMessage })
      throw error
    }
  }

  // MFA Verify function
  const verifyMfa = async (code: string): Promise<void> => {
    try {
      await axios.post("/auth/mfa/verify", { code })

      // Update user's MFA status
      if (state.user) {
        const updatedUser = { ...state.user, mfaEnabled: true }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            user: updatedUser,
            accessToken: state.accessToken || "",
            refreshToken: state.refreshToken || ""
          }
        })
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "MFA verification failed"
      dispatch({ type: "LOGIN_ERROR", payload: errorMessage })
      throw error
    }
  }

  // MFA Disable function
  const disableMfa = async (): Promise<void> => {
    try {
      await axios.post("/auth/mfa/disable")

      // Update user's MFA status
      if (state.user) {
        const updatedUser = { ...state.user, mfaEnabled: false }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            user: updatedUser,
            accessToken: state.accessToken || "",
            refreshToken: state.refreshToken || ""
          }
        })
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "MFA disable failed"
      dispatch({ type: "LOGIN_ERROR", payload: errorMessage })
      throw error
    }
  }

  // Initialize user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser && state.accessToken) {
      try {
        const user = JSON.parse(storedUser)
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            user,
            accessToken: state.accessToken,
            refreshToken: state.refreshToken || ""
          }
        })
      } catch (error) {
        console.error("Failed to parse stored user:", error)
        logout()
      }
    }
  }, [logout])

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshAccessToken,
    setupMfa,
    verifyMfa,
    disableMfa
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
