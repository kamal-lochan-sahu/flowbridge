import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { authService } from '../services/auth.service'
import { KEYS } from '../config/queryKeys'

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, setUser, logout: storeLogout } = useAuthStore()
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()

  // Get current user
  const { isLoading: userLoading } = useQuery({
    queryKey: KEYS.ME,
    queryFn:  async () => {
      const res = await authService.getMe()
      setUser(res.data.data.user)
      return res.data.data.user
    },
    enabled: isAuthenticated,
    retry:   false,
  })

  // Login
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (res) => {
      const { user, accessToken, refreshToken } = res.data.data
      setAuth(user, accessToken, refreshToken)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/')
    },
  })

  // Register
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (res) => {
      const { user, accessToken, refreshToken } = res.data.data
      setAuth(user, accessToken, refreshToken)
      toast.success('Account created successfully!')
      navigate('/')
    },
  })

  // Logout
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      storeLogout()
      queryClient.clear()
      navigate('/login')
      toast.success('Logged out')
    },
  })

  return {
    user, isAuthenticated, userLoading,
    login:    loginMutation.mutate,
    register: registerMutation.mutate,
    logout:   logoutMutation.mutate,
    isLoginLoading:    loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  }
}
