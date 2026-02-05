/**
 * Mindbody Mock Adapter
 * 
 * Simulates Mindbody API responses for development/testing.
 * 
 * To swap to real Mindbody API:
 * 1. Replace mock data with actual API calls
 * 2. Implement OAuth/API key authentication
 * 3. Map real API response format to ExternalMember/ExternalVisit
 * 4. Keep this interface unchanged
 */

import type {
  GymSoftwareAdapter,
  ExternalMember,
  ExternalVisit,
  AdapterConfig,
} from './base-adapter';
import { generateMockMindbodyData } from './mock-data';

export class MindbodyAdapter implements GymSoftwareAdapter {
  private config: AdapterConfig;
  private mockData: {
    members: ExternalMember[];
    visits: ExternalVisit[];
  };

  constructor(config: AdapterConfig = {}) {
    this.config = config;
    // Generate mock data on initialization
    // In real implementation, this would be API calls
    this.mockData = generateMockMindbodyData();
  }

  getName(): string {
    return 'Mindbody';
  }

  async testConnection(): Promise<boolean> {
    // Mock: simulate API connection test
    // Real: Make actual API call to Mindbody to verify credentials
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate connection check
        const hasApiKey = !!this.config.apiKey;
        resolve(hasApiKey || process.env.NODE_ENV === 'development');
      }, 100);
    });
  }

  async fetchMembers(options?: {
    since?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExternalMember[]> {
    // Mock: Return generated mock data
    // Real: Make API call to Mindbody GET /clients endpoint
    
    let members = [...this.mockData.members];

    // Apply filters (simulating API behavior)
    if (options?.since) {
      const sinceDate = new Date(options.since);
      members = members.filter((m) => {
        const updatedAt = m.metadata?.updatedAt 
          ? new Date(m.metadata.updatedAt)
          : new Date(m.joinedDate);
        return updatedAt >= sinceDate;
      });
    }

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || members.length;
    members = members.slice(offset, offset + limit);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    return members;
  }

  async fetchMemberVisits(
    memberExternalId: string,
    options?: {
      since?: string;
      limit?: number;
    }
  ): Promise<ExternalVisit[]> {
    // Mock: Return visits for this member
    // Real: Make API call to Mindbody GET /visits?clientId={id}
    
    let visits = this.mockData.visits.filter(
      (v) => v.memberExternalId === memberExternalId
    );

    // Apply filters
    if (options?.since) {
      const sinceDate = new Date(options.since);
      visits = visits.filter((v) => new Date(v.visitDate) >= sinceDate);
    }

    if (options?.limit) {
      visits = visits.slice(0, options.limit);
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return visits;
  }

  async fetchAllVisits(options?: {
    since?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExternalVisit[]> {
    // Mock: Return all visits
    // Real: Make API call to Mindbody GET /visits endpoint
    
    let visits = [...this.mockData.visits];

    // Apply filters
    if (options?.since) {
      const sinceDate = new Date(options.since);
      visits = visits.filter((v) => new Date(v.visitDate) >= sinceDate);
    }

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || visits.length;
    visits = visits.slice(offset, offset + limit);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    return visits;
  }
}

/**
 * Factory function to create Mindbody adapter
 * 
 * Usage:
 * ```typescript
 * const adapter = createMindbodyAdapter({
 *   apiKey: 'your-api-key',
 *   apiSecret: 'your-api-secret',
 *   siteId: 'your-site-id'
 * });
 * ```
 */
export function createMindbodyAdapter(config?: AdapterConfig): MindbodyAdapter {
  return new MindbodyAdapter(config);
}
