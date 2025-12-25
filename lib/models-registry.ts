/**
 * Model Registry
 * 
 * Ensures all Mongoose models are registered in the correct order
 * This is important for Next.js hot reloading and populate operations
 */

import mongoose from 'mongoose';

// Import models in dependency order:
// 1. Permission (no dependencies)
// 2. Role (depends on Permission)
// 3. User (depends on Role and Permission)
// 4. Category (no dependencies)
// 5. Post (depends on Category and User)

export function ensureModelsRegistered() {
  // Import Permission first
  if (!mongoose.models.Permission) {
    require('@/models/Permission');
  }

  // Then Role (which references Permission)
  if (!mongoose.models.Role) {
    require('@/models/Role');
  }

  // Then User (which references Role and Permission)
  if (!mongoose.models.User) {
    require('@/models/User');
  }

  // Category (no dependencies)
  if (!mongoose.models.Category) {
    require('@/models/Category');
  }

  // Post (depends on Category and User)
  if (!mongoose.models.Post) {
    require('@/models/Post');
  }
}

