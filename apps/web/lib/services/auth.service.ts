import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";

export interface RegisterData {
  email?: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginData {
  email?: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    roles: string[];
  };
  token: string;
}

class AuthService {
  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    logger.info("Auth registration attempt", {
      hasEmail: !!data.email,
      hasPhone: !!data.phone,
      hasFirstName: !!data.firstName,
      hasLastName: !!data.lastName,
    });

    if (!data.email && !data.phone) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation failed",
        detail: "Either email or phone is required",
      };
    }

    if (!data.password || data.password.length < 6) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation failed",
        detail: "Password must be at least 6 characters",
      };
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existingUser) {
      logger.warn("Auth registration: user already exists", { userId: existingUser.id });
      throw {
        status: 409,
        type: "https://api.shop.am/problems/conflict",
        title: "User already exists",
        detail: "User with this email or phone already exists",
      };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    let user;
    try {
      user = await db.user.create({
        data: {
          email: data.email || null,
          phone: data.phone || null,
          passwordHash,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          locale: "en",
          roles: ["customer"],
        },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          roles: true,
        },
      });
      logger.info("Auth: user created successfully");
    } catch (error: any) {
      console.error("❌ [AUTH] User creation failed:", error);
      if (error.code === "P2002") {
        // Prisma unique constraint error
        throw {
          status: 409,
          type: "https://api.shop.am/problems/conflict",
          title: "User already exists",
          detail: "User with this email or phone already exists",
        };
      }
      throw error;
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      logger.error("Auth: JWT_SECRET is not set");
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: "Server configuration error",
      };
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
    );
    logger.info("Auth: JWT token generated");

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
      },
      token,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    logger.info("Auth login attempt", { hasEmail: !!data.email, hasPhone: !!data.phone });

    if (!data.email && !data.phone) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation failed",
        detail: "Either email or phone is required",
      };
    }

    if (!data.password) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation failed",
        detail: "Password is required",
      };
    }

    const user = await db.user.findFirst({
      where: {
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        roles: true,
        blocked: true,
      },
    });

    if (!user || !user.passwordHash) {
      logger.warn("Auth login: user not found or no password set");
      throw {
        status: 401,
        type: "https://api.shop.am/problems/unauthorized",
        title: "Invalid credentials",
        detail: "Invalid email/phone or password",
      };
    }

    const isValidPassword = await bcrypt.compare(
      data.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      logger.warn("Auth login: invalid password");
      throw {
        status: 401,
        type: "https://api.shop.am/problems/unauthorized",
        title: "Invalid credentials",
        detail: "Invalid email/phone or password",
      };
    }

    if (user.blocked) {
      logger.warn("Auth login: account blocked", { userId: user.id });
      throw {
        status: 403,
        type: "https://api.shop.am/problems/forbidden",
        title: "Account blocked",
        detail: "Your account has been blocked",
      };
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw {
        status: 500,
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        detail: "Server configuration error",
      };
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
    );

    logger.info("Auth login successful", { userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
      },
      token,
    };
  }
}

export const authService = new AuthService();

