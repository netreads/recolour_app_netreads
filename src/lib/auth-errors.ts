// Centralized authentication error handling

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthSessionError extends AuthError {
  constructor(message: string = 'Session not found') {
    super(message, 'SESSION_NOT_FOUND', 401);
    this.name = 'AuthSessionError';
  }
}

export class AuthUserError extends AuthError {
  constructor(message: string = 'User not found') {
    super(message, 'USER_NOT_FOUND', 401);
    this.name = 'AuthUserError';
  }
}

export class AuthSyncError extends AuthError {
  constructor(message: string = 'Failed to sync user') {
    super(message, 'SYNC_FAILED', 500);
    this.name = 'AuthSyncError';
  }
}

// Error handling utilities
export function isAuthSessionMissingError(error: any): boolean {
  return (
    error?.message === 'Auth session missing!' ||
    error?.name === 'AuthSessionMissingError' ||
    error?.code === 'SESSION_NOT_FOUND'
  );
}

export function handleAuthError(error: any, context: string): AuthError {
  if (isAuthSessionMissingError(error)) {
    return new AuthSessionError();
  }

  if (error instanceof AuthError) {
    return error;
  }

  // Log unexpected errors in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`Auth error in ${context}:`, error);
  }

  return new AuthError(
    `Authentication error in ${context}`,
    'UNKNOWN_ERROR',
    500
  );
}

// Safe error logging (removes sensitive data)
export function logAuthError(error: any, context: string): void {
  // Only log in development or for non-sensitive errors
  if (process.env.NODE_ENV === 'development') {
    const safeError = {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      context,
      timestamp: new Date().toISOString()
    };

    console.error('Auth error:', safeError);
  } else {
    // In production, only log error codes and context
    console.error('Auth error:', {
      code: error?.code || 'UNKNOWN',
      context,
      timestamp: new Date().toISOString()
    });
  }
}
