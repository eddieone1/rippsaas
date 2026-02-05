/**
 * Mock Data Generator for Gym Software Integrations
 * 
 * Generates realistic mock data for Mindbody and Glofox adapters.
 * This simulates what real APIs would return.
 */

import type { ExternalMember, ExternalVisit } from './base-adapter';
import { subDays, formatISO } from 'date-fns';

/**
 * Generate mock Mindbody member data
 * 
 * Mindbody typically includes:
 * - Client ID (numeric)
 * - First/Last name
 * - Email/Phone
 - - Status (Active, Inactive, etc.)
 * - Join date
 * - Last visit date
 */
export function generateMockMindbodyData(): {
  members: ExternalMember[];
  visits: ExternalVisit[];
} {
  const now = new Date();
  const members: ExternalMember[] = [];
  const visits: ExternalVisit[] = [];

  // Generate 20 mock members with varying activity levels
  const firstNames = [
    'James', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia',
    'Robert', 'Sophia', 'William', 'Isabella', 'Richard', 'Charlotte',
    'Joseph', 'Amelia', 'Thomas', 'Mia', 'Charles', 'Harper', 'Daniel', 'Evelyn'
  ];
  
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia',
    'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'
  ];

  for (let i = 0; i < 20; i++) {
    const memberId = `MB-${1000 + i}`;
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    
    // Vary join dates (some old, some new)
    const daysSinceJoined = Math.floor(Math.random() * 365) + 30; // 30-395 days ago
    const joinedDate = formatISO(subDays(now, daysSinceJoined), { representation: 'date' });
    
    // Vary activity levels
    const activityLevel = Math.random();
    let lastVisitDate: string | null = null;
    let status: 'active' | 'inactive' | 'cancelled' | 'suspended' = 'active';
    
    if (activityLevel > 0.2) {
      // 80% have recent visits
      const daysSinceVisit = Math.floor(Math.random() * 30); // 0-29 days ago
      lastVisitDate = formatISO(subDays(now, daysSinceVisit), { representation: 'date' });
      
      if (daysSinceVisit > 21) {
        status = 'inactive';
      }
    } else if (activityLevel > 0.1) {
      // 10% have old visits
      const daysSinceVisit = Math.floor(Math.random() * 60) + 30; // 30-89 days ago
      lastVisitDate = formatISO(subDays(now, daysSinceVisit), { representation: 'date' });
      status = 'inactive';
    } else {
      // 10% never visited or cancelled
      status = Math.random() > 0.5 ? 'cancelled' : 'inactive';
    }

    members.push({
      externalId: memberId,
      firstName,
      lastName,
      email,
      phone: `+44${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      joinedDate,
      lastVisitDate,
      status,
      metadata: {
        source: 'mindbody',
        clientId: 1000 + i,
        updatedAt: formatISO(now),
      },
    });

    // Generate visit history for active members
    if (lastVisitDate && status === 'active') {
      const visitCount = Math.floor(Math.random() * 20) + 5; // 5-24 visits
      for (let j = 0; j < visitCount; j++) {
        const daysAgo = Math.floor(Math.random() * daysSinceJoined);
        const visitDate = formatISO(subDays(now, daysAgo), { representation: 'date' });
        
        visits.push({
          externalId: `MB-VISIT-${memberId}-${j}`,
          memberExternalId: memberId,
          visitDate,
          visitType: Math.random() > 0.7 ? 'class' : 'visit',
          metadata: {
            source: 'mindbody',
            locationId: 'LOC-001',
          },
        });
      }
    }
  }

  // Sort visits by date (most recent first)
  visits.sort((a, b) => 
    new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  );

  return { members, visits };
}

/**
 * Generate mock Glofox member data
 * 
 * Glofox typically includes:
 * - Member ID (UUID format)
 * - First/Last name
 * - Email/Phone
 * - Status (Active, Inactive, etc.)
 * - Join date
 * - Last check-in date
 */
export function generateMockGlofoxData(): {
  members: ExternalMember[];
  visits: ExternalVisit[];
} {
  const now = new Date();
  const members: ExternalMember[] = [];
  const visits: ExternalVisit[] = [];

  // Generate 20 mock members with varying activity levels
  const firstNames = [
    'Alex', 'Jessica', 'Chris', 'Lauren', 'Matt', 'Rachel',
    'Ryan', 'Nicole', 'Kevin', 'Amanda', 'Brian', 'Michelle',
    'Jason', 'Stephanie', 'Eric', 'Jennifer', 'Mark', 'Lisa',
    'Paul', 'Ashley'
  ];
  
  const lastNames = [
    'Taylor', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia',
    'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee',
    'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Lopez', 'Hill'
  ];

  for (let i = 0; i < 20; i++) {
    // Glofox uses UUID format for member IDs
    const memberId = `GF-${generateUUID()}`;
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    
    // Vary join dates
    const daysSinceJoined = Math.floor(Math.random() * 365) + 30;
    const joinedDate = formatISO(subDays(now, daysSinceJoined), { representation: 'date' });
    
    // Vary activity levels
    const activityLevel = Math.random();
    let lastVisitDate: string | null = null;
    let status: 'active' | 'inactive' | 'cancelled' | 'suspended' = 'active';
    
    if (activityLevel > 0.25) {
      // 75% have recent check-ins
      const daysSinceCheckIn = Math.floor(Math.random() * 28); // 0-27 days ago
      lastVisitDate = formatISO(subDays(now, daysSinceCheckIn), { representation: 'date' });
      
      if (daysSinceCheckIn > 14) {
        status = 'inactive';
      }
    } else if (activityLevel > 0.1) {
      // 15% have old check-ins
      const daysSinceCheckIn = Math.floor(Math.random() * 60) + 28; // 28-87 days ago
      lastVisitDate = formatISO(subDays(now, daysSinceCheckIn), { representation: 'date' });
      status = 'inactive';
    } else {
      // 10% never checked in or cancelled
      status = Math.random() > 0.5 ? 'cancelled' : 'inactive';
    }

    members.push({
      externalId: memberId,
      firstName,
      lastName,
      email,
      phone: `+44${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      joinedDate,
      lastVisitDate,
      status,
      metadata: {
        source: 'glofox',
        memberUuid: memberId,
        updatedAt: formatISO(now),
      },
    });

    // Generate check-in history for active members
    if (lastVisitDate && status === 'active') {
      const checkInCount = Math.floor(Math.random() * 25) + 3; // 3-27 check-ins
      for (let j = 0; j < checkInCount; j++) {
        const daysAgo = Math.floor(Math.random() * daysSinceJoined);
        const checkInDate = formatISO(subDays(now, daysAgo), { representation: 'date' });
        
        visits.push({
          externalId: `GF-CHECKIN-${memberId}-${j}`,
          memberExternalId: memberId,
          visitDate: checkInDate,
          visitType: 'check_in',
          metadata: {
            source: 'glofox',
            studioId: 'STUDIO-001',
          },
        });
      }
    }
  }

  // Sort visits by date (most recent first)
  visits.sort((a, b) => 
    new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  );

  return { members, visits };
}

/**
 * Generate a simple UUID-like string for mock data
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
