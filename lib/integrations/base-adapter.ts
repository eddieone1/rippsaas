/**
 * Base Adapter Interface for Gym Software Integrations
 * 
 * This interface defines the contract that all gym software adapters must implement.
 * This allows us to swap between mock and real implementations seamlessly.
 * 
 * Pattern: Adapter Pattern
 * - Each gym software (Mindbody, Glofox, etc.) has its own adapter
 * - All adapters implement the same interface
 * - Sync service uses adapters without knowing which implementation
 * - Easy to swap mock → real API by changing adapter instance
 */

/**
 * External member data structure (from gym software)
 * This represents the raw data format from external systems
 */
export interface ExternalMember {
  /** External system's member ID */
  externalId: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Email address */
  email?: string | null;
  /** Phone number */
  phone?: string | null;
  /** Date member joined (ISO string) */
  joinedDate: string;
  /** Most recent visit date (ISO string) */
  lastVisitDate?: string | null;
  /** Member status in external system */
  status: 'active' | 'inactive' | 'cancelled' | 'suspended';
  /** Additional metadata (platform-specific) */
  metadata?: Record<string, any>;
}

/**
 * External visit/check-in data structure
 */
export interface ExternalVisit {
  /** External system's visit ID */
  externalId: string;
  /** Member's external ID */
  memberExternalId: string;
  /** Visit date (ISO string) */
  visitDate: string;
  /** Visit type */
  visitType: 'visit' | 'check_in' | 'class' | 'appointment';
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Sync result for a single member
 */
export interface MemberSyncResult {
  /** External member ID */
  externalId: string;
  /** Whether member was created (new) or updated (existing) */
  action: 'created' | 'updated' | 'skipped';
  /** Internal member ID (if created/updated) */
  memberId?: string;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Sync summary
 */
export interface SyncSummary {
  /** Total members processed */
  total: number;
  /** Successfully created */
  created: number;
  /** Successfully updated */
  updated: number;
  /** Skipped (no changes) */
  skipped: number;
  /** Failed */
  failed: number;
  /** Errors */
  errors: Array<{ externalId: string; error: string }>;
}

/**
 * Adapter configuration
 */
export interface AdapterConfig {
  /** API key or credentials */
  apiKey?: string;
  /** API secret */
  apiSecret?: string;
  /** Base URL for API */
  baseUrl?: string;
  /** Additional platform-specific config */
  [key: string]: any;
}

/**
 * Base adapter interface that all gym software adapters must implement
 */
export interface GymSoftwareAdapter {
  /**
   * Get adapter name (for logging/debugging)
   */
  getName(): string;

  /**
   * Test connection to external system
   * Returns true if connection successful
   */
  testConnection(): Promise<boolean>;

  /**
   * Fetch all members from external system
   * This is a read-only operation
   * 
   * @param options Optional filters/pagination
   * @returns Array of external members
   */
  fetchMembers(options?: {
    since?: string; // ISO date - only fetch members updated since this date
    limit?: number;
    offset?: number;
  }): Promise<ExternalMember[]>;

  /**
   * Fetch visits/check-ins for a specific member
   * 
   * @param memberExternalId External member ID
   * @param options Optional filters
   * @returns Array of visits
   */
  fetchMemberVisits(
    memberExternalId: string,
    options?: {
      since?: string; // ISO date - only fetch visits since this date
      limit?: number;
    }
  ): Promise<ExternalVisit[]>;

  /**
   * Fetch all visits/check-ins (for all members)
   * Useful for bulk sync
   * 
   * @param options Optional filters
   * @returns Array of visits
   */
  fetchAllVisits(options?: {
    since?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExternalVisit[]>;
}
