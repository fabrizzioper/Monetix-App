import type { LoginCredentials, User, ApiResponse } from "@/lib/types"
import usersData from "@/data/users.json"

export class AuthService {
  private static readonly TOKEN_KEY = "monetix_token"
  private static readonly USER_KEY = "monetix_user"

  static async login(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const user = usersData.users.find((u) => u.email === credentials.email && u.password === credentials.password)

    if (!user) {
      return {
        success: false,
        message: "Credenciales inválidas",
        data: null as any,
      }
    }

    const { password, ...userWithoutPassword } = user
    const token = this.generateToken()

    if (typeof window !== "undefined") {
      localStorage.setItem(this.TOKEN_KEY, token)
      localStorage.setItem(this.USER_KEY, JSON.stringify(userWithoutPassword))
    }

    return {
      success: true,
      data: userWithoutPassword,
      message: "Login exitoso",
    }
  }

  static logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.TOKEN_KEY)
      localStorage.removeItem(this.USER_KEY)
    }
  }

  static getStoredUser(): User | null {
    if (typeof window === "undefined") return null

    const userStr = localStorage.getItem(this.USER_KEY)
    const token = localStorage.getItem(this.TOKEN_KEY)

    if (!userStr || !token) return null

    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem(this.TOKEN_KEY)
  }

  private static generateToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
